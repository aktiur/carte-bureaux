import './main.css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';

import {json} from 'd3-request';
import {extent} from 'd3-array';
import {scaleSqrt} from 'd3-scale';
import {feature} from 'topojson';
import {select} from 'd3-selection';

import selector from './selector';
import legend from './legend';
import carte from './carte';
import details from './details';
import {tileURL} from './config';


json('topology.json', function (err, topology) {
  if (err) {
    throw err;
  }

  if (L.Browser.mobile) {
    select('body').classed('mobile', true);
  }

  const leafletBounds = L.latLngBounds(
    [topology.bbox[1], topology.bbox[0]],
    [topology.bbox[3], topology.bbox[2]]
  );

  const secteurs = feature(topology, topology.objects.secteurs);

  const map = L.map('app').fitBounds(leafletBounds)
    .addLayer(L.tileLayer(tileURL));

  map.createPane('circles');

  const selectorLayer = selector({position: 'topright'});
  const carteLayer = carte(secteurs, selectorLayer.metricObservable);
  const legendLayer = legend(selectorLayer.metricObservable, {position: 'bottomleft'});
  const detailsLayer = details(selectorLayer.scrutinObservable, carteLayer.bureauObservable, {position: 'bottomright'});

  carteLayer.addTo(map);
  selectorLayer.addTo(map);
  legendLayer.addTo(map);
  detailsLayer.addTo(map);

  const bureaux = L.geoJSON(
    feature(topology, topology.objects.bureaux),
    {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng).bindPopup(bureauPopup(feature));

      }
    }
  ).addTo(map);

  const hlms = feature(topology, topology.objects.hlms);
  hlms.features.sort((a, b) => a > b ? -1 : a < b ? -1 : 0);
  const hlmSize = scaleSqrt()
    .range([5, 20])
    .domain(extent(hlms.features.map(d => d.properties.nombre_total_de_logements_finances)));

  const hlmMarkers = hlms.features.map(f => {
    const coords = f.geometry.coordinates;
    const latlng = L.latLng(coords[1], coords[0]);

    return L.circleMarker(latlng, {
      radius: hlmSize(f.properties.nombre_total_de_logements_finances),
      pane: 'circles'
    }).bindPopup(hlmPopup(f));
  });

  const hlmLayer = L.layerGroup(hlmMarkers);

  L.control.layers(
    null,
    {'Secteurs': carteLayer, 'Bureaux': bureaux, 'Logements sociaux': hlmLayer},
    {position: 'topleft'}).addTo(map);

  window.map = map;
});


function bureauPopup(feature) {
  return `
  <strong>Lieu</strong> : ${feature.properties.libelle}<br>
  <strong>Adresse</strong> : ${feature.properties.adresse}<br>
  <strong>Numéros de bureaux</strong> : ${feature.properties.bureaux.join(', ')}
  `;
}

function hlmPopup(feature) {
  return `
  <strong>Adresse</strong> : ${feature.properties.adresse}<br>
  <strong>Type</strong> : ${feature.properties.nature_du_programme}<br>
  <strong>Nombre de logements</strong> : ${feature.properties.nombre_total_de_logements_finances}<br>
  <strong>Bailleur</strong> : ${feature.properties.bailleur}
  `;
}