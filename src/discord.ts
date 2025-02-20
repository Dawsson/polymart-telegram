import { Webhook, MessageBuilder } from 'discord-webhook-node';

interface DiscordConfig {
  webhookUrl: string;
}

export class DiscordService {
  private webhook: Webhook;

  constructor(config: DiscordConfig) {
    this.webhook = new Webhook(config.webhookUrl);
  }

  private async sendWebhook(embed: MessageBuilder) {
    try {
      await this.webhook.send(embed);
    } catch (error) {
      throw new Error(`Failed to send Discord message: ${error.message}`);
    }
  }

  async sendPurchaseNotification(productName: string) {
    const embed = new MessageBuilder()
      .setTitle('🎉 New Plugin Portal Purchase!')
      .setColor('#00ff00') // Green color
      .addField('Product', `\`${productName}\``, true)
      .addField('Amount', '`$15.00`', true)
      .setFooter('Plugin Portal')
      .setTimestamp();

    return this.sendWebhook(embed);
  }

  async sendCarbonHostNotification(cents: number) {
    const dollars = (cents / 100).toFixed(2);
    const embed = new MessageBuilder()
      .setTitle('🖥️ New Carbon Host Order!')
      .setColor('#2b87ff') // Blue color
      .addField('Service', '`Minecraft Server Hosting`', true)
      .addField('Amount', `\`$${dollars}\``, true)
      .setFooter('Carbon Host')
      .setTimestamp();

    return this.sendWebhook(embed);
  }
}
