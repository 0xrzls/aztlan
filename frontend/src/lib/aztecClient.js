// src/lib/aztecClient.js
import { createPXEClient, waitForPXE, Contract, Fr, GrumpkinScalar } from '@aztec/aztec.js';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { getInitialTestAccountsWallets } from '@aztec/accounts/testing';

class AztecClient {
  constructor() {
    this.pxe = null;
    this.wallet = null;
    this.contracts = new Map();
    this.isInitialized = false;
  }

  async initialize(pxeUrl = 'https://aztec-alpha-testnet-fullnode.zkv.xyz') {
    try {
      // Initialize PXE connection
      this.pxe = createPXEClient(pxeUrl);
      await waitForPXE(this.pxe);
      
      // Load test accounts for development
      const [testWallet] = await getInitialTestAccountsWallets(this.pxe);
      this.wallet = testWallet;
      
      this.isInitialized = true;
      return { success: true, wallet: this.wallet };
    } catch (error) {
      console.error('Aztec client initialization failed:', error);
      throw new Error(`Failed to initialize Aztec: ${error.message}`);
    }
  }

  async createAccount() {
    if (!this.pxe) throw new Error('PXE not initialized');
    
    const encryptionSecretKey = Fr.random();
    const signingPrivateKey = GrumpkinScalar.random();
    
    const account = getSchnorrAccount(this.pxe, encryptionSecretKey, signingPrivateKey);
    const wallet = await account.getWallet();
    
    // Deploy account contract
    await account.deploy().wait();
    
    return wallet;
  }

  async getContract(address, artifact) {
    if (!this.wallet) throw new Error('Wallet not initialized');
    
    const contractKey = `${address}-${artifact.name}`;
    if (this.contracts.has(contractKey)) {
      return this.contracts.get(contractKey);
    }

    const contract = await Contract.at(address, artifact, this.wallet);
    this.contracts.set(contractKey, contract);
    return contract;
  }

  async deployContract(artifact, constructorArgs = []) {
    if (!this.wallet) throw new Error('Wallet not initialized');
    
    const contract = await Contract.deploy(this.wallet, artifact, constructorArgs)
      .send()
      .deployed();
    
    this.contracts.set(contract.address.toString(), contract);
    return contract;
  }
}

export const aztecClient = new AztecClient();
export default aztecClient;
