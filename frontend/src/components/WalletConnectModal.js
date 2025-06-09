// src/components/WalletConnectModal.js - UPDATED FOR REAL AZTEC
import React, { useState } from 'react';
import { FaTimes, FaPlus, FaCog, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import useWalletStore from '../store/walletStore';

const WalletConnectModal = ({ isOpen, onClose }) => {
  const { 
    connectWallet, 
    isLoading, 
    error, 
    developmentMode, 
    useMockData, 
    toggleMockMode 
  } = useWalletStore();
  
  const [connecting, setConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const walletOptions = [
    {
      id: 'create',
      name: 'Create Aztec Wallet',
      description: useMockData 
        ? 'Generate a mock wallet for development' 
        : 'Generate a new Aztec wallet on testnet',
      icon: '/icons/create-wallet.svg',
      available: true,
      recommended: true,
      status: useMockData ? 'mock' : 'real'
    },
    {
      id: 'restore',
      name: 'Restore Existing Wallet',
      description: 'Restore from private key or seed phrase',
      icon: '/icons/restore-wallet.svg',
      available: false,
      comingSoon: true
    },
    {
      id: 'browser',
      name: 'Browser Extension',
      description: 'Connect via Aztec browser extension',
      icon: '/wallets/aztec-extension.svg',
      available: false,
      comingSoon: true
    }
  ];

  const handleConnectWallet = async (providerName) => {
    setConnecting(true);
    setConnectingProvider(providerName);
    
    try {
      const result = await connectWallet(providerName);
      
      if (result.success) {
        onClose();
      }
      // Error handling sudah di store
    } catch (err) {
      console.error('Connection error:', err);
    } finally {
      setConnecting(false);
      setConnectingProvider(null);
    }
  };

  const getConnectionStatusMessage = () => {
    if (useMockData) {
      return {
        type: 'warning',
        title: 'Development Mode',
        message: 'Using mock data for testing. Toggle below to use real Aztec Network.'
      };
    } else {
      return {
        type: 'info',
        title: 'Aztec Testnet',
        message: 'Connecting to real Aztec Alpha Testnet. Transactions will be on-chain.'
      };
    }
  };

  const statusMessage = getConnectionStatusMessage();

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-[#121212] w-full max-w-md rounded-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Connect to Aztec</h2>
            <p className="text-sm text-white/60 mt-1">Choose how you want to connect</p>
          </div>
          <div className="flex items-center gap-2">
            {developmentMode && (
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
                title="Advanced settings"
              >
                <FaCog size={16} />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
              disabled={connecting || isLoading}
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Status Message */}
        <div className={`mx-6 mt-4 p-3 rounded-md border ${
          statusMessage.type === 'warning' 
            ? 'bg-orange-600/20 border-orange-600/40' 
            : 'bg-blue-600/20 border-blue-600/40'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`text-lg ${
              statusMessage.type === 'warning' ? 'text-orange-400' : 'text-blue-400'
            }`}>
              {statusMessage.type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div>
              <h4 className={`font-medium text-sm ${
                statusMessage.type === 'warning' ? 'text-orange-400' : 'text-blue-400'
              }`}>
                {statusMessage.title}
              </h4>
              <p className={`text-xs mt-1 ${
                statusMessage.type === 'warning' ? 'text-orange-300/80' : 'text-blue-300/80'
              }`}>
                {statusMessage.message}
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {developmentMode && showAdvanced && (
          <div className="mx-6 mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-white font-medium text-sm mb-3">Development Settings</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm">Mock Mode</p>
                <p className="text-white/60 text-xs">Use mock data instead of real blockchain</p>
              </div>
              <button
                onClick={toggleMockMode}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition ${
                  useMockData 
                    ? 'bg-orange-600/20 text-orange-400' 
                    : 'bg-green-600/20 text-green-400'
                }`}
                disabled={connecting}
              >
                {useMockData ? <FaToggleOn size={16} /> : <FaToggleOff size={16} />}
                {useMockData ? 'Mock' : 'Real'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-md mx-6 mt-4 p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Wallet Options */}
        <div className="p-6 space-y-3">
          {walletOptions.map((wallet) => (
            <WalletOptionCard
              key={wallet.id}
              wallet={wallet}
              connecting={connecting}
              connectingProvider={connectingProvider}
              onConnect={() => handleConnectWallet(wallet.id)}
              disabled={!wallet.available || connecting || isLoading}
              useMockData={useMockData}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-purple-400 text-lg">🔒</div>
              <div>
                <h4 className="text-purple-400 font-medium text-sm">About Aztec Network</h4>
                <p className="text-purple-300/80 text-xs mt-1">
                  Aztec is a privacy-first L2 that enables confidential smart contracts and transactions.
                  {useMockData && ' Currently running in development mode.'}
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-white/40 text-center mt-4">
            By connecting, you agree to Aztlan's Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

const WalletOptionCard = ({ 
  wallet, 
  connecting, 
  connectingProvider, 
  onConnect, 
  disabled,
  useMockData 
}) => {
  const isConnecting = connecting && connectingProvider === wallet.id;
  
  return (
    <button
      onClick={onConnect}
      disabled={disabled}
      className={`w-full p-4 rounded-xl border transition-all text-left relative
        ${disabled && !wallet.available
          ? 'border-white/10 bg-white/5 cursor-not-allowed'
          : 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-purple-500/50'
        }
        ${isConnecting ? 'border-purple-500 bg-purple-500/20' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="relative">
          {wallet.id === 'create' ? (
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <FaPlus className="text-white" size={20} />
            </div>
          ) : (
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
              <img 
                src={wallet.icon} 
                alt={wallet.name} 
                className={`w-8 h-8 ${!wallet.available ? 'opacity-50' : ''}`}
              />
            </div>
          )}
          
          {wallet.recommended && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              ✓
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-medium ${disabled && !wallet.available ? 'text-white/40' : 'text-white'}`}>
              {wallet.name}
            </h3>
            {wallet.comingSoon && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                Coming Soon
              </span>
            )}
            {wallet.status && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                wallet.status === 'mock' 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {wallet.status}
              </span>
            )}
          </div>
          <p className={`text-sm mt-1 ${disabled && !wallet.available ? 'text-white/30' : 'text-white/60'}`}>
            {wallet.description}
          </p>
        </div>

        {/* Loading indicator */}
        {isConnecting && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-purple-400 text-sm">
              {useMockData ? 'Creating mock wallet...' : 'Connecting to Aztec...'}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default WalletConnectModal;
