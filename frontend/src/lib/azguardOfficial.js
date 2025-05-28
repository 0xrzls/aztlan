// src/lib/azguardOfficial.js
import { AzguardClient } from '@azguardwallet/client';

/**
 * Official Azguard Wallet Integration using @azguardwallet/client
 */

let azguardClient = null;

// Connect to Azguard wallet
export const connectAzguardOfficial = async () => {
  try {
    console.log('Connecting to Azguard using official client...');
    
    // Check if Azguard is installed
    const isInstalled = await AzguardClient.isAzguardInstalled();
    console.log('Azguard installed:', isInstalled);
    
    if (!isInstalled) {
      // Open install page
      window.open('https://chrome.google.com/webstore/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn', '_blank');
      return {
        success: false,
        error: 'Please install Azguard wallet extension and refresh the page'
      };
    }
    
    // Create wallet client
    azguardClient = await AzguardClient.create();
    console.log('Azguard client created');
    
    // Handle wallet disconnection
    azguardClient.onDisconnected.addHandler(() => {
      console.log('Azguard wallet disconnected');
      azguardClient = null;
    });
    
    // Connect if not already connected
    if (!azguardClient.connected) {
      console.log('Connecting to Azguard...');
      await azguardClient.connect(
        {
          // DApp metadata
          name: 'Aztlan Quest',
          url: window.location.origin,
          icon: window.location.origin + '/logo.svg'
        },
        [
          {
            // Connect to Aztec testnet
            chains: ['aztec:11155111'], // testnet
            // Methods we'll use
            methods: ['send_transaction', 'add_private_authwit', 'call', 'simulate_views']
          }
        ]
      );
    }
    
    // Get connected accounts
    const accounts = azguardClient.accounts;
    console.log('Connected accounts:', accounts);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available');
    }
    
    // Get first account - format is "aztec:chainId:address"
    const accountString = accounts[0];
    const parts = accountString.split(':');
    const address = parts[parts.length - 1]; // Get the address part
    
    console.log('Connected with address:', address);
    
    // Create account wrapper compatible with our interface
    const accountWrapper = {
      address,
      accountString, // Keep the full account string for Azguard operations
      getAddress: () => ({ 
        toString: () => address,
        toHex: () => address 
      }),
      signMessage: async (message) => {
        // Azguard doesn't have direct message signing like Ethereum
        // You might need to implement this differently based on your needs
        // For now, we'll create a hash of the message
        const messageHash = await hashMessage(message);
        return messageHash;
      },
      // Execute operations on Azguard
      execute: async (operations) => {
        return await azguardClient.execute(operations);
      },
      // Simulate view functions
      simulateViews: async (calls) => {
        const result = await azguardClient.execute([
          {
            kind: 'simulate_views',
            account: accountString,
            calls
          }
        ]);
        return result[0];
      },
      // Send transaction
      sendTransaction: async (actions) => {
        const result = await azguardClient.execute([
          {
            kind: 'send_transaction',
            account: accountString,
            actions
          }
        ]);
        return result[0];
      },
      // Keep reference to client
      _client: azguardClient
    };
    
    return {
      success: true,
      account: accountWrapper,
      address,
      provider: 'azguard'
    };
  } catch (error) {
    console.error('Azguard connection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Azguard'
    };
  }
};

// Helper function to hash a message
async function hashMessage(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

// Register a contract (if needed)
export const registerContract = async (contractData) => {
  if (!azguardClient || !azguardClient.connected) {
    throw new Error('Azguard wallet not connected');
  }
  
  const result = await azguardClient.execute([
    {
      kind: 'register_contract',
      chain: contractData.chain || 'aztec:11155111',
      address: contractData.address,
      instance: contractData.instance,
      artifact: contractData.artifact
    }
  ]);
  
  return result[0];
};

// Disconnect
export const disconnectAzguard = async () => {
  if (azguardClient) {
    await azguardClient.disconnect();
    azguardClient = null;
  }
};

// Get current client
export const getAzguardClient = () => azguardClient;
