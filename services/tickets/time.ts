/** Timestamps are stored as UTC Dates and always displayed in Pakistan time. */
export const PAKISTAN_TIME_ZONE = "Asia/Karachi";

const dateTimeFormat = new Intl.DateTimeFormat("en-PK", {
  timeZone: PAKISTAN_TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

const timeFormat = new Intl.DateTimeFormat("en-PK", {
  timeZone: PAKISTAN_TIME_ZONE,
  timeStyle: "short",
});

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPakistanDateTime(
  value: Date | string | null | undefined
): string {
  const date = toDate(value);

  return date ? dateTimeFormat.format(date) : "—";
}

export function formatPakistanTime(
  value: Date | string | null | undefined
): string {
  const date = toDate(value);

  return date ? timeFormat.format(date) : "—";
}
