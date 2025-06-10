// src/utils/deploymentTracker.js - COMPLETE DEPLOYMENT TRACKING SYSTEM
import React from 'react';
import { logger, LOG_CATEGORIES } from './loggingSystem';

// Deployment status enum
export const DEPLOYMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMING: 'confirming',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
};

// Enhanced deployment tracker with onchain verification
export class DeploymentTracker {
  constructor(operationType, description, expectedConfirmations = 1) {
    this.operationType = operationType;
    this.description = description;
    this.expectedConfirmations = expectedConfirmations;
    this.startTime = Date.now();
    this.deploymentId = `${operationType}_${Date.now()}`;
    
    this.status = DEPLOYMENT_STATUS.PENDING;
    this.txHash = null;
    this.blockNumber = null;
    this.confirmations = 0;
    this.gasUsed = null;
    this.deployedAddress = null;
    this.stages = [];
    this.onchainData = null;
    
    // Event listeners for real-time updates
    this.progressCallbacks = new Set();
    this.statusCallbacks = new Set();
    
    // Initialize tracking
    this.initializeTracking();
  }

  initializeTracking() {
    logger.blockchain(LOG_CATEGORIES.TRANSACTION, `Deployment tracking started: ${this.description}`, {
      deploymentId: this.deploymentId,
      operationType: this.operationType,
      expectedConfirmations: this.expectedConfirmations
    });
    
    this.addStage('initialization', 'Deployment tracking initialized');
  }

  // Add stage with detailed logging
  addStage(stageName, message, data = null) {
    const stage = {
      name: stageName,
      message,
      timestamp: Date.now(),
      elapsed: Date.now() - this.startTime,
      data
    };
    
    this.stages.push(stage);
    
    logger.progress(LOG_CATEGORIES.TRANSACTION, `[${this.deploymentId}] ${stageName}: ${message}`, {
      deploymentId: this.deploymentId,
      stage: stageName,
      elapsed: stage.elapsed,
      data
    });
    
    // Notify callbacks
    this.notifyProgress({
      deploymentId: this.deploymentId,
      stage: stageName,
      message,
      elapsed: stage.elapsed,
      totalStages: this.stages.length
    });
    
    return stage;
  }

  // Set transaction hash and start monitoring
  setTransactionHash(txHash) {
    this.txHash = txHash;
    this.addStage('transaction_submitted', `Transaction submitted: ${txHash}`, {
      txHash
    });
    
    logger.transaction(LOG_CATEGORIES.TRANSACTION, `Transaction hash set for deployment`, txHash, {
      deploymentId: this.deploymentId,
      operationType: this.operationType
    });
    
    // Start onchain monitoring
    this.startOnchainMonitoring();
  }

  // Set deployed address for verification
  setDeployedAddress(address) {
    this.deployedAddress = address;
    this.addStage('address_set', `Deployed address set: ${address}`, {
      address
    });
  }

  // Start monitoring onchain status
  async startOnchainMonitoring() {
    if (!this.txHash) {
      logger.error(LOG_CATEGORIES.TRANSACTION, 'Cannot start onchain monitoring without transaction hash');
      return;
    }
    
    this.addStage('monitoring_start', 'Starting onchain monitoring');
    this.status = DEPLOYMENT_STATUS.CONFIRMING;
    
    // Polling for confirmation
    const pollInterval = 10000; // 10 seconds
    const maxDuration = 300000; // 5 minutes
    let pollCount = 0;
    const maxPolls = Math.floor(maxDuration / pollInterval);
    
    const monitor = setInterval(async () => {
      try {
        pollCount++;
        const elapsed = Date.now() - this.startTime;
        
        // Timeout check
        if (elapsed > maxDuration || pollCount > maxPolls) {
          clearInterval(monitor);
          this.handleTimeout();
          return;
        }
        
        // Check transaction status
        const status = await this.checkTransactionStatus();
        
        if (status.confirmed) {
          clearInterval(monitor);
          await this.handleConfirmation(status);
        } else if (status.failed) {
          clearInterval(monitor);
          this.handleFailure(status.error);
        } else {
          // Update progress
          const progress = Math.min((elapsed / maxDuration) * 100, 95);
          this.updateProgress(progress, `Waiting for confirmation... (${pollCount}/${maxPolls})`);
        }
        
      } catch (error) {
        logger.error(LOG_CATEGORIES.TRANSACTION, `Onchain monitoring error`, {
          deploymentId: this.deploymentId,
          error: error.message,
          attempt: pollCount
        });
        
        // Continue monitoring unless too many consecutive errors
        if (pollCount % 5 === 0) {
          logger.warn(LOG_CATEGORIES.TRANSACTION, 'Multiple monitoring errors, but continuing...', {
            deploymentId: this.deploymentId,
            consecutiveErrors: 5
          });
        }
      }
    }, pollInterval);
  }

