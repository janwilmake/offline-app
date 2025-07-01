## How it works:

1. **Service Worker Registration**: The main page registers a service worker that intercepts all network requests
2. **Caching Strategy**:
   - Static assets are cached on install
   - API responses are cached when successful
   - Navigation requests use network-first, then cache fallback
3. **Offline Handling**: When offline, serves cached content or a custom offline page
4. **Update Mechanism**: Detects when new versions are available and prompts users to update

## Key Features:

- ✅ **Fully functional offline** - cached content loads instantly
- ✅ **Automatic updates** when online
- ✅ **Network-first strategy** for fresh content when available
- ✅ **Visual offline/online indicators**
- ✅ **Update notifications** when new versions are deployed
- ✅ **TypeScript support** with proper types

Deploy this to Cloudflare Workers and visit the site. After the first load, it will work completely offline, just like X.com!

After this I also made this into a simplified library that just makes your worker offline-capable: https://github.com/janwilmake/make-offline
