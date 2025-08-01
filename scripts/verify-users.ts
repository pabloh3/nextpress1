import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../shared/schema.js';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Create database connection
const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function verifyUsers() {
  try {
    console.log('🔍 Verifying imported users...');
    
    // Query all users from the database
    const allUsers = await db.select().from(users);
    
    console.log(`📊 Found ${allUsers.length} users in the database:`);
    console.log('');
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Updated: ${user.updatedAt}`);
      console.log('');
    });

    // Check for specific users from CSV
    const csvUsers = [
      'test@test.com',
      'pablo.hdz.sanz@gmail.com', 
      'pablo@builditforme.ai'
    ];

    console.log('✅ Verifying specific users from CSV:');
    for (const email of csvUsers) {
      const user = await db.select().from(users).where(eq(users.email, email));
      if (user.length > 0) {
        console.log(`  ✅ Found: ${email}`);
      } else {
        console.log(`  ❌ Missing: ${email}`);
      }
    }

  } catch (error) {
    console.error('❌ Error verifying users:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the verification
verifyUsers()
  .then(() => {
    console.log('🎉 User verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 User verification failed:', error);
    process.exit(1);
  }); 