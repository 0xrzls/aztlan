// src/utils/auth.js
/**
 * Generates a nonce that can be used for authentication
 * @returns {string} The generated nonce
 */
export const generateNonce = () => {
  // Generate a random string as a nonce
  const randomBytes = new Uint8Array(16);
  window.crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Creates a message for the user to sign for authentication
 * @param {string} address - The wallet address
 * @param {string} nonce - The generated nonce
 * @returns {string} The formatted message to sign
 */
export const createSignMessage = (address, nonce) => {
  return `Welcome to Aztlan Quest!

To ensure secure access to our platform, please sign this message.

Wallet address: ${address}
Nonce: ${nonce}
Time: ${new Date().toISOString()}

By signing this message, you confirm that you are the owner of this wallet.`;
};

/**
 * Complete authentication flow
 * @param {object} params - The wallet object containing address and account
 * @returns {Promise<object>} Authentication result with signature
 */
export const authenticate = async (params) => {
  try {
    const { address, account } = params;
    
    if (!address || !account) {
      throw new Error('Wallet not connected properly');
    }
    
    // Generate nonce
    const nonce = generateNonce();
    
    // Create message to sign
    const message = createSignMessage(address, nonce);
    
    // Request signature
    const signature = await account.signMessage(message);
    
    // In a real application, you would verify this signature with your backend
    // For now, we'll just pretend it was successful
    const mockVerification = {
      success: true,
      timestamp: new Date().toISOString()
    };
    
    if (mockVerification.success) {
      return {
        success: true,
        signature,
        message,
        timestamp: mockVerification.timestamp
      };
    } else {
      throw new Error('Verification failed');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
