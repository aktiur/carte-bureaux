import {scaleLinear, scaleBand} from 'd3-scale';
import {axisLeft, axisBottom} from 'd3-axis';
import {select} from 'd3-selection';
import {percentFormat, intFormat} from './config';
import {addListener} from './carte';

import './details.css';

const barColors = {
  'ARTHAUD': "#c41114",
  'ASSELINEAU': "#057c85",
  'CHEMINADE': "#e53517",
  'DUPONT-AIGNAN': "#39394b",
  'FILLON': "#23408f",
  'HAMON': "#e0003c",
  'LASSALLE': "#ff9632",
  'LE PEN': "#2f3e4b",
  'MÉLENCHON': "#ff3f19",
  'POUTOU': "#ff1f17",
  'MACRON': '#ffc600'
};

const width = 300, height = 300;
const labelsWidth = 80, scaleHeight = 20;
const rightMargin = 20;

function nomBureau(d) {
  return `Bureau n°${d.properties.bureau}`;
}

function resumeStatistiques(t) {
  return `
  <p><strong>Nombre d'inscrits</strong> : ${intFormat(t.inscrits)}</p>
  <p><strong>Abstention (part des inscrits)</strong> : ${percentFormat(t.abstentions / t.inscrits)}</p>
  `;
}

const DetailPanel = L.Control.extend({
  onAdd: function () {
    const elem = select(L.DomUtil.create('div'));

    elem.attr('class', 'details');

    const title = elem.append('h2')
      .text('Cliquez sur un bureau pour obtenir des détails');

    const graph = elem.append('svg')
      .attr('width', width + labelsWidth + rightMargin)
      .attr('height', height + scaleHeight);

    const results = graph.append('g')
      .attr('transform', `translate(${labelsWidth},0)`);

    const labels = results.append('g')
      .attr('class', 'axis axis--y');

    const scale = results.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${height})`);

    const x = scaleLinear().rangeRound([0, width]);
    const y = scaleBand().rangeRound([0, height]).padding(0.1);

    const statistiques = elem.append('div');

    function draw(feature) {
      title.text(nomBureau(feature));

      const votes = feature.properties.votes;
      const exprimes = feature.properties.statistiques.exprimes;

      const candidats = Object.keys(votes).sort(function (a, b) {
        return votes[a] - votes[b];
      }).reverse().slice(0, 5);

      const data = candidats.map(function (c) {
        return {candidat: c, score: votes[c] / exprimes, votes: votes[c]};
      });

      y.domain(candidats);
      x.domain([0, Math.max(0.25, data[0].score)]);

      labels.call(axisLeft(y));
      scale.call(axisBottom(x).ticks(5, '%'));

      const bars = results.selectAll('.bar').data(data, function (d) {
        return d.candidat;
      });

      bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .merge(bars)
        .attr('y', function (d) {
          return y(d.candidat);
        })
        .attr('height', y.bandwidth())
        .attr('width', function (d) {
          return x(d.score);
        })
        .attr('fill', function (d) {
          return barColors[d.candidat];
        });

      bars.exit().remove();

      const figures = results.selectAll('.figure').data(data, function (d) {
        return d.candidat;
      });

      figures.enter()
        .append('text')
        .attr('class', 'figure')
        .attr('dx', 10)
        .attr('dy', '.3em')
        .merge(figures)
        .attr('y', d => y(d.candidat) + y.bandwidth() / 2)
        .text(d => `${percentFormat(d.score)} (${intFormat(d.votes)})`);

      figures.exit().remove();

      statistiques.html(resumeStatistiques(feature.properties.statistiques));
    }

    addListener(draw);

    return elem.node();
  },
  onRemove: function () {

  }
});

export default function(opts) { return new DetailPanel(opts); }