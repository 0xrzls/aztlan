// src/lib/mintProfileFlow.js - COMPLETE FIXED FILE
import { generateProfileImage } from '../utils/profileImageGenerator';

/**
 * Mock contract functions - TODO: Replace with real Aztec contract integration
 */

// Check if username is available
const checkUsernameAvailable = async (wallet, username) => {
  try {
    // Simple localStorage check for now
    const usedUsernames = JSON.parse(localStorage.getItem('aztlan_usernames') || '[]');
    return !usedUsernames.includes(username.toLowerCase());
  } catch (error) {
    console.error('Username check error:', error);
    return false;
  }
};

// Check if user has existing profile
const hasProfile = async (wallet, address) => {
  try {
    // Simple localStorage check for now
    const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
    return !!profiles[address];
  } catch (error) {
    console.error('Profile check error:', error);
    return false;
  }
};

// Create profile on blockchain (mock)
const createProfile = async (wallet, username, tokenUri) => {
  try {
    console.log('Creating profile on blockchain...', { username, tokenUri });
    
    // Get existing data
    const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
    const usernames = JSON.parse(localStorage.getItem('aztlan_usernames') || '[]');
    
    // Add username to used list
    if (!usernames.includes(username.toLowerCase())) {
      usernames.push(username.toLowerCase());
      localStorage.setItem('aztlan_usernames', JSON.stringify(usernames));
    }
    
    // Create profile entry
    const profileId = Object.keys(profiles).length + 1;
    const profileData = {
      username,
      tokenUri,
      profileId: profileId.toString(),
      createdAt: Date.now(),
      address: wallet.address
    };
    
    profiles[wallet.address] = profileData;
    localStorage.setItem('aztlan_profiles', JSON.stringify(profiles));
    localStorage.setItem(`user_registered_${wallet.address}`, 'true');
    
    // Mock blockchain delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      txHash: '0x' + Date.now().toString(16),
      profileId: profileId.toString()
    };
  } catch (error) {
    console.error('Create profile error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Upload to IPFS (mock implementation)
const uploadToIPFS = async (imageBlob) => {
  try {
    console.log('Uploading to IPFS...');
    
    // For development, convert to base64 data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Mock IPFS hash
        const mockHash = 'Qm' + Date.now().toString(36);
        resolve({
          ipfsUrl: `ipfs://${mockHash}`,
          ipfsHash: mockHash,
          dataUrl: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS: ' + error.message);
  }
};

/**
 * Complete minting flow for Aztlan Profile
 * @param {Object} params - Minting parameters
 * @returns {Promise<Object>} - Result object with success status
 */
export async function mintProfileNFT({
  wallet,
  username,
  name,
  twitter,
  discord,
  avatar
}) {
  try {
    console.log('Starting profile minting flow...', { username, name });
    
    // Step 1: Validate wallet
    if (!wallet || !wallet.address) {
      throw new Error('Wallet not connected');
    }
    
    // Step 2: Check if user already has profile
    console.log('Checking existing profile...');
    const alreadyHasProfile = await hasProfile(wallet, wallet.address);
    if (alreadyHasProfile) {
      throw new Error('You already have a profile');
    }
    
    // Step 3: Check username availability
    console.log('Checking username availability...');
    const isAvailable = await checkUsernameAvailable(wallet, username);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }
    
    // Step 4: Generate NFT image
    console.log('Generating NFT image...');
    let imageData;
    try {
      imageData = await generateProfileImage({
        name: name || username,
        username,
        twitter: twitter || '',
        discord: discord || '',
        avatar: avatar || '/uid/01UID.png'
      });
    } catch (imgError) {
      console.warn('Image generation failed, using fallback:', imgError);
      // Fallback: use avatar directly
      imageData = {
        blob: new Blob(),
        dataUrl: avatar || '/uid/01UID.png'
      };
    }
    
    // Step 5: Upload to IPFS
    console.log('Uploading to IPFS...');
    const { ipfsUrl, dataUrl } = await uploadToIPFS(imageData.blob);
    
    // Step 6: Create profile on-chain
    console.log('Creating profile on blockchain...');
    const result = await createProfile(wallet, username, ipfsUrl);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create profile on blockchain');
    }
    
    // Step 7: Store additional data
    const profileId = result.profileId;
    
    // Store social handles for verification later
    if (twitter && profileId) {
      console.log('Storing Twitter handle for verification:', twitter);
      localStorage.setItem(`aztlan_twitter_${profileId}`, twitter);
    }
    
    if (discord && profileId) {
      console.log('Storing Discord handle for verification:', discord);
      localStorage.setItem(`aztlan_discord_${profileId}`, discord);
    }
    
    console.log('Profile minting completed successfully!');
    
    return {
      success: true,
      txHash: result.txHash,
      profileId: profileId,
      ipfsUrl: ipfsUrl,
      imageData: dataUrl || imageData.dataUrl
    };
    
  } catch (error) {
    console.error('Mint profile error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during minting'
    };
  }
}

/**
 * Update social handles (after profile creation)
 * @param {Object} params - Update parameters
 * @returns {Promise<Object>} - Result object
 */
export async function updateSocialHandles({
  wallet,
  profileId,
  twitter,
  discord
}) {
  try {
    console.log('Updating social handles...', { profileId, twitter, discord });
    
    const results = {
      twitter: null,
      discord: null
    };
    
    // Mock verification process
    if (twitter) {
      // Generate mock verification hash
      const twitterHash = 'twitter_verification_' + Date.now() + '_' + Math.random().toString(36);
      results.twitter = twitterHash;
      localStorage.setItem(`aztlan_twitter_verification_${profileId}`, twitterHash);
      console.log('Twitter verification prepared:', twitterHash);
    }
    
    if (discord) {
      // Generate mock verification hash
      const discordHash = 'discord_verification_' + Date.now() + '_' + Math.random().toString(36);
      results.discord = discordHash;
      localStorage.setItem(`aztlan_discord_verification_${profileId}`, discordHash);
      console.log('Discord verification prepared:', discordHash);
    }
    
    return {
      success: true,
      verificationHashes: results
    };
  } catch (error) {
    console.error('Update socials error:', error);
    return {
      success: false,
      error: error.message || 'Failed to update social handles'
    };
  }
}

/**
 * Get profile by address (helper function)
 * @param {string} address - Wallet address
 * @returns {Object|null} - Profile data or null
 */
export function getProfileByAddress(address) {
  try {
    const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
    return profiles[address] || null;
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

/**
 * Get all registered usernames (helper function)
 * @returns {Array} - Array of registered usernames
 */
export function getRegisteredUsernames() {
  try {
    return JSON.parse(localStorage.getItem('aztlan_usernames') || '[]');
  } catch (error) {
    console.error('Error getting usernames:', error);
    return [];
  }
}
