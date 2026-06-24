// Security Headers for Production
// Keep Content-Security-Policy in sync with vercel.json headers for /(.*)

const productionCsp =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com https://*.clerk.accounts.dev https://clerk.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https: blob:; media-src 'self' blob:; connect-src 'self' https:; frame-src 'self' https://www.google.com https://maps.google.com https://accounts.google.com https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; upgrade-insecure-requests";

export const securityHeaders = {
  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Content Security Policy (restrictive but functional)
  'Content-Security-Policy': process.env.NODE_ENV === 'production'
    ? productionCsp
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http: https: ws: wss:;",
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

export const applySecurityHeaders = (res) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

export const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
};