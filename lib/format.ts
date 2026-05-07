export const formatShortDate = (value: string | null, fallback = "N/A"): string => {
  if (!value) return fallback;

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

export const formatShortDateTime = (value: string | null, fallback = "N/A"): string => {
  if (!value) return fallback;

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

export const formatBillingCycle = (value: string | null): string => {
  if (value === "1_year") return "YEARLY";
  if (value === "1_month") return "MONTHLY";
  return "N/A";
};
