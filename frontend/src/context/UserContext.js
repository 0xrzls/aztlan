// src/context/UserContext.js - FIXED VERSION
import React, { createContext, useContext, useState, useEffect } from 'react';
import useWalletStore from '../store/walletStore'; // ✅ NEW: Use Zustand instead
// ❌ REMOVED: import { useWallet } from './WalletContext';
// ❌ REMOVED: import { hasProfile, getProfileId } from '../lib/aztecContractsSimple';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  // ✅ NEW: Use Zustand store
  const { isConnected, address, account } = useWalletStore();
  
  const [user, setUser] = useState({
    address: null,
    isRegistered: false,
    username: '',
    avatar: '',
    twitter: '',
    discord: '',
    profileId: null,
    nfts: []
  });

  // Check for existing user data when wallet changes
  useEffect(() => {
    const loadUserData = async () => {
      if (address && isConnected && account) {
        try {
          console.log('Checking profile for address:', address);
          
          // For now, just check localStorage (simplified)
          // TODO: Add back blockchain check later
          const userData = localStorage.getItem(`user_data_${address}`);
          
          if (userData) {
            const parsedData = JSON.parse(userData);
            setUser(prev => ({
              ...prev,
              ...parsedData,
              address,
              isRegistered: true
            }));
          } else {
            // No profile yet
            console.log('No profile found for address');
            setUser({
              address,
              isRegistered: false,
              profileId: null,
              username: '',
              avatar: '',
              twitter: '',
              discord: '',
              nfts: []
            });
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Fallback to unregistered state
          setUser({
            address,
            isRegistered: false,
            profileId: null,
            username: '',
            avatar: '',
            twitter: '',
            discord: '',
            nfts: []
          });
        }
      } else {
        // Reset user state if no wallet connected
        setUser({
          address: null,
          isRegistered: false,
          profileId: null,
          username: '',
          avatar: '',
          twitter: '',
          discord: '',
          nfts: []
        });
      }
    };
    
    if (isConnected && account) {
      loadUserData();
    }
  }, [address, isConnected, account]);

  // Register or update user profile (called after successful minting)
  const updateUserProfile = async (profileData) => {
    const { username, avatar, twitter, discord, profileId, txHash, nftUri } = profileData;
    
    if (!address || !isConnected) {
      return { success: false, error: 'No connected wallet' };
    }
    
    try {
      // Profile has been minted, update local state
      const updatedUser = {
        address: address,
        isRegistered: true,
        username,
        avatar,
        twitter,
        discord,
        profileId,
        nftUri,
        // Update NFT data
        nfts: [
          {
            id: profileId,
            name: 'Aztlan Profile #' + profileId,
            image: nftUri || avatar || '/uid/01UID.png',
            date: new Date().toISOString(),
            txHash
          }
        ]
      };
      
      // Update state
      setUser(updatedUser);
      
      // Save to localStorage for persistence
      localStorage.setItem(`user_data_${address}`, JSON.stringify(updatedUser));
      
      console.log('Profile updated successfully:', updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user NFTs
  const getUserNFTs = async (address) => {
    // Return stored NFTs or empty array
    return user.nfts || [];
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUserProfile,
        getUserNFTs
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
