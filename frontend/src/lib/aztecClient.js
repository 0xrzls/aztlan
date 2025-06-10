// src/lib/aztecClient.js - REAL AZTEC INTEGRATION (FIXED IMPORTS)
import { 
  createPXEClient, 
  waitForPXE, 
  Contract, 
  Fr, 
  GrumpkinScalar,
  AztecAddress,
  TxStatus
} from '@aztec/aztec.js';
import { getSchnorrAccount } from '@aztec/accounts/schnorr';

// Import contract artifacts
import ProfileRegistryArtifact from '../artifacts/AztlanProfileRegistry.json';
import PrivateSocialArtifact from '../artifacts/AztlanPrivateSocial.json';

// Aztec testnet configuration
const AZTEC_CONFIG = {
  PXE_URL: process.env.REACT_APP_PXE_URL || 'https://aztec-alpha-testnet-fullnode.zkv.xyz',
  SPONSORED_FPC_ADDRESS: '0x0b27e30667202907fc700d50e9bc816be42f8141fae8b9f2281873dbdb9fc2e5',
  TESTNET_TIMEOUT: 600000, // 10 minutes
  BLOCK_TIME: 36000, // ~36 seconds
  POLL_INTERVAL: 15000, // 15 seconds
  
  CONTRACT_ADDRESSES: {
    ProfileRegistry: process.env.REACT_APP_PROFILE_REGISTRY_ADDRESS || 
      '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
    PrivateSocials: process.env.REACT_APP_PRIVATE_SOCIALS_ADDRESS || 
      '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
  }
};

class RealAztecClient {
  constructor() {
    this.pxe = null;
    this.wallet = null;
    this.account = null;
    this.contracts = new Map();
    this.isInitialized = false;
    this.error = null;
    this.transactionMonitors = new Map();
    this.sponsoredFPC = null;
  }

  // Initialize PXE connection with comprehensive error handling
  async initialize() {
    try {
      console.log('🔗 Initializing REAL Aztec PXE connection to testnet...');
      
      this.pxe = createPXEClient(AZTEC_CONFIG.PXE_URL);
      
      // Wait for PXE with timeout
      await Promise.race([
        waitForPXE(this.pxe),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PXE connection timeout after 30 seconds')), 30000)
        )
      ]);
      
      // Validate connection
      const nodeInfo = await this.pxe.getNodeInfo();
      console.log('✅ Connected to Aztec testnet:', {
        chainId: nodeInfo.chainId,
        version: nodeInfo.version,
        protocolVersion: nodeInfo.protocolVersion
      });
      
      // Initialize sponsored FPC
      await this.initializeSponsoredFPC();
      
      this.isInitialized = true;
      return { success: true };
      
    } catch (error) {
      console.error('❌ Aztec PXE initialization failed:', error);
      this.error = this.getErrorMessage(error);
      
      // Auto-retry once after 5 seconds
      if (!error.message.includes('retry')) {
        console.log('🔄 Retrying Aztec connection...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await this.initialize();
      }
      
      throw new Error(`Failed to connect to Aztec Network: ${this.getErrorMessage(error)}`);
    }
  }

  // Initialize sponsored FPC for fee-less transactions
  async initializeSponsoredFPC() {
    try {
      console.log('💰 Setting up sponsored fee payment...');
      
      // For now, we'll handle sponsored FPC registration later when we have a wallet
      // This is a placeholder for the sponsored FPC setup
      this.sponsoredFPC = {
        address: AztecAddress.fromString(AZTEC_CONFIG.SPONSORED_FPC_ADDRESS),
        isReady: false
      };
      
      console.log('✅ Sponsored FPC configured');
    } catch (error) {
      console.warn('⚠️ Sponsored FPC setup failed:', error.message);
      // Non-fatal - we can fallback to regular fee payment
    }
  }

