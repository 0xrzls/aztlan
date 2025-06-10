// src/lib/aztecClientWithLogging.js - AZTEC CLIENT WITH COMPREHENSIVE LOGGING
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
import { logger, TransactionTracker, LOG_CATEGORIES } from '../utils/loggingSystem';

// Import contract artifacts
import ProfileRegistryArtifact from '../artifacts/AztlanProfileRegistry.json';
import PrivateSocialArtifact from '../artifacts/AztlanPrivateSocial.json';

// Enhanced Aztec client with comprehensive logging
class LoggedAztecClient {
  constructor() {
    this.pxe = null;
    this.wallet = null;
    this.account = null;
    this.contracts = new Map();
    this.isInitialized = false;
    this.connectionAttempts = 0;
    this.activeOperations = new Map();
    
    this.config = {
      PXE_URL: process.env.REACT_APP_PXE_URL || 'https://aztec-alpha-testnet-fullnode.zkv.xyz',
      SPONSORED_FPC_ADDRESS: '0x0b27e30667202907fc700d50e9bc816be42f8141fae8b9f2281873dbdb9fc2e5',
      INIT_TIMEOUT: 20000,
      DEPLOYMENT_TIMEOUT: 300000,
      TRANSACTION_TIMEOUT: 180000,
      POLL_INTERVAL: 10000,
      MAX_RETRIES: 3,
      
      CONTRACT_ADDRESSES: {
        ProfileRegistry: process.env.REACT_APP_PROFILE_REGISTRY_ADDRESS || 
          '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
        PrivateSocials: process.env.REACT_APP_PRIVATE_SOCIALS_ADDRESS || 
          '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
      }
    };

    logger.info(LOG_CATEGORIES.SYSTEM, 'Aztec client instance created', {
      config: {
        pxeUrl: this.config.PXE_URL,
        contracts: this.config.CONTRACT_ADDRESSES
      }
    });
  }

