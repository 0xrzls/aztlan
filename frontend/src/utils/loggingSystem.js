// src/utils/loggingSystem.js - COMPREHENSIVE USER-VISIBLE LOGGING SYSTEM
import { create } from 'zustand';

// Log levels with colors and icons
export const LOG_LEVELS = {
  DEBUG: { level: 0, name: 'DEBUG', color: 'text-gray-400', icon: '🔍', bg: 'bg-gray-600/20' },
  INFO: { level: 1, name: 'INFO', color: 'text-blue-400', icon: 'ℹ️', bg: 'bg-blue-600/20' },
  WARN: { level: 2, name: 'WARN', color: 'text-orange-400', icon: '⚠️', bg: 'bg-orange-600/20' },
  ERROR: { level: 3, name: 'ERROR', color: 'text-red-400', icon: '❌', bg: 'bg-red-600/20' },
  SUCCESS: { level: 1, name: 'SUCCESS', color: 'text-green-400', icon: '✅', bg: 'bg-green-600/20' },
  PROGRESS: { level: 1, name: 'PROGRESS', color: 'text-purple-400', icon: '🔄', bg: 'bg-purple-600/20' },
  TRANSACTION: { level: 2, name: 'TX', color: 'text-yellow-400', icon: '📤', bg: 'bg-yellow-600/20' },
  BLOCKCHAIN: { level: 2, name: 'CHAIN', color: 'text-cyan-400', icon: '⛓️', bg: 'bg-cyan-600/20' }
};

// Log categories for filtering
export const LOG_CATEGORIES = {
  SYSTEM: 'system',
  WALLET: 'wallet',
  TRANSACTION: 'transaction',
  CONTRACT: 'contract',
  PROFILE: 'profile',
  NETWORK: 'network',
  UI: 'ui',
  PERFORMANCE: 'performance'
};

// Enhanced logging store with user visibility
export const useLoggingStore = create((set, get) => ({
  logs: [],
  isVisible: false,
  currentLevel: LOG_LEVELS.INFO.level,
  selectedCategory: null,
  autoScroll: true,
  maxLogs: 1000,
  
  // Actions
  addLog: (level, category, message, data = null, txHash = null) => {
    const log = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      txHash,
      session: getSessionId()
    };
    
    set(state => {
      const newLogs = [...state.logs, log].slice(-state.maxLogs);
      return { logs: newLogs };
    });
    
    // Also log to console for developers
    const levelConfig = Object.values(LOG_LEVELS).find(l => l.level === level);
    const logMethod = level >= LOG_LEVELS.ERROR.level ? 'error' : 
                     level >= LOG_LEVELS.WARN.level ? 'warn' : 'log';
    
    console[logMethod](`[${levelConfig?.name}] [${category}] ${message}`, data || '');
    
    // Auto-show logger for errors
    if (level >= LOG_LEVELS.ERROR.level) {
      setTimeout(() => set({ isVisible: true }), 100);
    }
  },
  
  clearLogs: () => set({ logs: [] }),
  toggleVisibility: () => set(state => ({ isVisible: !state.isVisible })),
  setLevel: (level) => set({ currentLevel: level }),
  setCategory: (category) => set({ selectedCategory: category }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  
  // Filtered logs based on level and category
  getFilteredLogs: () => {
    const { logs, currentLevel, selectedCategory } = get();
    return logs.filter(log => {
      const levelMatch = log.level >= currentLevel;
      const categoryMatch = !selectedCategory || log.category === selectedCategory;
      return levelMatch && categoryMatch;
    });
  },
  
  // Export logs for debugging
  exportLogs: () => {
    const { logs } = get();
    const exported = {
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: logs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }))
    };
    
    return JSON.stringify(exported, null, 2);
  }
}));

// Session ID for log correlation
let sessionId = null;
const getSessionId = () => {
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  return sessionId;
};

// Enhanced Logger class with user-visible output
export class AztlanLogger {
  constructor() {
    this.store = useLoggingStore;
  }

