import {select} from 'd3-selection';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/combineLatest';

import metrics from './metrics';
import {scrutins} from './config';
import './selector.css';


const metricWrapper = ([scrutin, metric]) => ({
  init: data => metric.init(data.map(d => d.properties[scrutin])),
  getColor: d => metric.getColor(d.properties[scrutin]),
  getDotSize: d => metric.getDotSize(d.properties[scrutin]),
  getLegend: () => metric.getLegend()
});


const Selector = L.Control.extend({
  initialize: function(options) {
    L.Util.setOptions(this, options);

    this.scrutinObservable = new ReplaySubject(1);
    this._metricObservable = new ReplaySubject(1);
    this.metricObservable = Observable
      .combineLatest(this.scrutinObservable, this._metricObservable)
      .map(metricWrapper);
  },

  onAdd: function (map) {
    const div = select(L.DomUtil.create('div'));
    div.attr('class', 'selector');

    const scrutinSelector = div.append('div').attr('class', 'scrutin');
    const metricSelector = div.append('div').attr('class', 'metric');

    let scrutinOptions = scrutinSelector.selectAll('.option').data(scrutins).enter()
      .append('div')
      .attr('class', 'option');

    const scrutinInputs = scrutinOptions.append('input')
      .attr('type', 'radio')
      .property('checked', (d, i) => i === 0)
      .attr('name', 'scrutin')
      .attr('id', (d, i) => `scrutin-${i}`)
      .on('click', d => this.scrutinObservable.next(d.selector));

    const scrutinLabels = scrutinOptions.append('label')
      .attr('for', (d, i) => `scrutin-${i}`)
      .text(d => d.label);

    const metricOptions = metricSelector.selectAll('.option').data(metrics).enter()
      .append('div')
      .attr('class', 'option');

    const metricInputs = metricOptions.append('input')
      .attr('type', 'radio')
      .property('checked', (d, i) => i === 0)
      .attr('name', 'metric')
      .attr('id', (d, i) => `metric-${i}`)
      .on('click', d => this._metricObservable.next(d));

    const metricLabels = metricOptions.append('label')
      .attr('for', (d, i) => `metric-${i}`)
      .text(d => d.label);

    this.scrutinObservable.next(scrutins[0].selector);
    this._metricObservable.next(metrics[0]);

    return div.node();
  },
  onRemove: function () {}
});

export default function (opts) {
  return new Selector(opts);
}
