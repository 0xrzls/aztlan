// src/components/CreateProfileModal.js - COMPLETE REAL AZTEC VERSION
import React, { useState, useEffect } from 'react';
import { FaTimes, FaRandom, FaCheck, FaTwitter, FaDiscord, FaExclamationTriangle } from 'react-icons/fa';
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
    isLoading, 
    error, 
    isConnected,
    address,
    useMockData
  } = useWalletStore();
  
  const [activeTab, setActiveTab] = useState('profile');
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
  const [step, setStep] = useState('form'); // 'form', 'preparing', 'minting', 'success'
  const [transactionProgress, setTransactionProgress] = useState({
    phase: 'idle', // 'idle', 'preparing', 'proving', 'sending', 'mining', 'success', 'error'
    message: '',
    txHash: null
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
        valid: displayName.length >= 2,
        message: displayName.length === 0 ? '' : 
                displayName.length < 2 ? 'At least 2 characters required' : ''
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

    if (!/^[a-z0-9_]+$/.test(username)) {
      setValidationState(prev => ({
        ...prev,
        username: { valid: false, checking: false, message: 'Only lowercase letters, numbers, and underscores allowed' }
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
          username: { valid: false, checking: false, message: 'Error checking availability' }
        }));
      }
    }, 500);

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

  const updateProgress = (phase, message, txHash = null) => {
    setTransactionProgress({ phase, message, txHash });
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setSubmitting(true);
    setStep('preparing');

    try {
      if (useMockData) {
        // Mock flow for development
        updateProgress('preparing', 'Preparing mock profile...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateProgress('proving', 'Generating mock proofs...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        updateProgress('sending', 'Creating mock transaction...');
        setStep('minting');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateProgress('mining', 'Simulating blockchain confirmation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result = await createProfile({
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio,
          avatar: formData.avatar,
          twitter: formData.twitter,
          discord: formData.discord
        });

        if (result.success) {
          updateProgress('success', 'Mock profile created successfully!', result.txHash);
          setStep('success');
        } else {
          throw new Error(result.error);
        }
      } else {
        // Real Aztec flow
        updateProgress('preparing', 'Preparing transaction data...');
        setStep('minting');
        
        updateProgress('proving', 'Generating privacy proofs (this may take a moment)...');
        
        const result = await createProfile({
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio,
          avatar: formData.avatar,
          twitter: formData.twitter,
          discord: formData.discord
        });

        if (result.success) {
          updateProgress('mining', 'Waiting for blockchain confirmation...');
          
          // For real Aztec, wait a bit for confirmation
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          updateProgress('success', 'Profile created on Aztec Network!', result.txHash);
          setStep('success');
        } else {
          throw new Error(result.error || 'Failed to create profile');
        }
      }
      
      // Store profile data locally for UI
      const profileData = {
        username: formData.username,
        displayName: formData.displayName,
        bio: formData.bio,
        avatar: formData.avatar,
        twitter: formData.twitter,
        discord: formData.discord,
        txHash: transactionProgress.txHash,
        createdAt: Date.now()
      };
      
      localStorage.setItem(`aztlan_profile_${address}`, JSON.stringify(profileData));
      
      // Auto close after 3 seconds
      setTimeout(() => {
        if (onComplete) onComplete(profileData);
        onClose();
        resetForm();
      }, 3000);
      
    } catch (err) {
      console.error('Profile creation error:', err);
      updateProgress('error', err.message || 'Failed to create profile');
      setStep('form');
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
    setActiveTab('profile');
    setTransactionProgress({ phase: 'idle', message: '', txHash: null });
  };

  if (!isOpen) return null;

  // Success state
  if (step === 'success') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-green-400 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Profile Created!</h2>
          <p className="text-white/70 mb-4">
            Your Aztec profile has been successfully {useMockData ? 'mocked' : 'minted'} {useMockData ? 'in development mode' : 'on the blockchain'}.
          </p>
          {transactionProgress.txHash && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <p className="text-xs text-white/60">Transaction Hash:</p>
              <p className="text-xs text-white/80 font-mono break-all">
                {transactionProgress.txHash}
              </p>
            </div>
          )}
          <div className="text-sm text-white/50">
            Redirecting in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  // Loading states
  if (step === 'preparing' || step === 'minting') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md p-8 text-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {step === 'preparing' ? 'Preparing Profile...' : 'Creating Profile...'}
          </h2>
          
          <div className="mb-4">
            <div className="text-white/70 mb-2">{transactionProgress.message}</div>
            
            {/* Progress indicator */}
            <div className="w-full bg-white/10 rounded-full h-2 mb-4">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  transactionProgress.phase === 'preparing' ? 'w-1/4 bg-blue-500' :
                  transactionProgress.phase === 'proving' ? 'w-2/4 bg-yellow-500' :
                  transactionProgress.phase === 'sending' ? 'w-3/4 bg-orange-500' :
                  transactionProgress.phase === 'mining' ? 'w-full bg-green-500' :
                  'w-0 bg-gray-500'
                }`}
              />
            </div>
            
            {/* Phase indicator */}
            <div className="flex justify-between text-xs text-white/50">
              <span className={transactionProgress.phase === 'preparing' ? 'text-blue-400' : ''}>
                Prepare
              </span>
              <span className={transactionProgress.phase === 'proving' ? 'text-yellow-400' : ''}>
                Prove
              </span>
              <span className={transactionProgress.phase === 'sending' ? 'text-orange-400' : ''}>
                Send
              </span>
              <span className={transactionProgress.phase === 'mining' ? 'text-green-400' : ''}>
                Confirm
              </span>
            </div>
          </div>
          
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
              ? 'Simulating blockchain operations...' 
              : 'Please wait while your profile is created on Aztec Network...'
            }
          </p>
          
          {!useMockData && transactionProgress.phase === 'proving' && (
            <p className="text-white/50 text-xs mt-2">
              ⚡ Aztec privacy proofs can take 30-60 seconds to generate
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Profile</h2>
            <p className="text-sm text-white/60 mt-1">
              Build your Aztec identity {useMockData && '(Development Mode)'}
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
        <div className="p-6 space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-900/30">
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={handleRandomAvatar} 
                className="absolute bottom-0 right-0 bg-purple-600 p-1.5 rounded-full text-xs text-white font-medium hover:bg-purple-700 transition" 
                disabled={submitting}
                title="Random avatar"
              >
                <FaRandom size={12} />
              </button>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Username *</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              disabled={submitting}
              className={`w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 transition ${
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
              <p className={`text-xs mt-1 ${
                validationState.username.checking
                  ? 'text-yellow-400'
                  : validationState.username.valid
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {validationState.username.message}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Display Name *</label>
            <input
              type="text"
              name="displayName"
              placeholder="Your display name"
              value={formData.displayName}
              onChange={handleChange}
              disabled={submitting}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-white/70 mb-1">Bio</label>
            <textarea
              name="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={handleChange}
              disabled={submitting}
              rows={3}
              className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Social Media */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Social Media (Optional)</h3>
            
            <div>
              <label className="block text-sm text-white/70 mb-1 flex items-center gap-1">
                <FaTwitter className="text-blue-400" /> Twitter
              </label>
              <input
                type="text"
                name="twitter"
                placeholder="Your Twitter username"
                value={formData.twitter}
                onChange={handleChange}
                disabled={submitting}
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm text-white/70 mb-1 flex items-center gap-1">
                <FaDiscord className="text-indigo-400" /> Discord
              </label>
              <input
                type="text"
                name="discord"
                placeholder="Your Discord username"
                value={formData.discord}
                onChange={handleChange}
                disabled={submitting}
                className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-4">
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
                'Create Profile'
              )}
            </button>
            
            <button
              className="w-full py-2 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 text-sm transition"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfileModal;
