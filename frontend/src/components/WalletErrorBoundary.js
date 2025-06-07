// src/components/WalletErrorBoundary.js - NEW FILE
import React from 'react';

class WalletErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Wallet Error:', error, errorInfo);
    // In production, send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary p-6 bg-red-600/10 border border-red-600/30 rounded-xl">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Wallet Connection Error
          </h2>
          <p className="text-red-300 text-sm mb-4">
            Something went wrong with the wallet connection. Please try refreshing the page.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm"
            >
              Refresh Page
            </button>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-red-400 cursor-pointer">
                Developer Info
              </summary>
              <pre className="text-xs text-red-300 mt-2 bg-red-900/20 p-2 rounded overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default WalletErrorBoundary;
