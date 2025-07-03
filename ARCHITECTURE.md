# Architecture Overview

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│  Express Server │◄──►│  Claude Config  │
│   (Port 5173)   │    │   (Port 3001)   │    │   ~/.claude.json│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        ▼                        │
         │              ┌─────────────────┐                │
         └─────────────►│  WebSocket API  │◄───────────────┘
                        │ (Real-time sync)│
                        └─────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    MCP Server Pool      │
                    │ ┌─────┐ ┌─────┐ ┌─────┐ │
                    │ │ FS  │ │ Git │ │ Pup │ │
                    │ └─────┘ └─────┘ └─────┘ │
                    │ ┌─────┐ ┌─────┐ ┌─────┐ │
                    │ │ NPM │ │ AI  │ │ ... │ │
                    │ └─────┘ └─────┘ └─────┘ │
                    └─────────────────────────┘
```

## Component Architecture

### Frontend (React + Vite + Tailwind)

```
src/
├── App.jsx                    # Main application component
├── components/
│   ├── ServerCard.jsx         # Individual server status/controls
│   ├── ServerEditor.jsx       # Server configuration editor
│   └── StatusIndicator.jsx    # Global status display
├── main.jsx                   # React entry point
└── index.css                  # Global styles + Tailwind
```

**Key Features:**
- Responsive design with Tailwind CSS
- Real-time updates via WebSocket
- Form validation and error handling
- Template-based server creation
- Batch server operations

### Backend (Node.js + Express + WebSocket)

```
backend/
└── server.js                  # Express server + WebSocket handler
```

**API Endpoints:**
- `GET /api/config` - Get current MCP configuration
- `POST /api/config` - Update MCP configuration
- `GET /api/servers/:name/status` - Check individual server status
- `POST /api/servers/:name/start` - Start server
- `POST /api/servers/:name/stop` - Stop server
- `POST /api/servers/:name/restart` - Restart server
- `GET /api/servers/:name/test` - Test server connectivity
- `GET /api/templates` - Get available server templates

**WebSocket Events:**
- `status_update` - Broadcast when server status changes

### Configuration Management

**Claude Config Structure:**
```json
{
  "projects": {
    "/mnt/e": {
      "mcpServers": {
        "github": {
          "command": "npx @modelcontextprotocol/server-github",
          "args": [],
          "env": {
            "GITHUB_PERSONAL_ACCESS_TOKEN": "..."
          }
        }
      }
    }
  }
}
```

## Data Flow

### 1. Configuration Loading
```
User opens dashboard → Frontend requests /api/config → Backend reads ~/.claude.json
→ Returns servers + templates + active status → Frontend renders UI
```

### 2. Server Control
```
User clicks Start → Frontend sends POST /api/servers/:name/start
→ Backend spawns child process → Updates active servers map
→ Broadcasts status via WebSocket → Frontend updates UI
```

### 3. Real-time Updates
```
Server process exits → Backend detects exit event → Removes from active map
→ Broadcasts status via WebSocket → All connected clients update
```

### 4. Configuration Updates
```
User saves in editor → Frontend sends POST /api/config
→ Backend validates and writes to ~/.claude.json → Returns success
→ Frontend reloads configuration → UI reflects changes
```

## State Management

### Frontend State (React useState)
- `servers` - Current server configurations
- `templates` - Available server templates
- `activeServers` - List of currently running servers
- `serverStatus` - Individual server status cache
- `ws` - WebSocket connection

### Backend State (In-memory)
- `activeServers` - Map of running child processes
- File system watch on `.claude.json` (future enhancement)

## Security Model

### File System Access
- Limited to Claude config file (`~/.claude.json`)
- No arbitrary file system access
- Config file path can be overridden via environment

### Process Spawning
- Only allows spawning of npm packages
- Environment variables are isolated per server
- Process timeouts prevent hung servers

### API Security
- CORS configuration for allowed origins
- Input validation on all endpoints
- No sensitive data in API responses

## Error Handling

### Frontend
- Network errors with retry logic
- Form validation with user feedback
- WebSocket reconnection on disconnect
- Graceful degradation without real-time updates

### Backend
- Process spawn failures with detailed errors
- File system access errors
- JSON parsing errors for config file
- WebSocket connection management

## Performance Considerations

### Frontend
- Lazy loading of components
- Debounced status checks
- Efficient re-rendering with React keys
- CSS animations with hardware acceleration

### Backend
- Connection pooling for WebSocket clients
- Process cleanup on server shutdown
- Memory management for long-running processes
- Configurable timeouts for operations

## Extensibility

### Adding New MCP Servers
1. Add template to `MCP_SERVER_TEMPLATES`
2. Include required environment variables
3. Update documentation

### Custom Server Types
- Template system allows arbitrary commands
- Environment variable injection
- Argument customization

### Additional Monitoring
- Health check endpoints
- Metrics collection
- Log aggregation
- Performance monitoring

## Development Workflow

### Local Development
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Testing
curl http://localhost:3001/api/config
```

### Testing
- Unit tests for API endpoints
- Integration tests for MCP server lifecycle
- Frontend component testing
- End-to-end testing with real MCP servers

### Production Build
```bash
npm run build     # Build frontend
npm start         # Serve production bundle
```

## Future Enhancements

### Planned Features
- [ ] Server logs viewer
- [ ] Performance metrics dashboard
- [ ] Server dependency management
- [ ] Backup/restore configurations
- [ ] Multi-project support
- [ ] User authentication
- [ ] Role-based permissions
- [ ] API rate limiting
- [ ] Server health scoring
- [ ] Auto-restart on failure
