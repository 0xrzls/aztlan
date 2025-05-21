import React, { useState, useEffect } from 'react';
import { FaUser } from 'react-icons/fa';
import { GiTrophyCup } from 'react-icons/gi';
import { TbMoodSearch } from 'react-icons/tb';
import { GrUserWorker } from 'react-icons/gr';
import { FaUserAstronaut } from 'react-icons/fa';
import { PiBookOpenUserBold, PiUsersThreeBold } from 'react-icons/pi';

import MobileHeader from '../components/MobileHeader';
import DesktopHeader from '../components/DesktopHeader';
import BottomNav from '../components/BottomNav';
import CreateProfileModal from '../components/CreateProfileModal';
import { useUser } from '../context/UserContext';
import { useWallet } from '../context/WalletContext';
import { registerUser } from '../lib/aztec';

const categories = ['All', 'Latest', 'Collections', 'Campaign'];
const sampleItems = ['Booming Point', 'The Playing Fyp', 'Earn With Aztec', 'More Quests'];
const partners = ['aztec', 'soon1', 'soon2', 'soon3', 'soon4'];

const newAdded = [
  {
    owner: 'Tezac Xyz',
    title: 'Testnet Pass NFT Marketplace',
    stats: '1.5K/7.5K Archivers',
    image: '/placeholder.png',
    badges: ['diamond', 'dot'],
  },
  {
    owner: '0xbow io',
    title: 'Private Pool Trading Quest',
    stats: '2.5K/5.5K Archivers',
    image: '/placeholder.png',
    badges: ['diamond'],
  },
  {
    owner: 'Nemi Finance',
    title: 'Privacy Swap Integration',
    stats: '7.5K/9.5K Archivers',
    image: '/placeholder.png',
    badges: ['diamond', 'dot', 'cube'],
  },
];

