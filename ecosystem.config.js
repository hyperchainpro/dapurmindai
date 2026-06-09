module.exports = {
  apps: [{
    name: 'dapurmind',
    script: '.next/standalone/server.js',
    cwd: '/home/z/my-project',
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://z@localhost:5432/dapurmind'
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000
  }]
}
