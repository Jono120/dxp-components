// Build process
const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

const esbuildOptions = {
  outdir: 'dist',
  bundle: true,
  minify: false,
  treeShaking: true,
};

// Server build
esbuild
  .build({
    ...esbuildOptions,
    platform: 'node',
    entryPoints: ['./main.js'],
    format: 'cjs',
    target: 'node16',
  })
  .catch(() => process.exit(1));

// Client Build
esbuild
  .build({
    ...esbuildOptions,
    platform: 'browser',
    entryPoints: ['./static/default.js', './static/default.scss'],
    format: 'esm',
    target: 'es2020',
    plugins: [
      sassPlugin({
        async transform(source) {
          const { css } = await postcss([autoprefixer]).process(source);
          return css;
        },
      }),
    ],
  })
  .then(() => console.log('⚡ Styles & Scripts Compiled! ⚡ '))
  .catch(() => process.exit(1));
