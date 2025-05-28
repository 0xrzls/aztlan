// src/lib/aztecContracts.js
import { Contract, Fr, AztecAddress } from '@aztec/aztec.js';

// Import contract artifacts - adjust path as needed
let ProfileRegistryArtifact, PrivateSocialArtifact;

// Try to load artifacts
try {
  ProfileRegistryArtifact = require('../../../contracts/aztlan_profile/target/aztlan_profile-AztlanProfileRegistry.json');
  PrivateSocialArtifact = require('../../../contracts/aztlan_profile/target/aztlan_profile-AztlanPrivateSocial.json');
} catch (e) {
  console.warn('Contract artifacts not found, using mock data');
  // Mock artifacts for development
  ProfileRegistryArtifact = { abi: {} };
  PrivateSocialArtifact = { abi: {} };
}

// Contract addresses from deployment
const REGISTRY_ADDRESS = '0x2ec8bbff14a6b5347b3db46dcd1544abf99e9546839a740b9e37b648bc5e176f';
const SOCIAL_ADDRESS = '0x1c81a9f5bfc67d65d41c5e5172ede265144344553680facdb263f230abb9f0e1';

// Oracle address (you need to deploy an oracle contract or use a service)
const ORACLE_ADDRESS = '0x...'; // TODO: Deploy oracle contract

// Helper to hash strings to Field
export function stringToFieldHash(str) {
  if (!str) return Fr.ZERO;
  
  // Simple hash function for demo - in production use proper hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(str.toLowerCase());
  
  let hash = Fr.ZERO;
  for (let i = 0; i < data.length; i++) {
    hash = hash.add(new Fr(data[i])).mul(new Fr(31));
  }
  
  return hash;
}

// Create contract instances
export async function getContracts(wallet) {
  try {
    let registryContract, socialContract;
    
    // For Azguard
    if (wallet._azguardClient) {
      // Azguard uses a different approach
      return {
        registry: createAzguardContractWrapper(REGISTRY_ADDRESS, 'registry'),
        social: createAzguardContractWrapper(SOCIAL_ADDRESS, 'social')
      };
    }
    
    // For Obsidion
    if (wallet._sdk || wallet.account) {
      const account = wallet.account || wallet;
      
      registryContract = await Contract.at(
        AztecAddress.fromString(REGISTRY_ADDRESS),
        ProfileRegistryArtifact,
        account
      );
      
      socialContract = await Contract.at(
        AztecAddress.fromString(SOCIAL_ADDRESS),
        PrivateSocialArtifact,
        account
      );
      
      return { registry: registryContract, social: socialContract };
    }
    
    throw new Error('Unsupported wallet type');
  } catch (error) {
    console.error('Failed to create contracts:', error);
    throw error;
  }
}

// Azguard contract wrapper
function createAzguardContractWrapper(address, type) {
  return {
    address,
    type,
    // Wrapper methods that use Azguard's execute
    methods: {
      create_profile: (username_hash, token_uri_hash) => ({
        send: async function() {
          const client = window.azguardClient; // Assuming it's stored globally
          const [result] = await client.execute([{
            kind: 'send_transaction',
            account: client.accounts[0],
            actions: [{
              kind: 'call',
              contract: address,
              method: 'create_profile',
              args: [username_hash, token_uri_hash]
            }]
          }]);
          
          if (result.status !== 'ok') throw new Error(result.error);
          return { txHash: result.result };
        }
      }),
      
      has_profile: (user_address) => ({
        simulate: async function() {
          const client = window.azguardClient;
          const [result] = await client.execute([{
            kind: 'simulate_views',
            account: client.accounts[0],
            calls: [{
              kind: 'call',
              contract: address,
              method: 'has_profile',
              args: [user_address]
            }]
          }]);
          
          if (result.status !== 'ok') throw new Error(result.error);
          return result.result.decoded[0];
        }
      }),
      
      is_username_available: (username_hash) => ({
        simulate: async function() {
          const client = window.azguardClient;
          const [result] = await client.execute([{
            kind: 'simulate_views',
            account: client.accounts[0],
            calls: [{
              kind: 'call',
              contract: address,
              method: 'is_username_available',
              args: [username_hash]
            }]
          }]);
          
          if (result.status !== 'ok') throw new Error(result.error);
          return result.result.decoded[0];
        }
      })
    }
  };
}

