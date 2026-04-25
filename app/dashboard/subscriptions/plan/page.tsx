"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import { CheckCircle2, Pencil, Plus, RefreshCcw, ShieldCheck, Trash2 } from "lucide-react";

type CouponStatus = "active" | "paused" | "expired";

type Plan = {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  trial_days: number;
  features: string[];
  is_visible: boolean;
  is_active: boolean;
  is_best_plan: boolean;
  created_at: string;
  updated_at: string;
};

type Coupon = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  value: number;
  usage_limit: number;
  usage_count: number;
  expires_at: string | null;
  status: CouponStatus;
  created_at: string;
  updated_at: string;
};

type PlanManagementResponse = {
  plan: Plan | null;
  active_plan: {
    id: string;
    name: string;
    monthly_price: number;
    annual_price: number;
    features: string[];
    visibility_enabled: boolean;
  } | null;
  plans: Plan[];
  coupons: {
    total: number;
    page: number;
    page_size: number;
    pages: number;
    items: Coupon[];
  };
};

const emptyPlanForm = {
  name: "",
  monthly_price: "0",
  annual_price: "0",
  trial_days: "0",
  features: "",
  is_visible: true,
  is_active: true,
  is_best_plan: false,
};

const emptyCouponForm = {
  code: "",
  discount_type: "percentage",
  value: "0",
  usage_limit: "100",
  expires_at: "",
};

