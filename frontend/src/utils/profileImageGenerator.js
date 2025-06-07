// src/utils/profileImageGenerator.js - AZTEC PROFILE NFT GENERATOR
/**
 * Generate profile NFT image using Canvas API
 */

export const generateProfileImage = async ({ name, username, twitter, discord, avatar }) => {
  try {
    console.log('Generating Aztec profile NFT for:', username);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (standard NFT size)
    canvas.width = 1000;
    canvas.height = 1000;
    
    // Background gradient - Aztec theme
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0A0A0A');
    gradient.addColorStop(0.3, '#1a1a2e');
    gradient.addColorStop(0.7, '#16213e');
    gradient.addColorStop(1, '#8b5cf6'); // Purple accent
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle pattern overlay
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 50 + 10,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    // Draw main card background
    const cardX = 60;
    const cardY = 60;
    const cardWidth = 880;
    const cardHeight = 880;
    const borderRadius = 40;
    
    // Card background with glass effect
    ctx.beginPath();
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
    const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    cardGradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
    cardGradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    ctx.fillStyle = cardGradient;
    ctx.fill();
    
    // Card border
    ctx.beginPath();
    roundRect(ctx, cardX, cardY, cardWidth, cardHeight, borderRadius);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Aztlan Quest Logo at top
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('AZTLAN QUEST', canvas.width / 2, 160);
    
    // Subtitle
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = 'rgba(139, 92, 246, 1)';
    ctx.fillText('Gateway to Aztec Network', canvas.width / 2, 190);
    
    // Avatar section
    const avatarSize = 180;
    const avatarX = canvas.width / 2;
    const avatarY = 320;
    
    // Avatar background with glow effect
    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarSize / 2 + 10, 0, Math.PI * 2);
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
    
    // Name section
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const displayName = name || username;
    ctx.fillText(displayName, canvas.width / 2, 480);
    
    // Username with @ symbol
    ctx.font = '32px Arial, sans-serif';
    ctx.fillStyle = 'rgba(139, 92, 246, 1)';
    ctx.fillText(`@${username}`, canvas.width / 2, 520);
    
    // Social section background
    const socialY = 580;
    const socialHeight = 140;
    
    ctx.beginPath();
    roundRect(ctx, cardX + 80, socialY, cardWidth - 160, socialHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    
    // Social handles
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'left';
    let socialOffset = 0;
    
    // Twitter
    if (twitter && twitter.trim()) {
      ctx.fillStyle = '#1DA1F2';
      ctx.fillText('🐦', cardX + 120, socialY + 50);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`@${twitter.replace('@', '')}`, cardX + 160, socialY + 50);
      socialOffset += 50;
    }
    
    // Discord
    if (discord && discord.trim()) {
      ctx.fillStyle = '#5865F2';
      ctx.fillText('💬', cardX + 120, socialY + 50 + socialOffset);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(discord, cardX + 160, socialY + 50 + socialOffset);
    }
    
    // If no social handles, show placeholder
    if (!twitter && !discord) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('Connect social accounts to verify identity', canvas.width / 2, socialY + 70);
    }
    
    // Footer section
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('Aztec Network • Privacy by Design', canvas.width / 2, 780);
    
    // Mint date
    const mintDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    ctx.font = '16px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(`Minted: ${mintDate}`, canvas.width / 2, 810);
    
    // Aztec Network badge
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
    ctx.fillText('AZTEC TESTNET', canvas.width / 2, 840);
    
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

// Upload to IPFS (simplified version for now)
export const uploadToIPFS = async (blob) => {
  try {
    // For now, just return data URL
    // In production, integrate with NFT.Storage or Pinata
    console.log('Converting to data URL (IPFS integration pending)');
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          ipfsHash: 'data_' + Date.now(),
          ipfsUrl: reader.result
        });
      };
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
