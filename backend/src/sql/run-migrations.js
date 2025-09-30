import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new pg.Client();
await client.connect();

const dir = path.join(__dirname);

async function run(file) {
  const sql = fs.readFileSync(path.join(dir, file), 'utf8');
  console.log('Running', file);
  await client.query(sql);
}

try {
  await run('001_init.sql');
  await run('002_indexes.sql');
  console.log('Migrations completed.');
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await client.end();
}