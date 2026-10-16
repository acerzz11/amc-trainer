# Deploy AMCtrainer

Import **https://github.com/acerzz11/amc-trainer** in [Vercel New Project](https://vercel.com/new). If it is missing from the list, grant the Vercel GitHub integration access to this repository under your renamed account.

Use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `./` (the folder containing `package.json`) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave override **disabled** |
| Node.js | 24.x |
| Environment Variables | None |
| Production Branch | main |

Click **Deploy**, wait for **Ready**, and open the URL using **Visit** on that deployment. The homepage is `/`; no redirect or rewrite is needed.

## If you see a 404

1. In the deployment's **Source** view, confirm that `package.json`, `app/page.tsx`, and `vercel.json` exist at the project root. A README-only repository or a ZIP file committed without extracting its contents cannot run the app.
2. Check the project's build settings against the table above. Do not use the Other framework preset or set the output folder to `public`, `dist`, or `out`.
3. Create a new deployment from the latest `main` commit after correcting settings. Changing repository files does not repair an older deployment URL.
4. First test the URL shown by **Visit** on the successful deployment. If that works but your custom domain does not, check that the domain is assigned to this Vercel project and its current production deployment.
5. When importing a ZIP manually, extract it first and put its contents at the repository root. This project's source ZIP contains `package.json` directly at its top level, without an extra enclosing folder.

See Vercel's [404 troubleshooting guide](https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404) and [deployment-not-found explanation](https://vercel.com/docs/errors/deployment_not_found).

## Access and data

No database, object storage, user accounts, or environment secrets need migration. The problem bank is bundled. If you want private website access, configure Vercel Deployment Protection; repository privacy alone does not protect the website. Details are in [MIGRATION.md](MIGRATION.md).
