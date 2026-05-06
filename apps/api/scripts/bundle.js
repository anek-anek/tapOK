/**
 * Two-step Vercel build:
 * 1. tsc compiles TypeScript with emitDecoratorMetadata (required by TypeORM)
 * 2. esbuild re-bundles dist/main.js, inlining only ESM-only packages (like
 *    better-auth) while keeping all @nestjs/* and typeorm external so that
 *    NestJS DI uses a single consistent set of instances from node_modules.
 */

const { execSync } = require('child_process');
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

// Step 1: tsc compile (handles emitDecoratorMetadata for TypeORM)
console.log('Step 1: tsc compile...');
execSync('npx tsc -p tsconfig.json', { cwd: root, stdio: 'inherit' });

// Step 2: esbuild bundles dist/main.js, inlining ESM packages into CJS output
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
  nodePaths: [path.join(root, 'node_modules'), path.join(root, '../../node_modules')],
  external: [
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    '@nestjs/config',
    '@nestjs/swagger',
    '@nestjs/typeorm',
    '@nestjs/terminus',
    '@nestjs/throttler',
    '@nestjs/schedule',
    '@nestjs/websockets',
    '@nestjs/microservices',
    '@nestjs/sequelize',
    '@nestjs/mongoose',
    '@nestjs/schematics',
    '@nestjs/cli',
    'typeorm',
    '@mikro-orm/core',
    'pg-native',
    'class-transformer/storage',
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
  fs.renameSync(outfile, distMain);
  console.log('Done: dist/main.js is ready for Vercel.');
}).catch(() => process.exit(1));
