import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { verify } from 'hono/utils/crypto'

const app = new Hono<{
  Bindings: {
    POLYMART_WEBHOOK_SECRET: string
    TELEGRAM_BOT_TOKEN: string
    TELEGRAM_CHAT_ID: string
  }
}>()

app.use(logger())

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post("/v1/polymart", async (c) => {
  // Verify the webhook signature
  const signature = c.req.header('X-Polymart-Signature')
  const rawBody = await c.req.text()
  
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 401)
  }

  // Should validate, url is private, just assuming no one can access it.
  const body: {
    event: string,
    payload: {
      
    }
  } = JSON.parse(rawBody)

  // Handle purchase event
  if (body.event === 'product.user.purchase') {

    // Send Telegram message, name is Plugin Portal
    const message = `🎉 New Purchase!\n\nProduct: Plugin Portal`
    
    await fetch(
      `https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: c.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    )
  }

  return c.json({ success: true })
})

console.log("Starting server...")

export default app
