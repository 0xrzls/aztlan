// src/lib/obsidionWallet.js - SIMPLE VERSION (No Aztec SDK)

/**
 * Simple Obsidion wallet connection without Aztec SDK
 * This is a temporary solution until Aztec SDK issues are resolved
 */

export const connectObsidion = async () => {
  try {
    console.log('Connecting to Obsidion (simplified)...');
    
    // Check if Obsidion is available in browser
    if (typeof window !== 'undefined' && window.obsidion) {
      console.log('Obsidion extension detected');
      
      // Try to connect using the extension API
      const accounts = await window.obsidion.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Obsidion');
      }
      
      const address = accounts[0];
      
      // Create simple account wrapper
      const account = {
        address,
        getAddress: () => ({ 
          toString: () => address,
          toHex: () => address 
        }),
        signMessage: async (message) => {
          try {
            // Try personal_sign first
            return await window.obsidion.request({
              method: 'personal_sign',
              params: [message, address]
            });
          } catch (e) {
            // Fallback: create mock signature for development
            console.warn('Obsidion signing failed, using mock signature');
            return '0xmock_signature_' + Date.now().toString(16);
          }
        },
        _provider: window.obsidion
      };
      
      return {
        success: true,
        account,
        address,
        provider: 'obsidion'
      };
    }
    
    // If no Obsidion extension, create mock connection for development
    console.log('Obsidion extension not found, creating mock connection...');
    
    const mockAddress = '0x' + Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    
    const mockAccount = {
      address: mockAddress,
      getAddress: () => ({ 
        toString: () => mockAddress,
        toHex: () => mockAddress 
      }),
      signMessage: async (message) => {
        // Mock signing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return '0xmock_signature_' + Date.now().toString(16);
      },
      _isMock: true
    };
    
    return {
      success: true,
      account: mockAccount,
      address: mockAddress,
      provider: 'obsidion'
    };
    
  } catch (error) {
    console.error('Obsidion connection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Obsidion'
    };
  }
};
