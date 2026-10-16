# ChatGPT Sites → Vercel migration

## Migration inventory

The original site was inspected on October 16, 2026. Its app data and interface are included in this repository.

| Feature | Original implementation | Migration action |
| --- | --- | --- |
| Database | No active database; Sites hosting configuration has no D1 binding | None. Unused starter database/Drizzle scaffolding is excluded. |
| File/object storage | No uploads or R2 binding | None. The checked-in problem bank, catalog, favicon, and CSS are included. |
| Authentication | No application accounts or login code in use. ChatGPT Sites restricts access to the owner through its hosting access gate. | Configure Vercel Deployment Protection if the new deployment must remain private. There are no user accounts, passwords, or sessions to export. |
| Statistics, profiles, history | Not stored | None. The in-memory set used to reduce repeated questions clears on reload. |
| Server APIs | Problem lookup, answer checking, and solution retrieval | Converted to standard Next.js Node.js routes under `app/api`. |
| AoPS integration | Public MediaWiki API with a sourced local fallback | Preserved. No token or connector is required; live access remains subject to AoPS availability. |
| Cache | Best-effort, process-local cache of AoPS pages | Preserved. Vercel instances may start cold or use different caches; no correctness depends on persistence. |
| Environment variables/secrets | None used by the trainer | None required. No Sites tokens or hosting credentials are included. |
| Scheduled tasks | No configured automations | None. |
| Hosting | Sites/Vinext/Cloudflare build and authentication scaffolding | Replaced with Next.js, `vercel.json`, a lockfile, and Node.js 24 configuration. |
| Domain | A ChatGPT Sites subdomain | Vercel creates a new deployment URL. The Sites-owned subdomain is not transferred by exporting source. An owned custom domain can be configured separately. |

## What is preserved

- The AMCtrainer name and current simple responsive interface.
- One random problem at a time, with AMC 10 / AMC 12 / AIME and topic filters.
- Answer checking, optional solution reveal, and automatic solutions after incorrect answers.
- The complete existing 1,411-question archive and verified topic metadata.
- Live AoPS requests, source links, and clear archive labels when AoPS cannot be fetched.
- No profiles, persistent history, saved statistics, or analytics.

## Cutover checklist

1. Import this GitHub repository into Vercel using the Next.js preset, repository root, and Node.js 24.
2. Set the desired access policy. The old site's private access does not migrate automatically, and a private GitHub repository by itself would not make a Vercel deployment private. See [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection).
3. Deploy and verify the homepage plus all three API routes. Test each contest, a topic filter, a correct answer, an incorrect answer, and Show solution. Check the page on a small screen.
4. Confirm that AoPS requests either succeed live or produce the labeled archive fallback. This migration cannot guarantee that AoPS will permit server requests from Vercel.
5. Share or update links only after checking the access settings. Keep the original Sites deployment available until satisfied with the new deployment.

There is no database export/import or data synchronization step. The original Sites deployment was not modified or removed by the source export.

## Reproducibility

`package-lock.json` pins dependencies. `npm ci`, `npm test`, `npm run build`, and `npm run typecheck` validate a fresh checkout. `npm run test:smoke` checks a running deployment. The project has no dependency on the original local folder, `/tmp` research files, a ChatGPT session, or a Sites runtime.

Node.js 24 is selected through `package.json`; see [Vercel's supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). Standard Next.js hosting is described in [Vercel's Next.js documentation](https://vercel.com/docs/frameworks/full-stack/nextjs).
