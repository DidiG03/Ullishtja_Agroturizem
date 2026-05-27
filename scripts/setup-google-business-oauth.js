#!/usr/bin/env node
/**
 * One-time setup helper for Google Business Profile reviews.
 *
 * Prerequisites:
 * 1. Enable "Google Business Profile API" in Google Cloud Console
 * 2. Create OAuth client (Desktop app recommended for this script)
 * 3. Add test user on OAuth consent screen (your Google account)
 *
 * Usage:
 *   node scripts/setup-google-business-oauth.js
 *   (reads GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET from .env)
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const readline = require('readline');
const http = require('http');
const { URL } = require('url');

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_PORT = parseInt(process.env.OAUTH_REDIRECT_PORT || '8765', 10);
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
].join(' ');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function exchangeCodeForTokens(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }
  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(label, fetchFn, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchFn();
    } catch (error) {
      const isQuotaError = /quota exceeded|rate limit|429/i.test(error.message);
      if (!isQuotaError || attempt === maxAttempts) {
        throw error;
      }

      const waitSeconds = attempt * 20;
      console.warn(`${label} hit rate limit. Retrying in ${waitSeconds}s (${attempt}/${maxAttempts})...`);
      await sleep(waitSeconds * 1000);
    }
  }

  throw new Error(`${label} failed after ${maxAttempts} attempts`);
}

async function getAccessTokenFromRefreshToken(refreshToken) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh access token');
  }

  return data.access_token;
}

async function fetchAccounts(accessToken) {
  const response = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to list accounts (${response.status})`);
  }
  return data.accounts || [];
}

async function fetchAccountsLegacy(accessToken) {
  const response = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to list accounts (${response.status})`);
  }

  return (data.accounts || []).map((account) => ({
    accountName: account.name,
    label: account.accountName || account.name,
  }));
}

async function fetchLocations(accessToken, accountName) {
  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storeCode`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to list locations (${response.status})`);
  }
  return data.locations || [];
}

async function fetchLocationsLegacy(accessToken, accountName) {
  const accountId = accountName.replace('accounts/', '');
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountName}/locations`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to list locations (${response.status})`);
  }

  return (data.locations || []).map((location) => ({
    name: location.name || `accounts/${accountId}/locations/${location.locationKey?.locationId}`,
    title: location.locationName || location.name,
  }));
}

async function listAccounts(accessToken) {
  try {
    return await fetchWithRetry('Account lookup', () => fetchAccounts(accessToken));
  } catch (primaryError) {
    console.warn(`Primary account API failed: ${primaryError.message}`);
    console.warn('Trying legacy Business Profile API...');
    return fetchWithRetry('Legacy account lookup', () => fetchAccountsLegacy(accessToken));
  }
}

async function listLocations(accessToken, accountName) {
  try {
    return await fetchWithRetry('Location lookup', () => fetchLocations(accessToken, accountName));
  } catch (primaryError) {
    console.warn(`Primary location API failed: ${primaryError.message}`);
    console.warn('Trying legacy Business Profile API...');
    return fetchWithRetry('Legacy location lookup', () => fetchLocationsLegacy(accessToken, accountName));
  }
}

function printEnvValues(refreshToken, accountId, locationId) {
  console.log('\n========================================');
  console.log('Add these to your .env and Vercel:');
  console.log('========================================\n');
  console.log(`GOOGLE_OAUTH_CLIENT_ID=${CLIENT_ID}`);
  console.log(`GOOGLE_OAUTH_CLIENT_SECRET=${CLIENT_SECRET}`);
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken || 'MISSING — re-run with prompt=consent'}`);
  console.log(`GOOGLE_BUSINESS_ACCOUNT_ID=${accountId || 'MISSING'}`);
  console.log(`GOOGLE_BUSINESS_LOCATION_ID=${locationId || 'MISSING'}`);
  console.log('GOOGLE_REVIEWS_MAX=50');
  console.log('\nRestart your dev server after updating .env.');
}

async function finishSetup(accessToken, refreshToken) {
  console.log('\nSave this refresh token now (in case account lookup fails):');
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${refreshToken || 'MISSING'}\n`);

  console.log('Fetching business accounts...');
  const accounts = await listAccounts(accessToken);

  if (!accounts.length) {
    console.error('No Google Business accounts found for this Google user.');
    printEnvValues(refreshToken, null, null);
    process.exit(1);
  }

  console.log('\nAccounts:');
  accounts.forEach((account, index) => {
    console.log(`  [${index}] ${account.label || account.accountName} — ${account.accountName}`);
  });

  let accountIndex = 0;
  if (accounts.length > 1) {
    const picked = await ask(`\nWhich account? (0-${accounts.length - 1}, default 0): `);
    accountIndex = picked ? parseInt(picked, 10) : 0;
  }

  const account = accounts[accountIndex];
  const { accountId } = parseResourceIds(account.accountName);

  console.log('\nFetching locations...');
  const locations = await listLocations(accessToken, account.accountName);

  if (!locations.length) {
    console.error('No locations found for this account.');
    printEnvValues(refreshToken, accountId, null);
    process.exit(1);
  }

  console.log('\nLocations:');
  locations.forEach((location, index) => {
    console.log(`  [${index}] ${location.title || location.name} — ${location.name}`);
  });

  let locationIndex = 0;
  if (locations.length > 1) {
    const picked = await ask(`\nWhich location? (0-${locations.length - 1}, default 0): `);
    locationIndex = picked ? parseInt(picked, 10) : 0;
  }

  const location = locations[locationIndex];
  const { locationId } = parseResourceIds(location.name);

  printEnvValues(refreshToken, accountId, locationId);
}

function waitForAuthCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      if (error) {
        res.end(`<h1>Authorization failed</h1><p>${error}</p><p>You can close this tab.</p>`);
        server.close();
        reject(new Error(error));
        return;
      }

      res.end('<h1>Success!</h1><p>Authorization complete. You can close this tab and return to the terminal.</p>');
      server.close();
      resolve(code);
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`\nListening for OAuth callback on ${REDIRECT_URI}\n`);
    });

    server.on('error', reject);
  });
}

function parseResourceIds(resourceName) {
  const accountMatch = resourceName.match(/accounts\/([^/]+)/);
  const locationMatch = resourceName.match(/locations\/([^/]+)/);
  return {
    accountId: accountMatch?.[1] || null,
    locationId: locationMatch?.[1] || null,
  };
}

async function main() {
  const fetchIdsOnly = process.argv.includes('--fetch-ids');
  console.log('Google Business Profile — OAuth setup\n');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET.');
    process.exit(1);
  }

  if (fetchIdsOnly) {
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    if (!refreshToken) {
      console.error('Missing GOOGLE_OAUTH_REFRESH_TOKEN in .env');
      process.exit(1);
    }

    console.log('Using existing refresh token to fetch account/location IDs...\n');
    const accessToken = await getAccessTokenFromRefreshToken(refreshToken);
    await finishSetup(accessToken, refreshToken);
    return;
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');

  const useManual = (await ask('Type "manual" to paste a code, or press Enter to continue: ')).toLowerCase() === 'manual';

  let code;
  if (useManual) {
    console.log('\nPaste the full redirect URL or just the code parameter value.');
    code = await ask('Authorization code: ');
    if (code.includes('code=')) {
      try {
        code = new URL(code).searchParams.get('code') || code;
      } catch {
        const match = code.match(/code=([^&]+)/);
        code = match ? decodeURIComponent(match[1]) : code;
      }
    }
  } else {
    console.log('\nStarting local callback server...');
    const codePromise = waitForAuthCode();

    console.log('Step 1: Opening Google sign-in in your browser...');
    console.log(`If it does not open automatically, use this URL:\n${authUrl.toString()}\n`);
    console.log('Step 2: Sign in and click Allow. Do not close this terminal.\n');

    try {
      require('child_process').execSync(`open "${authUrl.toString()}"`);
    } catch {
      // open command is macOS-only; ignore on other platforms
    }

    code = await codePromise;
  }

  if (!code) {
    console.error('No authorization code received.');
    process.exit(1);
  }

  console.log('\nExchanging code for tokens...');
  const tokens = await exchangeCodeForTokens(code);

  if (!tokens.refresh_token) {
    console.warn('\nWarning: No refresh_token returned. Revoke app access at https://myaccount.google.com/permissions and run again.');
  }

  await finishSetup(tokens.access_token, tokens.refresh_token);
}

main().catch((error) => {
  console.error('\nSetup failed:', error.message);
  process.exit(1);
});
