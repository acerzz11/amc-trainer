import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
await build({entryPoints:['scripts/repair-source-formatting.ts'],bundle:true,platform:'node',format:'esm',outfile:'.cache/repair-source-formatting.mjs',packages:'external'});
const result=spawnSync(process.execPath,['.cache/repair-source-formatting.mjs'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
