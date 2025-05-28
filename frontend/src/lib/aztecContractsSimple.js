// src/lib/aztecContractsSimple.js
/**
 * Simplified contract integration without @aztec/aztec.js dependency
 */

// Contract addresses from deployment
const REGISTRY_ADDRESS = '0x2ec8bbff14a6b5347b3db46dcd1544abf99e9546839a740b9e37b648bc5e176f';
const SOCIAL_ADDRESS = '0x1c81a9f5bfc67d65d41c5e5172ede265144344553680facdb263f230abb9f0e1';

// Helper to convert string to simple hash
export function stringToFieldHash(str) {
  if (!str) return 0;
  
  let hash = 0;
  const lowercased = str.toLowerCase();
  for (let i = 0; i < lowercased.length; i++) {
    const char = lowercased.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Check username availability
export async function checkUsernameAvailable(wallet, username) {
  try {
    // For Azguard
    if (wallet._azguardClient) {
      const client = wallet._azguardClient;
      const usernameHash = stringToFieldHash(username);
      
      const [result] = await client.execute([{
        kind: 'simulate_views',
        account: wallet.fullAccount || client.accounts[0],
        calls: [{
          kind: 'call',
          contract: REGISTRY_ADDRESS,
          method: 'is_username_available',
          args: [usernameHash]
        }]
      }]);
      
      if (result.status !== 'ok') {
        console.error('Username check failed:', result.error);
        return false;
      }
      
      return result.result.decoded[0];
    }
    
    // For Obsidion - simplified check
    // In production, you'd use proper Aztec.js integration
    const usedUsernames = JSON.parse(localStorage.getItem('aztlan_usernames') || '[]');
    return !usedUsernames.includes(username.toLowerCase());
    
  } catch (error) {
    console.error('Check username error:', error);
    return false;
  }
}

// Check if user has profile
export async function hasProfile(wallet, address) {
  try {
    // For Azguard
    if (wallet._azguardClient) {
      const client = wallet._azguardClient;
      
      const [result] = await client.execute([{
        kind: 'simulate_views',
        account: wallet.fullAccount || client.accounts[0],
        calls: [{
          kind: 'call',
          contract: REGISTRY_ADDRESS,
          method: 'has_profile',
          args: [address]
        }]
      }]);
      
      if (result.status !== 'ok') {
        console.error('Profile check failed:', result.error);
        return false;
      }
      
      return result.result.decoded[0];
    }
    
    // For Obsidion - simplified check
    const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
    return !!profiles[address];
    
  } catch (error) {
    console.error('Has profile check error:', error);
    return false;
  }
}

// Get profile ID
export async function getProfileId(wallet, address) {
  try {
    // For Azguard
    if (wallet._azguardClient) {
      const client = wallet._azguardClient;
      
      const [result] = await client.execute([{
        kind: 'simulate_views',
        account: wallet.fullAccount || client.accounts[0],
        calls: [{
          kind: 'call',
          contract: REGISTRY_ADDRESS,
          method: 'get_profile_id',
          args: [address]
        }]
      }]);
      
      if (result.status !== 'ok') {
        console.error('Get profile ID failed:', result.error);
        return null;
      }
      
      return result.result.decoded[0]?.toString() || null;
    }
    
    // For Obsidion - generate from stored data
    const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
    return profiles[address]?.profileId || null;
    
  } catch (error) {
    console.error('Get profile ID error:', error);
    return null;
  }
}

// Create profile
export async function createProfile(wallet, username, tokenUri) {
  try {
    const usernameHash = stringToFieldHash(username);
    const tokenUriHash = stringToFieldHash(tokenUri);
    
    // For Azguard
    if (wallet._azguardClient) {
      const client = wallet._azguardClient;
      
      const [result] = await client.execute([{
        kind: 'send_transaction',
        account: wallet.fullAccount || client.accounts[0],
        actions: [{
          kind: 'call',
          contract: REGISTRY_ADDRESS,
          method: 'create_profile',
          args: [usernameHash, tokenUriHash]
        }]
      }]);
      
      if (result.status !== 'ok') {
        throw new Error(result.error || 'Transaction failed');
      }
      
      // Store locally
      updateLocalStorage(wallet.address, username, tokenUri);
      
      return {
        success: true,
        txHash: result.result,
        profileId: await getNextProfileId()
      };
    }
    
    // For Obsidion - simulate transaction
    // In production, use proper Aztec.js
    console.log('Creating profile for Obsidion wallet...');
    
    // Simulate contract call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store locally
    updateLocalStorage(wallet.address, username, tokenUri);
    
    return {
      success: true,
      txHash: '0x' + Date.now().toString(16),
      profileId: await getNextProfileId()
    };
    
  } catch (error) {
    console.error('Create profile error:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions
function updateLocalStorage(address, username, tokenUri) {
  // Update usernames list
  const usernames = JSON.parse(localStorage.getItem('aztlan_usernames') || '[]');
  if (!usernames.includes(username.toLowerCase())) {
    usernames.push(username.toLowerCase());
    localStorage.setItem('aztlan_usernames', JSON.stringify(usernames));
  }
  
  // Update profiles
  const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
  const profileId = Object.keys(profiles).length + 1;
  
  profiles[address] = {
    username,
    tokenUri,
    profileId: profileId.toString(),
    createdAt: Date.now()
  };
  
  localStorage.setItem('aztlan_profiles', JSON.stringify(profiles));
  localStorage.setItem(`user_registered_${address}`, 'true');
}

async function getNextProfileId() {
  const profiles = JSON.parse(localStorage.getItem('aztlan_profiles') || '{}');
  return (Object.keys(profiles).length + 1).toString();
}