  // Enhanced initialization with detailed logging
  async initialize() {
    const tracker = new TransactionTracker('aztec_initialization', 'Initializing Aztec PXE connection');
    this.connectionAttempts++;
    
    try {
      logger.aztecInitializing(this.config.PXE_URL);
      tracker.addStage('connecting', `Connecting to PXE (attempt ${this.connectionAttempts})`);
      
      this.pxe = createPXEClient(this.config.PXE_URL);
      
      // Enhanced connection with detailed progress
      tracker.addStage('handshake', 'Performing PXE handshake');
      await Promise.race([
        waitForPXE(this.pxe),
        this.createTimeoutPromise(this.config.INIT_TIMEOUT, 'PXE connection timeout')
      ]);
      
      tracker.addStage('validation', 'Validating connection and retrieving node info');
      const nodeInfo = await Promise.race([
        this.pxe.getNodeInfo(),
        this.createTimeoutPromise(5000, 'Node info timeout')
      ]);
      
      logger.aztecConnected({
        chainId: nodeInfo.chainId,
        version: nodeInfo.version,
        protocolVersion: nodeInfo.protocolVersion,
        attempt: this.connectionAttempts
      });
      
      tracker.addStage('setup', 'Setting up sponsored FPC');
      await this.initializeSponsoredFPC();
      
      this.isInitialized = true;
      tracker.complete({
        nodeInfo,
        attempt: this.connectionAttempts,
        pxeUrl: this.config.PXE_URL
      });
      
      return { success: true };
      
    } catch (error) {
      logger.networkError('Aztec PXE', error);
      tracker.fail(error);
      
      // Retry logic with exponential backoff
      if (this.connectionAttempts < this.config.MAX_RETRIES) {
        const delay = 2000 * Math.pow(2, this.connectionAttempts - 1);
        logger.warn(LOG_CATEGORIES.NETWORK, `Retrying Aztec connection in ${delay}ms...`, {
          attempt: this.connectionAttempts,
          maxRetries: this.config.MAX_RETRIES
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return await this.initialize();
      }
      
      throw new Error(`Failed to connect to Aztec Network after ${this.config.MAX_RETRIES} attempts: ${error.message}`);
    }
  }

  // Enhanced wallet creation with detailed logging
  async createWallet(progressCallback) {
    const tracker = new TransactionTracker('wallet_creation', 'Creating Aztec wallet account');
    
    if (!this.pxe) {
      const error = new Error('PXE not initialized');
      tracker.fail(error);
      throw error;
    }
    
    try {
      logger.walletConnecting('Aztec Native');
      tracker.addStage('key_generation', 'Generating cryptographic keys');
      
      // Generate cryptographic keys with logging
      const secretKey = Fr.random();
      const signingPrivateKey = GrumpkinScalar.random();
      
      logger.debug(LOG_CATEGORIES.WALLET, 'Cryptographic keys generated', {
        secretKeyLength: secretKey.toString().length,
        signingKeyLength: signingPrivateKey.toString().length
      });
      
      tracker.addStage('account_creation', 'Creating Schnorr account instance');
      this.account = getSchnorrAccount(this.pxe, secretKey, signingPrivateKey);
      const address = this.account.getAddress();
      
      logger.info(LOG_CATEGORIES.WALLET, 'Account instance created', {
        address: address.toString().slice(0, 10) + '...' + address.toString().slice(-8),
        type: 'Schnorr'
      });
      
      // Store keys before deployment
      tracker.addStage('key_storage', 'Storing wallet keys securely');
      this.storeWalletKeys(secretKey, signingPrivateKey, address);
      
      // Register contracts first
      tracker.addStage('contract_registration', 'Registering contract artifacts with PXE');
      await this.registerContracts();
      
      // Fee options
      tracker.addStage('fee_setup', 'Configuring fee payment options');
      const feeOptions = await this.getFeeOptions();
      
      logger.info(LOG_CATEGORIES.WALLET, 'Fee options configured', {
        sponsored: !!feeOptions.fee?.fpc,
        paymentMethod: feeOptions.fee?.paymentMethod || 'default'
      });
      
      // Account deployment
      tracker.addStage('deployment', 'Deploying account contract to Aztec testnet');
      logger.aztecAccountDeploying(address.toString());
      
      const deployStart = Date.now();
      const deployTx = await Promise.race([
        this.account.deploy(feeOptions),
        this.createTimeoutPromise(60000, 'Account deployment initialization timeout')
      ]);
      
      const txHash = deployTx.getTxHash().toString();
      tracker.setTxHash(txHash);
      logger.transactionBroadcast(txHash);
      
      tracker.addStage('confirmation', 'Waiting for blockchain confirmation');
      
      // Enhanced transaction monitoring
      this.startTransactionMonitoring(txHash, 'account_deployment', (update) => {
        tracker.updateProgress(update.progress, update.message);
        if (progressCallback) progressCallback(update);
      });
      
      const deployReceipt = await Promise.race([
        deployTx.wait({
          timeout: this.config.DEPLOYMENT_TIMEOUT,
          interval: this.config.POLL_INTERVAL
        }),
        this.createTimeoutPromise(this.config.DEPLOYMENT_TIMEOUT, 'Account deployment timeout')
      ]);
      
      if (deployReceipt.status !== TxStatus.SUCCESS) {
        const error = new Error(`Account deployment failed: ${deployReceipt.error || 'Transaction reverted'}`);
        tracker.fail(error);
        throw error;
      }
      
      const deployDuration = Date.now() - deployStart;
      logger.aztecAccountDeployed(address.toString(), txHash);
      logger.performanceMetric('account_deployment', deployDuration, {
        txHash,
        gasUsed: deployReceipt.gasUsed,
        blockNumber: deployReceipt.blockNumber
      });
      
      // Get wallet instance
      tracker.addStage('wallet_setup', 'Setting up wallet instance');
      this.wallet = await this.account.getWallet();
      
      // Register account with PXE
      tracker.addStage('pxe_registration', 'Registering account with PXE for private state');
      await this.registerAccountWithPXE();
      
      logger.walletConnected(address.toString(), 'Aztec Native');
      tracker.complete({
        address: address.toString(),
        txHash,
        deploymentTime: deployDuration,
        blockNumber: deployReceipt.blockNumber
      });
      
      return {
        success: true,
        address: address.toString(),
        txHash
      };
      
    } catch (error) {
      logger.walletError('creation', error);
      tracker.fail(error);
      throw error;
    }
  }

  // Enhanced profile creation with detailed logging
  async createProfile(profileData, progressCallback) {
    const tracker = new TransactionTracker('profile_creation', `Creating profile for ${profileData.username}`);
    
    try {
      const profileRegistry = this.contracts.get('ProfileRegistry');
      if (!profileRegistry) {
        const error = new Error('ProfileRegistry contract not loaded');
        tracker.fail(error);
        throw error;
      }
      
      logger.profileCreating(profileData.username, profileData.displayName);
      
      // Data preparation
      tracker.addStage('data_preparation', 'Preparing profile data and metadata');
      const usernameHash = this.hashStringToField(profileData.username);
      
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
      
      logger.debug(LOG_CATEGORIES.PROFILE, 'Profile metadata prepared', {
        username: profileData.username,
        usernameHash: usernameHash.toString(),
        metadataSize: metadataString.length,
        tokenURIHash: tokenURIHash.toString()
      });
      
      // Fee options
      tracker.addStage('fee_setup', 'Configuring transaction fees');
      const feeOptions = await this.getFeeOptions();
      
      // Proof generation
      tracker.addStage('proof_generation', 'Generating zero-knowledge proofs');
      logger.aztecProofGenerating('profile_creation');
      
      const proofStart = Date.now();
      const tx = await Promise.race([
        profileRegistry.methods.create_profile(usernameHash, tokenURIHash).send(feeOptions),
        this.createTimeoutPromise(60000, 'Transaction submission timeout')
      ]);
      
      const proofDuration = Date.now() - proofStart;
      logger.aztecProofGenerated('profile_creation', proofDuration);
      
      const txHash = tx.getTxHash().toString();
      tracker.setTxHash(txHash);
      logger.transactionSigned('profile_creation', txHash);
      
      // Transaction monitoring
      tracker.addStage('broadcasting', 'Broadcasting transaction to network');
      logger.transactionBroadcast(txHash);
      
      this.startTransactionMonitoring(txHash, 'profile_creation', (update) => {
        tracker.updateProgress(update.progress, update.message);
        if (progressCallback) progressCallback(update);
      });
      
      // Wait for confirmation
      tracker.addStage('confirmation', 'Waiting for blockchain confirmation');
      const receipt = await Promise.race([
        tx.wait({ 
          timeout: this.config.TRANSACTION_TIMEOUT,
          interval: this.config.POLL_INTERVAL
        }),
        this.createTimeoutPromise(this.config.TRANSACTION_TIMEOUT, 'Transaction confirmation timeout')
      ]);
      
      if (receipt.status !== TxStatus.SUCCESS) {
        const error = new Error(`Profile creation failed: ${receipt.error || 'Transaction reverted'}`);
        logger.transactionFailed(txHash, error);
        tracker.fail(error);
        throw error;
      }
      
      // Success handling
      const profileId = await this.getProfileId();
      logger.transactionConfirmed(txHash, receipt.blockNumber, receipt.gasUsed);
      logger.profileCreated(profileId, txHash);
      
      // Store metadata locally
      tracker.addStage('metadata_storage', 'Storing profile metadata locally');
      this.storeProfileMetadata(this.wallet.getAddress().toString(), metadata);
      
      tracker.complete({
        profileId,
        txHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        metadata
      });
      
      return {
        success: true,
        txHash,
        profileId,
        metadata
      };
      
    } catch (error) {
      logger.profileError('creation', error);
      tracker.fail(error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced transaction monitoring with detailed logging
  startTransactionMonitoring(txHash, operationType, progressCallback) {
    const startTime = Date.now();
    const monitoringId = `${operationType}_${txHash.slice(0, 8)}`;
    
    logger.info(LOG_CATEGORIES.TRANSACTION, `Starting transaction monitoring`, {
      txHash,
      operationType,
      monitoringId
    });
    
    this.activeOperations.set(monitoringId, {
      txHash,
      operationType,
      startTime,
      callback: progressCallback
    });
    
    let pollCount = 0;
    const maxPolls = Math.floor(this.config.TRANSACTION_TIMEOUT / this.config.POLL_INTERVAL);
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        const elapsed = Date.now() - startTime;
        
        logger.debug(LOG_CATEGORIES.TRANSACTION, `Polling transaction status`, {
          txHash: txHash.slice(0, 16) + '...',
          attempt: pollCount,
          elapsed: `${Math.round(elapsed / 1000)}s`
        });
        
        // Timeout check
        if (elapsed > this.config.TRANSACTION_TIMEOUT || pollCount > maxPolls) {
          clearInterval(pollInterval);
          this.handleTransactionTimeout(txHash, operationType, elapsed);
          return;
        }
        
        // Get transaction receipt
        const receipt = await Promise.race([
          this.pxe.getTxReceipt(txHash),
          this.createTimeoutPromise(5000, 'Receipt fetch timeout')
        ]);
        
        if (receipt && receipt.status !== TxStatus.PENDING) {
          clearInterval(pollInterval);
          this.handleTransactionComplete(txHash, receipt, operationType, elapsed);
        } else {
          // Progress update
          const progress = Math.min(60 + (elapsed / this.config.TRANSACTION_TIMEOUT) * 30, 95);
          const timeRemaining = Math.max(0, this.config.TRANSACTION_TIMEOUT - elapsed);
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
        logger.debug(LOG_CATEGORIES.TRANSACTION, `Transaction polling attempt ${pollCount}`, {
          txHash: txHash.slice(0, 16) + '...',
          error: pollError.message
        });
        
        // If consistently failing, slow down polling
        if (pollCount % 3 === 0) {
          logger.warn(LOG_CATEGORIES.TRANSACTION, 'Slowing down transaction polling due to errors', {
            txHash: txHash.slice(0, 16) + '...',
            attempts: pollCount
          });
        }
      }
    }, this.config.POLL_INTERVAL);
  }

  // Enhanced transaction completion handling
  handleTransactionComplete(txHash, receipt, operationType, elapsed) {
    const monitoringId = `${operationType}_${txHash.slice(0, 8)}`;
    
    logger.blockchain(LOG_CATEGORIES.TRANSACTION, `Transaction ${operationType} completed`, {
      txHash,
      status: receipt.status === TxStatus.SUCCESS ? 'success' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      elapsed: `${Math.round(elapsed / 1000)}s`
    });
    
    // Emit completion event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aztecTransactionComplete', { 
        detail: { 
          txHash, 
          status: receipt.status === TxStatus.SUCCESS ? 'success' : 'error',
          operationType,
          receipt,
          elapsed
        }
      }));
    }
    
