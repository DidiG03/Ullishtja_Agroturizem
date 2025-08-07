// Simple rate limiter for API endpoints

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    
    // Ensure cleanup happens on process exit to prevent memory leaks
    if (typeof window === 'undefined') {
      process.on('exit', () => this.destroy());
      process.on('SIGINT', () => this.destroy());
      process.on('SIGTERM', () => this.destroy());
    }
  }

  isRateLimited(ip, endpoint = 'default') {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = this.getMaxRequests(endpoint);

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.requests.set(key, validRequests);

    // Check if rate limit exceeded
    if (validRequests.length >= maxRequests) {
      return {
        limited: true,
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      };
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    return { limited: false };
  }

  getMaxRequests(endpoint) {
    const limits = {
      'reservations': 5,    // 5 reservations per 15 minutes
      'contact': 3,         // 3 contact form submissions per 15 minutes
      'reviews': 2,         // 2 review submissions per 15 minutes
      'default': 100        // 100 general requests per 15 minutes
    };

    return limits[endpoint] || limits.default;
  }

  cleanup() {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Clean up on browser unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    rateLimiter.destroy();
  });
}

export const checkRateLimit = (req, res, endpoint = 'default') => {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const result = rateLimiter.isRateLimited(ip, endpoint);

  if (result.limited) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter
    });
    return false;
  }

  return true;
};

export default rateLimiter;