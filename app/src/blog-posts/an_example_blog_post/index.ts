import html01 from './01.html?raw';
import comp02 from './02';
import html03 from './03.html?raw';

export const metadata = {
  date: 'March 16th, 2026',
  readingTimeMinutes: 1,
} as const;

export const entries = [
  { kind: 'html',      content: html01 },
  { kind: 'component', Component: comp02 },
  { kind: 'html',      content: html03 },
] as const;
