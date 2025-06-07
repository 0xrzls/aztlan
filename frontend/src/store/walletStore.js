// src/store/walletStore.js - FIXED VERSION (No Aztec Imports)
import { create } from 'zustand';
import { connectWallet as connectWalletSdk, signMessage as signWalletMessage } from '../lib/walletSdk';
import { authenticate } from '../utils/auth';

const useWalletStore = create((set, get) => ({
  // State - sama kayak WalletContext.js kamu
  isConnected: false,
  address: null,
  provider: null,
  account: null,
  isLoading: false,
  points: 0,
  level: 1,
  error: null,
  signature: null,
  authMessage: null,

  // Actions
  connectWallet: async (providerName) => {
    set({ isLoading: true, error: null });

    try {
      console.log('Connecting to wallet:', providerName);
      
      const connectionResult = await connectWalletSdk(providerName);
      
      if (!connectionResult.success) {
        throw new Error(connectionResult.error);
      }
      
      const { account, address, provider } = connectionResult;
      console.log('Wallet connected:', { address, provider });
      
      // Update state with connection info
      set({
        isConnected: true,
        address,
        provider,
        account,
        isLoading: true,
        error: null
      });
      
      // Authenticate the user
      const auth = await authenticate({ address, account });
      
      if (auth.success) {
        // Store connection info
        localStorage.setItem('wallet_address', address);
        localStorage.setItem('wallet_provider', provider);
        localStorage.setItem('wallet_signature', auth.signature);
        localStorage.setItem('wallet_auth_message', auth.message);
        
        // Mock points & level (sesuai code asli kamu)
        const mockPoints = Math.floor(Math.random() * 1000);
        const mockLevel = Math.floor(Math.random() * 5) + 1;
        localStorage.setItem('wallet_points', mockPoints.toString());
        localStorage.setItem('wallet_level', mockLevel.toString());
        
        // Update state with full info
        set({
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
        throw new Error(auth.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      set({
        isLoading: false,
        error: error.message || 'Connection failed',
        isConnected: false,
        address: null,
        account: null
      });
      
      return { success: false, error: error.message };
    }
  },

  disconnectWallet: () => {
    // Clear storage
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_provider');
    localStorage.removeItem('wallet_signature');
    localStorage.removeItem('wallet_auth_message');
    localStorage.removeItem('wallet_points');
    localStorage.removeItem('wallet_level');
    
    // Reset state
    set({
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
  },

  checkRegistration: async (address) => {
    try {
      console.log('Checking registration for:', address);
      
      // Simple localStorage check for now (no Aztec import)
      const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
      const hasProfile = !!profiles[address];
      
      console.log('Registration check result:', hasProfile);
      return hasProfile;
    } catch (error) {
      console.error('Registration check error:', error);
      return false;
    }
  },

  signMessage: async (message) => {
    try {
      const currentAccount = get().account;
      
      if (!get().isConnected || !currentAccount) {
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
  },

  // Check for existing wallet connection on mount
  checkStoredWallet: () => {
    const address = localStorage.getItem('wallet_address');
    const provider = localStorage.getItem('wallet_provider');
    const signature = localStorage.getItem('wallet_signature');
    const authMessage = localStorage.getItem('wallet_auth_message');
    
    if (address && provider) {
      console.log('Found stored wallet connection');
      
      set({
        isConnected: true,
        address,
        provider,
        isLoading: false,
        signature,
        authMessage,
        points: parseInt(localStorage.getItem('wallet_points') || '0'),
        level: parseInt(localStorage.getItem('wallet_level') || '1')
      });
      
      console.log('Wallet restored from storage');
    }
  },

  clearError: () => set({ error: null }),
}));

export default useWalletStore;
