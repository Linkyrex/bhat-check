import { Router, type IRouter } from "express";
import {
  GetGoldPricesResponse,
  GetCurrentGoldPriceResponse,
  GetGoldPricesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// 1 Baht Thai gold ornament (ทองรูปพรรณ) = 15.244g at 96.5% purity
const GRAMS_PER_BAHT = 15.244;
const TROY_OZ_GRAMS = 31.1035;
const THAI_GOLD_PURITY = 0.965;

// Simple in-memory cache to avoid hammering external APIs
const cache: Record<string, { data: unknown; expiresAt: number }> = {};
function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && Date.now() < entry.expiresAt) return entry.data as T;
  return null;
}
function setCache(key: string, data: unknown, ttlMs: number) {
  cache[key] = { data, expiresAt: Date.now() + ttlMs };
}

// Convert international spot price to Thai 1 Baht gold price in THB
function toBahtGoldTHB(xauUsd: number, usdThb: number): number {
  return Math.round((xauUsd / TROY_OZ_GRAMS) * GRAMS_PER_BAHT * THAI_GOLD_PURITY * usdThb);
}

async function fetchLiveSpotPrice(): Promise<number> {
  const cached = getCached<number>("spot");
  if (cached) return cached;

  const res = await fetch("https://api.gold-api.com/price/XAU", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`gold-api.com failed: ${res.status}`);
  const json = (await res.json()) as { price: number };
  setCache("spot", json.price, 5 * 60 * 1000); // 5 min
  return json.price;
}

async function fetchLiveUsdThb(): Promise<number> {
  const cached = getCached<number>("usdthb");
  if (cached) return cached;

  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error(`exchange rate API failed: ${res.status}`);
  const json = (await res.json()) as { rates: Record<string, number> };
  const rate = json.rates["THB"];
  setCache("usdthb", rate, 60 * 60 * 1000); // 1 hour
  return rate;
}

async function fetchYahooFinance(symbol: string, range: string, interval: string) {
  const cacheKey = `yahoo_${symbol}_${range}_${interval}`;
  const cached = getCached<unknown[]>(cacheKey);
  if (cached) return cached;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Yahoo Finance failed for ${symbol}: ${res.status}`);
  const json = (await res.json()) as {
    chart: {
      result: Array<{
        timestamp: number[];
        indicators: {
          quote: Array<{
            open: (number | null)[];
            high: (number | null)[];
            low: (number | null)[];
            close: (number | null)[];
          }>;
        };
      }>;
    };
  };
  const result = json.chart.result?.[0];
  if (!result) throw new Error(`No data from Yahoo Finance for ${symbol}`);

  const ts = result.timestamp;
  const q = result.indicators.quote[0];
  const rows = ts.map((t, i) => ({
    date: new Date(t * 1000).toISOString().split("T")[0],
    open: q.open[i],
    high: q.high[i],
    low: q.low[i],
    close: q.close[i],
  }));

  setCache(cacheKey, rows, 15 * 60 * 1000); // 15 min
  return rows;
}

const RANGE_MAP: Record<string, { yRange: string; yInterval: string }> = {
  "1m": { yRange: "1mo", yInterval: "1d" },
  "3m": { yRange: "3mo", yInterval: "1d" },
  "6m": { yRange: "6mo", yInterval: "1d" },
  "1y": { yRange: "1y",  yInterval: "1wk" },
  "5y": { yRange: "5y",  yInterval: "1wk" },
};

router.get("/prices", async (req, res) => {
  const queryResult = GetGoldPricesQueryParams.safeParse(req.query);
  const range = queryResult.success ? (queryResult.data.range ?? "1y") : "1y";
  const { yRange, yInterval } = RANGE_MAP[range] ?? RANGE_MAP["1y"];

  // Fetch gold (GC=F) and USD/THB (THB=X) in parallel
  const [goldRows, fxRows] = await Promise.all([
    fetchYahooFinance("GC=F", yRange, yInterval),
    fetchYahooFinance("THB=X", yRange, yInterval),
  ]);

  // Build a date → USDTHB map
  const fxMap: Record<string, number> = {};
  for (const row of fxRows) {
    if (row.close != null) fxMap[row.date] = row.close;
  }

  // Carry-forward last known FX rate to fill gaps
  let lastFx = fxRows.find((r) => r.close != null)?.close ?? 33;

  const data: {
    date: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[] = [];

  for (const row of goldRows) {
    if (row.close == null) continue;
    const fx = fxMap[row.date] ?? lastFx;
    lastFx = fx;

    const close = toBahtGoldTHB(row.close, fx);
    const open  = row.open  != null ? toBahtGoldTHB(row.open,  fx) : close;
    const high  = row.high  != null ? toBahtGoldTHB(row.high,  fx) : close;
    const low   = row.low   != null ? toBahtGoldTHB(row.low,   fx) : close;

    data.push({ date: row.date, price: close, open, high, low, close });
  }

  if (data.length === 0) {
    res.status(503).json({ error: "No data available" });
    return;
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const startPrice = data[0].price;
  const endPrice = data[data.length - 1].price;
  const changePercent = Math.round(((endPrice - startPrice) / startPrice) * 10000) / 100;

  res.json(
    GetGoldPricesResponse.parse({
      range,
      currency: "THB",
      unit: "baht",
      data,
      minPrice,
      maxPrice,
      startPrice,
      endPrice,
      changePercent,
    })
  );
});

router.get("/current", async (_req, res) => {
  const [xauUsd, usdThb] = await Promise.all([
    fetchLiveSpotPrice(),
    fetchLiveUsdThb(),
  ]);

  const price = toBahtGoldTHB(xauUsd, usdThb);

  // Approximate previous close using yesterday's daily GC=F
  let previousClose = price;
  try {
    const rows = await fetchYahooFinance("GC=F", "5d", "1d");
    const validRows = rows.filter((r) => r.close != null);
    if (validRows.length >= 2) {
      const prevFx = usdThb; // same-day FX is fine for prev close approx
      previousClose = toBahtGoldTHB(validRows[validRows.length - 2].close!, prevFx);
    }
  } catch {
    // fall back to same as price
  }

  const change = price - previousClose;
  const changePercent = Math.round((change / previousClose) * 10000) / 100;

  res.json(
    GetCurrentGoldPriceResponse.parse({
      price,
      currency: "THB",
      unit: "baht",
      change: Math.round(change),
      changePercent,
      timestamp: new Date().toISOString(),
      previousClose,
    })
  );
});

export default router;
