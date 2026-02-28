import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon to use WebSocket in Node
neonConfig.webSocketConstructor = ws as any;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set. Provide it via .env or environment.');
  }

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp(6) NOT NULL
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions (expire);
    `);
    console.log('Sessions table ensured on database.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Failed to create sessions table:', err);
  process.exit(1);
});



