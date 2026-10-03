/**
 * Universal Image URL resolver for BD E-Commerce
 * Resolves uploaded backend photos, local static assets, data URLs, and remote web URLs.
 */
export const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85';

export const REALISTIC_PRESET_IMAGES = [
  { name: 'Samsung Galaxy A55 5G', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=85' },
  { name: 'Apple MacBook Pro M3', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=85' },
  { name: 'Sony WH-1000XM5 ANC', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85' },
  { name: 'Apple Watch Ultra 2', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=85' },
  { name: 'DJI Mini 4 Pro Drone', url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=85' },
  { name: 'iPad Air M2 Retina', url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=85' },
  { name: 'Nike Pro Running Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85' },
  { name: 'Genuine Leather Wallet', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=85' },
];

export function formatImageUrl(
  path?: string | null,
  versionOrUpdatedAt?: string | number | null
): string {
  if (!path || (path.endsWith('.svg') && path.includes('/products/'))) {
    return DEFAULT_PRODUCT_IMAGE;
  }
  
  // Data URLs (base64) or object blobs
  if (path.startsWith('data:image') || path.startsWith('blob:')) {
    return path;
  }

  let finalUrl = path;

  // Backend uploads folder path (/uploads/products/...)
  if (path.startsWith('/uploads/')) {
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.bdecommerce.inspireacademyy.com/';
    finalUrl = `${backendHost}${path}`;
  }

  // If version or updatedAt is supplied and URL doesn't already have ?v=
  if (versionOrUpdatedAt && !finalUrl.includes('?v=') && !finalUrl.includes('&v=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    // Format timestamp or string to clean alphanumeric token
    const vToken = typeof versionOrUpdatedAt === 'string'
      ? versionOrUpdatedAt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
      : versionOrUpdatedAt;
    finalUrl = `${finalUrl}${separator}v=${vToken}`;
  }

  return finalUrl;
}
