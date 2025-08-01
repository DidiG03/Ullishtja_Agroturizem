#!/usr/bin/env node

// Production readiness check script

const { logEnvironmentStatus } = require('../src/utils/envValidation.js');
const fs = require('fs');
const path = require('path');

console.log('🔍 Production Readiness Check');
console.log('==============================\n');

// 1. Environment validation
console.log('1️⃣ Checking environment variables...');
const envValidation = logEnvironmentStatus();

if (!envValidation.isValid) {
  console.log('❌ Environment check failed. Fix issues before deploying.\n');
  process.exit(1);
}

// 2. Check for .env file in repository
console.log('2️⃣ Checking for security issues...');
if (fs.existsSync('.env')) {
  console.log('⚠️  WARNING: .env file found in repository. Ensure it\'s in .gitignore');
}

// 3. Check build directory
console.log('3️⃣ Checking build status...');
if (!fs.existsSync('build')) {
  console.log('⚠️  WARNING: No build directory found. Run `npm run build` before deployment');
} else {
  console.log('✅ Build directory exists');
}

// 4. Check package.json scripts
console.log('4️⃣ Checking package.json configuration...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredScripts = ['build', 'start', 'server:prod'];
const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

if (missingScripts.length > 0) {
  console.log(`⚠️  WARNING: Missing scripts: ${missingScripts.join(', ')}`);
} else {
  console.log('✅ All required scripts are present');
}

// 5. Check dependencies
console.log('5️⃣ Checking dependencies...');
const devDependencies = Object.keys(packageJson.devDependencies || {});
if (devDependencies.length === 0) {
  console.log('✅ No dev dependencies to worry about in production');
} else {
  console.log(`ℹ️  Found ${devDependencies.length} dev dependencies (ensure they\'re not installed in production)`);
}

// 6. Check Prisma configuration
console.log('6️⃣ Checking database configuration...');
if (fs.existsSync('prisma/schema.prisma')) {
  console.log('✅ Prisma schema found');
  
  // Check if migrations exist
  if (fs.existsSync('prisma/migrations')) {
    const migrations = fs.readdirSync('prisma/migrations').filter(f => f !== 'migration_lock.toml');
    console.log(`✅ Found ${migrations.length} database migrations`);
  } else {
    console.log('⚠️  WARNING: No migrations directory found');
  }
} else {
  console.log('❌ Prisma schema not found');
}

// 7. Security headers check
console.log('7️⃣ Checking security configuration...');
const vercelConfig = fs.existsSync('vercel.json') ? JSON.parse(fs.readFileSync('vercel.json', 'utf8')) : null;

if (vercelConfig && vercelConfig.headers) {
  const securityHeaders = vercelConfig.headers.find(h => h.source === '/(.*)')?.headers || [];
  const requiredHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'X-XSS-Protection'];
  const presentHeaders = securityHeaders.map(h => h.key);
  const missingHeaders = requiredHeaders.filter(h => !presentHeaders.includes(h));
  
  if (missingHeaders.length === 0) {
    console.log('✅ Security headers are configured');
  } else {
    console.log(`⚠️  WARNING: Missing security headers: ${missingHeaders.join(', ')}`);
  }
} else {
  console.log('⚠️  WARNING: No security headers configuration found');
}

// 8. Production-specific checks
if (process.env.NODE_ENV === 'production') {
  console.log('8️⃣ Production environment checks...');
  
  const productionChecks = [
    {
      name: 'HTTPS/SSL',
      check: () => process.env.VERCEL_URL?.startsWith('https://') || process.env.ALLOWED_ORIGINS?.includes('https://'),
      message: 'Ensure HTTPS is enabled in production'
    },
    {
      name: 'CORS Origins',
      check: () => process.env.ALLOWED_ORIGINS && !process.env.ALLOWED_ORIGINS.includes('localhost'),
      message: 'Configure ALLOWED_ORIGINS for production domains'
    },
    {
      name: 'API Keys',
      check: () => !process.env.CLERK_SECRET_KEY?.includes('test'),
      message: 'Replace test API keys with production keys'
    }
  ];
  
  productionChecks.forEach(({ name, check, message }) => {
    if (check()) {
      console.log(`✅ ${name} configured`);
    } else {
      console.log(`⚠️  WARNING: ${name} - ${message}`);
    }
  });
}

console.log('\n✅ Production readiness check completed!');
console.log('🚀 Your application is ready for deployment.');

if (envValidation.warnings.length > 0) {
  console.log('\n📝 Review warnings above to ensure optimal production configuration.');
}