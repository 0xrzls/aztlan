// src/lib/azguardClient.js
import { AzguardClient } from '@azguardwallet/client';

export const connectAzguard = async () => {
  try {
    console.log('Checking if Azguard is installed...');
    const isInstalled = await AzguardClient.isAzguardInstalled();
    
    if (!isInstalled) {
      window.open(
        'https://chrome.google.com/webstore/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn',
        '_blank'
      );
      return { success: false, error: 'Azguard wallet not installed' };
    }

    console.log('Creating Azguard client...');
    const azguard = await AzguardClient.create();
    if (!azguard) throw new Error('Failed to initialize Azguard client');

    console.log('Azguard connected status:', azguard.connected);
    
    if (!azguard.connected) {
      console.log('Connecting to Azguard...');
      await azguard.connect(
        { 
          name: 'Aztlan Quest', 
          iconUrl: window.location.origin + '/logo.svg' 
        },
        [
          {
            chains: ['aztec:11155111'],
            methods: ['send_transaction', 'call'],
          },
        ]
      );
    }

    const accounts = azguard.accounts;
    console.log('Azguard accounts:', accounts);
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No account returned from Azguard');
    }

    // Get the first account - format: "aztec:chainId:address"
    const fullAccount = accounts[0];
    let address;
    
    // Parse the address from the full account string
    if (typeof fullAccount === 'string' && fullAccount.includes(':')) {
      const parts = fullAccount.split(':');
      address = parts[parts.length - 1]; // Get the last part (the actual address)
      console.log('Parsed address:', address);
    } else {
      // If it's already just an address
      address = fullAccount;
    }

    const accountWrapper = {
      address,
      fullAccount, // Keep the full account string for Azguard operations
      getAddress: () => ({ toString: () => address }),
      signMessage: async (msg) => {
        // Azguard doesn't support traditional message signing
        // Create a hash as a workaround for authentication
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(msg);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          return '0x' + hashHex;
        } catch (err) {
          // Fallback
          return '0xazguard_' + Date.now().toString(16);
        }
      },
      _azguardClient: azguard
    };

    // Store client globally for contract access
    window.azguardClient = azguard;
    
    return { success: true, account: accountWrapper, address, provider: 'azguard' };
  } catch (err) {
    console.error('Azguard connection error:', err);
    return { success: false, error: err.message };
  }
};
