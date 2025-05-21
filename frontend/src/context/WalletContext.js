import React, { createContext, useContext, useState, useEffect } from 'react';
// Import mock SDK for development
import { AztecWalletSdk, obsidion, AzguardWalletClient } from '../lib/mockWalletSdk';

// Initialize wallet clients
const createAztecSdk = () => {
  return new AztecWalletSdk({
    aztecNode: 'https://full-node.alpha-testnet.aztec.network',
    connectors: [
      obsidion({
        walletUrl: 'https://app.obsidion.xyz',
        appName: 'Aztlan Quest',
        appIconUrl: '/logo.svg',
      }),
    ],
  });
};

const createAzguardClient = () => {
  return new AzguardWalletClient({
    appName: 'Aztlan Quest',
    appIconUrl: '/logo.svg',
  });
};

// Create context
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({
    isConnected: false,
    address: null,
    provider: null, // 'obsidion' or 'azguard'
    account: null,
    isLoading: false,
    points: 0,
    level: 1,
    error: null
  });
  
  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkStoredWallet = async () => {
      const address = localStorage.getItem('wallet_address');
      const provider = localStorage.getItem('wallet_provider');
      
      if (address && provider) {
        try {
          setWallet(prev => ({
            ...prev,
            isConnected: true,
            address,
            provider,
            isLoading: false,
            // Mock data for now
            points: Math.floor(Math.random() * 1000),
            level: Math.floor(Math.random() * 5) + 1
          }));
        } catch (error) {
          console.error("Failed to restore wallet connection:", error);
          // Clear invalid stored data
          localStorage.removeItem('wallet_address');
          localStorage.removeItem('wallet_provider');
        }
      }
    };
    
    checkStoredWallet();
  }, []);
  
  // Connect wallet function
  const connectWallet = async (providerName) => {
    try {
      setWallet(prev => ({ ...prev, isLoading: true, error: null }));
      
      let address;
      let account;
      
      if (providerName === 'obsidion') {
        const sdk = createAztecSdk();
        account = await sdk.connect('obsidion');
        address = account.getAddress().toString();
      } else if (providerName === 'azguard') {
        const client = createAzguardClient();
        account = await client.connect();
        address = account.getAddress();
      } else {
        throw new Error(`Unsupported provider: ${providerName}`);
      }
      
      if (address) {
        // Store connection info
        localStorage.setItem('wallet_address', address);
        localStorage.setItem('wallet_provider', providerName);
        
        // Update state
        setWallet({
          isConnected: true,
          address,
          provider: providerName,
          account,
          isLoading: false,
          // Mock data for now
          points: Math.floor(Math.random() * 1000),
          level: Math.floor(Math.random() * 5) + 1,
          error: null
        });
        
        return { success: true, address };
      }
      
      return { success: false, error: 'Failed to get address' };
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Connection failed'
      }));
      
      return { success: false, error: error.message };
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = () => {
    // Clear storage
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_provider');
    
    // Reset state
    setWallet({
      isConnected: false,
      address: null,
      provider: null,
      account: null,
      isLoading: false,
      points: 0,
      level: 1,
      error: null
    });
  };
  
  // Check if user is registered (simulated for now)
  const checkRegistration = async (address) => {
    // This would normally call a contract or API
    // For now, return random result or use localStorage
    const isRegistered = localStorage.getItem(`user_registered_${address}`);
    
    if (isRegistered !== null) {
      return isRegistered === 'true';
    }
    
    // Default to false if no record found
    return false;
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        checkRegistration
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
