import {scaleLinear, scaleBand} from 'd3-scale';
import {select} from 'd3-selection';
import {Observable} from 'rxjs/Observable';

import {percentFormat, intFormat, nuanceColors} from './config';

import './details.css';

const maxBarWidth = 80;

function nomBureau(d) {
  return `Bureau n°${d.bureau}`;
}

function toTitleCase(str) {
  return str.replace(/\w(\S|[-])*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
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
      .attr('class', 'toggle');

    if (L.Browser.mobile) {
      this.toggleButton
        .on('touchstart', () => this.toggle(false))
        .on('touchend', () => this.toggle(true));
      setTimeout(() => this.toggle(true), 0);
    } else {
      this.toggleButton
        .on('click', () => this.toggle());
      this.toggle(false);
    }

    elem.attr('class', 'details');

    const title = elem.append('h2').text('');

    const noDataMessage = elem.append('div')
      .attr('class', 'hide')
      .text('Pas de scrutin');

    const table = elem.append('table').attr('class', 'hide');

    table.append('caption').text("Scores des candidats en % des exprimés, de l'abstention en % des inscrits");

    const header = table.append('thead').append('tr');

    [
      ['nuance', ''],
      ['candidat', 'Candidat'],
      ['votes', 'Voix'],
      ['pourcentage', '%'],
      ['bar', '']
    ].map(([c, l]) => {
      header.append('th')
        .text(l)
        .attr('class', c);
    });

    const tbody = table.append('tbody');

    const x = scaleLinear().rangeRound([0, maxBarWidth]);

    function draw([bureau, scrutin]) {
      title.text(nomBureau(bureau));

      if (bureau[scrutin] === null) {
        table.classed('hide', true);
        noDataMessage.classed('hide', false);
        return;
      }

      noDataMessage.classed('hide', true);
      table.classed('hide', false);

      const resultats = bureau[scrutin];
      const candidats = resultats.candidats.slice(0, 8);

      const data = candidats.map(c => ({
        id: `${c.nuance}/${c.nom}/${c.prenom}`,
        label: toTitleCase(c.nom),
        pourcentage: percentFormat(c.voix / resultats.exprimes),
        votes: intFormat(c.voix),
        score: c.voix / resultats.exprimes,
        nuance: c.nuance
      }));

      const abstention = resultats.inscrits - resultats.votants;
      const abstentionInscrits = abstention / resultats.inscrits;
      const abstentionExprimes = abstention / resultats.exprimes;

      data.push({
        id: 'abstention',
        label: '-',
        pourcentage: percentFormat(abstentionInscrits),
        votes: intFormat(abstention),
        score: abstentionExprimes,
        nuance: 'Abstention'
      });

      x.domain([0, Math.max(0.25, data[0].score, abstentionExprimes)]);

      const lignes = tbody.selectAll('tr').data(data, d => d.id);

      // enter phase
      const lignesEnter = lignes.enter()
        .append('tr')
        .attr('class', d => d.nuance);

      lignesEnter.append('th')
        .text(d => d.nuance)
        .attr('class', 'nuance')
        .style('color', d => nuanceColors[d.nuance]);
      lignesEnter.append('td').text(d => d.label).attr('class', 'candidat');
      lignesEnter.append('td').attr('class', 'votes');
      lignesEnter.append('td').attr('class', 'pourcentage');
      lignesEnter.append('td').append('div').attr('class', 'bar');

      const lignesUpdate = lignesEnter.merge(lignes).order();

      lignesUpdate.select('.votes').text(d => d.votes);
      lignesUpdate.select('.pourcentage').text(d => d.pourcentage);
      lignesUpdate.select('.bar')
        .style('width', d => x(d.score) + 'px')
        .style('background-color', d => nuanceColors[d.nuance]);

      lignes.exit().remove();
    }

    this.subscription = Observable
      .combineLatest(this.bureauObservable, this.scrutinObservable)
      .subscribe(draw);

    return elem.node();
  },

  toggle(hide) {
    hide = hide === undefined ? !this.elem.classed('hide') : hide;
    this.elem
      .classed('hide', hide);
    this.toggleButton.text(hide ? "<<" : ">>");
  },

  onRemove: function () {
    this.subscription.unsubscribe();
  }
});

export default function (scrutinObservable, bureauObservable, options) {
  return new DetailPanel(scrutinObservable, bureauObservable, options);
}
