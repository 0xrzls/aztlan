// src/pages/ProfilePage.js - CLEAN VERSION
import React, { useEffect, useState } from 'react';
import { FaTwitter, FaDiscord, FaTelegram, FaGithub, FaEdit, FaShare } from 'react-icons/fa';
import { SiFarcaster } from 'react-icons/si';
import { MdEmail } from 'react-icons/md';
import useWalletStore from '../store/walletStore';
import CreateProfileModal from '../components/CreateProfileModal';

const ProfilePage = () => {
  const walletStore = useWalletStore(); // Get entire store
  
  // Destructure state safely
  const isConnected = walletStore.isConnected;
  const address = walletStore.address;
  const points = walletStore.points;
  const level = walletStore.level;
  const profile = walletStore.profile;
  const socialVerifications = walletStore.socialVerifications;
  const hasProfile = walletStore.hasProfile; // ✅ This is BOOLEAN
  const getVerificationCount = walletStore.getVerificationCount;
  const loadUserProfile = walletStore.loadUserProfile;
  
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localProfileData, setLocalProfileData] = useState(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (isConnected && address) {
        setLoading(true);
        try {
          await loadUserProfile();
          
          // Load local profile data if available
          const stored = localStorage.getItem(`aztlan_profile_${address}`);
          if (stored) {
            setLocalProfileData(JSON.parse(stored));
          }
        } catch (error) {
          console.error('Failed to load profile data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProfileData();
  }, [isConnected, address, loadUserProfile]);

  if (!isConnected) {
    return (
      <div className="pt-[60px] md:pt-[72px] px-4 py-10 min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-md mx-auto bg-[#121212] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-white/70 mb-6">Please connect your Aztec wallet to view your profile</p>
          <button 
            onClick={() => document.querySelector('button:has(.fa-wallet)')?.click()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-full text-sm font-medium transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="pt-[60px] md:pt-[72px] px-4 py-10 min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/70">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIXED: Use hasProfile as boolean
  if (!hasProfile) {
    return (
      <div className="pt-[60px] md:pt-[72px] px-4 py-10 min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-md mx-auto">
          <div className="bg-[#121212] rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaEdit className="text-purple-400 text-2xl" />
            </div>
            <h2 className="text-xl font-bold mb-4">No Profile Found</h2>
            <p className="text-white/70 mb-6">
              You haven't created your Aztec profile yet. Create one to get started!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-full font-medium transition-colors mb-4"
            >
              Create Profile
            </button>
          </div>
        </div>

        <CreateProfileModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onComplete={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Rest of profile page content for when profile exists
  const getProfileAvatar = () => {
    return profile?.tokenURI || localProfileData?.avatar || "/uid/01UID.png";
  };

  const getProfileName = () => {
    return localProfileData?.displayName || localProfileData?.username || `Profile #${profile?.profileId}`;
  };

  return (
    <div className="pt-[60px] md:pt-[72px] px-4 py-6 min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="h-40 md:h-52 bg-gradient-to-r from-purple-900/60 to-purple-500/60 rounded-xl relative mb-16">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-[#0A0A0A] overflow-hidden">
              <img 
                src={getProfileAvatar()} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">{getProfileName()}</h1>
          <p className="text-purple-400 text-lg">@{localProfileData?.username || 'user'}</p>
          <p className="text-white/70 text-sm mt-1">{address?.slice(0, 16)}...{address?.slice(-8)}</p>
          
          {localProfileData?.bio && (
            <p className="text-white/80 mt-3 max-w-lg">{localProfileData.bio}</p>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Points</p>
            <p className="text-2xl font-semibold text-purple-400">{points}</p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Level</p>
            <p className="text-2xl font-semibold text-blue-400">{level}</p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Verifications</p>
            <p className="text-2xl font-semibold text-green-400">{getVerificationCount()}/6</p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Quests</p>
            <p className="text-2xl font-semibold text-orange-400">3/∞</p>
          </div>
        </div>

        {/* Profile exists content */}
        <div className="text-center py-8">
          <p className="text-white/70">✅ Profile loaded successfully!</p>
          <p className="text-sm text-white/50 mt-2">Profile ID: {profile?.profileId}</p>
          
          {localProfileData && (
            <div className="mt-4 p-4 bg-[#1f1f1f] rounded-xl">
              <h3 className="text-lg font-semibold mb-2">Profile Details</h3>
              <div className="text-left space-y-2">
                <p><span className="text-white/70">Username:</span> {localProfileData.username}</p>
                <p><span className="text-white/70">Display Name:</span> {localProfileData.displayName}</p>
                {localProfileData.bio && (
                  <p><span className="text-white/70">Bio:</span> {localProfileData.bio}</p>
                )}
                {localProfileData.twitter && (
                  <p><span className="text-white/70">Twitter:</span> @{localProfileData.twitter}</p>
                )}
                {localProfileData.discord && (
                  <p><span className="text-white/70">Discord:</span> {localProfileData.discord}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
