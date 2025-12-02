/**
 * Post-build script to ensure API_BACKEND_URL is set in dist/index.html
 * This script runs after 'npm run build' to add the Backend URL configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
// Get Backend URL from environment variable or use default
// You can set this via: VITE_API_BACKEND_URL=http://qr-algo-je.xo.je/backend/api npm run build:fix
const backendUrl = process.env.VITE_API_BACKEND_URL || process.env.API_BACKEND_URL || 'http://qr-algo-je.xo.je/backend/api';

console.log('🔧 Fixing dist/index.html with Backend URL...');
console.log('   Backend URL:', backendUrl);

try {
  if (!fs.existsSync(distIndexPath)) {
    console.error('❌ dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
  }

  let html = fs.readFileSync(distIndexPath, 'utf8');

  // Check if API_BACKEND_URL script already exists
  if (html.includes('window.API_BACKEND_URL')) {
    // Update existing script
    html = html.replace(
      /window\.API_BACKEND_URL\s*=\s*['"][^'"]*['"]/g,
      `window.API_BACKEND_URL = '${backendUrl}'`
    );
    console.log('✅ Updated existing API_BACKEND_URL in dist/index.html');
  } else {
    // Add script before </head>
    const scriptTag = `    <!-- Backend API Configuration -->
    <script>
      (function() {
        window.API_BACKEND_URL = '${backendUrl}';
        console.log('📡 [index.html] Backend API URL configured:', window.API_BACKEND_URL);
      })();
    </script>
    
`;
    
    // Insert before </head>
    html = html.replace('</head>', scriptTag + '</head>');
    console.log('✅ Added API_BACKEND_URL script to dist/index.html');
  }

  fs.writeFileSync(distIndexPath, html, 'utf8');
  console.log('✅ dist/index.html updated successfully!');
} catch (error) {
  console.error('❌ Error fixing dist/index.html:', error);
  process.exit(1);
}

