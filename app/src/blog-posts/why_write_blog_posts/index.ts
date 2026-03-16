import html01 from './01.html?raw';

export const metadata = {
  date: 'March 16th, 2026',
  readingTimeMinutes: 6,
} as const;

export const entries = [
  { kind: 'html',      content: html01 },
] as const;
