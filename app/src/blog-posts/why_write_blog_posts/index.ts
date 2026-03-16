import html01 from './01.html?raw';

export const metadata = {
  title: 'Why Write Blog Posts?',
  date: 'October 12th, 2025',
  isoDate: '2025-10-12',
  readingTimeMinutes: 6,
} as const;

export const entries = [
  { kind: 'html',      content: html01 },
] as const;
