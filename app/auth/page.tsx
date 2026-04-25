"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient, getApiErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post("/api/v1/auth/admin/login", {
        email,
        password
      });

      const data = response.data;

      // Store tokens and user info
      if (data.tokens) {
        localStorage.setItem("access_token", data.tokens.access_token);
        localStorage.setItem("refresh_token", data.tokens.refresh_token);
        // Save in cookie for Next.js server-side checks and middleware
        document.cookie = `access_token=${data.tokens.access_token}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.user) {
        // Set user in Zustand store
        setUser(data.user);
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to login"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <title>Login | Aldo Dashboard</title>
      <div className="w-full max-w-[440px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-sm text-gray-500">To login, enter your email address</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

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

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter password"
                className="block w-full rounded-xl border border-gray-200 py-3 pl-10 pr-10 text-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[var(--color-text-input)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-bold text-white transition-all hover:bg-[var(--color-primary)]/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
