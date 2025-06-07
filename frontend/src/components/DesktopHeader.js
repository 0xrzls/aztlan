// src/components/DesktopHeader.js - UPDATED VERSION
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaWallet, FaUser } from 'react-icons/fa';
import { LuSunMoon } from 'react-icons/lu';
import { IoSunnyOutline } from 'react-icons/io5';
import useWalletStore from '../store/walletStore'; // NEW ZUSTAND STORE
import { useUser } from '../context/UserContext';
import WalletConnectModal from './WalletConnectModal';
import CreateProfileModal from './CreateProfileModal';

const DesktopHeader = () => {
  // Use useState instead of useTheme for demo if not available
  const [theme, setTheme] = useState('dark');
  const isDark = theme === 'dark';
  
  const [network, setNetwork] = useState('Testnet');
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // ❌ OLD: const { wallet, disconnectWallet, checkRegistration } = useWallet();
  // ✅ NEW: Zustand store
  const { 
    isConnected, 
    address, 
    points, 
    level,
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowProfileDropdown(false);
  };

  const handleProfileCreated = () => {
    // Refresh user data or perform actions after profile creation
    console.log('Profile created successfully');
  };

  const logoSrc = isDark
    ? '/desktoplogo/desktopdark.svg'
    : '/desktoplogo/desktoplight.svg';

  return (
    <>
      <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-lg fixed top-0 left-0 w-full z-50">
        {/* Logo */}
        <Link to="/" className="relative w-36 h-8">
          <img src={logoSrc} alt="Logo" className="h-full object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-white text-sm">
          <Link to="/" className="hover:text-purple-400">Home</Link>
          <Link to="/quests" className="hover:text-purple-400">Quests</Link>
          <Link to="/collections" className="hover:text-purple-400">Collections</Link>
          <Link to="/earn" className="hover:text-purple-400">Earn</Link>
          <div className="relative group">
            <button className="hover:text-purple-400 flex items-center gap-1">
              More <FaChevronDown size={10} />
            </button>
            <div className="absolute left-0 mt-2 hidden group-hover:block bg-black border border-white/10 rounded-md shadow-lg z-10 min-w-32">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10">Twitter</a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10">Telegram</a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 hover:bg-white/10">Discord</a>
            </div>
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="text-white p-2 border border-white/20 rounded-md hover:bg-white/10"
          >
            {isDark ? <IoSunnyOutline size={18} /> : <LuSunMoon size={18} />}
          </button>

          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="bg-transparent border border-white/20 text-white text-sm px-3 py-1 rounded-md"
          >
            <option value="Testnet">TestNet</option>
            <option value="Sandbox">Sandbox</option>
            <option value="Devnet">Devnet</option>
          </select>

          {isConnected ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 transition rounded-xl text-white"
              >
                {user.isRegistered ? (
                  <img src={user.avatar || "/uid/01UID.png"} alt="Profile" className="w-5 h-5 rounded-full" />
                ) : (
                  <FaUser size={14} />
                )}
                <span className="text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 bg-black border border-white/10 rounded-md shadow-lg z-10 min-w-40">
                  <Link 
                    to="/profile"
                    className="block px-4 py-2 text-white hover:bg-white/10 border-b border-white/10"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    My Profile
                  </Link>
                  <div className="px-4 py-2 text-white/70">
                    <div className="text-xs">Points:</div>
                    <div className="font-semibold">{points}</div>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 border-t border-white/10"
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
              className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition"
            >
              <FaWallet size={14} /> Connect
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

export default DesktopHeader;
