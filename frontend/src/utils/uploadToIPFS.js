import { NFTStorage, File } from 'nft.storage';

/**

Uploads an image Blob to NFT.Storage and returns the IPFS URL.

@param {Blob} blob - Image blob to upload

@returns {Promise<{ ipfsUrl: string, cid: string }>} - IPFS URL and CID */ export async function uploadToIPFS(blob) { try { const apiKey = process.env.REACT_APP_NFT_STORAGE_API_KEY; if (!apiKey) throw new Error('NFT.Storage API key not set in environment variables');

const client = new NFTStorage({ token: apiKey }); const file = new File([blob], 'profile.png', { type: 'image/png' });

const metadata = await client.store({ name: 'Aztlan Profile Image', description: 'Profile picture uploaded from Aztlan Quest app', image: file, });

return { ipfsUrl: metadata.data.image.href, cid: metadata.ipnft, }; } catch (error) { console.error('IPFS upload failed:', error); throw error; } }


