// src/lib/mockWalletSdk.js
/**
 * Mock implementation of the Obsidion Wallet SDK for development and testing
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
    
    // Generate a mock signature
    return '0x' + Array.from({length: 130}, () => 
      Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

// Mock Connector
class ObsidionConnector {
  constructor(options = {}) {
    this.id = 'obsidion';
    this.name = 'Obsidion';
    this.icon = options.appIconUrl || '/wallets/obsidion.svg';
  }
}

// Mock AztecWalletSdk
export class AztecWalletSdk {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
    
    // Create connectors from options
    this.connectors = (options.connectors || []).map(connector => {
      if (connector.id === 'obsidion') {
        return new ObsidionConnector(connector);
      }
      return connector;
    });
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
    
    this.connected = true;
    return new Account();
  }
}

// Helper factory for obsidion connector
export const obsidion = (options = {}) => {
  return {
    id: 'obsidion',
    appName: options.appName || 'Aztlan Quest',
    walletUrl: options.walletUrl || 'https://app.obsidion.xyz',
    appIconUrl: options.appIconUrl || '/logo.svg',
  };
};
