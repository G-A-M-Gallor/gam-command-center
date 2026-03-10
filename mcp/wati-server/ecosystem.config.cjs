// PM2 config for Hostinger VPS
module.exports = {
  apps: [
    {
      name: "wati-mcp",
      script: "dist/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 3100,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "200M",
    },
  ],
};
