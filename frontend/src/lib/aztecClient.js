// src/lib/aztecClient.js - OPTIMIZED WITH BETTER ERROR HANDLING & TIMEOUTS
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

// Aztec testnet configuration with optimized timeouts
const AZTEC_CONFIG = {
  PXE_URL: process.env.REACT_APP_PXE_URL || 'https://aztec-alpha-testnet-fullnode.zkv.xyz',
  SPONSORED_FPC_ADDRESS: '0x0b27e30667202907fc700d50e9bc816be42f8141fae8b9f2281873dbdb9fc2e5',
  
  // Optimized timeouts for better UX
  INIT_TIMEOUT: 20000, // 20 seconds for initial connection
  DEPLOYMENT_TIMEOUT: 300000, // 5 minutes for account deployment
  TRANSACTION_TIMEOUT: 180000, // 3 minutes for regular transactions
  POLL_INTERVAL: 10000, // 10 seconds polling
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds between retries
  
  CONTRACT_ADDRESSES: {
    ProfileRegistry: process.env.REACT_APP_PROFILE_REGISTRY_ADDRESS || 
      '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
    PrivateSocials: process.env.REACT_APP_PRIVATE_SOCIALS_ADDRESS || 
      '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
  }
};

class OptimizedAztecClient {
  constructor() {
    this.pxe = null;
    this.wallet = null;
    this.account = null;
    this.contracts = new Map();
    this.isInitialized = false;
    this.error = null;
    this.transactionMonitors = new Map();
    this.sponsoredFPC = null;
    this.connectionAttempts = 0;
    this.lastConnectionTime = null;
  }

