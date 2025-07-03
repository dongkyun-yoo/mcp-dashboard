const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const CLAUDE_CONFIG_PATH = process.env.CLAUDE_CONFIG_PATH || path.join(process.env.HOME || process.env.USERPROFILE, '.claude.json');
const activeServers = new Map();

const MCP_SERVER_TEMPLATES = {
  'filesystem': {
    command: 'npx @modelcontextprotocol/server-filesystem',
    args: ['/mnt/e'],
    env: {}
  },
  'github': {
    command: 'npx @modelcontextprotocol/server-github',
    args: [],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN }
  },
  'puppeteer': {
    command: 'npx @modelcontextprotocol/server-puppeteer',
    args: [],
    env: {}
  },
  'npm-search': {
    command: 'npx npm-search-mcp-server',
    args: [],
    env: {}
  },
  'perplexity': {
    command: 'npx @modelcontextprotocol/server-perplexity',
    args: [],
    env: { PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY }
  },
  'memory': {
    command: 'npx @modelcontextprotocol/server-memory',
    args: [],
    env: {}
  },
  'searxng': {
    command: 'npx @modelcontextprotocol/server-searxng',
    args: [],
    env: { SEARXNG_BASE_URL: process.env.SEARXNG_BASE_URL }
  },
  'naver-search': {
    command: 'npx naver-search-mcp',
    args: [],
    env: {
      NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID,
      NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET
    }
  },
  'exa': {
    command: 'npx @modelcontextprotocol/server-exa',
    args: [],
    env: { EXA_API_KEY: process.env.EXA_API_KEY }
  },
  'playwright': {
    command: 'npx playwright-mcp',
    args: [],
    env: {}
  },
  'desktop-commander': {
    command: 'npx desktop-commander-mcp',
    args: [],
    env: {}
  },
  'code-mcp': {
    command: 'npx code-mcp',
    args: [],
    env: {}
  },
  'supabase': {
    command: 'npx supabase-mcp',
    args: [],
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    }
  },
  'n8n': {
    command: 'npx n8n-mcp-server',
    args: [],
    env: {
      N8N_API_KEY: process.env.N8N_API_KEY,
      N8N_BASE_URL: process.env.N8N_BASE_URL
    }
  },
  'obsidian': {
    command: 'npx mcp-obsidian',
    args: [],
    env: { OBSIDIAN_VAULT_PATH: process.env.OBSIDIAN_VAULT_PATH }
  },
  'youtube-data': {
    command: 'npx youtube-data-mcp-server',
    args: [],
    env: { YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY }
  },
  'youtube': {
    command: 'npx youtube-mcp-server',
    args: [],
    env: {}
  },
  'claude-ollama-devika': {
    command: 'npx claude-ollama-devika',
    args: [],
    env: { OLLAMA_HOST: process.env.OLLAMA_HOST }
  },
  'document-edit': {
    command: 'npx document-edit-mcp',
    args: [],
    env: {}
  }
};

function readClaudeConfig() {
  try {
    const config = fs.readFileSync(CLAUDE_CONFIG_PATH, 'utf8');
    return JSON.parse(config);
  } catch (error) {
    console.error('Error reading Claude config:', error);
    return null;
  }
}

function writeClaudeConfig(config) {
  try {
    fs.writeFileSync(CLAUDE_CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing Claude config:', error);
    return false;
  }
}

function checkServerStatus(serverName, serverConfig) {
  return new Promise((resolve) => {
    const command = serverConfig.command || `npx ${serverName}`;
    const args = serverConfig.args || [];
    
    const child = spawn(command, args, {
      stdio: 'pipe',
      env: { ...process.env, ...serverConfig.env }
    });
    
    let hasResponse = false;
    const timeout = setTimeout(() => {
      if (!hasResponse) {
        child.kill();
        resolve({ status: 'timeout', pid: null });
      }
    }, 5000);
    
    child.on('spawn', () => {
      hasResponse = true;
      clearTimeout(timeout);
      child.kill();
      resolve({ status: 'running', pid: child.pid });
    });
    
    child.on('error', (error) => {
      hasResponse = true;
      clearTimeout(timeout);
      resolve({ status: 'error', error: error.message });
    });
  });
}

function startServer(serverName, serverConfig) {
  if (activeServers.has(serverName)) {
    return { success: false, message: 'Server already running' };
  }
  
  const command = serverConfig.command || `npx ${serverName}`;
  const args = serverConfig.args || [];
  
  const child = spawn(command, args, {
    stdio: 'pipe',
    env: { ...process.env, ...serverConfig.env }
  });
  
  activeServers.set(serverName, child);
  
  child.on('exit', (code) => {
    activeServers.delete(serverName);
    broadcastStatus();
  });
  
  return { success: true, pid: child.pid };
}

function stopServer(serverName) {
  const server = activeServers.get(serverName);
  if (!server) {
    return { success: false, message: 'Server not running' };
  }
  
  server.kill();
  activeServers.delete(serverName);
  return { success: true };
}

function broadcastStatus() {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'status_update',
        activeServers: Array.from(activeServers.keys())
      }));
    }
  });
}

