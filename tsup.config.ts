import { defineConfig } from 'tsup';
import { TsconfigPathsPlugin } from '@esbuild-plugins/tsconfig-paths';

export default defineConfig({
  entry: ['server/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  clean: true,
  splitting: false,
  skipNodeModulesBundle: true,
  tsconfig: 'tsconfig.server.json',
  esbuildPlugins: [
    TsconfigPathsPlugin({
      tsconfig: 'tsconfig.server.json',
    }),
  ],
  // Externalize packages that should not be bundled
  external: [
    'pg',
    'bcrypt',
    '@electric-sql/pglite',
    '@neondatabase/serverless',
    'express',
    'passport',
    'multer',
  ],
});
