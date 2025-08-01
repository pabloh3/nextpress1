import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../shared/schema.js';
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

// Security check - prevent running in production
const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
  console.error('❌ SECURITY ERROR: Verification scripts are not allowed in production environment');
  console.error('This script provides read access to sensitive user data and should only be used during development/setup');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Create database connection with security timeout
const client = postgres(DATABASE_URL, {
  max: 1, // Limit connections for verification scripts
  idle_timeout: 20, // Close connections quickly
  connect_timeout: 10
});
const db = drizzle(client);

async function verifyUsers() {
  try {
    console.log('🔍 Starting secure user verification...');
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`🔒 Security: ${NODE_ENV === 'production' ? 'BLOCKED' : 'ALLOWED'}`);
    
    // Query all users from the database
    const allUsers = await db.select().from(users);
    
    console.log(`📊 Found ${allUsers.length} users in the database:`);
    console.log('');
    
    // Only show limited information for security
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

    // Check for specific users from CSV (only if in development)
    if (NODE_ENV === 'development') {
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
    }

    // Security summary
    console.log('🔒 Security Summary:');
    console.log(`  - Environment: ${NODE_ENV}`);
    console.log(`  - Total users: ${allUsers.length}`);
    console.log(`  - Active users: ${allUsers.filter(u => u.status === 'active').length}`);
    console.log(`  - Administrators: ${allUsers.filter(u => u.role === 'administrator').length}`);

  } catch (error) {
    console.error('❌ Error verifying users:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the verification with proper error handling
verifyUsers()
  .then(() => {
    console.log('🎉 User verification completed!');
    console.log('⚠️  Remember: This script should only be used during development/setup');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 User verification failed:', error);
    process.exit(1);
  }); 