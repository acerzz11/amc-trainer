# AMCtrainer

A simple AMC 10, AMC 12, AIME, USAJMO, USAMO, and IMO practice app, exported from ChatGPT Sites as a self-contained Next.js project for Vercel.

Choose a contest, topic, inclusive year range, and difficulty by problem-number range, then generate one real test problem and check your answer. AMC problem numbers range from 1–25; AIME ranges from 1–15. Ranges combine with the other filters, and the matching-problem count updates immediately. Incorrect answers open the solution automatically. You can also reveal a solution yourself. Switch to **Problem set** to choose one or several contests and topics, year and difficulty ranges, and **1–50 problems**. Mixed contests are balanced where availability permits. Answer AMC questions with radio choices and AIME questions with numeric inputs, then submit all answers once. Blank answers are marked unanswered; the review shows each correct answer and lets you open all available solutions. Sets and answers remain only in page memory. **USAJMO, USAMO, and IMO use proof practice:** draft your reasoning or work on paper, then reveal the published solutions for self-review. Proofs are never automatically graded, and proof drafts are never sent to the grading API. Mixed sets grade only their AMC/AIME questions and show a separate proof-review count. The minimal layout is preserved, without accounts, saved history, statistics, or analytics.

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

1. In Vercel, choose **Add New → Project** and import [acerzz11/amc-trainer](https://github.com/acerzz11/amc-trainer).
2. Use the **Next.js** framework preset and repository root (`./`). Keep the output-directory override disabled; do not set it to `public`, `dist`, or `out`. The included `vercel.json` uses `npm ci` and `npm run build`; `package.json` selects Node.js 24.
3. No environment variables are needed. Configure **Deployment Protection** for the environments you want private before sharing the deployed site. The previous ChatGPT Sites access gate is not part of this source code.
4. Deploy, then check question generation, answer checking, and solutions on the Vercel URL. Future commits to the production branch can deploy through the GitHub integration.

See Vercel's [Next.js guide](https://vercel.com/docs/frameworks/full-stack/nextjs), [GitHub integration](https://vercel.com/docs/git/vercel-for-github), and [Deployment Protection documentation](https://vercel.com/docs/deployment-protection). Deployment Protection coverage depends on your Vercel plan and settings; check production and preview access separately.

The original ChatGPT Sites deployment is separate and is not changed by importing this repository. See [MIGRATION.md](MIGRATION.md) for the migration inventory and cutover checks.

## Problem sources and coverage

- Requests prioritize the public AoPS MediaWiki API. AoPS may block automated requests; when unavailable, the app shows the saved AoPS or LIVE by Po-Shen Loh question, with original diagrams. Solutions fall back to the saved archive, fetch matching Random Math solutions, and include saved publisher alternatives. Every approach is attributed. Live access cannot be guaranteed on Vercel.
- The bundled archive contains **3,949 selected real contest problems from 1972–2026** (1,282 AMC 10, 1,281 AMC 12, 1,064 AIME, 50 USAJMO, 236 USAMO, and 36 IMO), including solutions, answers, and canonical AoPS links. This is not every question from every test. No questions or solutions are AI-generated.
- **3,883 problems** have source-backed topic labels: exact normalized MATH statement matches, plus publisher-authored concepts mapped through LIVE by Po-Shen Loh’s subject taxonomy. Multiple topics may apply to one problem. Arithmetic and statistical averages map to Algebra; probability maps to Combinatorics. Olympiad topics come from HARP’s subject labels and Evan Chen’s published MOHS taxonomy. General reasoning techniques alone do not imply a topic. Topic filters use labeled questions; All topics includes the remaining 66. See `data/publisher-topics.json` for the concept provenance.
- The latest import added 1,831 real problems and enriched 1,767 existing problems from LIVE by Po-Shen Loh. The bank includes 501 bundled diagram files. Original diagram assets are bundled under `public/diagrams/`. Conflicting answer keys and unsupported source formatting are excluded; `data/source-import-report.json` records provenance and exclusions. The earlier archive validation report is retained separately.
- Proof coverage is selected, not complete: USAJMO 2010–2024, USAMO 1972–2023, and IMO 2020–2025. Source identity conflicts and unsupported individual proof approaches are recorded in `data/olympiad-import-report.json`. All 36 IMO problems from 2020–2025 have the complete relevant pages of Evan Chen’s published notes, including original diagrams, bundled as 70 SVG page images under `public/proof-pages/`. AoPS remains the first live source.
- AMC answers accept A–E, case-insensitively. AIME answers accept integers from 0 through 999, with optional leading zeroes. Revealing a solution ends answer entry for that question.
- Question responses omit answers and solutions. The answer bank is bundled with server functions rather than served as a public asset. Publisher HTML and imported SVG assets are sanitized before rendering, and KaTeX trust is disabled.

The original archive comes from [amc2k](https://huggingface.co/datasets/zypchn/amc2k) and [Easy2Hard-Bench](https://huggingface.co/datasets/furonghuang-lab/Easy2Hard-Bench). Topic provenance comes from [competition_math](https://huggingface.co/datasets/qwedsacf/competition_math). Additional solutions and diagrams come from [LIVE by Po-Shen Loh](https://live.poshenloh.com/past-contests); live fallback solutions come from [Random Math](https://wiki.randommath.com). See [NOTICE.md](NOTICE.md) for attribution.

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

The twenty-five core tests cover answer normalization, source identifiers, all twelve contest/topic combinations, HTML sanitation, question/solution separation, rendering every archived question, solution, and choice, mixed set selection, concurrency limits, batch grading, invalid submissions, proof-only endpoint rejection, mixed proof sets, source-page assets, and offline proof solutions. The HTTP smoke check exercises all twelve combinations, correct and incorrect answers, automatic solutions, invalid input, unknown IDs, and absence of answers from question responses. A protected deployment may require opening it in an authenticated browser instead of using the smoke script.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx`, `app/globals.css` | Minimal practice interface |
| `app/api/problem`, `check`, `check-set`, `solution` | Node.js API routes |
| `app/components/ProblemSet.tsx`, `lib/sets.ts` | Custom sets, mixed filters, and batch review |
| `data/publisher-topics.json` | Published concepts supporting broad topic filters |
| `lib/randommath.ts` | Exact-test fallback solution retrieval |
| `lib/contests.ts` | Contest types, proof practice, and problem-number limits |
| `public/proof-pages/`, `data/olympiad-import-report.json` | Exact published IMO solution pages and olympiad provenance |
| `public/diagrams/` | Imported, sanitized original diagram files |
| `data/source-import-report.json` | Publisher and diagram provenance, import exclusions |
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

### Refresh publisher alternatives and diagrams

```sh
node scripts/import-sources.mjs
npm test
```

This optional importer discovers published AMC 10/12/AIME exam pages through the current year on LIVE by Po-Shen Loh. It verifies exam identity, uses the numbered order of the displayed exam, cross-checks existing answer keys, imports the complete published solution, and downloads/sanitizes original diagram assets. It imports all supported problems, including questions without diagrams, and enriches existing questions. Publisher concept labels are mapped to the four topic filters using the published subject taxonomy. Responses are cached in ignored `.cache/sources/` files; remove that cache if intentionally refreshing upstream content. Conflicting keys are quarantined, not silently substituted. Do not run the older archive-rebuild command unless you intend to replace the bank; run this importer afterward to restore publisher alternatives.

The solution viewer displays all solution sections returned by AoPS, including subheadings and diagrams, plus saved alternatives. If AoPS is unavailable, matching Random Math sections are included alongside the complete saved solutions. Some sources publish only one approach; the app does not invent additional solutions or claim exhaustive coverage of every solution on the internet.

### Refresh proof archives

```sh
node scripts/download-olympiads.mjs
python3 scripts/prepare-olympiads.py
node scripts/import-olympiads.mjs
npm test
```

The optional preparation script needs `pypdf` and `pymupdf`. It reads the HARP raw archive and publisher PDF/TeX files from ignored `.cache/` paths, checks real exam identity and page boundaries, imports supported human-written approaches, and exports the exact IMO PDF solution pages. No AI-generated solutions are added. The repository contains everything needed for deployment; these maintenance tools do not run on Vercel.
