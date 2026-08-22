import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import {
  isClerkKeyPlaceholder,
  isClerkProductionOnLocalhost,
  CLERK_LOCALHOST_HELP,
} from '../utils/clerkLocalDev';

/**
 * Auth boundary for the admin routes.
 *
 * ClerkProvider used to be imported statically by AppRouter, which put the whole
 * Clerk SDK in the entry bundle that every public visitor downloads before the
 * homepage can render. Only /admin-login and /dashboard need it, so this module is
 * lazy-loaded and the key/environment checks live here too — a missing Clerk key
 * now blocks the dashboard instead of the public site.
 */

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

const ClerkSetupRequired = ({ title, steps }) => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: '#fafafa',
      color: '#2d4a36',
      fontFamily: 'system-ui, sans-serif',
    }}
  >
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h1>
      <ol style={{ lineHeight: 1.7, paddingLeft: '1.25rem' }}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', opacity: 0.85 }}>
        Stop the dev server (Ctrl+C), then run: <code>npm run dev</code>
      </p>
    </div>
  </div>
);

const clerkSetupSteps = [
  'Open dashboard.clerk.com and select your app',
  'Switch to the Development instance (not Production)',
  'Go to API Keys and copy the Publishable key (pk_test_...) and Secret key (sk_test_...)',
  'Paste them into .env.local (replace the PASTE_YOUR_... placeholders)',
  'Run: node scripts/create-admin-user.js — copy REACT_APP_ADMIN_USER_IDS into .env.local',
];

export default function ClerkGate({ children }) {
  if (isClerkKeyPlaceholder(clerkPubKey)) {
    return (
      <ClerkSetupRequired
        title="Clerk API keys not configured"
        steps={clerkSetupSteps}
      />
    );
  }

  if (isClerkProductionOnLocalhost()) {
    return (
      <ClerkSetupRequired
        title="Production Clerk keys cannot run on localhost"
        steps={[CLERK_LOCALHOST_HELP, ...clerkSetupSteps.slice(2)]}
      />
    );
  }

  return <ClerkProvider publishableKey={clerkPubKey}>{children}</ClerkProvider>;
}
