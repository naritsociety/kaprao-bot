module.exports = {
  apps: [
    {
      name: 'kaprao-api',
      script: './src/index.ts',
      interpreter: 'bun', // หรือ path ของ bun
      interpreter_args: 'run',
      // ส่วนนี้สำคัญมาก! เพื่อให้ PM2 ส่ง env vars เข้าไปในแอป
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET,
      },
    },
  ],
}