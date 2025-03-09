// @ts-ignore - Ignoring type issues with discord-webhook-node
import { Webhook, MessageBuilder } from "discord-webhook-node";

interface DiscordConfig {
  webhookUrl: string;
}

export class DiscordService {
  private webhook: Webhook;

  constructor(config: DiscordConfig) {
    this.webhook = new Webhook(config.webhookUrl);
    // Set a custom username and avatar for the webhook
    this.webhook.setUsername("Notification Bot");
    this.webhook.setAvatar("https://i.imgur.com/wSTFkRM.png");
  }

  async sendPurchaseNotification(productName: string) {
    try {
      const embed = new MessageBuilder()
        .setTitle("🎉 New Plugin Portal Purchase!")
        .setColor(0x00ff00) // Green color
        .addField("Product", productName, true)
        .addField("Amount", "$15.00", true)
        .setFooter("Plugin Portal")
        .setTimestamp();

      return await this.webhook.send(embed);
    } catch (error) {
      console.error("Error sending Discord purchase notification:", error);
      throw error;
    }
  }

  async sendCarbonHostNotification(cents: number) {
    try {
      const dollars = (cents / 100).toFixed(2);
      const embed = new MessageBuilder()
        .setTitle("🖥️ New Carbon Host Order!")
        .setColor(0x2b87ff) // Blue color
        .addField("Service", "Minecraft Server Hosting", true)
        .addField("Amount", `$${dollars}`, true)
        .setFooter("Carbon Host")
        .setTimestamp();

      return await this.webhook.send(embed);
    } catch (error) {
      console.error("Error sending Discord carbon notification:", error);
      throw error;
    }
  }
}
