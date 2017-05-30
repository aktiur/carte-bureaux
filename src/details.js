import {scaleLinear, scaleBand} from 'd3-scale';
import {axisLeft, axisBottom} from 'd3-axis';
import {select} from 'd3-selection';
import {percentFormat, intFormat} from './config';
import {addListener, removeListener} from './carte';

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
  'MACRON': '#ffc600',
  'Abstention': '#120958'
};

const width = 280, height = 300;
const labelsWidth = 80, scaleHeight = 20;
const rightMargin = 20;

function nomBureau(d) {
  return `Bureau n°${d.properties.bureau}`;
}

const DetailPanel = L.Control.extend({
  onAdd: function () {
    const elem = this.elem = select(L.DomUtil.create('div'));
    this.toggleButton = elem.append('button')
      .attr('class', 'toggle')
      .text('>>')
      .on('click', () => this.toggle());

    elem.attr('class', 'details');

    const title = elem.append('h2').text('Détails...');

    const graph = elem.append('svg')
      .attr('width', width + labelsWidth + rightMargin)
      .attr('height', height + scaleHeight);

    const results = graph.append('g')
      .attr('transform', `translate(${labelsWidth},0)`);

    const labels = results.append('g')
      .attr('class', 'axis axis--y');

    const axis = results.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${height})`);

    const x = scaleLinear().rangeRound([0, width]);
    const y = scaleBand().rangeRound([0, height]).padding(0.1);

    this.draw = function draw(feature) {
      title.text(nomBureau(feature));

      const votes = feature.properties.votes;
      const exprimes = feature.properties.statistiques.exprimes;

      const candidats = Object.keys(votes).sort(function (a, b) {
        return votes[a] - votes[b];
      }).reverse().slice(0, 5);

      const barData = candidats.map(function (c) {
        return {candidat: c, score: votes[c] / exprimes, votes: votes[c]};
      });

      const abstentionExprimes = feature.properties.statistiques.abstentions / feature.properties.statistiques.exprimes;
      const correctifAbstention = feature.properties.statistiques.exprimes / feature.properties.statistiques.inscrits;

      barData.push({
        candidat: 'Abstention',
        score: abstentionExprimes,
        votes: feature.properties.statistiques.abstentions
      });

      y.domain(barData.map(d => d.candidat));
      x.domain([0, Math.max(0.25, barData[0].score, abstentionExprimes)]);

      labels.call(axisLeft(y));
      axis.call(axisBottom(x).ticks(5, '%'));

      const bars = results.selectAll('.bar').data(barData, function (d) {
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

      const figures = results.selectAll('.figure').data(barData, function (d) {
        return d.candidat;
      });

      figures.enter()
        .append('text')
        .attr('class', 'figure')
        .attr('dx', 10)
        .attr('dy', '.3em')
        .merge(figures)
        .text(d => {
          if (d.candidat === 'Abstention')
            return `${percentFormat(d.score * correctifAbstention)} ins. (${intFormat(d.votes)})`;
          return `${percentFormat(d.score)} (${intFormat(d.votes)})`;
        })
        .attr('y', d => y(d.candidat) + y.bandwidth() / 2)
        .attr('x', function (d) {
          if (this.getBBox().width + 10 > x(d.score)) {
            return x(d.score);
          }
          return 0;
        })
        .classed('out', function (d) {
          return this.getBBox().width + 10 > x(d.score);
        });

      figures.exit().remove();
    };

    addListener(this.draw);

    return elem.node();
  },

  toggle() {
    const state = this.elem.classed('hide');
    this.elem
      .classed('hide', !this.elem.classed('hide'));
    this.toggleButton.text(state ? ">>" : "<<");
  },

  onRemove: function () {
    removeListener(this.draw);
  }
});

export default function (opts) {
  return new DetailPanel(opts);
}