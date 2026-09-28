const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    'features/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
  coverageReporters: ['text-summary', 'lcov', 'json-summary'],
  coverageThreshold: {
    './features/contest-detail/model/contestStatus.ts': { branches: 80 },
    './features/contest-detail/model/voting.ts': { branches: 80 },
    './features/posts/model/postForm.ts': { branches: 80 },
    './lib/api/browser.ts': { branches: 80 },
    './lib/api/core.ts': { branches: 80 },
    './lib/mappers/api.ts': { branches: 80 },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
