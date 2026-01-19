"use client";

import { useState, useMemo } from "react";
import { useCoffeeTimes } from "@/lib/hooks/useCoffeeTimes";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { Coffee, Star, Beaker, TrendingUp } from "lucide-react";

type DateRange = "7d" | "30d" | "90d" | "all";

const dateRangeLabels: Record<DateRange, string> = {
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  all: "All Time",
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
        <TrendingUp className="w-8 h-8 text-accent" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No data yet</h2>
      <p className="text-muted-foreground max-w-sm">
        Start logging your brews to see analytics and trends over time.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtext && <p className="text-sm text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}

const ACCENT_COLOR = "#D4A574";
const CHART_COLORS = ["#D4A574", "#B8956A", "#A08060", "#886B56", "#70564C", "#584142", "#402C38"];

export default function AnalyticsContent() {
  const { coffeeTimes, loading } = useCoffeeTimes({ pageSize: 500 });
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const filteredBrews = useMemo(() => {
    if (!coffeeTimes.length) return [];
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateRange) {
      case "7d": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "30d": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case "90d": startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case "all": startDate = null; break;
    }

    return coffeeTimes.filter((brew) => {
      if (!startDate) return true;
      const brewDate = brew.timestamp?.toDate();
      return brewDate && brewDate >= startDate;
    });
  }, [coffeeTimes, dateRange]);

  const stats = useMemo(() => {
    if (!filteredBrews.length) return { totalBrews: 0, avgRating: null, mostUsedCoffee: null, mostUsedBrewer: null };

    const ratingsSum = filteredBrews.reduce((sum, brew) => sum + (brew.rating || 0), 0);
    const ratedBrews = filteredBrews.filter((brew) => brew.rating);
    const avgRating = ratedBrews.length > 0 ? ratingsSum / ratedBrews.length : null;

    const coffeeCount: Record<string, { name: string; count: number }> = {};
    filteredBrews.forEach((brew) => {
      if (brew.coffeeName) {
        if (!coffeeCount[brew.coffeeName]) coffeeCount[brew.coffeeName] = { name: brew.coffeeName, count: 0 };
        coffeeCount[brew.coffeeName].count++;
      }
    });
    const mostUsedCoffee = Object.values(coffeeCount).sort((a, b) => b.count - a.count)[0] || null;

    const brewerCount: Record<string, { name: string; count: number }> = {};
    filteredBrews.forEach((brew) => {
      if (brew.brewerName) {
        if (!brewerCount[brew.brewerName]) brewerCount[brew.brewerName] = { name: brew.brewerName, count: 0 };
        brewerCount[brew.brewerName].count++;
      }
    });
    const mostUsedBrewer = Object.values(brewerCount).sort((a, b) => b.count - a.count)[0] || null;

    return { totalBrews: filteredBrews.length, avgRating, mostUsedCoffee, mostUsedBrewer };
  }, [filteredBrews]);

  const brewsOverTimeData = useMemo(() => {
    if (!filteredBrews.length) return [];
    const grouped: Record<string, number> = {};

    filteredBrews.forEach((brew) => {
      const date = brew.timestamp?.toDate();
      if (date) {
        const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        grouped[key] = (grouped[key] || 0) + 1;
      }
    });

    const sortedBrews = [...filteredBrews].sort((a, b) => (a.timestamp?.toDate()?.getTime() || 0) - (b.timestamp?.toDate()?.getTime() || 0));
    const orderedDates: string[] = [];
    sortedBrews.forEach((brew) => {
      const date = brew.timestamp?.toDate();
      if (date) {
        const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!orderedDates.includes(key)) orderedDates.push(key);
      }
    });

    return orderedDates.map((date) => ({ date, brews: grouped[date] }));
  }, [filteredBrews]);

  const ratingDistributionData = useMemo(() => {
    if (!filteredBrews.length) return [];
    const distribution: Record<number, number> = {};
    for (let i = 1; i <= 10; i++) distribution[i] = 0;
    filteredBrews.forEach((brew) => { if (brew.rating) distribution[brew.rating]++; });
    return Object.entries(distribution).map(([rating, count]) => ({ rating: Number(rating), count }));
  }, [filteredBrews]);

  const brewsByCoffeeData = useMemo(() => {
    if (!filteredBrews.length) return [];
    const coffeeCount: Record<string, number> = {};
    filteredBrews.forEach((brew) => {
      const name = brew.coffeeName || "Unknown";
      coffeeCount[name] = (coffeeCount[name] || 0) + 1;
    });
    return Object.entries(coffeeCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 7);
  }, [filteredBrews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      {/* Date Range Selector */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          {(Object.keys(dateRangeLabels) as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range ? "bg-accent text-accent-foreground" : "bg-card border border-border hover:bg-card/80"
              }`}
            >
              {dateRangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {filteredBrews.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="p-4 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={<Coffee className="w-5 h-5 text-accent" />} label="Total Brews" value={stats.totalBrews} />
            <StatCard icon={<Star className="w-5 h-5 text-accent" />} label="Avg Rating" value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} subtext={stats.avgRating ? "out of 10" : "No ratings yet"} />
            <StatCard icon={<Coffee className="w-5 h-5 text-accent" />} label="Top Coffee" value={stats.mostUsedCoffee?.name || "—"} subtext={stats.mostUsedCoffee ? `${stats.mostUsedCoffee.count} brews` : undefined} />
            <StatCard icon={<Beaker className="w-5 h-5 text-accent" />} label="Top Brewer" value={stats.mostUsedBrewer?.name || "—"} subtext={stats.mostUsedBrewer ? `${stats.mostUsedBrewer.count} brews` : undefined} />
          </div>

          {/* Brews Over Time Chart */}
          {brewsOverTimeData.length > 1 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Brews Over Time</h2>
              <div className="bg-card rounded-lg border border-border p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={brewsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                    <Line type="monotone" dataKey="brews" stroke={ACCENT_COLOR} strokeWidth={2} dot={{ fill: ACCENT_COLOR, strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Rating Distribution Chart */}
          {ratingDistributionData.some((d) => d.count > 0) && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Rating Distribution</h2>
              <div className="bg-card rounded-lg border border-border p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ratingDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="rating" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value) => [`${value} brews`, "Count"]} />
                    <Bar dataKey="count" fill={ACCENT_COLOR} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Brews by Coffee Chart */}
          {brewsByCoffeeData.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Brews by Coffee</h2>
              <div className="bg-card rounded-lg border border-border p-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={brewsByCoffeeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${(name?.length ?? 0) > 12 ? name?.substring(0, 12) + "..." : name} (${((percent ?? 0) * 100).toFixed(0)}%)`} labelLine={false}>
                      {brewsByCoffeeData.map((_, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value, name) => [`${value} brews`, String(name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {brewsByCoffeeData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                      <span className="text-xs text-muted-foreground">{item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
