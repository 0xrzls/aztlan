// Placeholder function untuk integrasi Aztec
export const registerUser = async (username, avatar) => {
  console.log('Registering user:', username, avatar);
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, txHash: '0x123...456' });
    }, 2000);
  });
};
