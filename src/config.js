import {formatLocale} from 'd3-format';
import {scaleSequential} from 'd3-scale';
import {
  interpolateReds,
  interpolatePurples,
  interpolateOranges,
  interpolateGreys,
  interpolateBlues,
  interpolateGreens
} from 'd3-scale-chromatic';


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

export const NaNColor = 'rgb(255,255,255)';

export const scrutins = [
  {label: 'Légis.', selector: 'legislatives'},
  {label: 'Prés.', selector: 'presidentielle'}
];

export const nuanceMetrics = [
  {
    nuances: ['FI'],
    label: 'FI',
    scale: scaleSequential(interpolateReds)
  },
  {
    nuances: ['REM', 'MDM'],
    label: 'EM',
    scale: scaleSequential(interpolateOranges),
  },
  {
    nuances: ['FN'],
    label: 'FN',
    scale: scaleSequential(interpolateGreys)
  },
  {
    nuances: ['LR', 'UDI'],
    label: 'LR',
    scale: scaleSequential(interpolatePurples)
  },
  {
    nuances: ['SOC'],
    label: 'PS',
    scale: scaleSequential(interpolateReds)
  },
  {
    nuances: ['ECO'],
    label: 'EELV',
    scale: scaleSequential(interpolateGreens)
  }
];

export const abstentionMetricParameters = {
  scale: scaleSequential(interpolateBlues),
  label: 'Abs.'
};

export const nuanceColors = {
  'EXG': "#c41114",
  'COM': "#ff3f00",
  'FI': "#ff3f19",
  'SOC': "#f88573",
  'RDG': '#ffb494',
  'DVG': '#e8b68c',
  'ECO': '#19ac31',
  'DIV': "#e5d9a1",
  'REG': '#ff5df9',
  'REM': '#ffc600',
  'MDM': '#ffb42e',
  'UDI': "#65aeb9",
  'LR': "#23408f",
  'DVD': "#057c85",
  'DLF': "#6f6f9c",
  'FN': "#2f3e4b",
  'EXD': '#000',
  'Abstention': '#120958'
};
