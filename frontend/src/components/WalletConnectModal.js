// src/components/WalletConnectModal.js - ENHANCED WITH OBSIDION & AZGUARD SUPPORT
import React, { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaCog, FaToggleOn, FaToggleOff, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';
import useWalletStore from '../store/walletStore';

// Wallet detection utilities
const detectWallets = () => {
  const wallets = {
    azguard: false,
    obsidion: false,
    metamask: false
  };
  
  // Check for Azguard
  if (typeof window !== 'undefined') {
    wallets.azguard = !!(window.azguard || window.ethereum?.isAzguard);
    wallets.obsidion = !!(window.obsidion || window.ethereum?.isObsidion);
    wallets.metamask = !!(window.ethereum?.isMetaMask && !window.ethereum?.isAzguard && !window.ethereum?.isObsidion);
  }
  
  return wallets;
};

const WalletConnectModal = ({ isOpen, onClose }) => {
  const { 
    connectWallet, 
    isLoading, 
    error, 
    developmentMode, 
    useMockData, 
    toggleMockMode,
    addNotification
  } = useWalletStore();
  
  const [connecting, setConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState({ azguard: false, obsidion: false, metamask: false });
  const [walletCheckInterval, setWalletCheckInterval] = useState(null);

  // Detect wallets on mount and periodically
  useEffect(() => {
    if (isOpen) {
      const checkWallets = () => {
        setDetectedWallets(detectWallets());
      };
      
      checkWallets();
      
      // Check every 2 seconds while modal is open
      const interval = setInterval(checkWallets, 2000);
      setWalletCheckInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isOpen]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && walletCheckInterval) {
      clearInterval(walletCheckInterval);
      setWalletCheckInterval(null);
    }
  }, [isOpen, walletCheckInterval]);

  if (!isOpen) return null;

  const walletOptions = [
    {
      id: 'create',
      name: 'Create Aztec Wallet',
      description: useMockData 
        ? 'Generate a mock wallet for development' 
        : 'Generate a new Aztec wallet on testnet',
      icon: '/icons/create-wallet.svg',
      iconFallback: '🔑',
      available: true,
      recommended: true,
      status: useMockData ? 'mock' : 'real',
      type: 'native'
    },
    {
      id: 'azguard',
      name: 'Azguard Wallet',
      description: detectedWallets.azguard 
        ? 'Connect with Azguard wallet browser extension'
        : 'Azguard wallet extension not detected',
      icon: '/wallets/azguard.svg',
      iconFallback: '🛡️',
      available: detectedWallets.azguard,
      recommended: detectedWallets.azguard,
      installUrl: 'https://chrome.google.com/webstore/detail/azguard-wallet',
      type: 'extension',
      status: 'external'
    },
    {
      id: 'obsidion',
      name: 'Obsidion Wallet',
      description: detectedWallets.obsidion
        ? 'Connect with Obsidion wallet browser extension'
        : 'Obsidion wallet extension not detected',
      icon: '/wallets/obsidion.svg',
      iconFallback: '🌑',
      available: detectedWallets.obsidion,
      recommended: detectedWallets.obsidion,
      installUrl: 'https://obsidion.xyz/download',
      type: 'extension',
      status: 'external'
    },
    {
      id: 'restore',
      name: 'Restore Existing Wallet',
      description: 'Restore from private key or seed phrase',
      icon: '/icons/restore-wallet.svg',
      iconFallback: '🔄',
      available: false,
      comingSoon: true,
      type: 'native'
    },
    {
      id: 'hardware',
      name: 'Hardware Wallet',
      description: 'Connect with Ledger or Trezor (coming soon)',
      icon: '/icons/hardware-wallet.svg',
      iconFallback: '🔐',
      available: false,
      comingSoon: true,
      type: 'hardware'
    }
  ];

  const handleConnectWallet = async (providerName) => {
    setConnecting(true);
    setConnectingProvider(providerName);
    
    try {
      let result;
      
      if (providerName === 'azguard') {
        result = await connectAzguardWallet();
      } else if (providerName === 'obsidion') {
        result = await connectObsidionWallet();
      } else {
        result = await connectWallet(providerName);
      }
      
      if (result.success) {
        onClose();
        addNotification({
          type: 'success',
          title: 'Wallet Connected',
          message: `Successfully connected ${getWalletDisplayName(providerName)}!`
        });
      }
    } catch (err) {
      console.error('Connection error:', err);
      addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: err.message || 'Failed to connect wallet'
      });
    } finally {
      setConnecting(false);
      setConnectingProvider(null);
    }
  };

  const connectAzguardWallet = async () => {
    try {
      if (!window.azguard && !window.ethereum?.isAzguard) {
        throw new Error('Azguard wallet not detected. Please install the extension.');
      }
      
      const provider = window.azguard || (window.ethereum?.isAzguard ? window.ethereum : null);
      
      addNotification({
        type: 'info',
        title: 'Connecting to Azguard',
        message: 'Please check your Azguard extension and approve the connection.'
      });
      
      // Request connection
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Azguard wallet');
      }
      
      // For now, we'll treat external wallets as mock mode
      // Later this can be enhanced to work with real Aztec integration
      const mockAddress = accounts[0];
      
      return {
        success: true,
        address: mockAddress,
        provider: 'azguard'
      };
      
    } catch (error) {
      console.error('Azguard connection failed:', error);
      throw error;
    }
  };

  const connectObsidionWallet = async () => {
    try {
      if (!window.obsidion && !window.ethereum?.isObsidion) {
        throw new Error('Obsidion wallet not detected. Please install the extension.');
      }
      
      const provider = window.obsidion || (window.ethereum?.isObsidion ? window.ethereum : null);
      
      addNotification({
        type: 'info',
        title: 'Connecting to Obsidion',
        message: 'Please check your Obsidion extension and approve the connection.'
      });
      
      // Request connection
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Obsidion wallet');
      }
      
      const mockAddress = accounts[0];
      
      return {
        success: true,
        address: mockAddress,
        provider: 'obsidion'
      };
      
    } catch (error) {
      console.error('Obsidion connection failed:', error);
      throw error;
    }
  };

  const getWalletDisplayName = (providerName) => {
    const wallet = walletOptions.find(w => w.id === providerName);
    return wallet ? wallet.name : providerName;
  };

  const getConnectionStatusMessage = () => {
    if (useMockData) {
      return {
        type: 'warning',
        title: 'Development Mode',
        message: 'Using mock data for testing. Toggle below to use real Aztec Network.',
        icon: '⚠️'
      };
    } else {
      return {
        type: 'info',
        title: 'Aztec Testnet',
        message: 'Connecting to real Aztec Alpha Testnet. Transactions will be on-chain.',
        icon: 'ℹ️'
      };
    }
  };

  const statusMessage = getConnectionStatusMessage();

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-[#121212] w-full max-w-md rounded-xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
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
              {statusMessage.icon}
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

        {/* Wallet Detection Status */}
        {Object.values(detectedWallets).some(detected => detected) && (
          <div className="mx-6 mt-4 p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
            <h4 className="text-green-400 font-medium text-sm mb-2">🎉 Detected Wallets</h4>
            <div className="space-y-1">
              {detectedWallets.azguard && (
                <p className="text-green-300 text-xs">✓ Azguard wallet extension found</p>
              )}
              {detectedWallets.obsidion && (
                <p className="text-green-300 text-xs">✓ Obsidion wallet extension found</p>
              )}
              {detectedWallets.metamask && (
                <p className="text-green-300 text-xs">✓ MetaMask wallet found</p>
              )}
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
        <div className="p-6 pt-0 space-y-4">
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
          
          <p className="text-xs text-white/40 text-center">
            By connecting, you agree to Aztlan's Terms of Service and Privacy Policy
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
  const isAvailable = wallet.available;
  
  const handleClick = () => {
    if (disabled) return;
    
    if (!isAvailable && wallet.installUrl) {
      window.open(wallet.installUrl, '_blank');
      return;
    }
    
    onConnect();
  };
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled && isAvailable}
      className={`w-full p-4 rounded-xl border transition-all text-left relative group
        ${disabled && isAvailable
          ? 'border-white/10 bg-white/5 cursor-not-allowed'
          : !isAvailable
          ? 'border-orange-500/30 bg-orange-600/10 hover:bg-orange-600/20 hover:border-orange-500/50'
          : 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-purple-500/50'
        }
        ${isConnecting ? 'border-purple-500 bg-purple-500/20' : ''}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="relative">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            wallet.id === 'create' 
              ? 'bg-gradient-to-br from-purple-500 to-blue-500'
              : isAvailable 
              ? 'bg-white/10' 
              : 'bg-orange-600/20'
          }`}>
            {wallet.icon ? (
              <img 
                src={wallet.icon} 
                alt={wallet.name} 
                className={`w-8 h-8 ${!isAvailable ? 'opacity-50' : ''}`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <span 
              className={`text-xl ${wallet.icon ? 'hidden' : 'block'}`}
              style={{ display: wallet.icon ? 'none' : 'block' }}
            >
              {wallet.iconFallback || '💼'}
            </span>
          </div>
          
          {/* Status badges */}
          {wallet.recommended && isAvailable && (
            <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              ✓
            </div>
          )}
          
          {wallet.type === 'extension' && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs p-1 rounded-full">
              <span className="text-xs">🧩</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium ${
              disabled && isAvailable ? 'text-white/40' : 'text-white'
            }`}>
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
                  : wallet.status === 'external'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {wallet.status}
              </span>
            )}
          </div>
          
          <p className={`text-sm ${
            disabled && isAvailable ? 'text-white/30' : 'text-white/60'
          }`}>
            {wallet.description}
          </p>
          
          {/* Install prompt for unavailable wallets */}
          {!isAvailable && wallet.installUrl && (
            <div className="mt-2 flex items-center gap-1 text-orange-400 text-xs">
              <FaDownload size={10} />
              <span>Click to install</span>
              <FaExternalLinkAlt size={10} />
            </div>
          )}
        </div>

        {/* Loading indicator or action prompt */}
        <div className="flex items-center gap-2">
          {isConnecting && (
            <>
              <div className="h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-purple-400 text-sm">
                {useMockData ? 'Creating mock wallet...' : 'Connecting...'}
              </span>
            </>
          )}
          
          {!isConnecting && !isAvailable && wallet.installUrl && (
            <div className="text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <FaExternalLinkAlt size={14} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default WalletConnectModal;
