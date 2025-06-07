// src/components/CreateProfileModal.js - COMPLETE UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { FaTimes, FaTwitter, FaDiscord, FaRandom } from 'react-icons/fa';
import useWalletStore from '../store/walletStore'; // ✅ NEW: Zustand store
import { mintProfileNFT } from '../lib/mintProfileFlow';

const AVATAR_FILES = [
  '01UID.png', '02UID.png', '03UID.png', '04UID.png',
  '05UID.png', '06UID.png', '07UID.png', '08UID.png',
  '09UID.png', '10UID.png', '11UID.png', '12UID.png',
];

const CreateProfileModal = ({ isOpen, onClose, onComplete }) => {
  // ✅ NEW: Zustand store
  const wallet = useWalletStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: '',
    avatar: '',
    twitter: '',
    discord: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(false);

  // Pick random avatar once
  useEffect(() => {
    if (!formData.avatar) {
      setFormData(prev => ({
        ...prev,
        avatar: pickRandomAvatar()
      }));
    }
  }, [formData.avatar]);

  // Validate username
  useEffect(() => {
    setIsValid(formData.username.trim().length >= 4);
  }, [formData]);

  const pickRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * AVATAR_FILES.length);
    return `/uid/${AVATAR_FILES[randomIndex]}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRandomAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: pickRandomAvatar()
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const result = await mintProfileNFT({
        wallet,
        username: formData.username,
        name: formData.username,
        twitter: formData.twitter,
        discord: formData.discord,
        avatar: formData.avatar
      });

      if (result.success) {
        if (onComplete) onComplete();
        onClose();
      } else {
        setError(result.error || 'Failed to create profile');
      }
    } catch (err) {
      console.error('Profile creation error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-[#121212] rounded-2xl w-[90vw] max-w-md overflow-hidden animate-fade-in">
        {/* Banner & Avatar */}
        <div className="relative h-40 bg-gradient-to-r from-purple-900/60 to-purple-500/60">
          <div className="absolute inset-0">
            <img src="/banner-placeholder.png" alt="Banner" className="w-full h-full object-cover opacity-60" />
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 z-10 bg-black/40 p-2 rounded-full text-white" disabled={loading}>
            <FaTimes size={16} />
          </button>
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-[#121212] overflow-hidden bg-purple-900/30">
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <button onClick={handleRandomAvatar} className="absolute bottom-0 right-0 bg-purple-600 p-1.5 rounded-full text-xs text-white font-medium" disabled={loading}>
                <FaRandom size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 px-6">
          {error && (
            <div className="bg-red-600/20 border border-red-600/40 rounded-md p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-white/10 mb-4">
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'profile' ? 'text-white border-b-2 border-purple-500' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab('profile')}
              disabled={loading}
            >
              Profile
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'social' ? 'text-white border-b-2 border-purple-500' : 'text-white/50 hover:text-white/80'}`}
              onClick={() => setActiveTab('social')}
              disabled={loading}
            >
              Social
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <p className="text-xs text-white/50 mt-1">At least 4 characters</p>
              </div>
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="space-y-4">
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
                  disabled={loading}
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
                  disabled={loading}
                  className="w-full bg-[#1f1f1f] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pb-6 mt-6">
            <button
              className={`w-full py-3 rounded-full text-white text-center font-semibold text-lg ${isValid && !loading ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-600/50 cursor-not-allowed'}`}
              disabled={!isValid || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Minting...
                </span>
              ) : (
                'Mint Now'
              )}
            </button>
            <button
              className="w-full py-2 rounded-full text-white/70 hover:text-white bg-white/10 hover:bg-white/20 text-sm"
              onClick={onClose}
              disabled={loading}
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
