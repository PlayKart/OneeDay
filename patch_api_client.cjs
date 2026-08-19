const fs = require('fs');
let code = fs.readFileSync('src/api/client.ts', 'utf8');

const target = `    // Attach local date header YYYY-MM-DD
    config.headers["x-local-date"] = new Date().toISOString().split("T")[0];
    return config;`;

const replacement = `    // Attach local date header YYYY-MM-DD
    config.headers["x-local-date"] = new Date().toISOString().split("T")[0];
    
    // Add cache buster to GET requests to force bypass of stale PWA caches
    if (config.method?.toUpperCase() === 'GET') {
      config.params = { ...config.params, _cb: Date.now() };
    }
    
    return config;`;

if (code.includes(target) && !code.includes('_cb: Date.now()')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/api/client.ts', code);
  console.log('Patched API client');
}
