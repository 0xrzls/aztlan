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
 * Signs a message using the Obsidion Wallet account
 * @param {object} wallet - The connected wallet object with account
 * @param {string} message - The message to sign
 * @returns {Promise<string>} The signature
 */
export const signMessage = async (wallet, message) => {
  try {
    if (!wallet || !wallet.account) {
      throw new Error('Wallet not connected');
    }
    
    // Sign message using the wallet account
    const signature = await wallet.account.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Sign message error:', error);
    throw error;
  }
};

/**
 * Verifies a wallet address with the server
 * This is a placeholder function. In a real implementation,
 * this would send the signature, address, and message to your backend
 * 
 * @param {string} address - The wallet address
 * @param {string} signature - The signature of the message
 * @param {string} message - The original message that was signed
 * @returns {Promise<object>} The verification result
 */
export const verifyWallet = async (address, signature, message) => {
  // In a real implementation, this would send the signature to your backend
  // For now, we'll simulate a successful verification
  console.log('Verifying wallet:', { address, signature, message });
  
  // Simulate API call to verify signature
  // In production, this should be a real API call to your backend
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        address,
        timestamp: new Date().toISOString()
      });
    }, 500);
  });
};

/**
 * Complete authentication flow
 * @param {object} wallet - The wallet object containing address and account
 * @returns {Promise<object>} Authentication result with signature
 */
export const authenticate = async (wallet) => {
  try {
    if (!wallet.address) {
      throw new Error('Wallet not connected');
    }
    
    // Generate nonce
    const nonce = generateNonce();
    
    // Create message to sign
    const message = createSignMessage(wallet.address, nonce);
    
    // Request signature
    const signature = await signMessage(wallet, message);
    
    // Verify with backend (mocked for now)
    const verification = await verifyWallet(wallet.address, signature, message);
    
    if (verification.success) {
      return {
        success: true,
        signature,
        message,
        timestamp: verification.timestamp
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