    this.activeOperations.delete(monitoringId);
  }

  // Enhanced transaction timeout handling
  handleTransactionTimeout(txHash, operationType, elapsed) {
    const monitoringId = `${operationType}_${txHash.slice(0, 8)}`;
    
    logger.error(LOG_CATEGORIES.TRANSACTION, `Transaction ${operationType} monitoring timeout`, {
      txHash,
      operationType,
      elapsed: `${Math.round(elapsed / 1000)}s`,
      suggestion: 'Transaction may still be processing in background'
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aztecTransactionTimeout', {
        detail: { txHash, operationType, elapsed }
      }));
    }
    
    this.activeOperations.delete(monitoringId);
  }

  // Utility methods with logging
  createTimeoutPromise(timeout, message) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        logger.warn(LOG_CATEGORIES.SYSTEM, `Operation timeout: ${message}`, { timeout });
        reject(new Error(message));
      }, timeout);
    });
  }

  hashStringToField(str) {
    logger.debug(LOG_CATEGORIES.SYSTEM, `Hashing string to field`, { 
      input: str,
      length: str.length 
    });
    
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data[i];
      hash = hash & hash;
    }
    
    const fieldValue = Math.abs(hash) % (2**254 - 1);
    const result = Fr.fromString(fieldValue.toString());
    
    logger.debug(LOG_CATEGORIES.SYSTEM, `String hashed to field`, { 
      hash: fieldValue,
      field: result.toString()
    });
    
    return result;
  }

  // Contract registration with logging
  async registerContracts() {
    logger.info(LOG_CATEGORIES.CONTRACT, 'Registering contract artifacts with PXE');
    
    const contracts = [
      {
        name: 'ProfileRegistry',
        address: this.config.CONTRACT_ADDRESSES.ProfileRegistry,
        artifact: ProfileRegistryArtifact
      },
      {
        name: 'PrivateSocials',
        address: this.config.CONTRACT_ADDRESSES.PrivateSocials,
        artifact: PrivateSocialArtifact
      }
    ];
    
    for (const contract of contracts) {
      try {
        logger.contractInteraction(contract.name, 'register', {
          address: contract.address
        });
        
        await Promise.race([
          this.pxe.registerContract({
            address: AztecAddress.fromString(contract.address),
            artifact: contract.artifact,
            alias: contract.name
          }),
          this.createTimeoutPromise(15000, `Contract ${contract.name} registration timeout`)
        ]);
        
        logger.success(LOG_CATEGORIES.CONTRACT, `Contract ${contract.name} registered successfully`, {
          address: contract.address
        });
        
      } catch (error) {
        logger.contractError(contract.name, 'register', error);
        throw error;
      }
    }
  }

  // Load contracts with logging
  async loadContracts() {
    if (!this.wallet) {
      throw new Error('Wallet not available');
    }
    
    logger.info(LOG_CATEGORIES.CONTRACT, 'Loading contract instances');
    
    try {
      // Load ProfileRegistry
      const profileRegistryAddress = AztecAddress.fromString(
        this.config.CONTRACT_ADDRESSES.ProfileRegistry
      );
      const profileRegistry = await Contract.at(
        profileRegistryAddress,
        ProfileRegistryArtifact,
        this.wallet
      );
      
      // Load PrivateSocials
      const privateSocialsAddress = AztecAddress.fromString(
        this.config.CONTRACT_ADDRESSES.PrivateSocials
      );
      const privateSocials = await Contract.at(
        privateSocialsAddress,
        PrivateSocialArtifact,
        this.wallet
      );
      
      this.contracts.set('ProfileRegistry', profileRegistry);
      this.contracts.set('PrivateSocials', privateSocials);
      
      logger.success(LOG_CATEGORIES.CONTRACT, 'All contract instances loaded successfully', {
        contracts: ['ProfileRegistry', 'PrivateSocials'],
        addresses: this.config.CONTRACT_ADDRESSES
      });
      
      return { success: true };
    } catch (error) {
      logger.contractError('system', 'load_all', error);
      throw error;
    }
  }

  // Get operations status for debugging
  getActiveOperations() {
    return Array.from(this.activeOperations.entries()).map(([id, operation]) => ({
      id,
      ...operation,
      elapsed: Date.now() - operation.startTime
    }));
  }

  // Rest of the methods with similar logging enhancements...
  // (keeping the artifact short, but all methods would have similar detailed logging)
  
  // Additional utility methods
  initializeSponsoredFPC() {
    // Implementation with logging
  }
  
  registerAccountWithPXE() {
    // Implementation with logging
  }
  
  getFeeOptions() {
    // Implementation with logging
  }
  
  // Storage methods
  storeWalletKeys(secretKey, signingPrivateKey, address) {
    // Implementation with logging
  }
  
  storeProfileMetadata(address, metadata) {
    // Implementation with logging
  }
  
  // Query methods
  hasProfile(userAddress = null) {
    // Implementation with logging
  }
  
  getProfile(userAddress = null) {
    // Implementation with logging
  }
  
  getProfileId() {
    // Implementation with logging
  }
  
  isUsernameAvailable(username) {
    // Implementation with logging
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
    logger.info(LOG_CATEGORIES.SYSTEM, 'Disconnecting Aztec client', {
      activeOperations: this.activeOperations.size
    });
    
    // Clear all active operations
    for (const [id] of this.activeOperations) {
      logger.debug(LOG_CATEGORIES.SYSTEM, `Cleaning up operation: ${id}`);
    }
    this.activeOperations.clear();
    
    // Reset state
    this.pxe = null;
    this.wallet = null;
    this.account = null;
    this.contracts.clear();
    this.isInitialized = false;
    this.connectionAttempts = 0;
    
    logger.success(LOG_CATEGORIES.SYSTEM, 'Aztec client disconnected and cleaned up');
  }
}

// Export singleton with logging
export const aztecClientWithLogging = new LoggedAztecClient();
export default aztecClientWithLogging;
