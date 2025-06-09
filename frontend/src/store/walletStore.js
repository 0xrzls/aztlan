// src/store/walletStore.js - REAL AZTEC INTEGRATION
import { create } from 'zustand';
import { aztecClient } from '../lib/aztecClient';

const useWalletStore = create((set, get) => ({
  // Connection state
  isConnected: false,
  address: null,
  wallet: null,
  account: null,
  isLoading: false,
  error: null,
  
  // Profile state - IMPORTANT: hasProfile is BOOLEAN, not function
  profile: null,
  hasProfile: false, // ✅ BOOLEAN STATE
  socialVerifications: {
    twitter: false,
    discord: false,
    telegram: false,
    github: false,
    farcaster: false,
    email: false
  },
  
  // Points & level (mock data for now)
  points: 0,
  level: 1,

  // Development mode toggle
  developmentMode: process.env.NODE_ENV === 'development',
  useMockData: localStorage.getItem('aztec_use_mock') === 'true',

  // Actions
  connectWallet: async (providerName = 'create') => {
    set({ isLoading: true, error: null });

    try {
      console.log('🔗 Connecting to Aztec wallet...');
      
      // Check if we should use mock data
      const { useMockData } = get();
      if (useMockData) {
        return get().connectMockWallet();
      }
      
      // Initialize Aztec client
      await aztecClient.initialize();
      
      let walletResult;
      
      if (providerName === 'create') {
        // Try to restore existing wallet first
        walletResult = await aztecClient.restoreWallet();
        
        // If no wallet exists, create new one
        if (!walletResult.success) {
          console.log('💡 No existing wallet, creating new one...');
          walletResult = await aztecClient.createWallet();
        }
      } else {
        throw new Error(`Provider ${providerName} not implemented yet`);
      }

      if (!walletResult.success) {
        throw new Error(walletResult.error);
      }

      // Load contracts
      await aztecClient.loadContracts();
      
      // Check for existing profile
      const hasExistingProfile = await aztecClient.hasProfile();
      let profileData = null;
      let socialVerifications = {
        twitter: false, discord: false, telegram: false,
        github: false, farcaster: false, email: false
      };
      
      if (hasExistingProfile) {
        profileData = await aztecClient.getProfile();
        if (profileData) {
          socialVerifications = await aztecClient.getSocialVerifications(profileData.profileId);
        }
      }
      
      // Mock points & level
      const mockPoints = Math.floor(Math.random() * 1000) + 100;
      const mockLevel = Math.floor(mockPoints / 200) + 1;
      
      set({
        isConnected: true,
        address: walletResult.address,
        wallet: aztecClient.wallet,
        account: aztecClient.account,
        profile: profileData,
        hasProfile: hasExistingProfile, // ✅ BOOLEAN
        socialVerifications,
        points: mockPoints,
        level: mockLevel,
        isLoading: false,
        error: null
      });
      
      // Store connection state
      localStorage.setItem('aztec_wallet_connected', 'true');
      localStorage.setItem('aztec_wallet_address', walletResult.address);
      
      console.log('✅ Aztec wallet connected successfully!');
      return { success: true, address: walletResult.address };
      
    } catch (error) {
      console.error('❌ Aztec wallet connection failed:', error);
      
      // Fallback to mock on error in development
      const { developmentMode } = get();
      if (developmentMode) {
        console.log('🔄 Falling back to mock wallet...');
        set({ useMockData: true });
        localStorage.setItem('aztec_use_mock', 'true');
        return get().connectMockWallet();
      }
      
      set({
        isLoading: false,
        error: error.message,
        isConnected: false
      });
      return { success: false, error: error.message };
    }
  },

  // Mock wallet for development/fallback
  connectMockWallet: async () => {
    try {
      console.log('🎭 Using mock wallet for development...');
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const mockWallet = { address: mockAddress };
      
      // Check if profile exists in localStorage
      const storedProfile = localStorage.getItem(`aztlan_profile_${mockAddress}`);
      const hasExistingProfile = !!storedProfile;
      let profileData = null;
      
      if (hasExistingProfile) {
        try {
          const metadata = JSON.parse(storedProfile);
          profileData = {
            profileId: '1',
            owner: mockAddress,
            tokenURI: metadata.avatar,
            metadata
          };
        } catch (e) {
          console.error('Error parsing stored profile:', e);
        }
      }
      
      const mockPoints = Math.floor(Math.random() * 1000) + 100;
      const mockLevel = Math.floor(mockPoints / 200) + 1;
      
      set({
        isConnected: true,
        address: mockAddress,
        wallet: mockWallet,
        account: mockWallet,
        profile: profileData,
        hasProfile: hasExistingProfile, // ✅ BOOLEAN
        socialVerifications: {
          twitter: false, discord: false, telegram: false,
          github: false, farcaster: false, email: false
        },
        points: mockPoints,
        level: mockLevel,
        isLoading: false,
        error: null
      });
      
      localStorage.setItem('aztec_wallet_connected', 'true');
      localStorage.setItem('aztec_wallet_address', mockAddress);
      
      console.log('✅ Mock wallet connected!');
      return { success: true, address: mockAddress };
      
    } catch (error) {
      console.error('❌ Mock wallet failed:', error);
      set({
        isLoading: false,
        error: error.message,
        isConnected: false
      });
      return { success: false, error: error.message };
    }
  },

  disconnectWallet: () => {
    // Cleanup Aztec client
    if (aztecClient.isConnected()) {
      aztecClient.disconnect();
    }
    
    set({
      isConnected: false,
      address: null,
      wallet: null,
      account: null,
      profile: null,
      hasProfile: false, // ✅ BOOLEAN
      socialVerifications: {
        twitter: false, discord: false, telegram: false,
        github: false, farcaster: false, email: false
      },
      points: 0,
      level: 1,
      isLoading: false,
      error: null
    });
    
    // Clear localStorage
    localStorage.removeItem('aztec_wallet_connected');
    localStorage.removeItem('aztec_wallet_address');
    
    console.log('👋 Wallet disconnected');
    return { success: true };
  },

  createProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { useMockData } = get();
      
      if (useMockData) {
        // Mock profile creation
        console.log('🎭 Creating mock profile...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockProfile = {
          profileId: '1',
          owner: get().address,
          tokenURI: profileData.avatar || '/uid/01UID.png',
          metadata: profileData
        };
        
        set({
          profile: mockProfile,
          hasProfile: true, // ✅ BOOLEAN
          isLoading: false
        });
        
        localStorage.setItem(`aztlan_profile_${get().address}`, JSON.stringify(profileData));
        
        console.log('✅ Mock profile created!');
        return { success: true, txHash: 'mock-tx-hash' };
      }
      
      // Real Aztec profile creation
      console.log('🎭 Creating real Aztec profile...');
      const result = await aztecClient.createProfile(profileData);
      
      if (result.success) {
        // Update state with new profile
        const profileData = await aztecClient.getProfile();
        
        set({
          profile: profileData,
          hasProfile: true, // ✅ BOOLEAN
          isLoading: false
        });
        
        console.log('✅ Real Aztec profile created!');
        return { success: true, txHash: result.txHash };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  isUsernameAvailable: async (username) => {
    try {
      const { useMockData } = get();
      
      if (useMockData) {
        // Mock username check
        await new Promise(resolve => setTimeout(resolve, 500));
        return username.length > 3; // Simple mock rule
      }
      
      // Real Aztec username check
      return await aztecClient.isUsernameAvailable(username);
      
    } catch (error) {
      console.error('❌ Username check failed:', error);
      throw error;
    }
  },

  loadUserProfile: async () => {
    try {
      const { address, useMockData } = get();
      if (!address) return null;
      
      if (useMockData) {
        // Load from localStorage for mock
        const stored = localStorage.getItem(`aztlan_profile_${address}`);
        if (stored) {
          const metadata = JSON.parse(stored);
          const mockProfile = {
            profileId: '1',
            owner: address,
            tokenURI: metadata.avatar || '/uid/01UID.png',
            metadata
          };
          
          set({
            profile: mockProfile,
            hasProfile: true // ✅ BOOLEAN
          });
          
          return { success: true, profile: mockProfile };
        }
        
        set({ hasProfile: false }); // ✅ BOOLEAN
        return { success: true, profile: null };
      }
      
      // Real Aztec profile loading
      const hasExistingProfile = await aztecClient.hasProfile();
      
      if (hasExistingProfile) {
        const profileData = await aztecClient.getProfile();
        const socialVerifications = await aztecClient.getSocialVerifications(profileData.profileId);
        
        set({
          profile: profileData,
          hasProfile: true, // ✅ BOOLEAN
          socialVerifications
        });
        
        return { success: true, profile: profileData };
      } else {
        set({ hasProfile: false }); // ✅ BOOLEAN
        return { success: true, profile: null };
      }
      
    } catch (error) {
      console.error('❌ Profile loading failed:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Helper functions
  getVerificationCount: () => {
    const { socialVerifications } = get();
    return Object.values(socialVerifications).filter(Boolean).length;
  },

  clearError: () => set({ error: null }),

  // Toggle development mode
  toggleMockMode: () => {
    const newMockMode = !get().useMockData;
    set({ useMockData: newMockMode });
    localStorage.setItem('aztec_use_mock', newMockMode.toString());
    
    // Disconnect current wallet to force reconnection
    get().disconnectWallet();
    
    console.log(`🔄 Switched to ${newMockMode ? 'mock' : 'real'} mode`);
  },

  // Check for stored wallet on app load
  checkStoredWallet: async () => {
    try {
      const isConnected = localStorage.getItem('aztec_wallet_connected');
      const storedAddress = localStorage.getItem('aztec_wallet_address');
      const useMockMode = localStorage.getItem('aztec_use_mock') === 'true';
      
      if (isConnected && storedAddress) {
        set({ useMockData: useMockMode });
        
        if (useMockMode) {
          // Restore mock wallet
          const storedProfile = localStorage.getItem(`aztlan_profile_${storedAddress}`);
          const hasExistingProfile = !!storedProfile;
          let profileData = null;
          
          if (hasExistingProfile) {
            try {
              const metadata = JSON.parse(storedProfile);
              profileData = {
                profileId: '1',
                owner: storedAddress,
                tokenURI: metadata.avatar,
                metadata
              };
            } catch (e) {
              console.error('Error parsing stored profile:', e);
            }
          }
          
          set({
            isConnected: true,
            address: storedAddress,
            wallet: { address: storedAddress },
            account: { address: storedAddress },
            profile: profileData,
            hasProfile: hasExistingProfile, // ✅ BOOLEAN
            points: 500,
            level: 3
          });
          
          console.log('✅ Mock wallet restored from storage');
        } else {
          // Try to restore real Aztec wallet
          try {
            await aztecClient.initialize();
            const walletResult = await aztecClient.restoreWallet();
            
            if (walletResult.success) {
              await aztecClient.loadContracts();
              
              const hasExistingProfile = await aztecClient.hasProfile();
              let profileData = null;
              let socialVerifications = {
                twitter: false, discord: false, telegram: false,
                github: false, farcaster: false, email: false
              };
              
              if (hasExistingProfile) {
                profileData = await aztecClient.getProfile();
                if (profileData) {
                  socialVerifications = await aztecClient.getSocialVerifications(profileData.profileId);
                }
              }
              
              set({
                isConnected: true,
                address: walletResult.address,
                wallet: aztecClient.wallet,
                account: aztecClient.account,
                profile: profileData,
                hasProfile: hasExistingProfile, // ✅ BOOLEAN
                socialVerifications,
                points: 500,
                level: 3
              });
              
              console.log('✅ Real Aztec wallet restored from storage');
            } else {
              // Fallback to mock mode
              console.log('🔄 Real wallet restoration failed, switching to mock mode');
              set({ useMockData: true });
              localStorage.setItem('aztec_use_mock', 'true');
              get().checkStoredWallet(); // Recursive call with mock mode
            }
          } catch (error) {
            console.log('❌ Aztec wallet restoration failed, using mock mode');
            set({ useMockData: true });
            localStorage.setItem('aztec_use_mock', 'true');
            get().checkStoredWallet(); // Recursive call with mock mode
          }
        }
      }
    } catch (error) {
      console.log('❌ Wallet restoration failed:', error);
    }
  }
}));

// Export default
export default useWalletStore;
