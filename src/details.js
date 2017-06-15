import {scaleLinear, scaleBand} from 'd3-scale';
import {axisLeft, axisBottom} from 'd3-axis';
import {select} from 'd3-selection';
import {Observable} from 'rxjs/Observable';

import {percentFormat, intFormat, nuanceColors} from './config';

import './details.css';

const width = 260, height = 260;
const labelsWidth = 120;
const rightMargin = 20;

function nomBureau(d) {
  return `Bureau n°${d.bureau}`;
}

function toTitleCase(str)
{
    return str.replace(/\w(\S|[-])*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

const DetailPanel = L.Control.extend({
  initialize: function (scrutinObservable, bureauObservable, options) {
    L.Util.setOptions(this, options);

    this.scrutinObservable = scrutinObservable;
    this.bureauObservable = bureauObservable;
  },
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
      .attr('height', height);

    const results = graph.append('g')
      .attr('transform', `translate(${labelsWidth},0)`);

    const labels = results.append('g')
      .attr('class', 'axis axis--y');

    const x = scaleLinear().rangeRound([0, width]);
    const y = scaleBand().rangeRound([0, height]).padding(0.1);

    function draw([bureau, scrutin]) {
      title.text(nomBureau(bureau));

      const resultats = bureau[scrutin];
      const candidats = resultats.candidats.slice(0, 5);

      const barData = candidats.map(c => ({
        id: `${c.nuance}/${c.nom}/${c.prenom}`,
        label: toTitleCase(c.nom),
        score: c.voix / resultats.exprimes,
        votes: c.voix,
        nuance: c.nuance
      }));

      const abstentionExprimes = (resultats.inscrits - resultats.votants) / resultats.exprimes;
      const correctifAbstention = resultats.exprimes / resultats.inscrits;

      barData.push({
        id: 'abstention',
        label: '% inscrits',
        score: abstentionExprimes,
        votes: resultats.inscrits - resultats.votants,
        nuance: 'Abstention'
      });

      y.domain(barData.map(d => d.id));
      x.domain([0, Math.max(0.25, barData[0].score, abstentionExprimes)]);

      const bars = results.selectAll('.bar').data(barData, d => d.id);

      bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .merge(bars)
        .attr('y', function (d) {
          return y(d.id);
        })
        .attr('height', y.bandwidth())
        .attr('width', function (d) {
          return x(d.score);
        })
        .attr('fill', function (d) {
          return nuanceColors[d.nuance];
        });

      bars.exit().remove();

      const names = labels.selectAll('.name').data(barData,d => d.id);

      names.enter()
        .append('text')
        .attr('class', 'name')
        .attr('x', -10)
        .merge(names)
        .attr('y', d => y(d.id) + 0.75 * y.bandwidth())
        .attr('dy', '.3em')
        .text(d => d.label);

      names.exit()
        .remove();

      const nuances = labels.selectAll('.nuance').data(barData, d => d.id);

      nuances.enter()
        .append('text')
        .attr('class', 'nuance')
        .attr('x', -10)
        .merge(nuances)
        .attr('y', d => y(d.id) + 0.25 * y.bandwidth())
        .attr('dy', '.3em')
        .text(d => d.nuance);

      nuances.exit()
        .remove();

      const figures = results.selectAll('.figure').data(barData, d => d.id);

      figures.enter()
        .append('text')
        .attr('class', 'figure')
        .attr('dx', 10)
        .attr('dy', '.3em')
        .merge(figures)
        .text(d => {
          return `${percentFormat(d.id === 'abstention' ? d.score * correctifAbstention : d.score)} (${intFormat(d.votes)})`;
        })
        .attr('y', d => y(d.id) + y.bandwidth() / 2)
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
    }

    this.subscription = Observable
      .combineLatest(this.bureauObservable, this.scrutinObservable)
      .subscribe(draw);

    return elem.node();
  },

  toggle() {
    const state = this.elem.classed('hide');
    this.elem
      .classed('hide', !this.elem.classed('hide'));
    this.toggleButton.text(state ? ">>" : "<<");
  },

  onRemove: function () {
    this.subscription.unsubscribe();
  }
});

export default function (scrutinObservable, bureauObservable, options) {
  return new DetailPanel(scrutinObservable, bureauObservable, options);
}
