import React, { createContext, useState, useContext } from 'react';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState({
    isConnected: false,
    address: '',
    balance: 0,
    points: 0,
  });

  const connectWallet = async () => {
    // Simulation of connecting wallet
    try {
      // In real implementation, this would connect to Aztec or other wallet
      console.log('Connecting wallet...');
      setTimeout(() => {
        setWallet({
          isConnected: true,
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          balance: 1.5,
          points: 600,
        });
      }, 1000);
      return true;
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      return false;
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: '',
      balance: 0,
      points: 0,
    });
  };

  return (
    <WalletContext.Provider value={{ wallet, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
