/**
 * Image utility functions for responsive images and optimization
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Generate optimized image URL with query parameters
 * @param {string} imageUrl - Original image URL
 * @param {object} options - Optimization options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {number} options.quality - Quality (1-100), default 75
 * @param {string} options.format - Format (webp, avif, jpg, png), default webp
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(imageUrl, options = {}) {
  if (!imageUrl) return '';
  
  const { width, height, quality = 75, format = 'webp' } = options;
  
  // Check if it's a backend URL
  const isBackendUrl = imageUrl.includes('backend.pvjewellers.in') || 
    (imageUrl.startsWith('/') && !imageUrl.startsWith('/assets') && !imageUrl.startsWith('/src'));
  
  if (!isBackendUrl) {
    // For Vite-processed images, return as-is
    return imageUrl;
  }
  
  // Build query parameters
  const params = new URLSearchParams();
  if (width) params.append('w', width);
  if (height) params.append('h', height);
  params.append('q', quality);
  params.append('format', format);
  
  // Handle both absolute and relative URLs
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}${params.toString()}`;
}

/**
 * Generate srcset for responsive images
 * @param {string} imageUrl - Base image URL
 * @param {number[]} widths - Array of widths for srcset
 * @param {object} options - Additional options
 * @returns {string} srcset string
 */
export function generateSrcSet(imageUrl, widths = [400, 600, 800, 1200], options = {}) {
  if (!imageUrl) return '';
  
  const { quality = 75, format = 'webp' } = options;
  
  // Check if it's a backend URL
  const isBackendUrl = imageUrl.includes('backend.pvjewellers.in') || 
    (imageUrl.startsWith('/') && !imageUrl.startsWith('/assets') && !imageUrl.startsWith('/src'));
  
  if (!isBackendUrl) {
    return ''; // No srcset for non-backend images
  }
  
  return widths
    .map(width => `${getOptimizedImageUrl(imageUrl, { width, quality, format })} ${width}w`)
    .join(', ');
}

/**
 * Get appropriate sizes attribute based on display width
 * @param {number} displayWidth - Display width in pixels
 * @returns {string} sizes attribute
 */
export function getSizesAttribute(displayWidth) {
  if (!displayWidth) {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  }
  
  // Generate sizes based on display width with breakpoints
  if (displayWidth <= 400) {
    return '(max-width: 480px) 100vw, 400px';
  } else if (displayWidth <= 600) {
    return '(max-width: 768px) 100vw, 600px';
  } else {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px';
  }
}
