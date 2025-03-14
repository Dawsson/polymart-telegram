import * as cheerio from "cheerio";
import Elysia from "elysia";
import { controller } from "./elysia";
import { sendWebhook } from "./utils/alerts";

export type Store = {
  env: Env;
};

export interface Env {
  POLYMART_WEBHOOK_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  DISCORD_WEBHOOK: string;
  MONEY_MADE: KVNamespace;
}

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
    const elysiaApp = await new Elysia({
      aot: false,
    })
      .state("env", env)
      .use(controller)
      .handle(request);

    return elysiaApp;
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
