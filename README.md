# QA Engineer Assignment

This repository contains the deliverables for the requested QA assignment, split into three parts:

- `part1/` — exploratory testing notes and a bug report
- `part2/` — Playwright end-to-end test suite with page objects and README
- `part3/` — AI-augmented validation script that uses Playwright plus an LLM judge

## Important note on live validation

The project includes a real browser automation flow, but in this environment the live Trupeer login is currently blocked by an email-verification/auth gate before the dashboard loads. That means the app can be opened and the auth step observed, but it does not reach the authenticated dashboard state needed for the full E2E editor flow here.

The included scripts therefore support both:

- live execution when a valid session and compatible browser runtime are available, and
- mock-mode execution for reproducible validation and CI-safe demonstration without a live Trupeer session.

## Requirements

Set the following environment variables before running the automation:

- `TRUPEER_EMAIL`
- `TRUPEER_PASSWORD`
- Optional for Part 3 AI validation:
  - `OPENAI_API_KEY`
  - or `GEMINI_API_KEY`
  - or set `LLM_PROVIDER=mock` to use the built-in offline judge

## Part 1

Open the bug report here:

- [part1/bugs.md](part1/bugs.md)

## Part 2

```bash
cd part2
npm install
npx playwright test
```

For a single runnable smoke check:

```bash
cd part2
npx playwright test --grep "login|editor|modify script ai|negative"
```

See [part2/README.md](part2/README.md) for environment setup and selector conventions.

## Part 3

```bash
cd part3
npm install
npm run validate
```

The script defaults to a mock LLM judge when no API key is configured so it can run in CI or a local environment without external access.

See [part3/README.md](part3/README.md) for full setup and validation notes.
