// ==============================================================================
// 🚀 Neo Cloud Bites - PM2 Ecosystem Configuration
// Manages: Frontend (Next.js :3000) + Backend API (Next.js :3001)
// ==============================================================================

module.exports = {
  apps: [
    // ── Backend API (dev.api.neocloudbites.com) ──────────────────────────
    {
      name: "neocloudbites-backend-dev",
      cwd: "./backend",
      script: "./node_modules/.bin/next",
      args: "start -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      watch: false,
      max_memory_restart: "512M",
      instances: 1,
      autorestart: true,
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
    },

    // ── Frontend (dev.neocloudbites.com) ─────────────────────────────────
    {
      name: "neocloudbites-frontend-dev",
      cwd: "./frontend",
      script: "./node_modules/.bin/next",
      args: "start -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      watch: false,
      max_memory_restart: "512M",
      instances: 1,
      autorestart: true,
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
    },
  ],
};
