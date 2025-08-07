// Video Service Worker for Aggressive Caching and Mobile Optimization
const CACHE_NAME = 'ullishtja-videos-v2';
const VIDEO_CACHE_NAME = 'ullishtja-videos-cache-v2';
const POSTER_CACHE_NAME = 'ullishtja-posters-v2';

// Video files that should be cached aggressively
const CRITICAL_VIDEOS = [
  '/videos/dji-20240806130059-0020-d-mobile.webm',
  '/videos/dji-20240806130059-0020-d-mobile.mp4',
  '/videos/dji-20240806130609-0022-d-mobile.webm',
  '/videos/dji-20240806130609-0022-d-mobile.mp4'
];

// All poster images for instant loading
const POSTER_IMAGES = [
  '/videos/dji-20240806130059-0020-d-poster.jpg',
  '/videos/dji-20240806130609-0022-d-poster.jpg'
];

// Utility functions
const isMobile = () => {
  return self.navigator.userAgent.includes('Mobile') || 
         self.navigator.userAgent.includes('Android') ||
         self.navigator.userAgent.includes('iPhone');
};

const getNetworkType = () => {
  const connection = self.navigator.connection || 
                    self.navigator.mozConnection || 
                    self.navigator.webkitConnection;
  
  if (!connection) return 'unknown';
  return connection.effectiveType || 'unknown';
};