app.get('/api/config', (req, res) => {
  const config = readClaudeConfig();
  if (!config) {
    return res.status(500).json({ error: 'Could not read Claude config' });
  }
  
  const projectPath = '/mnt/e';
  const mcpServers = config.projects?.[projectPath]?.mcpServers || {};
  
  res.json({
    servers: mcpServers,
    templates: MCP_SERVER_TEMPLATES,
    activeServers: Array.from(activeServers.keys())
  });
});

app.post('/api/config', (req, res) => {
  const config = readClaudeConfig();
  if (!config) {
    return res.status(500).json({ error: 'Could not read Claude config' });
  }
  
  const projectPath = '/mnt/e';
  if (!config.projects) config.projects = {};
  if (!config.projects[projectPath]) config.projects[projectPath] = {};
  
  config.projects[projectPath].mcpServers = req.body.servers;
  
  if (writeClaudeConfig(config)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Could not write Claude config' });
  }
});

app.get('/api/servers/:name/status', async (req, res) => {
  const serverName = req.params.name;
  const config = readClaudeConfig();
  
  if (!config) {
    return res.status(500).json({ error: 'Could not read Claude config' });
  }
  
  const projectPath = '/mnt/e';
  const serverConfig = config.projects?.[projectPath]?.mcpServers?.[serverName];
  
  if (!serverConfig) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  const status = await checkServerStatus(serverName, serverConfig);
  res.json(status);
});

app.post('/api/servers/:name/start', (req, res) => {
  const serverName = req.params.name;
  const config = readClaudeConfig();
  
  if (!config) {
    return res.status(500).json({ error: 'Could not read Claude config' });
  }
  
  const projectPath = '/mnt/e';
  const serverConfig = config.projects?.[projectPath]?.mcpServers?.[serverName];
  
  if (!serverConfig) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  const result = startServer(serverName, serverConfig);
  
  if (result.success) {
    broadcastStatus();
  }
  
  res.json(result);
});

app.post('/api/servers/:name/stop', (req, res) => {
  const serverName = req.params.name;
  const result = stopServer(serverName);
  
  if (result.success) {
    broadcastStatus();
  }
  
  res.json(result);
});

app.get('/api/servers/:name/test', async (req, res) => {
  const serverName = req.params.name;
  
  try {
    const testResult = await testMCPServer(serverName);
    res.json(testResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/templates', (req, res) => {
  res.json(MCP_SERVER_TEMPLATES);
});

app.get('/api/servers', (req, res) => {
  const config = readClaudeConfig();
  if (!config) {
    return res.status(500).json({ error: 'Could not read Claude config' });
  }
  
  const projectPath = '/mnt/e';
  const mcpServers = config.projects?.[projectPath]?.mcpServers || {};
  
  res.json({
    servers: mcpServers,
    activeServers: Array.from(activeServers.keys())
  });
});

app.post('/api/servers/:name/restart', (req, res) => {
  const serverName = req.params.name;
  const stopResult = stopServer(serverName);
  
  if (stopResult.success || stopResult.message === 'Server not running') {
    setTimeout(() => {
      const config = readClaudeConfig();
      if (config) {
        const projectPath = '/mnt/e';
        const serverConfig = config.projects?.[projectPath]?.mcpServers?.[serverName];
        if (serverConfig) {
          const startResult = startServer(serverName, serverConfig);
          if (startResult.success) {
            broadcastStatus();
          }
        }
      }
    }, 1000);
    
    res.json({ success: true, message: 'Server restarting' });
  } else {
    res.json(stopResult);
  }
});

async function testMCPServer(serverName) {
  return new Promise((resolve) => {
    const child = spawn('npx', ['@modelcontextprotocol/client-cli', 'test', serverName], {
      stdio: 'pipe'
    });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error,
        exitCode: code
      });
    });
    
    setTimeout(() => {
      child.kill();
      resolve({
        success: false,
        output,
        error: 'Test timeout',
        exitCode: -1
      });
    }, 10000);
  });
}

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'status_update',
    activeServers: Array.from(activeServers.keys())
  }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MCP Dashboard server running on port ${PORT}`);
  console.log(`Claude config path: ${CLAUDE_CONFIG_PATH}`);
});