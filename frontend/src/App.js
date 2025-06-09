// src/App.js - UPDATED WITH AZTEC ERROR BOUNDARY
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import useWalletStore from './store/walletStore';
import AztecErrorBoundary from './components/AztecErrorBoundary';
import MobileHeader from './components/MobileHeader';
import DesktopHeader from './components/DesktopHeader';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';

// Development mode indicator
const DevelopmentIndicator = () => {
  const { useMockData, developmentMode } = useWalletStore();
  
  if (!developmentMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] bg-orange-600/90 text-white text-center py-1 text-xs">
      <div className="flex items-center justify-center gap-2">
        <span>🚧 Development Mode</span>
        <span>•</span>
        <span>{useMockData ? '🎭 Mock Data' : '🌐 Real Aztec'}</span>
        <span>•</span>
        <button 
          onClick={() => useWalletStore.getState().toggleMockMode()}
          className="underline hover:no-underline"
        >
          Switch to {useMockData ? 'Real' : 'Mock'}
        </button>
      </div>
    </div>
  );
};

function App() {
  const { checkStoredWallet } = useWalletStore();

  // Check for stored wallet on app load
  useEffect(() => {
    checkStoredWallet();
  }, [checkStoredWallet]);

  return (
    <AztecErrorBoundary>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-[#0A0A0A] text-white">
            <DevelopmentIndicator />
            <MobileHeader />
            <DesktopHeader />
            
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              {/* Add more routes as needed */}
            </Routes>
            
            <BottomNav />
          </div>
        </Router>
      </UserProvider>
    </AztecErrorBoundary>
  );
}

export default App;
