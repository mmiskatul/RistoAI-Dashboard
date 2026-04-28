import React from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--color-background)] dark:bg-black">
      <Sidebar />
      <div className="flex w-full flex-col pl-20 transition-all md:pl-72">
        {children}
      </div>
    </div>
  );
}