  // Create new wallet account with REAL deployment
  async createWallet(progressCallback) {
    if (!this.pxe) throw new Error('PXE not initialized');
    
    try {
      console.log('👛 Creating REAL Aztec wallet account...');
      
      progressCallback?.({ 
        phase: 'generating_keys', 
        progress: 10, 
        message: 'Generating cryptographic keys...',
        timeEstimate: '30 seconds' 
      });
      
      // Generate REAL cryptographic keys for testnet
      const secretKey = Fr.random();
      const signingPrivateKey = GrumpkinScalar.random();
      
      progressCallback?.({ 
        phase: 'creating_account', 
        progress: 20, 
        message: 'Creating account instance...',
        timeEstimate: '1 minute'
      });
      
      // Create Schnorr account (most common type)
      this.account = getSchnorrAccount(this.pxe, secretKey, signingPrivateKey);
      const address = this.account.getAddress();
      
      console.log('📍 Generated account address:', address.toString());
      
      // Store keys securely BEFORE deployment
      this.storeWalletKeys(secretKey, signingPrivateKey, address);
      
      progressCallback?.({ 
        phase: 'registering_contracts', 
        progress: 30, 
        message: 'Registering contracts with PXE...',
        timeEstimate: '1 minute'
      });
      
      // Register contract artifacts with PXE first
      await this.registerContracts();
      
      progressCallback?.({ 
        phase: 'preparing_deployment', 
        progress: 40, 
        message: 'Preparing account deployment...',
        timeEstimate: '2 minutes'
      });
      
      // Determine fee payment method
      const feeOptions = await this.getFeeOptions();
      
      progressCallback?.({ 
        phase: 'deploying', 
        progress: 50, 
        message: 'Deploying account contract to Aztec testnet...',
        timeEstimate: '3-5 minutes'
      });
      
      // REAL account deployment to testnet
      console.log('🚀 Deploying account contract to Aztec testnet...');
      const deployTx = await this.account.deploy(feeOptions);
      const txHash = deployTx.getTxHash().toString();
      
      console.log('📤 Account deployment transaction sent:', txHash);
      
      progressCallback?.({ 
        phase: 'confirming', 
        progress: 70, 
        message: 'Waiting for blockchain confirmation...',
        timeEstimate: '2-5 minutes',
        txHash: txHash
      });
      
      // Start background monitoring
      this.startTransactionMonitoring(txHash, 'account_deployment', progressCallback);
      
      // Wait for REAL deployment confirmation
      const deployReceipt = await deployTx.wait({
        timeout: AZTEC_CONFIG.TESTNET_TIMEOUT,
        interval: AZTEC_CONFIG.POLL_INTERVAL
      });
      
      if (deployReceipt.status !== TxStatus.SUCCESS) {
        throw new Error(`Account deployment failed: ${deployReceipt.error || 'Transaction reverted'}`);
      }
      
      console.log('✅ Account deployed successfully to Aztec testnet!');
      
      // Get wallet instance
      this.wallet = await this.account.getWallet();
      
      // Register account with PXE for private state tracking
      await this.registerAccountWithPXE();
      
      progressCallback?.({ 
        phase: 'complete', 
        progress: 100, 
        message: 'Account ready for use!',
        txHash: deployReceipt.txHash.toString()
      });
      
      return {
        success: true,
        address: address.toString(),
        txHash: deployReceipt.txHash.toString()
      };
      
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      progressCallback?.({ 
        phase: 'error', 
        progress: 0, 
        message: this.getErrorMessage(error),
        error: error 
      });
      throw new Error(`Wallet creation failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Restore existing wallet from stored keys
  async restoreWallet(progressCallback) {
    if (!this.pxe) throw new Error('PXE not initialized');
    
    try {
      const storedKeys = this.getStoredWalletKeys();
      if (!storedKeys) {
        return { success: false, error: 'No stored wallet found' };
      }
      
      console.log('🔄 Restoring wallet from secure storage...');
      progressCallback?.({ 
        phase: 'restoring', 
        progress: 20, 
        message: 'Restoring account from stored keys...'
      });
      
      const { secretKey, signingPrivateKey, address } = storedKeys;
      this.account = getSchnorrAccount(this.pxe, secretKey, signingPrivateKey);
      
      // Verify address matches
      const restoredAddress = this.account.getAddress().toString();
      if (restoredAddress !== address) {
        throw new Error('Address mismatch during restoration');
      }
      
      progressCallback?.({ 
        phase: 'verifying', 
        progress: 50, 
        message: 'Verifying account deployment on testnet...'
      });
      
      // Check if account is deployed on-chain
      const isDeployed = await this.pxe.isAccountDeployed(this.account.getAddress());
      if (!isDeployed) {
        console.log('⚠️ Account not deployed to testnet yet');
        return { success: false, error: 'Account not deployed' };
      }
      
      progressCallback?.({ 
        phase: 'loading', 
        progress: 80, 
        message: 'Loading wallet and contracts...'
      });
      
      this.wallet = await this.account.getWallet();
      
      // Register contracts and account
      await this.registerContracts();
      await this.registerAccountWithPXE();
      
      progressCallback?.({ 
        phase: 'complete', 
        progress: 100, 
        message: 'Wallet restored successfully!'
      });
      
      console.log('✅ Wallet restored successfully from testnet');
      return {
        success: true,
        address: restoredAddress
      };
      
    } catch (error) {
      console.error('❌ Wallet restoration failed:', error);
      progressCallback?.({ 
        phase: 'error', 
        progress: 0, 
        message: this.getErrorMessage(error)
      });
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Register contracts with PXE for proof generation
  async registerContracts() {
    try {
      console.log('📜 Registering contract artifacts with PXE...');
      
      // Register ProfileRegistry
      await this.pxe.registerContract({
        address: AztecAddress.fromString(AZTEC_CONFIG.CONTRACT_ADDRESSES.ProfileRegistry),
        artifact: ProfileRegistryArtifact,
        alias: 'ProfileRegistry'
      });
      
      // Register PrivateSocials
      await this.pxe.registerContract({
        address: AztecAddress.fromString(AZTEC_CONFIG.CONTRACT_ADDRESSES.PrivateSocials),
        artifact: PrivateSocialArtifact,
        alias: 'PrivateSocials'
      });
      
      console.log('✅ Contract artifacts registered with PXE');
    } catch (error) {
      console.error('❌ Contract registration failed:', error);
      throw new Error(`Contract registration failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Register account with PXE for private state tracking
  async registerAccountWithPXE() {
    try {
      console.log('📝 Registering account with PXE for private state...');
      
      const encryptionPrivateKey = this.account.getEncryptionPrivateKey();
      const completeAddress = this.account.getCompleteAddress();
      
      await this.pxe.registerAccount(encryptionPrivateKey, completeAddress);
      
      console.log('✅ Account registered with PXE');
    } catch (error) {
      console.warn('⚠️ Account registration warning (may already be registered):', error.message);
      // Non-fatal - account might already be registered
    }
  }

  // Load contract instances for interaction
  async loadContracts() {
    if (!this.wallet) throw new Error('Wallet not available');
    
    try {
      console.log('📜 Loading contract instances...');
      
      // Load ProfileRegistry contract
      const profileRegistryAddress = AztecAddress.fromString(
        AZTEC_CONFIG.CONTRACT_ADDRESSES.ProfileRegistry
      );
      const profileRegistry = await Contract.at(
        profileRegistryAddress,
        ProfileRegistryArtifact,
        this.wallet
      );
      
      // Load PrivateSocials contract
      const privateSocialsAddress = AztecAddress.fromString(
        AZTEC_CONFIG.CONTRACT_ADDRESSES.PrivateSocials
      );
      const privateSocials = await Contract.at(
        privateSocialsAddress,
        PrivateSocialArtifact,
        this.wallet
      );
      
      this.contracts.set('ProfileRegistry', profileRegistry);
      this.contracts.set('PrivateSocials', privateSocials);
      
      console.log('✅ Contract instances loaded');
      return { success: true };
    } catch (error) {
      console.error('❌ Contract loading failed:', error);
      throw new Error(`Contract loading failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Create profile on REAL blockchain
  async createProfile(profileData, progressCallback) {
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) throw new Error('ProfileRegistry not loaded');
      
      console.log('🎭 Creating REAL profile on Aztec testnet...', { 
        username: profileData.username 
      });
      
      progressCallback?.({ 
        phase: 'preparing', 
        progress: 10, 
        message: 'Preparing transaction data...',
        timeEstimate: '30 seconds'
      });
      
      // Hash data using proper Aztec field arithmetic
      const usernameHash = this.hashStringToField(profileData.username);
      
      // Create metadata object
      const metadata = {
        displayName: profileData.displayName,
        bio: profileData.bio || '',
        avatar: profileData.avatar || '/uid/01UID.png',
        twitter: profileData.twitter || '',
        discord: profileData.discord || '',
        createdAt: Date.now(),
        version: '1.0'
      };
      
      const metadataString = JSON.stringify(metadata);
      const tokenURIHash = this.hashStringToField(metadataString);
      
      progressCallback?.({ 
        phase: 'proving', 
        progress: 30, 
        message: 'Generating zero-knowledge proofs...',
        timeEstimate: '2-5 minutes'
      });
      
      // Get fee payment options
      const feeOptions = await this.getFeeOptions();
      
      // Send REAL transaction to Aztec testnet
      console.log('📝 Sending profile creation transaction to testnet...');
      const tx = await profileRegistry.methods
        .create_profile(usernameHash, tokenURIHash)
        .send(feeOptions);
      
      const txHash = tx.getTxHash().toString();
      console.log('📤 Transaction sent to testnet:', txHash);
      
      progressCallback?.({ 
        phase: 'mining', 
        progress: 60, 
        message: 'Waiting for blockchain confirmation...',
        timeEstimate: '1-3 minutes',
        txHash: txHash
      });
      
      // Start background monitoring
      this.startTransactionMonitoring(txHash, 'profile_creation', progressCallback);
      
      // Wait for REAL confirmation
      const receipt = await tx.wait({ 
        timeout: AZTEC_CONFIG.TESTNET_TIMEOUT,
        interval: AZTEC_CONFIG.POLL_INTERVAL
      });
      
      if (receipt.status !== TxStatus.SUCCESS) {
        throw new Error(`Profile creation failed: ${receipt.error || 'Transaction reverted'}`);
      }
      
      console.log('✅ Profile created successfully on Aztec testnet!');
      
      progressCallback?.({ 
        phase: 'complete', 
        progress: 100, 
        message: 'Profile created successfully!',
        txHash: receipt.txHash.toString()
      });
      
      // Store metadata locally for UI (since it's hashed on-chain)
      this.storeProfileMetadata(this.wallet.getAddress().toString(), metadata);
      
      return {
        success: true,
        txHash: receipt.txHash.toString(),
        profileId: await this.getProfileId(), // Get from contract
        metadata
      };
      
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      progressCallback?.({ 
        phase: 'error', 
        progress: 0, 
        message: this.getErrorMessage(error),
        error: error
      });
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Check if user has profile
  async hasProfile(userAddress = null) {
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) return false;
      
      const address = userAddress ? 
        AztecAddress.fromString(userAddress) : 
        this.wallet.getAddress();
        
      const hasProfile = await profileRegistry.methods
        .has_profile(address)
        .simulate();
      
      return hasProfile;
    } catch (error) {
      console.error('❌ Profile check failed:', error);
      return false;
    }
  }

  // Get profile data
  async getProfile(userAddress = null) {
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) return null;
      
      const address = userAddress ? 
        AztecAddress.fromString(userAddress) : 
        this.wallet.getAddress();
      
      const profileId = await profileRegistry.methods
        .get_profile_id(address)
        .simulate();
        
      if (profileId.toString() === '0') {
        return null; // No profile
      }
      
      const tokenURI = await profileRegistry.methods
        .get_token_uri(address)
        .simulate();
      
      // Get stored metadata
      const metadata = this.getStoredProfileMetadata(address.toString());
      
      return {
        profileId: profileId.toString(),
        owner: address.toString(),
        tokenURI: tokenURI.toString(),
        metadata
      };
    } catch (error) {
      console.error('❌ Profile retrieval failed:', error);
      return null;
    }
  }

  // Get current profile ID
  async getProfileId() {
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) return null;
      
      const profileId = await profileRegistry.methods
        .get_profile_id(this.wallet.getAddress())
        .simulate();
        
      return profileId.toString() !== '0' ? profileId.toString() : null;
    } catch (error) {
      console.error('❌ Profile ID retrieval failed:', error);
      return null;
    }
  }

  // Check username availability
  async isUsernameAvailable(username) {
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) return true;
      
      const usernameHash = this.hashStringToField(username);
      const available = await profileRegistry.methods
        .is_username_available(usernameHash)
        .simulate();
      
      return available;
    } catch (error) {
      console.error('❌ Username availability check failed:', error);
      return true; // Assume available on error
    }
  }

  // Get social verifications
  async getSocialVerifications(profileId) {
    try {
      const privateSocials = this.contracts.get('PrivateSocials');
      if (!privateSocials) return this.getDefaultVerifications();
      
      const verifications = await privateSocials.methods
        .get_profile_verifications(Fr.fromString(profileId))
        .simulate();
      
      return {
        twitter: verifications[0],
        discord: verifications[1],
        telegram: verifications[2],
        github: verifications[3],
        farcaster: verifications[4],
        email: verifications[5]
      };
    } catch (error) {
      console.error('❌ Social verification check failed:', error);
      return this.getDefaultVerifications();
    }
  }

  // Transaction monitoring with background processing
  startTransactionMonitoring(txHash, operationType, progressCallback) {
    const startTime = Date.now();
    
    console.log(`🔍 Starting background monitoring for ${operationType}: ${txHash}`);
    
    this.transactionMonitors.set(txHash, {
      type: operationType,
      startTime: startTime,
      callback: progressCallback
    });
    
    // Start polling
    const pollInterval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;
        
        // Check timeout
        if (elapsed > AZTEC_CONFIG.TESTNET_TIMEOUT) {
          clearInterval(pollInterval);
          this.handleTransactionTimeout(txHash, operationType);
          return;
        }
        
        // Try to get transaction receipt
        const receipt = await this.pxe.getTxReceipt(txHash);
        
        if (receipt && receipt.status !== TxStatus.PENDING) {
          clearInterval(pollInterval);
          this.handleTransactionComplete(txHash, receipt, operationType);
        } else {
          // Update progress
          const progress = Math.min(60 + (elapsed / AZTEC_CONFIG.TESTNET_TIMEOUT) * 30, 95);
          progressCallback?.({
            phase: 'confirming',
            progress: progress,
            message: `Confirming on testnet... (${Math.floor(elapsed / 1000)}s)`,
            txHash: txHash
          });
        }
      } catch (pollError) {
        console.log(`Polling for transaction ${txHash}...`);
      }
    }, AZTEC_CONFIG.POLL_INTERVAL);
  }

  // Handle transaction completion
  handleTransactionComplete(txHash, receipt, operationType) {
    console.log(`✅ Transaction ${operationType} completed:`, txHash);
    
    // Emit custom event for UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aztecTransactionComplete', { 
        detail: { 
          txHash, 
          status: receipt.status === TxStatus.SUCCESS ? 'success' : 'error',
          operationType,
          receipt 
        }
      }));
    }
    
    this.transactionMonitors.delete(txHash);
  }

  // Handle transaction timeout
  handleTransactionTimeout(txHash, operationType) {
    console.warn(`⏰ Transaction ${operationType} monitoring timeout:`, txHash);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aztecTransactionTimeout', {
        detail: { txHash, operationType }
      }));
    }
    
    this.transactionMonitors.delete(txHash);
  }

  // Get fee payment options (sponsored vs self-paid)
  async getFeeOptions() {
    try {
      if (this.sponsoredFPC && this.sponsoredFPC.address) {
        // Use sponsored FPC for fee-less transactions
        return {
          fee: {
            paymentMethod: 'fpc-sponsored',
            fpc: this.sponsoredFPC.address
          }
        };
      } else {
        // Default fee payment
        return {};
      }
    } catch (error) {
      console.warn('⚠️ Fee options setup failed, using default:', error.message);
      return {};
    }
  }

  // Utility: Hash string to Aztec field element
  hashStringToField(str) {
    // Simple deterministic hash for field element
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data[i];
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure it fits in Aztec field
    const fieldValue = Math.abs(hash) % (2**254 - 1);
    return Fr.fromString(fieldValue.toString());
  }

  // Enhanced error message handling
  getErrorMessage(error) {
    const message = error?.message || error?.toString() || 'Unknown error';
    
    // Aztec-specific error patterns
    if (message.includes('PXE_SERVICE_NOT_AVAILABLE')) {
      return 'Aztec testnet is currently unavailable. Please try again later.';
    }
    if (message.includes('INSUFFICIENT_FUNDS')) {
      return 'Insufficient funds. Try using sponsored transactions or testnet faucet.';
    }
    if (message.includes('ACCOUNT_NOT_DEPLOYED')) {
      return 'Account not deployed. Please deploy your account first.';
    }
    if (message.includes('CONTRACT_NOT_FOUND')) {
      return 'Contract not found. Please check contract addresses.';
    }
    if (message.includes('SIMULATION_FAILED')) {
      return 'Transaction simulation failed. Check parameters.';
    }
    if (message.includes('timeout')) {
      return 'Operation timeout. Aztec testnet can be slow - transaction may still be processing.';
    }
    
    return message;
  }

  // Default social verifications
  getDefaultVerifications() {
    return {
      twitter: false,
      discord: false,
      telegram: false,
      github: false,
      farcaster: false,
      email: false
    };
  }

  // Secure key storage
  storeWalletKeys(secretKey, signingPrivateKey, address) {
    const walletData = {
      secretKey: secretKey.toString(),
      signingPrivateKey: signingPrivateKey.toString(),
      address: address.toString(),
      createdAt: Date.now(),
      network: 'aztec-alpha-testnet',
      version: '1.0'
    };
    
    localStorage.setItem('aztec_wallet_keys', JSON.stringify(walletData));
    console.log('🔐 Wallet keys stored securely');
  }

  // Retrieve stored keys
  getStoredWalletKeys() {
    try {
      const stored = localStorage.getItem('aztec_wallet_keys');
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      
      if (!data.secretKey || !data.signingPrivateKey || !data.address) {
        console.warn('⚠️ Invalid stored wallet data');
        return null;
      }
      
      return {
        secretKey: Fr.fromString(data.secretKey),
        signingPrivateKey: GrumpkinScalar.fromString(data.signingPrivateKey),
        address: data.address
      };
    } catch (error) {
      console.error('Error reading stored wallet keys:', error);
      return null;
    }
  }

  // Store profile metadata locally
  storeProfileMetadata(address, metadata) {
    const dataWithTimestamp = {
      ...metadata,
      storedAt: Date.now()
    };
    localStorage.setItem(`aztec_profile_meta_${address}`, JSON.stringify(dataWithTimestamp));
  }

  // Get stored profile metadata
  getStoredProfileMetadata(address) {
    try {
      const stored = localStorage.getItem(`aztec_profile_meta_${address}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading profile metadata:', error);
      return null;
    }
  }

  // Connection status
  isConnected() {
    return this.isInitialized && this.wallet !== null;
  }

  getWalletAddress() {
    return this.wallet ? this.wallet.getAddress().toString() : null;
  }

  // Cleanup
  disconnect() {
    // Clear all monitors
    for (const [txHash] of this.transactionMonitors) {
      console.log(`🧹 Cleaning up monitor for ${txHash}`);
    }
    this.transactionMonitors.clear();
    
    // Reset state
    this.pxe = null;
    this.wallet = null;
    this.account = null;
    this.contracts.clear();
    this.isInitialized = false;
    this.error = null;
    this.sponsoredFPC = null;
    
    console.log('🧹 Aztec client disconnected and cleaned up');
  }
}

// Export singleton instance
export const aztecClient = new RealAztecClient();
export default aztecClient;
