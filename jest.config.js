module.exports = {
  unmockedModulePathPatterns: ['react'],
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '^components(.*)$': '<rootDir>/src/components$1',
  },
  transform: {
    '^.+\\.[jt]sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }],
  },
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!**/index.{js,jsx}', '!**/node_modules/**'],
  testEnvironment: 'jsdom',
};
