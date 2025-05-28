// src/lib/azguardWallet.js
/**
 * Azguard Wallet Integration
 * Since Azguard is a browser extension like MetaMask, we'll interact with it through window object
 */

// Check if Azguard is installed
export const isAzguardInstalled = () => {
  return typeof window !== 'undefined' && window.azguard !== undefined;
};

// Request account access
export const requestAzguardAccess = async () => {
  if (!isAzguardInstalled()) {
    throw new Error('Azguard wallet is not installed. Please install the browser extension.');
  }
  
  try {
    // Request access to accounts
    const accounts = await window.azguard.request({ method: 'eth_requestAccounts' });
    return accounts[0]; // Return the first account
  } catch (error) {
    throw new Error(`Failed to connect to Azguard: ${error.message}`);
  }
};

// Get the current connected account
export const getAzguardAccount = async () => {
  if (!isAzguardInstalled()) {
    return null;
  }
  
  try {
    const accounts = await window.azguard.request({ method: 'eth_accounts' });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Failed to get Azguard accounts:', error);
    return null;
  }
};

// Sign a message with Azguard
export const signMessageWithAzguard = async (message, account) => {
  if (!isAzguardInstalled()) {
    throw new Error('Azguard wallet is not installed');
  }
  
  try {
    const signature = await window.azguard.request({
      method: 'personal_sign',
      params: [message, account]
    });
    return signature;
  } catch (error) {
    throw new Error(`Failed to sign message: ${error.message}`);
  }
};

// Connect to Azguard wallet
export const connectAzguard = async () => {
  try {
    // Check if Azguard is installed
    if (!isAzguardInstalled()) {
      // Open Azguard extension install page
      window.open('https://chrome.google.com/webstore/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn', '_blank');
      return {
        success: false,
        error: 'Please install Azguard wallet extension and try again'
      };
    }
    
    // Request account access
    const address = await requestAzguardAccess();
    
    // Create account interface that matches our expected structure
    const account = {
      address,
      getAddress: () => ({ toString: () => address }),
      signMessage: async (message) => {
        return await signMessageWithAzguard(message, address);
      },
      // Add any other methods required by your app
    };
    
    return {
      success: true,
      account,
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

// Listen for account changes
export const onAzguardAccountChange = (callback) => {
  if (!isAzguardInstalled()) return;
  
  window.azguard.on('accountsChanged', (accounts) => {
    callback(accounts[0] || null);
  });
};

// Listen for chain changes
export const onAzguardChainChange = (callback) => {
  if (!isAzguardInstalled()) return;
  
  window.azguard.on('chainChanged', (chainId) => {
    callback(chainId);
  });
};
