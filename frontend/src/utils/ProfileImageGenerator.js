import { createCanvas, loadImage } from 'canvas';

/**
 * Generates a profile image using canvas
 * @param {object} data - Object with name, username, avatar (URL), etc
 * @returns {object} - blob & dataUrl
 */
export async function generateProfileImage({ name, username, twitter, discord, avatar }) {
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, 512, 512);

  // Avatar
  const avatarImage = await loadImage(avatar);
  ctx.drawImage(avatarImage, 156, 50, 200, 200); // center image

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Sans';
  ctx.fillText(name, 50, 300);

  // Username
  ctx.font = '24px Sans';
  ctx.fillText(`@${username}`, 50, 340);

  // Twitter/Discord (if any)
  if (twitter) ctx.fillText(`Twitter: @${twitter}`, 50, 380);
  if (discord) ctx.fillText(`Discord: ${discord}`, 50, 420);

  const buffer = canvas.toBuffer('image/png');

  return {
    blob: new Blob([buffer], { type: 'image/png' }),
    dataUrl: `data:image/png;base64,${buffer.toString('base64')}`
  };
}
