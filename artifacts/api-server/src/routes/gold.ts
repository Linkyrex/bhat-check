import { Router, type IRouter } from "express";
import {
  GetGoldPricesResponse,
  GetCurrentGoldPriceResponse,
  GetGoldPricesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Realistic 1 Baht Thai gold price as of March 2026 (~฿47,500)
const TODAY_PRICE = 47500;

// Historical starting prices so each range ends near TODAY_PRICE with realistic growth
const RANGE_CONFIG: Record<string, { days: number; startPrice: number }> = {
  "1m":  { days: 30,   startPrice: 46200 },  // ~+2.8% over 1 month
  "3m":  { days: 90,   startPrice: 44800 },  // ~+6% over 3 months
  "6m":  { days: 180,  startPrice: 42500 },  // ~+11.8% over 6 months
  "1y":  { days: 365,  startPrice: 38500 },  // ~+23.4% over 1 year
  "5y":  { days: 1825, startPrice: 27000 },  // ~+75% over 5 years
};

function generateGoldPrices(range: string) {
  const config = RANGE_CONFIG[range] ?? RANGE_CONFIG["1y"];
  const { days, startPrice } = config;
  const now = new Date();

  const data: {
    date: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[] = [];

  // Linear base path from startPrice to TODAY_PRICE, plus noise
  const totalMove = TODAY_PRICE - startPrice;
  const seed = days * 31;

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const t = (days - i) / days; // 0 → 1 over the period

    // Smooth S-curve trend from startPrice → TODAY_PRICE
    const sCurve = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const trendPrice = startPrice + totalMove * sCurve;

    // Realistic daily noise: ~0.5–0.8% of price
    const noise = (Math.sin(t * days * 0.9 + seed) * 0.5 + Math.sin(t * days * 2.3 + seed * 0.7) * 0.3) * 0.006;
    const close = Math.round(trendPrice * (1 + noise));

    // Daily OHLC within ±0.8% of close
    const dailyVol = close * 0.008;
    const open  = Math.round(close + Math.sin(t * days * 3.1 + 1) * dailyVol * 0.5);
    const high  = Math.round(Math.max(open, close) + Math.abs(Math.sin(t * days * 5.7 + 2)) * dailyVol * 0.9);
    const low   = Math.round(Math.min(open, close) - Math.abs(Math.sin(t * days * 4.3 + 3)) * dailyVol * 0.9);

    data.push({ date: dateStr, price: close, open, high, low, close });
  }

  // Force the very last point to land exactly on TODAY_PRICE for consistency
  if (data.length > 0) {
    const last = data[data.length - 1];
    last.price = TODAY_PRICE;
    last.close = TODAY_PRICE;
    last.high  = Math.max(last.high, TODAY_PRICE);
    last.low   = Math.min(last.low,  TODAY_PRICE);
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
  // Derive yesterday's close from the 1m dataset so change is consistent
  const recentData = generateGoldPrices("1m");
  const prevClose = recentData[recentData.length - 2]?.price ?? TODAY_PRICE;
  const change = TODAY_PRICE - prevClose;
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

  const response = GetCurrentGoldPriceResponse.parse({
    price: TODAY_PRICE,
    currency: "THB",
    unit: "baht",
    change: Math.round(change),
    changePercent: Math.round(changePercent * 100) / 100,
    timestamp: now.toISOString(),
    previousClose: prevClose,
  });

  res.json(response);
});

export default router;
