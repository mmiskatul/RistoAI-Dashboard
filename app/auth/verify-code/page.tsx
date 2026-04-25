"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { apiClient, getApiErrorMessage } from "@/lib/api";

function VerifyCodeContent() {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const response = await apiClient.post("/api/v1/auth/admin/forgot-password", { email });
      console.log("Resend API Response:", response.data);
      if (response.data && response.data.message === "Verification code sent for admin password reset") {
        toast.success("Verification code resent to your email!");
      } else {
        toast.error(response.data.message || "Failed to resend code");
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Failed to resend code"));
    } finally {
      setIsResending(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Focus next input
    if (value !== "" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const code = otp.join("");
    if (code.length < 4) {
      setError("Please enter the 4-digit OTP.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/api/v1/auth/admin/reset-password", {
        email,
        code,
        new_password: password,
        confirm_password: confirmPassword
      });

      if (response.data) {
        router.push("/auth/success");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to reset password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Verify & Reset</h1>
        <p className="text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
          We sent an OTP code to your email <br />
          <span className="font-semibold text-gray-700">{email}</span>. Enter the code and your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-sm font-medium text-red-500 text-center">{error}</div>}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 block text-center">Verification Code</label>
          <div className="flex justify-center gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-14 w-14 rounded-xl border border-gray-200 text-center text-xl font-bold transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[var(--color-text-input)]"
                required
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-semibold text-gray-700">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Type a strong password"
              className="block w-full rounded-xl border border-gray-200 py-3 px-4 text-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none pr-10 text-[var(--color-text-input)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-semibold text-gray-700">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              placeholder="Re-type password"
              className="block w-full rounded-xl border border-gray-200 py-3 px-4 text-sm transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none pr-10 text-[var(--color-text-input)]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={toggleConfirmVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-bold text-white transition-all hover:bg-[var(--color-primary)]/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
        </button>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive OTP?{" "}
            <button 
              type="button" 
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-[var(--color-primary)] hover:underline disabled:opacity-70"
            >
              {isResending ? "Resending..." : "Resend again"}
            </button>
          </p>
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
  );
}

export default function VerifyCodePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4">
      <title>Verify & Reset | Aldo Dashboard</title>
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyCodeContent />
      </Suspense>
    </div>
  );
}
