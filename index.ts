import { Elysia } from 'elysia'

const CHANNEL_ACCESS_TOKEN = 'DI9oR2Vd7now3WbZHjdQ+zai/+YsTqWGOgwdIAqL30SqmoLiriwgk7gbj5Y/STAe7shTsTWVmdmaWNE6QBP8kovd7Fji4CqMMXlrlC5/PyQ8w/c9iiY8GNas5ld7NVAOFmQ1MdP45JBOIFoJEJ5/7gdB04t89/1O/w1cDnyilFU=';

const app = new Elysia()
  .post("/webhook", async ({ body }) => {
    const events = (body as any).events;
    
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const replyToken = event.replyToken;
        const msg = event.message.text;

        // ตอบกลับแบบจ๊วดๆ สไตล์กะเพราวันหยุด
        await fetch('https://api.line.me/v2/bot/message/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
          },
          body: JSON.stringify({
            replyToken: replyToken,
            messages: [
              { type: 'text', text: `รับออเดอร์ "${msg}" แล้วครับจารย์! 🍳` },
              { type: 'text', text: `เดี๋ยวรีบผัดให้จ๊วดๆ เลยครับ! Updated!` }
            ]
          })
        });
      }
    }
    return "OK"
  })
  .listen(3000)

console.log("🚀 บอทกะเพราวันหยุด พร้อมลุย!");
