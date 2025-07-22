const { spawn } = require('child_process');
const path = require('path');

const runCommand = (command, args, options) => {
  const process = spawn(command, args, {
    ...options,
    stdio: 'inherit',
    shell: true
  });

  process.on('error', (error) => {
    console.error(`Error executing ${command}:`, error);
  });

  return process;
};

// Start web app
console.log('🌐 Starting web app...');
const webApp = runCommand('pnpm', ['--filter', 'velox-frontend', 'dev'], {
  cwd: path.resolve(__dirname)
});

// Start Expo server
console.log('📱 Starting Expo server...');
const expoServer = runCommand('pnpm', ['expo', 'start'], {
  cwd: path.resolve(__dirname, 'apps', 'mobile')
});

// Run checklist
setTimeout(() => {
  require('./scripts/check-local-setup.js');
}, 5000);

// Handle cleanup
process.on('SIGINT', () => {
  webApp.kill();
  expoServer.kill();
  process.exit();
}); 