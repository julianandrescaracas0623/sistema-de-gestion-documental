/** YYYY-MM-DD in local timezone (avoids UTC shift from toISOString). */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${String(y)}-${m}-${d}`;
}

export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}

export function normalizeDateRange(
  dateFrom: string,
  dateTo: string
): { dateFrom: string; dateTo: string } {
  if (dateFrom === "" || dateTo === "") {
    return { dateFrom, dateTo };
  }
  if (dateFrom > dateTo) {
    return { dateFrom: dateTo, dateTo: dateFrom };
  }
  return { dateFrom, dateTo };
}

export interface QuickFilterPreset {
  label: string;
  key: string;
  getDates: () => { dateFrom: string; dateTo: string };
}

export const QUICK_FILTER_PRESETS: QuickFilterPreset[] = [
  {
    label: "7 días",
    key: "7d",
    getDates: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { dateFrom: toLocalDateString(d), dateTo: todayLocalDateString() };
    },
  },
  {
    label: "1 mes",
    key: "1m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return { dateFrom: toLocalDateString(d), dateTo: todayLocalDateString() };
    },
  },
  {
    label: "2 meses",
    key: "2m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 2);
      return { dateFrom: toLocalDateString(d), dateTo: todayLocalDateString() };
    },
  },
  {
    label: "3 meses",
    key: "3m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return { dateFrom: toLocalDateString(d), dateTo: todayLocalDateString() };
    },
  },
  {
    label: "6 meses",
    key: "6m",
    getDates: () => {
      const d = new Date();
      d.setMonth(d.getMonth() - 6);
      return { dateFrom: toLocalDateString(d), dateTo: todayLocalDateString() };
    },
  },
  {
    label: "1 año",
    key: "1y",
    getDates: () => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return { dateFrom: toLocalDateString(d), dateTo: todayLocalDateString() };
    },
  },
];

export function findActiveQuickFilter(
  dateFrom: string,
  dateTo: string
): QuickFilterPreset | null {
  if (dateFrom === "" || dateTo === "") return null;
  for (const preset of QUICK_FILTER_PRESETS) {
    const { dateFrom: pf, dateTo: pt } = preset.getDates();
    if (dateFrom === pf && dateTo === pt) return preset;
  }
  return null;
}

export function formatDateRangeLabel(dateFrom: string, dateTo: string): string {
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    if (y === undefined || m === undefined || d === undefined) return iso;
    return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
}
