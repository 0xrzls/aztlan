// src/lib/azguardDirect.js
/**
 * Direct integration with Azguard Wallet via window.azguard
 */

export const isAzguardAvailable = () =>
  typeof window !== 'undefined' && typeof window.azguard !== 'undefined';

export const connectAzguardDirect = async () => {
  try {
    // 1) Pastikan extension terpasang
    if (!isAzguardAvailable()) {
      window.open(
        'https://chrome.google.com/webstore/detail/azguard-wallet/pliilpflcmabdiapdeihifihkbdfnbmn',
        '_blank'
      );
      return {
        success: false,
        error: 'Please install Azguard Wallet extension'
      };
    }

    // 2) Inisialisasi (opsional)
    if (typeof window.azguard.init === 'function') {
      await window.azguard.init({
        appName: 'Aztlan Quest',
        appIconUrl: window.location.origin + '/logo.svg',
      });
    }

    // 3) Coba dapatkan accounts via berbagai method
    let accounts;

    // Eth-provider style
    if (typeof window.azguard.request === 'function') {
      // cek eth_accounts dulu
      accounts = await window.azguard.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        // minta akses
        accounts = await window.azguard.request({ method: 'eth_requestAccounts' });
      }
    }

    // Azguard legacy connect()
    if ((!accounts || accounts.length === 0) && typeof window.azguard.connect === 'function') {
      const res = await window.azguard.connect();
      if (Array.isArray(res)) accounts = res;
      else if (res.accounts) accounts = res.accounts;
      else if (typeof res === 'string') accounts = [res];
    }

    // Fallback enable()
    if ((!accounts || accounts.length === 0) && typeof window.azguard.enable === 'function') {
      accounts = await window.azguard.enable();
    }

    // 4) Validasi account
    if (!accounts || accounts.length === 0) {
      throw new Error(
        'Could not get accounts from Azguard. Please make sure the extension is unlocked.'
      );
    }

    // 5) Ambil address
    let address = accounts[0];
    // jika format "aztec:chainId:address", ambil bagian terakhir
    if (address.includes(':')) {
      address = address.split(':').pop();
    }

    // 6) Bungkus account dengan method yang konsisten
    const accountWrapper = {
      address,
      getAddress: () => ({ toString: () => address }),
      signMessage: async (message) => {
        // personal_sign via eth_request
        if (typeof window.azguard.request === 'function') {
          return await window.azguard.request({
            method: 'personal_sign',
            params: [message, address],
          });
        }
        // fallback API lain
        if (typeof window.azguard.personalSign === 'function') {
          return await window.azguard.personalSign(message, address);
        }
        if (typeof window.azguard.signMessage === 'function') {
          return await window.azguard.signMessage(message, address);
        }
        throw new Error('No signing method available in Azguard');
      },
      // sertakan provider asli jika diperlukan
      _provider: window.azguard,
    };

    return {
      success: true,
      account: accountWrapper,
      address,
      provider: 'azguard',
    };
  } catch (error) {
    console.error('Azguard connection error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Azguard',
    };
  }
};
