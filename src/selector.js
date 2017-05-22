import {select} from 'd3-selection';

import metrics from './metrics';
import './selector.css';

const Selector = L.Control.extend({
  onAdd: function (map) {
    const div = select(L.DomUtil.create('div'));
    div.attr('class', 'selector');

    let options = div.selectAll('.option').data(metrics).enter()
      .append('div')
      .attr('class', 'option');

    const inputs = options.append('input')
      .attr('type', 'radio')
      .property('checked', (d, i) => i === 0)
      .attr('name', 'metric')
      .attr('id', d => `option-${d.key}`)
      .on('click', emit);

    const labels = options.append('label')
      .attr('for', d => `option-${d.key}`)
      .text(d => d.label);

    return div.node();
  },
  onRemove: function () {

  }
});

export default function (opts) {
  return new Selector(opts);
}

const listeners = [];
let last = metrics[0];

function emit(d) {
  last = d;

  for (let listener of listeners) {
    listener(d);
  }
}

export function addListener(listener) {
  listeners.push(listener);
  setTimeout(function () {
    listener(last);
  }, 0);
}

export function removeListener(listener) {
  if (!(listener in listeners)) {
    return;
  }
  listeners.splice(listeners.indexOf(listener), 1);
}
