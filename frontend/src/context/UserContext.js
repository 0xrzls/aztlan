import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState({
    address: null,
    isRegistered: false,
    username: '',
    avatar: '',
    twitter: '',
    discord: '',
    nfts: []
  });

  // Check for existing user data on mount
  useEffect(() => {
    const loadUserData = () => {
      const address = localStorage.getItem('wallet_address');
      
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
        }
      }
    };
    
    loadUserData();
  }, []);

  // Register or update user profile
  const updateUserProfile = async (profileData) => {
    const { username, avatar, twitter, discord } = profileData;
    const address = localStorage.getItem('wallet_address');
    
    if (!address) {
      return { success: false, error: 'No connected wallet' };
    }
    
    try {
      // In a real app, this would call a contract or API
      // Simulate registration success
      const updatedUser = {
        ...user,
        address,
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
      localStorage.setItem(`user_registered_${address}`, 'true');
      localStorage.setItem(`user_data_${address}`, JSON.stringify(updatedUser));
      
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
