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
