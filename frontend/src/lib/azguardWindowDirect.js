// src/lib/azguardWindowDirect.js
/**
 * Direct window.azguard connection without using the client library
 */

export const connectAzguardWindow = async () => {
  try {
    console.log('Attempting direct Azguard connection...');
    
    // Wait a bit for extension to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if Azguard exists
    if (!window.azguard) {
      console.error('window.azguard not found');
      window.open('https://chrome.google.com/webstore/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn', '_blank');
      return {
        success: false,
        error: 'Azguard wallet not installed'
      };
    }
    
    console.log('window.azguard found:', window.azguard);
    
    // Try to trigger the extension popup
    let accounts = [];
    
    // Method 1: Direct property access
    if (window.azguard.selectedAddress) {
      accounts = [window.azguard.selectedAddress];
      console.log('Found selectedAddress:', accounts);
    }
    
    // Method 2: Try ethereum-style request
    if (accounts.length === 0 && window.azguard.request) {
      try {
        // First try eth_accounts to see if already connected
        accounts = await window.azguard.request({ method: 'eth_accounts' });
        console.log('eth_accounts result:', accounts);
        
        // If no accounts, request access
        if (!accounts || accounts.length === 0) {
          console.log('Requesting account access...');
          accounts = await window.azguard.request({ method: 'eth_requestAccounts' });
          console.log('eth_requestAccounts result:', accounts);
        }
      } catch (e) {
        console.error('Ethereum-style request failed:', e);
      }
    }
    
    // Method 3: Try direct methods
    if (accounts.length === 0) {
      // Try enable
      if (window.azguard.enable) {
        try {
          console.log('Trying enable()...');
          const result = await window.azguard.enable();
          if (Array.isArray(result)) {
            accounts = result;
          }
        } catch (e) {
          console.error('enable() failed:', e);
        }
      }
      
      // Try connect
      if (accounts.length === 0 && window.azguard.connect) {
        try {
          console.log('Trying connect()...');
          const result = await window.azguard.connect();
          if (result) {
            if (Array.isArray(result)) {
              accounts = result;
            } else if (result.accounts) {
              accounts = result.accounts;
            } else if (typeof result === 'string') {
              accounts = [result];
            }
          }
        } catch (e) {
          console.error('connect() failed:', e);
        }
      }
    }
    
    // Method 4: Try clicking on the extension icon programmatically
    if (accounts.length === 0) {
      console.log('Trying to trigger extension popup...');
      
      // Send a message to the extension
      if (window.azguard.send) {
        try {
          const result = await window.azguard.send('eth_requestAccounts');
          if (result) accounts = result;
        } catch (e) {
          console.error('send() failed:', e);
        }
      }
      
      // Try postMessage
      if (accounts.length === 0) {
        window.postMessage({ type: 'AZGUARD_CONNECT_REQUEST' }, '*');
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check again
        if (window.azguard.selectedAddress) {
          accounts = [window.azguard.selectedAddress];
        }
      }
    }
    
    if (!accounts || accounts.length === 0) {
      throw new Error('Could not get accounts from Azguard. Please make sure the extension is unlocked.');
    }
    
    let address = accounts[0];
    
    // Handle aztec format "aztec:chainId:address"
    if (address.includes(':')) {
      const parts = address.split(':');
      address = parts[parts.length - 1];
    }
    
    console.log('Successfully connected with address:', address);
    
    // Create account wrapper
    const accountWrapper = {
      address,
      getAddress: () => ({ 
        toString: () => address,
        toHex: () => address 
      }),
      signMessage: async (message) => {
        if (window.azguard.request) {
          try {
            return await window.azguard.request({
              method: 'personal_sign',
              params: [message, address]
            });
          } catch (e) {
            console.error('personal_sign failed:', e);
          }
        }
        
        if (window.azguard.sign) {
          return await window.azguard.sign(message);
        }
        
        // Fallback
        return '0x' + 'mock_signature';
      },
      _provider: window.azguard
    };
    
    return {
      success: true,
      account: accountWrapper,
      address,
      provider: 'azguard'
    };
    
  } catch (error) {
    console.error('Azguard window connection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Azguard'
    };
  }
};
