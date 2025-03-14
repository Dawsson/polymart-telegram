import { Env } from "..";
import * as cheerio from "cheerio";

export async function getPurchases(name: string, env: Env) {
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

export async function setPurchases(name: string, amount: number, env: Env) {
  try {
    await env.MONEY_MADE.put(name, amount.toString());
  } catch (error) {
    console.error(`Error setting purchases for ${name}:`, error);
  }
}

export async function getBBBPurchases() {
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
