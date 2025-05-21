import React, { useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { useWallet } from '../context/WalletContext';

function MobileHeader() {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const [connecting, setConnecting] = useState(false);
  
  const handleConnectWallet = async () => {
    if (wallet.isConnected) {
      disconnectWallet();
      return;
    }
    
    setConnecting(true);
    try {
      await connectWallet();
    } finally {
      setConnecting(false);
    }
  };
  
  // Truncate address for display
  const displayAddress = wallet.isConnected 
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : '';
  
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-lg border-b border-white/10 z-40 flex items-center px-4">
      <div className="flex-1">
        <h1 className="text-lg font-bold">Aztlan</h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Points Display */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1">
          <div className="w-4 h-4 mr-2">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                fill="#8B5CF6" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium">{wallet.points}</span>
          <button className="ml-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-white/50">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>

        {/* Connect Wallet Button */}
        <button 
          onClick={handleConnectWallet}
          disabled={connecting}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            wallet.isConnected 
              ? 'bg-white/10 hover:bg-white/20' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          <FaWallet size={14} />
          {connecting ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : wallet.isConnected ? displayAddress : 'Connect'}
        </button>
        
        {/* Notification Button */}
        <button className="p-2 rounded-full bg-white/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default MobileHeader;
