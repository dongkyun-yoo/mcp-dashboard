# MCP Dashboard

A full-stack web application for monitoring and controlling Model Context Protocol (MCP) servers used by Claude Code.

## Features

- **Real-time Monitoring**: WebSocket-based real-time status updates
- **Server Control**: Start, stop, and restart MCP servers
- **Configuration Management**: Edit server configurations through a web interface
- **Server Testing**: Test MCP server connectivity and functionality
- **Template System**: Quick setup with pre-configured server templates
- **Status Indicators**: Visual status indicators for all servers

## Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + WebSocket
- **Configuration**: Reads/writes Claude Code's `.claude.json` config file

## Supported MCP Servers

The dashboard supports all MCP servers configured in Claude Code, including:

- **filesystem** - File system access
- **github** - GitHub integration
- **puppeteer** - Browser automation
- **npm-search** - NPM package search
- **memory** - Memory management
- **perplexity** - AI search
- And many more...

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dongkyun-yoo/mcp-dashboard.git
cd mcp-dashboard
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:5173`

3. The dashboard will automatically:
   - Read your Claude Code configuration
   - Display all configured MCP servers
   - Show real-time status updates
   - Allow you to control servers

## Production Deployment

1. Build the frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Configuration

The dashboard reads and writes to Claude Code's configuration file located at:
- `~/.claude.json` (Linux/Mac)
- `%USERPROFILE%\.claude.json` (Windows)

### Adding New Servers

1. Use the "Add Server" button in the dashboard
2. Select from available templates or create custom configuration
3. Configure command, arguments, and environment variables
4. Save the configuration

### Server Templates

The dashboard includes templates for popular MCP servers:
- **filesystem**: File system operations
- **github**: GitHub API integration
- **puppeteer**: Browser automation
- **npm-search**: NPM package search
- **memory**: Memory management
- **perplexity**: AI-powered search

## API Endpoints

- `GET /api/config` - Get current MCP configuration
- `POST /api/config` - Update MCP configuration
- `GET /api/servers/:name/status` - Check server status
- `POST /api/servers/:name/start` - Start server
- `POST /api/servers/:name/stop` - Stop server
- `GET /api/servers/:name/test` - Test server connectivity

## WebSocket Events

- `status_update` - Real-time server status updates

## Security

- The dashboard only accesses Claude Code's configuration file
- Environment variables are handled securely
- No sensitive data is exposed through the web interface

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details