function HomePage() {
  const { user, setUser } = useUser();
  const { wallet } = useWallet();
  const [showMintPopup, setShowMintPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    // Auto show profile creation modal for non-registered users
    if (user.isRegistered === false && wallet.isConnected) {
      setShowMintPopup(true);
    }
  }, [user.isRegistered, wallet.isConnected]);

  const handleSubmit = async ({ username, avatar }) => {
    setLoading(true);
    try {
      await registerUser(username, avatar);
      setUser((prev) => ({ ...prev, isRegistered: true }));
      setShowMintPopup(false);
    } catch (err) {
      console.error('Mint failed:', err);
      alert('Mint failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MobileHeader />
      <DesktopHeader />

      <div className="mx-4 pt-[64px] mb-24 space-y-6">
        {/* HERO */}
        <div className="h-[433px] w-full overflow-hidden rounded-[10px] shadow-lg text-white ring-1 ring-transparent bg-gradient-to-b from-[#454546] to-[#1f1f1f] p-[1px] backdrop-blur-lg">
          <div className="h-full w-full rounded-[inherit] bg-black/40">
            <div className="h-[185px]" />
            <div className="flex flex-col px-6 pb-[4.5rem]">
              <div className="mb-4 h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10">
                <img src="/placeholder.png" alt="quest" className="h-full w-full object-cover" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Aztlan Quest</h3>
              <p className="mb-6 text-sm leading-snug text-white/70 break-words">
                Aztland Gamified Gateway to the Aztec Network Ecosystem, built on Aztec Network
              </p>
              <div className="mb-8 flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-1 flex-1 rounded-full bg-white/15" />
                ))}
              </div>
              <div className="-mb-4 flex justify-between text-sm text-white/80">
                <span className="flex items-center gap-2">
                  <FaUser size={16} />{wallet.isConnected ? wallet.points : 0}
                </span>
                <span className="flex items-center gap-2"><GiTrophyCup size={16} />600</span>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY TABS */}
        <div className="no-scrollbar overflow-x-auto">
          <div className="flex w-max gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 text-sm font-medium rounded-[10px] transition ${
                  activeCategory === cat ? 'bg-white text-black' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GET STARTED */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Get Started</h2>
            <button className="px-4 py-1.5 rounded-[10px] bg-white/10 text-sm text-white/80 hover:bg-white/20 backdrop-blur-sm">
              Show All
            </button>
          </div>
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex w-max gap-4">
              {sampleItems.map(title => (
                <div 
                  key={title} 
                  className="w-[170px] shrink-0 rounded-[10px] bg-[#1f1f1f]/80 ring-1 ring-black/30 backdrop-blur-md pb-4 hover:ring-purple-500/30 transition-all cursor-pointer"
                >
                  <div className="h-24 w-full rounded-t-[10px] bg-white/10 overflow-hidden relative">
                    <img src="/placeholder.png" alt={title} className="w-full h-full object-cover" />
                  </div>
                  <div className="px-3 pt-3">
                    <span className="inline-block mb-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px]">Aztlan</span>
                    <h3 className="mb-4 text-sm font-semibold">{title}</h3>
                    <div className="mb-4 h-[2px] w-full rounded-full bg-white/10" />
                    <div className="flex justify-between text-xs text-white/70">
                      <span className="flex items-center gap-1">
                        <FaUser size={12} />{wallet.isConnected ? wallet.points : 0}
                      </span>
                      <span className="flex items-center gap-1"><GiTrophyCup size={12} />600</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PARTNERS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Partner</h2>
            <button className="px-4 py-1.5 rounded-[10px] bg-white/10 text-sm text-white/80 hover:bg-white/20 backdrop-blur-sm">
              Show All
            </button>
          </div>
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex w-max gap-4">
              {partners.map(name => (
                <div 
                  key={name}
                  className="w-[96px] h-[96px] shrink-0 rounded-[10px] bg-[#1f1f1f]/80 ring-1 ring-black/30 backdrop-blur-md overflow-hidden flex items-center justify-center hover:ring-purple-500/30 transition-all cursor-pointer"
                >
                  <img src={`/partner/${name}.png`} alt={name} className="w-[80px] h-[80px] object-contain" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHO YOU ARE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Who You Are</h2>
            <button className="px-4 py-1.5 rounded-[10px] bg-white/10 text-sm text-white/80 hover:bg-white/20 backdrop-blur-sm">
              Dive In
            </button>
          </div>
          <div className="relative w-full rounded-[10px] overflow-hidden ring-1 ring-black/30">
            <span className="absolute inset-x-0 top-1/2 h-px bg-black/40 pointer-events-none" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-black/40 pointer-events-none" />
            <div className="grid grid-cols-2 grid-rows-2">
              <div className="p-6 space-y-3 text-white sprite-bg-1 cursor-pointer hover:bg-black/20 transition-colors">
                <TbMoodSearch size={28} className="text-purple-300" />
                <h3 className="text-lg font-semibold">Basic</h3>
                <p className="text-sm text-white/70 leading-snug">Are you a supporter? Let's get started & shout out!</p>
              </div>
              <div className="p-6 space-y-3 text-white sprite-bg-2 cursor-pointer hover:bg-black/20 transition-colors">
                <FaUserAstronaut size={28} className="text-pink-300" />
                <h3 className="text-lg font-semibold">Creator</h3>
                <p className="text-sm text-white/70 leading-snug">Are you a creator? Let's unleash your creativity together!</p>
              </div>
              <div className="p-6 space-y-3 text-white sprite-bg-3 cursor-pointer hover:bg-black/20 transition-colors">
                <GrUserWorker size={28} className="text-green-300" />
                <h3 className="text-lg font-semibold">Builder</h3>
                <p className="text-sm text-white/70 leading-snug">Are you a builder? Aztlan the right place to get started</p>
              </div>
              <div className="p-6 flex items-center justify-center sprite-bg-4 cursor-pointer hover:bg-black/20 transition-colors">
                <button className="text-white text-sm font-medium flex items-center gap-2">
                  <PiBookOpenUserBold size={18} /> Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* NEW ADDED */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">New Added</h2>
            <button className="px-4 py-1.5 rounded-[10px] bg-white/10 text-sm text-white/80 hover:bg-white/20 backdrop-blur-sm">
              Show All
            </button>
          </div>
          <div className="space-y-3">
            {newAdded.map((item, idx) => (
              <div 
                key={idx} 
                className="flex bg-[#1f1f1f]/80 ring-1 ring-black/30 rounded-2xl overflow-hidden backdrop-blur-md hover:ring-purple-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1 px-4 py-3 min-h-[72px]">
                  <img src={item.image} alt={item.title} className="w-12 h-12 rounded-xl" />
                  <div className="overflow-hidden">
                    <p className="text-sm text-white/60 whitespace-nowrap overflow-hidden text-ellipsis">{item.owner}</p>
                    <p className="text-base font-medium text-white whitespace-normal leading-snug break-words">
                      {item.title.length > 20 ? item.title.slice(0, 20) + '...' : item.title}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5 flex items-center gap-1">
                      <PiUsersThreeBold size={12} /> {item.stats}
                    </p>
                  </div>
                </div>
                <div className="w-px bg-white/10 h-auto my-3" />
                <div className="w-[72px] min-h-[72px] flex flex-wrap justify-center items-center gap-1 px-2 text-lg text-purple-300">
                  {item.badges.map((badge, i) => (
                    <span key={i} className="flex items-center justify-center w-6 h-6">
                      {badge === 'diamond' && '♦️'}
                      {badge === 'dot' && '●'}
                      {badge === 'cube' && '▣'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CALL TO ACTION - Only shown for non-connected wallets */}
        {!wallet.isConnected && (
          <section className="mt-8 p-6 rounded-[10px] bg-gradient-to-br from-purple-900/40 to-purple-700/20 backdrop-blur-lg border border-purple-500/20">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-white/70 mb-4">Connect your wallet to start earning points and access exclusive quests</p>
              <button 
                onClick={() => document.querySelector('button:has(.fa-wallet)')?.click()}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-full text-sm font-medium transition-colors"
              >
                Connect Wallet
              </button>
            </div>
          </section>
        )}
      </div>

      <CreateProfileModal
        isOpen={showMintPopup}
        onClose={() => setShowMintPopup(false)}
        loading={loading}
        onSubmit={handleSubmit}
      />

      <BottomNav />
      
      {/* Add custom CSS for sprite backgrounds */}
      <style jsx global>{`
        .sprite-bg-1 {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0));
        }
        .sprite-bg-2 {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(0, 0, 0, 0));
        }
        .sprite-bg-3 {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(0, 0, 0, 0));
        }
        .sprite-bg-4 {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0));
        }
      `}</style>
    </>
  );
}

export default HomePage;
