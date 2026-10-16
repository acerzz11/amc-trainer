import {build} from 'esbuild';
await build({entryPoints:['scripts/finalize-bank.ts'],outfile:'.cache/finalize-bank.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
await import('../.cache/finalize-bank.mjs');
