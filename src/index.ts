import * as cheerio from "cheerio";
import Elysia from "elysia";
import { controller } from "./elysia";
import { sendAlert, sendWebhook } from "./utils/alerts";
import { getPurchases, getBBBPurchases, setPurchases } from "./utils/scraping";

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
      const bbbPurchases = await getBBBPurchases();

      console.log("BBB KV:", bbbKV);
      console.log("BBB Purchases:", bbbPurchases);

      if (bbbPurchases > bbbKV) {
        for (let i = bbbKV; i < bbbPurchases; i++) {
          sendAlert("Plugin Portal Premium", 15, env.DISCORD_WEBHOOK, {
            botToken: env.TELEGRAM_BOT_TOKEN,
            chatId: env.TELEGRAM_CHAT_ID,
          });
        }

        await setPurchases("bbb-purchases", bbbPurchases, env);
      }
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
