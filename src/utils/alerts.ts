// @ts-ignore - Ignoring type issues with discord-webhook-node
import { Webhook, MessageBuilder } from "discord-webhook-node";

export const PPAlert = {};

export async function sendAlert(
  product: "Carbon Host" | "Plugin Portal Premium",
  amount: number,
  webhookURL: string,
  telegramConfig?: { botToken: string; chatId: string }
) {
  // Send Discord webhook
  await sendWebhook({
    title: `🎉 Purchase for: ${product}`,
    color: "#00ff00",
    description: "Total Purchases: XXX",
    url: webhookURL,
    fields: [
      {
        name: "Product",
        value: `\`${product}\``,
        inline: true,
      },
      {
        name: "Amount",
        value: `\`$${amount}\``,
        inline: true,
      },
    ],
  });

  // Send Telegram message if config is provided
  if (telegramConfig) {
    await sendTelegramMessage({
      botToken: telegramConfig.botToken,
      chatId: telegramConfig.chatId,
      product,
      amount,
    });
  }
}

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

export async function sendTelegramMessage({
  botToken,
  chatId,
  product,
  amount,
  customMessage,
}: {
  botToken: string;
  chatId: string;
  product: string;
  amount: number | string;
  customMessage?: string;
}) {
  const baseUrl = `https://api.telegram.org/bot${botToken}`;

  // Format the message with HTML tags for styling
  const message =
    customMessage ||
    `
🎉 <b>New Purchase!</b>

<i>Product</i>: <code>${product}</code>
<i>Amount</i>: <code>$${amount}</code>

Thank you for your purchase! 🚀
  `.trim();

  const response = await fetch(`${baseUrl}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send Telegram message: ${response.statusText}`);
  }

  return response.json();
}
