const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const delta = now - timestamp;
  if (delta < MINUTE) return 'just now';
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`;
  if (delta < 30 * DAY) return `${Math.floor(delta / DAY)}d ago`;
  if (delta < 365 * DAY) return `${Math.floor(delta / (30 * DAY))}mo ago`;
  return `${Math.floor(delta / (365 * DAY))}y ago`;
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds < MINUTE) return `${Math.round(milliseconds / 1000)}s`;
  if (milliseconds < HOUR) return `${Math.floor(milliseconds / MINUTE)}m`;
  if (milliseconds < DAY) return `${Math.floor(milliseconds / HOUR)}h`;
  return `${Math.floor(milliseconds / DAY)}d`;
}

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function bucketTimestamps(timestamps: number[], bucketSize = DAY): Map<number, number> {
  const buckets = new Map<number, number>();
  for (const timestamp of timestamps) {
    const key = Math.floor(timestamp / bucketSize) * bucketSize;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return new Map([...buckets.entries()].sort((a, b) => a[0] - b[0]));
}
