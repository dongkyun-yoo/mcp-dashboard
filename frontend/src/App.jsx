import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ServerCard from './components/ServerCard';
import ServerEditor from './components/ServerEditor';
import StatusIndicator from './components/StatusIndicator';
import { PlayIcon, StopIcon, PlusIcon, Cog6ToothIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function App() {
  const [servers, setServers] = useState({});
  const [templates, setTemplates] = useState({});
  const [activeServers, setActiveServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [ws, setWs] = useState(null);
  const [serverStatus, setServerStatus] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConfig();
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const websocket = new WebSocket(`${protocol}//${window.location.hostname}:3001`);
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status_update') {
        setActiveServers(data.activeServers);
      }
    };
    
    websocket.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(websocket);
  };

  const loadConfig = async () => {
    try {
      const response = await axios.get('/api/config');
      setServers(response.data.servers);
      setTemplates(response.data.templates);
      setActiveServers(response.data.activeServers);
      
      Object.keys(response.data.servers).forEach(checkServerStatus);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkServerStatus = async (serverName) => {
    try {
      const response = await axios.get(`/api/servers/${serverName}/status`);
      setServerStatus(prev => ({
        ...prev,
        [serverName]: response.data
      }));
    } catch (error) {
      console.error(`Error checking status for ${serverName}:`, error);
      setServerStatus(prev => ({
        ...prev,
        [serverName]: { status: 'error', error: error.message }
      }));
    }
  };

  const startServer = async (serverName) => {
    try {
      await axios.post(`/api/servers/${serverName}/start`);
      setTimeout(() => checkServerStatus(serverName), 1000);
    } catch (error) {
      console.error(`Error starting ${serverName}:`, error);
    }
  };

  const stopServer = async (serverName) => {
    try {
      await axios.post(`/api/servers/${serverName}/stop`);
      setTimeout(() => checkServerStatus(serverName), 1000);
    } catch (error) {
      console.error(`Error stopping ${serverName}:`, error);
    }
  };

  const restartServer = async (serverName) => {
    try {
      await axios.post(`/api/servers/${serverName}/restart`);
      setTimeout(() => checkServerStatus(serverName), 2000);
    } catch (error) {
      console.error(`Error restarting ${serverName}:`, error);
    }
  };

  const testServer = async (serverName) => {
    try {
      const response = await axios.get(`/api/servers/${serverName}/test`);
      const result = response.data;
      
      if (result.success) {
        alert(`✅ Test passed for ${serverName}!\n\nOutput:\n${result.output}`);
      } else {
        alert(`❌ Test failed for ${serverName}\n\nError: ${result.error}\n\nOutput: ${result.output}`);
      }
    } catch (error) {
      alert(`❌ Test error for ${serverName}: ${error.message}`);
    }
  };

  const refreshAllStatus = async () => {
    setRefreshing(true);
    const serverNames = Object.keys(servers);
    
    try {
      await Promise.all(serverNames.map(checkServerStatus));
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const saveConfig = async (newServers) => {
    try {
      await axios.post('/api/config', { servers: newServers });
      setServers(newServers);
      setShowEditor(false);
      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving configuration: ' + error.message);
    }
  };

  const addServer = (serverName) => {
    const template = templates[serverName];
    if (template) {
      setSelectedServer({
        name: serverName,
        config: {
          command: template.command,
          args: template.args || [],
          env: template.env || {}
        }
      });
      setShowEditor(true);
    }
  };

  const editServer = (serverName) => {
    setSelectedServer({
      name: serverName,
      config: servers[serverName]
    });
    setShowEditor(true);
  };

  const startAllServers = async () => {
    const serverNames = Object.keys(servers);
    for (const serverName of serverNames) {
      if (!activeServers.includes(serverName)) {
        await startServer(serverName);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const stopAllServers = async () => {
    for (const serverName of activeServers) {
      await stopServer(serverName);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading MCP Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MCP Server Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor and control Model Context Protocol servers</p>
            </div>
            <div className="flex items-center space-x-4">
              <StatusIndicator activeCount={activeServers.length} totalCount={Object.keys(servers).length} />
              
              <div className="flex space-x-2">
                <button
                  onClick={refreshAllStatus}
                  disabled={refreshing}
                  className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                  <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                {activeServers.length > 0 && (
                  <button
                    onClick={stopAllServers}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center"
                  >
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stop All
                  </button>
                )}
                
                {Object.keys(servers).length > activeServers.length && (
                  <button
                    onClick={startAllServers}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center"
                  >
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Start All
                  </button>
                )}
                
                <button
                  onClick={() => setShowEditor(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Server
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(servers).map(([name, config]) => (
              <ServerCard
                key={name}
                name={name}
                config={config}
                isActive={activeServers.includes(name)}
                status={serverStatus[name]}
                onStart={() => startServer(name)}
                onStop={() => stopServer(name)}
                onRestart={() => restartServer(name)}
                onTest={() => testServer(name)}
                onEdit={() => editServer(name)}
                onRefresh={() => checkServerStatus(name)}
              />
            ))}
          </div>

          {Object.keys(servers).length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Cog6ToothIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-500 text-lg mb-4">No MCP servers configured</div>
                <div className="text-gray-400 mb-6">Add your first server to get started with monitoring MCP services</div>
                <button
                  onClick={() => setShowEditor(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  <PlusIcon className="h-5 w-5 inline mr-2" />
                  Add Your First Server
                </button>
              </div>
            </div>
          )}

          {Object.keys(templates).length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Server Templates</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {Object.entries(templates).map(([templateName, template]) => (
                  <button
                    key={templateName}
                    onClick={() => addServer(templateName)}
                    className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 text-left transition-all duration-200 group"
                  >
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                      {templateName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {template.command.split(' ')[0].replace('npx ', '')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <ServerEditor
          server={selectedServer}
          servers={servers}
          templates={templates}
          onSave={saveConfig}
          onClose={() => {
            setShowEditor(false);
            setSelectedServer(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