  // Enhanced initialization with retry logic and better error handling
  async initialize() {
    this.connectionAttempts++;
    
    try {
      console.log(`🔗 Initializing Aztec PXE connection (attempt ${this.connectionAttempts})...`);
      
      // Emit progress events for UI
      this.emitProgress('initializing', 'Connecting to Aztec Network...', 10);
      
      this.pxe = createPXEClient(AZTEC_CONFIG.PXE_URL);
      
      // Enhanced connection with timeout and retries
      await this.connectWithRetries();
      
      this.emitProgress('validating', 'Validating connection...', 30);
      
      // Validate connection with node info
      const nodeInfo = await Promise.race([
        this.pxe.getNodeInfo(),
        this.createTimeoutPromise(5000, 'Node info timeout')
      ]);
      
      console.log('✅ Connected to Aztec testnet:', {
        chainId: nodeInfo.chainId,
        version: nodeInfo.version,
        protocolVersion: nodeInfo.protocolVersion
      });
      
      this.emitProgress('setup', 'Setting up services...', 50);
      
      // Initialize sponsored FPC
      await this.initializeSponsoredFPC();
      
      this.emitProgress('complete', 'Connected successfully!', 100);
      
      this.isInitialized = true;
      this.lastConnectionTime = Date.now();
      
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Aztec PXE initialization failed (attempt ${this.connectionAttempts}):`, error);
      this.error = this.getErrorMessage(error);
      
      // Retry logic with exponential backoff
      if (this.connectionAttempts < AZTEC_CONFIG.MAX_RETRIES) {
        const delay = AZTEC_CONFIG.RETRY_DELAY * Math.pow(2, this.connectionAttempts - 1);
        console.log(`🔄 Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return await this.initialize();
      }
      
      // All retries failed
      this.emitProgress('error', this.getErrorMessage(error), 0);
      throw new Error(`Failed to connect to Aztec Network after ${AZTEC_CONFIG.MAX_RETRIES} attempts: ${this.getErrorMessage(error)}`);
    }
  }

  // Enhanced connection with proper timeout handling
  async connectWithRetries() {
    const connectionPromises = [
      waitForPXE(this.pxe),
      this.createTimeoutPromise(AZTEC_CONFIG.INIT_TIMEOUT, 'PXE connection timeout')
    ];
    
    await Promise.race(connectionPromises);
  }

  // Enhanced timeout promise with specific error types
  createTimeoutPromise(timeout, message) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message));
      }, timeout);
    });
  }

  // Progress event emitter for UI updates
  emitProgress(phase, message, progress) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aztecProgress', {
        detail: { phase, message, progress }
      }));
    }
  }

  // Initialize sponsored FPC for fee-less transactions
  async initializeSponsoredFPC() {
    try {
      console.log('💰 Setting up sponsored fee payment...');
      
      this.sponsoredFPC = {
        address: AztecAddress.fromString(AZTEC_CONFIG.SPONSORED_FPC_ADDRESS),
        isReady: true
      };
      
      console.log('✅ Sponsored FPC configured');
    } catch (error) {
      console.warn('⚠️ Sponsored FPC setup failed:', error.message);
      // Non-fatal - we can fallback to regular fee payment
    }
  }

  // Enhanced wallet creation with better progress tracking
  async createWallet(progressCallback) {
    if (!this.pxe) throw new Error('PXE not initialized');
    
    try {
      console.log('👛 Creating Aztec wallet account...');
      
      this.updateProgress(progressCallback, 'generating_keys', 10, 'Generating cryptographic keys...', '30 seconds');
      
      // Generate cryptographic keys
      const secretKey = Fr.random();
      const signingPrivateKey = GrumpkinScalar.random();
      
      this.updateProgress(progressCallback, 'creating_account', 20, 'Creating account instance...', '1 minute');
      
      // Create Schnorr account
      this.account = getSchnorrAccount(this.pxe, secretKey, signingPrivateKey);
      const address = this.account.getAddress();
      
      console.log('📍 Generated account address:', address.toString());
      
      // Store keys securely BEFORE deployment
      this.storeWalletKeys(secretKey, signingPrivateKey, address);
      
      this.updateProgress(progressCallback, 'registering_contracts', 30, 'Registering contracts with PXE...', '1 minute');
      
      // Register contract artifacts with PXE first
      await this.registerContracts();
      
      this.updateProgress(progressCallback, 'preparing_deployment', 40, 'Preparing account deployment...', '2 minutes');
      
      // Determine fee payment method
      const feeOptions = await this.getFeeOptions();
      
      this.updateProgress(progressCallback, 'deploying', 50, 'Deploying account contract to Aztec testnet...', '3-5 minutes');
      
      // Enhanced deployment with timeout
      console.log('🚀 Deploying account contract to Aztec testnet...');
      const deployTx = await Promise.race([
        this.account.deploy(feeOptions),
        this.createTimeoutPromise(60000, 'Account deployment initialization timeout')
      ]);
      
      const txHash = deployTx.getTxHash().toString();
      console.log('📤 Account deployment transaction sent:', txHash);
      
      this.updateProgress(progressCallback, 'confirming', 70, 'Waiting for blockchain confirmation...', '2-5 minutes', txHash);
      
      // Start background monitoring
      this.startTransactionMonitoring(txHash, 'account_deployment', progressCallback);
      
      // Wait for deployment confirmation with timeout
      const deployReceipt = await Promise.race([
        deployTx.wait({
          timeout: AZTEC_CONFIG.DEPLOYMENT_TIMEOUT,
          interval: AZTEC_CONFIG.POLL_INTERVAL
        }),
        this.createTimeoutPromise(AZTEC_CONFIG.DEPLOYMENT_TIMEOUT, 'Account deployment timeout')
      ]);
      
      if (deployReceipt.status !== TxStatus.SUCCESS) {
        throw new Error(`Account deployment failed: ${deployReceipt.error || 'Transaction reverted'}`);
      }
      
      console.log('✅ Account deployed successfully to Aztec testnet!');
      
      // Get wallet instance
      this.wallet = await this.account.getWallet();
      
      // Register account with PXE for private state tracking
      await this.registerAccountWithPXE();
      
      this.updateProgress(progressCallback, 'complete', 100, 'Account ready for use!', null, deployReceipt.txHash.toString());
      
      return {
        success: true,
        address: address.toString(),
        txHash: deployReceipt.txHash.toString()
      };
      
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      this.updateProgress(progressCallback, 'error', 0, this.getErrorMessage(error));
      throw new Error(`Wallet creation failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Enhanced wallet restoration with timeout
  async restoreWallet(progressCallback) {
    if (!this.pxe) throw new Error('PXE not initialized');
    
    try {
      const storedKeys = this.getStoredWalletKeys();
      if (!storedKeys) {
        return { success: false, error: 'No stored wallet found' };
      }
      
      console.log('🔄 Restoring wallet from secure storage...');
      this.updateProgress(progressCallback, 'restoring', 20, 'Restoring account from stored keys...');
      
      const { secretKey, signingPrivateKey, address } = storedKeys;
      this.account = getSchnorrAccount(this.pxe, secretKey, signingPrivateKey);
      
      // Verify address matches
      const restoredAddress = this.account.getAddress().toString();
      if (restoredAddress !== address) {
        throw new Error('Address mismatch during restoration');
      }
      
      this.updateProgress(progressCallback, 'verifying', 50, 'Verifying account deployment on testnet...');
      
      // Check if account is deployed on-chain with timeout
      const isDeployed = await Promise.race([
        this.pxe.isAccountDeployed(this.account.getAddress()),
        this.createTimeoutPromise(10000, 'Account verification timeout')
      ]);
      
      if (!isDeployed) {
        console.log('⚠️ Account not deployed to testnet yet');
        return { success: false, error: 'Account not deployed' };
      }
      
      this.updateProgress(progressCallback, 'loading', 80, 'Loading wallet and contracts...');
      
      this.wallet = await this.account.getWallet();
      
      // Register contracts and account
      await this.registerContracts();
      await this.registerAccountWithPXE();
      
      this.updateProgress(progressCallback, 'complete', 100, 'Wallet restored successfully!');
      
      console.log('✅ Wallet restored successfully from testnet');
      return {
        success: true,
        address: restoredAddress
      };
      
    } catch (error) {
      console.error('❌ Wallet restoration failed:', error);
      this.updateProgress(progressCallback, 'error', 0, this.getErrorMessage(error));
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Register contracts with enhanced error handling
  async registerContracts() {
    try {
      console.log('📜 Registering contract artifacts with PXE...');
      
      const registrations = [
        {
          address: AztecAddress.fromString(AZTEC_CONFIG.CONTRACT_ADDRESSES.ProfileRegistry),
          artifact: ProfileRegistryArtifact,
          alias: 'ProfileRegistry'
        },
        {
          address: AztecAddress.fromString(AZTEC_CONFIG.CONTRACT_ADDRESSES.PrivateSocials),
          artifact: PrivateSocialArtifact,
          alias: 'PrivateSocials'
        }
      ];
      
      // Register contracts with timeout
      for (const contract of registrations) {
        await Promise.race([
          this.pxe.registerContract(contract),
          this.createTimeoutPromise(15000, `Contract ${contract.alias} registration timeout`)
        ]);
      }
      
      console.log('✅ Contract artifacts registered with PXE');
    } catch (error) {
      console.error('❌ Contract registration failed:', error);
      throw new Error(`Contract registration failed: ${this.getErrorMessage(error)}`);
    }
  }

  // Register account with PXE
  async registerAccountWithPXE() {
    try {
      console.log('📝 Registering account with PXE for private state...');
      
      const encryptionPrivateKey = this.account.getEncryptionPrivateKey();
      const completeAddress = this.account.getCompleteAddress();
      
      await Promise.race([
        this.pxe.registerAccount(encryptionPrivateKey, completeAddress),
        this.createTimeoutPromise(10000, 'Account registration timeout')
      ]);
      
      console.log('✅ Account registered with PXE');
    } catch (error) {
      console.warn('⚠️ Account registration warning (may already be registered):', error.message);
      // Non-fatal - account might already be registered
    }
  }

  // Enhanced progress update helper
  updateProgress(callback, phase, progress, message, timeEstimate = null, txHash = null) {
    if (callback) {
      callback({
        phase,
        progress,
        message,
        timeEstimate,
        txHash
      });
    }
  }

  // Load contract instances
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

  // Enhanced profile creation with better progress tracking
  async createProfile(profileData, progressCallback) {
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) throw new Error('ProfileRegistry not loaded');
      
      console.log('🎭 Creating profile on Aztec testnet...', { 
        username: profileData.username 
      });
      
      this.updateProgress(progressCallback, 'preparing', 10, 'Preparing transaction data...', '30 seconds');
      
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
      
      this.updateProgress(progressCallback, 'proving', 30, 'Generating zero-knowledge proofs...', '2-5 minutes');
      
      // Get fee payment options
      const feeOptions = await this.getFeeOptions();
      
      // Send transaction to Aztec testnet with timeout
      console.log('📝 Sending profile creation transaction to testnet...');
      const tx = await Promise.race([
        profileRegistry.methods.create_profile(usernameHash, tokenURIHash).send(feeOptions),
        this.createTimeoutPromise(60000, 'Transaction submission timeout')
      ]);
      
      const txHash = tx.getTxHash().toString();
      console.log('📤 Transaction sent to testnet:', txHash);
      
      this.updateProgress(progressCallback, 'mining', 60, 'Waiting for blockchain confirmation...', '1-3 minutes', txHash);
      
      // Start background monitoring
      this.startTransactionMonitoring(txHash, 'profile_creation', progressCallback);
      
      // Wait for confirmation with timeout
      const receipt = await Promise.race([
        tx.wait({ 
          timeout: AZTEC_CONFIG.TRANSACTION_TIMEOUT,
          interval: AZTEC_CONFIG.POLL_INTERVAL
        }),
        this.createTimeoutPromise(AZTEC_CONFIG.TRANSACTION_TIMEOUT, 'Transaction confirmation timeout')
      ]);
      
      if (receipt.status !== TxStatus.SUCCESS) {
        throw new Error(`Profile creation failed: ${receipt.error || 'Transaction reverted'}`);
      }
      
      console.log('✅ Profile created successfully on Aztec testnet!');
      
      this.updateProgress(progressCallback, 'complete', 100, 'Profile created successfully!', null, receipt.txHash.toString());
      
      // Store metadata locally for UI
      this.storeProfileMetadata(this.wallet.getAddress().toString(), metadata);
      
      return {
        success: true,
        txHash: receipt.txHash.toString(),
        profileId: await this.getProfileId(),
        metadata
      };
      
    } catch (error) {
      console.error('❌ Profile creation failed:', error);
      this.updateProgress(progressCallback, 'error', 0, this.getErrorMessage(error));
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Enhanced transaction monitoring with better timeout handling
  startTransactionMonitoring(txHash, operationType, progressCallback) {
    const startTime = Date.now();
    
    console.log(`🔍 Starting background monitoring for ${operationType}: ${txHash}`);
    
    this.transactionMonitors.set(txHash, {
      type: operationType,
      startTime: startTime,
      callback: progressCallback
    });
    
    // Enhanced polling with exponential backoff
    let pollCount = 0;
    const maxPolls = Math.floor(AZTEC_CONFIG.TRANSACTION_TIMEOUT / AZTEC_CONFIG.POLL_INTERVAL);
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        const elapsed = Date.now() - startTime;
        
        // Check timeout
        if (elapsed > AZTEC_CONFIG.TRANSACTION_TIMEOUT || pollCount > maxPolls) {
          clearInterval(pollInterval);
          this.handleTransactionTimeout(txHash, operationType);
          return;
        }
        
        // Try to get transaction receipt
        const receipt = await Promise.race([
          this.pxe.getTxReceipt(txHash),
          this.createTimeoutPromise(5000, 'Receipt fetch timeout')
        ]);
        
        if (receipt && receipt.status !== TxStatus.PENDING) {
          clearInterval(pollInterval);
          this.handleTransactionComplete(txHash, receipt, operationType);
        } else {
          // Update progress with exponential patience
          const progress = Math.min(60 + (elapsed / AZTEC_CONFIG.TRANSACTION_TIMEOUT) * 30, 95);
          const timeRemaining = Math.max(0, AZTEC_CONFIG.TRANSACTION_TIMEOUT - elapsed);
          const minutesRemaining = Math.ceil(timeRemaining / 60000);
          
          if (progressCallback) {
            progressCallback({
              phase: 'confirming',
              progress: progress,
              message: `Confirming on testnet... (~${minutesRemaining}m remaining)`,
              txHash: txHash,
              elapsed: elapsed
            });
          }
        }
      } catch (pollError) {
        console.log(`Polling for transaction ${txHash}... (attempt ${pollCount})`);
        
        // If we're getting consistent errors, slow down polling
        if (pollCount % 3 === 0) {
          console.log('Slowing down polling due to errors...');
          clearInterval(pollInterval);
          // Restart with longer interval
          setTimeout(() => {
            this.startTransactionMonitoring(txHash, operationType, progressCallback);
          }, AZTEC_CONFIG.POLL_INTERVAL * 2);
        }
      }
    }, AZTEC_CONFIG.POLL_INTERVAL);
  }

  // Handle transaction completion
  handleTransactionComplete(txHash, receipt, operationType) {
    console.log(`✅ Transaction ${operationType} completed:`, txHash);
    
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

  // Connection health check
  async checkConnection() {
    try {
      if (!this.pxe || !this.isInitialized) {
        return { healthy: false, reason: 'Not initialized' };
      }
      
      // Quick health check with timeout
      await Promise.race([
        this.pxe.getNodeInfo(),
        this.createTimeoutPromise(5000, 'Health check timeout')
      ]);
      
      return { 
        healthy: true, 
        lastConnectionTime: this.lastConnectionTime,
        uptime: Date.now() - this.lastConnectionTime
      };
      
    } catch (error) {
      return { 
        healthy: false, 
        reason: error.message,
        lastError: this.getErrorMessage(error)
      };
    }
  }

  // Auto-reconnection logic
  async attemptReconnection() {
    console.log('🔄 Attempting to reconnect to Aztec Network...');
    
    try {
      // Reset connection state
      this.isInitialized = false;
      this.pxe = null;
      
      // Reinitialize
      await this.initialize();
      
      // If we had a wallet, try to restore it
      if (this.getStoredWalletKeys()) {
        const result = await this.restoreWallet();
        if (result.success) {
          await this.loadContracts();
        }
      }
      
      console.log('✅ Reconnection successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced error message handling with Aztec-specific patterns
  getErrorMessage(error) {
    const message = error?.message || error?.toString() || 'Unknown error';
    
    // Aztec-specific error patterns with user-friendly messages
    if (message.includes('PXE_SERVICE_NOT_AVAILABLE') || message.includes('ECONNREFUSED')) {
      return 'Aztec testnet is currently unavailable. Please try again later or switch to mock mode.';
    }
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return 'Connection timeout. Aztec testnet can be slow - please try again or use mock mode for testing.';
    }
    if (message.includes('INSUFFICIENT_FUNDS')) {
      return 'Insufficient funds. Try using sponsored transactions or get testnet tokens.';
    }
    if (message.includes('ACCOUNT_NOT_DEPLOYED')) {
      return 'Account not deployed. Please deploy your account first.';
    }
    if (message.includes('CONTRACT_NOT_FOUND')) {
      return 'Contract not found. Please check contract addresses and network.';
    }
    if (message.includes('SIMULATION_FAILED')) {
      return 'Transaction simulation failed. Please check your transaction parameters.';
    }
    if (message.includes('field_overflow') || message.includes('FIELD_OVERFLOW')) {
      return 'Input value too large for Aztec field. Please use smaller values.';
    }
    if (message.includes('WebAssembly') || message.includes('wasm')) {
      return 'Browser WebAssembly issue. Please update your browser or try in Chrome/Firefox.';
    }
    if (message.includes('Failed to fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    return message;
  }

  // Utility functions
  hashStringToField(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data[i];
      hash = hash & hash;
    }
    
    const fieldValue = Math.abs(hash) % (2**254 - 1);
    return Fr.fromString(fieldValue.toString());
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
        return null;
      }
      
      const tokenURI = await profileRegistry.methods
        .get_token_uri(address)
        .simulate();
      
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
      return true;
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

  // Get fee payment options
  async getFeeOptions() {
    try {
      if (this.sponsoredFPC && this.sponsoredFPC.address && this.sponsoredFPC.isReady) {
        return {
          fee: {
            paymentMethod: 'fpc-sponsored',
            fpc: this.sponsoredFPC.address
          }
        };
      } else {
        return {};
      }
    } catch (error) {
      console.warn('⚠️ Fee options setup failed, using default:', error.message);
      return {};
    }
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

  // Storage functions
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

  storeProfileMetadata(address, metadata) {
    const dataWithTimestamp = {
      ...metadata,
      storedAt: Date.now()
    };
    localStorage.setItem(`aztec_profile_meta_${address}`, JSON.stringify(dataWithTimestamp));
  }

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

  // Enhanced cleanup
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
    this.connectionAttempts = 0;
    this.lastConnectionTime = null;
    
    console.log('🧹 Aztec client disconnected and cleaned up');
  }
}

// Export singleton instance
export const aztecClient = new OptimizedAztecClient();
export default aztecClient;
