// src/App.js - FIXED INITIALIZATION ISSUES
import React, { useEffect, useState } from 'react';
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

// Enhanced loading overlay with timeout handling
const LoadingOverlay = ({ isLoading, message, onTimeout }) => {
  const [showTimeout, setShowTimeout] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  useEffect(() => {
    if (!isLoading) {
      setShowTimeout(false);
      setTimeElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Show timeout option after 30 seconds
    const timeoutTimer = setTimeout(() => {
      setShowTimeout(true);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutTimer);
    };
  }, [isLoading]);

  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#121212] rounded-xl p-8 text-center max-w-sm mx-4 border border-white/10">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-white font-semibold mb-2">Initializing Aztlan</h3>
        <p className="text-white/70 text-sm mb-4">{message || 'Setting up your experience...'}</p>
        
        <div className="text-xs text-white/50 mb-4">
          Time elapsed: {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
        </div>

        {showTimeout && (
          <div className="space-y-3">
            <div className="bg-orange-600/20 border border-orange-600/40 rounded-lg p-3">
              <p className="text-orange-400 text-sm mb-2">Taking longer than expected?</p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    localStorage.setItem('aztec_use_mock', 'true');
                    window.location.reload();
                  }}
                  className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm transition"
                >
                  Switch to Mock Mode
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { checkStoredWallet, isLoading, developmentMode } = useWalletStore();
  const [appInitialized, setAppInitialized] = useState(false);
  const [initMessage, setInitMessage] = useState('Initializing application...');
  const [initError, setInitError] = useState(null);

  // Initialize app with better error handling
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setInitMessage('Loading configuration...');
        
        // Add artificial delay to show we're working
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setInitMessage('Checking stored wallet...');
        
        // Check for stored wallet with timeout
        const walletCheckPromise = checkStoredWallet();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Wallet check timeout')), 25000)
        );
        
        try {
          await Promise.race([walletCheckPromise, timeoutPromise]);
        } catch (error) {
          if (error.message === 'Wallet check timeout') {
            console.warn('⚠️ Wallet check timeout, switching to mock mode');
            localStorage.setItem('aztec_use_mock', 'true');
            useWalletStore.getState().useMockData = true;
          } else {
            throw error;
          }
        }
        
        setInitMessage('Setting up components...');
        
        // Final setup delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setAppInitialized(true);
        
      } catch (error) {
        console.error('App initialization failed:', error);
        setInitError(error.message);
        
        // Auto-fallback to mock mode in development
        if (developmentMode) {
          console.log('🔄 Auto-falling back to mock mode...');
          localStorage.setItem('aztec_use_mock', 'true');
          
          setTimeout(() => {
            setInitError(null);
            setAppInitialized(true);
          }, 2000);
        } else {
          // In production, still initialize but show error
          setTimeout(() => {
            setAppInitialized(true);
          }, 3000);
        }
      }
    };

    initializeApp();
  }, [checkStoredWallet, developmentMode]);

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
      
      // Check if it's an Aztec-related error
      const reason = event.reason?.message || event.reason || '';
      
      if (reason.includes('PXE') || reason.includes('aztec') || reason.includes('timeout')) {
        useWalletStore.getState().addNotification({
          type: 'warning',
          title: 'Aztec Network Issue',
          message: 'Having trouble connecting to Aztec Network. Consider switching to mock mode.',
          persistent: true
        });
      } else {
        useWalletStore.getState().addNotification({
          type: 'error',
          title: 'Operation Failed',
          message: 'A background operation failed. Some features may not work correctly.',
          persistent: true
        });
      }
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

  // Show initialization error if any
  if (initError && !appInitialized) {
    return (
      <AztecErrorBoundary>
        <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
          <div className="bg-[#121212] rounded-xl p-8 text-center max-w-md mx-4 border border-red-500/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-4">Initialization Failed</h2>
            <p className="text-white/70 text-sm mb-6">{initError}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.setItem('aztec_use_mock', 'true');
                  window.location.reload();
                }}
                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-white text-sm transition"
              >
                Try Mock Mode
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition"
              >
                Retry
              </button>
            </div>
            
            {developmentMode && (
              <div className="mt-4 p-3 bg-orange-600/20 rounded-lg">
                <p className="text-orange-400 text-xs">
                  Auto-switching to mock mode in development...
                </p>
              </div>
            )}
          </div>
        </div>
      </AztecErrorBoundary>
    );
  }

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
            
            {/* Loading overlay with timeout handling */}
            <LoadingOverlay 
              isLoading={!appInitialized || isLoading} 
              message={initMessage}
              onTimeout={() => {
                console.log('⏰ Loading timeout detected');
                setAppInitialized(true);
              }}
            />
          </div>
        </Router>
      </UserProvider>
    </AztecErrorBoundary>
  );
}

export default App;
