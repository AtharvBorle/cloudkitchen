// ==============================================================================
// 🚀 Neo Cloud Bites - PM2 Ecosystem Production Configuration
// Manages: Frontend (Next.js :3000) + Backend API (Next.js :3001)
// Targets: neocloudbites.com (Frontend) & api.neocloudbites.com (Backend API)
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
        PORT: process.env.BACKEND_PORT || 3001,
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
        PORT: process.env.FRONTEND_PORT || 3000,
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
