import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^server-only$": "<rootDir>/tests/helpers/server-only.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  clearMocks: true,
  // Starting a real mongod (and downloading it the first time) is slow.
  testTimeout: 120000,
};

export default config;
