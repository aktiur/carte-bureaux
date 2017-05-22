import './legend.css';
import {addListener, removeListener} from './selector';
import {select} from 'd3-selection';


const Legend = L.Control.extend({
  onAdd: function () {
    const div = select(L.DomUtil.create('div'))
      .attr('class', 'legend');

    const svg = div.append('svg')
      .attr('width', 170)
      .attr('height', 280);

    let g = null;

    this.updateLegend = function(metric) {
      if (g) { g.remove(); }

      g = svg.append('g')
        .attr('class', 'legendLinear')
        .attr('transform', 'translate(20,20)');

      const legend = metric.getLegend()
        .orient('vertical')
        .shapeWidth(50)
        .shapeHeight(40)
        .shapePadding(10);

      g.call(legend);
    };

    addListener(this.updateLegend);

    return div.node();
  },

  onRemove: function(){
    removeListener(this.updateLegend);
  }
});

export default function(opts) { return new Legend(opts); }