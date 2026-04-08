const MANILA_TIME_ZONE = "Asia/Manila";

const manila12HourFormatter = new Intl.DateTimeFormat("en-PH", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
  timeZone: MANILA_TIME_ZONE,
});

const manila24HourFormatter = new Intl.DateTimeFormat("en-PH", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: MANILA_TIME_ZONE,
});

export function formatManilaTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return manila12HourFormatter.format(new Date(value));
}

export function formatManilaTimeForInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parts = manila24HourFormatter.formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;

  if (!hour || !minute) {
    return "";
  }

  return `${hour}:${minute}`;
}