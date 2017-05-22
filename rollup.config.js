import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import css from 'rollup-plugin-css-only';
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';
import liveReload from 'rollup-plugin-livereload';

const plugins = [
  css({
    output: './dist/style.css'
  }),
  json(),
  resolve(),
  babel({
    exclude: 'node_modules/**'
  }),
];

if (process.env.serve === 'true') {
  plugins.push(
    serve('dist'),
    liveReload()
  );
}

export default {
  entry: 'src/main.js',
  format: 'iife',
  plugins,
  dest: 'dist/bundle.js',
  moduleName: 'melencarte'
};