  // Generic logging method
  log(level, category, message, data = null, txHash = null) {
    this.store.getState().addLog(level, category, message, data, txHash);
    
    // Emit event for real-time UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aztlanLog', {
        detail: { level, category, message, data, txHash }
      }));
    }
  }

  // Convenience methods
  debug(category, message, data) {
    this.log(LOG_LEVELS.DEBUG.level, category, message, data);
  }

  info(category, message, data) {
    this.log(LOG_LEVELS.INFO.level, category, message, data);
  }

  warn(category, message, data) {
    this.log(LOG_LEVELS.WARN.level, category, message, data);
  }

  error(category, message, error) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    this.log(LOG_LEVELS.ERROR.level, category, message, errorData);
  }

  success(category, message, data) {
    this.log(LOG_LEVELS.SUCCESS.level, category, message, data);
  }

  progress(category, message, data) {
    this.log(LOG_LEVELS.PROGRESS.level, category, message, data);
  }

  transaction(category, message, txHash, data) {
    this.log(LOG_LEVELS.TRANSACTION.level, category, message, data, txHash);
  }

  blockchain(category, message, data) {
    this.log(LOG_LEVELS.BLOCKCHAIN.level, category, message, data);
  }

  // Specialized logging methods for common operations
  
  // Wallet operations
  walletConnecting(provider) {
    this.progress(LOG_CATEGORIES.WALLET, `Connecting to ${provider} wallet...`, { provider });
  }

  walletConnected(address, provider) {
    this.success(LOG_CATEGORIES.WALLET, `Wallet connected successfully`, { 
      address: address?.slice(0, 10) + '...' + address?.slice(-8), 
      provider 
    });
  }

  walletError(operation, error) {
    this.error(LOG_CATEGORIES.WALLET, `Wallet ${operation} failed`, error);
  }

  // Transaction lifecycle
  transactionInitiated(type, params) {
    this.transaction(LOG_CATEGORIES.TRANSACTION, `Initiating ${type} transaction`, null, params);
  }

  transactionSigned(type, txHash) {
    this.transaction(LOG_CATEGORIES.TRANSACTION, `Transaction signed: ${type}`, txHash);
  }

  transactionBroadcast(txHash) {
    this.blockchain(LOG_CATEGORIES.TRANSACTION, `Transaction broadcast to network`, { txHash });
  }

  transactionConfirmed(txHash, blockNumber, gasUsed) {
    this.success(LOG_CATEGORIES.TRANSACTION, `Transaction confirmed!`, { 
      txHash, 
      blockNumber, 
      gasUsed 
    });
  }

  transactionFailed(txHash, error) {
    this.error(LOG_CATEGORIES.TRANSACTION, `Transaction failed`, { txHash, error });
  }

  // Contract operations
  contractDeploying(name, address) {
    this.progress(LOG_CATEGORIES.CONTRACT, `Deploying ${name} contract...`, { name, address });
  }

  contractDeployed(name, address, txHash) {
    this.success(LOG_CATEGORIES.CONTRACT, `Contract ${name} deployed successfully`, { 
      name, 
      address, 
      txHash 
    });
  }

  contractInteraction(contractName, method, params) {
    this.info(LOG_CATEGORIES.CONTRACT, `Calling ${contractName}.${method}`, params);
  }

  contractError(contractName, method, error) {
    this.error(LOG_CATEGORIES.CONTRACT, `Contract ${contractName}.${method} failed`, error);
  }

  // Profile operations
  profileCreating(username, displayName) {
    this.progress(LOG_CATEGORIES.PROFILE, `Creating profile for ${username}...`, { 
      username, 
      displayName 
    });
  }

  profileCreated(profileId, txHash) {
    this.success(LOG_CATEGORIES.PROFILE, `Profile created successfully!`, { 
      profileId, 
      txHash 
    });
  }

  profileError(operation, error) {
    this.error(LOG_CATEGORIES.PROFILE, `Profile ${operation} failed`, error);
  }

  // Network operations
  networkConnecting(network, url) {
    this.progress(LOG_CATEGORIES.NETWORK, `Connecting to ${network}...`, { network, url });
  }

  networkConnected(network, chainId, blockNumber) {
    this.success(LOG_CATEGORIES.NETWORK, `Connected to ${network}`, { 
      network, 
      chainId, 
      blockNumber 
    });
  }

  networkError(network, error) {
    this.error(LOG_CATEGORIES.NETWORK, `Network ${network} connection failed`, error);
  }

  // Performance tracking
  performanceMetric(operation, duration, details) {
    this.info(LOG_CATEGORIES.PERFORMANCE, `${operation} completed in ${duration}ms`, details);
  }

  // System events
  systemStartup() {
    this.info(LOG_CATEGORIES.SYSTEM, `Aztlan application starting up...`, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  systemReady() {
    this.success(LOG_CATEGORIES.SYSTEM, `Aztlan application ready!`, {
      sessionId: getSessionId()
    });
  }

  systemError(component, error) {
    this.error(LOG_CATEGORIES.SYSTEM, `System error in ${component}`, error);
  }

  // Aztec-specific operations
  aztecInitializing(pxeUrl) {
    this.progress(LOG_CATEGORIES.NETWORK, `Initializing Aztec PXE connection...`, { pxeUrl });
  }

  aztecConnected(nodeInfo) {
    this.success(LOG_CATEGORIES.NETWORK, `Connected to Aztec Network`, nodeInfo);
  }

  aztecAccountDeploying(address) {
    this.progress(LOG_CATEGORIES.WALLET, `Deploying Aztec account...`, { 
      address: address?.slice(0, 10) + '...' + address?.slice(-8) 
    });
  }

  aztecAccountDeployed(address, txHash) {
    this.success(LOG_CATEGORIES.WALLET, `Aztec account deployed!`, { 
      address: address?.slice(0, 10) + '...' + address?.slice(-8), 
      txHash 
    });
  }

  aztecProofGenerating(operation) {
    this.progress(LOG_CATEGORIES.TRANSACTION, `Generating zero-knowledge proof for ${operation}...`);
  }

  aztecProofGenerated(operation, duration) {
    this.success(LOG_CATEGORIES.TRANSACTION, `ZK proof generated for ${operation}`, { 
      duration: `${duration}ms` 
    });
  }

  // Operation progress tracking
  operationStart(operationId, description) {
    this.progress(LOG_CATEGORIES.SYSTEM, `Starting: ${description}`, { operationId });
  }

  operationUpdate(operationId, progress, message) {
    this.progress(LOG_CATEGORIES.SYSTEM, `Progress (${progress}%): ${message}`, { 
      operationId, 
      progress 
    });
  }

  operationComplete(operationId, result) {
    this.success(LOG_CATEGORIES.SYSTEM, `Completed: ${operationId}`, result);
  }

  operationFailed(operationId, error) {
    this.error(LOG_CATEGORIES.SYSTEM, `Failed: ${operationId}`, error);
  }
}

// Singleton logger instance
export const logger = new AztlanLogger();

// Transaction progress tracker with detailed logging
export class TransactionTracker {
  constructor(type, description) {
    this.type = type;
    this.description = description;
    this.startTime = Date.now();
    this.txHash = null;
    this.stages = [];
    
    logger.operationStart(this.type, this.description);
  }

  setTxHash(txHash) {
    this.txHash = txHash;
    logger.transactionSigned(this.type, txHash);
  }

  addStage(stageName, message, data = null) {
    const stage = {
      name: stageName,
      message,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      data
    };
    
    this.stages.push(stage);
    logger.operationUpdate(this.type, null, `${stageName}: ${message}`);
    
    return stage;
  }

  updateProgress(progress, message) {
    logger.operationUpdate(this.type, progress, message);
  }

  complete(result = null) {
    const totalTime = Date.now() - this.startTime;
    logger.operationComplete(this.type, { 
      ...result, 
      totalTime: `${totalTime}ms`,
      stages: this.stages.length,
      txHash: this.txHash
    });
  }

  fail(error) {
    const totalTime = Date.now() - this.startTime;
    logger.operationFailed(this.type, { 
      error, 
      totalTime: `${totalTime}ms`,
      stages: this.stages.length,
      txHash: this.txHash
    });
  }

  getProgress() {
    return {
      type: this.type,
      description: this.description,
      startTime: this.startTime,
      elapsed: Date.now() - this.startTime,
      txHash: this.txHash,
      stages: this.stages
    };
  }
}

// Error boundary with logging
export const withLogging = (WrappedComponent, componentName) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
      logger.systemError(componentName, error);
      return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
      logger.systemError(componentName, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 bg-red-600/20 border border-red-600/40 rounded-lg">
            <h3 className="text-red-400 font-semibold">Component Error: {componentName}</h3>
            <p className="text-red-300 text-sm">An error occurred in this component. Check logs for details.</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              Retry
            </button>
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  };
};

