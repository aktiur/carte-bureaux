import polylabel from '@mapbox/polylabel';
import {transition} from 'd3-transition';
import {select, selectAll, event as d3event} from 'd3-selection';
import {geoTransform, geoPath} from 'd3-geo';
import {addListener as addSelectorListener, removeListener as removeSelectorListener} from './selector';

import {basePower, baseCircleSize, baseZoomLevel} from './config';

import './carte.css';

const Carte = L.Layer.extend({
  initialize: function (bureaux, options) {
    this.bureaux = bureaux;
    L.Util.setOptions(this, options);
  },
  onAdd: function (map) {
    const bureaux = this.bureaux;
    const svg = this.svg = select(map.getPane(this.options.pane)).append('svg'),
      g = svg.append('g').attr('class', 'leaflet-zoom-hide');

    function projectPoint(x, y) {
      const point = map.latLngToLayerPoint(L.latLng(y, x));
      this.stream.point(point.x, point.y);
    }

    const transform = geoTransform({point: projectPoint}),
      path = geoPath(transform);

    const groups = g.append('g')
      .selectAll(".bureaux")
      .data(bureaux.features)
      .enter().append("g")
      .attr('class', 'bureaux')
      .on('click', clicked);

    const features = groups.append('path');

    const centroidGroups = g.append('g')
      .selectAll('.centroids')
      .data(bureaux.features)
      .enter()
      .append('g')
      .attr('class', 'centroids');

    const points = centroidGroups.append('circle')
      .attr('opacity', '0')
      .attr('r', 0)
      .attr('y', -1);

    const labels = centroidGroups.append('text')
      .text((d) => d.properties.bureau)
      .attr('text-anchor', 'middle')
      .attr('y', 2);

    this.positionSvg = function positionSvg() {
      const scaleFactor = baseCircleSize * Math.pow(basePower, map.getZoom() - baseZoomLevel);
      const projectedBounds = path.bounds(bureaux),
        topLeft = projectedBounds[0],
        bottomRight = projectedBounds[1];

      svg
        .attr("width", bottomRight[0] - topLeft[0])
        .attr("height", bottomRight[1] - topLeft[1])
        .style("left", topLeft[0] + "px")
        .style("top", topLeft[1] + "px");

      g.attr("transform", `translate(${-topLeft[0]},${-topLeft[1]})`);

      features.attr("d", path);
      centroidGroups.attr('transform', function (d) {
          const pole = polylabel([d.geometry.coordinates[0].map(function ([x, y]) {
            const coords = map.latLngToLayerPoint(L.latLng(y, x));
            return [coords.x, coords.y];
          })]);

          return `matrix(${scaleFactor},0,0,${scaleFactor},${pole[0]},${pole[1]})`;
        }
      );
    };

    this.rescale = function(metric) {
      const t = transition('color').duration(750);
      metric.init(bureaux.features);

      features
        .transition(t)
        .attr('fill', d => metric.getColor(d));

      if ('getDotSize' in metric) {
        points
          .transition(t)
          .attr('opacity', .7)
          .attr('r', d => metric.getDotSize(d));
      } else {
        points
          .transition(t)
          .attr('opacity', 0)
          .attr('r', 0);
      }
    };

    this.positionSvg();
    addSelectorListener(this.rescale);
  },

  getEvents: function() {
    return {
      viewreset: () => this.positionSvg(),
      zoom: () => this.positionSvg(),
    };
  },

  onRemove: function () {
    removeSelectorListener(this.rescale);
    this.svg.remove();
  }
});

export default function(bureaux, opts) {
  return new Carte(bureaux, opts);
}

function clicked(d, i, nodes) {
  if (d3event.defaultPrevented) {
    return;
  }

  selectAll(nodes)
    .classed("selected", (_, j) => i === j);
  select(this).raise();
  emit.apply(this, arguments);
}

let last = null;
const listeners = [];

function emit(d) {
  last = d;
  for (let listener of listeners) {
    listener(d);
  }
}

export function addListener(listener) {
  listeners.push(listener);
  if (last) {
    setTimeout(function () {
      listener(last);
    }, 0);
  }
}

export function removeListener(listener) {
  if (!(listener in listeners)) {
    return;
  }
  listeners.splice(listeners.indexOf(listener), 1);
}
