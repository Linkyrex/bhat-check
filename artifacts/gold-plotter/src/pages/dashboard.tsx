import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Activity, BarChart3, AlertCircle } from "lucide-react";
import { useGetGoldPrices, useGetCurrentGoldPrice, GetGoldPricesRange } from "@workspace/api-client-react";
import { GoldChart } from "@/components/gold-chart";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export function Dashboard() {
  const ranges = Object.values(GetGoldPricesRange);
  const [range, setRange] = useState<typeof ranges[number]>(GetGoldPricesRange["1y"]);

  // Polling current price every 60 seconds
  const { data: currentData, isLoading: isLoadingCurrent, isError: isErrorCurrent } = useGetCurrentGoldPrice({
    query: { refetchInterval: 60000 }
  });
  
  const { data: historicalData, isLoading: isLoadingHistorical, isError: isErrorHistorical } = useGetGoldPrices({ range });

  const isPositive = currentData ? currentData.change >= 0 : true;

  return (
    <div className="min-h-screen relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Top Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center shadow-xl shadow-primary/20">
            <BarChart3 className="text-primary-foreground w-7 h-7" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Aurum<span className="text-primary">Plot</span>
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 px-5 py-2.5 bg-card/60 border border-border/50 rounded-full text-sm font-semibold text-muted-foreground backdrop-blur-xl shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          Live Market Data
        </div>
      </header>

      <main>
        {/* Spot Price & Range Selector */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-10">
          <div className="relative">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Live Spot Price (USD/oz)</h2>
            {isLoadingCurrent || !currentData ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-72 rounded-xl bg-muted/40" />
                <Skeleton className="h-8 w-40 rounded-lg bg-muted/40" />
              </div>
            ) : isErrorCurrent ? (
              <div className="text-rose-500 flex items-center gap-2 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertCircle className="w-5 h-5" /> Failed to load current spot price
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-5"
              >
                <span className="text-6xl sm:text-[80px] leading-none font-display font-bold tracking-tighter text-foreground drop-shadow-sm">
                  {formatCurrency(currentData.price)}
                </span>
                <span className={cn(
                  "text-xl sm:text-2xl font-semibold flex items-center px-4 py-1.5 rounded-xl bg-background/60 border border-border/50 w-fit shadow-inner backdrop-blur-sm", 
                  isPositive ? "text-emerald-400" : "text-rose-400"
                )}>
                  {isPositive ? <TrendingUp className="w-6 h-6 mr-2" /> : <TrendingDown className="w-6 h-6 mr-2" />}
                  {currentData.change > 0 ? "+" : ""}{formatCurrency(currentData.change)} 
                  <span className="ml-1.5 opacity-80 text-lg">({currentData.changePercent > 0 ? "+" : ""}{currentData.changePercent.toFixed(2)}%)</span>
                </span>
              </motion.div>
            )}
          </div>

          {/* Time Range Pills */}
          <div className="flex bg-card/60 p-1.5 rounded-2xl border border-border/50 backdrop-blur-xl shadow-lg overflow-x-auto max-w-full">
            {ranges.map(r => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 min-w-[70px] uppercase tracking-wide",
                  range === r 
                    ? "bg-gradient-to-b from-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/30 scale-100" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 scale-95 hover:scale-100"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full bg-card/40 border border-border/60 rounded-[32px] p-5 sm:p-8 lg:p-10 backdrop-blur-2xl mb-8 relative group shadow-2xl"
        >
          {/* Subtle hover glow behind the chart */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-[32px] pointer-events-none" />
          
          {isLoadingHistorical || !historicalData ? (
            <Skeleton className="w-full h-[450px] rounded-[24px] bg-muted/20" />
          ) : isErrorHistorical ? (
             <div className="w-full h-[450px] flex items-center justify-center text-muted-foreground flex-col gap-4 bg-muted/10 rounded-[24px] border border-border/30">
               <AlertCircle className="w-12 h-12 text-rose-500/50" />
               <p className="text-lg">Historical data currently unavailable.</p>
             </div>
          ) : (
            <GoldChart 
              data={historicalData.data} 
              minPrice={historicalData.minPrice} 
              maxPrice={historicalData.maxPrice} 
            />
          )}
        </motion.div>

        {/* Stats Grid */}
        {historicalData && !isLoadingHistorical && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            <StatCard 
              title="Period High" 
              value={formatCurrency(historicalData.maxPrice)} 
              icon={TrendingUp} 
              trend="up" 
            />
            <StatCard 
              title="Period Low" 
              value={formatCurrency(historicalData.minPrice)} 
              icon={TrendingDown} 
              trend="down" 
            />
            <StatCard 
              title={`${range.toUpperCase()} Change`} 
              value={`${historicalData.changePercent > 0 ? '+' : ''}${historicalData.changePercent.toFixed(2)}%`} 
              icon={Activity} 
              trend={historicalData.changePercent >= 0 ? "up" : "down"} 
            />
            <StatCard 
              title="Current vs High" 
              value={currentData ? `${(((currentData.price - historicalData.maxPrice) / historicalData.maxPrice) * 100).toFixed(2)}%` : '-'} 
              icon={Clock} 
              trend="neutral" 
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Reusable micro-component for the stats
function StatCard({ title, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-card/50 border border-border/50 p-6 rounded-[24px] flex items-center justify-between hover:bg-card/80 hover:border-border transition-all duration-300 backdrop-blur-xl shadow-lg group hover:-translate-y-1">
      <div>
        <p className="text-sm text-muted-foreground font-semibold mb-1.5 uppercase tracking-wider group-hover:text-foreground/80 transition-colors">
          {title}
        </p>
        <p className="text-3xl font-display font-bold text-foreground font-mono">
          {value}
        </p>
      </div>
      <div className={cn(
        "p-4 rounded-2xl shadow-inner", 
        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
        trend === 'down' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
        'bg-primary/10 text-primary border border-primary/20'
      )}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  );
}
