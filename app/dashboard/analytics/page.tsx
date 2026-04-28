"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  Activity,
  CreditCard,
  Download,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsRangeKey = "7d" | "30d" | "90d";

type DashboardAnalyticsStatCard = {
  key: string;
  label: string;
  value: number;
  value_formatted: string;
  change_percent: number;
  trend: "up" | "down" | string;
};

type DashboardAnalyticsPoint = {
  key: string;
  label: string;
  value: number;
};

type DashboardAnalyticsBreakdownItem = {
  key: string;
  label: string;
  value: number;
  percentage: number;
  color_key: string;
};

type DashboardAnalyticsResponse = {
  range_key: AnalyticsRangeKey;
  stat_cards: DashboardAnalyticsStatCard[];
  user_growth: DashboardAnalyticsPoint[];
  revenue_growth: DashboardAnalyticsPoint[];
  subscription_status: DashboardAnalyticsBreakdownItem[];
  billing_cycle: DashboardAnalyticsBreakdownItem[];
};

const RANGE_OPTIONS: Array<{ key: AnalyticsRangeKey; label: string }> = [
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
];

const STAT_ICONS: Record<string, LucideIcon> = {
  total_users: Users,
  active_subscriptions: CreditCard,
  monthly_revenue: Wallet,
  trial_conversion: Activity,
};

const BREAKDOWN_COLORS: Record<string, string> = {
  primary: "var(--color-primary)",
  dark: "#1F2937",
  muted: "#D1D5DB",
};

const formatChange = (value: number): string => {
  const sign = value > 0 ? "+" : "";
  const decimals = Math.abs(value) >= 10 || value === 0 ? 0 : 1;
  return `${sign}${value.toFixed(decimals)}%`;
};

const formatCompact = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const toTooltipNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value || 0);

