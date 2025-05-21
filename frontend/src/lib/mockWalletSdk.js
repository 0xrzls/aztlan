// Mock implementation of wallet SDK for development
// Replace with actual SDK when ready

export class AztecWalletSdk {
  constructor(config) {
    this.config = config;
    console.log('Mock Aztec SDK initialized with config:', config);
  }

  async connect(providerName) {
    console.log(`Connecting to ${providerName}...`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock account object
    return {
      getAddress: () => {
        // Generate random address-like string
        const randomHex = [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
        return `0x${randomHex}`;
      }
    };
  }
}

export const obsidion = (config) => {
  return {
    name: 'obsidion',
    config
  };
};

export class AzguardWalletClient {
  constructor(config) {
    this.config = config;
    console.log('Mock Azguard client initialized with config:', config);
  }

  async connect() {
    console.log('Connecting to Azguard wallet...');
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate random address
    const randomHex = [...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const address = `0x${randomHex}`;
    
    return {
      getAddress: () => address,
      address
    };
  }
}
