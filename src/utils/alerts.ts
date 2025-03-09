// @ts-ignore - Ignoring type issues with discord-webhook-node
import { Webhook, MessageBuilder } from "discord-webhook-node";
import { TelegramService } from "./telegram";

export async function sendWebhook({
  title,
  description,
  url,
  color,
  fields,
}: {
  title: string;
  description: string;
  url: string;
  color?: string;
  fields: {
    name: string;
    value: string;
    inline: boolean;
  }[];
}) {
  const webhook = new Webhook(url);

  const embed = new MessageBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color || "#00ff00")
    .setTimestamp();

  for (const field of fields) {
    embed.addField(field.name, field.value, field.inline);
  }

  await webhook.send(embed);
}
