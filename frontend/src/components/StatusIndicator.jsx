import React from 'react';
import { SignalIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const StatusIndicator = ({ activeCount, totalCount }) => {
  const percentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
  
  const getStatusColor = () => {
    if (percentage === 100) return 'text-green-600';
    if (percentage > 50) return 'text-yellow-600';
    if (activeCount > 0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (totalCount === 0) return 'No servers configured';
    if (percentage === 100) return 'All servers running';
    if (percentage > 50) return 'Most servers running';
    if (activeCount > 0) return 'Some servers running';
    return 'No servers running';
  };

  const getStatusIcon = () => {
    if (totalCount === 0) return <XCircleIcon className="h-5 w-5 text-gray-400" />;
    if (percentage === 100) return <SignalIcon className="h-5 w-5 text-green-600" />;
    if (percentage > 0) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
    return <XCircleIcon className="h-5 w-5 text-red-600" />;
  };

  const getBackgroundColor = () => {
    if (totalCount === 0) return 'bg-gray-100 border-gray-200';
    if (percentage === 100) return 'bg-green-50 border-green-200';
    if (percentage > 50) return 'bg-yellow-50 border-yellow-200';
    if (activeCount > 0) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 rounded-lg border ${getBackgroundColor()}`}>
      {getStatusIcon()}
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <div className={`h-3 w-3 rounded-full ${
            activeCount > 0 ? 'bg-green-500 status-indicator' : 'bg-red-500'
          }`}></div>
          <span className={`text-sm font-semibold ${getStatusColor()}`}>
            {activeCount}/{totalCount}
          </span>
        </div>
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      </div>
    </div>
  );
};

export default StatusIndicator;
