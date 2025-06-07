// src/lib/walletSdk.js - SIMPLE VERSION
import { connectObsidion } from './obsidionWallet';
import { connectAzguardWindow } from './azguardWindowDirect';

export const connectWallet = async (provider) => {
  console.log('Connecting to wallet:', provider);
  
  switch (provider) {
    case 'obsidion':
      return await connectObsidion();
    case 'azguard':
      return await connectAzguardWindow();
    default:
      return { 
        success: false, 
        error: `Unsupported wallet provider: ${provider}` 
      };
  }
};

export const signMessage = async (account, message) => {
  try {
    if (!account) {
      throw new Error('No account provided');
    }
    
    if (!account.signMessage) {
      throw new Error('Account does not support message signing');
    }
    
    const signature = await account.signMessage(message);
    return { success: true, signature };
  } catch (err) {
    console.error('Sign message error:', err);
    return { success: false, error: err.message };
  }
};
