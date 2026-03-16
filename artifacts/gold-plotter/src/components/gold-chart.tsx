import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import type { GoldPricePoint } from "@workspace/api-client-react";

interface GoldChartProps {
  data: GoldPricePoint[];
  minPrice: number;
  maxPrice: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#18181b]/95 border border-primary/30 p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-muted-foreground text-xs mb-1 font-medium uppercase tracking-wider">
          {format(new Date(label), "MMM d, yyyy")}
        </p>
        <p className="text-primary font-mono text-xl font-bold">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function GoldChart({ data, minPrice, maxPrice }: GoldChartProps) {
  // Calculate domain with padding so the chart doesn't clip the top/bottom bounds aggressively
  const padding = (maxPrice - minPrice) * 0.1;
  const domain = [Math.max(0, minPrice - padding), maxPrice + padding];

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="4 4" 
            vertical={false} 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.4} 
          />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(val) => {
              try {
                return format(new Date(val), "MMM d");
              } catch { 
                return val; 
              }
            }}
            minTickGap={40}
            dy={10}
          />
          <YAxis 
            domain={domain}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(val) => `$${val.toLocaleString()}`}
            width={75}
            orientation="right"
            dx={10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
          />
          <Area 
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#goldGradient)" 
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
