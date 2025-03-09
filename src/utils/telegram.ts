import { bold, code, italic } from "./formatting";

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export class TelegramService {
  private baseUrl: string;
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  async sendMessage(text: string, parseMode: "HTML" | "MarkdownV2" = "HTML") {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: this.config.chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send Telegram message: ${response.statusText}`
      );
    }

    return response.json();
  }

  async sendPurchaseNotification(productName: string) {
    const message = `
🎉 ${bold("New Plugin Portal Purchase!")}

${italic("Product")}: ${code(productName)}
${italic("Amount")}: ${code("$15.00")}

Thank you for your purchase! 🚀
    `.trim();

    return this.sendMessage(message);
  }

  async sendCarbonOffsetNotification(cents: number) {
    const dollars = (cents / 100).toFixed(2);
    const message = `
🖥️ ${bold("New Carbon Host Order!")}

${italic("Service")}: ${code("Minecraft Server Hosting")}
${italic("Amount")}: ${code(`$${dollars}`)}

Thank you for choosing Carbon Host! ⚡
    `.trim();

    return this.sendMessage(message);
  }
}
