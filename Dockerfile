# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build frontend and backend
RUN pnpm build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm for running drizzle-kit
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod

# Install drizzle-kit for migrations (needed at runtime)
RUN pnpm add drizzle-kit

# Copy built output from builder stage
COPY --from=builder /app/dist ./dist

# Copy files needed for drizzle migrations
COPY drizzle.config.ts ./
COPY shared ./shared

# Create uploads directory
RUN mkdir -p uploads

# Expose the application port
EXPOSE 5000

# Run migrations then start the server
CMD ["sh", "-c", "pnpm drizzle-kit push && node dist/index.js"]
