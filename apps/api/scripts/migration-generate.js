const { execSync } = require('child_process');

const name = process.argv[2];

if (!name) {
  console.error('Usage: npm run migration:generate <Name>');
  process.exit(1);
}

execSync(
  `npx typeorm-ts-node-commonjs -d src/db/data-source.ts migration:generate "src/db/migrations/${name}"`,
  { stdio: 'inherit' }
);
