import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";
import { TelegramService } from "./utils/telegram";
import { DiscordService } from "./discord";
import * as cheerio from "cheerio";
import { sendWebhook } from "./utils/alerts";

// Define the environment interface
interface Env {
  POLYMART_WEBHOOK_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  DISCORD_WEBHOOK: string;
  MONEY_MADE: KVNamespace;
}

const app = new Hono<{
  Bindings: Env;
  Variables: {
    polymart: z.infer<typeof polymartSchema>;
  };
}>();

app.use(logger());

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
  };
};

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Polymart webhook schema
const polymartSchema = z.object({
  event: z.string(),
  payload: z.object({
    product: z
      .object({
        name: z.string(),
      })
      .optional(),
  }),
});

type PolymartWebhook = z.infer<typeof polymartSchema>;

app.post("/v1/polymart", async (c) => {
  try {
    const services = createServices(c);

    const productName = "Plugin Portal";

    // Send notifications to both platforms
    await Promise.all([
      services.telegram.sendPurchaseNotification(productName),
      services.discord.sendPurchaseNotification(productName),
    ]);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error processing Polymart webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/v1/carbon", async (c) => {
  try {
    const cents = parseInt(c.req.query("cents") || "0");

    if (isNaN(cents) || cents <= 0) {
      return c.json({ error: "Invalid cents parameter" }, 400);
    }

    const services = createServices(c);

    // Send notifications to both platforms
    await Promise.all([
      services.telegram.sendCarbonOffsetNotification(cents),
      services.discord.sendCarbonHostNotification(cents),
    ]);

    return c.json({ success: true });
  } catch (error) {
    console.error("Error processing Carbon webhook:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

console.log("Starting server...");

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ) {
    try {
      const bbbKV = await getPurchases("bbb-purchases", env);
      console.log("BBB KV:", bbbKV);
      // const spigotmcKV = await getPurchases('spigotmc-purchases', env)

      const bbbPurchases = await getBBBPurchases();
      console.log("BBB Purchases:", bbbPurchases);
      // const spigotmcPurchases = await getSpigotmcPurchases()

      if (bbbPurchases > bbbKV) {
        for (let i = bbbKV; i < bbbPurchases; i++) {
          await sendWebhook({
            title: "🎉 New Plugin Portal Purchase!",
            description: "$15.00",
            fields: [
              {
                name: "BBB Purchases",
                value: bbbPurchases.toString(),
                inline: true,
              },
            ],
            url: env.DISCORD_WEBHOOK,
          });
        }
      }

      await setPurchases("bbb-purchases", bbbPurchases, env);
    } catch (error) {
      console.error("Error in scheduled function:", error);
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Create a new Hono app context with the environment
    return app.fetch(request, env, ctx);
  },
};

async function getPurchases(name: string, env: Env) {
  try {
    const purchases = await env.MONEY_MADE.get(name);
    if (!purchases) {
      console.log("No purchases found for", name);
      await env.MONEY_MADE.put(name, "0");
    }

    console.log("Raw Purchases for", name, purchases);
    return parseInt(purchases || "0");
  } catch (error) {
    console.error(`Error getting purchases for ${name}:`, error);
    return 0;
  }
}

async function setPurchases(name: string, amount: number, env: Env) {
  try {
    await env.MONEY_MADE.put(name, amount.toString());
  } catch (error) {
    console.error(`Error setting purchases for ${name}:`, error);
  }
}

async function getBBBPurchases() {
  try {
    const url = "https://builtbybit.com/resources/plugin-portal-premium.61735/";
    const response = await fetch(url);
    const html = await response.text();

    const $ = cheerio.load(html);
    const purchases = $(".infoBubble.centerText .bold").eq(1).text().trim();

    return parseInt(purchases || "0");
  } catch (error) {
    console.error("Error getting BBB purchases:", error);
    return 0;
  }
}
