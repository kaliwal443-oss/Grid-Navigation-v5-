



const APP_SHELL_CACHE_NAME = 'grid-nav-app-shell-v1';
const MAP_TILES_CACHE_NAME = 'grid-nav-map-tiles-v1';

const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/metadata.json',
  '/components/ARPage.tsx',
  '/components/BottomNav.tsx',
  '/components/CompassPage.tsx',
  '/components/DrawingTools.tsx',
  '/components/EditableImageOverlay.tsx',
  '/components/GpsSatellitePage.tsx',
  '/components/IndianGrid.tsx',
  '/components/MapLayerControl.tsx',
  '/components/MapPage.tsx',
  '/components/MarkedPointsDisplay.tsx',
  '/components/MarkedPointsPanel.tsx',
  '/components/MeasurementDisplay.tsx',
  '/components/NavigationDisplay.tsx',
  '/components/NorthArrow.tsx',
  '/components/OfflineMapDownloader.tsx',
  '/components/ScaleBar.tsx',
  '/components/SettingsMenu.tsx',
  '/components/SunMoonPage.tsx',
  '/components/UTMGrid.tsx',
  '/hooks/useDeviceOrientation.ts',
  '/hooks/useGeolocation.ts',
  '/hooks/useMapViewPersistence.ts',
  '/hooks/useOfflineMaps.ts',
  '/hooks/useWaypoints.ts',
  '/services/astroService.ts',
  '/services/coordService.ts',
  '/services/mapUtils.ts',
  '/services/measurementService.ts',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.11.0/proj4.js',
  'https://aistudiocdn.com/lucide-react@^0.552.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/react@^19.2.0/',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-leaflet@^5.0.0',
  'https://aistudiocdn.com/leaflet@^1.9.4'
];

const TILE_URL_PATTERNS = [
  'https://{s}.tile.opentopomap.org',
  'https://{s}.tile.openstreetmap.org',
  'https://{s}.basemaps.cartocdn.com/dark_all',
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE_NAME).then((cache) => {
      console.log('Opened app shell cache');
      // Use addAll with a new Request object with no-cache to ensure fresh files are fetched on update.
      const requests = APP_SHELL_URLS.map(url => new Request(url, {cache: 'no-cache'}));
      return cache.addAll(requests).catch(err => {
        console.error('Failed to cache app shell files:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [APP_SHELL_CACHE_NAME, MAP_TILES_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DELETE_TILES') {
    const { urls } = event.data;
    if (!urls || urls.length === 0) return;

    event.waitUntil(
      caches.open(MAP_TILES_CACHE_NAME).then((cache) => {
        console.log(`SW: Deleting ${urls.length} tiles from cache.`);
        const deletePromises = urls.map(url => cache.delete(url));
        return Promise.all(deletePromises).then(() => {
          console.log('SW: Tile deletion complete.');
        });
      }).catch(err => {
        console.error('SW: Error deleting tiles from cache:', err);
      })
    );
  }
});


self.addEventListener('fetch', (event) => {
  // Use URL to check for map tile patterns, supporting subdomains properly.
  const url = new URL(event.request.url);
  const isMapTile = TILE_URL_PATTERNS.some(pattern => {
    const patternHostname = pattern.split('//')[1].split('/')[0];
    return url.hostname.endsWith(patternHostname.replace('{s}.', ''));
  });

  if (isMapTile) {
    event.respondWith(
      caches.open(MAP_TILES_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        // Always try to fetch from network first to get fresh tiles if online.
        // If network fails, fall back to cache. This is a stale-while-revalidate approach for tiles.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // For app shell files, use a cache-first strategy.
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});