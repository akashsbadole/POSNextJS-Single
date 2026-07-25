/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^next-auth$": "<rootDir>/tests/setup/mocks/next-auth.ts",
    "^next-auth/react$": "<rootDir>/tests/setup/mocks/next-auth-react.ts",
    "^next/server$": "<rootDir>/tests/setup/mocks/next-server.ts",
    "^next/navigation$": "<rootDir>/tests/setup/mocks/next-navigation.ts",
    "^@auth/prisma-adapter$": "<rootDir>/tests/setup/mocks/auth-prisma-adapter.ts",
    "^jose$": "<rootDir>/tests/setup/mocks/jose.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  clearMocks: false,
  resetMocks: false,
  verbose: true,
};
