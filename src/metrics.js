import {extent} from 'd3-array';
import {scaleSequential, scaleOrdinal, scaleThreshold, scaleSqrt} from 'd3-scale';
import {
  interpolateReds, interpolatePurples, interpolateOranges, interpolateGreys, interpolateBlues, schemeReds, schemeSet1
} from 'd3-scale-chromatic';
import {legendColor} from 'd3-svg-legend';

import {percentFormat} from './config';

/* une métrique définit :
 *
 * - une méthode init qui prend la liste des données et initialise le domaine des échelles, par exemple
 * - une propriété label qui renvoie le nom à afficher sur le bouton
 * - une méthode getColor qui prend un point de donnée et renvoie la couleur à afficher
 * - une méthode setUpLegend qui affiche la légende au bon endroit
 */

class VoteMetric {
  constructor({key, label, scale}) {
    this.key = key;
    this.label = label;
    this.scale = scale;
    this.dotScale = scaleSqrt().range([1, 5]);
  }

  _getRawValue(d) {
    return d.properties.votes[this.key];
  }

  _getValue(d) {
    return d.properties.votes[this.key] / d.properties.statistiques.exprimes;
  }

  get description() {
    return `Part des votes exprimés pour ${this.label}`;
  }

  init(data) {
    const domain = extent(data.map(d => this._getValue(d)));
    const rawDomain = extent(data.map(d => this._getRawValue(d)));
    this.scale.domain(domain);
    this.dotScale
      .domain(rawDomain)
      .range([rawDomain[0] / rawDomain[1], 1]);
  }

  getDotSize(d) {
    return this.dotScale(this._getRawValue(d));
  }

  getColor(d) {
    return this.scale(this._getValue(d));
  }

  getLegend() {
    return legendColor()
      .scale(this.scale)
      .labelFormat(percentFormat);
  }
}

const votesDescr = [
  {
    key: 'MÉLENCHON',
    label: 'Mélenchon',
    scale: scaleSequential(interpolateReds)
  },
  {
    key: 'MACRON',
    label: 'Macron',
    scale: scaleSequential(interpolateOranges),
  },
  {
    key: 'LE PEN',
    label: 'Le Pen',
    scale: scaleSequential(interpolateGreys)
  },
  {
    key: 'FILLON',
    label: 'Fillon',
    scale: scaleSequential(interpolatePurples)
  },
  {
    key: 'HAMON',
    label: 'Hamon',
    scale: scaleSequential(interpolateReds)
  },
];

export const votesMetrics = votesDescr.map(descr => new VoteMetric(descr));

function orderOf(data, key) {
  const score = data[key];
  return Object.keys(data).reduce((sum, candidat) => sum + (data[candidat] > score), 1);
}


export const simpleMetrics = [
  {
    key: 'abstention',
    label: 'Abstention',
    scale: scaleSequential(interpolateBlues),
    dotScale: scaleSqrt(),
    _getRawValue(d) {
      return d.properties.statistiques.abstentions;
    },
    _getValue(d) {
      return d.properties.statistiques.abstentions / d.properties.statistiques.inscrits;
    },
    init(data) {
      const domain = extent(data.map(d => this._getValue(d)));
      const rawDomain = extent(data.map(d => this._getRawValue(d)));
      this.scale.domain(domain);
      this.dotScale
        .domain(rawDomain)
        .range([rawDomain[0] / rawDomain[1], 1]);
    },
    getDotSize(d) {
      return this.dotScale(this._getRawValue(d));
    },
    getColor(d) {
      return this.scale(this._getValue(d));
    },
    getLegend() {
      return legendColor()
        .scale(this.scale)
        .labelFormat(percentFormat);
    }
  },
  {
    key: 'rang',
    label: 'Rang de Mélenchon',
    scale: scaleOrdinal(schemeReds[5]).domain([5, 4, 3, 2, 1]),
    init() {
    },
    getColor(d) {
      return this.scale(orderOf(d.properties.votes, 'MÉLENCHON'));
    },
    getLegend() {
      return legendColor()
        .scale(this.scale)
        .ascending(true)
        .labels(["5ème", "4ème", "3ème", "2ème", "1er"]);
    }
  },
  {
    key: 'force',
    label: 'Catégories de score',
    scale: scaleThreshold().range(schemeReds[4]).domain([.1, .2, .3]),
    init() {
    },
    getColor(d)
    {
      return this.scale(d.properties.votes['MÉLENCHON'] / d.properties.statistiques.exprimes);
    },
    getLegend() {
      return legendColor()
        .scale(this.scale)
        .labels(['- de 10 %', '10 - 20 %', '20 - 30 %', '+ de 30 %']);
    }
  }
];

export default votesMetrics.concat(simpleMetrics);