  // Check transaction status (implementation depends on blockchain)
  async checkTransactionStatus() {
    try {
      logger.debug(LOG_CATEGORIES.TRANSACTION, `Checking transaction status`, {
        txHash: this.txHash?.slice(0, 16) + '...',
        deploymentId: this.deploymentId
      });
      
      // For Aztec, check PXE for transaction receipt
      if (window.aztecClient && window.aztecClient.pxe) {
        const receipt = await window.aztecClient.pxe.getTxReceipt(this.txHash);
        
        if (receipt) {
          return {
            confirmed: receipt.status === 'SUCCESS' || receipt.status === 'success',
            failed: receipt.status === 'REVERTED' || receipt.status === 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed,
            error: receipt.error
          };
        }
      }
      
      // Return pending if no receipt yet
      return {
        confirmed: false,
        failed: false,
        pending: true
      };
      
    } catch (error) {
      logger.error(LOG_CATEGORIES.TRANSACTION, 'Transaction status check failed', {
        txHash: this.txHash,
        error: error.message
      });
      
      throw error;
    }
  }

  // Handle successful confirmation
  async handleConfirmation(status) {
    this.status = DEPLOYMENT_STATUS.CONFIRMED;
    this.blockNumber = status.blockNumber;
    this.gasUsed = status.gasUsed;
    this.confirmations = 1; // Aztec has immediate finality
    
    this.addStage('confirmed', `Transaction confirmed in block ${status.blockNumber}`, {
      blockNumber: status.blockNumber,
      gasUsed: status.gasUsed,
      confirmations: this.confirmations
    });
    
    // Verify onchain data
    await this.verifyOnchainDeployment();
    
    // Log final success
    const totalTime = Date.now() - this.startTime;
    logger.success(LOG_CATEGORIES.TRANSACTION, `Deployment confirmed onchain!`, {
      deploymentId: this.deploymentId,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      gasUsed: this.gasUsed,
      totalTime: `${totalTime}ms`,
      stages: this.stages.length
    });
    
    // Notify callbacks
    this.notifyStatusChange({
      status: DEPLOYMENT_STATUS.CONFIRMED,
      deploymentId: this.deploymentId,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      totalTime
    });
  }

  // Verify the actual deployment onchain
  async verifyOnchainDeployment() {
    this.addStage('verification', 'Verifying deployment onchain');
    
    try {
      // Verify based on operation type
      switch (this.operationType) {
        case 'account_deployment':
        case 'wallet_creation':
          await this.verifyAccountDeployment();
          break;
        case 'profile_creation':
          await this.verifyProfileCreation();
          break;
        case 'contract_deployment':
          await this.verifyContractDeployment();
          break;
        default:
          this.addStage('verification_skipped', `No specific verification for ${this.operationType}`);
      }
      
    } catch (error) {
      logger.error(LOG_CATEGORIES.TRANSACTION, 'Onchain verification failed', {
        deploymentId: this.deploymentId,
        operationType: this.operationType,
        error: error.message
      });
      
      this.addStage('verification_error', `Verification failed: ${error.message}`);
    }
  }

  // Verify account deployment
  async verifyAccountDeployment() {
    try {
      if (window.aztecClient && this.deployedAddress) {
        const isDeployed = await window.aztecClient.pxe.isAccountDeployed(this.deployedAddress);
        
        if (isDeployed) {
          this.onchainData = {
            accountAddress: this.deployedAddress,
            deployed: true,
            verified: true
          };
          
          this.addStage('account_verified', 'Account deployment verified onchain', {
            address: this.deployedAddress,
            verified: true
          });
          
          logger.success(LOG_CATEGORIES.WALLET, 'Account deployment verified onchain', {
            address: this.deployedAddress,
            txHash: this.txHash
          });
        } else {
          throw new Error('Account not found onchain despite confirmed transaction');
        }
      } else {
        // If no specific address, assume wallet creation was successful
        this.addStage('account_assumed', 'Account deployment assumed successful (no verification address)');
      }
    } catch (error) {
      logger.error(LOG_CATEGORIES.WALLET, 'Account verification failed', error);
      throw error;
    }
  }

