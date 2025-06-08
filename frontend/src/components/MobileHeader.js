// src/components/MobileHeader.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaWallet, FaUser, FaPlus } from 'react-icons/fa';
import { LuSunMoon } from 'react-icons/lu';
import { IoSunnyOutline } from 'react-icons/io5';
import useWalletStore from '../store/walletStore';
import { useUser } from '../context/UserContext';
import WalletConnectModal from './WalletConnectModal';
import CreateProfileModal from './CreateProfileModal';

const networks = ['Aztec Testnet', 'Local Sandbox', 'Devnet'];

const MobileHeader = () => {
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';
  
  const [network, setNetwork] = useState('Aztec Testnet');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // ✅ FIXED: Use hasProfile as boolean, not function
  const { 
    isConnected, 
    address, 
    points,
    level,
    profile,
    hasProfile, // ✅ This is boolean now
    disconnectWallet,
    getVerificationCount
  } = useWalletStore();
  
  const { user } = useUser();

  // Auto-show profile creation modal for users without profiles
  useEffect(() => {
    // ✅ FIXED: Use hasProfile as boolean, not function call
    if (isConnected && address && !hasProfile && !profileModalOpen) {
      const timer = setTimeout(() => {
        setProfileModalOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, hasProfile, profileModalOpen]); // ✅ Fixed dependency

  const handleDisconnect = () => {
    disconnectWallet();
    setShowProfileDropdown(false);
  };

  const handleProfileCreated = (profileData) => {
    console.log('Profile created successfully:', profileData);
    setProfileModalOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Get user avatar
  const getUserAvatar = () => {
    if (profile?.tokenURI) {
      return profile.tokenURI;
    }
    return user.avatar || "/uid/01UID.png";
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.profileId) {
      return `#${profile.profileId}`;
    }
    return address?.slice(0, 4) + '...' + address?.slice(-4);
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-lg md:hidden">
        <Link to="/" className="relative w-8 h-8">
          <img
            src={isDark ? '/mobilelogo/mobiledark.svg' : '/mobilelogo/mobilelight.svg'}
            alt="Aztlan Quest"
            className="w-full h-full object-contain"
          />
        </Link>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition"
          >
            {isDark ? <IoSunnyOutline size={18} /> : <LuSunMoon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-white/20 text-white text-sm hover:bg-white/10 transition"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              {network === 'Aztec Testnet' ? 'Testnet' : network}
              <FaChevronDown size={10} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 bg-black/90 border border-white/10 rounded-md text-sm z-50 backdrop-blur-lg min-w-32">
                {networks.map((net) => (
                  <div
                    key={net}
                    onClick={() => {
                      setNetwork(net);
                      setShowDropdown(false);
                    }}
                    className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${net === 'Aztec Testnet' ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                      {net}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition"
              >
                <img 
                  src={getUserAvatar()} 
                  alt="Profile" 
                  className="w-5 h-5 rounded-full object-cover" 
                />
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium leading-none">
                    {getDisplayName()}
                  </span>
                  {/* ✅ FIXED: Use hasProfile as boolean */}
                  {hasProfile && (
                    <span className="text-xs text-purple-400 leading-none mt-0.5">
                      {getVerificationCount()}/6
                    </span>
                  )}
                </div>
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-1 bg-black/90 border border-white/10 rounded-md text-sm z-50 min-w-[200px] backdrop-blur-lg">
                  <div className="p-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getUserAvatar()} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{getDisplayName()}</p>
                        <p className="text-white/60 text-xs">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
                        {/* ✅ FIXED: Use hasProfile as boolean */}
                        {hasProfile && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-xs">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to="/profile"
                    className="block px-3 py-2 text-white hover:bg-white/10 transition border-b border-white/10"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <div className="flex items-center gap-2">
                      <FaUser size={12} />
                      <span>My Profile</span>
                    </div>
                  </Link>
                  
                  <div className="p-3 border-b border-white/10">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-white/70 text-xs">Points</p>
                        <p className="text-white font-semibold text-sm">{points}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">Level</p>
                        <p className="text-white font-semibold text-sm">{level}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* ✅ FIXED: Use hasProfile as boolean */}
                  {!hasProfile && (
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-purple-400 hover:bg-purple-500/20 transition border-b border-white/10 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FaPlus size={12} />
                        <span>Create Profile</span>
                      </div>
                    </button>
                  )}
                  
                  <button
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 transition"
                    onClick={handleDisconnect}
                  >
                    <span className="text-sm">Disconnect</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setWalletModalOpen(true)}
              className="p-2 rounded-md border border-white/20 text-white hover:bg-white/10 transition"
            >
              <FaWallet size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Network Status Indicator - Mobile */}
      {isConnected && (
        <div className="fixed top-16 right-4 z-40 md:hidden">
          <div className="bg-black/60 backdrop-blur-lg border border-green-500/30 rounded-lg px-2 py-1">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">Connected</span>
            </div>
          </div>
        </div>
      )}

      <WalletConnectModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <CreateProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onComplete={handleProfileCreated}
      />
    </>
  );
};

export default MobileHeader;
