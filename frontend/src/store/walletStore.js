// src/store/walletStore.js - CLEAN VERSION
import { create } from 'zustand';

const useWalletStore = create((set, get) => ({
  // State
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
  
  // Points & level (mock data)
  points: 0,
  level: 1,

  // Actions
  connectWallet: async (providerName = 'create') => {
    set({ isLoading: true, error: null });

    try {
      console.log('🔗 Menghubungkan wallet...');
      
      // Mock wallet connection untuk development
      const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const mockWallet = { address: mockAddress };
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profile exists
      const storedProfile = localStorage.getItem(`aztlan_profile_${mockAddress}`);
      const hasExistingProfile = !!storedProfile;
      let profileData = null;
      
      if (hasExistingProfile) {
        try {
          profileData = JSON.parse(storedProfile);
        } catch (e) {
          console.error('Error parsing stored profile:', e);
        }
      }
      
      // Mock points & level
      const mockPoints = Math.floor(Math.random() * 1000) + 100;
      const mockLevel = Math.floor(mockPoints / 200) + 1;
      
      set({
        isConnected: true,
        address: mockAddress,
        wallet: mockWallet,
        account: mockWallet,
        profile: profileData ? { 
          profileId: '1', 
          owner: mockAddress, 
          tokenURI: profileData.avatar 
        } : null,
        hasProfile: hasExistingProfile, // ✅ BOOLEAN
        points: mockPoints,
        level: mockLevel,
        isLoading: false,
        error: null
      });
      
      // Store in localStorage
      localStorage.setItem('wallet_connected', 'true');
      localStorage.setItem('wallet_address', mockAddress);
      
      console.log('✅ Wallet berhasil terhubung!');
      return { success: true, address: mockAddress };
    } catch (error) {
      console.error('❌ Koneksi wallet gagal:', error);
      set({
        isLoading: false,
        error: error.message,
        isConnected: false
      });
      return { success: false, error: error.message };
    }
  },

  disconnectWallet: () => {
    set({
      isConnected: false,
      address: null,
      wallet: null,
      account: null,
      profile: null,
      hasProfile: false, // ✅ BOOLEAN
      socialVerifications: {
        twitter: false,
        discord: false,
        telegram: false,
        github: false,
        farcaster: false,
        email: false
      },
      points: 0,
      level: 1,
      isLoading: false,
      error: null
    });
    
    // Clear localStorage
    localStorage.removeItem('wallet_connected');
    localStorage.removeItem('wallet_address');
    
    console.log('👋 Wallet terputus');
    return { success: true };
  },

  createProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    
    try {
      // Simulate profile creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockProfile = {
        profileId: '1',
        owner: get().address,
        tokenURI: profileData.avatar || '/uid/01UID.png'
      };
      
      set({
        profile: mockProfile,
        hasProfile: true, // ✅ BOOLEAN
        isLoading: false
      });
      
      // Store profile data
      const address = get().address;
      localStorage.setItem(`aztlan_profile_${address}`, JSON.stringify(profileData));
      
      console.log('✅ Profil berhasil dibuat!');
      return { success: true, txHash: 'mock-tx-hash' };
    } catch (error) {
      console.error('❌ Gagal membuat profil:', error);
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  isUsernameAvailable: async (username) => {
    try {
      // Simulate username check
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock: username available if length > 3
      return username.length > 3;
    } catch (error) {
      console.error('❌ Gagal cek username:', error);
      throw error;
    }
  },

  loadUserProfile: async () => {
    try {
      const address = get().address;
      if (!address) return null;
      
      // Load from localStorage
      const stored = localStorage.getItem(`aztlan_profile_${address}`);
      if (stored) {
        const profileData = JSON.parse(stored);
        const mockProfile = {
          profileId: '1',
          owner: address,
          tokenURI: profileData.avatar || '/uid/01UID.png'
        };
        
        set({
          profile: mockProfile,
          hasProfile: true // ✅ BOOLEAN
        });
        
        return { success: true, profile: mockProfile };
      }
      
      set({ hasProfile: false }); // ✅ BOOLEAN
      return { success: true, profile: null };
    } catch (error) {
      console.error('❌ Gagal load profil:', error);
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

  // Check for stored wallet on app load
  checkStoredWallet: async () => {
    const isConnected = localStorage.getItem('wallet_connected');
    const storedAddress = localStorage.getItem('wallet_address');
    
    if (isConnected && storedAddress) {
      try {
        // Check if profile exists
        const storedProfile = localStorage.getItem(`aztlan_profile_${storedAddress}`);
        const hasExistingProfile = !!storedProfile;
        let profileData = null;
        
        if (hasExistingProfile) {
          try {
            profileData = JSON.parse(storedProfile);
          } catch (e) {
            console.error('Error parsing stored profile:', e);
          }
        }
        
        set({
          isConnected: true,
          address: storedAddress,
          wallet: { address: storedAddress },
          account: { address: storedAddress },
          profile: profileData ? { 
            profileId: '1', 
            owner: storedAddress, 
            tokenURI: profileData.avatar 
          } : null,
          hasProfile: hasExistingProfile, // ✅ BOOLEAN
          points: 500,
          level: 3
        });
        
        console.log('✅ Wallet restored from storage');
      } catch (error) {
        console.log('❌ Gagal restore wallet otomatis');
      }
    }
  }
}));

// Export default
export default useWalletStore;
