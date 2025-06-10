// src/components/CreateProfileModal.js - ENHANCED FOR REAL AZTEC INTEGRATION (FIXED)
import React, { useState, useEffect } from 'react';
import { FaTimes, FaRandom, FaCheck, FaTwitter, FaDiscord, FaExclamationTriangle, FaClock, FaRocket } from 'react-icons/fa';
import useWalletStore from '../store/walletStore';

const AVATAR_FILES = [
  '01UID.png', '02UID.png', '03UID.png', '04UID.png',
  '05UID.png', '06UID.png', '07UID.png', '08UID.png',
  '09UID.png', '10UID.png', '11UID.png', '12UID.png',
];

const CreateProfileModal = ({ isOpen, onClose, onComplete }) => {
  const { 
    createProfile, 
    isUsernameAvailable, 
    error, 
    isConnected,
    address,
    useMockData,
    addNotification
  } = useWalletStore();
  
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    avatar: '',
    twitter: '',
    discord: ''
  });
  
  const [validationState, setValidationState] = useState({
    username: { valid: false, checking: false, message: '' },
    displayName: { valid: false, message: '' }
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'creating', 'success', 'error'
  const [transactionProgress, setTransactionProgress] = useState({
    phase: 'idle',
    progress: 0,
    message: '',
    txHash: null,
    timeEstimate: null,
    startTime: null
  });

  // Pick random avatar on mount
  useEffect(() => {
    if (!formData.avatar && isOpen) {
      setFormData(prev => ({
        ...prev,
        avatar: pickRandomAvatar()
      }));
    }
  }, [isOpen, formData.avatar]);

  // Validate display name
  useEffect(() => {
    const displayName = formData.displayName.trim();
    setValidationState(prev => ({
      ...prev,
      displayName: {
        valid: displayName.length >= 2 && displayName.length <= 50,
        message: displayName.length === 0 ? '' : 
                displayName.length < 2 ? 'At least 2 characters required' :
                displayName.length > 50 ? 'Maximum 50 characters allowed' : ''
      }
    }));
  }, [formData.displayName]);

  // Validate username with availability check
  useEffect(() => {
    const username = formData.username.trim().toLowerCase();
    
    if (username.length === 0) {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: false, message: '' }
      }));
      return;
    }

    if (username.length < 3) {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: false, message: 'At least 3 characters required' }
      }));
      return;
    }

    if (username.length > 20) {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: false, message: 'Maximum 20 characters allowed' }
      }));
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: false, message: 'Only lowercase letters, numbers, and underscores allowed' }
      }));
      return;
    }

    // Reserved usernames
    const reserved = ['admin', 'root', 'aztec', 'aztlan', 'system', 'null', 'undefined'];
    if (reserved.includes(username)) {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: false, message: 'Username is reserved' }
      }));
      return;
    }

    // Check availability with debounce
    const timeoutId = setTimeout(async () => {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: true, message: 'Checking availability...' }
      }));

      try {
        const available = await isUsernameAvailable(username);
        setValidationState(prev => ({
          ...prev,
          username: {
            valid: available,
            checking: false,
            message: available ? 'Username is available!' : 'Username is already taken'
          }
        }));
      } catch (error) {
        setValidationState(prev => ({
          ...prev,
          username: { valid: false, checking: false, message: 'Error checking availability. Please try again.' }
        }));
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.username, isUsernameAvailable]);

  const pickRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * AVATAR_FILES.length);
    return `/uid/${AVATAR_FILES[randomIndex]}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRandomAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: pickRandomAvatar() }));
  };

  const isFormValid = () => {
    return validationState.username.valid && 
           validationState.displayName.valid && 
           !validationState.username.checking &&
           isConnected;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setSubmitting(true);
    setStep('creating');
    setTransactionProgress({
      phase: 'preparing',
      progress: 0,
      message: 'Preparing profile creation...',
      txHash: null,
      timeEstimate: useMockData ? '10 seconds' : '3-5 minutes',
      startTime: Date.now()
    });

    try {
      const result = await createProfile(formData);

      if (result.success) {
        setTransactionProgress({
          phase: 'complete',
          progress: 100,
          message: useMockData ? 'Mock profile created successfully!' : 'Profile created on Aztec Network!',
          txHash: result.txHash,
          timeEstimate: null,
          startTime: transactionProgress.startTime
        });
        
        setStep('success');
        
        // Store profile data locally for UI
        const profileData = {
          ...formData,
          txHash: result.txHash,
          createdAt: Date.now()
        };
        
        localStorage.setItem(`aztlan_profile_${address}`, JSON.stringify(profileData));
        
        // Add success notification
        addNotification({
          type: 'success',
          title: 'Profile Created!',
          message: `Your ${useMockData ? 'mock' : 'Aztec'} profile has been created successfully.`,
          txHash: result.txHash
        });
        
        // Auto close after 3 seconds
        setTimeout(() => {
          if (onComplete) onComplete(profileData);
          onClose();
          resetForm();
        }, 3000);
        
      } else {
        throw new Error(result.error);
      }
      
    } catch (err) {
      console.error('Profile creation error:', err);
      setTransactionProgress({
        phase: 'error',
        progress: 0,
        message: err.message || 'Failed to create profile',
        txHash: null,
        timeEstimate: null,
        startTime: transactionProgress.startTime
      });
      setStep('error');
      
      addNotification({
        type: 'error',
        title: 'Profile Creation Failed',
        message: err.message || 'Failed to create profile'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      displayName: '',
      bio: '',
      avatar: '',
      twitter: '',
      discord: ''
    });
    setStep('form');
    setTransactionProgress({
      phase: 'idle',
      progress: 0,
      message: '',
      txHash: null,
      timeEstimate: null,
      startTime: null
    });
    setValidationState({
      username: { valid: false, checking: false, message: '' },
      displayName: { valid: false, message: '' }
    });
  };

  const handleRetry = () => {
    setStep('form');
    setTransactionProgress({
      phase: 'idle',
      progress: 0,
      message: '',
      txHash: null,
      timeEstimate: null,
      startTime: null
    });
  };

  const getElapsedTime = () => {
    if (!transactionProgress.startTime) return '';
    const elapsed = Date.now() - transactionProgress.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Success state
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-green-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Profile Created!</h2>
          <p className="text-white/70 mb-4">
            Your {useMockData ? 'mock' : 'Aztec'} profile has been successfully created 
            {useMockData ? ' in development mode' : ' on the blockchain'}.
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={formData.avatar} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full object-cover" 
              />
              <div className="text-left">
                <p className="text-white font-medium">{formData.displayName}</p>
                <p className="text-purple-400 text-sm">@{formData.username}</p>
              </div>
            </div>
          </div>
          
          {transactionProgress.txHash && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-white/60 mb-1">Transaction Hash:</p>
              <p className="text-xs text-white/80 font-mono break-all">
                {transactionProgress.txHash}
              </p>
            </div>
          )}
          
          <div className="text-sm text-white/50">
            Closing automatically in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaExclamationTriangle className="text-red-400 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Creation Failed</h2>
          <p className="text-white/70 mb-6">
            {transactionProgress.message}
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition"
            >
              Try Again
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Creating state
  if (step === 'creating') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md p-8 text-center animate-fade-in">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
            Creating Profile...
          </h2>
          
          <div className="mb-6">
            <div className="text-white/70 mb-3 flex items-center justify-center gap-2">
              {transactionProgress.phase === 'preparing' && <FaClock className="text-blue-400" />}
              {transactionProgress.phase === 'proving' && <FaRocket className="text-yellow-400" />}
              {transactionProgress.phase === 'mining' && <FaCheck className="text-green-400" />}
              <span>{transactionProgress.message}</span>
            </div>
            
            {/* Progress bar */}
            {transactionProgress.progress > 0 && (
              <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    transactionProgress.phase === 'preparing' ? 'bg-blue-500' :
                    transactionProgress.phase === 'proving' ? 'bg-yellow-500' :
                    transactionProgress.phase === 'mining' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(transactionProgress.progress, 100)}%` }}
                />
              </div>
            )}
            
            {/* Phase indicators */}
            <div className="flex justify-between text-xs text-white/50 mb-4">
              <span className={transactionProgress.phase === 'preparing' ? 'text-blue-400' : ''}>
                Prepare
              </span>
              <span className={transactionProgress.phase === 'proving' ? 'text-yellow-400' : ''}>
                {useMockData ? 'Mock' : 'Prove'}
              </span>
              <span className={transactionProgress.phase === 'mining' ? 'text-green-400' : ''}>
                {useMockData ? 'Simulate' : 'Confirm'}
              </span>
            </div>
            
            {/* Time information */}
            <div className="flex justify-between text-xs text-white/60">
              <span>Elapsed: {getElapsedTime()}</span>
              {transactionProgress.timeEstimate && (
                <span>ETA: {transactionProgress.timeEstimate}</span>
              )}
            </div>
          </div>
          
          {/* Transaction hash */}
          {transactionProgress.txHash && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-white/60 mb-1">Transaction Hash:</p>
              <p className="text-xs text-white/80 font-mono break-all">
                {transactionProgress.txHash}
              </p>
            </div>
          )}
          
          {/* Mode indicator */}
          {useMockData && (
            <div className="bg-orange-600/20 border border-orange-600/40 rounded-md p-3 mb-4">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-400" size={14} />
                <span className="text-orange-400 text-sm">Development Mode</span>
              </div>
              <p className="text-orange-300/80 text-xs mt-1">
                This is a mock transaction for testing purposes.
              </p>
            </div>
          )}
          
          <p className="text-white/60 text-sm">
            {useMockData 
              ? 'Simulating profile creation...' 
              : 'Please wait while your profile is created on Aztec Network...'
            }
          </p>
          
          {!useMockData && transactionProgress.phase === 'proving' && (
            <p className="text-white/50 text-xs mt-2">
              ⚡ Zero-knowledge proof generation can take 2-5 minutes
            </p>
          )}
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Profile</h2>
            <p className="text-sm text-white/60 mt-1">
              Build your {useMockData ? 'mock' : 'Aztec'} identity
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            disabled={submitting}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Mode indicator */}
        {useMockData && (
          <div className="bg-orange-600/20 border-b border-orange-600/40 px-6 py-3">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-orange-400" size={14} />
              <span className="text-orange-400 text-sm font-medium">Development Mode</span>
            </div>
            <p className="text-orange-300/80 text-xs mt-1">
              Profile will be stored locally for testing. Switch to real mode in wallet settings.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/40 rounded-md mx-6 mt-4 p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-900/30 ring-2 ring-purple-500/20">
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={handleRandomAvatar} 
                className="absolute bottom-0 right-0 bg-purple-600 p-2 rounded-full text-xs text-white font-medium hover:bg-purple-700 transition" 
                disabled={submitting}
                title="Random avatar"
              >
                <FaRandom size={12} />
              </button>
            </div>
            <p className="text-white/50 text-xs mt-2">Click the icon to change avatar</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Username *</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              disabled={submitting}
              className={`w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition ${
                validationState.username.checking
                  ? 'focus:ring-yellow-500'
                  : validationState.username.valid
                  ? 'focus:ring-green-500'
                  : formData.username && !validationState.username.valid
                  ? 'focus:ring-red-500'
                  : 'focus:ring-purple-500'
              }`}
            />
            {formData.username && (
              <p className={`text-xs mt-2 flex items-center gap-2 ${
                validationState.username.checking
                  ? 'text-yellow-400'
                  : validationState.username.valid
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {validationState.username.checking && (
                  <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                )}
                {validationState.username.valid && <FaCheck size={12} />}
                {!validationState.username.valid && !validationState.username.checking && (
                  <FaExclamationTriangle size={12} />
                )}
                {validationState.username.message}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Display Name *</label>
            <input
              type="text"
              name="displayName"
              placeholder="Your display name"
              value={formData.displayName}
              onChange={handleChange}
              disabled={submitting}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {formData.displayName && validationState.displayName.message && (
              <p className="text-red-400 text-xs mt-2 flex items-center gap-2">
                <FaExclamationTriangle size={12} />
                {validationState.displayName.message}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Bio</label>
            <textarea
              name="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={handleChange}
              disabled={submitting}
              rows={3}
              maxLength={200}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
            <p className="text-white/40 text-xs mt-1">{formData.bio.length}/200 characters</p>
          </div>

          {/* Social Media */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Social Media (Optional)</h3>
            
            <div>
              <label className="block text-sm text-white/70 mb-2 flex items-center gap-2">
                <FaTwitter className="text-blue-400" /> Twitter Handle
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">@</span>
                <input
                  type="text"
                  name="twitter"
                  placeholder="username"
                  value={formData.twitter}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-2 flex items-center gap-2">
                <FaDiscord className="text-indigo-400" /> Discord Username
              </label>
              <input
                type="text"
                name="discord"
                placeholder="username#1234"
                value={formData.discord}
                onChange={handleChange}
                disabled={submitting}
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 space-y-3">
          <button
            className={`w-full py-3 rounded-full text-white text-center font-semibold text-lg transition ${
              isFormValid() && !submitting
                ? 'bg-purple-600 hover:bg-purple-700' 
                : 'bg-purple-600/50 cursor-not-allowed'
            }`}
            disabled={!isFormValid() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Profile...
              </span>
            ) : (
              `Create ${useMockData ? 'Mock' : 'Aztec'} Profile`
            )}
          </button>
          
          <button
            className="w-full py-2 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 text-sm transition"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          
          {/* Form validation summary */}
          {!isFormValid() && (
            <div className="text-center">
              <p className="text-white/50 text-xs">
                {!isConnected ? 'Please connect your wallet first' :
                 !validationState.username.valid ? 'Please enter a valid username' :
                 !validationState.displayName.valid ? 'Please enter a valid display name' :
                 'Complete the form to continue'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProfileModal;