function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="animate-pulse">
        <div className="mb-6 flex items-start justify-between">
          <div className="h-12 w-12 rounded-xl bg-orange-50" />
          <div className="h-7 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-3 h-8 w-36 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="animate-pulse">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-6 w-36 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="flex h-[260px] items-end gap-3">
          {[42, 60, 48, 75, 54, 68, 58].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col justify-end">
              <div
                className="rounded-t-lg bg-orange-50 dark:bg-gray-800"
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getBreakdownColor(item: DashboardAnalyticsBreakdownItem): string {
  return BREAKDOWN_COLORS[item.color_key] || BREAKDOWN_COLORS.muted;
}

export default function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsRangeKey>("30d");
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<DashboardAnalyticsResponse>(
          "/api/v1/dashboard/analytics",
          { params: { range_key: selectedRange } }
        );
        setAnalytics(response.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load analytics data"));
      } finally {
        setLoading(false);
      }
    };

    void fetchAnalytics();
  }, [selectedRange]);

  const statCards = useMemo(() => analytics?.stat_cards || [], [analytics]);
  const userGrowthData = useMemo(
    () =>
      analytics?.user_growth.map((point) => ({
        name: point.label,
        users: point.value,
      })) || [],
    [analytics]
  );
  const revenueData = useMemo(() => {
    const points = analytics?.revenue_growth || [];
    const peakValue = Math.max(...points.map((point) => point.value), 0);

    return points.map((point) => ({
      name: point.label,
      revenue: point.value,
      active: point.value === peakValue && peakValue > 0,
    }));
  }, [analytics]);
  const subscriptionStatusData = useMemo(
    () =>
      analytics?.subscription_status.map((item) => ({
        ...item,
        color: getBreakdownColor(item),
      })) || [],
    [analytics]
  );
  const billingCycleData = useMemo(
    () =>
      analytics?.billing_cycle.map((item) => ({
        ...item,
        color: getBreakdownColor(item),
      })) || [],
    [analytics]
  );
  const subscriptionTotal = subscriptionStatusData.reduce((sum, item) => sum + item.value, 0);
  const billingTotal = billingCycleData.reduce((sum, item) => sum + item.value, 0);

  const handleExportData = () => {
    if (!analytics) return;

    const blob = new Blob([JSON.stringify(analytics, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform-analytics-${analytics.range_key}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !analytics) {
    return (
      <div className="flex-1 pb-10">
        <title>Platform Analytics | Aldo</title>
        <Header
          title="Platform Analytics"
          subtitle="Monitor platform growth, revenue performance, and subscription trends for your restaurant network."
        />
        <main className="space-y-8 p-8">
          <div className="flex justify-end">
            <div className="h-11 w-72 animate-pulse rounded-full bg-white shadow-sm dark:bg-gray-900" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="flex-1 pb-10">
        <title>Platform Analytics | Aldo</title>
        <Header
          title="Platform Analytics"
          subtitle="Monitor platform growth, revenue performance, and subscription trends for your restaurant network."
        />
        <main className="p-8">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-10">
      <title>Platform Analytics | Aldo</title>
      <Header
        title="Platform Analytics"
        subtitle="Monitor platform growth, revenue performance, and subscription trends for your restaurant network."
      />

      <main className="space-y-8 p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex rounded-full border border-gray-100 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSelectedRange(option.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  selectedRange === option.key
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleExportData}
            disabled={!analytics}
            className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-bold text-gray-900 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Data
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = STAT_ICONS[stat.key] || Activity;
            const isPositive = stat.trend !== "down";
            const isRevenue = stat.key === "monthly_revenue";

            return (
              <div
                key={stat.key}
                className={`rounded-2xl border border-gray-100 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 ${
                  isRevenue
                    ? "border-0 bg-gradient-to-br from-[#B3802C] to-[#8C6219] text-white"
                    : "bg-white dark:bg-gray-900"
                }`}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isRevenue ? "bg-white/20" : "bg-orange-50"
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isRevenue ? "text-white" : "text-orange-500"}`} />
                  </div>
                  <div
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                      isRevenue
                        ? "bg-white/20 text-white"
                        : isPositive
                          ? "bg-green-50 text-green-600 dark:bg-green-900/20"
                          : "bg-red-50 text-red-600 dark:bg-red-900/20"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatChange(stat.change_percent)}
                  </div>
                </div>
                <p className={`text-sm font-medium ${isRevenue ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                  {stat.label}
                </p>
                <h3 className={`mt-1 text-2xl font-bold tracking-tight ${isRevenue ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {stat.value_formatted}
                </h3>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Growth</h3>
              <span className="rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {RANGE_OPTIONS.find((option) => option.key === selectedRange)?.label}
              </span>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={userGrowthData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCompact(Number(value))}
                  />
                  <Tooltip
                    formatter={(value) => [toTooltipNumber(value).toLocaleString(), "Users"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-primary)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Growth</h3>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                <div className="h-2 w-2 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData} barSize={40}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(toTooltipNumber(value)), "Revenue"]}
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 8, 8]}>
                    {revenueData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={entry.active ? "var(--color-primary)" : "#F1F5F9"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Status</h3>
              <span className="text-xs font-medium italic text-gray-400">Live API data</span>
            </div>
            <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
              <div className="relative h-48 w-48">
                {subscriptionTotal > 0 ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <PieChart>
                      <Pie
                        data={subscriptionStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        {subscriptionStatusData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [toTooltipNumber(value).toLocaleString(), "Users"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCompact(subscriptionTotal)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">TOTAL</span>
                </div>
              </div>

              <div className="w-full flex-1 space-y-4">
                {subscriptionStatusData.map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Billing Cycle</h3>
            <div className="flex flex-col items-center">
              <div className="relative mb-8 h-48 w-48">
                {billingTotal > 0 ? (
                  <ResponsiveContainer width="100%" height={192}>
                    <PieChart>
                      <Pie
                        data={billingCycleData}
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        dataKey="value"
                        stroke="none"
                      >
                        {billingCycleData.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [toTooltipNumber(value).toLocaleString(), "Subscriptions"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-full border border-dashed border-gray-200 text-xs font-bold uppercase tracking-wide text-gray-400 dark:border-gray-700">
                    No Active Plans
                  </div>
                )}
              </div>

              <div className="w-full space-y-3">
                {billingCycleData.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
