const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.nfbgvzqpmjfpeapxjgxh:A7VFnz6CQpZ4g9WA@aws-1-us-east-2.pooler.supabase.com:5432/postgres'
});

async function test() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as test, current_database() as db');
    console.log('✅ Connection successful!');
    console.log('Result:', result.rows[0]);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    process.exit(1);
  }
}

test();
