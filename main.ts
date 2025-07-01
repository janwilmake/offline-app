export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Serve the main HTML page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(getMainHTML(), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache', // Don't cache the main page
        },
      });
    }
    
    // Serve the service worker
    if (url.pathname === '/sw.js') {
      return new Response(getServiceWorkerCode(), {
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-cache',
        },
      });
    }
    
    // Serve offline page
    if (url.pathname === '/offline.html') {
      return new Response(getOfflineHTML(), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        },
      });
    }
    
    // API endpoint that fails when offline
    if (url.pathname === '/api/data') {
      return Response.json({
        message: 'Fresh data from server',
        timestamp: new Date().toISOString(),
        online: true
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

interface Env {
  // Define your environment variables here if needed
}

function getMainHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline-First App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .status {
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-weight: bold;
        }
        .online { background: #d4edda; color: #155724; }
        .offline { background: #f8d7da; color: #721c24; }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #0056b3; }
        #content {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .update-banner {
            background: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Offline-First App</h1>
        
        <div id="status" class="status">
            <span id="connection-status">Checking connection...</span>
        </div>
        
        <div class="update-banner" id="update-banner">
            📱 New version available! 
            <button onclick="updateApp()">Update Now</button>
        </div>
        
        <div>
            <button onclick="fetchData()">Fetch Data</button>
            <button onclick="clearCache()">Clear Cache</button>
            <button onclick="toggleOffline()">Simulate Offline</button>
        </div>
        
        <div id="content">
            <p>This app works offline! Try:</p>
            <ul>
                <li>Disable your internet connection</li>
                <li>Refresh the page - it should still work</li>
                <li>The app will show cached content when offline</li>
                <li>When back online, fresh content will be fetched</li>
            </ul>
        </div>
        
        <div id="data-display"></div>
        
        <footer>
            <small>Last updated: <span id="last-updated">Never</span></small>
        </footer>
    </div>

    <script>
        let isOnline = navigator.onLine;
        let serviceWorker = null;
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                    serviceWorker = registration;
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateBanner();
                            }
                        });
                    });
                })
                .catch(err => console.log('SW registration failed:', err));
                
            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data.type === 'CACHE_UPDATED') {
                    showUpdateBanner();
                }
            });
        }
        
        // Update connection status
        function updateConnectionStatus() {
            const statusEl = document.getElementById('connection-status');
            const statusContainer = document.getElementById('status');
            
            if (isOnline) {
                statusEl.textContent = '🟢 Online - Fresh content available';
                statusContainer.className = 'status online';
            } else {
                statusEl.textContent = '🔴 Offline - Showing cached content';
                statusContainer.className = 'status offline';
            }
        }
        
        // Fetch data from API
        async function fetchData() {
            const display = document.getElementById('data-display');
            display.innerHTML = '<p>Loading...</p>';
            
            try {
                const response = await fetch('/api/data');
                const data = await response.json();
                display.innerHTML = \`
                    <h3>📊 Data:</h3>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
                document.getElementById('last-updated').textContent = new Date().toLocaleString();
            } catch (error) {
                display.innerHTML = \`
                    <h3>⚠️ Offline Data:</h3>
                    <p>Unable to fetch fresh data. You're probably offline.</p>
                    <p>Error: \${error.message}</p>
                \`;
            }
        }
        
        // Clear cache
        async function clearCache() {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
                alert('Cache cleared! Refresh to see changes.');
            }
        }
        
        // Simulate offline mode
        function toggleOffline() {
            isOnline = !isOnline;
            updateConnectionStatus();
        }
        
        // Show update banner
        function showUpdateBanner() {
            document.getElementById('update-banner').style.display = 'block';
        }
        
        // Update app
        function updateApp() {
            if (serviceWorker && serviceWorker.waiting) {
                serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
        }
        
        // Event listeners
        window.addEventListener('online', () => {
            isOnline = true;
            updateConnectionStatus();
            fetchData(); // Auto-fetch when coming back online
        });
        
        window.addEventListener('offline', () => {
            isOnline = false;
            updateConnectionStatus();
        });
        
        // Initialize
        updateConnectionStatus();
        fetchData();
    </script>
</body>
</html>`;
}

function getServiceWorkerCode(): string {
  return `
const CACHE_NAME = 'offline-app-v1';
const OFFLINE_URL = '/offline.html';

const CACHE_URLS = [
  '/',
  '/offline.html',
  // Add other static assets you want to cache
];

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('SW Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('SW Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If online, cache the response and return it
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // If offline, try cache first, then offline page
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline API response
              return new Response(JSON.stringify({
                message: 'Cached offline data',
                timestamp: new Date().toISOString(),
                online: false,
                cached: true
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseClone));
            return response;
          });
      })
  );
});

// Handle skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
`;
}

function getOfflineHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Offline</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        h1 { color: #721c24; }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>It looks like you've lost your internet connection. Don't worry, you can still browse cached content!</p>
        <p>This page will automatically refresh when your connection is restored.</p>
        <button onclick="window.location.reload()">Try Again</button>
    </div>
    
    <script>
        // Auto-reload when back online
        window.addEventListener('online', () => {
            window.location.reload();
        });
    </script>
</body>
</html>`;
}
