import './legend.css';
import {select} from 'd3-selection';


const Legend = L.Control.extend({
  initialize: function(metricObservable, options) {
    this.metricObservable = metricObservable;
    L.Util.setOptions(this, options);
  },

  onAdd: function () {
    const div = select(L.DomUtil.create('div'))
      .attr('class', 'legend');

    this.toggleButton = div.append('button')
      .attr('class', 'toggle')
      .text('>>')
      .on('touchstart', function() {
        div.classed('touched', true);
      })
      .on('touchend', function() {
        div.classed('touched', false);
      });

    const svg = div.append('svg')
      .attr('width', 130)
      .attr('height', 250);

    let g = null;

    function updateLegend(metric) {
      if (g) { g.remove(); }

      g = svg.append('g')
        .attr('class', 'legendLinear')
        .attr('transform', 'translate(10,10)');

      const legend = metric.getLegend()
        .orient('vertical')
        .shapeWidth(50)
        .shapeHeight(40)
        .shapePadding(10);

      g.call(legend);
    }

    this.subscription = this.metricObservable.subscribe((metric) => setTimeout(() => updateLegend(metric), 0));

    return div.node();
  },

  onRemove: function(){
    this.subscription.unsubscribe();
  }
});

export default function(metricObservable, opts) { return new Legend(metricObservable, opts); }