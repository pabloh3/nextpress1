import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../shared/schema.js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Create database connection
const client = postgres(DATABASE_URL);
const db = drizzle(client);

async function importUsers() {
  try {
    console.log('Starting user import...');
    
    // Read and parse the CSV file
    const csvContent = readFileSync('./users.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Found ${records.length} users to import`);

    // Transform CSV data to match database schema
    const usersToInsert = records.map((record: any) => ({
      id: record.id,
      email: record.email,
      firstName: record.first_name,
      lastName: record.last_name,
      profileImageUrl: record.profile_image_url || null,
      username: record.username,
      password: record.password,
      role: record.role,
      status: record.status,
      createdAt: new Date(record.created_at.replace(/"/g, '')),
      updatedAt: new Date(record.updated_at.replace(/"/g, ''))
    }));

    // Insert users into database
    const result = await db.insert(users).values(usersToInsert);
    
    console.log('✅ Successfully imported users:');
    usersToInsert.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
    });

  } catch (error) {
    console.error('❌ Error importing users:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the import
importUsers()
  .then(() => {
    console.log('🎉 User import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 User import failed:', error);
    process.exit(1);
  }); 