/**
 * Helpers for running Clerk on localhost vs production.
 * Production keys (pk_live_...) only work on the deployed domain.
 */

const PLACEHOLDER_PATTERNS = [
  'your_publishable_key',
  'PASTE_YOUR',
  'pk_test_your',
  'pk_live_your',
];

export const CLERK_LOCALHOST_HELP =
  'You are using production Clerk keys on localhost. Add pk_test_ and sk_test_ keys from the Clerk Development instance to .env.local as REACT_APP_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, then restart the dev server.';

export function isClerkKeyPlaceholder(key) {
  if (!key || typeof key !== 'string') {
    return true;
  }
  const trimmed = key.trim();
  if (!trimmed) {
    return true;
  }
  // Valid Clerk publishable keys start with pk_test_ or pk_live_
  if (!trimmed.startsWith('pk_test_') && !trimmed.startsWith('pk_live_')) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function isClerkProductionKey(key) {
  return typeof key === 'string' && key.trim().startsWith('pk_live_');
}

export function isLocalhost() {
  if (typeof window === 'undefined') {
    return false;
  }
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function isClerkProductionOnLocalhost() {
  const key = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
  return isLocalhost() && isClerkProductionKey(key);
}
