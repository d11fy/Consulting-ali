import { Client } from 'pg';

async function createDb() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '123456',
    database: 'postgres',
  });
  await client.connect();
  const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'masarat_consultations'");
  if (res.rowCount === 0) {
    await client.query('CREATE DATABASE masarat_consultations');
    console.log('Database masarat_consultations created successfully!');
  } else {
    console.log('Database masarat_consultations already exists.');
  }
  await client.end();
}

createDb().catch(console.error);
