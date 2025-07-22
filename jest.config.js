module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@velox/core/(.*)$": "<rootDir>/packages/core/$1",
    "^@supabase/supabase-js$": "<rootDir>/tests/__mocks__/@supabase/supabase-js.js",
  },
}; 