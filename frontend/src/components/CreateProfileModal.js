// src/components/CreateProfileModal.js
import React, { useState, useEffect } from 'react';
import { FaTimes, FaRandom, FaCheck, FaTwitter, FaDiscord } from 'react-icons/fa';
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
    address 
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
  const [step, setStep] = useState('form'); // 'form', 'generating', 'minting', 'success'

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

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    setSubmitting(true);
    setStep('generating');

    try {
      // Step 1: Generate image (mock)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStep('minting');

      // Step 2: Create profile on contract
      const result = await createProfile({
        username: formData.username,
        tokenURI: formData.avatar
      });

      if (result.success) {
        setStep('success');
        
        // Store profile data locally for UI
        const profileData = {
          username: formData.username,
          displayName: formData.displayName,
          bio: formData.bio,
          avatar: formData.avatar,
          twitter: formData.twitter,
          discord: formData.discord,
          txHash: result.txHash,
          createdAt: Date.now()
        };
        
        localStorage.setItem(`aztlan_profile_${address}`, JSON.stringify(profileData));
        
        // Auto close after 3 seconds
        setTimeout(() => {
          if (onComplete) onComplete(profileData);
          onClose();
          resetForm();
        }, 3000);
        
      } else {
        throw new Error(result.error || 'Failed to create profile');
      }
    } catch (err) {
      console.error('Profile creation error:', err);
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
            Your Aztec profile has been successfully minted on the blockchain.
          </p>
          <div className="text-sm text-white/50">
            Redirecting in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  // Loading states
  if (step === 'generating' || step === 'minting') {
    return (
      <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
        <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md p-8 text-center">
          <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">
            {step === 'generating' ? 'Generating NFT...' : 'Minting Profile...'}
          </h2>
          <p className="text-white/70">
            {step === 'generating' 
              ? 'Creating your unique profile image' 
              : 'Creating your profile on Aztec Network'
            }
          </p>
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
            <p className="text-sm text-white/60 mt-1">Build your Aztec identity</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            disabled={submitting}
          >
            <FaTimes size={18} />
          </button>
        </div>

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
