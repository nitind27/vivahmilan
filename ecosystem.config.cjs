module.exports = {
  apps: [
    {
      name: 'vivahmilan',
      script: 'server.mjs',
      cwd: '/home/vivahdwar/htdocs/vivahdwar.com/vivahmilan',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-http-header-size=65536',
      env_production: {
        NODE_ENV: 'production',
      },
      // Load .env.production directly via dotenv in server.mjs
      // Do NOT use dotenvx here
      interpreter: 'node',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/root/.pm2/logs/vivahmilan-error.log',
      out_file: '/root/.pm2/logs/vivahmilan-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
