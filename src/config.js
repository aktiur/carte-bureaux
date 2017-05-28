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

export const tileURL = "https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWt0aXVyIiwiYSI6ImNpaW03Y3hqYjAwNXh2eGtza2xxdHR5d2kifQ.Z919NzygXw9K1pjIJuuzQA";
