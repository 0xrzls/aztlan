// src/lib/walletSdk.js
export const connectWallet = async (providerName) => {
  // Mock wallet connection
  return {
    success: true,
    account: { address: '0x1234567890abcdef1234567890abcdef12345678' },
    address: '0x1234567890abcdef1234567890abcdef12345678',
    provider: providerName
  };
};

export const signMessage = async (account, message) => {
  // Mock message signing
  return {
    success: true,
    signature: 'mock-signature-' + Date.now()
  };
};
