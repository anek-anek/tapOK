/**
 * Two-step Vercel build:
 * 1. tsc compiles TypeScript with emitDecoratorMetadata (required by TypeORM)
 * 2. esbuild re-bundles the compiled dist/main.js, inlining ESM node_modules
 *    (like better-auth) into a single CJS output that Vercel Node 24 can load.
 */

const { execSync } = require('child_process');
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// Step 1: tsc compile (handles emitDecoratorMetadata for TypeORM)
console.log('Step 1: tsc compile...');
execSync('npx tsc -p tsconfig.json', { cwd: root, stdio: 'inherit' });

// Step 2: esbuild bundles dist/main.js, resolving ESM node_modules into CJS
console.log('Step 2: esbuild bundle...');

const distMain = path.join(root, 'dist', 'main.js');
const outfile = path.join(root, 'dist', 'main.bundle.js');

esbuild.build({
  entryPoints: [distMain],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile,
  // Resolve ESM packages from node_modules relative to source root
  nodePaths: [path.join(root, 'node_modules'), path.join(root, '../../node_modules')],
  // Keep optional/native deps external
  external: [
    'pg-native',
    'class-transformer/storage',
    '@nestjs/websockets',
    '@nestjs/microservices',
    '@nestjs/sequelize',
    '@nestjs/mongoose',
    '@nestjs/typeorm',
    '@mikro-orm/core',
    'typeorm',
    'cache-manager',
    'ioredis',
    'redis',
    'mqtt',
    'nats',
    'amqplib',
    'amqp-connection-manager',
    'kafkajs',
  ],
  mainFields: ['main', 'module'],
  conditions: ['require', 'node', 'default'],
  logLevel: 'info',
}).then(() => {
  // Replace dist/main.js with the bundled output
  fs.renameSync(outfile, distMain);
  console.log('Done: dist/main.js is ready for Vercel.');
}).catch(() => process.exit(1));
