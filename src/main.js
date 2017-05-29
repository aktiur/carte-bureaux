import './main.css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';

import {json} from 'd3-request';
import {extent} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {feature} from 'topojson';

import selector from './selector';
import legend from './legend';
import carte from './carte';
import details from './details';
import {tileURL} from './config';

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
    .addLayer(L.tileLayer(tileURL));

  const carteLayer = carte(secteurs).addTo(map);
  selector({position: 'topright'}).addTo(map);
  legend({position: 'bottomleft'}).addTo(map);
  details({position: 'bottomright'}).addTo(map);

  const bureaux = L.geoJSON(
    feature(topology, topology.objects.bureaux),
    {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng).bindPopup(bureauPopup(feature));

      }
    }
  ).addTo(map);

  const hlms = feature(topology, topology.objects.hlms);
  const hlmSize = scaleLinear()
    .range([10, 20])
    .domain(extent(hlms.features.map(d => d.properties.nombre_total_de_logements_finances)));

  console.log(extent(hlms.features.map(d => d.properties.nombre_total_de_logements_finances)));

  const hlmLayer = L.geoJSON(
    hlms,
    {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: hlmSize(feature.properties.nombre_total_de_logements_finances)
        }).bindPopup(hlmPopup(feature));
      }
    }
  );

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