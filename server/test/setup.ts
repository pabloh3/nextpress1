import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll } from "vitest";
import * as schema from "@shared/schema";

// Create in-memory PostgreSQL database using PGlite
const client = new PGlite();
export const testDb = drizzle(client, { schema });

// Run migrations before all tests
beforeAll(async () => {
	// Create tables manually for PGlite
	await client.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			email VARCHAR UNIQUE,
			first_name VARCHAR,
			last_name VARCHAR,
			profile_image_url VARCHAR,
			username VARCHAR UNIQUE NOT NULL,
			password VARCHAR,
			status VARCHAR DEFAULT 'active',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS blogs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR NOT NULL,
			description TEXT,
			slug VARCHAR NOT NULL,
			status VARCHAR DEFAULT 'draft',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			site_id UUID,
			author_id UUID NOT NULL REFERENCES users(id),
			settings JSONB DEFAULT '{}',
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS posts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title VARCHAR NOT NULL,
			slug VARCHAR NOT NULL,
			status VARCHAR DEFAULT 'draft',
			author_id UUID NOT NULL REFERENCES users(id),
			featured_image VARCHAR,
			excerpt TEXT,
			published_at TIMESTAMP,
			allow_comments BOOLEAN DEFAULT true,
			password VARCHAR,
			parent_id UUID,
			template_id UUID,
			blocks JSONB DEFAULT '[]',
			settings JSONB DEFAULT '{}',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			blog_id UUID REFERENCES blogs(id),
			other JSONB DEFAULT '{"categories":[],"tags":[]}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS comments (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			post_id UUID NOT NULL REFERENCES posts(id),
			author_id UUID REFERENCES users(id),
			author_name VARCHAR,
			author_email VARCHAR,
			content TEXT NOT NULL,
			status VARCHAR DEFAULT 'pending',
			parent_id UUID,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS pages (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title VARCHAR NOT NULL,
			slug VARCHAR NOT NULL,
			status VARCHAR DEFAULT 'draft',
			author_id UUID NOT NULL REFERENCES users(id),
			featured_image VARCHAR,
			published_at TIMESTAMP,
			allow_comments BOOLEAN DEFAULT true,
			password VARCHAR,
			parent_id UUID,
			menu_order INTEGER DEFAULT 0,
			template_id UUID,
			blocks JSONB DEFAULT '[]',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS media (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			filename VARCHAR NOT NULL,
			original_name VARCHAR NOT NULL,
			mime_type VARCHAR NOT NULL,
			size INTEGER NOT NULL,
			url VARCHAR NOT NULL,
			author_id UUID NOT NULL REFERENCES users(id),
			alt VARCHAR,
			caption TEXT,
			description TEXT,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS themes (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR NOT NULL,
			description TEXT,
			author_id UUID NOT NULL REFERENCES users(id),
			version VARCHAR NOT NULL,
			requires VARCHAR NOT NULL,
			renderer VARCHAR,
			is_paid BOOLEAN DEFAULT false,
			price INTEGER DEFAULT 0,
			currency VARCHAR DEFAULT 'USD',
			status VARCHAR DEFAULT 'draft',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			settings JSONB DEFAULT '{}',
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS plugins (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR NOT NULL,
			description TEXT,
			runs_when VARCHAR DEFAULT 'rendering',
			author_id UUID NOT NULL REFERENCES users(id),
			status VARCHAR DEFAULT 'inactive',
			version VARCHAR NOT NULL,
			requires VARCHAR NOT NULL,
			is_paid BOOLEAN DEFAULT false,
			price INTEGER DEFAULT 0,
			currency VARCHAR DEFAULT 'USD',
			settings JSONB DEFAULT '{}',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS options (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR NOT NULL,
			value TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS templates (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR NOT NULL,
			type VARCHAR NOT NULL,
			description TEXT,
			author_id UUID NOT NULL REFERENCES users(id),
			blocks JSONB NOT NULL DEFAULT '[]',
			settings JSONB DEFAULT '{}',
			other JSONB DEFAULT '{}',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS sites (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR,
			description TEXT,
			logo_url VARCHAR,
			favicon_url VARCHAR,
			site_url VARCHAR,
			owner_id UUID NOT NULL REFERENCES users(id),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			settings JSONB DEFAULT '{}',
			active_theme_id UUID,
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS roles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR NOT NULL,
			description TEXT,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW(),
			capabilities JSONB DEFAULT '[]',
			site_id UUID,
			other JSONB DEFAULT '{}'
		)
	`);

	await client.exec(`
		CREATE TABLE IF NOT EXISTS user_roles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			user_id UUID NOT NULL REFERENCES users(id),
			role_id UUID NOT NULL REFERENCES roles(id),
			site_id UUID NOT NULL,
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)
	`);
});

afterAll(async () => {
	// Close the PGlite client
	await client.close();
});
