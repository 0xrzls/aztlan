import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { UserProvider } from './context/UserContext';
import MobileHeader from './components/MobileHeader';
import DesktopHeader from './components/DesktopHeader';
import BottomNav from './components/BottomNav'; // Buat jika belum ada
import HomePage from './pages/HomePage'; // Pastikan file ini ada
import ProfilePage from './pages/ProfilePage';

// Komponen BottomNav sederhana jika belum ada
const DefaultBottomNav = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 py-2 px-4 flex justify-around md:hidden">
    <a href="/" className="text-white p-2">Home</a>
    <a href="/quests" className="text-white p-2">Quests</a>
    <a href="/profile" className="text-white p-2">Profile</a>
  </div>
);

function App() {
  // Gunakan komponen BottomNav yang sudah ada atau gunakan DefaultBottomNav
  const NavComponent = typeof BottomNav !== 'undefined' ? BottomNav : DefaultBottomNav;

  return (
    <UserProvider>
      <WalletProvider>
        <Router>
          <div className="min-h-screen bg-[#0A0A0A] text-white">
            <MobileHeader />
            <DesktopHeader />
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Tambahkan route lain sesuai kebutuhan */}
            </Routes>
            
            <NavComponent />
          </div>
        </Router>
      </WalletProvider>
    </UserProvider>
  );
}

export default App;
