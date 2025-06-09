// src/components/NotificationSystem.js - BACKGROUND NOTIFICATIONS FOR AZTEC
import React, { useEffect } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfo, FaTimes, FaExternalLinkAlt } from 'react-icons/fa';
import useWalletStore from '../store/walletStore';

const NotificationSystem = () => {
  const { notifications, removeNotification, backgroundTransactions } = useWalletStore();

  // Listen for Aztec transaction completions
  useEffect(() => {
    const handleTransactionComplete = (event) => {
      const { txHash, status, message } = event.detail;
      
      useWalletStore.getState().addNotification({
        type: status === 'success' ? 'success' : 'error',
        title: 'Aztec Transaction Update',
        message: message || `Transaction ${status}`,
        txHash: txHash
      });
    };

    window.addEventListener('aztecTransactionComplete', handleTransactionComplete);
    
    return () => {
      window.removeEventListener('aztecTransactionComplete', handleTransactionComplete);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[1000] space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      
      {/* Background transaction status */}
      {Array.from(backgroundTransactions.values()).map((tx) => (
        <BackgroundTransactionCard key={tx.monitorId} transaction={tx} />
      ))}
    </div>
  );
};

const NotificationCard = ({ notification, onClose }) => {
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
    // Aztec testnet explorer (if available)
    const explorerUrl = `https://aztec-testnet-explorer.com/tx/${txHash}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className={`${getBgColor()} border rounded-lg p-4 backdrop-blur-sm animate-slide-in-right`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm">
            {notification.title}
          </h4>
          <p className="text-white/80 text-sm mt-1 leading-relaxed">
            {notification.message}
          </p>
          
          {notification.txHash && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-xs">Transaction:</span>
                <code className="text-white/80 text-xs font-mono bg-white/10 px-2 py-0.5 rounded">
                  {notification.txHash.slice(0, 10)}...{notification.txHash.slice(-8)}
                </code>
                <button
                  onClick={() => openAztecExplorer(notification.txHash)}
                  className="text-blue-400 hover:text-blue-300 transition"
                  title="View in Aztec Explorer"
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
        
        {!notification.persistent && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition flex-shrink-0"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

const BackgroundTransactionCard = ({ transaction }) => {
  const getStatusColor = () => {
    switch (transaction.status) {
      case 'monitoring':
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

  const getElapsedTime = () => {
    const elapsed = Date.now() - transaction.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${getStatusColor()} border rounded-lg p-3 backdrop-blur-sm`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {transaction.status === 'monitoring' && (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
          {transaction.status === 'success' && (
            <FaCheck className="text-green-400" size={16} />
          )}
          {transaction.status === 'timeout' && (
            <FaExclamationTriangle className="text-orange-400" size={16} />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-white text-sm font-medium capitalize">
              {transaction.type.replace('_', ' ')}
            </span>
            <span className="text-white/60 text-xs">
              {getElapsedTime()}
            </span>
          </div>
          
          {transaction.message && (
            <p className="text-white/70 text-xs mt-1">
              {transaction.message}
            </p>
          )}
          
          {transaction.progress !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-white/10 rounded-full h-1">
                <div 
                  className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(transaction.progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;
