// src/components/LogViewer.js - COMPLETE USER-VISIBLE LOG VIEWER
import React, { useState, useEffect, useRef } from 'react';
import { FaTerminal, FaTimes, FaDownload, FaCopy, FaFilter, FaTrash, FaExpand, FaCompress, FaSearch, FaPlay, FaPause } from 'react-icons/fa';
import { useLogs, LOG_LEVELS, LOG_CATEGORIES } from '../utils/loggingSystem';

const LogViewer = () => {
  const {
    logs,
    isVisible,
    currentLevel,
    selectedCategory,
    autoScroll,
    toggleVisibility,
    setLevel,
    setCategory,
    setAutoScroll,
    clearLogs,
    exportLogs
  } = useLogs();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const logContainerRef = useRef(null);
  const [newLogCount, setNewLogCount] = useState(0);
  const [lastLogTime, setLastLogTime] = useState(Date.now());

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && !isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, isPaused]);

  // Track new logs when viewer is hidden
  useEffect(() => {
    if (!isVisible) {
      setNewLogCount(prev => prev + 1);
    } else {
      setNewLogCount(0);
    }
    setLastLogTime(Date.now());
  }, [logs.length, isVisible]);

  // Listen for real-time log events
  useEffect(() => {
    const handleLogEvent = (event) => {
      setLastLogTime(Date.now());
      
      // Auto-show for errors if not paused
      if (!isPaused && event.detail.level >= LOG_LEVELS.ERROR.level) {
        setTimeout(() => {
          if (!isVisible) {
            toggleVisibility();
          }
        }, 100);
      }
    };

    window.addEventListener('aztlanLog', handleLogEvent);
    return () => window.removeEventListener('aztlanLog', handleLogEvent);
  }, [isPaused, isVisible, toggleVisibility]);

  // Filter logs based on search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return log.message.toLowerCase().includes(searchLower) ||
           log.category.toLowerCase().includes(searchLower) ||
           (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower)) ||
           (log.txHash && log.txHash.toLowerCase().includes(searchLower));
  });

  const handleDownload = () => {
    const logsData = exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aztlan-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportLogs());
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (error) {
      setCopyStatus('Failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  };

  const handleCopyTxHash = async (txHash) => {
    try {
      await navigator.clipboard.writeText(txHash);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy transaction hash:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getLevelConfig = (level) => {
    return Object.values(LOG_LEVELS).find(l => l.level === level) || LOG_LEVELS.INFO;
  };

  const renderLogData = (data) => {
    if (!data) return null;
    
    try {
      const displayData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const isLargeData = displayData.length > 500;
      
      return (
        <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono">
          <pre className={`whitespace-pre-wrap text-gray-300 ${isLargeData ? 'max-h-32 overflow-y-auto' : ''}`}>
            {isLargeData ? displayData.slice(0, 500) + '\n... (truncated)' : displayData}
          </pre>
        </div>
      );
    } catch (error) {
      return (
        <div className="mt-2 p-2 bg-red-900/30 rounded text-xs text-red-400">
          Error displaying data: {error.message}
        </div>
      );
    }
  };

  const renderTxHash = (txHash) => {
    if (!txHash) return null;
    
    const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-8)}`;
    
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-gray-400">TX:</span>
        <code className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded font-mono">
          {shortHash}
        </code>
        <button
          onClick={() => handleCopyTxHash(txHash)}
          className="text-gray-400 hover:text-white transition"
          title="Copy full transaction hash"
        >
          <FaCopy size={10} />
        </button>
        {/* Add link to explorer if available */}
        <button
          onClick={() => {
            // This could open a transaction explorer
            if (txHash.startsWith('mock')) {
              alert('This is a mock transaction hash for development');
            } else {
              // Open real Aztec explorer when available
              window.open(`https://explorer.aztec.network/tx/${txHash}`, '_blank');
            }
          }}
          className="text-blue-400 hover:text-blue-300 transition text-xs"
          title="View in explorer"
        >
          🔗
        </button>
      </div>
    );
  };

  const getTimeSinceLastLog = () => {
    const elapsed = Date.now() - lastLogTime;
    if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s ago`;
    if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`;
    return `${Math.floor(elapsed / 3600000)}h ago`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={toggleVisibility}
        className="fixed bottom-20 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-full shadow-lg transition-all border border-gray-600 group"
        title="Show development logs"
      >
        <FaTerminal size={20} />
        {newLogCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
            {newLogCount > 99 ? '99+' : newLogCount}
          </span>
        )}
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
            Development Logs ({filteredLogs.length})
            <div className="text-gray-400">{getTimeSinceLastLog()}</div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-96 h-96'} z-50 bg-gray-900 border border-gray-600 rounded-lg shadow-2xl flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800 rounded-t-lg">
        <div className="flex items-center gap-2">
          <FaTerminal className="text-green-400" size={16} />
          <h3 className="text-white font-semibold text-sm">Aztlan Dev Logs</h3>
          <span className="text-xs text-gray-400">({filteredLogs.length})</span>
          
          {/* Live indicator */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Live</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-gray-400 hover:text-white transition p-1"
            title={isPaused ? "Resume logging" : "Pause logging"}
          >
            {isPaused ? <FaPlay size={12} /> : <FaPause size={12} />}
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white transition p-1"
            title={isExpanded ? "Minimize" : "Expand"}
          >
            {isExpanded ? <FaCompress size={12} /> : <FaExpand size={12} />}
          </button>
          
          <button
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-white transition p-1"
            title="Close logs"
          >
            <FaTimes size={12} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-gray-700 space-y-2">
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <FaTimes size={10} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          <select
            value={currentLevel}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
          >
            {Object.entries(LOG_LEVELS).map(([name, config]) => (
              <option key={name} value={config.level}>
                {config.icon} {name}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory || ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs"
          >
            <option value="">All Categories</option>
            {Object.values(LOG_CATEGORIES).map(category => (
              <option key={category} value={category}>
                {category.toUpperCase()}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1 text-gray-300">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-scroll
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={clearLogs}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition"
          >
            <FaTrash size={10} />
            Clear
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition"
          >
            <FaCopy size={10} />
            {copyStatus || 'Copy'}
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition"
          >
            <FaDownload size={10} />
            Export
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 bg-black font-mono text-xs"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            {searchTerm ? 'No logs match your search' : 'No logs to display'}
            {isPaused && (
              <div className="mt-2 text-yellow-400">
                Logging is paused - click ▶️ to resume
              </div>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const levelConfig = getLevelConfig(log.level);
            const isSelected = selectedLog === log.id;
            
            return (
              <div
                key={log.id}
                className={`p-2 rounded border-l-2 cursor-pointer hover:bg-gray-800/50 transition ${
                  levelConfig.bg
                } ${
                  levelConfig.name === 'ERROR' ? 'border-l-red-500' :
                  levelConfig.name === 'WARN' ? 'border-l-orange-500' :
                  levelConfig.name === 'SUCCESS' ? 'border-l-green-500' :
                  levelConfig.name === 'TRANSACTION' ? 'border-l-yellow-500' :
                  levelConfig.name === 'BLOCKCHAIN' ? 'border-l-cyan-500' :
                  'border-l-blue-500'
                } ${isSelected ? 'bg-gray-700/50' : ''}`}
                onClick={() => setSelectedLog(isSelected ? null : log.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-400 text-xs font-mono min-w-[60px]">
                    {formatTimestamp(log.timestamp)}
                  </span>
                  
                  <span className="text-xs">
                    {levelConfig.icon}
                  </span>
                  
                  <span className={`text-xs font-semibold min-w-[60px] ${levelConfig.color}`}>
                    {levelConfig.name}
                  </span>
                  
                  <span className="text-xs text-blue-300 min-w-[70px] uppercase">
                    {log.category}
                  </span>
                  
                  <span className="text-white flex-1">
                    {log.message}
                  </span>
                  
                  {/* Quick indicators */}
                  <div className="flex items-center gap-1">
                    {log.txHash && (
                      <span className="text-yellow-400 text-xs" title="Has transaction hash">
                        🔗
                      </span>
                    )}
                    {log.data && (
                      <span className="text-purple-400 text-xs" title="Has additional data">
                        📦
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-gray-400 text-xs">
                        ▼
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded log details */}
                {isSelected && (
                  <div className="mt-2 ml-4 pl-4 border-l border-gray-600">
                    {log.txHash && renderTxHash(log.txHash)}
                    {log.data && renderLogData(log.data)}
                    
                    <div className="mt-2 text-xs text-gray-400 space-y-1">
                      <div className="flex items-center gap-4">
                        <span>Session: {log.session}</span>
                        <span>Log ID: {log.id}</span>
                      </div>
                      <div>Full Timestamp: {log.timestamp.toISOString()}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                          }}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Copy Log
                        </button>
                        {log.txHash && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTxHash(log.txHash);
                            }}
                            className="text-yellow-400 hover:text-yellow-300 underline"
                          >
                            Copy TX Hash
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Status Bar */}
      <div className="p-2 border-t border-gray-700 bg-gray-800 rounded-b-lg">
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              {filteredLogs.length} logs 
              {searchTerm && ` (filtered from ${logs.length})`}
            </span>
            {isPaused && (
              <span className="text-yellow-400 flex items-center gap-1">
                <FaPause size={10} />
                Paused
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>{getTimeSinceLastLog()}</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`}></span>
              <span>{isPaused ? 'Paused' : 'Live'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
