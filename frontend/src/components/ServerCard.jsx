import React, { useState } from 'react';
import { PlayIcon, StopIcon, Cog6ToothIcon, ArrowPathIcon, WrenchIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const ServerCard = ({ name, config, isActive, status, onStart, onStop, onRestart, onTest, onEdit, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const getStatusColor = () => {
    if (isActive) return 'bg-green-100 text-green-800 border-green-200';
    if (status?.status === 'error') return 'bg-red-100 text-red-800 border-red-200';
    if (status?.status === 'timeout') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status?.status === 'running') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (isActive) return 'Running';
    if (status?.status === 'error') return 'Error';
    if (status?.status === 'timeout') return 'Timeout';
    if (status?.status === 'running') return 'Available';
    return 'Stopped';
  };

  const getStatusIcon = () => {
    if (isActive) return (
      <div className="h-2 w-2 bg-green-500 rounded-full status-indicator"></div>
    );
    if (status?.status === 'error') return (
      <div className="h-2 w-2 bg-red-500 rounded-full"></div>
    );
    return (
      <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTest = async () => {
    setIsTesting(true);
    await onTest();
    setIsTesting(false);
  };

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-200 server-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                isActive ? 'bg-green-500' : status?.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
              }`}>
                <div className="h-4 w-4 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h3 className="text-lg leading-6 font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500 truncate max-w-48">{config.command}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="text-sm text-gray-600 space-y-2">
            <div>
              <span className="font-medium">Command:</span>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">{config.command}</code>
            </div>
            {config.args && config.args.length > 0 && (
              <div>
                <span className="font-medium">Args:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">{config.args.join(' ')}</code>
              </div>
            )}
            {config.env && Object.keys(config.env).length > 0 && (
              <div>
                <span className="font-medium">Env vars:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                  {Object.keys(config.env).join(', ')}
                </code>
              </div>
            )}
          </div>
        </div>

        {status?.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-600">
              <span className="font-medium">Error:</span> {status.error}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          {isActive ? (
            <>
              <button
                onClick={onStop}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
              >
                <StopIcon className="h-4 w-4 mr-1" />
                Stop
              </button>
              <button
                onClick={onRestart}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-md flex items-center justify-center transition-colors"
                title="Restart"
              >
                <ArrowsRightLeftIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onStart}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              Start
            </button>
          )}
          
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-3 rounded-md flex items-center justify-center transition-colors"
            title="Test Server"
          >
            {isTesting ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <WrenchIcon className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={onEdit}
            className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-md flex items-center justify-center transition-colors"
            title="Edit Configuration"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-md flex items-center justify-center transition-colors"
            title="Refresh Status"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerCard;
