module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/tests/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/__tests__/**",
    "!src/tests/**",
    "!src/lexicon/**",
    "!src/index.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
  moduleNameMapper: {
    "^#/(.*)$": "<rootDir>/src/$1",
    "^\\./(.+)\\.js$": "./$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  maxWorkers: 1,
  testTimeout: 30000,
  verbose: true,
};
