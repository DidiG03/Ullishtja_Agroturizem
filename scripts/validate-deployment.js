#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Tests the deployed Vercel application to ensure all endpoints are working
 */

const https = require('https');
const http = require('http');

// Configuration
const VERCEL_URL = process.env.VERCEL_URL || process.argv[2];

if (!VERCEL_URL) {
  console.error('Please provide your Vercel deployment URL:');
  console.error('   node scripts/validate-deployment.js https://your-app.vercel.app');
  console.error('   or set VERCEL_URL environment variable');
  process.exit(1);
}

const API_BASE = VERCEL_URL.startsWith('http') ? VERCEL_URL : `https://${VERCEL_URL}`;

// Test endpoints
const endpoints = [
  { path: '/api/health', method: 'GET', description: 'Health check' },
      { path: '/api/menu-management?action=complete', method: 'GET', description: 'Complete menu data' },
    { path: '/api/menu-management?action=categories', method: 'GET', description: 'Menu categories' },
    { path: '/api/menu-management?action=items', method: 'GET', description: 'Menu items' },
];

// Make HTTP request
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const requestModule = url.startsWith('https:') ? https : http;
    const options = {
      method,
      timeout: 10000,
    };

    const req = requestModule.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Validate single endpoint
async function validateEndpoint(endpoint) {
  const url = `${API_BASE}${endpoint.path}`;
  
  try {
    const response = await makeRequest(url, endpoint.method);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      
      // Try to parse JSON response
      try {
        const jsonData = JSON.parse(response.data);
        if (endpoint.path === '/api/health') {
        } else if (endpoint.path === '/api/menu-management?action=complete') {
        }
      } catch (e) {
        // Not JSON, that's ok
      }
    } else {
      if (response.statusCode === 500) {
      }
    }
  } catch (error) {
  }
}

// Main validation function
async function validateDeployment() {

  // Test main site
  try {
    const response = await makeRequest(API_BASE);
    if (response.statusCode >= 200 && response.statusCode < 300) {
    } else {
    }
  } catch (error) {
  }

  // Test API endpoints
  for (const endpoint of endpoints) {
    await validateEndpoint(endpoint);
  }


}

// Run validation
validateDeployment().catch(console.error); 