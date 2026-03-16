import { Router, type IRouter } from "express";
import {
  GetGoldPricesResponse,
  GetCurrentGoldPriceResponse,
  GetGoldPricesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// 1 Baht gold = 15.244 grams of 96.5% purity gold
// Current Thai Gold Traders Association price ~46,000–47,500 THB per Baht (March 2026)
function generateGoldPrices(range: string) {
  const now = new Date();
  let days: number;
  switch (range) {
    case "1m": days = 30; break;
    case "3m": days = 90; break;
    case "6m": days = 180; break;
    case "5y": days = 1825; break;
    default: days = 365;
  }

  let basePrice: number;
  if (range === "5y") basePrice = 30000;
  else if (range === "1y") basePrice = 38000;
  else if (range === "6m") basePrice = 42000;
  else if (range === "3m") basePrice = 44000;
  else basePrice = 45500;

  const data: {
    date: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[] = [];

  let currentPrice = basePrice;
  const seed = days;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const dayIndex = days - i;
    const trend = Math.sin(dayIndex / (days * 0.15)) * 0.07 + (dayIndex / days) * 0.22;
    const noise = (Math.sin(dayIndex * 17.3 + seed) + Math.sin(dayIndex * 7.1 + seed * 2)) * 0.011;

    currentPrice = basePrice * (1 + trend + noise);

    const dailyVolatility = currentPrice * 0.009;
    const open = currentPrice + Math.sin(dayIndex * 3.7) * dailyVolatility * 0.4;
    const close = currentPrice;
    const high = Math.max(open, close) + Math.abs(Math.sin(dayIndex * 11.3)) * dailyVolatility * 1.2;
    const low = Math.min(open, close) - Math.abs(Math.sin(dayIndex * 13.7)) * dailyVolatility * 1.2;

    data.push({
      date: dateStr,
      price: Math.round(currentPrice),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
    });
  }

  return data;
}

router.get("/prices", (req, res) => {
  const queryResult = GetGoldPricesQueryParams.safeParse(req.query);
  const range = queryResult.success ? (queryResult.data.range ?? "1y") : "1y";

  const data = generateGoldPrices(range);
  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const startPrice = data[0]?.price ?? 0;
  const endPrice = data[data.length - 1]?.price ?? 0;
  const changePercent = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

  const response = GetGoldPricesResponse.parse({
    range,
    currency: "THB",
    unit: "baht",
    data,
    minPrice,
    maxPrice,
    startPrice,
    endPrice,
    changePercent: Math.round(changePercent * 100) / 100,
  });

  res.json(response);
});

router.get("/current", (_req, res) => {
  const now = new Date();
  const todayData = generateGoldPrices("1m");
  const current = todayData[todayData.length - 1];
  const prevClose = todayData[todayData.length - 2]?.price ?? current.price;
  const change = current.price - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  const response = GetCurrentGoldPriceResponse.parse({
    price: current.price,
    currency: "THB",
    unit: "baht",
    change: Math.round(change),
    changePercent: Math.round(changePercent * 100) / 100,
    timestamp: now.toISOString(),
    previousClose: Math.round(prevClose),
  });

  res.json(response);
});

export default router;
