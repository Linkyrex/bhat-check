import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import type { GoldPricePoint } from "@workspace/api-client-react";

interface GoldChartProps {
  data: GoldPricePoint[];
  minPrice: number;
  maxPrice: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as GoldPricePoint;
  if (!d) return null;
  const isBull = (d.close ?? d.price) >= (d.open ?? d.price);
  return (
    <div className="bg-[#0f0f0f]/97 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl text-sm min-w-[200px]">
      <p className="text-muted-foreground text-xs mb-3 font-semibold uppercase tracking-widest">
        {format(new Date(label), "d MMM yyyy")}
      </p>
      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
        <span className="text-muted-foreground">Open</span>
        <span className="text-right font-mono font-semibold text-foreground">฿{d.open?.toLocaleString("th-TH")}</span>
        <span className="text-muted-foreground">High</span>
        <span className="text-right font-mono font-semibold text-emerald-400">฿{d.high?.toLocaleString("th-TH")}</span>
        <span className="text-muted-foreground">Low</span>
        <span className="text-right font-mono font-semibold text-rose-400">฿{d.low?.toLocaleString("th-TH")}</span>
        <span className="text-muted-foreground">Close</span>
        <span className={`text-right font-mono font-bold ${isBull ? "text-emerald-400" : "text-rose-400"}`}>
          ฿{d.close?.toLocaleString("th-TH")}
        </span>
      </div>
    </div>
  );
};

// Custom candlestick shape — receives the bar's pixel bounds
// Since dataKey = [low, high] as a floating bar:
//   y       = pixel position of "high" (the top of the bar)
//   y+height= pixel position of "low"  (the bottom of the bar)
// We derive open/close pixel positions by linear interpolation.
const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload || height === 0 || !isFinite(y) || !isFinite(height)) return null;

  const { open, close, high, low } = payload as GoldPricePoint;
  if (open == null || close == null || high == null || low == null) return null;

  const range = high - low;
  if (range === 0) return null;

  const pxPerUnit = height / range;
  const yClose = y + (high - close) * pxPerUnit;
  const yOpen = y + (high - open) * pxPerUnit;
  const bodyTop = Math.min(yClose, yOpen);
  const bodyHeight = Math.max(Math.abs(yClose - yOpen), 2);
  const isBull = close >= open;

  const wickColor = isBull ? "hsl(142 65% 50% / 0.7)" : "hsl(0 65% 58% / 0.7)";
  const bodyFill = isBull ? "hsl(142 65% 50%)" : "hsl(0 65% 58%)";
  const glowFill = isBull ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)";
  const candleW = Math.max(Math.floor(width * 0.6), 2);
  const cx = x + width / 2;

  return (
    <g>
      {/* Soft glow behind body */}
      <rect
        x={cx - candleW / 2 - 3}
        y={bodyTop - 3}
        width={candleW + 6}
        height={bodyHeight + 6}
        fill={glowFill}
        rx={4}
      />
      {/* Upper wick: top of bar (high) → top of body */}
      <line x1={cx} y1={y} x2={cx} y2={bodyTop} stroke={wickColor} strokeWidth={1.5} strokeLinecap="round" />
      {/* Lower wick: bottom of body → bottom of bar (low) */}
      <line x1={cx} y1={bodyTop + bodyHeight} x2={cx} y2={y + height} stroke={wickColor} strokeWidth={1.5} strokeLinecap="round" />
      {/* Body */}
      <rect x={cx - candleW / 2} y={bodyTop} width={candleW} height={bodyHeight} fill={bodyFill} rx={2} />
      {/* Subtle shine on bullish candles */}
      {isBull && bodyHeight > 6 && (
        <rect
          x={cx - candleW / 2 + 1}
          y={bodyTop + 1}
          width={Math.max(Math.floor(candleW * 0.3), 1)}
          height={Math.min(Math.floor(bodyHeight * 0.35), 8)}
          fill="rgba(255,255,255,0.22)"
          rx={1}
        />
      )}
    </g>
  );
};

function thinData(data: GoldPricePoint[], maxCandles: number): GoldPricePoint[] {
  if (data.length <= maxCandles) return data;
  const step = Math.ceil(data.length / maxCandles);
  return data.filter((_, i) => i % step === 0 || i === data.length - 1);
}

export function GoldChart({ data, minPrice, maxPrice }: GoldChartProps) {
  const candles = useMemo(() => thinData(data, 80), [data]);

  const padding = (maxPrice - minPrice) * 0.07;
  const domain: [number, number] = [Math.floor(minPrice - padding), Math.ceil(maxPrice + padding)];

  // Each row has a floating bar from [low, high]; custom shape draws the full candle
  const chartData = useMemo(
    () => candles.map((d) => ({ ...d, _wickRange: [d.low ?? d.price, d.high ?? d.price] as [number, number] })),
    [candles]
  );

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
            tickFormatter={(val) => {
              try { return format(new Date(val), "d MMM"); } catch { return val; }
            }}
            minTickGap={48}
            dy={10}
          />
          <YAxis
            domain={domain}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickFormatter={(val) => `฿${val.toLocaleString("th-TH")}`}
            width={90}
            orientation="right"
            dx={8}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "4 4", strokeOpacity: 0.5 }}
          />
          <Bar
            dataKey="_wickRange"
            shape={<CandleShape />}
            isAnimationActive={true}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
