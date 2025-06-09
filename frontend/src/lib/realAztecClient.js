// src/lib/realAztecClient.js - REAL AZTEC INTEGRATION
import { createPXEClient, waitForPXE, Contract, Fr, GrumpkinScalar } from '@aztec/aztec.js';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import ProfileRegistryArtifact from '../artifacts/AztlanProfileRegistry.json';
import PrivateSocialArtifact from '../artifacts/AztlanPrivateSocial.json';

// Contract addresses from your deployment
const CONTRACT_ADDRESSES = {
  ProfileRegistry: '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
  PrivateSocials: '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
};

// Utility functions
const hashString = (str) => {
  // Simple hash function - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

class RealAztecClient {
  constructor() {
    this.pxe = null;
    this.wallet = null;
    this.account = null;
    this.contracts = new Map();
    this.isInitialized = false;
    this.connectionTimeout = 30000; // 30 seconds for testnet
  }

  async initialize() {
    try {
      console.log('🔗 Connecting to Aztec Alpha Testnet...');
      
      // Create PXE client with timeout
      this.pxe = createPXEClient(process.env.REACT_APP_PXE_URL || 'https://aztec-alpha-testnet-fullnode.zkv.xyz');
      
      // Wait for PXE with extended timeout for testnet
      await Promise.race([
        waitForPXE(this.pxe),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PXE connection timeout')), this.connectionTimeout)
        )
      ]);
      
      this.isInitialized = true;
      console.log('✅ Successfully connected to Aztec network');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Aztec initialization failed:', error);
      throw new Error(`Failed to connect to Aztec network: ${error.message}`);
    }
  }

  async createWallet() {
    if (!this.pxe) {
      throw new Error('PXE not initialized');
    }

    try {
      console.log('🎯 Creating new Aztec wallet...');
      
      // Generate new account keys
      const encryptionSecretKey = Fr.random();
      const signingPrivateKey = GrumpkinScalar.random();
      
      // Create Schnorr account
      this.account = getSchnorrAccount(this.pxe, encryptionSecretKey, signingPrivateKey);
      
      // Deploy account contract with extended timeout for testnet
      console.log('📦 Deploying account contract...');
      await Promise.race([
        this.account.deploy().wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Account deployment timeout')), 120000)
        )
      ]);
      
      // Get wallet instance
      this.wallet = await this.account.getWallet();
      
      const address = this.wallet.getAddress().toString();
      console.log('✅ Wallet created successfully:', address);
      
      return {
        success: true,
        address,
        encryptionKey: encryptionSecretKey.toString(),
        signingKey: signingPrivateKey.toString()
      };
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  async connectExistingWallet(encryptionKey, signingKey) {
    if (!this.pxe) {
      throw new Error('PXE not initialized');
    }

    try {
      console.log('🔄 Connecting to existing wallet...');
      
      // Restore account from keys
      const encryptionSecretKey = Fr.fromString(encryptionKey);
      const signingPrivateKey = GrumpkinScalar.fromString(signingKey);
      
      this.account = getSchnorrAccount(this.pxe, encryptionSecretKey, signingPrivateKey);
      this.wallet = await this.account.getWallet();
      
      const address = this.wallet.getAddress().toString();
      console.log('✅ Connected to existing wallet:', address);
      
      return {
        success: true,
        address
      };
    } catch (error) {
      console.error('❌ Failed to connect existing wallet:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async getProfileContract() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const contractKey = 'ProfileRegistry';
    if (this.contracts.has(contractKey)) {
      return this.contracts.get(contractKey);
    }

    try {
      const contract = await Contract.at(
        CONTRACT_ADDRESSES.ProfileRegistry,
        ProfileRegistryArtifact,
        this.wallet
      );
      
      this.contracts.set(contractKey, contract);
      console.log('📋 Profile contract loaded');
      return contract;
    } catch (error) {
      console.error('❌ Failed to load profile contract:', error);
      throw new Error(`Failed to load profile contract: ${error.message}`);
    }
  }

  async getSocialContract() {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const contractKey = 'PrivateSocials';
    if (this.contracts.has(contractKey)) {
      return this.contracts.get(contractKey);
    }

    try {
      const contract = await Contract.at(
        CONTRACT_ADDRESSES.PrivateSocials,
        PrivateSocialArtifact,
        this.wallet
      );
      
      this.contracts.set(contractKey, contract);
      console.log('📋 Social contract loaded');
      return contract;
    } catch (error) {
      console.error('❌ Failed to load social contract:', error);
      throw new Error(`Failed to load social contract: ${error.message}`);
    }
  }

  async checkUsernameAvailability(username) {
    try {
      const contract = await this.getProfileContract();
      const usernameHash = Fr.fromString(hashString(username.toLowerCase()).toString());
      
      console.log('🔍 Checking username availability:', username);
      const available = await contract.methods.is_username_available(usernameHash).simulate();
      
      return available;
    } catch (error) {
      console.error('❌ Failed to check username:', error);
      throw new Error(`Failed to check username availability: ${error.message}`);
    }
  }

  async createProfile(profileData) {
    try {
      const contract = await this.getProfileContract();
      
      const { username, avatar } = profileData;
      const usernameHash = Fr.fromString(hashString(username.toLowerCase()).toString());
      const tokenURIHash = Fr.fromString(hashString(avatar || '/uid/01UID.png').toString());
      
      console.log('🎯 Creating profile on blockchain...');
      console.log('Username:', username);
      console.log('Avatar:', avatar);
      
      // Create profile transaction with extended timeout
      const call = contract.methods.create_profile(usernameHash, tokenURIHash);
      
      // Send transaction with timeout
      const receipt = await Promise.race([
        call.send().wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction timeout')), 180000) // 3 minutes
        )
      ]);
      
      console.log('✅ Profile created successfully!');
      console.log('Transaction hash:', receipt.txHash);
      
      return {
        success: true,
        txHash: receipt.txHash,
        profileData
      };
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      throw new Error(`Failed to create profile: ${error.message}`);
    }
  }

  async hasProfile(address) {
    try {
      const contract = await this.getProfileContract();
      const userAddress = address || this.wallet.getAddress();
      
      console.log('🔍 Checking if user has profile...');
      const hasProfile = await contract.methods.has_profile(userAddress).simulate();
      
      return hasProfile;
    } catch (error) {
      console.error('❌ Failed to check profile:', error);
      return false;
    }
  }

  async getProfileId(address) {
    try {
      const contract = await this.getProfileContract();
      const userAddress = address || this.wallet.getAddress();
      
      const profileId = await contract.methods.get_profile_id(userAddress).simulate();
      return profileId;
    } catch (error) {
      console.error('❌ Failed to get profile ID:', error);
      return null;
    }
  }

  async getTokenURI(address) {
    try {
      const contract = await this.getProfileContract();
      const userAddress = address || this.wallet.getAddress();
      
      const tokenURI = await contract.methods.get_token_uri(userAddress).simulate();
      return tokenURI;
    } catch (error) {
      console.error('❌ Failed to get token URI:', error);
      return null;
    }
  }

  async getVerificationStatus(profileId) {
    try {
      const contract = await this.getSocialContract();
      
      const verifications = await contract.methods.get_profile_verifications(profileId).simulate();
      const verificationCount = await contract.methods.get_profile_verification_count(profileId).simulate();
      
      return {
        twitter: verifications[0],
        discord: verifications[1],
        telegram: verifications[2],
        github: verifications[3],
        farcaster: verifications[4],
        email: verifications[5],
        count: verificationCount
      };
    } catch (error) {
      console.error('❌ Failed to get verification status:', error);
      return {
        twitter: false,
        discord: false,
        telegram: false,
        github: false,
        farcaster: false,
        email: false,
        count: 0
      };
    }
  }

  async getWalletAddress() {
    return this.wallet ? this.wallet.getAddress().toString() : null;
  }

  isConnected() {
    return this.isInitialized && this.wallet !== null;
  }

  disconnect() {
    this.wallet = null;
    this.account = null;
    this.contracts.clear();
    console.log('👋 Disconnected from Aztec wallet');
  }
}

// Export singleton instance
export const aztecClient = new RealAztecClient();
export default aztecClient;
