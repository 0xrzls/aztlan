// src/components/AztecErrorBoundary.js - COMPREHENSIVE ERROR HANDLING
import React from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class AztecErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error) {
    // Analyze error type for better user experience
    const errorType = AztecErrorBoundary.getErrorType(error);
    return { 
      hasError: true, 
      error, 
      errorType 
    };
  }

  static getErrorType(error) {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('pxe') || message.includes('connection')) {
      return 'connection';
    }
    if (message.includes('field_overflow') || message.includes('field overflow')) {
      return 'field_overflow';
    }
    if (message.includes('nullifier') || message.includes('double spend')) {
      return 'nullifier';
    }
    if (message.includes('timeout') || message.includes('time out')) {
      return 'timeout';
    }
    if (message.includes('insufficient') || message.includes('balance')) {
      return 'funds';
    }
    if (message.includes('contract') && message.includes('not found')) {
      return 'contract';
    }
    if (message.includes('wallet') || message.includes('account')) {
      return 'wallet';
    }
    if (message.includes('signature') || message.includes('authorization')) {
      return 'auth';
    }
    
    return 'unknown';
  }

  componentDidCatch(error, errorInfo) {
    console.error('Aztec Error Boundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    try {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.log('Error reported to tracking service');
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  getErrorDetails = () => {
    const { error, errorType } = this.state;
    
    const errorDetails = {
      connection: {
        title: 'Connection Error',
        description: 'Unable to connect to Aztec Network',
        userMessage: 'There seems to be a problem connecting to the Aztec Network. This could be due to network issues or the testnet being temporarily unavailable.',
        solutions: [
          'Check your internet connection',
          'Try switching to mock mode for testing',
          'Wait a few minutes and try again',
          'Check Aztec Network status'
        ],
        icon: '🌐',
        severity: 'high'
      },
      field_overflow: {
        title: 'Value Too Large',
        description: 'Input value exceeds Aztec field capacity',
        userMessage: 'The value you entered is too large for Aztec\'s cryptographic field. Please use smaller numbers.',
        solutions: [
          'Use smaller numeric values',
          'Break large operations into smaller parts',
          'Check input validation'
        ],
        icon: '📊',
        severity: 'medium'
      },
      nullifier: {
        title: 'Transaction Already Processed',
        description: 'This transaction has already been executed',
        userMessage: 'This transaction was already processed on the blockchain. This prevents double-spending and maintains privacy.',
        solutions: [
          'Check transaction history',
          'Refresh the page to see updated state',
          'Try a different operation'
        ],
        icon: '🔒',
        severity: 'low'
      },
      timeout: {
        title: 'Transaction Timeout',
        description: 'Operation took longer than expected',
        userMessage: 'The transaction is taking longer than usual. Aztec testnet blocks take about 36 seconds to process.',
        solutions: [
          'Wait a bit longer (testnet can be slow)',
          'Check transaction status manually',
          'Try again with longer timeout',
          'Switch to mock mode for faster testing'
        ],
        icon: '⏰',
        severity: 'medium'
      },
      funds: {
        title: 'Insufficient Funds',
        description: 'Not enough balance for transaction',
        userMessage: 'You don\'t have enough funds to complete this transaction. Get testnet tokens from the faucet.',
        solutions: [
          'Use testnet faucet to get funds',
          'Check if contract supports sponsored transactions',
          'Verify wallet balance'
        ],
        icon: '💰',
        severity: 'high'
      },
      contract: {
        title: 'Contract Not Found',
        description: 'Smart contract is not properly registered',
        userMessage: 'The smart contract is not registered in your PXE. This usually happens when connecting to a fresh wallet.',
        solutions: [
          'Register the contract with PXE',
          'Check contract deployment status',
          'Verify contract addresses'
        ],
        icon: '📜',
        severity: 'high'
      },
      wallet: {
        title: 'Wallet Error',
        description: 'Problem with wallet connection or account',
        userMessage: 'There\'s an issue with your wallet connection. Try reconnecting or creating a new wallet.',
        solutions: [
          'Disconnect and reconnect wallet',
          'Try creating a new wallet',
          'Clear browser storage and restart',
          'Switch to mock mode temporarily'
        ],
        icon: '👛',
        severity: 'high'
      },
      auth: {
        title: 'Authorization Failed',
        description: 'Transaction signature or authorization failed',
        userMessage: 'The transaction could not be authorized. This might be due to signature issues or account permissions.',
        solutions: [
          'Try signing the transaction again',
          'Check account permissions',
          'Verify wallet is properly connected'
        ],
        icon: '🔐',
        severity: 'medium'
      },
      unknown: {
        title: 'Unexpected Error',
        description: 'An unknown error occurred',
        userMessage: 'Something unexpected happened. This might be a temporary issue with the application or network.',
        solutions: [
          'Refresh the page and try again',
          'Clear browser cache',
          'Try in a different browser',
          'Switch to mock mode for testing'
        ],
        icon: '❗',
        severity: 'medium'
      }
    };

    return errorDetails[errorType] || errorDetails.unknown;
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      errorType: 'unknown' 
    });
  }

  handleSwitchToMock = () => {
    // Switch to mock mode and retry
    localStorage.setItem('aztec_use_mock', 'true');
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      const errorDetails = this.getErrorDetails();
      const { error } = this.state;

      return (
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-[#121212] rounded-xl border border-red-500/20 overflow-hidden">
              {/* Header */}
              <div className="bg-red-600/10 border-b border-red-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{errorDetails.icon}</div>
                  <div>
                    <h1 className="text-2xl font-bold text-red-400">
                      {errorDetails.title}
                    </h1>
                    <p className="text-red-300/80 text-sm mt-1">
                      {errorDetails.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* User-friendly explanation */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">What happened?</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {errorDetails.userMessage}
                  </p>
                </div>

                {/* Solutions */}
                <div>
                  <h3 className="font-semibold mb-3">How to fix this:</h3>
                  <ul className="space-y-2">
                    {errorDetails.solutions.map((solution, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-white/80">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{solution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaRedo size={14} />
                    Try Again
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaRedo size={14} />
                    Refresh Page
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition"
                  >
                    <FaHome size={14} />
                    Go Home
                  </button>

                  {errorDetails.severity === 'high' && (
                    <button
                      onClick={this.handleSwitchToMock}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm font-medium transition"
                    >
                      <FaExclamationTriangle size={14} />
                      Switch to Mock Mode
                    </button>
                  )}
                </div>

                {/* Developer info */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="bg-red-900/20 rounded-lg">
                    <summary className="p-3 cursor-pointer text-sm font-medium text-red-400 hover:text-red-300">
                      Developer Information
                    </summary>
                    <div className="p-3 pt-0 border-t border-red-500/20">
                      <div className="space-y-3">
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
                          <h4 className="text-xs font-semibold text-red-400 mb-1">Error Type:</h4>
                          <code className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                            {this.state.errorType}
                          </code>
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
                    {' '}or{' '}
                    <a 
                      href="https://discord.gg/aztec" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Discord Community
                    </a>
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
