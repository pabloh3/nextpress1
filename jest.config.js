/**
 * Jest configuration for NextPress
 * Supports both server-side and client-side testing
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.ts',
    '**/*.test.js',
    '**/*.test.ts'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'server/**/*.{js,ts}',
    'shared/**/*.{js,ts}',
    '!server/index.ts',
    '!server/vite.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Module name mapping (for path aliases)
  moduleNameMapping: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@/(.*)$': '<rootDir>/client/src/$1'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],

  // Transform configuration for TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }],
    '^.+\\.(js|jsx)$': 'babel-jest'
  },

  // Module file extensions
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
    'json'
  ],

  // Globals
  globals: {
    'ts-jest': {
      useESM: true
    }
  },

  // ESM support
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],

  // Mock configuration
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,

  // Error handling
  errorOnDeprecated: true,

  // Parallel execution
  maxWorkers: '50%',

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Watch configuration
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],

  // Custom test environment for client-side tests
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/server/**/__tests__/**/*.{js,ts}',
        '<rootDir>/server/**/*.test.{js,ts}',
        '<rootDir>/shared/**/__tests__/**/*.{js,ts}',
        '<rootDir>/shared/**/*.test.{js,ts}',
        '<rootDir>/__tests__/**/*.js'
      ],
      collectCoverageFrom: [
        'server/**/*.{js,ts}',
        'shared/**/*.{js,ts}',
        '!server/index.ts',
        '!server/vite.ts'
      ]
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/client/**/__tests__/**/*.{js,ts,tsx}',
        '<rootDir>/client/**/*.test.{js,ts,tsx}'
      ],
      setupFilesAfterEnv: ['<rootDir>/__tests__/client-setup.js'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/client/src/$1',
        '^@shared/(.*)$': '<rootDir>/shared/$1'
      },
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: '<rootDir>/client/tsconfig.json'
        }],
        '^.+\\.(js|jsx)$': 'babel-jest'
      },
      collectCoverageFrom: [
        'client/src/**/*.{js,ts,tsx}',
        '!client/src/**/__tests__/**',
        '!client/src/main.tsx',
        '!client/src/index.css'
      ]
    }
  ]
};
