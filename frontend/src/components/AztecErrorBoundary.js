// src/components/AztecErrorBoundary.js - COMPLETE FIXED VERSION
import React from 'react';
import { FaExclamationTriangle, FaRedo, FaHome, FaCode, FaWifi } from 'react-icons/fa';

class AztecErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error) {
    const errorType = AztecErrorBoundary.getErrorType(error);
    return { 
      hasError: true, 
      error, 
      errorType 
    };
  }

  static getErrorType(error) {
    const message = error?.message?.toLowerCase() || '';
    const stack = error?.stack?.toLowerCase() || '';
    
    // Network and connection errors
    if (message.includes('pxe') || message.includes('connection') || message.includes('network')) {
      return 'connection';
    }
    if (message.includes('timeout') || message.includes('time out')) {
      return 'timeout';
    }
    if (message.includes('fetch') || message.includes('cors')) {
      return 'network';
    }
    
    // Aztec-specific errors
    if (message.includes('field_overflow') || message.includes('field overflow')) {
      return 'field_overflow';
    }
    if (message.includes('nullifier') || message.includes('double spend')) {
      return 'nullifier';
    }
    if (message.includes('insufficient') || message.includes('balance')) {
      return 'funds';
    }
    if (message.includes('contract') && message.includes('not found')) {
      return 'contract';
    }
    if (message.includes('account') && message.includes('not deployed')) {
      return 'account_not_deployed';
    }
    if (message.includes('simulation') && message.includes('failed')) {
      return 'simulation';
    }
    
    // Authentication and wallet errors
    if (message.includes('wallet') || message.includes('account')) {
      return 'wallet';
    }
    if (message.includes('signature') || message.includes('authorization')) {
      return 'auth';
    }
    
    // Browser and environment errors
    if (message.includes('wasm') || message.includes('webassembly')) {
      return 'wasm';
    }
    if (stack.includes('webpack') || stack.includes('chunk')) {
      return 'build';
    }
    
    // Proof generation errors
    if (message.includes('proof') || message.includes('circuit')) {
      return 'proof';
    }
    
    return 'unknown';
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Aztec Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Enhanced error reporting
    this.reportError(error, errorInfo);
    
    // Listen for Aztec-specific events
    this.setupEventListeners();
  }

  setupEventListeners = () => {
    // Listen for Aztec transaction failures
    window.addEventListener('aztecTransactionTimeout', this.handleAztecTimeout);
    window.addEventListener('aztecConnectionLost', this.handleConnectionLost);
  }

  handleAztecTimeout = (event) => {
    console.warn('🕒 Aztec transaction timeout detected:', event.detail);
    this.setState({
      hasError: true,
      error: new Error('Aztec transaction timeout'),
      errorType: 'timeout'
    });
  }

  handleConnectionLost = (event) => {
    console.warn('📡 Aztec connection lost:', event.detail);
    this.setState({
      hasError: true,
      error: new Error('Lost connection to Aztec Network'),
      errorType: 'connection'
    });
  }

  reportError = (error, errorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorType: this.state.errorType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('aztec_wallet_address') || 'anonymous',
      aztecMode: localStorage.getItem('aztec_use_mock') === 'true' ? 'mock' : 'real',
      environment: process.env.NODE_ENV
    };
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to your error tracking service
        console.log('📊 Error report prepared for tracking service:', errorReport);
      } catch (reportingError) {
        console.error('Failed to report error:', reportingError);
      }
    } else {
      console.log('🐛 Development error report:', errorReport);
    }
  }

  getErrorDetails = () => {
    const { errorType } = this.state;
    
    const errorDetails = {
      connection: {
        title: 'Aztec Network Connection Error',
        description: 'Unable to connect to Aztec testnet',
        userMessage: 'There seems to be a problem connecting to the Aztec Network. This could be due to network issues, testnet maintenance, or the PXE service being temporarily unavailable.',
        solutions: [
          'Check your internet connection',
          'Verify Aztec testnet status',
          'Try switching to mock mode for development',
          'Wait a few minutes and try again',
          'Clear browser cache and reload'
        ],
        icon: '🌐',
        severity: 'high',
        canRetry: true,
        autoRetry: true
      },
      
      timeout: {
        title: 'Aztec Transaction Timeout',
        description: 'Operation took longer than expected',
        userMessage: 'The transaction is taking longer than usual. Aztec testnet blocks take about 36 seconds to process, and proof generation can take 2-5 minutes.',
        solutions: [
          'Wait longer (testnet can be slow)',
          'Check transaction status manually in 5-10 minutes',
          'Try again with longer timeout',
          'Switch to mock mode for faster testing',
          'Transaction may still complete in background'
        ],
        icon: '⏰',
        severity: 'medium',
        canRetry: true,
        autoRetry: false
      },
      
      field_overflow: {
        title: 'Aztec Field Overflow',
        description: 'Input value exceeds Aztec field capacity',
        userMessage: 'The value you entered is too large for Aztec\'s cryptographic field. Aztec uses finite field arithmetic with specific limits.',
        solutions: [
          'Use smaller numeric values',
          'Break large operations into smaller parts',
          'Check input validation logic',
          'Use proper field arithmetic functions'
        ],
        icon: '📊',
        severity: 'medium',
        canRetry: false,
        autoRetry: false
      },
      
      account_not_deployed: {
        title: 'Aztec Account Not Deployed',
        description: 'Account contract not found on testnet',
        userMessage: 'Your Aztec account hasn\'t been deployed to the testnet yet. This happens when you create a new account but haven\'t completed the deployment process.',
        solutions: [
          'Complete account deployment process',
          'Wait for deployment transaction to confirm',
          'Check if deployment was interrupted',
          'Try creating account again',
          'Switch to mock mode to test without deployment'
        ],
        icon: '👤',
        severity: 'high',
        canRetry: true,
        autoRetry: false
      },
      
      proof: {
        title: 'Proof Generation Failed',
        description: 'Zero-knowledge proof generation error',
        userMessage: 'Failed to generate zero-knowledge proofs for your transaction. This can happen due to browser limitations, memory issues, or circuit compilation problems.',
        solutions: [
          'Refresh the page and try again',
          'Close other browser tabs to free memory',
          'Try in a different browser (Chrome recommended)',
          'Switch to mock mode for testing',
          'Check browser console for detailed errors'
        ],
        icon: '🔐',
        severity: 'high',
        canRetry: true,
        autoRetry: false
      },
      
      contract: {
        title: 'Smart Contract Error',
        description: 'Contract not found or not registered',
        userMessage: 'The smart contract is not properly registered with your PXE or the contract address is incorrect. This usually happens when connecting to a fresh wallet.',
        solutions: [
          'Register contracts with PXE',
          'Check contract deployment status',
          'Verify contract addresses in .env file',
          'Clear PXE database and re-register',
          'Check if contracts are deployed on current network'
        ],
        icon: '📜',
        severity: 'high',
        canRetry: true,
        autoRetry: false
      },
      
      funds: {
        title: 'Insufficient Funds',
        description: 'Not enough balance for transaction',
        userMessage: 'You don\'t have enough funds to complete this transaction. On Aztec testnet, you can use sponsored transactions or get testnet tokens.',
        solutions: [
          'Use sponsored FPC for fee-less transactions',
          'Get testnet ETH from Sepolia faucet',
          'Check if sponsored transactions are enabled',
          'Verify wallet balance and token approval'
        ],
        icon: '💰',
        severity: 'high',
        canRetry: false,
        autoRetry: false
      },
      
      wallet: {
        title: 'Wallet Connection Error',
        description: 'Problem with wallet connection or account',
        userMessage: 'There\'s an issue with your wallet connection. This could be due to account setup problems or wallet state corruption.',
        solutions: [
          'Disconnect and reconnect wallet',
          'Try creating a new wallet',
          'Clear browser storage and restart',
          'Switch to mock mode temporarily',
          'Check wallet is properly deployed'
        ],
        icon: '👛',
        severity: 'high',
        canRetry: true,
        autoRetry: false
      },
      
      wasm: {
        title: 'WebAssembly Error',
        description: 'Browser WASM support issue',
        userMessage: 'Your browser is having trouble loading WebAssembly modules required for Aztec operations. This can happen with older browsers or strict security settings.',
        solutions: [
          'Update your browser to the latest version',
          'Enable WebAssembly in browser settings',
          'Try in Chrome or Firefox',
          'Disable browser extensions temporarily',
          'Switch to mock mode for testing'
        ],
        icon: '🔧',
        severity: 'high',
        canRetry: true,
        autoRetry: false
      },
      
      build: {
        title: 'Application Build Error',
        description: 'Frontend build or chunk loading error',
        userMessage: 'There\'s a problem with the application build. This usually happens after updates or due to caching issues.',
        solutions: [
          'Hard refresh the page (Ctrl+F5)',
          'Clear browser cache completely',
          'Try in incognito/private mode',
          'Check internet connection',
          'Wait a few minutes and try again'
        ],
        icon: '⚙️',
        severity: 'medium',
        canRetry: true,
        autoRetry: true
      },
      
      network: {
        title: 'Network Error',
        description: 'Internet or API connection problem',
        userMessage: 'Unable to reach required services. This could be due to internet connectivity issues or service outages.',
        solutions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Check if other websites work',
          'Wait a few minutes and retry',
          'Try using a VPN if blocked'
        ],
        icon: '📡',
        severity: 'high',
        canRetry: true,
        autoRetry: true
      },
      
      simulation: {
        title: 'Transaction Simulation Failed',
        description: 'Transaction would fail if executed',
        userMessage: 'The transaction simulation failed, which means the transaction would revert if sent to the blockchain. This helps prevent failed transactions.',
        solutions: [
          'Check transaction parameters',
          'Verify contract state and permissions',
          'Ensure sufficient balance and approvals',
          'Check if contract function exists',
          'Review transaction logic'
        ],
        icon: '🎯',
        severity: 'medium',
        canRetry: false,
        autoRetry: false
      },
      
      unknown: {
        title: 'Unexpected Error',
        description: 'An unknown error occurred',
        userMessage: 'Something unexpected happened. This might be a temporary issue with the application, network, or a new type of error.',
        solutions: [
          'Refresh the page and try again',
          'Clear browser cache and cookies',
          'Try in a different browser',
          'Switch to mock mode for testing',
          'Report this error if it persists'
        ],
        icon: '❗',
        severity: 'medium',
        canRetry: true,
        autoRetry: false
      }
    };

    return errorDetails[errorType] || errorDetails.unknown;
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });
    
    try {
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset error state
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null, 
        errorType: 'unknown',
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      });
      
      console.log('🔄 Retrying after error...');
    } catch (retryError) {
      console.error('❌ Retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  }

  handleSwitchToMock = () => {
    localStorage.setItem('aztec_use_mock', 'true');
    window.location.reload();
  }

  handleForceRefresh = () => {
    // Clear all Aztec-related storage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('aztec_') || key.startsWith('aztlan_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Force hard refresh
    window.location.href = window.location.href;
  }

  componentWillUnmount() {
    // Cleanup event listeners
    window.removeEventListener('aztecTransactionTimeout', this.handleAztecTimeout);
    window.removeEventListener('aztecConnectionLost', this.handleConnectionLost);
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = this.getErrorDetails();
      const { error, retryCount, isRetrying } = this.state;

      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-[#121212] rounded-xl border border-red-500/20 overflow-hidden">
              {/* Header */}
              <div className="bg-red-600/10 border-b border-red-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{errorDetails.icon}</div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-red-400">
                      {errorDetails.title}
                    </h1>
                    <p className="text-red-300/80 text-sm mt-1">
                      {errorDetails.description}
                    </p>
                    {retryCount > 0 && (
                      <p className="text-orange-400 text-xs mt-2">
                        Retry attempt: {retryCount}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    errorDetails.severity === 'high' ? 'bg-red-600/20 text-red-400' :
                    errorDetails.severity === 'medium' ? 'bg-orange-600/20 text-orange-400' :
                    'bg-blue-600/20 text-blue-400'
                  }`}>
                    {errorDetails.severity} priority
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User-friendly explanation */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FaExclamationTriangle className="text-yellow-400" size={16} />
                    What happened?
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {errorDetails.userMessage}
                  </p>
                </div>

                {/* Solutions */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FaCode className="text-blue-400" size={16} />
                    How to fix this:
                  </h3>
                  <ul className="space-y-2">
                    {errorDetails.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-white/80">
                        <span className="text-green-400 mt-0.5 font-bold">•</span>
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {errorDetails.canRetry && (
                    <button
                      onClick={this.handleRetry}
                      disabled={isRetrying}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition"
                    >
                      {isRetrying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <FaRedo size={14} />
                          Try Again
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaRedo size={14} />
                    Soft Refresh
                  </button>
                  
                  <button
                    onClick={this.handleForceRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaRedo size={14} />
                    Hard Reset
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaHome size={14} />
                    Go Home
                  </button>

                  {(errorDetails.severity === 'high' || this.state.errorType === 'connection') && (
                    <button
                      onClick={this.handleSwitchToMock}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition"
                    >
                      <FaWifi size={14} />
                      Switch to Mock Mode
                    </button>
                  )}
                </div>

                {/* Network status */}
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                  <h4 className="text-blue-400 font-medium text-sm mb-2">🌐 Aztec Network Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-blue-300">PXE URL:</span>
                      <p className="text-white/80 font-mono text-xs break-all">
                        {process.env.REACT_APP_PXE_URL || 'https://aztec-alpha-testnet-fullnode.zkv.xyz'}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-300">Mode:</span>
                      <p className="text-white/80">
                        {localStorage.getItem('aztec_use_mock') === 'true' ? 'Mock' : 'Real'} Mode
                      </p>
                    </div>
                  </div>
                </div>

                {/* Developer info */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="bg-red-900/20 rounded-lg">
                    <summary className="p-3 cursor-pointer text-sm font-medium text-red-400 hover:text-red-300">
                      🐛 Developer Information
                    </summary>
                    <div className="p-3 pt-0 border-t border-red-500/20">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-red-400 mb-1">Error Type:</h4>
                          <code className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                            {this.state.errorType}
                          </code>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-semibold text-red-400 mb-1">Error Message:</h4>
                          <pre className="text-xs text-red-300 bg-red-900/30 p-2 rounded overflow-auto">
                            {error?.toString()}
                          </pre>
                        </div>
                        
                        {this.state.errorInfo && (
                          <div>
                            <h4 className="text-xs font-semibold text-red-400 mb-1">Component Stack:</h4>
                            <pre className="text-xs text-red-300 bg-red-900/30 p-2 rounded overflow-auto max-h-32">
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-xs font-semibold text-red-400 mb-1">Stack Trace:</h4>
                          <pre className="text-xs text-red-300 bg-red-900/30 p-2 rounded overflow-auto max-h-40">
                            {error?.stack}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                {/* Help text */}
                <div className="text-center pt-4 border-t border-white/10">
                  <p className="text-white/50 text-sm">
                    Need help? Check the{' '}
                    <a 
                      href="https://docs.aztec.network" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Aztec Documentation
                    </a>
                    {' '}or join the{' '}
                    <a 
                      href="https://discord.gg/aztec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Discord Community
                    </a>
                  </p>
                  <p className="text-white/40 text-xs mt-2">
                    Error ID: {Date.now().toString(36)} • {new Date().toISOString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AztecErrorBoundary;
