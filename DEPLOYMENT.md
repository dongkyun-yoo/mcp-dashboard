# Deployment Guide

## Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/dongkyun-yoo/mcp-dashboard.git
cd mcp-dashboard
npm run install:all
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Development**
```bash
npm run dev
# Opens http://localhost:5173
```

4. **Production**
```bash
npm run build
npm start
# Serves on http://localhost:3001
```

## Environment Variables

### Required for Basic Functionality
- `CLAUDE_CONFIG_PATH` - Path to Claude config (auto-detected)
- `PORT` - Server port (default: 3001)

### MCP Server API Keys
- `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub integration
- `PERPLEXITY_API_KEY` - Perplexity search
- `YOUTUBE_API_KEY` - YouTube data access
- `EXA_API_KEY` - Exa search
- `NAVER_CLIENT_ID` & `NAVER_CLIENT_SECRET` - Naver search
- `SUPABASE_URL` & `SUPABASE_ANON_KEY` - Supabase integration
- `N8N_API_KEY` & `N8N_BASE_URL` - n8n automation
- `SEARXNG_BASE_URL` - SearXNG search instance
- `OBSIDIAN_VAULT_PATH` - Obsidian vault location
- `OLLAMA_HOST` - Ollama instance for AI models

## Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
```

## Production Considerations

### Security
- Set up proper CORS origins
- Use HTTPS in production
- Secure API keys in environment variables
- Limit file system access

### Performance
- Enable gzip compression
- Use a reverse proxy (nginx/Apache)
- Configure proper caching headers
- Monitor memory usage for long-running servers

### Monitoring
- Set up health checks
- Monitor WebSocket connections
- Log server start/stop events
- Track API response times

## Systemd Service

```ini
# /etc/systemd/system/mcp-dashboard.service
[Unit]
Description=MCP Dashboard
After=network.target

[Service]
Type=simple
User=mcp-user
WorkingDirectory=/opt/mcp-dashboard
EnvironmentFile=/opt/mcp-dashboard/.env
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. **Claude config not found**
   - Check `CLAUDE_CONFIG_PATH` environment variable
   - Ensure Claude Code is properly installed
   - Verify file permissions

2. **MCP servers won't start**
   - Check if npx is available
   - Verify internet connection for package downloads
   - Check environment variables for API keys

3. **WebSocket connection fails**
   - Verify port 3001 is accessible
   - Check firewall settings
   - Ensure WebSocket proxy is configured correctly

4. **Frontend build fails**
   - Update Node.js to latest LTS
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

### Logs

- Backend logs: Console output from Node.js server
- Frontend logs: Browser developer console
- MCP server logs: Individual server stdout/stderr

### Health Checks

```bash
# Check if server is running
curl http://localhost:3001/api/config

# Check WebSocket connection
wscat -c ws://localhost:3001

# Verify MCP server status
curl http://localhost:3001/api/servers/github/status
```