const isVideoRequest = (url) => {
  return url.includes('/videos/') && 
         (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.av1.mp4'));
};

const isPosterRequest = (url) => {
  return url.includes('/videos/') && url.endsWith('-poster.jpg');
};

// Install event - cache critical resources
self.addEventListener('install', event => {
  
  event.waitUntil(
    Promise.all([
      // Cache critical videos for mobile
      caches.open(VIDEO_CACHE_NAME).then(cache => {
        if (isMobile()) {
          return cache.addAll(CRITICAL_VIDEOS.filter(url => 
            url.includes('mobile') // Only mobile versions for mobile devices
          ));
        }
        return Promise.resolve();
      }),
      
      // Cache all poster images (they're small and critical)
      caches.open(POSTER_CACHE_NAME).then(cache => {
        return cache.addAll(POSTER_IMAGES);
      })
    ]).then(() => {
      self.skipWaiting(); // Force activation
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old video caches
          if (cacheName.startsWith('ullishtja-videos') && 
              cacheName !== VIDEO_CACHE_NAME && 
              cacheName !== POSTER_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - handle video requests with intelligent caching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle video and poster requests
  if (!isVideoRequest(url.pathname) && !isPosterRequest(url.pathname)) {
    return;
  }

  event.respondWith(handleVideoRequest(event.request));
});

async function handleVideoRequest(request) {
  const url = new URL(request.url);
  const isVideo = isVideoRequest(url.pathname);
  const isPoster = isPosterRequest(url.pathname);
  const cacheName = isPoster ? POSTER_CACHE_NAME : VIDEO_CACHE_NAME;
  
  try {
    // For range requests (video seeking), we need special handling
    if (request.headers.get('range') && isVideo) {
      return handleRangeRequest(request);
    }

    // Check cache first
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    // Network request with optimizations
    const networkResponse = await fetchWithOptimizations(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Cache the response for future use
      await cacheVideoResponse(cache, request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Video SW: Error handling request:', error);
    
    // Fallback to cache if network fails
    const cache = await caches.open(cacheName);
    const fallbackResponse = await cache.match(request);
    
    if (fallbackResponse) {
      return fallbackResponse;
    }
    
    // Ultimate fallback for videos - return a minimal error response
    if (isVideo) {
      return new Response('Video unavailable', { 
        status: 503, 
        statusText: 'Service Unavailable' 
      });
    }
    
    throw error;
  }
}

async function handleRangeRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(VIDEO_CACHE_NAME);
  
  // Try to get the full video from cache
  const fullVideoRequest = new Request(request.url, {
    method: 'GET',
    headers: {} // Remove range header to get full video
  });
  
  const cachedVideo = await cache.match(fullVideoRequest);
  
  if (cachedVideo) {
    // Serve range from cached video
    const rangeHeader = request.headers.get('range');
    return serveRangeFromCache(cachedVideo, rangeHeader);
  }
  
  // Fallback to network for range requests
  return fetch(request);
}

async function serveRangeFromCache(cachedResponse, rangeHeader) {
  const videoBuffer = await cachedResponse.arrayBuffer();
  const totalLength = videoBuffer.byteLength;
  
  if (!rangeHeader) {
    return new Response(videoBuffer, {
      status: 200,
      headers: {
        'Content-Type': cachedResponse.headers.get('Content-Type'),
        'Content-Length': totalLength.toString(),
        'Accept-Ranges': 'bytes'
      }
    });
  }
  
  // Parse range header (e.g., "bytes=0-1023")
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) {
    return new Response(videoBuffer, { status: 200 });
  }
  
  const start = parseInt(match[1]);
  const end = match[2] ? parseInt(match[2]) : totalLength - 1;
  const rangeLength = end - start + 1;
  
  const rangeBuffer = videoBuffer.slice(start, end + 1);
  
  return new Response(rangeBuffer, {
    status: 206,
    headers: {
      'Content-Type': cachedResponse.headers.get('Content-Type'),
      'Content-Length': rangeLength.toString(),
      'Content-Range': `bytes ${start}-${end}/${totalLength}`,
      'Accept-Ranges': 'bytes'
    }
  });
}

async function fetchWithOptimizations(request) {
  const networkType = getNetworkType();
  const isSlowNetwork = networkType === 'slow-2g' || networkType === '2g' || networkType === '3g';
  
  // Set timeout based on network speed
  const timeoutMs = isSlowNetwork ? 30000 : 15000; // 30s for slow networks, 15s for fast
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(request, {
      signal: controller.signal,
      // Add cache control for better performance
      cache: 'force-cache'
    });
    
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function cacheVideoResponse(cache, request, response) {
  const url = new URL(request.url);
  const isVideo = isVideoRequest(url.pathname);
  const isPoster = isPosterRequest(url.pathname);
  
  try {
    // Always cache posters (they're small)
    if (isPoster) {
      await cache.put(request, response);
      return;
    }
    
    // For videos, implement intelligent caching
    if (isVideo) {
      const networkType = getNetworkType();
      const isCritical = CRITICAL_VIDEOS.some(criticalUrl => 
        url.pathname.includes(criticalUrl.split('/').pop())
      );
      
      // Cache mobile videos more aggressively
      const shouldCache = isMobile() && 
                         (url.pathname.includes('mobile') || 
                          url.pathname.includes('poster') ||
                          isCritical);
      
      // Cache desktop videos only on fast networks
      const shouldCacheDesktop = !isMobile() && 
                                 networkType === '4g' &&
                                 !url.pathname.includes('desktop'); // Skip large desktop videos
      
      if (shouldCache || shouldCacheDesktop) {
        await cache.put(request, response);
        
        // Manage cache size
        await manageCacheSize();
      }
    }
    
  } catch (error) {
    console.error('Video SW: Error caching response:', error);
  }
}

async function manageCacheSize() {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  const requests = await cache.keys();
  
  // Limit cache to reasonable size (adjust based on device)
  const maxVideos = isMobile() ? 10 : 20;
  
  if (requests.length > maxVideos) {
    // Remove oldest cached videos (simple FIFO)
    const videosToRemove = requests.slice(0, requests.length - maxVideos);
    
    for (const request of videosToRemove) {
      await cache.delete(request);
    }
    
  }
}

// Background sync for preloading videos
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PRELOAD_VIDEO') {
    const { videoId, priority } = event.data;
    preloadVideo(videoId, priority);
  }
  
  if (event.data && event.data.type === 'CLEAR_VIDEO_CACHE') {
    clearVideoCache();
  }
});

async function preloadVideo(videoId, priority = 'normal') {
  // Only preload on good network conditions
  const networkType = getNetworkType();
  if (networkType === 'slow-2g' || networkType === '2g') {
    return;
  }
  
  const cache = await caches.open(VIDEO_CACHE_NAME);
  const quality = isMobile() ? 'mobile' : 'tablet';
  const format = 'webm'; // Prefer WebM for better compression
  
  const videoUrl = `/videos/${videoId}-${quality}.${format}`;
  const posterUrl = `/videos/${videoId}-poster.jpg`;
  
  try {
    // Check if already cached
    const cachedVideo = await cache.match(videoUrl);
    if (cachedVideo) {
      return;
    }
    
    
    // Preload video and poster
    const [videoResponse, posterResponse] = await Promise.allSettled([
      fetch(videoUrl),
      fetch(posterUrl)
    ]);
    
    if (videoResponse.status === 'fulfilled' && videoResponse.value.ok) {
      await cache.put(videoUrl, videoResponse.value);
    }
    
    if (posterResponse.status === 'fulfilled' && posterResponse.value.ok) {
      const posterCache = await caches.open(POSTER_CACHE_NAME);
      await posterCache.put(posterUrl, posterResponse.value);
    }
    
  } catch (error) {
    console.error('Video SW: Error preloading video:', error);
  }
}

async function clearVideoCache() {
  try {
    await caches.delete(VIDEO_CACHE_NAME);
    await caches.delete(POSTER_CACHE_NAME);
  } catch (error) {
    console.error('Video SW: Error clearing cache:', error);
  }
} 