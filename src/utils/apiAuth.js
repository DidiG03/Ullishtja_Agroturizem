// Attaches the Clerk session token to same-origin /api requests so the server can
// verify admin access. The token getter is registered by the admin Dashboard.

let tokenGetter = null;

export function setApiTokenGetter(getter) {
  tokenGetter = getter;
}

export async function getApiAuthHeader() {
  if (!tokenGetter) return {};
  try {
    const token = await tokenGetter();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function isApiUrl(input) {
  try {
    const raw = typeof input === 'string' ? input : input?.url;
    const url = new URL(raw, window.location.href);
    const apiOrigin = process.env.REACT_APP_API_URL
      ? new URL(process.env.REACT_APP_API_URL, window.location.href).origin
      : 'http://localhost:3001';
    return (
      url.pathname.startsWith('/api/') &&
      (url.origin === window.location.origin || url.origin === apiOrigin)
    );
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined' && !window.__apiAuthFetchInstalled) {
  window.__apiAuthFetchInstalled = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    if (!tokenGetter || !isApiUrl(input)) return originalFetch(input, init);
    const authHeader = await getApiAuthHeader();
    if (!authHeader.Authorization) return originalFetch(input, init);
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) headers.set('Authorization', authHeader.Authorization);
    return originalFetch(input, { ...init, headers });
  };
}
