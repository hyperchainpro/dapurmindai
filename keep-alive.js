const { spawn } = require('child_process');
const path = require('path');

const server = spawn('node', [path.join(__dirname, '.next/standalone/server.js'), '-p', '3000'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

server.stdout.on('data', (d) => console.log(d.toString()));
server.stderr.on('data', (d) => console.error(d.toString()));
server.unref();

console.log(`Server started with PID: ${server.pid}`);

// Keep this process alive
setInterval(() => {
  try {
    process.kill(server.pid, 0);
  } catch(e) {
    console.log('Server died, restarting...');
    const newServer = spawn('node', [path.join(__dirname, '.next/standalone/server.js'), '-p', '3000'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    newServer.unref();
  }
}, 5000);
