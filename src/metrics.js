import {extent, max} from 'd3-array';
import {scaleSqrt, scaleOrdinal} from 'd3-scale';
import {legendColor} from 'd3-svg-legend';

import {percentFormat, NaNColor, nuanceMetrics, abstentionMetricParameters, nuanceColors} from './config';

/* une métrique définit :
 *
 * - une méthode init qui prend la liste des données et initialise le domaine des échelles, par exemple
 * - une propriété label qui renvoie le nom à afficher sur le bouton
 * - une méthode getColor qui prend un point de donnée et renvoie la couleur à afficher
 * - une méthode setUpLegend qui affiche la légende au bon endroit
 */

class Metric {
  constructor({scale, dotScale,}) {
    this.scale = scale;
    this.dotScale = dotScale;
  }

  init(data) {
    const domain = extent(data.map(d => this._getValue(d)));
    const rawMax = max(data.map(d => this._getRawValue(d)));
    this.scale.domain(domain);
    this.dotScale
      .domain([0, rawMax])
      .range([0, 1]);
  }

  getDotSize(d) {
    return this.dotScale(this._getRawValue(d));
  }

  getColor(d) {
    const v = this._getValue(d);
    return Number.isNaN(v) ? NaNColor : this.scale(v);
  }

  getLegend() {
    return legendColor()
      .scale(this.scale)
      .labelFormat(percentFormat);
  }
}

class VoteMetric extends Metric {
  constructor({nuances, label, scale}) {
    super({scale, dotScale: scaleSqrt().range([1, 5])});
    this.nuances = nuances;
    this.label = label;
  }

  _getRawValue(d) {
    const candidat = d.candidats.find(c => this.nuances.includes(c.nuance));
    return candidat ? candidat.voix : 0;
  }

  _getValue(d) {
    const candidat = d.candidats.find(c => this.nuances.includes(c.nuance));
    return candidat ? candidat.voix / d.exprimes : NaN;
  }

  get description() {
    return `Part des votes exprimés pour ${this.label}`;
  }
}

export const votesMetrics = nuanceMetrics.map(descr => new VoteMetric(descr));


const abstentionMetric = Object.assign(
  new Metric({scale: abstentionMetricParameters.scale, dotScale: scaleSqrt()}),
  {
    label: abstentionMetricParameters.label,
    _getRawValue(d) {
      return d.inscrits - d.votants;
    },
    _getValue(d) {
      return (d.inscrits - d.votants) / d.inscrits;
    }
  }
);

const premierScale = window.premierScale = scaleOrdinal()
  .domain(Object.keys(nuanceColors))
  .range(Object.values(nuanceColors));

const premierMetric = Object.assign(
  new Metric({scale: premierScale, dotScale: null}),
  {
    label: '1er',
    _getValue(d) {
      return d.candidats[0].nuance;
    },
    init: function() {},
    getDotSize: () => 0
  }
);

export default votesMetrics.concat([abstentionMetric, premierMetric]);
