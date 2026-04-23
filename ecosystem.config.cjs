const path = require('path');
const fs = require('fs');

// Manually parse .env.production so PM2 can pass vars to all workers
function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
  return env;
}

const envVars = parseEnvFile(path.join(__dirname, '.env.production'));

module.exports = {
  apps: [
    {
      name: 'vivahmilan',
      script: 'server.mjs',
      cwd: '/home/vivahdwar/htdocs/vivahdwar.com/vivahmilan',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-http-header-size=65536',
      watch: false,
      max_memory_restart: '512M',
      error_file: '/root/.pm2/logs/vivahmilan-error.log',
      out_file: '/root/.pm2/logs/vivahmilan-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        ...envVars,
      },
    },
  ],
};
