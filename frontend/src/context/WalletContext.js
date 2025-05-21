// src/context/WalletContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AztecWalletSdk, obsidion } from '../lib/mockWalletSdk';
import { authenticate } from '../utils/auth';

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

// Create context
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({
    isConnected: false,
    address: null,
    provider: null, // 'obsidion'
    account: null,
    isLoading: false,
    points: 0,
    level: 1,
    error: null,
    signature: null,
    authMessage: null
  });
  
  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkStoredWallet = async () => {
      const address = localStorage.getItem('wallet_address');
      const provider = localStorage.getItem('wallet_provider');
      const signature = localStorage.getItem('wallet_signature');
      const authMessage = localStorage.getItem('wallet_auth_message');
      
      if (address && provider) {
        try {
          setWallet(prev => ({
            ...prev,
            isConnected: true,
            address,
            provider,
            isLoading: false,
            signature,
            authMessage,
            points: parseInt(localStorage.getItem('wallet_points') || '0'),
            level: parseInt(localStorage.getItem('wallet_level') || '1')
          }));
        } catch (error) {
          console.error("Failed to restore wallet connection:", error);
          // Clear invalid stored data
          localStorage.removeItem('wallet_address');
          localStorage.removeItem('wallet_provider');
          localStorage.removeItem('wallet_signature');
          localStorage.removeItem('wallet_auth_message');
          localStorage.removeItem('wallet_points');
          localStorage.removeItem('wallet_level');
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
        
        // Update state first with basic connection info
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          address,
          provider: providerName,
          account,
          isLoading: true,
          error: null
        }));
        
        // Try to authenticate
        const auth = await authenticate({
          address,
          account
        });
        
        if (auth.success) {
          // Store connection info
          localStorage.setItem('wallet_address', address);
          localStorage.setItem('wallet_provider', providerName);
          localStorage.setItem('wallet_signature', auth.signature);
          localStorage.setItem('wallet_auth_message', auth.message);
          
          // Mock points and level for demo
          const mockPoints = Math.floor(Math.random() * 1000);
          const mockLevel = Math.floor(Math.random() * 5) + 1;
          localStorage.setItem('wallet_points', mockPoints.toString());
          localStorage.setItem('wallet_level', mockLevel.toString());
          
          // Update state with full info
          setWallet({
            isConnected: true,
            address,
            provider: providerName,
            account,
            isLoading: false,
            signature: auth.signature,
            authMessage: auth.message,
            // Mock data for now
            points: mockPoints,
            level: mockLevel,
            error: null
          });
          
          return { success: true, address };
        } else {
          // Authentication failed but wallet is connected
          setWallet(prev => ({
            ...prev,
            isLoading: false,
            error: auth.error || 'Authentication failed'
          }));
          
          return { success: false, error: auth.error || 'Authentication failed' };
        }
      } else {
        throw new Error(`Unsupported provider: ${providerName}`);
      }
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
  const disconnectWallet = async () => {
    try {
      // Clear storage
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_provider');
      localStorage.removeItem('wallet_signature');
      localStorage.removeItem('wallet_auth_message');
      localStorage.removeItem('wallet_points');
      localStorage.removeItem('wallet_level');
      
      // Reset state
      setWallet({
        isConnected: false,
        address: null,
        provider: null,
        account: null,
        isLoading: false,
        points: 0,
        level: 1,
        signature: null,
        authMessage: null,
        error: null
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error during wallet disconnection:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Check if user is registered (simulated for now)
  const checkRegistration = async (address) => {
    // This would normally call a contract or API
    const isRegistered = localStorage.getItem(`user_registered_${address}`);
    
    if (isRegistered !== null) {
      return isRegistered === 'true';
    }
    
    // Default to false if no record found
    return false;
  };
  
  // Sign message function using the wallet account
  const signMessage = async (message) => {
    try {
      if (!wallet.isConnected || !wallet.account) {
        throw new Error('Wallet not connected');
      }
      
      const signature = await wallet.account.signMessage(message);
      return { success: true, signature };
    } catch (error) {
      console.error('Error signing message:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        checkRegistration,
        signMessage
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
