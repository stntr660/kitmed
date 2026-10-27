import { createLucideIcon } from 'lucide-react';

// Speciality icons lucide does not have, drawn on the same 24px grid and
// stroke so they sit next to Eye, Ear, BedDouble in the partners strip.

export const KneeSupport = createLucideIcon('KneeSupport', [
  ['path', { d: 'M6 2c.5 3.6 2.6 6.2 2.6 9.8S6.6 18.2 7 22', key: 'leg-back' }],
  ['path', { d: 'M15 2c1 3.2 4.6 5.6 4.6 9.8 0 4.2-3.4 6.2-3.2 10.2', key: 'leg-front' }],
  ['path', { d: 'M7.9 7h9.5', key: 'brace-top' }],
  ['path', { d: 'M7.9 16.6h9.4', key: 'brace-bottom' }],
  ['circle', { cx: '15.4', cy: '11.8', r: '2.3', key: 'patella' }],
  ['path', { d: 'M11.2 7.6c.5 1.4.7 2.8.7 4.2s-.2 2.8-.7 4.2', key: 'stay' }],
]);

export const EyeDrops = createLucideIcon('EyeDrops', [
  ['rect', { x: '10', y: '1.5', width: '8', height: '10', rx: '2', transform: 'rotate(35 14 9)', key: 'bottle' }],
  ['path', { d: 'M12 11.5v2h4v-2', transform: 'rotate(35 14 9)', key: 'neck' }],
  ['path', { d: 'M13 13.5l1 3 1-3', transform: 'rotate(35 14 9)', key: 'nozzle' }],
  ['path', { d: 'M6.6 14.4c1.2 1.4 1.9 2.4 1.9 3.3a1.9 1.9 0 0 1-3.8 0c0-.9.7-1.9 1.9-3.3Z', key: 'drop' }],
  ['path', { d: 'M3.6 20c.7.8 1.1 1.4 1.1 1.9a1.1 1.1 0 0 1-2.2 0c0-.5.4-1.1 1.1-1.9Z', key: 'drop-small' }],
]);
