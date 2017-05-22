import './main.css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';

import {select} from 'd3-selection';
import {json} from 'd3-request';
import {geoTransform, geoPath} from 'd3-geo';
import {feature} from 'topojson';


json('topology.json', function (err, topology) {
  if (err) {
    throw err;
  }

  const leafletBounds = L.latLngBounds(
    [topology.bbox[1], topology.bbox[0]],
    [topology.bbox[3], topology.bbox[2]]
  );

  const bureaux = feature(topology, topology.objects.bureaux);

  const map = L.map('app').fitBounds(leafletBounds)
    .addLayer(L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWt0aXVyIiwiYSI6ImNpaW03Y3hqYjAwNXh2eGtza2xxdHR5d2kifQ.Z919NzygXw9K1pjIJuuzQA"));

  const svg = select(map.getPanes().overlayPane).append('svg'),
    g = svg.append('g').attr('class', 'leaflet-zoom-hide');

  function projectPoint(x, y) {
    const point = map.latLngToLayerPoint(L.latLng(y, x));
    this.stream.point(point.x, point.y);
  }

  const transform = geoTransform({point: projectPoint}),
    path = geoPath(transform);

  const features = g.selectAll(".bureaux")
    .data(bureaux.features)
    .enter().append("path")
    .attr('class', 'bureaux');

  function positionSvg() {
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
  }

  positionSvg();
  map.on('viewreset', positionSvg);
  map.on('zoom', positionSvg);
});
