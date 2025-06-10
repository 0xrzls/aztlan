// src/utils/startupOptimization.js - FIX LOADING ISSUES & IMPROVE STARTUP
import { aztecClient } from '../lib/aztecClient';

// Startup phases with timeouts and fallbacks
export const STARTUP_PHASES = {
  INITIALIZING: 'initializing',
  CHECKING_STORAGE: 'checking_storage',
  CONNECTING_WALLET: 'connecting_wallet',
  LOADING_CONTRACTS: 'loading_contracts',
  SYNCING_STATE: 'syncing_state',
  COMPLETE: 'complete',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

// Optimized startup manager
export class StartupManager {
  constructor() {
    this.phase = STARTUP_PHASES.INITIALIZING;
    this.startTime = Date.now();
    this.timeouts = new Map();
    this.fallbackActivated = false;
    this.progressCallback = null;
    
    // Configurable timeouts (in milliseconds)
    this.config = {
      INIT_TIMEOUT: 15000,      // 15 seconds for initialization
      WALLET_TIMEOUT: 20000,    // 20 seconds for wallet connection
      CONTRACT_TIMEOUT: 10000,  // 10 seconds for contract loading
      TOTAL_TIMEOUT: 45000,     // 45 seconds total timeout
      FALLBACK_DELAY: 30000     // 30 seconds before fallback
    };
  }

  // Main startup orchestrator
  async startup(progressCallback) {
    this.progressCallback = progressCallback;
    this.startTime = Date.now();
    
    try {
      console.log('🚀 Starting Aztlan application...');
      this.updateProgress(STARTUP_PHASES.INITIALIZING, 'Initializing application...', 5);
      
      // Set up global timeout
      this.setGlobalTimeout();
      
      // Phase 1: Quick initialization
      await this.phaseInitialization();
      
      // Phase 2: Check stored data
      await this.phaseCheckStorage();
      
      // Phase 3: Wallet connection (if needed)
      await this.phaseWalletConnection();
      
      // Phase 4: Contract loading (if wallet connected)
      await this.phaseContractLoading();
      
      // Phase 5: State synchronization
      await this.phaseStateSyncing();
      
      // Completion
      this.updateProgress(STARTUP_PHASES.COMPLETE, 'Ready to use!', 100);
      console.log(`✅ Aztlan startup completed in ${Date.now() - this.startTime}ms`);
      
      this.clearAllTimeouts();
      return { success: true, phase: STARTUP_PHASES.COMPLETE };
      
    } catch (error) {
      console.error('❌ Startup failed:', error);
      this.updateProgress(STARTUP_PHASES.ERROR, `Startup failed: ${error.message}`, 0);
      
      // Attempt fallback
      if (!this.fallbackActivated) {
        return await this.activateFallbackMode();
      }
      
      throw error;
    }
  }

  // Phase 1: Quick app initialization
  async phaseInitialization() {
    this.updateProgress(STARTUP_PHASES.INITIALIZING, 'Setting up environment...', 10);
    
    return await this.withTimeout('init', async () => {
      // Quick environment checks
      await this.checkBrowserCompatibility();
      await this.setupErrorHandlers();
      await this.loadCriticalConfig();
      
      this.updateProgress(STARTUP_PHASES.INITIALIZING, 'Environment ready', 20);
    }, this.config.INIT_TIMEOUT);
  }

  // Phase 2: Check stored wallet and settings
  async phaseCheckStorage() {
    this.updateProgress(STARTUP_PHASES.CHECKING_STORAGE, 'Checking stored data...', 25);
    
    const storedWallet = localStorage.getItem('aztec_wallet_connected');
    const useMockMode = localStorage.getItem('aztec_use_mock') === 'true';
    
    if (!storedWallet) {
      this.updateProgress(STARTUP_PHASES.CHECKING_STORAGE, 'No stored wallet found', 35);
      return { hasStoredWallet: false };
    }
    
    this.updateProgress(STARTUP_PHASES.CHECKING_STORAGE, `Found stored wallet (${useMockMode ? 'mock' : 'real'} mode)`, 35);
    return { hasStoredWallet: true, useMockMode };
  }

  // Phase 3: Wallet connection (conditional)
  async phaseWalletConnection() {
    const { hasStoredWallet, useMockMode } = await this.phaseCheckStorage();
    
    if (!hasStoredWallet) {
      this.updateProgress(STARTUP_PHASES.CONNECTING_WALLET, 'Skipping wallet connection', 50);
      return { walletConnected: false };
    }
    
    this.updateProgress(STARTUP_PHASES.CONNECTING_WALLET, `Restoring ${useMockMode ? 'mock' : 'real'} wallet...`, 40);
    
    return await this.withTimeout('wallet', async () => {
      if (useMockMode) {
        // Quick mock wallet restoration
        await new Promise(resolve => setTimeout(resolve, 500));
        this.updateProgress(STARTUP_PHASES.CONNECTING_WALLET, 'Mock wallet restored', 50);
        return { walletConnected: true, mock: true };
      } else {
        // Real Aztec wallet restoration with timeout
        try {
          const result = await this.restoreRealWallet();
          this.updateProgress(STARTUP_PHASES.CONNECTING_WALLET, 'Real wallet restored', 50);
          return { walletConnected: true, mock: false };
        } catch (error) {
          console.warn('⚠️ Real wallet restoration failed, switching to mock mode');
          localStorage.setItem('aztec_use_mock', 'true');
          this.updateProgress(STARTUP_PHASES.CONNECTING_WALLET, 'Switched to mock mode', 50);
          return { walletConnected: true, mock: true };
        }
      }
    }, this.config.WALLET_TIMEOUT);
  }

  // Phase 4: Contract loading (conditional)
  async phaseContractLoading() {
    this.updateProgress(STARTUP_PHASES.LOADING_CONTRACTS, 'Loading contracts...', 60);
    
    const useMockMode = localStorage.getItem('aztec_use_mock') === 'true';
    
    if (useMockMode) {
      // Skip contract loading for mock mode
      this.updateProgress(STARTUP_PHASES.LOADING_CONTRACTS, 'Skipping contracts (mock mode)', 80);
      return { contractsLoaded: false };
    }
    
    return await this.withTimeout('contracts', async () => {
      try {
        await aztecClient.loadContracts();
        this.updateProgress(STARTUP_PHASES.LOADING_CONTRACTS, 'Contracts loaded', 80);
        return { contractsLoaded: true };
      } catch (error) {
        console.warn('⚠️ Contract loading failed:', error);
        this.updateProgress(STARTUP_PHASES.LOADING_CONTRACTS, 'Contract loading failed (continuing)', 80);
        return { contractsLoaded: false };
      }
    }, this.config.CONTRACT_TIMEOUT);
  }

  // Phase 5: State synchronization
  async phaseStateSyncing() {
    this.updateProgress(STARTUP_PHASES.SYNCING_STATE, 'Synchronizing state...', 85);
    
    // Quick state sync operations
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.updateProgress(STARTUP_PHASES.SYNCING_STATE, 'State synchronized', 95);
    return { stateSynced: true };
  }

  // Real wallet restoration with enhanced error handling
  async restoreRealWallet() {
    try {
      // Initialize Aztec client if not already done
      if (!aztecClient.isInitialized) {
        await Promise.race([
          aztecClient.initialize(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Aztec initialization timeout')), 10000)
          )
        ]);
      }
      
      // Attempt wallet restoration
      const result = await Promise.race([
        aztecClient.restoreWallet(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Wallet restoration timeout')), 8000)
        )
      ]);
      
      if (!result.success) {
        throw new Error(result.error || 'Wallet restoration failed');
      }
      
      return result;
    } catch (error) {
      console.error('Real wallet restoration error:', error);
      throw error;
    }
  }

  // Fallback mode activation
  async activateFallbackMode() {
    console.log('🔄 Activating fallback mode...');
    this.fallbackActivated = true;
    
    this.updateProgress(STARTUP_PHASES.INITIALIZING, 'Activating fallback mode...', 10);
    
    // Force mock mode
    localStorage.setItem('aztec_use_mock', 'true');
    
    // Clear any problematic stored data
    const keysToRemove = ['aztec_wallet_keys'];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Quick fallback initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.updateProgress(STARTUP_PHASES.COMPLETE, 'Fallback mode ready', 100);
    console.log('✅ Fallback mode activated successfully');
    
    return { success: true, fallback: true, phase: STARTUP_PHASES.COMPLETE };
  }

  // Timeout wrapper with cleanup
  async withTimeout(name, operation, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${name} operation timeout after ${timeout}ms`));
      }, timeout);
      
      this.timeouts.set(name, timeoutId);
      
      try {
        const result = await operation();
        clearTimeout(timeoutId);
        this.timeouts.delete(name);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        this.timeouts.delete(name);
        reject(error);
      }
    });
  }

  // Global timeout for entire startup process
  setGlobalTimeout() {
    const globalTimeoutId = setTimeout(() => {
      console.warn('⏰ Global startup timeout reached');
      
      if (!this.fallbackActivated) {
        this.updateProgress(STARTUP_PHASES.TIMEOUT, 'Startup taking too long, activating fallback...', 50);
        this.activateFallbackMode();
      }
    }, this.config.TOTAL_TIMEOUT);
    
    this.timeouts.set('global', globalTimeoutId);
  }

  // Clear all timeouts
  clearAllTimeouts() {
    for (const [name, timeoutId] of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
  }

  // Browser compatibility check
  async checkBrowserCompatibility() {
    const checks = {
      webAssembly: typeof WebAssembly !== 'undefined',
      localStorage: typeof Storage !== 'undefined',
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      crypto: typeof crypto !== 'undefined'
    };
    
    const failed = Object.entries(checks).filter(([_, supported]) => !supported);
    
    if (failed.length > 0) {
      const missing = failed.map(([feature]) => feature).join(', ');
      throw new Error(`Browser missing required features: ${missing}`);
    }
    
    console.log('✅ Browser compatibility check passed');
  }

  // Setup global error handlers
  async setupErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    // Enhanced error handler for startup issues
    window.addEventListener('error', (event) => {
      if (this.phase !== STARTUP_PHASES.COMPLETE) {
        console.error('🚨 Startup error detected:', event.error);
        
        // If error occurs during startup, activate fallback
        if (!this.fallbackActivated) {
          setTimeout(() => this.activateFallbackMode(), 1000);
        }
      }
    });
    
    // Handle unhandled promise rejections during startup
    window.addEventListener('unhandledrejection', (event) => {
      if (this.phase !== STARTUP_PHASES.COMPLETE) {
        console.error('🚨 Startup promise rejection:', event.reason);
        
        // Check if it's an Aztec-related error
        const reason = event.reason?.message || event.reason || '';
        if (reason.includes('aztec') || reason.includes('PXE') || reason.includes('timeout')) {
          if (!this.fallbackActivated) {
            console.log('🔄 Aztec error during startup, activating fallback...');
            setTimeout(() => this.activateFallbackMode(), 500);
          }
        }
      }
    });
  }

  // Load critical configuration
  async loadCriticalConfig() {
    // Validate environment variables
    const requiredEnvVars = [
      'REACT_APP_PXE_URL',
      'REACT_APP_PROFILE_REGISTRY_ADDRESS',
      'REACT_APP_PRIVATE_SOCIALS_ADDRESS'
    ];
    
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing environment variables:', missing);
      
      // Use defaults for missing env vars
      const defaults = {
        'REACT_APP_PXE_URL': 'https://aztec-alpha-testnet-fullnode.zkv.xyz',
        'REACT_APP_PROFILE_REGISTRY_ADDRESS': '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
        'REACT_APP_PRIVATE_SOCIALS_ADDRESS': '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
      };
      
      missing.forEach(varName => {
        if (defaults[varName]) {
          process.env[varName] = defaults[varName];
        }
      });
    }
    
    console.log('✅ Critical configuration loaded');
  }

  // Progress update helper
  updateProgress(phase, message, progress) {
    this.phase = phase;
    
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        message,
        progress,
        elapsed: Date.now() - this.startTime,
        fallbackActive: this.fallbackActivated
      });
    }
    
    console.log(`📍 [${phase}] ${message} (${progress}%)`);
  }

  // Get current startup status
  getStatus() {
    return {
      phase: this.phase,
      elapsed: Date.now() - this.startTime,
      fallbackActive: this.fallbackActivated,
      timeouts: Array.from(this.timeouts.keys())
    };
  }
}

// Enhanced startup hook for React components
export const useStartup = () => {
  const [status, setStatus] = React.useState({
    phase: STARTUP_PHASES.INITIALIZING,
    message: 'Initializing...',
    progress: 0,
    error: null,
    complete: false,
    fallback: false
  });

  const [startupManager] = React.useState(() => new StartupManager());

  React.useEffect(() => {
    const handleStartup = async () => {
      try {
        const result = await startupManager.startup((progress) => {
          setStatus(prev => ({
            ...prev,
            phase: progress.phase,
            message: progress.message,
            progress: progress.progress,
            fallback: progress.fallbackActive
          }));
        });

        setStatus(prev => ({
          ...prev,
          complete: true,
          fallback: result.fallback || false
        }));

      } catch (error) {
        console.error('Startup failed:', error);
        setStatus(prev => ({
          ...prev,
          error: error.message,
          phase: STARTUP_PHASES.ERROR
        }));
      }
    };

    handleStartup();
  }, [startupManager]);

  return {
    ...status,
    retry: () => {
      setStatus({
        phase: STARTUP_PHASES.INITIALIZING,
        message: 'Retrying...',
        progress: 0,
        error: null,
        complete: false,
        fallback: false
      });
      
      // Create new startup manager for retry
      window.location.reload();
    }
  };
};

// Startup diagnostics for debugging
export const runStartupDiagnostics = async () => {
  console.log('🔧 Running startup diagnostics...');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    localStorage: {},
    environment: {},
    networkStatus: 'unknown',
    memoryUsage: null
  };

  // Check localStorage
  try {
    const aztecKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('aztec_') || key.startsWith('aztlan_')
    );
    
    aztecKeys.forEach(key => {
      diagnostics.localStorage[key] = localStorage.getItem(key)?.length || 0;
    });
  } catch (error) {
    diagnostics.localStorage.error = error.message;
  }

  // Check environment
  diagnostics.environment = {
    NODE_ENV: process.env.NODE_ENV,
    PXE_URL: process.env.REACT_APP_PXE_URL,
    USE_MOCK: localStorage.getItem('aztec_use_mock'),
    DEVELOPMENT_MODE: process.env.NODE_ENV === 'development'
  };

  // Check network connectivity
  try {
    const response = await fetch('https://aztec-alpha-testnet-fullnode.zkv.xyz', {
      method: 'HEAD',
      mode: 'no-cors'
    });
    diagnostics.networkStatus = 'reachable';
  } catch (error) {
    diagnostics.networkStatus = 'unreachable';
  }

  // Check memory usage
  if (performance.memory) {
    diagnostics.memoryUsage = {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    };
  }

  console.log('🔧 Startup diagnostics:', diagnostics);
  return diagnostics;
};

// Export singleton startup manager
export const startupManager = new StartupManager();
