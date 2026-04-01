const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;
const DIST = path.join(__dirname, 'dist');

// Check for mkcert certificates
const CERT_DIR = path.join(__dirname, 'certs');
const KEY_PATH = process.env.SSL_KEY || path.join(CERT_DIR, 'key.pem');
const CERT_PATH = process.env.SSL_CERT || path.join(CERT_DIR, 'cert.pem');
const hasSSL = fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function requestHandler(req, res) {
  // Redirect HTTP to HTTPS if SSL is available
  if (hasSSL && !req.socket.encrypted) {
    const host = req.headers.host?.split(':')[0] || 'localhost';
    res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
    res.end();
    return;
  }

  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

  // If file doesn't exist, serve index.html (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cache static assets for 1 day, HTML for no-cache
  const cacheControl = ext === '.html'
    ? 'no-cache, no-store, must-revalidate'
    : 'public, max-age=86400';

  // Security headers
  const securityHeaders = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  if (hasSSL) {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, securityHeaders);
    res.end(data);
  });
}

// Get local network IP
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const ip = getNetworkIP();

if (hasSSL) {
  // Start HTTPS server
  const sslOptions = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  };

  const httpsServer = https.createServer(sslOptions, requestHandler);
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log('\n  🔒 BuildForge running with HTTPS:\n');
    console.log(`  Local:   https://localhost:${HTTPS_PORT}`);
    console.log(`  Network: https://${ip}:${HTTPS_PORT}\n`);
  });

  // Start HTTP server that redirects to HTTPS
  const httpServer = http.createServer(requestHandler);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`  HTTP redirect: http://${ip}:${PORT} → https://${ip}:${HTTPS_PORT}\n`);
    console.log('  Share the HTTPS Network URL with your office team.\n');
  });
} else {
  // HTTP only (no certs found)
  const httpServer = http.createServer(requestHandler);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('\n  BuildForge running at:\n');
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://${ip}:${PORT}\n`);
    console.log('  ⚠️  No SSL certs found. For HTTPS, run:\n');
    console.log('     mkcert -install');
    console.log(`     mkdir certs && mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost ${ip}\n`);
    console.log('  Share the Network URL with your office team.\n');
  });
}