// Performance monitoring with logging
export const measurePerformance = (operation, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    logger.debug(LOG_CATEGORIES.PERFORMANCE, `Starting ${operation}...`);
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      logger.performanceMetric(operation, Math.round(duration), { success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.performanceMetric(operation, Math.round(duration), { success: false, error: error.message });
      throw error;
    }
  };
};

// Hook for accessing logs in components
export const useLogs = () => {
  const store = useLoggingStore();
  return {
    logs: store.getFilteredLogs(),
    isVisible: store.isVisible,
    currentLevel: store.currentLevel,
    selectedCategory: store.selectedCategory,
    autoScroll: store.autoScroll,
    addLog: store.addLog,
    clearLogs: store.clearLogs,
    toggleVisibility: store.toggleVisibility,
    setLevel: store.setLevel,
    setCategory: store.setCategory,
    setAutoScroll: store.setAutoScroll,
    exportLogs: store.exportLogs
  };
};

// Initialize logging system
export const initializeLogging = () => {
  // Log system startup
  logger.systemStartup();
  
  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    logger.systemError('window', event.error);
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.systemError('promise', {
      reason: event.reason,
      promise: 'unhandled promise rejection'
    });
  });
  
  // Capture Aztec-specific events
  window.addEventListener('aztecTransactionComplete', (event) => {
    const { txHash, status, operationType } = event.detail;
    if (status === 'success') {
      logger.transactionConfirmed(txHash, null, null);
    } else {
      logger.transactionFailed(txHash, event.detail.error);
    }
  });
  
  window.addEventListener('aztecTransactionTimeout', (event) => {
    const { txHash, operationType } = event.detail;
    logger.error(LOG_CATEGORIES.TRANSACTION, `Transaction ${operationType} timeout`, { txHash });
  });
  
  // Performance observer for long tasks
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Log tasks longer than 50ms
          logger.warn(LOG_CATEGORIES.PERFORMANCE, `Long task detected: ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
  
  console.log('🔍 Aztlan logging system initialized');
};
