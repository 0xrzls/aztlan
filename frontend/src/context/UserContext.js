import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from './WalletContext';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { wallet } = useWallet();
  const [user, setUser] = useState({
    address: null,
    isRegistered: false,
    username: '',
    avatar: '',
    twitter: '',
    discord: '',
    nfts: []
  });

  // Check for existing user data when wallet changes
  useEffect(() => {
    const loadUserData = () => {
      const address = wallet.address;
      
      if (address) {
        const userData = localStorage.getItem(`user_data_${address}`);
        
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            setUser(prev => ({
              ...prev,
              ...parsedData,
              address
            }));
          } catch (error) {
            console.error('Failed to parse user data:', error);
          }
        } else {
          // Reset user state if no data found for this address
          setUser({
            address,
            isRegistered: false,
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
          username: '',
          avatar: '',
          twitter: '',
          discord: '',
          nfts: []
        });
      }
    };
    
    loadUserData();
  }, [wallet.address, wallet.isConnected]);

  // Register or update user profile
  const updateUserProfile = async (profileData) => {
    const { username, avatar, twitter, discord } = profileData;
    
    if (!wallet.address || !wallet.isConnected) {
      return { success: false, error: 'No connected wallet' };
    }
    
    try {
      // In a real app, this would verify the wallet signature and call a contract or API
      // For now, we'll use the wallet.signature that was stored during authentication
      if (!wallet.signature) {
        return { success: false, error: 'Wallet not authenticated' };
      }
      
      // Simulate registration success
      const updatedUser = {
        ...user,
        address: wallet.address,
        isRegistered: true,
        username,
        avatar,
        twitter,
        discord,
        // Mock NFT data
        nfts: [
          {
            id: 1,
            name: 'Aztlan Pioneer',
            image: avatar || '/uid/01UID.png',
            date: new Date().toISOString()
          }
        ]
      };
      
      // Update state
      setUser(updatedUser);
      
      // Save to localStorage for persistence
      localStorage.setItem(`user_registered_${wallet.address}`, 'true');
      localStorage.setItem(`user_data_${wallet.address}`, JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get user NFTs (currently mocked)
  const getUserNFTs = async (address) => {
    // In a real app, this would call a contract or API
    // For now, return mock data or stored data
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

export const useUser = () => useContext(UserContext);
