// src/pages/ProfilePage.js - UPDATED FOR REAL AZTEC
import React, { useEffect, useState } from 'react';
import { FaTwitter, FaDiscord, FaTelegram, FaGithub, FaEdit, FaShare } from 'react-icons/fa';
import { SiFarcaster } from 'react-icons/si';
import { MdEmail } from 'react-icons/md';
import useWalletStore from '../store/walletStore';
import { useUser } from '../context/UserContext';
import CreateProfileModal from '../components/CreateProfileModal';

const ProfilePage = () => {
  const { 
    isConnected, 
    address, 
    points, 
    level,
    profile,
    socialVerifications,
    hasProfile,
    getVerificationCount,
    loadUserProfile
  } = useWalletStore();
  
  const { user } = useUser();
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

  // No profile state
  if (!hasProfile()) {
    return (
      <div className="pt-[60px] md:pt-[72px] px-4 py-10 min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-md mx-auto">
          <div className="bg-[#121212] rounded-xl p-8 text-center">
            <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaEdit className="text-purple-400 text-2xl" />
            </div>
            <h2 className="text-xl font-bold mb-4">No Profile Found</h2>
            <p className="text-white/70 mb-6">
              You haven't created your Aztec profile yet. Create one to get started with quests and verifications!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-full font-medium transition-colors mb-4"
            >
              Create Profile
            </button>
            <p className="text-xs text-white/50">
              Profile will be minted as a soulbound NFT on Aztec Network
            </p>
          </div>
        </div>

        <CreateProfileModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onComplete={() => {
            setShowCreateModal(false);
            window.location.reload(); // Reload to show new profile
          }}
        />
      </div>
    );
  }

  // Get profile display data
  const getProfileAvatar = () => {
    return profile?.tokenURI || localProfileData?.avatar || "/uid/01UID.png";
  };

  const getProfileName = () => {
    return localProfileData?.displayName || localProfileData?.username || `Profile #${profile?.profileId}`;
  };

  const getUsername = () => {
    return localProfileData?.username || `user_${profile?.profileId}`;
  };

  // Social verification platforms
  const socialPlatforms = [
    { 
      name: 'Twitter', 
      icon: FaTwitter, 
      color: 'text-blue-400', 
      bgColor: 'bg-blue-400/20',
      verified: socialVerifications?.twitter || false,
      handle: localProfileData?.twitter
    },
    { 
      name: 'Discord', 
      icon: FaDiscord, 
      color: 'text-indigo-400', 
      bgColor: 'bg-indigo-400/20',
      verified: socialVerifications?.discord || false,
      handle: localProfileData?.discord
    },
    { 
      name: 'Telegram', 
      icon: FaTelegram, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-500/20',
      verified: socialVerifications?.telegram || false,
      handle: null
    },
    { 
      name: 'GitHub', 
      icon: FaGithub, 
      color: 'text-gray-400', 
      bgColor: 'bg-gray-400/20',
      verified: socialVerifications?.github || false,
      handle: null
    },
    { 
      name: 'Farcaster', 
      icon: SiFarcaster, 
      color: 'text-purple-400', 
      bgColor: 'bg-purple-400/20',
      verified: socialVerifications?.farcaster || false,
      handle: null
    },
    { 
      name: 'Email', 
      icon: MdEmail, 
      color: 'text-red-400', 
      bgColor: 'bg-red-400/20',
      verified: socialVerifications?.email || false,
      handle: null
    }
  ];

  // Generate mock activities
  const activities = [
    { 
      type: 'profile', 
      title: 'Profile Created', 
      description: 'Aztec profile minted successfully', 
      date: localProfileData?.createdAt ? new Date(localProfileData.createdAt).toLocaleDateString() : 'Recently',
      icon: '🎉',
      txHash: localProfileData?.txHash
    },
    { 
      type: 'quest', 
      title: 'Welcome Bonus', 
      description: 'Earned for creating profile', 
      date: '1d ago', 
      icon: '🏆' 
    },
    { 
      type: 'verification', 
      title: 'Social Setup', 
      description: 'Added social media handles', 
      date: '1d ago', 
      icon: '🔗' 
    }
  ];

  return (
    <div className="pt-[60px] md:pt-[72px] px-4 py-6 min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="h-40 md:h-52 bg-gradient-to-r from-purple-900/60 to-purple-500/60 rounded-xl relative mb-16">
          <div className="absolute inset-0">
            <img src="/banner-placeholder.png" alt="Banner" className="w-full h-full object-cover opacity-60 rounded-xl" />
          </div>
          
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-[#0A0A0A] overflow-hidden">
              <img 
                src={getProfileAvatar()} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          
          <div className="absolute bottom-3 right-3 flex gap-2">
            <div className="bg-black/40 px-3 py-1.5 rounded-lg text-sm backdrop-blur-lg">
              <span className="text-white/80">Level: {level}</span>
            </div>
            <button className="bg-black/40 p-2 rounded-lg backdrop-blur-lg hover:bg-black/60 transition">
              <FaShare className="text-white/80" size={14} />
            </button>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{getProfileName()}</h1>
              <p className="text-purple-400 text-lg">@{getUsername()}</p>
              <p className="text-white/70 text-sm mt-1">{address?.slice(0, 16)}...{address?.slice(-8)}</p>
              
              {localProfileData?.bio && (
                <p className="text-white/80 mt-3 max-w-lg">{localProfileData.bio}</p>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-white/60">Profile ID</div>
              <div className="text-xl font-bold text-purple-400">#{profile?.profileId}</div>
            </div>
          </div>
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
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Social Verifications */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Social Verifications</h2>
            
            <div className="space-y-3">
              {socialPlatforms.map((platform) => {
                const IconComponent = platform.icon;
                return (
                  <div key={platform.name} className="bg-[#1f1f1f] rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${platform.bgColor} rounded-lg flex items-center justify-center`}>
                          <IconComponent className={`${platform.color} text-lg`} />
                        </div>
                        <div>
                          <h3 className="font-medium">{platform.name}</h3>
                          {platform.handle ? (
                            <p className="text-sm text-white/60">@{platform.handle}</p>
                          ) : (
                            <p className="text-sm text-white/40">Not connected</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {platform.verified ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            ✓ Verified
                          </span>
                        ) : platform.handle ? (
                          <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-full text-sm font-medium transition">
                            Verify
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
                            Not Added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Activity Feed */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            
            <div className="space-y-3">
              {activities.map((activity, idx) => (
                <div key={idx} className="bg-[#1f1f1f] p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-white/70 mt-1">{activity.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-white/50">{activity.date}</p>
                        {activity.txHash && (
                          <a 
                            href={`https://explorer.aztec.network/tx/${activity.txHash}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-purple-400 hover:text-purple-300"
                          >
                            View Tx
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
