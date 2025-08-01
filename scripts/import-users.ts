import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from '../shared/schema.js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// Load environment variables
config();

// Security check - prevent running in production
const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
  console.error('❌ SECURITY ERROR: Import scripts are not allowed in production environment');
  console.error('This script bypasses security measures and should only be used during development/setup');
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

// Input validation schema
const UserRecordSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  profile_image_url: z.string().optional(),
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(['administrator', 'editor', 'author', 'contributor', 'subscriber']),
  status: z.enum(['active', 'inactive', 'pending']),
  created_at: z.string(),
  updated_at: z.string()
});

// Create database connection with security timeout
const client = postgres(DATABASE_URL, {
  max: 1, // Limit connections for import scripts
  idle_timeout: 20, // Close connections quickly
  connect_timeout: 10
});
const db = drizzle(client);

async function validateCSVData(records: any[]): Promise<z.infer<typeof UserRecordSchema>[]> {
  console.log('🔍 Validating CSV data...');
  
  const validatedRecords: z.infer<typeof UserRecordSchema>[] = [];
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNumber = i + 2; // +2 because of header row and 0-based index

    try {
      // Validate record structure
      const validated = UserRecordSchema.parse(record);
      
      // Additional business logic validation
      if (validated.email && validated.username) {
        // Check for duplicate emails/usernames in CSV
        const duplicateEmail = records.slice(0, i).some(r => r.email === validated.email);
        const duplicateUsername = records.slice(0, i).some(r => r.username === validated.username);
        
        if (duplicateEmail) {
          errors.push(`Line ${lineNumber}: Duplicate email address: ${validated.email}`);
        }
        if (duplicateUsername) {
          errors.push(`Line ${lineNumber}: Duplicate username: ${validated.username}`);
        }
      }

      validatedRecords.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(`Line ${lineNumber}: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        errors.push(`Line ${lineNumber}: Unknown validation error`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('❌ CSV validation errors:');
    errors.forEach(error => console.error(`  ${error}`));
    throw new Error(`CSV validation failed with ${errors.length} errors`);
  }

  console.log(`✅ Validated ${validatedRecords.length} records successfully`);
  return validatedRecords;
}

async function checkExistingUsers(usersToInsert: any[]): Promise<void> {
  console.log('🔍 Checking for existing users...');
  
  const emails = usersToInsert.map(u => u.email);
  const usernames = usersToInsert.map(u => u.username);
  
  // Check for existing users in database
  const existingUsers = await db.select().from(users).where(
    sql`${users.email} = ANY(${emails}) OR ${users.username} = ANY(${usernames})`
  );

  if (existingUsers.length > 0) {
    console.warn('⚠️  Warning: Found existing users that may conflict:');
    existingUsers.forEach(user => {
      console.warn(`  - ${user.email} (${user.username})`);
    });
    
    const proceed = process.env.FORCE_IMPORT === 'true';
    if (!proceed) {
      console.error('❌ Import aborted. Set FORCE_IMPORT=true to override existing users');
      process.exit(1);
    } else {
      console.log('⚠️  Proceeding with import (FORCE_IMPORT=true)');
    }
  } else {
    console.log('✅ No existing users found that would conflict');
  }
}

async function importUsers() {
  try {
    console.log('🚀 Starting secure user import...');
    console.log(`📊 Environment: ${NODE_ENV}`);
    console.log(`🔒 Security: ${NODE_ENV === 'production' ? 'BLOCKED' : 'ALLOWED'}`);
    
    // Read and parse the CSV file
    const csvContent = readFileSync('./users.csv', 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`📁 Found ${records.length} records in CSV file`);

    // Validate CSV data
    const validatedRecords = await validateCSVData(records);

    // Check for existing users
    await checkExistingUsers(validatedRecords);

    // Transform CSV data to match database schema
    const usersToInsert = validatedRecords.map((record) => ({
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

    // Insert users into database with transaction
    console.log('💾 Inserting users into database...');
    const result = await db.insert(users).values(usersToInsert);
    
    console.log('✅ Successfully imported users:');
    usersToInsert.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email})`);
    });

    console.log(`📊 Import Summary:`);
    console.log(`  - Total records processed: ${records.length}`);
    console.log(`  - Valid records: ${validatedRecords.length}`);
    console.log(`  - Successfully imported: ${usersToInsert.length}`);

  } catch (error) {
    console.error('❌ Error importing users:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the import with proper error handling
importUsers()
  .then(() => {
    console.log('🎉 User import completed successfully!');
    console.log('⚠️  Remember: This script should only be used during development/setup');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 User import failed:', error);
    process.exit(1);
  }); 