// Focused security regression suite: npx jest --config jest.security.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/security/fixes-2026-11/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
};
