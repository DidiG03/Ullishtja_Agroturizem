// Server-side admin authentication.
// Verifies the Clerk session token sent as `Authorization: Bearer <jwt>` and
// checks the user ID against ADMIN_USER_IDS (comma-separated, server-only env var).
// Fails closed: if ADMIN_USER_IDS or CLERK_SECRET_KEY is missing, nobody is admin.

import { verifyToken } from '@clerk/backend';

function getAdminUserIds() {
  return (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/** Returns the admin's Clerk user ID, or null. Never writes a response. */
export async function getAdminUserId(req) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const adminIds = getAdminUserIds();
  if (!secretKey || adminIds.length === 0) return null;

  const header = req.headers?.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;

  try {
    const payload = await verifyToken(match[1], { secretKey });
    return payload?.sub && adminIds.includes(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Sends 401/403 and returns null unless the request comes from an admin. */
export async function requireAdmin(req, res) {
  const userId = await getAdminUserId(req);
  if (userId) return userId;

  const hasToken = /^Bearer\s+\S+/i.test(req.headers?.authorization || '');
  const status = hasToken ? 403 : 401;
  res.status(status).json({
    success: false,
    error: status === 401 ? 'Authentication required' : 'Admin access required',
  });
  return null;
}
