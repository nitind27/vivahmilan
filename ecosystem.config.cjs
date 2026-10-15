const path = require('path');
const fs = require('fs');

// Manually parse .env.production so PM2 can pass vars to all workers
function parseEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    console.warn('[PM2] Missing env file:', filePath);
    return env;
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    // strip matching surrounding quotes only
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const projectRoot = __dirname;
const envFile = path.join(projectRoot, '.env.production');
const envVars = parseEnvFile(envFile);

if (!envVars.DATABASE_HOST) {
  console.warn('[PM2] DATABASE_HOST missing after parsing', envFile);
} else {
  console.log('[PM2] Loaded DB host:', envVars.DATABASE_HOST);
}

module.exports = {
  apps: [
    {
      name: 'vivahmilan',
      script: 'server.mjs',
      // Always use this file's folder (works on any Hostinger path)
      cwd: projectRoot,
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-http-header-size=65536 --dns-result-order=ipv4first',
      watch: false,
      max_memory_restart: '512M',
      error_file: '~/.pm2/logs/vivahmilan-error.log',
      out_file: '~/.pm2/logs/vivahmilan-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      env: {
        NODE_ENV: 'production',
        ...envVars,
      },
    },
  ],
};
