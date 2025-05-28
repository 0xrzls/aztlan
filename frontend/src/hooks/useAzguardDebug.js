// src/hooks/useAzguardDebug.js
import { useEffect } from 'react';

export const useAzguardDebug = () => {
  useEffect(() => {
    // Import and setup debug function
    import('../utils/testAzguard').then(({ testAzguardConnection }) => {
      // Make it globally available
      window.testAzguard = testAzguardConnection;
      
      // Also run initial check
      setTimeout(() => {
        console.log('=== Azguard Initial Check ===');
        if (window.azguard) {
          console.log('✅ Azguard detected');
          console.log('Properties:', {
            isAzguard: window.azguard.isAzguard,
            isConnected: window.azguard.isConnected,
            selectedAddress: window.azguard.selectedAddress,
            hasRequest: typeof window.azguard.request === 'function',
            hasEnable: typeof window.azguard.enable === 'function',
            hasConnect: typeof window.azguard.connect === 'function'
          });
        } else {
          console.log('❌ Azguard not detected');
        }
      }, 1000);
    });
  }, []);
};
