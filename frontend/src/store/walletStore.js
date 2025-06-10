// src/store/walletStore.js - UPDATED FOR REAL AZTEC INTEGRATION
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
  
  // Profile state - CRITICAL: hasProfile is BOOLEAN
  profile: null,
  hasProfile: false, // ✅ BOOLEAN STATE (NOT FUNCTION!)
  socialVerifications: {
    twitter: false,
    discord: false,
    telegram: false,
    github: false,
    farcaster: false,
    email: false
  },
  
  // Points & level (mock data for now - can be enhanced later)
  points: 0,
  level: 1,

  // Development mode toggle
  developmentMode: process.env.NODE_ENV === 'development',
  useMockData: localStorage.getItem('aztec_use_mock') === 'true',

  // Background processing state
  backgroundTasks: new Map(),
  notifications: [],

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
      
      // Initialize real Aztec client
      await aztecClient.initialize();
      
      let walletResult;
      
      if (providerName === 'create') {
        // Try to restore existing wallet first
        walletResult = await aztecClient.restoreWallet((progress) => {
          // Progress callback for restoration
          console.log('Restoration progress:', progress);
        });
        
        // If no wallet exists, create new one with progress tracking
        if (!walletResult.success) {
          console.log('💡 No existing wallet, creating new one...');
          
          // Add background task for account creation
          const taskId = Date.now().toString();
          set(state => ({
            backgroundTasks: new Map(state.backgroundTasks.set(taskId, {
              type: 'account_creation',
              status: 'running',
              progress: 0,
              message: 'Creating Aztec account...',
              startTime: Date.now()
            }))
          }));
          
          walletResult = await aztecClient.createWallet((progress) => {
            // Update background task progress
            set(state => ({
              backgroundTasks: new Map(state.backgroundTasks.set(taskId, {
                ...state.backgroundTasks.get(taskId),
                progress: progress.progress,
                message: progress.message,
                phase: progress.phase,
                timeEstimate: progress.timeEstimate,
                txHash: progress.txHash
              }))
            }));
          });
          
          // Remove completed task
          setTimeout(() => {
            set(state => {
              const newTasks = new Map(state.backgroundTasks);
              newTasks.delete(taskId);
              return { backgroundTasks: newTasks };
            });
          }, 5000);
        }
      } else {
        throw new Error(`Provider ${providerName} not implemented yet`);
      }

      if (!walletResult.success) {
        throw new Error(walletResult.error);
      }

      // Load contracts after wallet creation/restoration
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
        if (profileData && profileData.profileId) {
          socialVerifications = await aztecClient.getSocialVerifications(profileData.profileId);
        }
      }
      
      // Generate mock points & level based on verifications
      const verificationCount = Object.values(socialVerifications).filter(Boolean).length;
      const mockPoints = Math.floor(Math.random() * 500) + (verificationCount * 100) + 100;
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
      
      // Add success notification
      get().addNotification({
        type: 'success',
        title: 'Aztec Wallet Connected',
        message: 'Successfully connected to Aztec testnet!',
        txHash: walletResult.txHash
      });
      
      console.log('✅ Real Aztec wallet connected successfully!');
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
      
      get().addNotification({
        type: 'error',
        title: 'Connection Failed',
        message: error.message
      });
      
      return { success: false, error: error.message };
    }
  },

  // Mock wallet for development/fallback
  connectMockWallet: async () => {
    try {
      console.log('🎭 Using mock wallet for development...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
      
      get().addNotification({
        type: 'warning',
        title: 'Mock Wallet Connected',
        message: 'Connected in development mode with mock data.'
      });
      
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
    // Cleanup real Aztec client
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
      error: null,
      backgroundTasks: new Map()
    });
    
    // Clear localStorage
    localStorage.removeItem('aztec_wallet_connected');
    localStorage.removeItem('aztec_wallet_address');
    
    get().addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Successfully disconnected from Aztec wallet.'
    });
    
    console.log('👋 Wallet disconnected');
    return { success: true };
  },

  createProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { useMockData } = get();
      
      if (useMockData) {
        // Mock profile creation with progress simulation
        console.log('🎭 Creating mock profile...');
        
        const taskId = Date.now().toString();
        set(state => ({
          backgroundTasks: new Map(state.backgroundTasks.set(taskId, {
            type: 'profile_creation',
            status: 'running',
            progress: 0,
            message: 'Creating mock profile...',
            startTime: Date.now()
          }))
        }));
        
        // Simulate progress steps
        const steps = [
          { progress: 20, message: 'Preparing profile data...' },
          { progress: 50, message: 'Generating mock transaction...' },
          { progress: 80, message: 'Simulating blockchain confirmation...' },
          { progress: 100, message: 'Mock profile created!' }
        ];
        
        for (const step of steps) {
          await new Promise(resolve => setTimeout(resolve, 800));
          set(state => ({
            backgroundTasks: new Map(state.backgroundTasks.set(taskId, {
              ...state.backgroundTasks.get(taskId),
              progress: step.progress,
              message: step.message
            }))
          }));
        }
        
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
        
        // Remove completed task
        setTimeout(() => {
          set(state => {
            const newTasks = new Map(state.backgroundTasks);
            newTasks.delete(taskId);
            return { backgroundTasks: newTasks };
          });
        }, 3000);
        
        get().addNotification({
          type: 'success',
          title: 'Mock Profile Created',
          message: 'Profile created successfully in development mode!',
          txHash: 'mock-tx-hash-' + Date.now()
        });
        
        console.log('✅ Mock profile created!');
        return { success: true, txHash: 'mock-tx-hash' };
      }
      
      // Real Aztec profile creation
      console.log('🎭 Creating real Aztec profile...');
      
      const taskId = Date.now().toString();
      set(state => ({
        backgroundTasks: new Map(state.backgroundTasks.set(taskId, {
          type: 'profile_creation',
          status: 'running',
          progress: 0,
          message: 'Creating Aztec profile...',
          startTime: Date.now()
        }))
      }));
      
      const result = await aztecClient.createProfile(profileData, (progress) => {
        // Update background task progress
        set(state => ({
          backgroundTasks: new Map(state.backgroundTasks.set(taskId, {
            ...state.backgroundTasks.get(taskId),
            progress: progress.progress,
            message: progress.message,
            phase: progress.phase,
            timeEstimate: progress.timeEstimate,
            txHash: progress.txHash
          }))
        }));
      });
      
      if (result.success) {
        // Update state with new profile
        const profileData = await aztecClient.getProfile();
        
        set({
          profile: profileData,
          hasProfile: true, // ✅ BOOLEAN
          isLoading: false
        });
        
        // Remove completed task
        setTimeout(() => {
          set(state => {
            const newTasks = new Map(state.backgroundTasks);
            newTasks.delete(taskId);
            return { backgroundTasks: newTasks };
          });
        }, 5000);
        
        get().addNotification({
          type: 'success',
          title: 'Profile Created',
          message: 'Profile successfully created on Aztec testnet!',
          txHash: result.txHash
        });
        
        console.log('✅ Real Aztec profile created!');
        return { success: true, txHash: result.txHash };
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      set({ error: error.message, isLoading: false });
      
      get().addNotification({
        type: 'error',
        title: 'Profile Creation Failed',
        message: error.message
      });
      
      return { success: false, error: error.message };
    }
  },

  isUsernameAvailable: async (username) => {
    try {
      const { useMockData } = get();
      
      if (useMockData) {
        // Mock username check with delay
        await new Promise(resolve => setTimeout(resolve, 800));
        // Simple mock rule: available if length > 3 and doesn't contain "admin"
        return username.length > 3 && !username.toLowerCase().includes('admin');
      }
      
      // Real Aztec username check
      return await aztecClient.isUsernameAvailable(username);
      
    } catch (error) {
      console.error('❌ Username check failed:', error);
      get().addNotification({
        type: 'error',
        title: 'Username Check Failed',
        message: error.message
      });
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
        let socialVerifications = get().socialVerifications;
        
        if (profileData && profileData.profileId) {
          socialVerifications = await aztecClient.getSocialVerifications(profileData.profileId);
        }
        
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
      
      get().addNotification({
        type: 'error',
        title: 'Profile Loading Failed',
        message: error.message
      });
      
      throw error;
    }
  },

  // Helper functions
  getVerificationCount: () => {
    const { socialVerifications } = get();
    return Object.values(socialVerifications).filter(Boolean).length;
  },

  clearError: () => set({ error: null }),

  // Notification system
  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: Date.now(),
      persistent: false,
      ...notification
    };
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    // Auto-remove after 5 seconds (unless persistent)
    if (!newNotification.persistent) {
      setTimeout(() => {
        get().removeNotification(id);
      }, 5000);
    }
  },

  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  // Toggle development mode
  toggleMockMode: () => {
    const newMockMode = !get().useMockData;
    set({ useMockData: newMockMode });
    localStorage.setItem('aztec_use_mock', newMockMode.toString());
    
    // Disconnect current wallet to force reconnection
    get().disconnectWallet();
    
    console.log(`🔄 Switched to ${newMockMode ? 'mock' : 'real'} mode`);
    
    get().addNotification({
      type: 'info',
      title: 'Mode Switched',
      message: `Switched to ${newMockMode ? 'mock' : 'real'} mode. Please reconnect your wallet.`
    });
  },

  // Check for stored wallet on app load
  checkStoredWallet: async () => {
    try {
      const isConnected = localStorage.getItem('aztec_wallet_connected');
      const storedAddress = localStorage.getItem('aztec_wallet_address');
      const useMockMode = localStorage.getItem('aztec_use_mock') === 'true';
      
      if (isConnected && storedAddress) {
        set({ useMockData: useMockMode, isLoading: true });
        
        if (useMockMode) {
          // Restore mock wallet
          console.log('🔄 Restoring mock wallet from storage...');
          
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
            level: 3,
            isLoading: false
          });
          
          console.log('✅ Mock wallet restored from storage');
        } else {
          // Try to restore real Aztec wallet
          try {
            console.log('🔄 Restoring real Aztec wallet from storage...');
            
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
                if (profileData && profileData.profileId) {
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
                level: 3,
                isLoading: false
              });
              
              console.log('✅ Real Aztec wallet restored from storage');
            } else {
              throw new Error(walletResult.error);
            }
          } catch (error) {
            console.log('❌ Real wallet restoration failed, switching to mock mode');
            set({ useMockData: true, isLoading: false });
            localStorage.setItem('aztec_use_mock', 'true');
            // Retry with mock mode
            setTimeout(() => get().checkStoredWallet(), 1000);
          }
        }
      }
    } catch (error) {
      console.log('❌ Wallet restoration failed:', error);
      set({ isLoading: false });
    }
  },

  // Background task management
  getBackgroundTasks: () => {
    return Array.from(get().backgroundTasks.values());
  },

  clearCompletedTasks: () => {
    set(state => {
      const newTasks = new Map();
      for (const [id, task] of state.backgroundTasks) {
        if (task.status === 'running') {
          newTasks.set(id, task);
        }
      }
      return { backgroundTasks: newTasks };
    });
  }
}));

// Export default
export default useWalletStore;
