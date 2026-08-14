# AI-augmented Trupeer validation

This script exercises the same login flow and editor setup as the Playwright suite, captures the original script, submits multiple rewrite prompts, and then judges the result using an LLM with a structured validation rubric.

## Important live-flow note

The real Trupeer app in this environment currently stops at the email-verification/login gate before the dashboard is reachable. This is a product-level auth blocker rather than a script bug. The script therefore supports a real execution path when a valid authenticated session is available, but it also includes a mock-mode fallback that produces a valid sample result set for local validation and CI-safe demonstrations.

## Setup

1. Install dependencies:
   ```bash
   cd part3
   npm install
   ```
2. Export required env vars:
   ```bash
   export TRUPEER_EMAIL="your-email@example.com"
   export TRUPEER_PASSWORD="your-password"
   export LLM_PROVIDER="openai"  # or gemini or mock
   export OPENAI_API_KEY="your-openai-key"   # if using OpenAI
   ```
3. If you do not have an LLM API key, leave `LLM_PROVIDER=mock` to use a built-in offline validation judge.

## Run the validation script

```bash
cd part3
npm run validate
```

The script will:

- sign in to Trupeer,
- open the first available video,
- capture the original script,
- send 4 prompts to the AI rewrite flow,
- compare each result to the original using the LLM judge,
- print a summary of pass/fail and overall confidence.

## Output

The script writes a concise JSON summary of each prompt and prints a terminal result table to the console.

## CI confidence note

A practical threshold would be: require a mean confidence >= 0.8 and no criterion below 0.7. This keeps the gate strict enough to catch regressions without turning validation into a flaky blocking check. If the judge disagrees with a human reviewer, we should treat it as a review task rather than a hard fail: require a human override with evidence, then log the disagreement for calibration feedback.
