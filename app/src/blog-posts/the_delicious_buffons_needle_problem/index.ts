import html01 from './01.html?raw';
import comp02 from './02';
import html03 from './03.html?raw';
import comp04 from './04';
import html05 from './05.html?raw';
import comp06 from './06';
import html07 from './07.html?raw';

export const entries = [
  { kind: 'html',      content: html01 },
  { kind: 'component', Component: comp02 },
  { kind: 'html',      content: html03 },
  { kind: 'component', Component: comp04 },
  { kind: 'html',      content: html05 },
  { kind: 'component', Component: comp06 },
  { kind: 'html',      content: html07 },
] as const;
