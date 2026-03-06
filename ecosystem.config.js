module.exports = {
  apps: [
    {
      name: 'task-management-api',
      script: './src/index.js',
      cwd: './task-management-api',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log'
    },
    {
      name: 'sisgeo-web',
      script: 'serve',
      args: '-l 3000 dist',
      cwd: './apps/web',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log'
    }
  ]
};
