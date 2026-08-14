// Base URL for all API calls — set via NEXT_PUBLIC_BACKEND_URL env var
export const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

// Converts a raw file path from the backend (e.g. "uploads\file.jpg") into a full URL
export function mediaUrl(rawPath) {
  return `${BACKEND}/${rawPath.replace(/\\/g, "/")}`;
}

// Ensures bare ISO strings (no timezone suffix) are parsed as UTC, not local time
function parseUTC(isoString) {
  if (isoString && !isoString.endsWith("Z") && !isoString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(isoString + "Z");
  }
  return new Date(isoString);
}

// Returns a human-readable relative time string (e.g. "5m ago", "2h ago")
export function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - parseUTC(isoString)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Returns a full localized date string used on the post detail page
export function formatDate(isoString) {
  return parseUTC(isoString).toLocaleDateString("en-US", {
    year:   "numeric",
    month:  "long",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });
}
