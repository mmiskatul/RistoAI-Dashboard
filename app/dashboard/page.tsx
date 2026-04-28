"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  Users,
  CreditCard,
  DollarSign,
  Hourglass,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

type DashboardOverviewResponse = {
  summary: {
    total_users: number;
    active_users: number;
    verified_users: number;
    completed_onboarding: number;
    pending_verifications: number;
    active_subscriptions: number;
    trial_users: number;
    monthly_revenue: number;
    admins: number;
    restaurant_owners: number;
    managers: number;
    staff: number;
  };
  charts: {
    monthly_new_users: Array<{ month: number; label: string; value: number }>;
    monthly_completed_onboarding: Array<{ month: number; label: string; value: number }>;
    monthly_revenue: Array<{ key: string; label: string; value: number }>;
    weekly_revenue: Array<{ key: string; label: string; value: number }>;
    users_by_role: Array<{ role: string; label: string; value: number }>;
    subscription_breakdown: Array<{
      label: string;
      value: number;
      percentage: number;
      color_key: string;
    }>;
  };
  meta: {
    year: number;
  };
  recent_daily_data: Array<{
    id: string;
    restaurant_name: string;
    business_date: string;
    total_revenue: number;
    total_expenses: number;
    total_covers: number;
  }>;
  recent_cash_deposits: Array<{
    id: string;
    restaurant_name: string;
    deposit_date: string;
    amount: number;
    bank_account?: string | null;
    reference?: string | null;
  }>;
  recent_inventory_items: Array<{
    id: string;
    restaurant_name: string;
    product_name: string;
    category: string;
    stock_quantity: number;
    unit_type: string;
    stock_status?: string | null;
  }>;
};

const PIE_COLORS: Record<string, string> = {
  navy: "#263F96",
  lavender: "#7F86FF",
};

const BAR_PALETTE = [
  "#FCE9DC",
  "#FCE4D5",
  "#FBDCCA",
  "#FBD4BF",
  "#FACCB3",
  "#FAC4A8",
  "#F9BC9D",
  "#F9B492",
  "#F8AC86",
  "#F7A47B",
  "#F79C70",
  "#F79465",
];

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompact = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const formatPercent = (value: number): string => `${Math.round(value)}%`;
const toNumericTooltipValue = (value: unknown): number =>
  typeof value === "number" ? value : Number(value || 0);

const formatDate = (value: string): string => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function MetricCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
      <div className="animate-pulse">
        <div className="mb-5 flex items-start justify-between">
          <div className="h-11 w-11 rounded-2xl border border-[#E6DDD5] bg-[#FFF2E8]" />
          <div className="h-7 w-28 rounded-full bg-[#F7EEE7]" />
        </div>
        <div className="h-5 w-28 rounded-lg bg-[#F3E7DE]" />
        <div className="mt-4 h-10 w-36 rounded-xl bg-[#EED7C8]" />
      </div>
    </div>
  );
}

