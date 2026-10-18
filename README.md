# AMCtrainer

Practice AMC 8, AMC 10, AMC 12, AIME, USAJMO, USAMO, and IMO problems.

[Open AMCtrainer](https://trainamc.vercel.app)

Pick a contest and get a random problem, or make a problem set. You can filter by topic, year, and problem number. Each set uses one contest.

AMC and AIME answers are checked automatically. For olympiad problems, work through a proof and compare it with the published solutions. Diagrams and solutions are included when available.

No account needed. Your answers aren't saved.

## Run locally

Use Node.js 24.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Deploy

Import this repo into Vercel and use the default Next.js settings. Leave the root directory at `./` and the output directory at its default. No API keys or environment variables are needed.

See [VERCEL.md](VERCEL.md) if you need help setting it up.

## Problems and solutions

The app has 5,491 problems, all sorted by topic. It tries AoPS first and uses saved copies and other archives when AoPS isn't available.

Sources include AoPS, LIVE by Po-Shen Loh, Random Math, Evan Chen, and John Scholes. See [NOTICE.md](NOTICE.md) for credits and [DATA.md](DATA.md) for coverage and missing problems.

## Tests

```sh
npm test
```
