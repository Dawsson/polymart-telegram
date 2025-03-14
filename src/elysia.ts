import Elysia, { t } from "elysia";
import { sendAlert } from "./utils/alerts";
import { Store } from ".";

export const controller = new Elysia({
  prefix: "/v1",
  aot: false,
})
  .post("/polymart", async (ctx) => {
    const store = ctx.store as Store;

    await sendAlert("Plugin Portal Premium", 15, store.env.DISCORD_WEBHOOK, {
      botToken: store.env.TELEGRAM_BOT_TOKEN,
      chatId: store.env.TELEGRAM_CHAT_ID,
    });

    return {
      message: "success",
    };
  })
  .post(
    "/carbon",
    async (ctx) => {
      const { cents } = ctx.query;
      const store = ctx.store as Store;

      await sendAlert("Carbon Host", cents / 100, store.env.DISCORD_WEBHOOK, {
        botToken: store.env.TELEGRAM_BOT_TOKEN,
        chatId: store.env.TELEGRAM_CHAT_ID,
      });

      return {
        message: "success",
      };
    },
    {
      query: t.Object({
        cents: t.Number(),
      }),
    }
  );
