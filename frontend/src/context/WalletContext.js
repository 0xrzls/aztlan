// src/context/WalletContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { connectWallet as connectWalletSdk, signMessage as signWalletMessage } from '../lib/walletSdk';
import { authenticate } from '../utils/auth';

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
    error: null,
    signature: null,
    authMessage: null
  });
  
  // Store account object separately to prevent loss during re-renders
  const [accountInstance, setAccountInstance] = useState(null);
  
  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkStoredWallet = async () => {
      const address = localStorage.getItem('wallet_address');
      const provider = localStorage.getItem('wallet_provider');
      const signature = localStorage.getItem('wallet_signature');
      const authMessage = localStorage.getItem('wallet_auth_message');
      
      if (address && provider) {
        try {
          // For stored connections, we need to reconnect to get the account instance
          console.log('Found stored wallet connection, attempting to reconnect...');
          
          // Set basic info first
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
          
          // Try to reconnect silently to get account instance
          if (provider === 'obsidion' || provider === 'azguard') {
            reconnectWallet(provider, address);
          }
        } catch (error) {
          console.error("Failed to restore wallet connection:", error);
          clearStoredWalletData();
        }
      }
    };
    
    checkStoredWallet();
  }, []);
  
  // Reconnect wallet (for stored sessions)
  const reconnectWallet = async (provider, expectedAddress) => {
    try {
      console.log('Reconnecting to', provider);
      const connectionResult = await connectWalletSdk(provider);
      
      if (connectionResult.success && connectionResult.address === expectedAddress) {
        setAccountInstance(connectionResult.account);
        setWallet(prev => ({
          ...prev,
          account: connectionResult.account
        }));
        console.log('Successfully reconnected to', provider);
      } else {
        console.log('Reconnection address mismatch or failed, clearing stored data');
        clearStoredWalletData();
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    }
  };
  
  // Helper function to clear stored wallet data
  const clearStoredWalletData = () => {
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_provider');
    localStorage.removeItem('wallet_signature');
    localStorage.removeItem('wallet_auth_message');
    localStorage.removeItem('wallet_points');
    localStorage.removeItem('wallet_level');
  };
  
  // Connect wallet function
  const connectWallet = useCallback(async (providerName) => {
    try {
      console.log('Connecting to wallet:', providerName);
      setWallet(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Connect to the wallet using the SDK
      const connectionResult = await connectWalletSdk(providerName);
      
      if (!connectionResult.success) {
        throw new Error(connectionResult.error);
      }
      
      const { account, address, provider } = connectionResult;
      console.log('Wallet connected:', { address, provider });
      
      // Store account instance
      setAccountInstance(account);
      
      // Update state with connection info
      setWallet(prev => ({
        ...prev,
        isConnected: true,
        address,
        provider,
        account,
        isLoading: true,
        error: null
      }));
      
      // Authenticate the user
      const auth = await authenticate({ address, account });
      
      if (auth.success) {
        // Store connection info
        localStorage.setItem('wallet_address', address);
        localStorage.setItem('wallet_provider', provider);
        localStorage.setItem('wallet_signature', auth.signature);
        localStorage.setItem('wallet_auth_message', auth.message);
        
        // Fetch or generate user data
        // In production, this would come from your backend
        const mockPoints = Math.floor(Math.random() * 1000);
        const mockLevel = Math.floor(Math.random() * 5) + 1;
        localStorage.setItem('wallet_points', mockPoints.toString());
        localStorage.setItem('wallet_level', mockLevel.toString());
        
        // Update state with full info
        setWallet({
          isConnected: true,
          address,
          provider,
          account,
          isLoading: false,
          signature: auth.signature,
          authMessage: auth.message,
          points: mockPoints,
          level: mockLevel,
          error: null
        });
        
        console.log('Wallet fully connected and authenticated');
        return { success: true, address };
      } else {
        // Authentication failed
        throw new Error(auth.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      setWallet(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Connection failed',
        isConnected: false,
        address: null,
        account: null
      }));
      setAccountInstance(null);
      
      return { success: false, error: error.message };
    }
  }, []);
  
  // Disconnect wallet function
  const disconnectWallet = useCallback(async () => {
    try {
      // If wallet has a disconnect method, call it
      if (accountInstance && typeof accountInstance.disconnect === 'function') {
        await accountInstance.disconnect();
      }
      
      // Clear storage
      clearStoredWalletData();
      
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
      
      setAccountInstance(null);
      
      return { success: true };
    } catch (error) {
      console.error('Error during wallet disconnection:', error);
      return { success: false, error: error.message };
    }
  }, [accountInstance]);
  
  // Check if user is registered (on-chain)
  const checkRegistration = useCallback(async (address) => {
    try {
      console.log('Checking registration for:', address);
      
      // Check on-chain registration
      if (accountInstance || wallet.account) {
        const { hasProfile } = await import('../lib/aztecContractsSimple');
        const hasProf = await hasProfile(accountInstance || wallet.account, address);
        console.log('On-chain profile check:', hasProf);
        return hasProf;
      }
      
      // No account instance, can't check on-chain
      console.log('No account instance for on-chain check');
      return false;
    } catch (error) {
      console.error('Registration check error:', error);
      return false;
    }
  }, [accountInstance, wallet.account]);
  
  // Sign message function using the wallet account
  const signMessage = useCallback(async (message) => {
    try {
      const currentAccount = accountInstance || wallet.account;
      
      if (!wallet.isConnected || !currentAccount) {
        throw new Error('Wallet not connected');
      }
      
      const result = await signWalletMessage(currentAccount, message);
      
      if (result.success) {
        return { success: true, signature: result.signature };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error signing message:', error);
      return { success: false, error: error.message };
    }
  }, [wallet.isConnected, wallet.account, accountInstance]);

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

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
