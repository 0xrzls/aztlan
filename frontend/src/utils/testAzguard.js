// src/utils/testAzguard.js
/**
 * Test script untuk debug Azguard connection
 * Jalankan ini di browser console untuk test
 */

window.testAzguard = async function() {
  console.log('=== Testing Azguard Wallet ===');
  
  // 1. Check if Azguard exists
  if (!window.azguard) {
    console.error('❌ window.azguard not found!');
    console.log('Please make sure Azguard extension is installed');
    return;
  }
  
  console.log('✅ window.azguard found');
  console.log('Azguard object:', window.azguard);
  
  // 2. Check properties
  console.log('\n--- Checking properties ---');
  console.log('isAzguard:', window.azguard.isAzguard);
  console.log('isConnected:', window.azguard.isConnected);
  console.log('selectedAddress:', window.azguard.selectedAddress);
  
  // 3. List all methods
  console.log('\n--- Available methods ---');
  const methods = Object.getOwnPropertyNames(window.azguard).filter(
    prop => typeof window.azguard[prop] === 'function'
  );
  console.log('Methods:', methods);
  
  // Also check prototype methods
  const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(window.azguard)).filter(
    prop => typeof window.azguard[prop] === 'function'
  );
  console.log('Prototype methods:', protoMethods);
  
  // 4. Try to connect
  console.log('\n--- Attempting connection ---');
  
  try {
    // Method 1: request with eth_requestAccounts
    if (window.azguard.request) {
      console.log('Trying request({ method: "eth_requestAccounts" })...');
      const accounts = await window.azguard.request({ method: 'eth_requestAccounts' });
      console.log('✅ Success! Accounts:', accounts);
      return accounts;
    }
  } catch (e) {
    console.log('❌ eth_requestAccounts failed:', e.message);
  }
  
  try {
    // Method 2: request with aztec_requestAccounts
    if (window.azguard.request) {
      console.log('Trying request({ method: "aztec_requestAccounts" })...');
      const accounts = await window.azguard.request({ method: 'aztec_requestAccounts' });
      console.log('✅ Success! Accounts:', accounts);
      return accounts;
    }
  } catch (e) {
    console.log('❌ aztec_requestAccounts failed:', e.message);
  }
  
  try {
    // Method 3: enable
    if (window.azguard.enable) {
      console.log('Trying enable()...');
      const accounts = await window.azguard.enable();
      console.log('✅ Success! Accounts:', accounts);
      return accounts;
    }
  } catch (e) {
    console.log('❌ enable failed:', e.message);
  }
  
  try {
    // Method 4: connect
    if (window.azguard.connect) {
      console.log('Trying connect()...');
      const result = await window.azguard.connect();
      console.log('✅ Success! Result:', result);
      return result;
    }
  } catch (e) {
    console.log('❌ connect failed:', e.message);
  }
  
  console.log('\n❌ Could not connect with any method');
  console.log('Please check with Azguard documentation or support');
};

// Auto-run on page load for debugging
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('Azguard test function available. Run: testAzguard()');
  });
}

// Export for use in app
export const testAzguardConnection = window.testAzguard;
