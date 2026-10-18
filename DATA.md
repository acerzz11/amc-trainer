# Problem bank

There are 5,491 problems in the app:

| Contest | Problems | Years |
| --- | ---: | --- |
| AMC 8 / AJHSME | 1,025 | 1985–2026 |
| AMC 10 | 1,299 | 2000–2025 |
| AMC 12 | 1,298 | 2000–2025 |
| AIME | 1,064 | 1983–2026 |
| USAJMO | 102 | 2010–2026 |
| USAMO | 306 | 1972–2026 |
| IMO | 397 | 1959–2025 |

AMC 8 includes AJHSME, its earlier name. There was no AMC 8 in 2021 or IMO in 1980. Older USAMO papers have five problems, and some older IMO papers have seven.

All problems have at least one topic. Labels come from source subject tags, published concepts, matched statements, and manual review. The 365 labels added through editorial review are listed separately in `data/topic-review.json`.

## Missing problems

These questions were left out because of source formatting, conflicting answer keys, or a missing diagram:

- 2012 AMC 12B #12
- 2018 AMC 12A #2
- 2015 AMC 10A #20 (the original question was flawed)
- 2022 AIME II #8
- 1970 IMO #1

The 2026 IMO notes were unavailable at the last import. The app doesn't include older AHSME papers under AMC 12.

## Sources

AoPS is the first source. If it can't be reached, the app uses saved content and matching solutions from other archives. Some problems have one published approach; others have several. The viewer shows the approaches available from those sources.

Original figures are kept with the problems and solutions. The bank also includes 731 solution pages from Evan Chen's published notes. Source links and import details are recorded in `data/source-import-report.json` and `data/olympiad-import-report.json`. Full credits are in [NOTICE.md](NOTICE.md).

## Updating the bank

These scripts are for maintaining the data. You don't need to run them to use or deploy the app. They download source material and may take a while.

For AMC and AIME:

```sh
node scripts/import-sources.mjs
node scripts/apply-topic-review.mjs
npm run data:validate
npm test
```

For olympiad problems:

```sh
node scripts/download-olympiads.mjs
python3 scripts/prepare-olympiads.py
node scripts/import-kalva.mjs
node scripts/import-olympiads.mjs
node scripts/apply-topic-review.mjs
npm run data:validate
npm test
```

The Python script needs `pypdf` and `pymupdf`. Downloads are cached in `.cache/`. Check the import reports, review topics for new problems, and inspect any changed diagrams before committing. Exported SVG pages can be made smaller with SVGO using `--multipass --precision=3`.

The older `prepare-bank.py` script rebuilds the bank from the original datasets. Only use it if you intend to replace the current bank. It needs `amc2k.json`, `e2h-amc.json`, and `amc-topic-tags.json` in its input directory; run the publisher import scripts afterward to restore their additions.
