import {build} from 'esbuild';import {spawnSync} from 'node:child_process';
await build({entryPoints:['tests/core.test.ts'],outfile:'.cache/tests.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,['--test','.cache/tests.mjs'],{stdio:'inherit'});if (result.error) throw result.error;
process.exitCode=result.status ?? 1;
