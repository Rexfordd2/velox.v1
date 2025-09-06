// Mock crypto.randomUUID() for consistent test results
// Provide a deterministic randomUUID
global.crypto = global.crypto || {};
global.crypto.randomUUID = () => '00000000-0000-0000-0000-000000000000';

// Mock Date.now() to return incrementing timestamps
let currentTimestamp = 1600000000000; // Starting timestamp
global.Date.now = jest.fn(() => {
  const timestamp = currentTimestamp;
  currentTimestamp += 100; // Increment by 100ms each call
  return timestamp;
});

// Polyfill structuredClone for fake-indexeddb
if (typeof structuredClone !== 'function') {
  global.structuredClone = obj => {
    return JSON.parse(JSON.stringify(obj));
  };
} 