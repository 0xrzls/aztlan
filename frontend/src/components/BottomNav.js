import React, { useState } from 'react';
import { CgHome, CgSearch, CgProfile } from 'react-icons/cg';
import { FaCompass } from 'react-icons/fa';

function BottomNav() {
  const [activeTab, setActiveTab] = useState('home');
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 py-2 px-4 z-40">
      <div className="flex justify-around">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center p-2 ${
            activeTab === 'home' ? 'text-white' : 'text-white/70'
          }`}
        >
          <CgHome size={24} />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center justify-center p-2 ${
            activeTab === 'explore' ? 'text-white' : 'text-white/70'
          }`}
        >
          <FaCompass size={22} />
          <span className="text-xs mt-1">Explore</span>
        </button>
        <button 
          onClick={() => setActiveTab('search')}
          className={`flex flex-col items-center justify-center p-2 ${
            activeTab === 'search' ? 'text-white' : 'text-white/70'
          }`}
        >
          <CgSearch size={24} />
          <span className="text-xs mt-1">Search</span>
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center p-2 ${
            activeTab === 'profile' ? 'text-white' : 'text-white/70'
          }`}
        >
          <CgProfile size={22} />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
}

export default BottomNav;
