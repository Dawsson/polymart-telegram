import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { TelegramService } from './telegram'

const app = new Hono<{
  Bindings: {
    POLYMART_WEBHOOK_SECRET: string
    TELEGRAM_BOT_TOKEN: string
    TELEGRAM_CHAT_ID: string
  }
}>()

app.use(logger())

// Initialize Telegram service
const createTelegramService = (c: any) => {
  return new TelegramService({
    botToken: c.env.TELEGRAM_BOT_TOKEN,
    chatId: c.env.TELEGRAM_CHAT_ID,
  })
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post("/v1/polymart", async (c) => {

  const telegram = createTelegramService(c)
  await telegram.sendPurchaseNotification('Plugin Portal')

  return c.json({ success: true })
})

app.post("/v1/carbon", async (c) => {
  const cents = parseInt(c.req.query('cents') || '0')
  
  if (isNaN(cents) || cents <= 0) {
    return c.json({ error: 'Invalid cents parameter' }, 400)
  }

  const telegram = createTelegramService(c)
  await telegram.sendCarbonOffsetNotification(cents)

  return c.json({ success: true })
})

console.log("Starting server...")

export default app
