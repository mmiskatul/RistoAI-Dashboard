"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { apiClient, getApiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/api/v1/auth/admin/forgot-password", { email });

      const data = response.data;
      console.log("Forgot Password API Response:", data);

      if (data.message === "Verification code sent for admin password reset") {
        router.push(`/auth/verify-code?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || "An error occurred");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Network error occurred. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <title>Forgot Password | Aldo Dashboard</title>
      <div className="w-full max-w-[440px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-500">Enter your email to reset password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-700"
            >
              Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                placeholder="Enter email"
                className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[var(--color-text-input)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="text-sm font-medium text-red-500">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-bold text-white transition-all hover:bg-[var(--color-primary)]/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Next"}
          </button>

          <div className="text-center">
            <Link
              href="/auth"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
