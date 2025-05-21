// src/components/ConnectWallet.js
import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';

function ConnectWallet() {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await connectWallet('obsidion');
      if (!result.success) {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await disconnectWallet();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while disconnecting');
    } finally {
      setIsLoading(false);
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="connect-wallet-container">
      {wallet.isConnected ? (
        <div className="wallet-connected">
          <span className="wallet-address">{formatAddress(wallet.address)}</span>
          <button 
            className="disconnect-button"
            onClick={handleDisconnect}
            disabled={isLoading}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      ) : (
        <button 
          className="connect-button"
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default ConnectWallet;
