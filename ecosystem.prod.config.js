// ==============================================================================
// 🚀 Neo Cloud Bites - PM2 Ecosystem Production Configuration
// Manages: Frontend (Next.js :3002) + Backend API (Next.js :3003)
// Targets: neocloudbites.com (Frontend) & api.neocloudbites.com (Backend API)
// Note: Uses ports 3002 and 3003 so it never clashes with dev processes on 3000 and 3001
// ==============================================================================

module.exports = {
  apps: [
    // ── Backend API (api.neocloudbites.com) ─────────────────────────────
    {
      name: "neocloudbites-backend-prod",
      cwd: "./backend",
      script: "./node_modules/.bin/next",
      args: "start -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: process.env.BACKEND_PORT || 3003,
      },
      watch: false,
      max_memory_restart: "1G",
      instances: 1,
      autorestart: true,
      error_file: "./logs/backend-prod-error.log",
      out_file: "./logs/backend-prod-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
    },

    // ── Frontend (neocloudbites.com) ───────────────────────────────────
    {
      name: "neocloudbites-frontend-prod",
      cwd: "./frontend",
      script: "./node_modules/.bin/next",
      args: "start -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: process.env.FRONTEND_PORT || 3002,
      },
      watch: false,
      max_memory_restart: "1G",
      instances: 1,
      autorestart: true,
      error_file: "./logs/frontend-prod-error.log",
      out_file: "./logs/frontend-prod-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      time: true,
    },
  ],
};
