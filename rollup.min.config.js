import babel from 'rollup-plugin-babel';
import butternut from 'rollup-plugin-butternut';

export default {
  input: 'src/store.js',
  output: [
    {
      file: 'dist/store.min.js',
      name: 'store',
      format: 'umd',
      sourcemap: true
    }
  ],
  plugins: [
    butternut(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
