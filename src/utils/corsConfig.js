// CORS Configuration for Production Security

export const getCorsOrigins = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;
  
  if (!allowedOrigins) {
    // Development fallback
    if (process.env.NODE_ENV === 'development') {
      return ['http://localhost:3000', 'http://localhost:3001'];
    }
    
    console.warn('⚠️  ALLOWED_ORIGINS not set. Using restrictive defaults.');
    return [];
  }
  
  return allowedOrigins.split(',').map(origin => origin.trim());
};

export const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export const applyCorsHeaders = (res, origin = null) => {
  const allowedOrigins = getCorsOrigins();
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'development') {
    // Development mode with no restrictions only if explicitly no origins set
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Apply other CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};