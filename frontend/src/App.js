// src/App.js - UPDATED WITH NOTIFICATION SYSTEM AND ENHANCED ERROR HANDLING
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import useWalletStore from './store/walletStore';
import AztecErrorBoundary from './components/AztecErrorBoundary';
import NotificationSystem from './components/NotificationSystem';
import MobileHeader from './components/MobileHeader';
import DesktopHeader from './components/DesktopHeader';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';

// Development mode indicator with enhanced features
const DevelopmentIndicator = () => {
  const { useMockData, developmentMode, toggleMockMode, isConnected } = useWalletStore();
  
  if (!developmentMode) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] bg-gradient-to-r from-orange-600/90 to-red-600/90 text-white text-center py-1 text-xs shadow-lg">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <span className="flex items-center gap-1">
          🚧 <strong>Development Mode</strong>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          {useMockData ? '🎭 Mock Data' : '🌐 Real Aztec'}
        </span>
        <span>•</span>
        <button 
          onClick={toggleMockMode}
          disabled={isConnected}
          className={`underline hover:no-underline transition ${
            isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:text-yellow-200'
          }`}
          title={isConnected ? 'Disconnect wallet first to switch modes' : 'Switch between mock and real mode'}
        >
          Switch to {useMockData ? 'Real' : 'Mock'}
        </button>
        {isConnected && (
          <>
            <span>•</span>
            <span className="text-yellow-200">Disconnect wallet to switch modes</span>
          </>
        )}
      </div>
    </div>
  );
};

// Network status indicator
const NetworkStatusIndicator = () => {
  const { isConnected, useMockData } = useWalletStore();
  
  if (!isConnected) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-40 hidden md:block">
      <div className={`backdrop-blur-lg border rounded-lg px-3 py-2 text-xs font-medium ${
        useMockData 
          ? 'bg-orange-600/20 border-orange-500/30 text-orange-400'
          : 'bg-green-600/20 border-green-500/30 text-green-400'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            useMockData ? 'bg-orange-400' : 'bg-green-400'
          }`}></div>
          <span>
            {useMockData ? 'Mock Mode Active' : 'Aztec Network Connected'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Loading overlay for app initialization
const LoadingOverlay = ({ isLoading, message }) => {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#121212] rounded-xl p-8 text-center max-w-sm mx-4">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-white font-semibold mb-2">Initializing Aztlan</h3>
        <p className="text-white/70 text-sm">{message || 'Setting up your experience...'}</p>
      </div>
    </div>
  );
};

function App() {
  const { checkStoredWallet, isLoading, developmentMode } = useWalletStore();
  const [appInitialized, setAppInitialized] = React.useState(false);
  const [initMessage, setInitMessage] = React.useState('Initializing application...');

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitMessage('Checking stored wallet...');
        
        // Check for stored wallet on app load
        await checkStoredWallet();
        
        setInitMessage('Setting up components...');
        
        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAppInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setAppInitialized(true); // Continue anyway
      }
    };

    initializeApp();
  }, [checkStoredWallet]);

  // Listen for unhandled errors
  useEffect(() => {
    const handleUnhandledError = (event) => {
      console.error('Unhandled error:', event.error);
      
      // Add notification for unhandled errors
      useWalletStore.getState().addNotification({
        type: 'error',
        title: 'Unexpected Error',
        message: 'An unexpected error occurred. Please refresh the page if issues persist.',
        persistent: true
      });
    };

    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Add notification for unhandled promise rejections
      useWalletStore.getState().addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: 'A background operation failed. Some features may not work correctly.',
        persistent: true
      });
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('✅ Notification permission granted');
        }
      });
    }
  }, []);

  return (
    <AztecErrorBoundary>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-[#0A0A0A] text-white">
            {/* Development indicator */}
            <DevelopmentIndicator />
            
            {/* Headers */}
            <MobileHeader />
            <DesktopHeader />
            
            {/* Main content */}
            <main className={developmentMode ? 'pt-6' : ''}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {/* Add more routes as needed */}
              </Routes>
            </main>
            
            {/* Bottom navigation */}
            <BottomNav />
            
            {/* Status indicators */}
            <NetworkStatusIndicator />
            
            {/* Notification system */}
            <NotificationSystem />
            
            {/* Loading overlay */}
            <LoadingOverlay 
              isLoading={!appInitialized || isLoading} 
              message={initMessage}
            />
          </div>
        </Router>
      </UserProvider>
    </AztecErrorBoundary>
  );
}

export default App;
