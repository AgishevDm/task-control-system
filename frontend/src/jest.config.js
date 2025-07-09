module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
      '^react-router-dom$': '<rootDir>/node_modules/react-router-dom/dist/index.js',
      '\\.(css|less|scss)$': 'identity-obj-proxy'
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    transform: {
      '^.+\\.(ts|tsx)$': 'ts-jest'
    }
  };