"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  Search,
  SlidersHorizontal,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  Ban,
  Trash2,
} from "lucide-react";

type UserManagementResponse = {
  summary: {
    total_users: number;
    active_users: number;
    suspended_users: number;
    trial_users: number;
  };
  total: number;
  page: number;
  page_size: number;
  pages: number;
  items: Array<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    restaurant_name: string | null;
    location: string | null;
    subscription_plan_name: string | null;
    subscription_plan: string | null;
    subscription_status: string | null;
    account_status: string | null;
    status: string;
    email_verified: boolean;
    join_date: string;
  }>;
};

const PAGE_SIZE = 10;

const statusStyles: Record<string, { dot: string; text: string; label: string }> = {
  active: { dot: "bg-[#1FC48D]", text: "text-[#1FC48D]", label: "ACTIVE" },
  trial: { dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", label: "TRIAL" },
  restricted: { dot: "bg-[#D946EF]", text: "text-[#D946EF]", label: "RESTRICTED" },
  suspended: { dot: "bg-[#F14B61]", text: "text-[#F14B61]", label: "SUSPENDED" },
  expired: { dot: "bg-[#94A3B8]", text: "text-[#94A3B8]", label: "EXPIRED" },
  pending: { dot: "bg-[#64748B]", text: "text-[#64748B]", label: "PENDING" },
};

const formatPlan = (plan: string | null): string => {
  if (!plan) return "N/A";
  if (plan === "1_year") return "1 YEAR";
  if (plan === "1_month") return "1 MONTH";
  return plan.replaceAll("_", " ").toUpperCase();
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const initialsForName = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

function SummaryCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
      <div className="animate-pulse">
        <div className="h-5 w-28 rounded-lg bg-[#F1E5DA]" />
        <div className="mt-5 flex items-end gap-4">
          <div className="h-10 w-28 rounded-xl bg-[#EAD4C3]" />
          <div className="mb-1 h-5 w-16 rounded-lg bg-[#F5ECE4]" />
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#D7DEE8] bg-white shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
      <div className="animate-pulse">
        <div className="grid grid-cols-[2.2fr_1.6fr_1.2fr_1fr_1.2fr_1.1fr_0.8fr] gap-4 border-b border-[#E4EAF2] bg-[#F8FBFF] px-6 py-5">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-[#E9EEF4]" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[2.2fr_1.6fr_1.2fr_1fr_1.2fr_1.1fr_0.8fr] gap-4 border-b border-[#EDF2F7] px-6 py-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-[#EED7C8]" />
              <div className="flex-1">
                <div className="h-4 w-28 rounded bg-[#E9EEF4]" />
                <div className="mt-2 h-3 w-36 rounded bg-[#F1F5F9]" />
              </div>
            </div>
            <div className="h-4 w-32 self-center rounded bg-[#E9EEF4]" />
            <div className="h-4 w-24 self-center rounded bg-[#E9EEF4]" />
            <div className="h-7 w-20 self-center rounded-full bg-[#FCEBDE]" />
            <div className="h-4 w-24 self-center rounded bg-[#E9EEF4]" />
            <div className="h-4 w-24 self-center rounded bg-[#E9EEF4]" />
            <div className="flex items-center gap-3 self-center">
              {Array.from({ length: 3 }).map((_, actionIndex) => (
                <div key={actionIndex} className="h-4 w-4 rounded bg-[#E9EEF4]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UsersManagement() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UserManagementResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserManagementResponse["items"][number] | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    type: "suspend" | "activate" | "restrict";
    user: UserManagementResponse["items"][number];
  } | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: String(PAGE_SIZE),
        });
        if (searchQuery) {
          params.set("search", searchQuery);
        }

        const response = await apiClient.get<UserManagementResponse>(
          `/api/v1/users/management?${params.toString()}`
        );
        setData(response.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load users"));
      } finally {
        setLoading(false);
      }
    };

    void fetchUsers();
  }, [page, searchQuery]);

  const stats = useMemo(() => {
    if (!data) return [];

    const activePercent =
      data.summary.total_users > 0
        ? ((data.summary.active_users / data.summary.total_users) * 100).toFixed(1)
        : "0";
    const suspendedPercent =
      data.summary.total_users > 0
        ? Math.round((data.summary.suspended_users / data.summary.total_users) * 100)
        : 0;

    return [
      {
        name: "Total Users",
        value: data.summary.total_users.toLocaleString(),
        change: `~${activePercent}%`,
        positive: true,
      },
      {
        name: "Active Users",
        value: data.summary.active_users.toLocaleString(),
        change: `~${activePercent}%`,
        positive: true,
      },
      {
        name: "Suspended Users",
        value: data.summary.suspended_users.toLocaleString(),
        change: `~${suspendedPercent}%`,
        positive: false,
      },
    ];
  }, [data]);

  const paginationItems = useMemo(() => {
    if (!data) return [];

    const items: Array<number | string> = [];
    const totalPages = data.pages;
    const current = data.page;

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i += 1) items.push(i);
      return items;
    }

    items.push(1);
    if (current > 3) items.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i += 1) {
      items.push(i);
    }
    if (current < totalPages - 2) items.push("...");
    items.push(totalPages);

    return items;
  }, [data]);

  const updateUserInState = (updatedUser: UserManagementResponse["items"][number]) => {
    setData((current) => {
      if (!current) return current;

      const nextItems = current.items.map((item) =>
        item.id === updatedUser.id ? updatedUser : item
      );

      const suspendedUsers = nextItems.filter((item) => item.status === "suspended" || item.status === "restricted").length;
      const activeUsers = nextItems.filter((item) => item.status !== "suspended" && item.status !== "restricted").length;

      return {
        ...current,
        items: nextItems,
        summary: {
          ...current.summary,
          active_users: current.page === 1 ? activeUsers : current.summary.active_users,
          suspended_users: current.page === 1 ? suspendedUsers : current.summary.suspended_users,
        },
      };
    });

    setSelectedUser((current) => (current?.id === updatedUser.id ? updatedUser : current));
  };

  const handleSuspendUser = async (user: UserManagementResponse["items"][number]) => {
    setActionLoadingId(user.id);
    setError(null);

    try {
      const response = await apiClient.post(`/api/v1/users/${user.id}/suspend`);
      updateUserInState(response.data.user);
      setOpenMenuId(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to suspend user"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleActivateUser = async (user: UserManagementResponse["items"][number]) => {
    setActionLoadingId(user.id);
    setError(null);

    try {
      const response = await apiClient.post(`/api/v1/users/${user.id}/activate`);
      updateUserInState(response.data.user);
      setOpenMenuId(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to activate user"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestrictUser = async (user: UserManagementResponse["items"][number]) => {
    setActionLoadingId(user.id);
    setError(null);

    try {
      const response = await apiClient.post(`/api/v1/users/${user.id}/restrict`);
      updateUserInState(response.data.user);
      setOpenMenuId(null);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to restrict user"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === "suspend") {
      await handleSuspendUser(pendingAction.user);
    } else if (pendingAction.type === "activate") {
      await handleActivateUser(pendingAction.user);
    } else {
      await handleRestrictUser(pendingAction.user);
    }

    setPendingAction(null);
  };

  return (
    <div className="flex-1 bg-[#FFFDFC] pb-10">
      <title>Users Management | Aldo</title>
      <Header title="Users Management" subtitle="Manage restaurant owners and user accounts across the platform." />

      <main className="space-y-8 p-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[2.15rem] font-extrabold tracking-tight text-[#23262F]">
              Users Management
            </h1>
            <p className="mt-2 max-w-xl text-[1.05rem] leading-7 text-[#70819A]">
              Manage restaurant owners and user accounts across the platform.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px] lg:w-[360px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                <Search className="h-5 w-5 text-[#94A3B8]" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search users, restaurants..."
                className="block h-[46px] w-full rounded-full border border-[#C7CED8] bg-white py-3 pl-12 pr-4 text-[1.02rem] font-medium text-[#334155] shadow-[0_6px_18px_rgba(35,24,14,0.04)] outline-none placeholder:text-[#7A8798] focus:border-[#FF8C42] focus:ring-2 focus:ring-[#FF8C42]/10"
              />
            </div>

            <button className="inline-flex h-[46px] items-center justify-center gap-2 rounded-full border border-[#C7CED8] bg-white px-6 text-[1.02rem] font-semibold text-[#23262F] shadow-[0_6px_18px_rgba(35,24,14,0.04)] transition-all hover:bg-[#FFF9F4]">
              <SlidersHorizontal className="h-5 w-5" />
              Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {loading && !data
            ? Array.from({ length: 3 }).map((_, index) => <SummaryCardSkeleton key={index} />)
            : stats.map((stat) => (
                <div
                  key={stat.name}
                  className="rounded-[28px] border border-[#D4CDC7] bg-white p-6 shadow-[0_10px_24px_rgba(35,24,14,0.05)]"
                >
                  <p className="text-[1.05rem] font-medium text-[#70819A]">{stat.name}</p>
                  <div className="mt-4 flex items-end gap-4">
                    <h3 className="text-[2.2rem] font-extrabold tracking-tight text-[#1F2940]">
                      {stat.value}
                    </h3>
                    <span
                      className={`mb-1 inline-flex items-center gap-1 text-[1rem] font-bold ${
                        stat.positive ? "text-[#19B879]" : "text-[#F14B61]"
                      }`}
                    >
                      {stat.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {stat.change}
                    </span>
                  </div>
                </div>
              ))}
        </div>

        {error ? (
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : loading && !data ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-[#D7DEE8] bg-white shadow-[0_10px_24px_rgba(35,24,14,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="border-b border-[#DDE5EE] bg-[#F7FAFE]">
                  <tr className="text-[0.95rem] font-extrabold uppercase tracking-[0.06em] text-[#23262F]">
                    <th className="px-6 py-5">User Name</th>
                    <th className="px-6 py-5">Restaurant</th>
                    <th className="px-6 py-5">Location</th>
                    <th className="px-6 py-5">Plan</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Join Date</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((user) => {
                    const resolvedStatus = statusStyles[user.status] || statusStyles.pending;
                    return (
                      <tr key={user.id} className="border-b border-[#E9EEF4] last:border-b-0">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1F2937,#7C4A2D)] text-sm font-extrabold text-white">
                              {initialsForName(user.full_name)}
                            </div>
                            <div>
                              <p className="text-[1.08rem] font-extrabold text-[#1F2940]">
                                {user.full_name}
                              </p>
                              <p className="text-[0.98rem] font-medium text-[#70819A]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[1.06rem] font-semibold text-[#1F2940]">
                          {user.restaurant_name || "No restaurant"}
                        </td>
                        <td className="px-6 py-5 text-[1.02rem] font-medium text-[#70819A]">
                          {user.location || "No location"}
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-full bg-[#FFF1E8] px-3 py-1 text-[0.88rem] font-extrabold text-[#FF8C42]">
                            {formatPlan(user.subscription_plan)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${resolvedStatus.dot}`} />
                            <span className={`text-[0.9rem] font-extrabold ${resolvedStatus.text}`}>
                              {resolvedStatus.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[1rem] font-medium text-[#70819A]">
                          {formatDate(user.join_date)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-5 text-[#1F1F1F]">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="transition-transform hover:scale-110"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId((current) => (current === user.id ? null : user.id))}
                                className="transition-transform hover:scale-110"
                              >
                                <MoreVertical className="h-4.5 w-4.5" />
                              </button>

                              {openMenuId === user.id ? (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div className="absolute right-0 top-8 z-20 min-w-[180px] overflow-hidden rounded-2xl border border-[#E6EAF0] bg-white py-2 shadow-[0_18px_40px_rgba(31,41,64,0.16)]">
                                    <button
                                      onClick={() =>
                                        setPendingAction({
                                          type: user.status === "suspended" || user.status === "restricted" ? "activate" : "suspend",
                                          user,
                                        })
                                      }
                                      disabled={actionLoadingId === user.id}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#1F2940] transition-all hover:bg-[#FFF8F1]"
                                    >
                                      <Ban className="h-4 w-4 text-[#F59E0B]" />
                                      {actionLoadingId === user.id
                                        ? user.status === "suspended" || user.status === "restricted"
                                          ? "Restoring..."
                                          : "Suspending..."
                                        : user.status === "suspended" || user.status === "restricted"
                                          ? "Restore Access"
                                          : "Suspend"}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setPendingAction({
                                          type: "restrict",
                                          user,
                                        })
                                      }
                                      disabled={actionLoadingId === user.id}
                                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#F14B61] transition-all hover:bg-[#FFF1F3]"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {actionLoadingId === user.id ? "Restricting..." : "Restrict Access"}
                                    </button>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#E9EEF4] bg-[#F8FBFF] px-6 py-5 md:flex-row md:items-center md:justify-between">
              <p className="text-[1rem] font-medium text-[#70819A]">
                Showing{" "}
                <span className="font-semibold text-[#55657D]">
                  {(data!.page - 1) * data!.page_size + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#55657D]">
                  {Math.min(data!.page * data!.page_size, data!.total)}
                </span>{" "}
                of {data!.total.toLocaleString()} users
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={data!.page === 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DEE8] bg-white text-[#7A8798] transition-all disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {paginationItems.map((item, index) =>
                  typeof item === "number" ? (
                    <button
                      key={`${item}-${index}`}
                      onClick={() => setPage(item)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-[1rem] font-bold transition-all ${
                        item === data!.page
                          ? "bg-[#FF8C42] text-white shadow-[0_10px_20px_rgba(255,140,66,0.25)]"
                          : "text-[#1F2940]"
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={`${item}-${index}`} className="px-2 text-[#7A8798]">
                      {item}
                    </span>
                  )
                )}

                <button
                  onClick={() => setPage((current) => Math.min(data!.pages, current + 1))}
                  disabled={data!.page === data!.pages}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DEE8] bg-white text-[#1F2940] transition-all disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedUser ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2430]/45 px-4 py-8 backdrop-blur-[2px]">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedUser(null)}
            />
            <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-[#D7DEE8] bg-white shadow-[0_28px_80px_rgba(31,41,64,0.18)]">
              <div className="border-b border-[#E9EEF4] bg-[linear-gradient(135deg,#FFF8F1_0%,#F8FBFF_100%)] px-8 py-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-18 w-18 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#1F2937,#7C4A2D)] text-xl font-extrabold text-white shadow-[0_12px_24px_rgba(31,41,64,0.18)]">
                      {initialsForName(selectedUser.full_name)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#94A3B8]">
                        User Profile
                      </p>
                      <h2 className="mt-2 text-[1.9rem] font-extrabold tracking-tight text-[#1F2940]">
                        {selectedUser.full_name}
                      </h2>
                      <p className="mt-1 text-[1rem] font-medium text-[#70819A]">
                        {selectedUser.email}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-[#1F2940] shadow-[0_4px_12px_rgba(35,24,14,0.05)]">
                          <span className={`h-2.5 w-2.5 rounded-full ${(statusStyles[selectedUser.status] || statusStyles.pending).dot}`} />
                          {(statusStyles[selectedUser.status] || statusStyles.pending).label}
                        </span>
                        <span className="inline-flex rounded-full bg-[#FFF1E8] px-3 py-1.5 text-sm font-bold text-[#FF8C42]">
                          {formatPlan(selectedUser.subscription_plan)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D7DEE8] bg-white text-[#64748B] transition-all hover:border-[#FF8C42] hover:text-[#FF8C42]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 px-8 py-8 md:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                  <div className="rounded-[24px] border border-[#E8EDF4] bg-white p-6 shadow-[0_8px_24px_rgba(35,24,14,0.04)]">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                      Personal Information
                    </p>
                    <h3 className="mt-2 text-[1.25rem] font-extrabold text-[#1F2940]">
                      Contact and identity
                    </h3>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Full Name
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.full_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Role
                        </p>
                        <p className="mt-2 capitalize text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.role.replaceAll("_", " ")}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Email Address
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Joined
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {formatDate(selectedUser.join_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Verification
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.email_verified ? "Verified" : "Not verified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#E8EDF4] bg-white p-6 shadow-[0_8px_24px_rgba(35,24,14,0.04)]">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                      Restaurant Details
                    </p>
                    <h3 className="mt-2 text-[1.25rem] font-extrabold text-[#1F2940]">
                      Operational context
                    </h3>
                    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Restaurant
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.restaurant_name || "No restaurant"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Location
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.location || "No location"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[24px] bg-[#FFF9F4] p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                      Account Status
                    </p>
                    <div className="mt-5 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${(statusStyles[selectedUser.status] || statusStyles.pending).dot}`} />
                      <span className={`text-[1rem] font-extrabold ${(statusStyles[selectedUser.status] || statusStyles.pending).text}`}>
                        {(statusStyles[selectedUser.status] || statusStyles.pending).label}
                      </span>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_4px_12px_rgba(35,24,14,0.04)]">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Email Verification
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.email_verified ? "Verified" : "Not verified"}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_4px_12px_rgba(35,24,14,0.04)]">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Subscription Status
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold capitalize text-[#1F2940]">
                          {selectedUser.subscription_status?.replaceAll("_", " ") || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-[#F8FBFF] p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#94A3B8]">
                      Subscription
                    </p>
                    <h3 className="mt-2 text-[1.25rem] font-extrabold text-[#1F2940]">
                      Billing summary
                    </h3>
                    <div className="mt-5 space-y-4">
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_4px_12px_rgba(35,24,14,0.04)]">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Billing Cycle
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {formatPlan(selectedUser.subscription_plan)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 shadow-[0_4px_12px_rgba(35,24,14,0.04)]">
                        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A0AEC0]">
                          Plan Name
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold text-[#1F2940]">
                          {selectedUser.subscription_plan_name || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#E9EEF4] bg-[#FCFDFE] px-7 py-5">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-full border border-[#D7DEE8] bg-white px-5 py-2.5 text-sm font-bold text-[#1F2940] transition-all hover:bg-[#FFF9F4]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {pendingAction ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1F2430]/45 px-4 backdrop-blur-[2px]">
            <div
              className="absolute inset-0"
              onClick={() => setPendingAction(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[#D7DEE8] bg-white p-7 text-center shadow-[0_28px_80px_rgba(31,41,64,0.18)]">
              <h3 className="text-[1.5rem] font-extrabold tracking-tight text-[#1F2940]">
                {pendingAction.type === "restrict"
                  ? "Restrict account?"
                  : pendingAction.type === "activate"
                    ? "Restore account?"
                    : "Suspend account?"}
              </h3>
              <p className="mt-3 text-[1rem] leading-7 text-[#70819A]">
                {pendingAction.type === "restrict"
                  ? `This will block ${pendingAction.user.full_name} from the app and keep their account for support review.`
                  : pendingAction.type === "activate"
                    ? `This will restore access for ${pendingAction.user.full_name}.`
                    : `This will suspend ${pendingAction.user.full_name} and block access until reactivated.`}
              </p>
              <div className="mt-7 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPendingAction(null)}
                  className="rounded-full border border-[#D7DEE8] bg-white px-5 py-2.5 text-sm font-bold text-[#1F2940] transition-all hover:bg-[#FFF9F4]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleConfirmAction()}
                  disabled={actionLoadingId === pendingAction.user.id}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all ${
                    pendingAction.type === "restrict"
                      ? "bg-[#F14B61] hover:bg-[#dc3f55]"
                      : "bg-[#FF8C42] hover:bg-[#f07d34]"
                  } disabled:opacity-60`}
                >
                  {actionLoadingId === pendingAction.user.id
                    ? pendingAction.type === "restrict"
                      ? "Restricting..."
                      : pendingAction.type === "activate"
                        ? "Restoring..."
                        : "Suspending..."
                    : pendingAction.type === "restrict"
                      ? "Confirm Restrict"
                      : pendingAction.type === "activate"
                        ? "Confirm Restore"
                        : "Confirm Suspend"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
