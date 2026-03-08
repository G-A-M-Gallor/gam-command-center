/**
 * Format a timestamp as a relative time string.
 * Supports he/en/ru languages.
 */
export function timeAgo(timestamp: number, lang: "he" | "en" | "ru"): string {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (min < 1) {
    return lang === "he" ? "עכשיו" : lang === "ru" ? "Сейчас" : "Now";
  }
  if (min < 60) {
    return lang === "he" ? `${min} דק'` : `${min}m`;
  }
  if (hrs < 24) {
    return lang === "he" ? `${hrs} שע'` : `${hrs}h`;
  }
  return lang === "he" ? `${days} ימים` : `${days}d`;
}
