// src/lib/aztec.js
export const registerUser = async (username, avatar) => {
  // Mock user registration
  console.log('Registering user:', username, avatar);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};
