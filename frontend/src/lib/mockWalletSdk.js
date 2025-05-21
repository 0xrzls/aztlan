/**
 * Mock implementation of the Obsidion Wallet SDK for development and testing
 * This should be used only when you want to test the UI without connecting to a real wallet
 */

// Mock AztecAddress class
class AztecAddress {
  constructor(address) {
    this._address = address || `0x${Array.from({length: 40}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('')}`;
  }

  toString() {
    return this._address;
  }
}

// Mock Account class
class Account {
  constructor() {
    this._address = new AztecAddress();
  }

  getAddress() {
    return this._address;
  }

  async signMessage(message) {
    // Simulate signing delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate user rejecting signature with 10% probability
    if (Math.random() < 0.1) {
      throw new Error('User rejected signature request');
    }
    
    // Generate a mock signature
    return '0x' + Array.from({length: 130}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

// Mock AztecWalletSdk
export class AztecWalletSdk {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
  }

  /**
   * Connect to the wallet
   * @param {string} provider - The wallet provider to connect to ('obsidion')
   * @returns {Promise<Account>} The connected account
   */
  async connect(provider) {
    if (provider !== 'obsidion') {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate successful connection with 90% probability
    const success = Math.random() < 0.9;
    
    if (success) {
      this.connected = true;
      return new Account();
    } else {
      throw new Error('User rejected connection request');
    }
  }
}

// Mock obsidion connector
export const obsidion = (options = {}) => {
  return {
    id: 'obsidion',
    name: 'Obsidion',
    icon: '/wallets/obsidion.svg',
    ...options
  };
};

// For backward compatibility
export class AzguardWalletClient {
  constructor(options = {}) {
    this.sdk = new AztecWalletSdk(options);
  }
  
  async connect() {
    const account = await this.sdk.connect('obsidion');
    return {
      getAddress: () => account.getAddress().toString()
    };
  }
}
