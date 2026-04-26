"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient, getApiErrorMessage } from "@/lib/api";
import {
  ChevronRight,
  Paperclip,
  Reply,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";

type SupportTicketDetailResponse = {
  id: string;
  ticket_number: string;
  subject: string;
  status: "open" | "resolved";
  priority: "normal" | "high";
  submitted_at: string;
  resolved_at: string | null;
  badges: Array<{
    label: string;
    variant: string;
  }>;
  customer: {
    user_name: string;
    email: string;
    phone: string | null;
    location: string | null;
    restaurant_name: string | null;
  };
  messages: Array<{
    author_name: string;
    author_role: string;
    body: string;
    is_internal: boolean;
    attachment_name: string | null;
    attachment_url: string | null;
    created_at: string;
  }>;
  reply_composer: {
    title: string;
    placeholder: string;
    internal_note_label: string;
    resolve_button_label: string;
    send_button_label: string;
    reply_endpoint: string | null;
    resolve_endpoint: string | null;
  } | null;
};

type SupportTicketActionResponse = {
  message: string;
  ticket: SupportTicketDetailResponse;
};

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

function TicketDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#EED7C8]" />
                  <div>
                    <div className="h-4 w-32 rounded bg-[#E9EEF4]" />
                    <div className="mt-2 h-3 w-24 rounded bg-[#F1F5F9]" />
                  </div>
                </div>
                <div className="h-3 w-20 rounded bg-[#F1F5F9]" />
              </div>
              <div className="mt-6 space-y-3">
                <div className="h-4 w-full rounded bg-[#E9EEF4]" />
                <div className="h-4 w-[92%] rounded bg-[#E9EEF4]" />
                <div className="h-4 w-[84%] rounded bg-[#E9EEF4]" />
              </div>
              <div className="mt-6 h-14 rounded-xl bg-[#F8FAFC]" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-[#E9EEF4]" />
          <div className="mt-8 flex items-center gap-4 border-b border-gray-50 pb-8 dark:border-gray-800/50">
            <div className="h-12 w-12 rounded-full bg-[#EED7C8]" />
            <div>
              <div className="h-4 w-28 rounded bg-[#E9EEF4]" />
              <div className="mt-2 h-3 w-20 rounded bg-[#F1F5F9]" />
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-4 w-full rounded bg-[#E9EEF4]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketProfilePage() {
  const params = useParams<{ id: string }>();
  const ticketId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [ticket, setTicket] = useState<SupportTicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicket = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<SupportTicketDetailResponse>(
          `/api/v1/support/tickets/${ticketId}`
        );
        setTicket(response.data);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "Failed to load support ticket"));
      } finally {
        setLoading(false);
      }
    };

    void fetchTicket();
  }, [ticketId]);

  const handleReply = async () => {
    if (!ticket || !ticket.reply_composer?.reply_endpoint || !replyMessage.trim()) {
      return;
    }

    setSendingReply(true);
    setError(null);

    try {
      const response = await apiClient.post<SupportTicketActionResponse>(
        ticket.reply_composer.reply_endpoint,
        {
          message: replyMessage.trim(),
          is_internal: isInternal,
        }
      );
      setTicket(response.data.ticket);
      setReplyMessage("");
      setIsInternal(false);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to send support reply"));
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket || !ticket.reply_composer?.resolve_endpoint || ticket.status === "resolved") {
      return;
    }

    setResolving(true);
    setError(null);

    try {
      const response = await apiClient.post<SupportTicketActionResponse>(
        ticket.reply_composer.resolve_endpoint
      );
      setTicket(response.data.ticket);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to resolve support ticket"));
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="flex-1 bg-[var(--color-background)] pb-10 dark:bg-black">
      <title>{ticket ? `Ticket ${ticket.ticket_number} | Aldo` : "Support Ticket | Aldo"}</title>
      <Header />

      <main className="mx-auto max-w-[1400px] space-y-6 p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-400 dark:text-gray-500">
              <Link href="/dashboard/support" className="transition-all hover:text-gray-900 dark:hover:text-white">
                Tickets
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-900 dark:text-white">
                {ticket ? ticket.ticket_number : "Support Ticket"}
              </span>
            </div>
            <h1 className="tracking-[-0.02em] text-[32px] font-black text-[#1F2937] dark:text-white">
              {ticket?.subject || "Loading support ticket"}
            </h1>
            {ticket ? (
              <p className="mt-2 text-sm font-semibold text-gray-400">
                Submitted {formatDateTime(ticket.submitted_at)} by {ticket.customer.user_name}
              </p>
            ) : null}
          </div>
          {ticket ? (
            <div className="flex flex-wrap items-center gap-3">
              {ticket.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-xl px-4 py-2 text-sm font-bold ${
                    badge.variant === "success"
                      ? "border border-[#D1FAE5] bg-[#ECFDF5] text-[#059669] dark:border-emerald-800/30 dark:bg-emerald-900/20"
                      : badge.variant === "warning"
                        ? "bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-orange-900/20"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <TicketDetailSkeleton />
        ) : ticket ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {ticket.messages.map((message, index) => (
                <div
                  key={`${message.author_name}-${message.created_at}-${index}`}
                  className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6] text-gray-400 dark:bg-gray-800">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {message.author_name}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          {message.author_role}
                          {message.is_internal ? " • Internal note" : ""}
                        </p>
                      </div>
                    </div>
                    <span className="mt-1 text-xs font-bold text-gray-400">
                      {formatDateTime(message.created_at)}
                    </span>
                  </div>

                  <div className="space-y-4 text-[15px] font-medium leading-relaxed text-[#6B7280] dark:text-gray-300">
                    {message.body.split("\n").filter(Boolean).map((paragraph, paragraphIndex) => (
                      <p key={`${paragraphIndex}-${paragraph.slice(0, 20)}`}>{paragraph}</p>
                    ))}
                  </div>

                  {message.attachment_name ? (
                    <div className="mt-8 flex items-center justify-between rounded-xl border border-gray-100 bg-[#F9FAFB] p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-[#4B5563] dark:text-gray-300">
                          {message.attachment_name}
                        </span>
                      </div>
                      {message.attachment_url ? (
                        <a
                          href={message.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-[var(--color-primary)] hover:underline"
                        >
                          Open
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-6 flex items-center gap-3">
                  <Reply className="h-5 w-5 scale-x-[-1] text-[#6B7280]" />
                  <h3 className="text-lg font-bold text-[#1F2937] dark:text-white">
                    {ticket.reply_composer?.title || "Send a Reply"}
                  </h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                  <textarea
                    value={replyMessage}
                    onChange={(event) => setReplyMessage(event.target.value)}
                    className="min-h-[180px] w-full resize-y bg-white p-5 text-sm font-medium text-[#1F2937] outline-none placeholder:text-gray-300 dark:bg-gray-900 dark:text-gray-100"
                    placeholder={ticket.reply_composer?.placeholder || "Type your response..."}
                  />
                </div>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(event) => setIsInternal(event.target.checked)}
                        className="peer h-4 w-4 appearance-none rounded border border-gray-200 bg-white checked:border-[var(--color-primary)] checked:bg-[var(--color-primary)] focus:ring-0 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <svg
                        className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={4}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-gray-500 transition-colors group-hover:text-gray-700 dark:text-gray-400">
                      {ticket.reply_composer?.internal_note_label || "Post as internal note"}
                    </span>
                  </label>

                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <button
                      onClick={() => void handleResolve()}
                      disabled={resolving || ticket.status === "resolved"}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-100 bg-white px-6 py-2.5 text-sm font-bold text-[#4B5563] shadow-sm transition-all hover:border-gray-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 sm:flex-none"
                    >
                      {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {ticket.status === "resolved"
                        ? "Resolved"
                        : ticket.reply_composer?.resolve_button_label || "Mark as Resolved"}
                    </button>
                    <button
                      onClick={() => void handleReply()}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[var(--color-primary)]/20 transition-all hover:bg-[var(--color-primary-hover)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                    >
                      {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {ticket.reply_composer?.send_button_label || "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-8 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
                  CUSTOMER DETAILS
                </h3>

                <div className="mb-8 flex items-center gap-4 border-b border-gray-50 pb-8 dark:border-gray-800/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] dark:bg-orange-900/20">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                      {ticket.customer.user_name}
                    </h4>
                    <p className="mt-0.5 text-xs font-semibold text-gray-400">
                      Ticket {ticket.ticket_number}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[#9CA3AF]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-[#4B5563] dark:text-gray-300">
                      {ticket.customer.email}
                    </span>
                  </div>

                  {ticket.customer.phone ? (
                    <div className="flex items-center gap-4">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[#9CA3AF]">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-[#4B5563] dark:text-gray-300">
                        {ticket.customer.phone}
                      </span>
                    </div>
                  ) : null}

                  {ticket.customer.location ? (
                    <div className="flex items-center gap-4">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center text-[#9CA3AF]">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-[#4B5563] dark:text-gray-300">
                        {ticket.customer.location}
                      </span>
                    </div>
                  ) : null}

                  {ticket.customer.restaurant_name ? (
                    <div className="rounded-xl bg-[#F9FAFB] p-4 dark:bg-gray-800">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        Restaurant
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#1F2937] dark:text-white">
                        {ticket.customer.restaurant_name}
                      </p>
                    </div>
                  ) : null}

                  {ticket.resolved_at ? (
                    <div className="rounded-xl bg-[#ECFDF5] p-4 dark:bg-emerald-900/20">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#059669]">
                        Resolved At
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#065F46] dark:text-emerald-200">
                        {formatDateTime(ticket.resolved_at)}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
