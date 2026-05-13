const { Client } = require('pg');
const client = new Client('postgresql://postgres.lrvroywszxinyhsbqmth:AmU4I6khGfuB6noa@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=disable');
client.connect().then(async () => {
  await client.query('ALTER TABLE drops ADD COLUMN IF NOT EXISTS "baseCost" numeric(10,2) DEFAULT 0');
  await client.query('ALTER TABLE drops ADD COLUMN IF NOT EXISTS "chiefContribution" numeric(10,2) DEFAULT 0');
  console.log('Columns added');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