export default function SubscriptionPlans() {
  const [data, setData] = useState<PlanManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [submittingCoupon, setSubmittingCoupon] = useState(false);

  const fetchManagement = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<PlanManagementResponse>("/api/v1/subscriptions/plans/management?page=1&page_size=20");
      setData(response.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to load subscription plans"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchManagement();
  }, []);

  const selectedPlan = useMemo(
    () => data?.plans.find((plan) => plan.id === selectedPlanId) ?? null,
    [data?.plans, selectedPlanId]
  );

  useEffect(() => {
    if (!selectedPlan) {
      setPlanForm(emptyPlanForm);
      return;
    }

    setPlanForm({
      name: selectedPlan.name,
      monthly_price: String(selectedPlan.monthly_price),
      annual_price: String(selectedPlan.annual_price),
      trial_days: String(selectedPlan.trial_days),
      features: selectedPlan.features.join("\n"),
      is_visible: selectedPlan.is_visible,
      is_active: selectedPlan.is_active,
      is_best_plan: selectedPlan.is_best_plan,
    });
  }, [selectedPlan]);

  const handleSubmitPlan = async () => {
    setSubmittingPlan(true);
    setError(null);
    try {
      const payload = {
        name: planForm.name.trim(),
        monthly_price: Number(planForm.monthly_price),
        annual_price: Number(planForm.annual_price),
        trial_days: Number(planForm.trial_days),
        features: planForm.features.split("\n").map((item) => item.trim()).filter(Boolean),
        is_visible: planForm.is_visible,
        is_active: planForm.is_active,
        is_best_plan: planForm.is_best_plan,
      };

      if (selectedPlanId) {
        await apiClient.patch(`/api/v1/subscriptions/plans/${selectedPlanId}`, payload);
      } else {
        await apiClient.post("/api/v1/subscriptions/plans", payload);
      }

      setSelectedPlanId(null);
      setPlanForm(emptyPlanForm);
      await fetchManagement();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save subscription plan"));
    } finally {
      setSubmittingPlan(false);
    }
  };

  const handleCreateCoupon = async () => {
    setSubmittingCoupon(true);
    setError(null);
    try {
      await apiClient.post("/api/v1/subscriptions/coupons", {
        code: couponForm.code.trim(),
        discount_type: couponForm.discount_type,
        value: Number(couponForm.value),
        usage_limit: Number(couponForm.usage_limit),
        expires_at: couponForm.expires_at || null,
        status: "active",
      });
      setCouponForm(emptyCouponForm);
      await fetchManagement();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create coupon"));
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleCouponAction = async (coupon: Coupon, action: "activate" | "pause" | "delete") => {
    setError(null);
    try {
      if (action === "delete") {
        await apiClient.delete(`/api/v1/subscriptions/coupons/${coupon.id}`);
      } else {
        await apiClient.post(`/api/v1/subscriptions/coupons/${coupon.id}/${action}`);
      }
      await fetchManagement();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update coupon"));
    }
  };

  return (
    <div className="flex-1 pb-10">
      <title>Subscription Plans | Aldo</title>
      <Header title="Subscription Plans" subtitle="Manage plans and coupon routes from live API data." />

      <main className="mx-auto max-w-7xl space-y-8 p-8 xl:mx-0 xl:max-w-none">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            onClick={() => void fetchManagement()}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            {loading && !data ? (
              <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="space-y-3">
                    <span className="inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                      {data?.active_plan ? "Active Plan" : "No Active Plan"}
                    </span>
                    <h2 className="text-4xl font-black tracking-tight text-[#1E253A]">
                      {data?.active_plan?.name || "No active plan configured"}
                    </h2>
                  </div>
                  {data?.active_plan ? (
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1 text-[#1E253A]">
                        <span className="text-3xl font-black">${data.active_plan.monthly_price}</span>
                        <span className="text-sm font-bold text-gray-500">/ month</span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-[var(--color-primary)]">
                        ${data.active_plan.annual_price} / year
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="text-sm text-gray-700">
                    Visibility:{" "}
                    <span className="font-bold">
                      {data?.active_plan?.visibility_enabled ? "Visible to users" : "Hidden from users"}
                    </span>
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {(data?.active_plan?.features ?? []).map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
                      <span className="text-sm font-semibold text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedPlanId ? "Edit Plan" : "Create Plan"}
              </h3>
              {selectedPlanId ? (
                <button
                  onClick={() => setSelectedPlanId(null)}
                  className="text-sm font-bold text-[var(--color-primary)]"
                >
                  New Plan
                </button>
              ) : null}
            </div>

            <div className="space-y-4">
              <input
                value={planForm.name}
                onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Plan name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  value={planForm.monthly_price}
                  onChange={(event) => setPlanForm((current) => ({ ...current, monthly_price: event.target.value }))}
                  placeholder="Monthly price"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
                />
                <input
                  value={planForm.annual_price}
                  onChange={(event) => setPlanForm((current) => ({ ...current, annual_price: event.target.value }))}
                  placeholder="Annual price"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
                />
              </div>
              <input
                value={planForm.trial_days}
                onChange={(event) => setPlanForm((current) => ({ ...current, trial_days: event.target.value }))}
                placeholder="Trial days"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
              />
              <textarea
                value={planForm.features}
                onChange={(event) => setPlanForm((current) => ({ ...current, features: event.target.value }))}
                placeholder="One feature per line"
                rows={6}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
              />
              <div className="grid grid-cols-3 gap-3 text-sm font-medium text-gray-700">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={planForm.is_visible} onChange={(event) => setPlanForm((current) => ({ ...current, is_visible: event.target.checked }))} />
                  Visible
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={planForm.is_active} onChange={(event) => setPlanForm((current) => ({ ...current, is_active: event.target.checked }))} />
                  Active
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={planForm.is_best_plan} onChange={(event) => setPlanForm((current) => ({ ...current, is_best_plan: event.target.checked }))} />
                  Best Plan
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleSubmitPlan()}
                disabled={submittingPlan}
                className="w-full rounded-xl bg-[var(--color-primary)] p-4 text-sm font-black text-white disabled:opacity-60"
              >
                {submittingPlan ? "Saving..." : selectedPlanId ? "Update Plan" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-[var(--color-primary)]" />
            <h2 className="text-xl font-bold tracking-tight text-gray-900">Plans</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data?.plans ?? []).map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">${plan.monthly_price}/mo and ${plan.annual_price}/yr</p>
                  </div>
                  <button
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {plan.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${plan.is_visible ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {plan.is_visible ? "VISIBLE" : "HIDDEN"}
                  </span>
                  {plan.is_best_plan ? (
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                      BEST PLAN
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-[var(--color-primary)]" />
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Create Coupon</h2>
            </div>

            <div className="space-y-4">
              <input
                value={couponForm.code}
                onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="SAVE20"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm uppercase outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  value={couponForm.discount_type}
                  onChange={(event) => setCouponForm((current) => ({ ...current, discount_type: event.target.value as "percentage" | "fixed" }))}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input
                  value={couponForm.value}
                  onChange={(event) => setCouponForm((current) => ({ ...current, value: event.target.value }))}
                  placeholder="20"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
                />
              </div>
              <input
                type="datetime-local"
                value={couponForm.expires_at}
                onChange={(event) => setCouponForm((current) => ({ ...current, expires_at: event.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
              />
              <input
                value={couponForm.usage_limit}
                onChange={(event) => setCouponForm((current) => ({ ...current, usage_limit: event.target.value }))}
                placeholder="100"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCreateCoupon()}
                disabled={submittingCoupon}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] p-4 text-sm font-black text-white disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {submittingCoupon ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">Coupon Management</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs font-black uppercase tracking-wider text-[#1E253A]">
                  <tr>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Usage</th>
                    <th className="px-6 py-4">Expires</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.coupons.items ?? []).map((coupon) => (
                    <tr key={coupon.id}>
                      <td className="px-6 py-4 font-black text-[#1E253A]">{coupon.code}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {coupon.discount_type === "percentage" ? `${coupon.value}%` : `$${coupon.value}`}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {coupon.usage_count} / <span className="font-bold text-gray-700">{coupon.usage_limit}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString("en-US") : "No expiry"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          coupon.status === "active"
                            ? "bg-green-100 text-green-700"
                            : coupon.status === "paused"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                        }`}>
                          {coupon.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {coupon.status !== "active" ? (
                            <button
                              onClick={() => void handleCouponAction(coupon, "activate")}
                              className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-700"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => void handleCouponAction(coupon, "pause")}
                              className="rounded-lg bg-yellow-50 px-3 py-2 text-xs font-bold text-yellow-700"
                            >
                              Pause
                            </button>
                          )}
                          <button
                            onClick={() => void handleCouponAction(coupon, "delete")}
                            className="inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
