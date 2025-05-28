// src/lib/mintProfileFlow.js
import { 
  createProfile, 
  checkUsernameAvailable, 
  hasProfile,
  getProfileId
} from './aztecContractsSimple'; // Use simplified version
import { generateProfileImage, uploadToIPFS } from '../utils/profileImageGenerator';

/**
 * Complete minting flow for Aztlan Profile
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
    // Step 1: Check if user already has profile
    const alreadyHasProfile = await hasProfile(wallet, wallet.address);
    if (alreadyHasProfile) {
      throw new Error('You already have a profile');
    }
    
    // Step 2: Check username availability
    const isAvailable = await checkUsernameAvailable(wallet, username);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }
    
    // Step 3: Generate NFT image
    console.log('Generating NFT image...');
    const imageData = await generateProfileImage({
      name,
      username,
      twitter,
      discord,
      avatar
    });
    
    // Step 4: Upload to IPFS
    console.log('Uploading to IPFS...');
    const { ipfsUrl } = await uploadToIPFS(imageData.blob);
    
    // Step 5: Create profile on-chain
    console.log('Creating profile on-chain...');
    const result = await createProfile(wallet, username, ipfsUrl);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create profile');
    }
    
    // Step 6: Store social verification data (simplified for now)
    const profileId = result.profileId;
    
    if (twitter && profileId) {
      console.log('Twitter handle stored:', twitter);
      // In production, this would prepare verification hash
    }
    
    if (discord && profileId) {
      console.log('Discord handle stored:', discord);
      // In production, this would prepare verification hash
    }
    
    return {
      success: true,
      txHash: result.txHash,
      profileId: profileId,
      ipfsUrl: ipfsUrl,
      imageData: imageData.dataUrl
    };
    
  } catch (error) {
    console.error('Mint profile error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update social handles (after profile creation)
 */
export async function updateSocialHandles({
  wallet,
  profileId,
  twitter,
  discord
}) {
  try {
    const results = {
      twitter: null,
      discord: null
    };
    
    if (twitter) {
      const twitterHash = await prepareTwitterVerification(wallet, profileId, twitter);
      // Send to oracle for verification
      results.twitter = twitterHash;
    }
    
    if (discord) {
      const discordHash = await prepareDiscordVerification(wallet, profileId, discord);
      // Send to oracle for verification
      results.discord = discordHash;
    }
    
    return {
      success: true,
      verificationHashes: results
    };
  } catch (error) {
    console.error('Update socials error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