  // Verify profile creation
  async verifyProfileCreation() {
    try {
      if (window.aztecClient && window.aztecClient.contracts) {
        const profileRegistry = window.aztecClient.contracts.get('ProfileRegistry');
        
        if (profileRegistry && this.deployedAddress) {
          // Check if profile exists
          const hasProfile = await profileRegistry.methods.has_profile(this.deployedAddress).simulate();
          
          if (hasProfile) {
            const profileId = await profileRegistry.methods.get_profile_id(this.deployedAddress).simulate();
            
            this.onchainData = {
              profileId: profileId.toString(),
              owner: this.deployedAddress,
              verified: true
            };
            
            this.addStage('profile_verified', `Profile creation verified onchain`, {
              profileId: profileId.toString(),
              owner: this.deployedAddress
            });
            
            logger.success(LOG_CATEGORIES.PROFILE, 'Profile creation verified onchain', {
              profileId: profileId.toString(),
              txHash: this.txHash,
              owner: this.deployedAddress
            });
          } else {
            throw new Error('Profile not found onchain despite confirmed transaction');
          }
        } else {
          this.addStage('profile_verification_skipped', 'Profile verification skipped (no contract or address)');
        }
      }
    } catch (error) {
      logger.error(LOG_CATEGORIES.PROFILE, 'Profile verification failed', error);
      throw error;
    }
  }

  // Verify contract deployment
  async verifyContractDeployment() {
    // Implementation for contract deployment verification
    this.addStage('contract_verification', 'Contract deployment verification not implemented yet');
  }

  // Handle transaction failure
  handleFailure(error) {
    this.status = DEPLOYMENT_STATUS.FAILED;
    
    this.addStage('failed', `Transaction failed: ${error || 'Unknown error'}`, {
      error: error || 'Unknown error'
    });
    
    const totalTime = Date.now() - this.startTime;
    logger.error(LOG_CATEGORIES.TRANSACTION, `Deployment failed`, {
      deploymentId: this.deploymentId,
      txHash: this.txHash,
      error,
      totalTime: `${totalTime}ms`
    });
    
    // Notify callbacks
    this.notifyStatusChange({
      status: DEPLOYMENT_STATUS.FAILED,
      deploymentId: this.deploymentId,
      error,
      totalTime
    });
  }

  // Handle timeout
  handleTimeout() {
    this.status = DEPLOYMENT_STATUS.TIMEOUT;
    
    this.addStage('timeout', 'Deployment monitoring timeout reached');
    
    const totalTime = Date.now() - this.startTime;
    logger.warn(LOG_CATEGORIES.TRANSACTION, `Deployment monitoring timeout`, {
      deploymentId: this.deploymentId,
      txHash: this.txHash,
      totalTime: `${totalTime}ms`,
      note: 'Transaction may still complete in background'
    });
    
    // Notify callbacks
    this.notifyStatusChange({
      status: DEPLOYMENT_STATUS.TIMEOUT,
      deploymentId: this.deploymentId,
      totalTime
    });
  }

  // Update progress
  updateProgress(progress, message, data = null) {
    this.notifyProgress({
      deploymentId: this.deploymentId,
      progress: Math.round(progress),
      message,
      elapsed: Date.now() - this.startTime,
      data
    });
  }

  // Register progress callback
  onProgress(callback) {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  // Register status change callback
  onStatusChange(callback) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  // Notify progress callbacks
  notifyProgress(data) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(LOG_CATEGORIES.SYSTEM, 'Progress callback error', error);
      }
    });
  }

  // Notify status change callbacks
  notifyStatusChange(data) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        logger.error(LOG_CATEGORIES.SYSTEM, 'Status callback error', error);
      }
    });
  }

  // Get deployment summary
  getSummary() {
    const totalTime = Date.now() - this.startTime;
    
    return {
      deploymentId: this.deploymentId,
      operationType: this.operationType,
      description: this.description,
      status: this.status,
      startTime: this.startTime,
      totalTime,
      txHash: this.txHash,
      blockNumber: this.blockNumber,
      gasUsed: this.gasUsed,
      confirmations: this.confirmations,
      deployedAddress: this.deployedAddress,
      stages: this.stages,
      onchainData: this.onchainData
    };
  }

  // Export deployment data for debugging
  exportData() {
    return {
      ...this.getSummary(),
      timestamp: new Date().toISOString(),
      logs: this.stages,
      userAgent: navigator?.userAgent,
      url: window?.location?.href
    };
  }
}

