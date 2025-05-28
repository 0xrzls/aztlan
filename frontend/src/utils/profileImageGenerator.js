// src/utils/profileImageGenerator.js
/**
 * Generate profile NFT image using Canvas API
 */

export const generateProfileImage = async ({ name, username, twitter, discord, avatar }) => {
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size (standard NFT size)
  canvas.width = 1000;
  canvas.height = 1000;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add pattern/texture
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      Math.random() * 100,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  
  // Draw main card
  const cardX = 100;
  const cardY = 100;
  const cardWidth = 800;
  const cardHeight = 800;
  const borderRadius = 40;
  
  // Card background with gradient
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
  cardGradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
  cardGradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
  ctx.fillStyle = cardGradient;
  ctx.fill();
  
  // Card border
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Aztlan Logo/Title
  ctx.font = 'bold 60px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('AZTLAN PROFILE', canvas.width / 2, 200);
  
  // Avatar circle
  const avatarSize = 200;
  const avatarX = canvas.width / 2;
  const avatarY = 350;
  
  // Avatar background circle
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
  ctx.fill();
  
  // Avatar (using provided avatar or generating from username)
  if (avatar) {
    // If avatar image provided
    try {
      const img = new Image();
      img.src = avatar;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
      ctx.restore();
    } catch (e) {
      // Fallback to initial
      drawAvatarFallback(ctx, avatarX, avatarY, avatarSize, username);
    }
  } else {
    // Generate avatar from username
    drawAvatarFallback(ctx, avatarX, avatarY, avatarSize, username);
  }
  
  // Name
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name || 'Anonymous', canvas.width / 2, 520);
  
  // Username
  ctx.font = '36px Arial';
  ctx.fillStyle = 'rgba(139, 92, 246, 1)';
  ctx.fillText(`@${username}`, canvas.width / 2, 570);
  
  // Social section background
  const socialY = 620;
  ctx.beginPath();
  roundRect(ctx, cardX + 50, socialY, cardWidth - 100, 200, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  
  // Social handles
  ctx.font = '28px Arial';
  ctx.textAlign = 'left';
  
  // Twitter
  if (twitter) {
    // Twitter icon (simplified)
    ctx.fillStyle = '#1DA1F2';
    ctx.fillText('🐦', cardX + 80, socialY + 60);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`@${twitter}`, cardX + 130, socialY + 60);
  }
  
  // Discord
  if (discord) {
    // Discord icon (simplified)
    ctx.fillStyle = '#5865F2';
    ctx.fillText('💬', cardX + 80, socialY + 120);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(discord, cardX + 130, socialY + 120);
  }
  
  // Footer
  ctx.font = '20px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('Aztec Network • Digital Identity', canvas.width / 2, 880);
  
  // Mint date
  const mintDate = new Date().toLocaleDateString();
  ctx.fillText(`Minted: ${mintDate}`, canvas.width / 2, 910);
  
  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve({
        blob,
        dataUrl: canvas.toDataURL('image/png'),
        canvas
      });
    }, 'image/png');
  });
};

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
}

// Draw avatar fallback (initial)
function drawAvatarFallback(ctx, x, y, size, username) {
  // Background circle with gradient
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  gradient.addColorStop(0, '#8b5cf6');
  gradient.addColorStop(1, '#6d28d9');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Initial letter
  ctx.font = `bold ${size / 2}px Arial`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((username || 'A')[0].toUpperCase(), x, y);
}

// Upload to IPFS (using Pinata or similar service)
export const uploadToIPFS = async (blob) => {
  try {
    // Option 1: Use Pinata (requires API key)
    if (process.env.REACT_APP_PINATA_JWT) {
      const formData = new FormData();
      formData.append('file', blob, 'profile.png');
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Pinata upload failed');
      }
      
      const data = await response.json();
      return {
        ipfsHash: data.IpfsHash,
        ipfsUrl: `ipfs://${data.IpfsHash}`
      };
    }
    
    // Option 2: Use NFT.Storage (free)
    if (process.env.REACT_APP_NFT_STORAGE_KEY) {
      const formData = new FormData();
      formData.append('file', blob);
      
      const response = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_NFT_STORAGE_KEY}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('NFT.Storage upload failed');
      }
      
      const data = await response.json();
      return {
        ipfsHash: data.value.cid,
        ipfsUrl: `ipfs://${data.value.cid}`
      };
    }
    
    // Option 3: Convert to base64 data URL (for testing)
    console.warn('No IPFS service configured, using base64 data URL');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        resolve({
          ipfsHash: 'base64_' + Date.now(),
          ipfsUrl: base64data
        });
      };
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
};
