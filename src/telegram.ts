import { bold, code, italic } from './utils/formatting'

interface TelegramConfig {
  botToken: string
  chatId: string
}

export class TelegramService {
  private baseUrl: string
  private config: TelegramConfig

  constructor(config: TelegramConfig) {
    this.config = config
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`
  }

  async sendMessage(text: string, parseMode: 'HTML' | 'MarkdownV2' = 'HTML') {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.config.chatId,
        text,
        parse_mode: parseMode,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send Telegram message: ${response.statusText}`)
    }

    return response.json()
  }

  async sendPurchaseNotification(productName: string) {
    const message = `
🎉 ${bold('New Purchase!')}

${italic('Product')}: ${code(productName)}
    `.trim()

    return this.sendMessage(message)
  }

  async sendCarbonOffsetNotification(cents: number) {
    const dollars = (cents / 100).toFixed(2)
    const message = `
♻️ ${bold('Carbon Offset Contribution')}

${italic('Amount')}: ${code(`$${dollars}`)}

Thank you for helping make the world a better place! 🌱
    `.trim()

    return this.sendMessage(message)
  }
} 