"use client";

import React from "react";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const user = useAuthStore((state) => state.user);
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
              {user?.full_name || "Admin User"}
            </p>
            <p className="text-xs font-semibold text-gray-400 capitalize">{user?.role || "Admin"}</p>
          </div>
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
            <Image
              src="https://plus.unsplash.com/premium_photo-1671656349322-41de944d259b?w=500&auto=format&fit=crop&q=60"
              alt="User"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
