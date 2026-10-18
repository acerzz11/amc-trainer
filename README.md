# AMCtrainer

A simple AMC 8, AMC 10, AMC 12, AIME, USAJMO, USAMO, and IMO practice app, exported from ChatGPT Sites as a self-contained Next.js project for Vercel.

Choose a contest, topic, inclusive year range, and difficulty by problem-number range, then generate one real test problem and check your answer. AMC problems range from 1–25; AIME ranges from 1–15. USAJMO/modern USAMO use 1–6; historical IMO papers may include problem 7. Incorrect answers open the solutions automatically; you can also reveal them yourself.

Switch to **Problem set** to choose **exactly one contest**, any combination of topics, year and difficulty ranges, and **1–50 problems**. Each set samples without replacement. Answer AMC questions with radio choices and AIME questions with numeric inputs, then submit all answers once. Blank answers are marked unanswered; the review shows each correct answer and lets you open all available solutions. USAJMO, USAMO, and IMO use optional proof drafts and published solutions for self-review; proofs are never automatically graded. Sets and drafts remain only in page memory. There are no accounts, saved history, statistics, or analytics.

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
- The bundled archive contains **5,491 real contest problems from 1959–2026**, with published solutions and canonical AoPS links. No questions or solutions are AI-generated.

  | Contest | Problems | Years |
  | --- | ---: | --- |
  | AMC 8 / AJHSME | 1,025 | 1985–2026, no 2021 exam |
  | AMC 10 | 1,299 | 2000–2025 |
  | AMC 12 | 1,298 | 2000–2025 |
  | AIME | 1,064 | 1983–2026 |
  | USAJMO | 102 | 2010–2026 |
  | USAMO | 306 | 1972–2026 |
  | IMO | 397 | 1959–2025, no 1980 contest |

- **Every included problem is categorized.** Labels combine exact normalized MATH statement matches, LIVE by Po-Shen Loh's published subject concepts, HARP subjects, Evan Chen's MOHS table, and 365 additional editorial classifications reviewed from statements and available solutions. Editorial labels are explicitly identified in `data/topic-review.json`; they are not represented as publisher-provided tags. Multiple topics may apply. Arithmetic and averages map to Algebra; probability and discrete logic map to Combinatorics.
- AMC 8 includes its AJHSME predecessor (1985–1998). The bank includes all archived papers in that range and all USAJMO/USAMO papers through 2026. Historical USAMO papers from 1972–1995 have five problems. Earlier AHSME papers are not relabeled as AMC 12.
- The latest publisher refresh restored 34 AMC 10/12 questions with mixed prose/math answer choices, added 1,025 AMC 8 questions, and preserves original diagrams in both questions and choices. `data/source-import-report.json` records source and diagram provenance.
- The olympiad expansion includes John Scholes's historical solutions (academic mirror), HARP AoPS approaches, and **731 exact published solution-page SVGs** from Evan Chen's USAJMO, USAMO, and IMO notes. These retain original diagrams. All available supported alternatives are kept and displayed in a scrollable viewer. See `data/olympiad-import-report.json` for page mappings, historical images, and exclusions.
- Coverage is broad but not exhaustive. Missing objective questions are 2012 AMC 12B #12, 2018 AMC 12A #2, 2015 AMC 10A #20, and 2022 AIME II #8, due to unsupported formatting or earlier source-key quarantine. The original 2015 AMC 10A #20 was flawed; it is not silently graded using a corrected version. 1970 IMO #1 is excluded because its archived solution diagram is unavailable. The indexed 2026 IMO notes were unavailable when refreshed. Unavailable individual approaches and source-identity conflicts are recorded in the import reports.
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

The 27 core tests cover all 28 contest/topic combinations, complete categorization and provenance, rendering every archived question/solution/choice, original diagram safety, strict answer normalization, single-contest selection, mixed-contest rejection, batch grading, proof self-review, and offline solutions. The HTTP smoke check exercises every contest/topic combination, answer checking, solution delivery, image HTTP delivery, invalid input, and answer privacy. A protected deployment may require opening it in an authenticated browser instead of using the smoke script.

## Project layout

| Path | Purpose |
| --- | --- |
| `app/page.tsx`, `app/globals.css` | Minimal practice interface |
| `app/api/problem`, `check`, `check-set`, `solution` | Node.js API routes |
| `app/components/ProblemSet.tsx`, `lib/sets.ts` | Single-contest custom sets, topic combinations, and batch review |
| `data/publisher-topics.json` | Published concepts supporting broad topic filters |
| `lib/randommath.ts` | Exact-test fallback solution retrieval |
| `lib/contests.ts` | Contest types, proof practice, and problem-number limits |
| `public/proof-pages/`, `data/olympiad-import-report.json` | Exact published olympiad solution pages and provenance |
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
node scripts/apply-topic-review.mjs
npm run data:validate
npm test
```

This optional importer discovers published AMC 8/10/12/AIME exam pages through the current year on LIVE by Po-Shen Loh. It verifies exam identity, uses the numbered order of the displayed exam, cross-checks existing answer keys, imports the complete published solution, and downloads/sanitizes original diagram assets. It imports all supported problems, including questions without diagrams, and enriches existing questions. Publisher concept labels are mapped to the four topic filters using the published subject taxonomy. Responses are cached in ignored `.cache/sources/` files; remove that cache if intentionally refreshing upstream content. Conflicting keys are quarantined, not silently substituted. Do not run the older archive-rebuild command unless you intend to replace the bank; run this importer afterward to restore publisher alternatives.

The solution viewer displays all solution sections returned by AoPS, including subheadings and diagrams, plus saved alternatives. If AoPS is unavailable, matching Random Math sections are included alongside the complete saved solutions. Some sources publish only one approach; the app does not invent additional solutions or claim exhaustive coverage of every solution on the internet.

### Refresh proof archives

```sh
node scripts/download-olympiads.mjs
python3 scripts/prepare-olympiads.py
node scripts/import-kalva.mjs
node scripts/import-olympiads.mjs
node scripts/apply-topic-review.mjs
npm run data:validate
npm test
```

The optional preparation script needs `pypdf` and `pymupdf`. It reads the HARP raw archive and publisher PDF/TeX files from ignored `.cache/` paths, checks real exam identity and page boundaries, imports supported human-written approaches, and exports the exact published PDF solution pages. The historical importer checks source identities and embeds original image bytes in self-contained SVGs. Review `data/topic-review.json` when adding previously unseen problems. Source-page SVGs may be optimized with SVGO (`--multipass --precision=3`) to reduce deployment size while preserving their content. No AI-generated solutions are added. The repository contains everything needed for deployment; these maintenance tools do not run on Vercel.
