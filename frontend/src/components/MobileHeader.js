// src/components/MobileHeader.js - UPDATED VERSION (COMPLETE)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaWallet, FaUser } from 'react-icons/fa';
import { LuSunMoon } from 'react-icons/lu';
import { IoSunnyOutline } from 'react-icons/io5';
import useWalletStore from '../store/walletStore'; // NEW ZUSTAND STORE
import { useUser } from '../context/UserContext';
import WalletConnectModal from './WalletConnectModal';
import CreateProfileModal from './CreateProfileModal';

const networks = ['Testnet', 'Sandbox', 'Devnet'];

const MobileHeader = () => {
  // Use useState instead of useTheme for demo if not available
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';
  
  const [network, setNetwork] = useState('Testnet');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  
  // ❌ OLD: const { wallet, disconnectWallet, checkRegistration } = useWallet();
  // ✅ NEW: Zustand store
  const { 
    isConnected, 
    address, 
    points,
    disconnectWallet, 
    checkRegistration 
  } = useWalletStore();
  
  const { user } = useUser();

  // Check if user is registered when wallet connects
  useEffect(() => {
    const verifyRegistration = async () => {
      if (isConnected && address) {
        try {
          const isRegistered = await checkRegistration(address);
          
          // If not registered, show profile creation modal
          if (!isRegistered && !profileModalOpen) {
            setProfileModalOpen(true);
          }
        } catch (err) {
          console.error('Registration check failed:', err);
        }
      }
    };
    
    if (isConnected) {
      verifyRegistration();
    }
  }, [isConnected, address, checkRegistration, profileModalOpen]);

  const handleDisconnect = () => {
    disconnectWallet();
    setShowProfileDropdown(false);
  };

  const handleProfileCreated = () => {
    // Refresh user data or perform actions after profile creation
    console.log('Profile created successfully');
  };

  // Toggle theme function (simplified)
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-lg md:hidden">
        <Link to="/" className="relative w-8 h-8">
          <img
            src={isDark ? '/mobilelogo/mobiledark.svg' : '/mobilelogo/mobilelight.svg'}
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </Link>

        <div className="flex items-center gap-3 relative">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-white/20 text-white"
          >
            {isDark ? <IoSunnyOutline size={18} /> : <LuSunMoon size={18} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-white/20 text-white text-sm"
            >
              <img src="/logos/lineaswap.png" alt="Network" width={16} height={16} className="w-4 h-4 object-contain" />
              {network}
              <FaChevronDown size={10} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 bg-black border border-white/10 rounded-md text-sm z-50">
                {networks.map((net) => (
                  <div
                    key={net}
                    onClick={() => {
                      setNetwork(net);
                      setShowDropdown(false);
                    }}
                    className="px-3 py-2 text-white hover:bg-white/10 cursor-pointer"
                  >
                    {net}
                  </div>
                ))}
              </div>
            )}
          </div>

          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-2 rounded-md border border-white/20 text-white"
              >
                {user.isRegistered ? (
                  <img src={user.avatar || "/uid/01UID.png"} alt="Profile" className="w-5 h-5 rounded-full" />
                ) : (
                  <FaUser size={16} />
                )}
                <span className="text-xs">
                  {address?.slice(0, 4)}...{address?.slice(-4)}
                </span>
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-1 bg-black border border-white/10 rounded-md text-sm z-50 min-w-[150px]">
                  <Link 
                    to="/profile"
                    className="block px-3 py-2 text-white hover:bg-white/10 border-b border-white/10"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    My Profile
                  </Link>
                  <div className="px-3 py-2 text-white/70">
                    <div className="text-xs">Points:</div>
                    <div className="font-semibold">{points}</div>
                  </div>
                  <button
                    className="w-full text-left px-3 py-2 text-white hover:bg-white/10 border-t border-white/10"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setWalletModalOpen(true)}
              className="p-2 rounded-md border border-white/20 text-white"
            >
              <FaWallet size={18} />
            </button>
          )}
        </div>
      </header>

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
