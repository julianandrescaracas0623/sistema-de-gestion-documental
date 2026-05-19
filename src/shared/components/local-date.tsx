"use client";

import { useEffect, useState } from "react";

interface LocalDateProps {
  date: string | Date;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
}

const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

export function LocalDate({ date, locale = "es-CO", options = DEFAULT_OPTIONS }: LocalDateProps) {
  const [formatted, setFormatted] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    let dateObj: Date;
    if (typeof date === "string") {
      // Database timestamps come without timezone, so treat them as UTC
      // Append 'Z' if not already present to explicitly mark as UTC
      const dateStr = date.includes("Z") || date.includes("+") ? date : `${date}Z`;
      dateObj = new Date(dateStr);
    } else {
      dateObj = date;
    }

    // Auto-detect user's timezone instead of hardcoding
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const formatter = new Intl.DateTimeFormat(locale, {
      ...options,
      timeZone: userTimezone,
    });
    setFormatted(formatter.format(dateObj));
  }, [date, locale, options]);

  if (!mounted) {
    return <span>—</span>;
  }

  return <span>{formatted}</span>;
}