/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    // support des imports relatifs générés par TS/ESM sans .js
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts", // point d'entrée CLI
  ],
  coverageDirectory: "coverage",
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],
};
