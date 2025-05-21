import React, { useEffect, useState } from 'react';
import { FaTwitter, FaDiscord } from 'react-icons/fa';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';

const ProfilePage = () => {
  const { wallet } = useWallet();
  const { user, getUserNFTs } = useUser();
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNFTs = async () => {
      if (wallet.isConnected && wallet.address) {
        setLoading(true);
        try {
          const userNfts = await getUserNFTs(wallet.address);
          setNfts(userNfts);
        } catch (error) {
          console.error('Failed to fetch NFTs:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchNFTs();
  }, [wallet.isConnected, wallet.address, getUserNFTs]);

  if (!wallet.isConnected) {
    return (
      <div className="pt-[60px] md:pt-[72px] px-4 py-10 min-h-screen bg-[#0A0A0A] text-white">
        <div className="max-w-md mx-auto bg-[#121212] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-white/70 mb-6">Please connect your wallet to view your profile</p>
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

  // Generate mock activities
  const activities = [
    { type: 'quest', title: 'Daily Login', reward: '10 points', date: '2d ago', icon: '🏆' },
    { type: 'mint', title: 'NFT Minted', reward: 'Pioneer NFT', date: '3d ago', icon: '🖼️' },
    { type: 'reward', title: 'Level Up!', reward: 'Level 2', date: '3d ago', icon: '⭐' }
  ];

  return (
    <div className="pt-[60px] md:pt-[72px] px-4 py-6 min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="h-40 md:h-52 bg-gradient-to-r from-purple-900/60 to-purple-500/60 rounded-xl relative">
          <div className="absolute inset-0">
            <img src="/banner-placeholder.png" alt="Banner" className="w-full h-full object-cover opacity-60 rounded-xl" />
          </div>
          
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-[#0A0A0A] overflow-hidden">
              <img 
                src={user.avatar || "/uid/01UID.png"} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          
          <div className="absolute bottom-3 right-3 bg-black/40 px-3 py-1.5 rounded-lg text-sm">
            <span className="text-white/80">Level: {wallet.level}</span>
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="mt-16 mb-6">
          <h1 className="text-xl font-bold">{user.username || "Unnamed"}</h1>
          <p className="text-white/70 text-sm">{wallet.address?.slice(0, 10)}...{wallet.address?.slice(-8)}</p>
          
          {/* Social Media */}
          <div className="flex items-center gap-3 mt-2">
            {user.twitter && (
              <a 
                href={`https://twitter.com/${user.twitter}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-white/70 hover:text-blue-400 text-sm"
              >
                <FaTwitter />
                {user.twitter}
              </a>
            )}
            
            {user.discord && (
              <a 
                href="#"
                className="flex items-center gap-1 text-white/70 hover:text-indigo-400 text-sm"
              >
                <FaDiscord />
                {user.discord}
              </a>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Points</p>
            <p className="text-2xl font-semibold">{wallet.points}</p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Level</p>
            <p className="text-2xl font-semibold">{wallet.level}</p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">NFTs</p>
            <p className="text-2xl font-semibold">{nfts.length}</p>
          </div>
          <div className="bg-[#1f1f1f] p-4 rounded-xl">
            <p className="text-white/70 text-sm mb-1">Quests</p>
            <p className="text-2xl font-semibold">3/10</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* NFT Collection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">NFT Collection</h2>
            
            {loading ? (
              <div className="flex justify-center p-10">
                <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : nfts.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {nfts.map((nft, idx) => (
                  <div key={idx} className="bg-[#1f1f1f] rounded-xl overflow-hidden">
                    <div className="aspect-square">
                      <img src={nft.image} alt={nft.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium">{nft.name}</h3>
                      <p className="text-xs text-white/50 mt-1">Minted {new Date(nft.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1f1f1f] rounded-xl p-6 text-center">
                <p className="text-white/70 mb-4">No NFTs in your collection yet</p>
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-sm font-medium transition-colors">
                  Mint Your First NFT
                </button>
              </div>
            )}
          </div>
          
          {/* Activity Feed */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            
            <div className="space-y-3">
              {activities.map((activity, idx) => (
                <div key={idx} className="bg-[#1f1f1f] p-3 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
                    <span className="text-lg">{activity.icon}</span>
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-white/70">{activity.reward}</p>
                  </div>
                  <p className="text-xs text-white/50 ml-auto">{activity.date}</p>
                </div>
              ))}
            </div>
            
            {activities.length > 3 && (
              <button className="w-full mt-4 py-2 text-center text-sm text-white/70 hover:text-white">
                View All Activity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
