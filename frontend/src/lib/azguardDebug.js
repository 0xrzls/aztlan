// src/lib/azguardDebug.js
/**
 * Debug helper for Azguard wallet integration
 */

export const debugAzguard = () => {
  console.log('=== Azguard Debug Info ===');
  
  if (typeof window === 'undefined') {
    console.log('Window object not available');
    return;
  }
  
  if (!window.azguard) {
    console.log('window.azguard not found');
    return;
  }
  
  console.log('window.azguard exists:', window.azguard);
  console.log('Type:', typeof window.azguard);
  
  // List all properties
  console.log('Properties:');
  for (const key in window.azguard) {
    console.log(`  ${key}:`, typeof window.azguard[key]);
  }
  
  // Check for common methods
  const methods = [
    'request', 'connect', 'enable', 'requestAccounts', 
    'getAccounts', 'signMessage', 'sign', 'personalSign',
    'init', 'isConnected', 'isInstalled'
  ];
  
  console.log('Method availability:');
  methods.forEach(method => {
    console.log(`  ${method}:`, method in window.azguard ? '✓' : '✗');
  });
  
  // Check if it's a proxy or has special properties
  if (window.azguard._metamask) {
    console.log('Has _metamask property - might be MetaMask-like');
  }
  
  if (window.azguard.isAzguard) {
    console.log('Has isAzguard property:', window.azguard.isAzguard);
  }
  
  // Try to get the prototype chain
  try {
    console.log('Prototype chain:');
    let proto = Object.getPrototypeOf(window.azguard);
    let depth = 0;
    while (proto && depth < 5) {
      console.log(`  Level ${depth}:`, proto.constructor?.name || proto);
      proto = Object.getPrototypeOf(proto);
      depth++;
    }
  } catch (e) {
    console.log('Could not inspect prototype chain:', e.message);
  }
  
  console.log('=== End Debug Info ===');
};

// Auto-debug when loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(debugAzguard, 1000); // Wait a bit for wallet to initialize
  });
}
