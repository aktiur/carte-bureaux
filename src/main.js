import './main.css';
import 'leaflet';
import 'leaflet/dist/leaflet.css';

import {json} from 'd3-request';
import {feature} from 'topojson';

import selector from './selector';
import legend from './legend';
import carte from './carte';
import details from './details';

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

  carte(bureaux, map);
  selector({position: 'topright'}).addTo(map);
  legend({position: 'bottomleft'}).addTo(map);
  details({position: 'bottomright'}).addTo(map);
});
