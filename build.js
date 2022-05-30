var fs = require('fs');
var sass = require('sass');
var result = sass.compile('./grid/_index.scss');
fs.writeFileSync('./grid/dist.css', result.css);

const esbuild = require('esbuild');

// Automatically exclude all node_modules from the bundled version
const { nodeExternalsPlugin } = require('esbuild-node-externals');

esbuild
  .build({
    entryPoints: ['./index.ts'],
    outfile: 'dist/grid.js',
    bundle: true,
    minify: true,
    platform: 'browser',
    format: 'esm',
    // sourcemap: true,
    target: 'es2020',
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
