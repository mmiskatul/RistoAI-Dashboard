"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect } from "react";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib/api";

const displayNameForUser = (user?: { full_name?: string; email?: string } | null): string => {
  const fullName = user?.full_name?.trim();
  if (fullName) return fullName;
  return user?.email?.split("@")[0] || "User";
};

const initialsForName = (name?: string): string =>
  (name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

export default function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const refreshCurrentUser = async () => {
      try {
        const response = await apiClient.get("/api/v1/auth/me");
        setUser(response.data);
      } catch {
        // The shared API client handles expired sessions.
      }
    };

    void refreshCurrentUser();
  }, [setUser]);

  const avatarUrl = user?.avatar_url;
  const displayName = displayNameForUser(user);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between border-b border-gray-100 bg-white px-8 backdrop-blur-md dark:border-gray-800 dark:bg-black/80">
      <div>
        {title && (
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-0.5 text-xs font-medium text-gray-400">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 dark:border-gray-900"></span>
          </span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right lg:block">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="text-xs font-semibold text-gray-400">{user?.email || "Signed in"}</p>
          </div>
          <div className="relative flex h-10 w-10 overflow-hidden rounded-xl border border-gray-100 bg-[#F4E7DB] dark:border-gray-800">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#9A5A2B]">
                {initialsForName(displayName)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
