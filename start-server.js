
// Simple script to start the file upload server
const { spawn } = require('child_process');

console.log('Starting file upload server...');

const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});
