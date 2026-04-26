"use client";
/* eslint-disable @next/next/no-img-element */

import React, { ChangeEvent, useEffect, useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  FileText,
  Shield,
  Pencil,
  ChevronDown,
  Save,
  RotateCcw,
  Loader2,
  Upload,
} from "lucide-react";

type GeneralSettingsResponse = {
  profile_image_url: string | null;
  platform_name: string;
  support_email: string;
  default_language: string;
  language_options: Array<{
    key: string;
    label: string;
    active: boolean;
  }>;
  save_endpoint: string;
};

type OverviewSettingsResponse = {
  profile_image_url: string | null;
  platform_name: string;
  support_email: string;
  default_language: string;
  legal_pages: Array<{
    key: string;
    title: string;
    last_updated_value: string;
    icon_key: string;
    edit_endpoint: string;
  }>;
};

type SettingsActionResponse = {
  message: string;
  general?: GeneralSettingsResponse | null;
};

type FormState = {
  platform_name: string;
  support_email: string;
  default_language: string;
};

const emptyForm: FormState = {
  platform_name: "",
  support_email: "",
  default_language: "",
};

function SettingsSkeleton() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="relative mt-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-white bg-[#EED7C8] dark:border-gray-900" />
        <div className="mt-8 animate-pulse">
          <div className="h-6 w-40 rounded bg-[#E9EEF4]" />
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className={index === 2 ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                <div className="h-3 w-28 rounded bg-[#F1F5F9]" />
                <div className="h-12 w-full rounded-xl bg-[#E9EEF4]" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-6 w-32 rounded bg-[#E9EEF4]" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#E9EEF4]" />
                  <div>
                    <div className="h-4 w-32 rounded bg-[#E9EEF4]" />
                    <div className="mt-2 h-3 w-24 rounded bg-[#F1F5F9]" />
                  </div>
                </div>
                <div className="h-9 w-20 rounded-lg bg-[#E9EEF4]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SettingsPage() {
  const [general, setGeneral] = useState<GeneralSettingsResponse | null>(null);
  const [overview, setOverview] = useState<OverviewSettingsResponse | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const [generalResponse, overviewResponse] = await Promise.all([
          apiClient.get<GeneralSettingsResponse>("/api/v1/settings/general"),
          apiClient.get<OverviewSettingsResponse>("/api/v1/settings/overview"),
        ]);

        setGeneral(generalResponse.data);
        setOverview(overviewResponse.data);
        setForm({
          platform_name: generalResponse.data.platform_name,
          support_email: generalResponse.data.support_email,
          default_language: generalResponse.data.default_language,
        });
        setPreviewUrl(generalResponse.data.profile_image_url);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load settings"));
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const isDirty = useMemo(() => {
    if (!general) return false;

    return (
      form.platform_name !== general.platform_name ||
      form.support_email !== general.support_email ||
      form.default_language !== general.default_language ||
      selectedFile !== null
    );
  }, [form, general, selectedFile]);

  const handleInputChange =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleReset = () => {
    if (!general) return;

    setForm({
      platform_name: general.platform_name,
      support_email: general.support_email,
      default_language: general.default_language,
    });
    setSelectedFile(null);
    setPreviewUrl(general.profile_image_url);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    if (!general?.save_endpoint) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = new FormData();
      payload.append("platform_name", form.platform_name);
      payload.append("support_email", form.support_email);
      payload.append("default_language", form.default_language);
      if (selectedFile) {
        payload.append("profile_image", selectedFile);
      }

      const response = await apiClient.put<SettingsActionResponse>(general.save_endpoint, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.general) {
        setGeneral(response.data.general);
        setForm({
          platform_name: response.data.general.platform_name,
          support_email: response.data.general.support_email,
          default_language: response.data.general.default_language,
        });
        setPreviewUrl(response.data.general.profile_image_url);
        setSelectedFile(null);
      }

      setOverview((current) =>
        current
          ? {
              ...current,
              profile_image_url: response.data.general?.profile_image_url || current.profile_image_url,
              platform_name: response.data.general?.platform_name || current.platform_name,
              support_email: response.data.general?.support_email || current.support_email,
              default_language: response.data.general?.default_language || current.default_language,
            }
          : current
      );
      setSuccessMessage(response.data.message);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update settings"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-[var(--color-background)] pb-10 dark:bg-black">
      <title>Settings | Aldo</title>
      <Header title="Settings" subtitle="Manage platform configuration and legal information." />

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <main className="mx-auto max-w-4xl space-y-6 p-8">
          {error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="relative mt-12 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full border-4 border-white shadow-sm dark:border-gray-900">
              {previewUrl ? (
                <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F4E7DB] text-lg font-bold text-[#9A5A2B]">
                  {(form.platform_name || "A").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <h3 className="mb-6 mt-8 text-lg font-bold text-gray-900 dark:text-white">General Settings</h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Profile Image</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-600 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name : "Upload profile image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Platform Name</label>
                <input
                  type="text"
                  value={form.platform_name}
                  onChange={handleInputChange("platform_name")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-[var(--color-text-input)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Support Email</label>
                <input
                  type="email"
                  value={form.support_email}
                  onChange={handleInputChange("support_email")}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-[var(--color-text-input)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] dark:border-gray-700 dark:bg-gray-800"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Default Language</label>
                <div className="relative">
                  <select
                    value={form.default_language}
                    onChange={handleInputChange("default_language")}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    {general?.language_options.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Legal Pages</h3>

            <div className="space-y-4">
              {overview?.legal_pages.map((page) => {
                const icon =
                  page.icon_key === "privacy" ? (
                    <Shield className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  );
                const destination = page.edit_endpoint.includes("privacy")
                  ? "/dashboard/settings/legal-editor?tab=privacy"
                  : "/dashboard/settings/legal-editor?tab=terms";

                return (
                  <div
                    key={page.key}
                    className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{page.title}</h4>
                        <p className="mt-0.5 text-xs font-medium text-gray-400">
                          Last updated: {page.last_updated_value}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={destination}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={handleReset}
              disabled={!isDirty || saving}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              Discard Changes
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={!isDirty || saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
