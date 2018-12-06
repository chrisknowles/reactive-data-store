import babel from 'rollup-plugin-babel';

export default {
  input: 'src/store.js',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs'
    },
    {
      file: 'dist/store.js',
      name: 'ReactiveDataStore',
      format: 'umd'
    }
  ],
  plugins: [
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
