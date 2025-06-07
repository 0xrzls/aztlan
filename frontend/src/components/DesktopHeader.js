// src/components/DesktopHeader.js - UPDATED FOR REAL AZTEC - COMPLETE
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaWallet, FaUser, FaPlus } from 'react-icons/fa';
import { LuSunMoon } from 'react-icons/lu';
import { IoSunnyOutline } from 'react-icons/io5';
import useWalletStore from '../store/walletStore';
import { useUser } from '../context/UserContext';
import WalletConnectModal from './WalletConnectModal';
import CreateProfileModal from './CreateProfileModal';

const DesktopHeader = () => {
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';
  
  const [network, setNetwork] = useState('Testnet');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Updated: Use new Zustand store
  const { 
    isConnected, 
    address, 
    points, 
    level,
    profile,
    socialVerifications,
    disconnectWallet,
    hasProfile,
    getVerificationCount
  } = useWalletStore();
  
  const { user } = useUser();

  // Auto-show profile creation modal for users without profiles
  useEffect(() => {
    if (isConnected && address && !hasProfile() && !profileModalOpen) {
      // Small delay to let wallet connection settle
      const timer = setTimeout(() => {
        setProfileModalOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, hasProfile, profileModalOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowProfileDropdown(false);
  };

  const handleProfileCreated = (profileData) => {
    console.log('Profile created successfully:', profileData);
    setProfileModalOpen(false);
  };

  const logoSrc = isDark
    ? '/desktoplogo/desktopdark.svg'
    : '/desktoplogo/desktoplight.svg';

  // Get user avatar - check profile first, then fallback
  const getUserAvatar = () => {
    if (profile?.tokenURI) {
      return profile.tokenURI;
    }
    return user.avatar || "/uid/01UID.png";
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.profileId) {
      return `Profile #${profile.profileId}`;
    }
    return address?.slice(0, 6) + '...' + address?.slice(-4);
  };

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-lg fixed top-0 left-0 w-full z-50">
        {/* Logo */}
        <Link to="/" className="relative w-36 h-8">
          <img src={logoSrc} alt="Aztlan Quest" className="h-full object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-white text-sm">
          <Link to="/" className="hover:text-purple-400 transition">Home</Link>
          <Link to="/quests" className="hover:text-purple-400 transition">Quests</Link>
          <Link to="/collections" className="hover:text-purple-400 transition">Collections</Link>
          <Link to="/earn" className="hover:text-purple-400 transition">Earn</Link>
          <div className="relative group">
            <button className="hover:text-purple-400 flex items-center gap-1 transition">
              More <FaChevronDown size={10} />
            </button>
            <div className="absolute left-0 mt-2 hidden group-hover:block bg-black/90 border border-white/10 rounded-md shadow-lg z-10 min-w-32 backdrop-blur-lg">
              <a href="https://twitter.com/aztlanquest" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10 transition">Twitter</a>
              <a href="https://t.me/aztlanquest" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10 transition">Telegram</a>
              <a href="https://discord.gg/aztlanquest" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10 transition">Discord</a>
              <a href="https://docs.aztec.network" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10 transition">Aztec Docs</a>
            </div>
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="text-white p-2 border border-white/20 rounded-md hover:bg-white/10 transition"
          >
            {isDark ? <IoSunnyOutline size={18} /> : <LuSunMoon size={18} />}
          </button>

          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="bg-transparent border border-white/20 text-white text-sm px-3 py-1 rounded-md focus:outline-none focus:border-purple-500"
          >
            <option value="Testnet" className="bg-black">Aztec Testnet</option>
            <option value="Sandbox" className="bg-black">Local Sandbox</option>
            <option value="Devnet" className="bg-black">Devnet</option>
          </select>

          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 px-4 py-2 bg-white/10 hover:bg-white/20 transition rounded-xl text-white border border-white/20"
              >
                <img 
                  src={getUserAvatar()} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover" 
                />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {getDisplayName()}
                  </span>
                  {hasProfile() && (
                    <span className="text-xs text-purple-400">
                      {getVerificationCount()}/6 verified
                    </span>
                  )}
                </div>
                <FaChevronDown size={12} />
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 bg-black/90 border border-white/10 rounded-md shadow-lg z-10 min-w-60 backdrop-blur-lg">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getUserAvatar()} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover" 
                      />
                      <div>
                        <p className="text-white font-medium text-sm">{getDisplayName()}</p>
                        <p className="text-white/60 text-xs">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
                        {hasProfile() && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-green-400 text-xs">Profile Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to="/profile"
                    className="block px-4 py-3 text-white hover:bg-white/10 transition border-b border-white/10"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <div className="flex items-center gap-2">
                      <FaUser size={14} />
                      <span>My Profile</span>
                    </div>
                  </Link>
                  
                  <div className="p-4 border-b border-white/10">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-white/70 text-xs">Points</p>
                        <p className="text-white font-semibold">{points}</p>
                      </div>
                      <div>
                        <p className="text-white/70 text-xs">Level</p>
                        <p className="text-white font-semibold">{level}</p>
                      </div>
                    </div>
                  </div>
                  
                  {!hasProfile() && (
                    <button
                      onClick={() => {
                        setProfileModalOpen(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-purple-400 hover:bg-purple-500/20 transition border-b border-white/10 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <FaPlus size={14} />
                        <span>Create Profile</span>
                      </div>
                    </button>
                  )}
                  
                  <button
                    className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/20 transition"
                    onClick={handleDisconnect}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setWalletModalOpen(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
            >
              <FaWallet size={14} /> 
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Network Status Indicator */}
      {isConnected && (
        <div className="fixed top-20 right-6 z-40 hidden md:block">
          <div className="bg-black/60 backdrop-blur-lg border border-green-500/30 rounded-lg px-3 py-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-xs font-medium">Aztec Connected</span>
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

export default DesktopHeader;