// Profile Registry Functions

export async function createProfile(wallet, username, tokenUri) {
  try {
    const contracts = await getContracts(wallet);
    const usernameHash = stringToFieldHash(username);
    const tokenUriHash = stringToFieldHash(tokenUri);
    
    const tx = await contracts.registry.methods
      .create_profile(usernameHash, tokenUriHash)
      .send();
    
    await tx.wait();
    
    return {
      success: true,
      txHash: tx.txHash,
      profileId: await getProfileId(wallet, wallet.address)
    };
  } catch (error) {
    console.error('Create profile error:', error);
    return { success: false, error: error.message };
  }
}

export async function checkUsernameAvailable(wallet, username) {
  try {
    const contracts = await getContracts(wallet);
    const usernameHash = stringToFieldHash(username);
    
    const available = await contracts.registry.methods
      .is_username_available(usernameHash)
      .simulate();
    
    return available;
  } catch (error) {
    console.error('Check username error:', error);
    return false;
  }
}

export async function hasProfile(wallet, address) {
  try {
    const contracts = await getContracts(wallet);
    const userAddress = AztecAddress.fromString(address);
    
    const hasProf = await contracts.registry.methods
      .has_profile(userAddress)
      .simulate();
    
    return hasProf;
  } catch (error) {
    console.error('Check profile error:', error);
    return false;
  }
}

export async function getProfileId(wallet, address) {
  try {
    const contracts = await getContracts(wallet);
    const userAddress = AztecAddress.fromString(address);
    
    const profileId = await contracts.registry.methods
      .get_profile_id(userAddress)
      .simulate();
    
    return profileId.toString();
  } catch (error) {
    console.error('Get profile ID error:', error);
    return null;
  }
}

export async function updateTokenUri(wallet, newTokenUri) {
  try {
    const contracts = await getContracts(wallet);
    const tokenUriHash = stringToFieldHash(newTokenUri);
    
    const tx = await contracts.registry.methods
      .update_token_uri(tokenUriHash)
      .send();
    
    await tx.wait();
    
    return { success: true, txHash: tx.txHash };
  } catch (error) {
    console.error('Update token URI error:', error);
    return { success: false, error: error.message };
  }
}

// Social Verification Functions

export async function prepareTwitterVerification(wallet, profileId, twitterHandle) {
  try {
    const contracts = await getContracts(wallet);
    const handleHash = stringToFieldHash(twitterHandle);
    
    // This would be called privately on user's device
    const verificationHash = await contracts.social.methods
      .prepare_twitter_verification(new Fr(profileId), handleHash)
      .simulate();
    
    return verificationHash;
  } catch (error) {
    console.error('Twitter verification prep error:', error);
    throw error;
  }
}

export async function prepareDiscordVerification(wallet, profileId, discordHandle) {
  try {
    const contracts = await getContracts(wallet);
    const handleHash = stringToFieldHash(discordHandle);
    
    const verificationHash = await contracts.social.methods
      .prepare_discord_verification(new Fr(profileId), handleHash)
      .simulate();
    
    return verificationHash;
  } catch (error) {
    console.error('Discord verification prep error:', error);
    throw error;
  }
}

// Get verification stats
export async function getVerificationStats(wallet) {
  try {
    const contracts = await getContracts(wallet);
    
    const counts = await contracts.social.methods
      .get_all_verification_counts()
      .simulate();
    
    return {
      twitter: counts[0].toString(),
      discord: counts[1].toString(),
      telegram: counts[2].toString(),
      github: counts[3].toString(),
      farcaster: counts[4].toString(),
      email: counts[5].toString()
    };
  } catch (error) {
    console.error('Get verification stats error:', error);
    return null;
  }
}
