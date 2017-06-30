import './main.css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';

import {json} from 'd3-request';
import {extent} from 'd3-array';
import {scaleSqrt} from 'd3-scale';
import {feature} from 'topojson';

import selector from './selector';
import legend from './legend';
import carte from './carte';
import details from './details';
import {tileURL, tileAttribution} from './config';


json('topology.json', function (err, topology) {
  if (err) {
    throw err;
  }

  const leafletBounds = L.latLngBounds(
    [topology.bbox[1], topology.bbox[0]],
    [topology.bbox[3], topology.bbox[2]]
  );

  const secteurs = feature(topology, topology.objects.secteurs);

  const map = L.map('app').fitBounds(leafletBounds)
    .addLayer(L.tileLayer(tileURL, {attribution: tileAttribution}));

  map.createPane('circles');
  map.createPane('myposition');

  const selectorLayer = selector({position: 'topright'});
  const carteLayer = carte(secteurs, selectorLayer.metricObservable);
  const detailsLayer = details(selectorLayer.scrutinObservable, carteLayer.bureauObservable, {position: 'bottomright'});

  carteLayer.addTo(map);
  selectorLayer.addTo(map);
  detailsLayer.addTo(map);

  if (! L.Browser.mobile) {
    const legendLayer = legend(selectorLayer.metricObservable, {position: 'bottomleft'});
    legendLayer.addTo(map);
  }

  const bureaux = L.geoJSON(
    feature(topology, topology.objects.bureaux),
    {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng).bindPopup(bureauPopup(feature));

      }
    }
  );

  if (topology.objects.bureaux.geometries.length <= 50) {
    bureaux.addTo(map);
  }

  const hlms = window.hlms = feature(topology, topology.objects.hlms);
  console.log(hlms);
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


  if(L.Browser.mobile) {
    map.locate({watch: true});
    map.on('locationfound', onLocationFound);

    let marker = null;

    function onLocationFound(e) {
      if(marker !== null) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.circleMarker(
          e.latlng,
          {color: '#2413bf', fillColor: '#82bbc8', fillOpacity: 0.7, radius: 4, pane: 'myposition'})
          .addTo(map);
      }
    }
  }

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
