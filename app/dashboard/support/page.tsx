"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { formatShortDate } from "@/lib/format";
import { buildPaginationItems } from "@/lib/pagination";
import {
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

type SupportManagementResponse = {
  summary: {
    open_tickets: number;
    resolved_tickets: number;
  };
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Array<{
    id: string;
    ticket_number: string;
    user_name: string;
    restaurant_name: string | null;
    issue_subject: string;
    status: "open" | "resolved";
    priority: "normal" | "high";
    date: string;
    view_endpoint: string | null;
  }>;
};

const PAGE_SIZE = 10;
const tabs = [
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All Tickets" },
] as const;

const initialsForName = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

function SupportStatSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="animate-pulse">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-full bg-orange-100" />
          <div className="flex-1">
            <div className="h-9 w-24 rounded-xl bg-[#F4E7DB]" />
            <div className="mt-3 h-3 w-28 rounded bg-[#EFE4DA]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="animate-pulse">
        <div className="grid grid-cols-[2fr_1.5fr_2.2fr_1fr_1fr_1fr] gap-4 border-b border-gray-100 bg-[#F8FAFC] px-6 py-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-[#E9EEF4]" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[2fr_1.5fr_2.2fr_1fr_1fr_1fr] gap-4 border-b border-gray-50 px-6 py-5 dark:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#EED7C8]" />
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-[#E9EEF4]" />
                <div className="mt-2 h-3 w-20 rounded bg-[#F1F5F9]" />
              </div>
            </div>
            <div className="h-4 w-28 self-center rounded bg-[#E9EEF4]" />
            <div className="h-4 w-40 self-center rounded bg-[#E9EEF4]" />
            <div className="h-7 w-20 self-center rounded-full bg-[#FCEBDE]" />
            <div className="h-4 w-24 self-center rounded bg-[#E9EEF4]" />
            <div className="justify-self-end">
              <div className="h-9 w-24 rounded-lg bg-[#E9EEF4]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("open");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SupportManagementResponse | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      setData(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(PAGE_SIZE),
        });

        if (searchQuery) {
          params.set("search", searchQuery);
        }

        if (activeTab !== "all") {
          params.set("status", activeTab);
        }

        const response = await apiClient.get<SupportManagementResponse>(
          `/api/v1/support/management?${params.toString()}`
        );
        setData(response.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load support tickets"));
      } finally {
        setLoading(false);
      }
    };

    void fetchTickets();
  }, [activeTab, page, searchQuery]);

  const stats = useMemo(() => {
    if (!data) return [];

    const totalActive = data.summary.open_tickets + data.summary.resolved_tickets;
    const highPriorityCount = data.items.filter((item) => item.priority === "high").length;

    return [
      {
        name: "ACTIVE TICKETS",
        value: data.summary.open_tickets.toLocaleString(),
        icon: ClipboardList,
        iconColor: "text-orange-500",
        bgColor: "bg-orange-50",
      },
      {
        name: "TICKETS RESOLVED",
        value: data.summary.resolved_tickets.toLocaleString(),
        icon: CheckCircle2,
        iconColor: "text-green-500",
        bgColor: "bg-green-50",
      },
      {
        name: "HIGH PRIORITY ON PAGE",
        value: highPriorityCount.toLocaleString(),
        icon: AlertTriangle,
        iconColor: "text-rose-500",
        bgColor: "bg-rose-50",
        helper: `${totalActive.toLocaleString()} total tracked`,
      },
    ];
  }, [data]);

  const paginationItems = useMemo(() => {
    if (!data) return [];

    return buildPaginationItems(data.pages, data.page);
  }, [data]);

  return (
    <div className="flex-1 pb-10">
      <title>Support | Aldo</title>
      <Header title="Support" subtitle="Manage support requests from users." />

      <main className="space-y-8 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {loading && !data
            ? Array.from({ length: 3 }).map((_, index) => <SupportStatSkeleton key={index} />)
            : stats.map((stat) => (
                <div
                  key={stat.name}
                  className="flex items-center gap-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <p className="mt-1 text-xs font-bold text-gray-500">{stat.name}</p>
                    {"helper" in stat && stat.helper ? (
                      <p className="mt-2 text-xs font-semibold text-gray-400">{stat.helper}</p>
                    ) : null}
                  </div>
                </div>
              ))}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg border border-gray-100 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setPage(1);
                  setActiveTab(tab.key);
                }}
                className={`rounded-md px-6 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search support requests..."
              className="block w-full rounded-full border border-gray-100 bg-white py-2.5 pl-11 pr-4 text-sm text-[var(--color-text-input)] shadow-sm outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : loading && !data ? (
          <SupportTableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-gray-50 bg-white text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-5">USER NAME</th>
                    <th className="px-6 py-5">RESTAURANT</th>
                    <th className="px-6 py-5">ISSUE/SUBJECT</th>
                    <th className="px-6 py-5">STATUS</th>
                    <th className="px-6 py-5">DATE</th>
                    <th className="px-6 py-5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data?.items.length ? (
                    data.items.map((ticket) => (
                      <tr key={ticket.id} className="group transition-all hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {initialsForName(ticket.user_name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{ticket.user_name}</p>
                              <p className="text-xs font-semibold text-gray-400">{ticket.ticket_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-500">
                          {ticket.restaurant_name || "No restaurant"}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          <div className="max-w-[340px]">
                            <p className="truncate font-medium text-gray-700 dark:text-gray-200">
                              {ticket.issue_subject}
                            </p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                              {ticket.priority === "high" ? "High priority" : "Normal priority"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              ticket.status === "open"
                                ? "bg-orange-50 text-[var(--color-primary)] dark:bg-orange-900/20"
                                : "bg-green-50 text-green-600 dark:bg-green-900/20"
                            }`}
                          >
                            {ticket.status === "open" ? "Open" : "Resolved"}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-500">{formatShortDate(ticket.date)}</td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/support/${ticket.id}`}
                            className="inline-block rounded-lg border border-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)] hover:text-white"
                          >
                            View Ticket
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm font-medium text-gray-500">
                        No support tickets matched the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {data ? (
              <div className="flex flex-col gap-4 border-t border-gray-50 px-6 py-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                <p className="text-xs font-bold text-gray-400">
                  Showing{" "}
                  <span className="text-gray-900 dark:text-white">
                    {data.total ? (data.page - 1) * data.page_size + 1 : 0}-
                    {Math.min(data.page * data.page_size, data.total)}
                  </span>{" "}
                  of {data.total} tickets
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={data.page === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {paginationItems.map((item, index) =>
                    typeof item === "number" ? (
                      <button
                        key={`${item}-${index}`}
                        onClick={() => setPage(item)}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all ${
                          item === data.page
                            ? "bg-[var(--color-primary)] text-white"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        {item}
                      </button>
                    ) : (
                      <span key={`${item}-${index}`} className="px-1 text-xs font-bold text-gray-400">
                        {item}
                      </span>
                    )
                  )}

                  <button
                    onClick={() => setPage((current) => Math.min(data.pages, current + 1))}
                    disabled={data.page === data.pages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
