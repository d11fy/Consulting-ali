import { Client } from 'pg';

const passwords = ['postgres', 'admin', 'root', '123456', '1234', 'alosh', 'password', ''];

async function testConnection() {
  for (const pwd of passwords) {
    const client = new Client({
      host: '127.0.0.1',
      port: 5432,
      user: 'postgres',
      password: pwd,
      database: 'postgres',
    });
    try {
      await client.connect();
      console.log(`SUCCESS with password: "${pwd}"`);
      const res = await client.query('SELECT datname FROM pg_database');
      console.log('Databases:', res.rows.map((r: any) => r.datname).join(', '));
      await client.end();
      return pwd;
    } catch (e: any) {
      console.log(`Failed with password "${pwd}": ${e.message}`);
    }
  }
  console.log('None of the default passwords worked.');
}

testConnection();
