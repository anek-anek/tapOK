const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: [path.resolve(__dirname, '../src/main.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: path.resolve(__dirname, '../dist/main.js'),
  tsconfig: path.resolve(__dirname, '../tsconfig.json'),
  // Keep these external — they use native bindings or are provided by the runtime
  external: [
    'pg-native',
    'class-transformer/storage',
    '@nestjs/websockets',
    '@nestjs/microservices',
    '@nestjs/sequelize',
    '@nestjs/mongoose',
    '@mikro-orm/core',
    'cache-manager',
    'ioredis',
    'redis',
    'mqtt',
    'nats',
    'amqplib',
    'amqp-connection-manager',
    'kafkajs',
  ],
  // Allow esbuild to handle ESM packages (like better-auth) by bundling them into CJS output
  mainFields: ['main', 'module'],
  conditions: ['require', 'node', 'default'],
  logLevel: 'info',
}).catch(() => process.exit(1));
