import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['scripts/import-sources.ts'],bundle:true,platform:'node',format:'esm',outfile:'.cache/import-sources.mjs',packages:'external'});
const result=spawnSync(process.execPath,['.cache/import-sources.mjs'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
