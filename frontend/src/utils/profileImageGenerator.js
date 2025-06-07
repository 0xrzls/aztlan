// src/utils/profileImageGenerator.js
/**
 * Generate profile NFT image using Canvas API (Browser compatible)
 */

export const generateProfileImage = async ({ name, username, twitter, discord, avatar }) => {
  try {
    console.log('Generating profile image for:', username);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (standard NFT size)
    canvas.width = 1000;
    canvas.height = 1000;
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0A0A0A');
    gradient.addColorStop(0.3, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle pattern
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 50 + 10,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Draw main card
    const cardX = 80;
    const cardY = 80;
    const cardWidth = 840;
    const cardHeight = 840;
    const borderRadius = 40;
    
    // Card background with gradient
    ctx.beginPath();
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    cardGradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
    cardGradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    ctx.fillStyle = cardGradient;
    ctx.fill();
    
    // Card border
    ctx.beginPath();
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Aztlan Logo/Title at top
    ctx.font = 'bold 50px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('AZTLAN QUEST', canvas.width / 2, 180);
    
    // Subtitle
    ctx.font = '24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(139, 92, 246, 1)';
    ctx.fillText('Gateway to Aztec Network', canvas.width / 2, 220);
    
    // Avatar section
    const avatarSize = 200;
    const avatarX = canvas.width / 2;
    const avatarY = 380;
    
    // Avatar background circle with glow
    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.fill();
    ctx.restore();
    
    // Load and draw avatar image
    if (avatar) {
      try {
        const img = await loadImageAsync(avatar);
        
        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avatarX - avatarSize / 2, avatarY - avatarSize / 2, avatarSize, avatarSize);
        ctx.restore();
      } catch (e) {
        console.warn('Failed to load avatar image, using fallback');
        drawAvatarFallback(ctx, avatarX, avatarY, avatarSize, username);
      }
    } else {
      drawAvatarFallback(ctx, avatarX, avatarY, avatarSize, username);
    }
    
    // Name/Username section
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(name || username, canvas.width / 2, 550);
    
    // Username with @ symbol
    ctx.font = '36px Arial, sans-serif';
    ctx.fillStyle = 'rgba(139, 92, 246, 1)';
    ctx.fillText(`@${username}`, canvas.width / 2, 600);
    
    // Social section background
    const socialY = 650;
    const socialHeight = 160;
    
    ctx.beginPath();
    roundRect(ctx, cardX + 60, socialY, cardWidth - 120, socialHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    
    // Social handles
    ctx.font = '28px Arial, sans-serif';
    ctx.textAlign = 'left';
    let socialOffset = 0;
    
    // Twitter
    if (twitter && twitter.trim()) {
      ctx.fillStyle = '#1DA1F2';
      ctx.fillText('🐦', cardX + 100, socialY + 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`@${twitter.replace('@', '')}`, cardX + 150, socialY + 50);
      socialOffset += 60;
    }
    
    // Discord
    if (discord && discord.trim()) {
      ctx.fillStyle = '#5865F2';
      ctx.fillText('💬', cardX + 100, socialY + 50 + socialOffset);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(discord, cardX + 150, socialY + 50 + socialOffset);
    }
    
    // Footer section
    ctx.font = '22px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Aztec Network • Privacy by Design', canvas.width / 2, 880);
    
    // Mint date
    const mintDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.font = '18px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`Minted: ${mintDate}`, canvas.width / 2, 910);
    
    // Convert to blob and data URL
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          blob,
          dataUrl,
          canvas
        });
      }, 'image/png', 0.9);
    });
    
  } catch (error) {
    console.error('Failed to generate profile image:', error);
    throw error;
  }
};

// Helper function to load image asynchronously
function loadImageAsync(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = src;
  });
}

// Helper function to draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
  ctx.font = `bold ${size / 2.5}px Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((username || 'A')[0].toUpperCase(), x, y);
  
  // Reset text baseline
  ctx.textBaseline = 'alphabetic';
}

// Upload to IPFS (simplified version)
export const uploadToIPFS = async (blob) => {
  try {
    // Option 1: Try NFT.Storage if API key available
    if (process.env.REACT_APP_NFT_STORAGE_API_KEY) {
      console.log('Uploading to NFT.Storage...');
      
      const formData = new FormData();
      formData.append('file', blob, 'profile.png');
      
      const response = await fetch('https://api.nft.storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_NFT_STORAGE_API_KEY}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          ipfsHash: data.value.cid,
          ipfsUrl: `ipfs://${data.value.cid}`
        };
      } else {
        throw new Error('NFT.Storage upload failed');
      }
    }
    
    // Option 2: Try Pinata if JWT available
    if (process.env.REACT_APP_PINATA_JWT) {
      console.log('Uploading to Pinata...');
      
      const formData = new FormData();
      formData.append('file', blob, 'profile.png');
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PINATA_JWT}`
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          ipfsHash: data.IpfsHash,
          ipfsUrl: `ipfs://${data.IpfsHash}`
        };
      } else {
        throw new Error('Pinata upload failed');
      }
    }
    
    // Option 3: Fallback to base64 data URL
    console.warn('No IPFS service configured, using base64 data URL fallback');
    
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
    
    // Final fallback - return data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          ipfsHash: 'fallback_' + Date.now(),
          ipfsUrl: reader.result
        });
      };
      reader.readAsDataURL(blob);
    });
  }
};
