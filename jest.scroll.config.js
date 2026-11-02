// Focused catalogue-scroll regression suite: npx jest --config jest.scroll.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '<rootDir>/__tests__/unit/hooks/useScrollRestore.test.js',
    '<rootDir>/__tests__/unit/pages/products-scroll.test.js',
  ],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['next/babel'] }],
  },
};
