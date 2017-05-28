import './main.css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';

import {json} from 'd3-request';
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

  carte(secteurs, map);
  selector({position: 'topright'}).addTo(map);
  legend({position: 'bottomleft'}).addTo(map);
  details({position: 'bottomright'}).addTo(map);


  const bureaux = L.geoJSON(
    feature(topology, topology.objects.bureaux),
    {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng).bindPopup(popupContent(feature));

      }
    }
  ).addTo(map);

  L.control.layers(null, {'Bureaux': bureaux}, {position: 'topleft'}).addTo(map);

  window.map = map;
});


function popupContent(feature) {
  return `
  <strong>Lieu</strong> : ${feature.properties.libelle}<br>
  <strong>Adresse</strong> : ${feature.properties.adresse}<br>
  <strong>Numéros de bureaux</strong> : ${feature.properties.bureaux.join(', ')}
  `;
}