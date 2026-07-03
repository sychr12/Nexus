const DATE_DIGITS_LIMIT = 8;

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, DATE_DIGITS_LIMIT);

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidDateInput(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || year < 1900 || year > 2100) return false;

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function dateInputToIso(value: string) {
  if (!isValidDateInput(value)) return "";
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

export function isoToDateInput(value?: string | null) {
  if (!value) return "";

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  return formatDateInput(value);
}

export function dateInputToIsoDateTime(value: string, endOfDay = false) {
  const isoDate = dateInputToIso(value);
  if (!isoDate) return "";
  return `${isoDate}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export function formatAnyDateToDateInput(value?: string | null) {
  if (!value) return "";
  if (isValidDateInput(value)) return value;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateInput(value);

  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getFullYear()),
  ].join("/");
}
