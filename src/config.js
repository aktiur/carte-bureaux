import {formatLocale} from 'd3-format';

export const locale = formatLocale({
  decimal: ',',
  thousands: ' ',
  grouping: [3],
  currency: ['', '\u202f€'],
  percent: '\u202f%'
});

export const percentFormat = locale.format('.1%');
export const intFormat = locale.format(',d');

export const baseCircleSize = 15;
export const basePower = 1.7;
export const baseZoomLevel = 15;

export const tileURL = "http://c.tile.openstreetmap.org/{z}/{x}/{y}.png";
