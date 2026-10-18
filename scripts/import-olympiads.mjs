import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['scripts/import-olympiads.ts'],bundle:true,platform:'node',format:'esm',outfile:'.cache/import-olympiads.mjs',packages:'external'});
const r=spawnSync(process.execPath,['.cache/import-olympiads.mjs'],{stdio:'inherit'});if(r.error)throw r.error;process.exitCode=r.status??1;
