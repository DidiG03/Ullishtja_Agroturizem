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
  console.error('❌ Please provide your Vercel deployment URL:');
  console.error('   node scripts/validate-deployment.js https://your-app.vercel.app');
  console.error('   or set VERCEL_URL environment variable');
  process.exit(1);
}

const API_BASE = VERCEL_URL.startsWith('http') ? VERCEL_URL : `https://${VERCEL_URL}`;

// Test endpoints
const endpoints = [
  { path: '/api/health', method: 'GET', description: 'Health check' },
  { path: '/api/menu/complete', method: 'GET', description: 'Complete menu data' },
  { path: '/api/menu/categories', method: 'GET', description: 'Menu categories' },
  { path: '/api/menu/items', method: 'GET', description: 'Menu items' },
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
    console.log(`🔍 Testing ${endpoint.description}...`);
    const response = await makeRequest(url, endpoint.method);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`✅ ${endpoint.description} - OK (${response.statusCode})`);
      
      // Try to parse JSON response
      try {
        const jsonData = JSON.parse(response.data);
        if (endpoint.path === '/api/health') {
          console.log(`   Status: ${jsonData.status}, Environment: ${jsonData.environment || 'unknown'}`);
        } else if (endpoint.path === '/api/menu/complete') {
          console.log(`   Found ${jsonData.length || 0} menu categories`);
        }
      } catch (e) {
        // Not JSON, that's ok
      }
    } else {
      console.log(`⚠️  ${endpoint.description} - Warning (${response.statusCode})`);
      if (response.statusCode === 500) {
        console.log(`   This might be a database connection issue`);
      }
    }
  } catch (error) {
    console.log(`❌ ${endpoint.description} - Failed: ${error.message}`);
  }
}

// Main validation function
async function validateDeployment() {
  console.log(`🚀 Validating deployment at: ${API_BASE}`);
  console.log('━'.repeat(60));

  // Test main site
  try {
    console.log('🔍 Testing main site...');
    const response = await makeRequest(API_BASE);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log('✅ Main site - OK');
    } else {
      console.log(`⚠️  Main site - Warning (${response.statusCode})`);
    }
  } catch (error) {
    console.log(`❌ Main site - Failed: ${error.message}`);
  }

  console.log('');

  // Test API endpoints
  for (const endpoint of endpoints) {
    await validateEndpoint(endpoint);
  }

  console.log('');
  console.log('━'.repeat(60));
  console.log('🎯 Validation Summary:');
  console.log('');
  console.log('If you see any ❌ errors:');
  console.log('1. Check environment variables in Vercel dashboard');
  console.log('2. Ensure DATABASE_URL is correctly set');
  console.log('3. Run "npx prisma db push" to sync your database');
  console.log('4. Check Vercel function logs for detailed errors');
  console.log('');
  console.log('If you see ⚠️  warnings:');
  console.log('1. Check if your database is properly seeded');
  console.log('2. Verify Prisma schema matches your database');
  console.log('');
  console.log('✅ All good? Your deployment is ready!');
}

// Run validation
validateDeployment().catch(console.error); 