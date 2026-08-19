const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const swScriptTarget = `    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then((registration) => {
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[SW] New version available; updating.');
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                };
              }
            };
          }).catch((err) => {
            console.warn('[SW] ServiceWorker registration failed:', err);
          });
        });
      }
    </script>`;

const newSwScript = `    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
      }
    </script>`;

if (code.includes(swScriptTarget)) {
  code = code.replace(swScriptTarget, newSwScript);
  fs.writeFileSync('index.html', code);
}