function RevenueGrowthSkeleton() {
  return (
    <section className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
      <div className="animate-pulse">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="h-9 w-56 rounded-xl bg-[#EED7C8]" />
            <div className="mt-3 h-4 w-72 rounded-lg bg-[#F3E7DE]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-40 rounded-xl bg-[#FBF1E9]" />
            <div className="h-11 w-24 rounded-full bg-[#FBF1E9]" />
          </div>
        </div>

        <div className="flex h-[360px] items-end gap-3 pt-8">
          {[30, 42, 35, 54, 48, 66, 76, 61, 72, 58, 63, 78].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center justify-end gap-3">
              <div
                className="w-full rounded-t-[10px] bg-[#F7E5D8]"
                style={{ height: `${height}%` }}
              />
              <div className="h-3 w-7 rounded bg-[#EFE5DD]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UserGrowthSkeleton() {
  return (
    <section className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
      <div className="animate-pulse">
        <div className="h-9 w-40 rounded-xl bg-[#EED7C8]" />
        <div className="mt-3 h-4 w-48 rounded-lg bg-[#F3E7DE]" />

        <div className="relative mt-8 flex h-[280px] items-center justify-center">
          <div className="h-[190px] w-[190px] rounded-full border-[18px] border-[#253E96]" />
          <div className="absolute h-[128px] w-[128px] rounded-full bg-white" />
          <div className="absolute flex flex-col items-center">
            <div className="h-9 w-20 rounded-xl bg-[#EED7C8]" />
            <div className="mt-3 h-3 w-12 rounded bg-[#F3E7DE]" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {[0, 1].map((item) => (
            <div key={item} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${item === 0 ? "bg-[#263F96]" : "bg-[#7F86FF]"}`} />
                <div className="h-4 w-36 rounded bg-[#F3E7DE]" />
              </div>
              <div className="h-4 w-10 rounded bg-[#EED7C8]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getUTCFullYear());
  const [revenuePeriod, setRevenuePeriod] = useState<"weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<DashboardOverviewResponse>(
          `/api/v1/dashboard/overview?year=${selectedYear}`
        );
        setOverview(response.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load dashboard data"));
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, [selectedYear]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getUTCFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  const stats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        name: "Total Users",
        value: overview.summary.total_users.toLocaleString(),
        chip: `${overview.summary.verified_users} verified`,
        positive: true,
        icon: Users,
      },
      {
        name: "Active Subscriptions",
        value: overview.summary.active_subscriptions.toLocaleString(),
        chip: `${overview.summary.active_users} active users`,
        positive: true,
        icon: CreditCard,
      },
      {
        name: "Monthly Revenue",
        value: formatCurrency(overview.summary.monthly_revenue),
        chip: `${overview.summary.restaurant_owners} owners`,
        positive: true,
        icon: DollarSign,
      },
      {
        name: "Trial Users",
        value: overview.summary.trial_users.toLocaleString(),
        chip: `${overview.summary.pending_verifications} pending`,
        positive: false,
        icon: Hourglass,
      },
    ];
  }, [overview]);

  const revenueSeries = useMemo(() => {
    if (!overview) {
      return [];
    }
    return revenuePeriod === "weekly"
      ? overview.charts.weekly_revenue
      : overview.charts.monthly_revenue;
  }, [overview, revenuePeriod]);

  const operationalSections = useMemo(
    () =>
      overview
        ? [
      {
        key: "daily-data",
        title: "Daily Data",
        subtitle: "Actual rows from restaurant daily data",
        headers: ["Restaurant", "Date", "Revenue", "Expenses", "Covers"],
        rows: overview.recent_daily_data.map((item) => [
          item.restaurant_name,
          formatDate(item.business_date),
          formatCurrency(item.total_revenue),
          formatCurrency(item.total_expenses),
          item.total_covers.toLocaleString(),
        ]),
      },
      {
        key: "cash-management",
        title: "Cash Management",
        subtitle: "Actual rows from restaurant cash deposits",
        headers: ["Restaurant", "Date", "Amount", "Bank", "Reference"],
        rows: overview.recent_cash_deposits.map((item) => [
          item.restaurant_name,
          formatDate(item.deposit_date),
          formatCurrency(item.amount),
          item.bank_account || "-",
          item.reference || "-",
        ]),
      },
      {
        key: "inventory",
        title: "Inventory Items",
        subtitle: "Actual rows from restaurant inventory",
        headers: ["Restaurant", "Item", "Category", "Stock", "Status"],
        rows: overview.recent_inventory_items.map((item) => [
          item.restaurant_name,
          item.product_name,
          item.category,
          `${item.stock_quantity} ${item.unit_type}`,
          item.stock_status || "-",
        ]),
      },
    ]
        : [],
    [overview]
  );

  if (loading) {
    return (
      <div className="flex-1 bg-[#FFFDFC] pb-10">
        <title>Admin Dashboard | Aldo</title>
        <Header title="Admin Dashboard" subtitle="Platform Overview" />
        <main className="space-y-8 p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.9fr_0.9fr]">
            <RevenueGrowthSkeleton />
            <UserGrowthSkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex-1 pb-10">
        <title>Admin Dashboard | Aldo</title>
        <Header title="Admin Dashboard" subtitle="Platform Overview" />
        <main className="p-8">
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error || "Failed to load dashboard data"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#FFFDFC] pb-10">
      <title>Admin Dashboard | Aldo</title>
      <Header title="Admin Dashboard" subtitle="Platform Overview" />

      <main className="space-y-8 p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]"
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E6DDD5] bg-[#FFF2E8]">
                  <stat.icon className="h-5 w-5 text-[#FF8C42]" />
                </div>
                <div
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                    stat.positive
                      ? "bg-[#EAF8F1] text-[#19B879]"
                      : "bg-[#FFF1F3] text-[#F14B61]"
                  }`}
                >
                  {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {stat.chip}
                </div>
              </div>
              <p className="text-base font-medium text-[#6C7A90]">{stat.name}</p>
              <h3 className="mt-2 text-[2.1rem] font-extrabold tracking-tight text-[#23262F]">
                {stat.value}
              </h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.9fr_0.9fr]">
          <section className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[2rem] font-extrabold tracking-tight text-[#23262F]">Revenue Growth</h2>
                <p className="mt-1 text-sm font-medium text-[#7E879A]">
                  {revenuePeriod === "weekly"
                    ? `Weekly estimated subscription revenue for ${overview.meta.year}`
                    : `Monthly estimated subscription revenue for ${overview.meta.year}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex rounded-xl border border-[#E5DDD7] bg-[#FFF9F4] p-1">
                  <button
                    onClick={() => setRevenuePeriod("weekly")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      revenuePeriod === "weekly"
                        ? "border border-[#FF8C42] bg-white font-bold text-[#FF8C42]"
                        : "text-[#6E7686]"
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setRevenuePeriod("monthly")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      revenuePeriod === "monthly"
                        ? "border border-[#FF8C42] bg-white font-bold text-[#FF8C42]"
                        : "text-[#6E7686]"
                    }`}
                  >
                    Monthly
                  </button>
                </div>
                <select
                  className="rounded-full border border-[#E5DDD7] bg-white px-4 py-2 text-sm font-semibold text-[#4F5A6D] outline-none"
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(Number(event.target.value))}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={revenueSeries} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  stroke="#657186"
                  fontSize={12}
                  fontWeight={700}
                />
                <Tooltip
                  cursor={{ fill: "#FFF7F1" }}
                  formatter={(value) => [formatCurrency(toNumericTooltipValue(value)), "Revenue"]}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #E8DDD2",
                    boxShadow: "0 12px 28px rgba(35,24,14,0.08)",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={revenuePeriod === "weekly" ? 34 : 50}>
                  {revenueSeries.map((entry, index) => (
                    <Cell
                      key={entry.key}
                      fill={BAR_PALETTE[index % BAR_PALETTE.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
            <h2 className="text-[2rem] font-extrabold tracking-tight text-[#23262F]">User Growth</h2>
            <p className="mt-1 text-sm font-medium text-[#7E879A]">
              Active subscriptions vs trial users
            </p>

            <div className="relative mt-8 w-full">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={overview.charts.subscription_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {overview.charts.subscription_breakdown.map((entry) => (
                      <Cell
                        key={entry.label}
                        fill={PIE_COLORS[entry.color_key] || PIE_COLORS.navy}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [toNumericTooltipValue(value).toLocaleString(), "Users"]} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[2.15rem] font-extrabold tracking-tight text-[#1D2640]">
                  {formatCompact(
                    overview.charts.subscription_breakdown.reduce((sum, item) => sum + item.value, 0)
                  )}
                </span>
                <span className="text-xs font-extrabold tracking-[0.18em] text-[#98A5BA]">TOTAL</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {overview.charts.subscription_breakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[item.color_key] || PIE_COLORS.navy }}
                    />
                    <span className="text-base font-medium text-[#657186]">{item.label}</span>
                  </div>
                  <span className="text-base font-extrabold text-[#23262F]">
                    {formatPercent(item.percentage)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-8 2xl:grid-cols-3">
          {operationalSections.map((section) => (
            <section
              key={section.key}
              className="overflow-hidden rounded-[28px] border border-[#D4CDC7] bg-white shadow-[0_10px_24px_rgba(35,24,14,0.05)]"
            >
              <div className="border-b border-[#EEE5DE] px-6 py-5">
                <h2 className="text-[1.35rem] font-extrabold tracking-tight text-[#23262F]">
                  {section.title}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7E879A]">{section.subtitle}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#F2EAE3]">
                  <thead className="bg-[#FFF9F4]">
                    <tr>
                      {section.headers.map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-extrabold uppercase tracking-[0.08em] text-[#7E879A]"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6EFE8]">
                    {section.rows.length > 0 ? (
                      section.rows.map((row, rowIndex) => (
                        <tr key={`${section.key}-${rowIndex}`} className="align-top">
                          {row.map((value, cellIndex) => (
                            <td
                              key={`${section.key}-${rowIndex}-${cellIndex}`}
                              className="px-6 py-4 text-sm font-medium text-[#2F3747]"
                            >
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={section.headers.length}
                          className="px-6 py-8 text-sm font-medium text-[#7E879A]"
                        >
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
