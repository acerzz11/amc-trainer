# AMCtrainer

A simple AMC 10, AMC 12, and AIME practice app, exported from ChatGPT Sites as a self-contained Next.js project for Vercel.

Choose a contest and topic, generate one real test problem, and check your answer. Incorrect answers open the solution automatically. You can also reveal a solution yourself. The existing minimal layout is preserved, without accounts, saved history, statistics, or analytics.

## Run locally

Use **Node.js 24** and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No environment variables, API keys, database setup, or ChatGPT connection are required.

For a production build:

```sh
npm run build
npm start
```

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import [aidencwang-cmyk/amc-trainer](https://github.com/aidencwang-cmyk/amc-trainer).
2. Use the **Next.js** framework preset and repository root (`./`). Keep the default output directory. The included `vercel.json` uses `npm ci` and `npm run build`; `package.json` selects Node.js 24.
3. No environment variables are needed. Configure **Deployment Protection** for the environments you want private before sharing the deployed site. The previous ChatGPT Sites access gate is not part of this source code.
4. Deploy, then check question generation, answer checking, and solutions on the Vercel URL. Future commits to the production branch can deploy through the GitHub integration.

See Vercel's [Next.js guide](https://vercel.com/docs/frameworks/full-stack/nextjs), [GitHub integration](https://vercel.com/docs/git/vercel-for-github), and [Deployment Protection documentation](https://vercel.com/docs/deployment-protection). Deployment Protection coverage depends on your Vercel plan and settings; check production and preview access separately.

The original ChatGPT Sites deployment is separate and is not changed by importing this repository. See [MIGRATION.md](MIGRATION.md) for the migration inventory and cutover checks.

## Problem sources and coverage

- Requests attempt the public AoPS MediaWiki API on the server. AoPS may block automated requests; when it is unavailable, the app clearly labels its archived problems and solutions. Live access cannot be guaranteed on Vercel.
- The bundled archive contains **1,411 selected real contest problems from 2000–2024**, including solutions, answers, and canonical AoPS links. This is not every question from every test. No questions or solutions are AI-generated.
- **181 problems** have topic labels supported by exact normalized statement matches against the MATH dataset. Topic filters use only these labeled questions; All topics includes the rest. Combinatorics includes probability.
- Questions requiring unavailable diagrams, ambiguous or disputed answer keys, or invalid TeX are excluded. Source and validation records are included under `data/`.
- AMC answers accept A–E, case-insensitively. AIME answers accept integers from 0 through 999, with optional leading zeroes. Revealing a solution ends answer entry for that question.
- Question responses omit answers and solutions. The answer bank is bundled with server functions rather than served as a public asset. AoPS HTML is sanitized before rendering, and KaTeX trust is disabled.

The archive comes from [amc2k](https://huggingface.co/datasets/zypchn/amc2k) and [Easy2Hard-Bench](https://huggingface.co/datasets/furonghuang-lab/Easy2Hard-Bench). Topic provenance comes from [competition_math](https://huggingface.co/datasets/qwedsacf/competition_math). See [NOTICE.md](NOTICE.md) for attribution.

## Checks

```sh
npm test
npm run build
npm run typecheck
```

With the development or production server running in another terminal:

```sh
npm run test:smoke
# To check another deployment:
BASE_URL=https://your-project.vercel.app npm run test:smoke
```

The eight core tests cover answer normalization, source identifiers, all twelve contest/topic combinations, HTML sanitation, question/solution separation, and rendering every archived question, solution, and choice. The HTTP smoke check exercises all twelve combinations, correct and incorrect answers, automatic solutions, invalid input, unknown IDs, and absence of answers from question responses. A protected deployment may require opening it in an authenticated browser instead of using the smoke script.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx`, `app/globals.css` | Minimal practice interface |
| `app/api/problem`, `check`, `solution` | Node.js API routes |
| `lib/aops.ts` | Live AoPS fetches with a timeout and temporary cache |
| `lib/render.ts` | HTML sanitation and KaTeX rendering |
| `lib/problems.ts` | Archive fallback and grading |
| `data/problems.json` | Server-side problem, answer, and solution bank |
| `public/catalog.json` | Public filter metadata, without answers or solutions |
| `data/topic-provenance.json` | Records supporting topic labels |
| `data/validation-report.json` | Source/rendering exclusions |

## Optional data maintenance

The checked-in data is enough to install, build, and run. Regeneration is not part of deployment and requires separately obtained source inputs; it does not download them automatically.

```sh
python3 scripts/prepare-bank.py --input-dir /path/to/source-inputs
npm run data:validate
npm test
```

The input directory must contain `amc2k.json` and `e2h-amc.json` arrays in their upstream dataset schemas, plus `amc-topic-tags.json` using the structure of `data/topic-provenance.json`. The preparation script rebuilds the bank and public catalog. The validation script repairs supported source formatting, omits invalid TeX entries, and rewrites the bank, catalog, and validation report. Review these changes before committing them.
