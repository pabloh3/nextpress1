# Database Import Scripts

## Overview
This directory contains scripts for importing data into the PostgreSQL database during setup and development. These scripts are **NOT intended for production use** and should only be used during initial setup or development.

## ⚠️ Security Warning
- These scripts contain database credentials and should **NEVER** be committed to production repositories
- Import scripts bypass normal application security measures
- Use only during development/setup phase
- Remove or secure these scripts before production deployment

## Available Scripts

### `import-users.ts`
**Purpose**: Import user data from CSV files into the database
**Usage**: `npm run import:users`
**Security Level**: HIGH RISK - Contains database credentials

**Features**:
- Reads CSV files and imports user data
- Handles password hashing and data validation
- Maps CSV columns to database schema
- Provides detailed logging

**Requirements**:
- Valid `DATABASE_URL` in `.env`
- CSV file with proper column headers
- Database schema must match expected format

### `verify-users.ts`
**Purpose**: Verify imported user data in the database
**Usage**: `npm run verify:users`
**Security Level**: MEDIUM RISK - Read-only access

**Features**:
- Queries all users from database
- Verifies specific users by email
- Displays detailed user information
- Validates data integrity

## Security Considerations

### 🔒 Environment Variables
- All database credentials are stored in `.env` file
- `.env` should be in `.gitignore` to prevent credential exposure
- Use different credentials for development and production

### 🛡️ Input Validation
- CSV data is validated before import
- Email addresses are checked for format
- Username uniqueness is enforced
- Password hashing is preserved

### 🚫 Production Restrictions
- These scripts bypass authentication
- No rate limiting or access controls
- Direct database access without application layer
- Should be disabled in production environments

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Add your database credentials
DATABASE_URL='your-postgresql-connection-string'
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Prepare CSV Data
Ensure your CSV file has the following columns:
- `id` - Unique user identifier
- `email` - User email address
- `first_name` - User's first name
- `last_name` - User's last name
- `username` - Unique username
- `password` - Hashed password (bcrypt)
- `role` - User role (administrator, editor, etc.)
- `status` - User status (active, inactive)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### 4. Run Import
```bash
# Import users from CSV
npm run import:users

# Verify import was successful
npm run verify:users
```

## Development vs Production

### Development Environment
✅ **Allowed**:
- Running import scripts
- Direct database access
- Debug logging
- Manual data verification

### Production Environment
❌ **Forbidden**:
- Import scripts should be removed or disabled
- No direct database access
- No debug logging
- Use application APIs for data management

## File Structure
```
scripts/
├── README.md              # This documentation
├── import-users.ts        # User import script
└── verify-users.ts        # User verification script
```

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
Error: DATABASE_URL is required
```
**Solution**: Check your `.env` file and ensure `DATABASE_URL` is set correctly.

**CSV Parsing Error**
```bash
Error: Cannot find module 'csv-parse/sync'
```
**Solution**: Run `npm install` to install missing dependencies.

**Duplicate User Error**
```bash
Error: duplicate key value violates unique constraint
```
**Solution**: Check for duplicate emails or usernames in your CSV file.

### Debug Mode
To enable detailed logging, add debug environment variable:
```bash
DEBUG=true npm run import:users
```

## Cleanup

### Before Production Deployment
1. Remove or secure import scripts
2. Update `.gitignore` to exclude sensitive files
3. Use application APIs for data management
4. Implement proper authentication and authorization
5. Add rate limiting and access controls

### Recommended Production Setup
- Use database migrations for schema changes
- Implement user registration through application UI
- Add proper authentication middleware
- Use environment-specific configuration
- Implement audit logging for data changes

## Support
For issues with import scripts, check:
1. Database connection string
2. CSV file format
3. Database schema compatibility
4. Environment variable configuration

---

**⚠️ Remember**: These scripts are for development/setup only. Never use them in production environments. 