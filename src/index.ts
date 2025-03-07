import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { z } from 'zod'
import { TelegramService } from './telegram'
import { DiscordService } from './discord'

const app = new Hono<{
  Bindings: {
    POLYMART_WEBHOOK_SECRET: string
    TELEGRAM_BOT_TOKEN: string
    TELEGRAM_CHAT_ID: string
    DISCORD_WEBHOOK: string
  }
  Variables: {
    polymart: z.infer<typeof polymartSchema>
  }
}>()

app.use(logger())

// Initialize notification services
const createServices = (c: any) => {
  return {
    telegram: new TelegramService({
      botToken: c.env.TELEGRAM_BOT_TOKEN,
      chatId: c.env.TELEGRAM_CHAT_ID,
    }),
    discord: new DiscordService({
      webhookUrl: c.env.DISCORD_WEBHOOK,
    }),
  }
}

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Polymart webhook schema
const polymartSchema = z.object({
  event: z.string(),
  payload: z.object({
    product: z.object({
      name: z.string(),
    }).optional(),
  }),
})

type PolymartWebhook = z.infer<typeof polymartSchema>

app.post("/v1/polymart", async (c) => {
  try {
    const services = createServices(c)

    const productName = 'Plugin Portal'

    // Send notifications to both platforms
    await Promise.all([
      services.telegram.sendPurchaseNotification(productName),
      services.discord.sendPurchaseNotification(productName),
    ])

    return c.json({ success: true })
  } catch (error) {
    console.error('Error processing Polymart webhook:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

app.post("/v1/carbon", async (c) => {
  try {
    const cents = parseInt(c.req.query('cents') || '0')
    
    if (isNaN(cents) || cents <= 0) {
      return c.json({ error: 'Invalid cents parameter' }, 400)
    }

    const services = createServices(c)

    // Send notifications to both platforms
    await Promise.all([
      services.telegram.sendCarbonOffsetNotification(cents),
      services.discord.sendCarbonHostNotification(cents),
    ])

    return c.json({ success: true })
  } catch (error) {
    console.error('Error processing Carbon webhook:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

console.log("Starting server...")

export default app
