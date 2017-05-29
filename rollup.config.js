import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import css from 'rollup-plugin-css-only';
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';
import liveReload from 'rollup-plugin-livereload';
import uglify from 'rollup-plugin-uglify';

const plugins = [
  css({
    output: './dist/style.css'
  }),
  json(),
  resolve(),
  babel({
    exclude: 'node_modules/**'
  }),
  commonjs()
];

if (process.env.serve === 'true') {
  plugins.push(
    serve('dist'),
    liveReload()
  );
} else {
  plugins.push(uglify());
}

export default {
  entry: 'src/main.js',
  format: 'iife',
  plugins,
  dest: 'dist/bundle.js',
  moduleName: 'melencarte'
};
