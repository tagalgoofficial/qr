/**
 * Image URL Utilities
 * Convert absolute image URLs to relative paths
 */

/**
 * Convert absolute image URL to relative path
 * Handles URLs like:
 * - http://192.168.1.3/backend/uploads/... -> /backend/uploads/...
 * - http://localhost/backend/uploads/... -> /backend/uploads/...
 * - https://domain.com/backend/uploads/... -> /backend/uploads/...
 * - /backend/uploads/... -> /backend/uploads/... (already relative)
 * 
 * @param {string} imageUrl - The image URL (absolute or relative)
 * @returns {string} - Relative path to the image
 */
export function normalizeImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return '';
  }

  // If already relative, return as is
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  // If it's a data URL (base64), return as is
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  // If it's an external URL (not our backend), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Extract the path from absolute URL
    try {
      const url = new URL(imageUrl);
      const path = url.pathname;
      
      // Check if it's a backend upload path
      if (path.includes('/backend/uploads/')) {
        // Return relative path
        return path;
      }
      
      // If it's not a backend path, return as is (external image)
      return imageUrl;
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      const match = imageUrl.match(/\/backend\/uploads\/.*/);
      if (match) {
        return match[0];
      }
      // If no match, return as is
      return imageUrl;
    }
  }

  // If it's just a path without leading slash, add it
  if (imageUrl.includes('/backend/uploads/')) {
    // Extract path after /backend/uploads/
    const match = imageUrl.match(/\/backend\/uploads\/.*/);
    if (match) {
      return match[0];
    }
    // If no match but contains /backend/uploads/, add leading slash
    return '/' + imageUrl.replace(/^.*\/backend\/uploads\//, 'backend/uploads/');
  }

  // Return as is if we can't determine
  return imageUrl;
}

/**
 * Get full image URL (handles both relative and absolute)
 * For relative paths, uses current origin
 * 
 * @param {string} imageUrl - The image URL (absolute or relative)
 * @returns {string} - Full URL to the image
 */
export function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return '';
  }

  const normalized = normalizeImageUrl(imageUrl);

  // If it's already a full URL (external), return as is
  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('data:')) {
    return normalized;
  }

  // If it's relative, return as is (browser will resolve it)
  // But if we're on Vite dev server, we might need to use absolute URL
  if (typeof window !== 'undefined') {
    const port = window.location.port;
    
    // If on Vite dev server, use absolute URL to Apache
    if (port && (port === '5173' || port === '3000' || port === '8080' || port === '5174')) {
      const host = window.location.hostname;
      return `http://${host}${normalized}`;
    }
  }

  // Otherwise, return relative path
  return normalized;
}

/**
 * Check if image URL is from backend uploads
 * 
 * @param {string} imageUrl - The image URL
 * @returns {boolean} - True if image is from backend uploads
 */
export function isBackendImage(imageUrl) {
  if (!imageUrl) {
    return false;
  }
  
  return imageUrl.includes('/backend/uploads/') || 
         imageUrl.includes('backend/uploads/');
}



