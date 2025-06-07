// src/lib/aztecClient.js - REAL AZTEC INTEGRATION
import { 
  createPXEClient,
  getSchnorrAccount,
  generatePrivateKey,
  Contract,
  Fr,
  computeSecretHash,
  AztecAddress
} from '@aztec/aztec.js';

import ProfileRegistryArtifact from '../artifacts/AztlanProfileRegistry.json';
import PrivateSocialsArtifact from '../artifacts/AztlanPrivateSocial.json';

// Contract addresses from your deployment
const PROFILE_REGISTRY_ADDRESS = process.env.REACT_APP_PROFILE_REGISTRY_ADDRESS;
const PRIVATE_SOCIALS_ADDRESS = process.env.REACT_APP_PRIVATE_SOCIALS_ADDRESS;
const PXE_URL = process.env.REACT_APP_PXE_URL;

class AztecClient {
  constructor() {
    this.pxe = null;
    this.account = null;
    this.profileRegistryContract = null;
    this.privateSocialsContract = null;
    this.isConnected = false;
  }

  /**
   * Initialize PXE Client connection to Aztec testnet
   */
  async initialize() {
    try {
      console.log('Connecting to Aztec PXE:', PXE_URL);
      this.pxe = createPXEClient(PXE_URL);
      
      // Test connection
      const nodeInfo = await this.pxe.getNodeInfo();
      console.log('Connected to Aztec node:', nodeInfo);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Aztec client:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create new Aztec wallet in browser
   */
  async createWallet() {
    try {
      if (!this.pxe) {
        await this.initialize();
      }

      // Generate new keypair
      const encryptionPrivateKey = generatePrivateKey();
      const signingPrivateKey = generatePrivateKey();

      // Create account
      const account = getSchnorrAccount(this.pxe, encryptionPrivateKey, signingPrivateKey);
      const completeAddress = account.getCompleteAddress();

      // Register with PXE
      await this.pxe.registerAccount(signingPrivateKey, completeAddress.partialAddress);

      this.account = account;
      this.isConnected = true;

      // Store keys securely (simplified - in production use proper encryption)
      localStorage.setItem('aztec_encryption_key', encryptionPrivateKey.toString());
      localStorage.setItem('aztec_signing_key', signingPrivateKey.toString());
      localStorage.setItem('aztec_address', completeAddress.address.toString());

      return {
        success: true,
        address: completeAddress.address.toString(),
        account: account
      };
    } catch (error) {
      console.error('Failed to create wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to existing wallet (check localStorage first)
   */
  async connectWallet() {
    try {
      // Try to restore from localStorage
      const encryptionKey = localStorage.getItem('aztec_encryption_key');
      const signingKey = localStorage.getItem('aztec_signing_key');
      
      if (encryptionKey && signingKey) {
        if (!this.pxe) {
          await this.initialize();
        }

        const account = getSchnorrAccount(
          this.pxe,
          Fr.fromString(encryptionKey),
          Fr.fromString(signingKey)
        );

        this.account = account;
        this.isConnected = true;

        return {
          success: true,
          address: account.getAddress().toString(),
          account: account
        };
      }

      // No existing wallet, create new one
      return await this.createWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deploy account contract (required before interacting with other contracts)
   */
  async deployAccount() {
    try {
      if (!this.account) {
        throw new Error('No account connected');
      }

      console.log('Deploying account contract...');
      const deployTx = await this.account.deploy().send();
      const receipt = await deployTx.wait();

      console.log('Account deployed:', receipt);
      return { success: true, txHash: receipt.txHash };
    } catch (error) {
      console.error('Failed to deploy account:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load contract instances
   */
  async loadContracts() {
    try {
      if (!this.account) {
        throw new Error('No account connected');
      }

      // Load Profile Registry Contract
      this.profileRegistryContract = await Contract.at(
        AztecAddress.fromString(PROFILE_REGISTRY_ADDRESS),
        ProfileRegistryArtifact,
        this.account
      );

      // Load Private Socials Contract  
      this.privateSocialsContract = await Contract.at(
        AztecAddress.fromString(PRIVATE_SOCIALS_ADDRESS),
        PrivateSocialsArtifact,
        this.account
      );

      console.log('Contracts loaded successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to load contracts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if username is available
   */
  async isUsernameAvailable(username) {
    try {
      if (!this.profileRegistryContract) {
        await this.loadContracts();
      }

      const usernameHash = this.hashString(username);
      const available = await this.profileRegistryContract.methods
        .is_username_available(usernameHash)
        .view();

      return { success: true, available };
    } catch (error) {
      console.error('Failed to check username:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create user profile NFT
   */
  async createProfile(username, tokenURI) {
    try {
      if (!this.profileRegistryContract) {
        await this.loadContracts();
      }

      const usernameHash = this.hashString(username);
      const tokenURIHash = this.hashString(tokenURI);

      console.log('Creating profile...', { username, usernameHash, tokenURIHash });

      const tx = await this.profileRegistryContract.methods
        .create_profile(usernameHash, tokenURIHash)
        .send();

      const receipt = await tx.wait();
      console.log('Profile created:', receipt);

      return { success: true, txHash: receipt.txHash };
    } catch (error) {
      console.error('Failed to create profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userAddress) {
    try {
      if (!this.profileRegistryContract) {
        await this.loadContracts();
      }

      const address = userAddress || this.account.getAddress();
      
      const hasProfile = await this.profileRegistryContract.methods
        .has_profile(address)
        .view();

      if (!hasProfile) {
        return { success: true, profile: null };
      }

      const profileId = await this.profileRegistryContract.methods
        .get_profile_id(address)
        .view();

      const tokenURI = await this.profileRegistryContract.methods
        .get_token_uri(address)
        .view();

      return {
        success: true,
        profile: {
          profileId: profileId.toString(),
          owner: address.toString(),
          tokenURI: tokenURI.toString()
        }
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check social verifications
   */
  async getSocialVerifications(profileId) {
    try {
      if (!this.privateSocialsContract) {
        await this.loadContracts();
      }

      const verifications = await this.privateSocialsContract.methods
        .get_profile_verifications(Fr.fromString(profileId))
        .view();

      const verificationCount = await this.privateSocialsContract.methods
        .get_profile_verification_count(Fr.fromString(profileId))
        .view();

      return {
        success: true,
        verifications: {
          twitter: verifications[0],
          discord: verifications[1],
          telegram: verifications[2],
          github: verifications[3],
          farcaster: verifications[4],
          email: verifications[5]
        },
        totalCount: verificationCount.toString()
      };
    } catch (error) {
      console.error('Failed to get social verifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start Twitter verification process
   */
  async prepareTwitterVerification(profileId, twitterHandle) {
    try {
      if (!this.privateSocialsContract) {
        await this.loadContracts();
      }

      const handleHash = this.hashString(twitterHandle);
      
      const verificationHash = await this.privateSocialsContract.methods
        .prepare_twitter_verification(Fr.fromString(profileId), handleHash)
        .send();

      return { success: true, verificationHash: verificationHash.toString() };
    } catch (error) {
      console.error('Failed to prepare Twitter verification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.pxe.getTransactionReceipt(Fr.fromString(txHash));
      return { success: true, receipt };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Utility: Hash string to Field
   */
  hashString(str) {
    // Simple hash implementation - in production use proper hash function
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data[i]) & 0x1fffffffffffff; // Keep within field size
    }
    return Fr.fromString(hash.toString());
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.account = null;
    this.isConnected = false;
    this.profileRegistryContract = null;
    this.privateSocialsContract = null;
    
    // Clear localStorage
    localStorage.removeItem('aztec_encryption_key');
    localStorage.removeItem('aztec_signing_key');
    localStorage.removeItem('aztec_address');
  }

  // Getters
  getAccount() {
    return this.account;
  }

  getAddress() {
    return this.account?.getAddress()?.toString() || null;
  }

  isWalletConnected() {
    return this.isConnected && this.account !== null;
  }
}

// Export singleton instance
export const aztecClient = new AztecClient();
export default aztecClient;
