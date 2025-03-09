import { Hono } from "hono";
import { logger } from "hono/logger";
import { z } from "zod";
import { TelegramService } from "./telegram";
import { DiscordService } from "./discord";
import * as cheerio from "cheerio";

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
      // const spigotmcKV = await getPurchases('spigotmc-purchases', env)

      const bbbPurchases = await getBBBPurchases();
      // const spigotmcPurchases = await getSpigotmcPurchases()

      console.log(`BBB Purchases: ${bbbPurchases}, BBB KV: ${bbbKV}`);
      if (bbbPurchases > bbbKV) {
        console.log(`BBB Purchases are greater than the KV`);
      }
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
      await env.MONEY_MADE.put(name, "0");
    }

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
