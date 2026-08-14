# Trupeer Playwright suite

This project exercises the main Trupeer user flows through Playwright with a page object model.

## Setup

1. Install dependencies:
   ```bash
   cd part2
   npm install
   ```
2. Create a `.env` file or export environment variables in your shell:
   ```bash
   export TRUPEER_EMAIL="your-email@example.com"
   export TRUPEER_PASSWORD="your-password"
   ```
3. Make sure the account has at least one video and a transcript/script in the editor.

## Run the suite

```bash
cd part2
npx playwright test
```

The tests intentionally skip early when credentials are missing, so the suite stays runnable in CI or local sandboxes while still validating the intended automation flow when env vars are configured.

## Important notes

- Tests use environment variables instead of hard-coded credentials.
- Assertions use explicit waits and meaningful messages.
- The suite covers login, dashboard navigation, editor load, script rewrite, and a basic editor interaction.
- The empty-prompt validation is included as a negative test.
