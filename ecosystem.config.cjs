module.exports = {
  apps: [
    {
      name: 'kaprao-api',
      script: './src/index.ts',
      interpreter: 'bun',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
}