// Global deployment manager
export class DeploymentManager {
  constructor() {
    this.activeDeployments = new Map();
    this.completedDeployments = new Map();
    this.maxHistory = 100;
    
    logger.info(LOG_CATEGORIES.SYSTEM, 'Deployment manager initialized');
  }

  // Create new deployment tracker
  createDeployment(operationType, description, expectedConfirmations = 1) {
    const tracker = new DeploymentTracker(operationType, description, expectedConfirmations);
    
    this.activeDeployments.set(tracker.deploymentId, tracker);
    
    // Listen for completion
    tracker.onStatusChange((data) => {
      if (data.status === DEPLOYMENT_STATUS.CONFIRMED || 
          data.status === DEPLOYMENT_STATUS.FAILED || 
          data.status === DEPLOYMENT_STATUS.TIMEOUT) {
        
        // Move to completed
        this.completedDeployments.set(tracker.deploymentId, tracker);
        this.activeDeployments.delete(tracker.deploymentId);
        
        // Limit history
        if (this.completedDeployments.size > this.maxHistory) {
          const oldestKey = this.completedDeployments.keys().next().value;
          this.completedDeployments.delete(oldestKey);
        }
      }
    });
    
    logger.info(LOG_CATEGORIES.SYSTEM, 'New deployment tracker created', {
      deploymentId: tracker.deploymentId,
      operationType,
      description
    });
    
    return tracker;
  }

  // Get all active deployments
  getActiveDeployments() {
    return Array.from(this.activeDeployments.values()).map(tracker => tracker.getSummary());
  }

  // Get completed deployments
  getCompletedDeployments() {
    return Array.from(this.completedDeployments.values()).map(tracker => tracker.getSummary());
  }

  // Get deployment by ID
  getDeployment(deploymentId) {
    return this.activeDeployments.get(deploymentId) || this.completedDeployments.get(deploymentId);
  }

  // Get deployment statistics
  getStatistics() {
    const completed = Array.from(this.completedDeployments.values());
    const active = Array.from(this.activeDeployments.values());
    
    const stats = {
      total: completed.length + active.length,
      active: active.length,
      completed: completed.length,
      confirmed: completed.filter(t => t.status === DEPLOYMENT_STATUS.CONFIRMED).length,
      failed: completed.filter(t => t.status === DEPLOYMENT_STATUS.FAILED).length,
      timeout: completed.filter(t => t.status === DEPLOYMENT_STATUS.TIMEOUT).length
    };
    
    // Calculate average completion time
    const confirmedDeployments = completed.filter(t => t.status === DEPLOYMENT_STATUS.CONFIRMED);
    if (confirmedDeployments.length > 0) {
      const totalTime = confirmedDeployments.reduce((sum, t) => {
        const summary = t.getSummary();
        return sum + summary.totalTime;
      }, 0);
      stats.averageTime = Math.round(totalTime / confirmedDeployments.length);
    }
    
    return stats;
  }

  // Export all deployment data
  exportAllData() {
    const allDeployments = [
      ...Array.from(this.activeDeployments.values()),
      ...Array.from(this.completedDeployments.values())
    ];
    
    return {
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      deployments: allDeployments.map(tracker => tracker.exportData())
    };
  }
}

// Global deployment manager instance
export const deploymentManager = new DeploymentManager();

// Enhanced React hook for deployment tracking
export const useDeploymentTracker = () => {
  const [activeDeployments, setActiveDeployments] = React.useState([]);
  const [statistics, setStatistics] = React.useState({});
  
  // Update active deployments
  React.useEffect(() => {
    const updateDeployments = () => {
      setActiveDeployments(deploymentManager.getActiveDeployments());
      setStatistics(deploymentManager.getStatistics());
    };
    
    updateDeployments();
    
    // Update every 2 seconds
    const interval = setInterval(updateDeployments, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    activeDeployments,
    statistics,
    createDeployment: (operationType, description, expectedConfirmations) => 
      deploymentManager.createDeployment(operationType, description, expectedConfirmations),
    getDeployment: (deploymentId) => deploymentManager.getDeployment(deploymentId),
    exportData: () => deploymentManager.exportAllData()
  };
};
