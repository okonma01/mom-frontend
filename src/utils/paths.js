/**
 * Resolves the correct path for assets based on the environment
 * In production, assets are served from the base path (/mom-frontend/)
 * In development/preview, assets are served from the root
 */
export function getAssetPath(path) {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Check if we're in production GitHub Pages (not just PROD)
  // This helps distinguish between GitHub Pages and local preview
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // In GitHub Pages production, prepend the base path
  return isGitHubPages ? `/mom-frontend/${cleanPath}` : `/${cleanPath}`;
}
