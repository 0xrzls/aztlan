// src/components/WalletConnectModal.js
import React, { useState, useEffect } from 'react';
import { FaLock, FaTimes } from 'react-icons/fa';
import { useWallet } from '../context/WalletContext';
import { useAzguardDebug } from '../hooks/useAzguardDebug';

const WalletConnectModal = ({ isOpen, onClose }) => {
  const { connectWallet } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [error, setError] = useState(null);
  
  // Use debug hook
  useAzguardDebug();

  if (!isOpen) return null;

  const handleConnectWallet = async (providerName) => {
    setConnecting(true);
    setConnectingProvider(providerName);
    setError(null);
    
    try {
      const result = await connectWallet(providerName);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
      setConnectingProvider(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-[#121212] w-full max-w-md rounded-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Connect Wallet</h2>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white p-1"
            disabled={connecting}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Error Message (if any) */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-md mx-4 mt-3 p-3">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {/* Wallet Options */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Obsidion Wallet */}
            <button
              onClick={() => handleConnectWallet('obsidion')}
              disabled={connecting}
              className={`flex items-center gap-3 p-3 rounded-lg text-white
                ${connecting ? 'bg-white/5 cursor-wait' : 'bg-white/10 hover:bg-white/20 transition'}`}
            >
              <img src="/wallets/obsidion.svg" alt="Obsidion" className="w-6 h-6" />
              Obsidion
              {connecting && connectingProvider === 'obsidion' && (
                <div className="ml-auto h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            {/* Azguard Wallet */}
            <button
              onClick={() => handleConnectWallet('azguard')}
              disabled={connecting}
              className={`flex items-center gap-3 p-3 rounded-lg text-white
                ${connecting ? 'bg-white/5 cursor-wait' : 'bg-white/10 hover:bg-white/20 transition'}`}
            >
              <img src="/wallets/azguard.svg" alt="Azguard" className="w-6 h-6" />
              Azguard
              {connecting && connectingProvider === 'azguard' && (
                <div className="ml-auto h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>

            {/* Coming Soon wallets */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-white/50 cursor-not-allowed">
              <img src="/wallets/metamask.svg" alt="Metamask" className="w-6 h-6 opacity-50" />
              Metamask 
              <FaLock className="ml-auto" size={14} />
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg text-white/50 cursor-not-allowed">
              <img src="/wallets/coinbase.svg" alt="Coinbase" className="w-6 h-6 opacity-50" />
              Coinbase 
              <FaLock className="ml-auto" size={14} />
            </div>
          </div>

          <button
            className="w-full py-2.5 bg-purple-600/50 cursor-not-allowed text-white rounded-xl font-semibold"
            disabled
          >
            Other Wallet
          </button>
          
          <p className="text-sm text-white/50 text-center mt-4">
            By connecting, you agree to Aztlan's Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;
