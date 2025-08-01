class IntelligentVideoPreloader {
  constructor() {
    this.preloadedVideos = new Map();
    this.preloadQueue = [];
    this.isPreloading = false;
    this.networkInfo = this.getNetworkInfo();
    this.deviceInfo = this.getDeviceInfo();
    this.userBehavior = this.getUserBehavior();
    
    // Monitor network changes
    this.setupNetworkMonitoring();
    
    // Preload critical videos on initialization
    this.preloadCriticalVideos();
  }

  getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      };
    }

    return {
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false
    };
  }

  getDeviceInfo() {
    const width = window.innerWidth;
    const memory = navigator.deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    return {
      isMobile: width <= 768,
      isTablet: width > 768 && width <= 1024,
      isDesktop: width > 1024,
      memory,
      hardwareConcurrency,
      isLowPower: hardwareConcurrency <= 2 || memory <= 2,
      pixelRatio: window.devicePixelRatio || 1
    };
  }

  getUserBehavior() {
    // Get user behavior patterns from localStorage or set defaults
    const stored = localStorage.getItem('video_user_behavior');
    const defaults = {
      averageViewTime: 30000, // 30 seconds
      scrollSpeed: 'medium',
      interactionPatterns: [],
      preferredQuality: 'auto',
      batteryOptimization: false
    };

    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  }

  setupNetworkMonitoring() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', () => {
        this.networkInfo = this.getNetworkInfo();
        this.adjustPreloadingStrategy();
      });
    }

    // Monitor battery status
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        const updateBatteryInfo = () => {
          this.userBehavior.batteryOptimization = battery.level < 0.2 || !battery.charging;
        };
        
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);
        updateBatteryInfo();
      });
    }
  }

  adjustPreloadingStrategy() {
    const { effectiveType, saveData, downlink } = this.networkInfo;
    const { isLowPower } = this.deviceInfo;
    const { batteryOptimization } = this.userBehavior;

    // Clear preload queue if conditions are poor
    if (saveData || batteryOptimization || effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.preloadQueue = [];
      return;
    }

    // Adjust preloading aggressiveness based on network quality
    if (effectiveType === '3g' || downlink < 5 || isLowPower) {
      // Conservative preloading
      this.preloadQueue = this.preloadQueue.slice(0, 2);
    }
  }

  getOptimalVideoSource(videoId, priority = 'normal') {
    const { isMobile, isTablet, isDesktop, isLowPower } = this.deviceInfo;
    const { effectiveType, downlink, saveData } = this.networkInfo;
    const { batteryOptimization } = this.userBehavior;

    // Determine optimal quality
    let quality = 'mobile';
    if (isTablet && !isLowPower && !saveData) quality = 'tablet';
    if (isDesktop && !batteryOptimization && downlink > 5) quality = 'desktop';

    // Downgrade for poor network conditions
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      quality = 'mobile';
    } else if (effectiveType === '3g' && quality === 'desktop') {
      quality = 'tablet';
    }

    // Determine optimal format
    const video = document.createElement('video');
    const supportsWebM = video.canPlayType('video/webm') !== '';
    const supportsAV1 = video.canPlayType('video/webm; codecs="av01.0.05M.08"') !== '';

    let format = 'mp4';
    if (supportsWebM && downlink > 2) format = 'webm';
    if (supportsAV1 && downlink > 5 && !isLowPower && priority === 'high') format = 'av1';

    return {
      src: `/videos/${videoId}-${quality}.${format === 'av1' ? 'av1.mp4' : format}`,
      quality,
      format,
      poster: `/videos/${videoId}-poster.jpg`
    };
  }

  async preloadVideo(videoId, priority = 'normal') {
    // Check if already preloaded
    if (this.preloadedVideos.has(videoId)) {
      return this.preloadedVideos.get(videoId);
    }

    // Check if we should preload based on current conditions
    if (!this.shouldPreload(priority)) {
      return null;
    }

    const videoSource = this.getOptimalVideoSource(videoId, priority);
    
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      // Create a promise that resolves when video is ready
      const preloadPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Preload timeout'));
        }, 10000); // 10 second timeout

        video.addEventListener('loadedmetadata', () => {
          clearTimeout(timeoutId);
          resolve({
            video,
            source: videoSource,
            preloadedAt: Date.now()
          });
        }, { once: true });

        video.addEventListener('error', (event) => {
          clearTimeout(timeoutId);
          const errorMsg = event.target.error 
            ? `Video preload failed: ${event.target.error.message}` 
            : `Video preload failed for ${videoSource.src}`;
          reject(new Error(errorMsg));
        }, { once: true });
      });

      video.src = videoSource.src;
      
      const result = await preloadPromise;
      this.preloadedVideos.set(videoId, result);
      
      // Clean up old preloaded videos if memory is getting full
      this.cleanupOldPreloads();
      
      return result;
    } catch (error) {
      console.warn(`Failed to preload video ${videoId}:`, error.message);
      // Don't throw error, just return null to prevent blocking other preloads
      return null;
    }
  }

  shouldPreload(priority) {
    const { effectiveType, saveData, downlink } = this.networkInfo;
    const { isLowPower } = this.deviceInfo;
    const { batteryOptimization } = this.userBehavior;

    // Never preload on data saver mode or very poor connections
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return false;
    }

    // Don't preload on low battery
    if (batteryOptimization) {
      return priority === 'high';
    }

    // Conservative preloading on low-power devices
    if (isLowPower) {
      return priority === 'high' && downlink > 2;
    }

    // Liberal preloading on good connections
    if (effectiveType === '4g' && downlink > 5) {
      return true;
    }

    // Medium preloading on decent connections
    if (effectiveType === '3g' || downlink > 2) {
      return priority !== 'low';
    }

    return false;
  }

  cleanupOldPreloads() {
    const maxPreloads = this.deviceInfo.isLowPower ? 3 : 6;
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    // Convert to array for sorting
    const preloads = Array.from(this.preloadedVideos.entries());
    
    // Remove old preloads
    preloads.forEach(([videoId, data]) => {
      if (now - data.preloadedAt > maxAge) {
        this.preloadedVideos.delete(videoId);
        if (data.video) {
          data.video.src = '';
          data.video.load();
        }
      }
    });

    // If still too many, remove oldest
    if (this.preloadedVideos.size > maxPreloads) {
      const sortedPreloads = preloads
        .sort((a, b) => a[1].preloadedAt - b[1].preloadedAt)
        .slice(0, this.preloadedVideos.size - maxPreloads);

      sortedPreloads.forEach(([videoId, data]) => {
        this.preloadedVideos.delete(videoId);
        if (data.video) {
          data.video.src = '';
          data.video.load();
        }
      });
    }
  }

  async preloadCriticalVideos() {
    // Define critical videos that should be preloaded immediately
    const criticalVideos = [
      'dji-20240806130059-0020-d', // Hero video
      'dji-20240806130609-0022-d'  // Most viewed video
    ];

    // Only preload if conditions are good
    if (!this.shouldPreload('normal')) {
      return;
    }

    // Preload critical videos with high priority
    const preloadPromises = criticalVideos.map(async (videoId) => {
      try {
        return await this.preloadVideo(videoId, 'high');
      } catch (error) {
        console.warn(`Failed to preload critical video ${videoId}:`, error.message);
        return null;
      }
    });

    try {
      await Promise.allSettled(preloadPromises);
    } catch (error) {
      console.warn('Some critical videos failed to preload:', error);
    }
  }

  // Method to intelligently preload based on scroll position and user behavior
  async preloadOnScroll(visibleVideoIds, upcomingVideoIds) {
    if (!this.shouldPreload('normal')) {
      return;
    }

    // Preload upcoming videos based on scroll direction and speed
    const promises = upcomingVideoIds.slice(0, 2).map(videoId => 
      this.preloadVideo(videoId, 'normal')
    );

    await Promise.allSettled(promises);
  }

  // Get preloaded video if available
  getPreloadedVideo(videoId) {
    return this.preloadedVideos.get(videoId);
  }

  // Track user interaction patterns for better prediction
  trackUserInteraction(eventType, videoId, data = {}) {
    const interaction = {
      timestamp: Date.now(),
      eventType,
      videoId,
      ...data
    };

    this.userBehavior.interactionPatterns.push(interaction);

    // Keep only recent interactions (last 100)
    if (this.userBehavior.interactionPatterns.length > 100) {
      this.userBehavior.interactionPatterns = this.userBehavior.interactionPatterns.slice(-100);
    }

    // Save to localStorage
    localStorage.setItem('video_user_behavior', JSON.stringify(this.userBehavior));
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      preloadedCount: this.preloadedVideos.size,
      networkType: this.networkInfo.effectiveType,
      deviceType: this.deviceInfo.isMobile ? 'mobile' : this.deviceInfo.isTablet ? 'tablet' : 'desktop',
      batteryOptimization: this.userBehavior.batteryOptimization,
      memoryUsage: this.preloadedVideos.size * 0.5 // Estimated MB per preloaded video
    };
  }
}

// Create singleton instance
const intelligentVideoPreloader = new IntelligentVideoPreloader();

export default intelligentVideoPreloader; 