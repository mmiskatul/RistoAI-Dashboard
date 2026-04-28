"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  Users,
  Hourglass,
  Calendar,
  Wallet,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type SubscriptionStatus = "active" | "trial" | "suspended" | "expired" | "canceled";
type BillingCycle = "1_month" | "1_year";

type SubscriptionOverviewResponse = {
  summary: {
    active_subscriptions: number;
    trial_users: number;
    monthly_revenue_mrr: number;
    annual_revenue: number;
  };
  revenue_chart: Array<{ label: string; value: number }>;
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Array<{
    user_id: string;
    full_name: string;
    email: string;
    restaurant_name: string | null;
    plan_name: string | null;
    billing_cycle: BillingCycle | null;
    status: SubscriptionStatus | null;
    start_date: string | null;
    next_billing: string | null;
  }>;
};

type SummaryStat = {
  name: string;
  value: string;
  icon: typeof Users;
};

const PAGE_SIZE = 10;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const formatCycle = (value: BillingCycle | null) => {
  if (value === "1_year") return "YEARLY";
  if (value === "1_month") return "MONTHLY";
  return "N/A";
};

const statusClasses: Record<SubscriptionStatus, string> = {
  active: "bg-green-100 text-green-700",
  trial: "bg-blue-100 text-blue-700",
  suspended: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-700",
  canceled: "bg-gray-100 text-gray-600",
};

export default function SubscriptionsManagement() {
  const [data, setData] = useState<SubscriptionOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [months, setMonths] = useState(6);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(PAGE_SIZE),
          months: String(months),
        });

        if (searchQuery) params.set("search", searchQuery);
        if (status) params.set("status", status);

        const response = await apiClient.get<SubscriptionOverviewResponse>(
          `/api/v1/subscriptions/overview?${params.toString()}`
        );
        setData(response.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load subscriptions"));
      } finally {
        setLoading(false);
      }
    };

    void fetchOverview();
  }, [page, months, searchQuery, status]);

  const stats = useMemo(() => {
    if (!data) return [];

    return [
      { name: "Active Subscriptions", value: data.summary.active_subscriptions.toLocaleString(), icon: Users },
      { name: "Trial Users", value: data.summary.trial_users.toLocaleString(), icon: Hourglass },
      { name: "Monthly Revenue (MRR)", value: formatCurrency(data.summary.monthly_revenue_mrr), icon: Calendar },
      { name: "Annual Revenue", value: formatCurrency(data.summary.annual_revenue), icon: Wallet },
    ];
  }, [data]);

  return (
    <div className="flex-1 bg-[var(--color-background)] pb-10 dark:bg-black">
      <title>Subscriptions Management | Aldo</title>
      <Header title="Subscriptions Management" subtitle="Manage restaurant subscriptions and track platform revenue." />

      <div className="flex justify-end px-8 pt-8">
        <Link href="/dashboard/subscriptions/plan" className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white shadow-md transition-all hover:bg-[#e07b3a]">
          Subscription Plans
        </Link>
      </div>

      <main className="space-y-8 p-8">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loading && !data
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
                />
              ))
            : stats.map((stat: SummaryStat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[var(--color-primary)] dark:bg-orange-500/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-600 dark:bg-green-500/10 dark:text-green-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Live
                  </div>
                </div>
                <p className="mb-1 text-sm font-semibold text-gray-500 dark:text-gray-400">{stat.name}</p>
                <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</h3>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Subscription Revenue</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">Revenue growth from the active subscription data.</p>
            </div>
            <select
              value={months}
              onChange={(event) => {
                setPage(1);
                setMonths(Number(event.target.value));
              }}
              className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-sm font-bold text-gray-700 outline-none dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.revenue_chart ?? []} barSize={60}>
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} fontWeight={700} tickLine={false} axisLine={false} tickMargin={10} />
              <Tooltip cursor={{ fill: "transparent" }} formatter={(value: unknown) => formatCurrency(Number(value || 0))} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {(data?.revenue_chart ?? []).map((entry, index, list) => (
                  <Cell key={`${entry.label}-${index}`} fill={index === list.length - 1 ? "var(--color-primary)" : "#FFCDB2"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 border-b border-gray-50 p-6 dark:border-gray-800 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:w-96">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-4.5 w-4.5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name, restaurant or email..."
                className="block w-full rounded-full bg-gray-50 py-3 pl-12 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--color-primary)]/20 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "", label: "All" },
                { key: "active", label: "Active" },
                { key: "trial", label: "Trial" },
                { key: "suspended", label: "Suspended" },
                { key: "expired", label: "Expired" },
                { key: "canceled", label: "Canceled" },
              ].map((item) => (
                <button
                  key={item.key || "all"}
                  onClick={() => {
                    setPage(1);
                    setStatus(item.key);
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    status === item.key
                      ? "border border-orange-100 bg-white text-[var(--color-primary)] shadow-sm dark:border-orange-500/20 dark:bg-gray-800"
                      : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-50 bg-white text-xs font-bold tracking-wider text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
                <tr>
                  <th className="px-6 py-5">User</th>
                  <th className="px-6 py-5">Restaurant</th>
                  <th className="px-6 py-5">Plan</th>
                  <th className="px-6 py-5">Billing Cycle</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Start Date</th>
                  <th className="px-6 py-5">Next Billing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {(data?.items ?? []).map((item) => (
                  <tr key={item.user_id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/40">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{item.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{item.restaurant_name || "No restaurant"}</td>
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{item.plan_name || "No plan"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {formatCycle(item.billing_cycle)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[item.status]}`}>
                          {item.status.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(item.start_date)}</td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">{formatDate(item.next_billing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {data ? (data.page - 1) * data.page_size + 1 : 0}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-900 dark:text-white">
                {data ? Math.min(data.page * data.page_size, data.total) : 0}
              </span>{" "}
              of <span className="font-bold text-gray-900 dark:text-white">{data?.total ?? 0}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!data || data.page === 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--color-primary)] px-3 text-xs font-bold text-white">
                {data?.page ?? 1}
              </button>
              <button
                onClick={() => setPage((current) => (data ? Math.min(data.pages, current + 1) : current))}
                disabled={!data || data.page === data.pages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-400 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-500"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
