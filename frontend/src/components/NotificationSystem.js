// src/components/NotificationSystem.js - ENHANCED FOR REAL AZTEC INTEGRATION
import React, { useEffect, useState } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfo, FaTimes, FaExternalLinkAlt, FaClock, FaWifi } from 'react-icons/fa';
import useWalletStore from '../store/walletStore';

const NotificationSystem = () => {
  const { 
    notifications, 
    removeNotification, 
    getBackgroundTasks,
    clearCompletedTasks,
    useMockData 
  } = useWalletStore();
  
  const [backgroundTasks, setBackgroundTasks] = useState([]);
  const [networkStatus, setNetworkStatus] = useState('online');

  // Listen for Aztec transaction events
  useEffect(() => {
    const handleTransactionComplete = (event) => {
      const { txHash, status, operationType } = event.detail;
      
      useWalletStore.getState().addNotification({
        type: status === 'success' ? 'success' : 'error',
        title: `${operationType.replace('_', ' ')} ${status === 'success' ? 'Complete' : 'Failed'}`,
        message: status === 'success' 
          ? 'Transaction confirmed on Aztec Network!' 
          : 'Transaction failed or was reverted.',
        txHash: txHash,
        persistent: false
      });
    };

    const handleTransactionTimeout = (event) => {
      const { txHash, operationType } = event.detail;
      
      useWalletStore.getState().addNotification({
        type: 'warning',
        title: 'Transaction Timeout',
        message: `${operationType.replace('_', ' ')} is taking longer than expected. It may still complete in the background.`,
        txHash: txHash,
        persistent: true
      });
    };

    const handleNetworkStatus = (event) => {
      setNetworkStatus(event.detail.status);
      
      if (event.detail.status === 'offline') {
        useWalletStore.getState().addNotification({
          type: 'error',
          title: 'Network Connection Lost',
          message: 'Lost connection to Aztec Network. Retrying...',
          persistent: true
        });
      } else if (event.detail.status === 'online') {
        useWalletStore.getState().addNotification({
          type: 'success',
          title: 'Network Connection Restored',
          message: 'Successfully reconnected to Aztec Network.',
          persistent: false
        });
      }
    };

    window.addEventListener('aztecTransactionComplete', handleTransactionComplete);
    window.addEventListener('aztecTransactionTimeout', handleTransactionTimeout);
    window.addEventListener('aztecNetworkStatus', handleNetworkStatus);
    
    return () => {
      window.removeEventListener('aztecTransactionComplete', handleTransactionComplete);
      window.removeEventListener('aztecTransactionTimeout', handleTransactionTimeout);
      window.removeEventListener('aztecNetworkStatus', handleNetworkStatus);
    };
  }, []);

  // Update background tasks
  useEffect(() => {
    const updateTasks = () => {
      setBackgroundTasks(getBackgroundTasks());
    };

    updateTasks();
    const interval = setInterval(updateTasks, 1000);
    
    return () => clearInterval(interval);
  }, [getBackgroundTasks]);

  // Auto-clear completed tasks
  useEffect(() => {
    const interval = setInterval(() => {
      clearCompletedTasks();
    }, 30000); // Clear every 30 seconds

    return () => clearInterval(interval);
  }, [clearCompletedTasks]);

  if (notifications.length === 0 && backgroundTasks.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[1000] space-y-3 max-w-sm">
      {/* Network Status Indicator */}
      {networkStatus !== 'online' && (
        <NetworkStatusCard status={networkStatus} useMockData={useMockData} />
      )}
      
      {/* Background Tasks */}
      {backgroundTasks.map((task) => (
        <BackgroundTaskCard key={task.startTime} task={task} />
      ))}
      
      {/* Notifications */}
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const NotificationCard = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FaCheck className="text-green-400" size={20} />;
      case 'error':
        return <FaExclamationTriangle className="text-red-400" size={20} />;
      case 'warning':
        return <FaExclamationTriangle className="text-orange-400" size={20} />;
      case 'info':
      default:
        return <FaInfo className="text-blue-400" size={20} />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-600/20 border-green-500/40';
      case 'error':
        return 'bg-red-600/20 border-red-500/40';
      case 'warning':
        return 'bg-orange-600/20 border-orange-500/40';
      case 'info':
      default:
        return 'bg-blue-600/20 border-blue-500/40';
    }
  };

  const openAztecExplorer = (txHash) => {
    // Check if it's a mock transaction
    if (txHash.includes('mock')) {
      useWalletStore.getState().addNotification({
        type: 'info',
        title: 'Mock Transaction',
        message: 'This is a mock transaction for development. No blockchain explorer available.'
      });
      return;
    }
    
    // Real Aztec transaction explorer (when available)
    const explorerUrl = `https://aztecscan.xyz/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div 
      className={`${getBgColor()} border rounded-lg p-4 backdrop-blur-sm transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-white font-medium text-sm">
              {notification.title}
            </h4>
            {!notification.persistent && (
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition flex-shrink-0"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
          
          <p className="text-white/80 text-sm mt-1 leading-relaxed">
            {notification.message}
          </p>
          
          {notification.txHash && (
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs">Transaction:</span>
                <code className="text-white/80 text-xs font-mono bg-white/10 px-2 py-0.5 rounded flex-1 truncate">
                  {notification.txHash.slice(0, 12)}...{notification.txHash.slice(-8)}
                </code>
                <button
                  onClick={() => openAztecExplorer(notification.txHash)}
                  className="text-blue-400 hover:text-blue-300 transition"
                  title="View in Explorer"
                >
                  <FaExternalLinkAlt size={12} />
                </button>
              </div>
            </div>
          )}
          
          {notification.timestamp && (
            <div className="text-white/50 text-xs mt-2">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BackgroundTaskCard = ({ task }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - task.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [task.startTime]);

  const getStatusColor = () => {
    switch (task.status) {
      case 'running':
        return 'bg-blue-600/20 border-blue-500/40';
      case 'success':
        return 'bg-green-600/20 border-green-500/40';
      case 'timeout':
        return 'bg-orange-600/20 border-orange-500/40';
      case 'error':
        return 'bg-red-600/20 border-red-500/40';
      default:
        return 'bg-gray-600/20 border-gray-500/40';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <FaCheck className="text-green-400" size={16} />;
      case 'timeout':
        return <FaClock className="text-orange-400" size={16} />;
      case 'error':
        return <FaExclamationTriangle className="text-red-400" size={16} />;
      default:
        return <FaInfo className="text-gray-400" size={16} />;
    }
  };

  const formatElapsedTime = () => {
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPhaseEmoji = () => {
    switch (task.phase) {
      case 'generating_keys':
        return '🔑';
      case 'creating_account':
        return '👤';
      case 'preparing_deployment':
        return '⚙️';
      case 'deploying':
        return '🚀';
      case 'confirming':
        return '⏳';
      case 'proving':
        return '🔐';
      case 'mining':
        return '⛏️';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔄';
    }
  };

  return (
    <div className={`${getStatusColor()} border rounded-lg p-3 backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium capitalize flex items-center gap-2">
              {getPhaseEmoji()}
              {task.type.replace('_', ' ')}
            </span>
            <div className="text-white/60 text-xs flex items-center gap-2">
              <span>{formatElapsedTime()}</span>
              {task.timeEstimate && task.status === 'running' && (
                <span className="text-white/40">• ETA: {task.timeEstimate}</span>
              )}
            </div>
          </div>
          
          {task.message && (
            <p className="text-white/70 text-xs mt-1">
              {task.message}
            </p>
          )}
          
          {task.progress !== undefined && task.status === 'running' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>{task.phase ? task.phase.replace('_', ' ') : 'Processing'}</span>
                <span>{Math.round(task.progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div 
                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(task.progress, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          {task.txHash && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs">TX:</span>
                <code className="text-white/80 text-xs font-mono bg-white/10 px-1.5 py-0.5 rounded flex-1 truncate">
                  {task.txHash.slice(0, 10)}...{task.txHash.slice(-6)}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NetworkStatusCard = ({ status, useMockData }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          color: 'bg-yellow-600/20 border-yellow-500/40',
          icon: <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />,
          title: 'Connecting to Aztec Network',
          message: 'Establishing connection...'
        };
      case 'offline':
        return {
          color: 'bg-red-600/20 border-red-500/40',
          icon: <FaWifi className="text-red-400" size={16} />,
          title: 'Network Offline',
          message: useMockData ? 'Using mock mode for development' : 'Unable to reach Aztec Network'
        };
      case 'slow':
        return {
          color: 'bg-orange-600/20 border-orange-500/40',
          icon: <FaClock className="text-orange-400" size={16} />,
          title: 'Network Slow',
          message: 'Aztec testnet experiencing delays'
        };
      default:
        return {
          color: 'bg-gray-600/20 border-gray-500/40',
          icon: <FaInfo className="text-gray-400" size={16} />,
          title: 'Network Status Unknown',
          message: 'Checking connection...'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.color} border rounded-lg p-3 backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {config.icon}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium text-sm">
            {config.title}
          </h4>
          <p className="text-white/70 text-xs mt-1">
            {config.message}
          </p>
          {useMockData && (
            <div className="mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-orange-400 text-xs font-medium">Development Mode</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;
