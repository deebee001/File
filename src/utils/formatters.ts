import type { SizeUnit } from '../types';

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

export function formatExactBytes(bytes: number): string {
  return `${new Intl.NumberFormat().format(bytes)} bytes`;
}

export function calculateTotalBytes(value: number, unit: SizeUnit): number {
  const safeVal = Math.max(1, value);
  switch (unit) {
    case 'B':
      return Math.round(safeVal);
    case 'KB':
      return Math.round(safeVal * 1024);
    case 'MB':
      return Math.round(safeVal * 1024 * 1024);
    case 'GB':
      return Math.round(safeVal * 1024 * 1024 * 1024);
    default:
      return Math.round(safeVal);
  }
}

export function sanitizeFileName(name: string, fallback = 'file'): string {
  // Remove path separators, invalid characters
  const clean = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return clean.length > 0 ? clean : fallback;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: '2-digit', minute: '2-digit' });
  } catch {
    return "Recently";
  }
}
