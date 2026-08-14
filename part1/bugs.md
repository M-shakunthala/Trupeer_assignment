# Bugs found during exploratory testing

## 1) Google auth opens a blocked access page instead of completing sign-in

- Severity: High
- Repro steps:
  1. Open https://app.trupeer.ai/auth?tab=signup.
  2. Click "Continue with Google".
  3. Observe the resulting URL and page state.
- Expected: Social login should proceed to the account flow or show a valid auth error if the account is not allowed.
- Actual: The app redirects to `https://app.trupeer.ai/auth?tab=signup&error=access_denied&error_description=Forbidden` and shows a banner saying, "You've used Google login before." The user is effectively stuck on the auth page, preventing access to the dashboard.
- Impact: Prevents users from completing account setup or log-in if the Google SSO path encounters a stale or rejected OAuth session.

## 2) Form validation is inconsistent when the Continue button becomes disabled after entry

- Severity: Medium
- Repro steps:
  1. Type a valid email and a password into the sign-up form.
  2. Observe the `Continue` CTA state while entering values.
  3. Retry after the value is filled.
- Expected: The button should become enabled only after the form is valid and should provide a clear error if a value is invalid.
- Actual: The primary CTA remains disabled even though valid values have been entered, and the layout shows a generic auth failure state. This creates the impression that the UI is not responding to user input.
- Impact: Users cannot sign in with the email/password path even when their credentials are valid enough to satisfy the input fields.

## 3) Browser console shows repeated 401/404 resource errors during initial app load

- Severity: Medium
- Repro steps:
  1. Load the Trupeer auth page in a fresh browser session.
  2. Open the DevTools console and network tab.
- Expected: App startup should load core resources without unauthorized or missing-file requests.
- Actual: The page emits repeated `401` and `404` errors against app resources and analytics endpoints (`/events`, auth-related resources), which can indicate a broken config or routing issue.
- Impact: Degrades reliability and may hide real user-facing issues behind failed background calls.

## 4) "Modify Script with AI" does not guard against empty or meaningless prompts

- Severity: Medium
- Repro steps:
  1. Open a video editor that contains a transcript.
  2. Click "Modify Script with AI".
  3. Submit an empty prompt or whitespace-only value.
- Expected: The UI should block empty input and show a clear validation error before the request is sent.
- Actual: The prompt flow appears to allow invalid input and fails later with no explanatory, user-safe guidance. This is a classic validation gap and can lead to noisy requests and confusing workflow failures.
- Impact: Makes AI-driven editing unreliable and frustrates users when they try to use a common, valid error path.

## 5) App-level errors appear in the console while the sign-up screen renders, indicating a brittle startup sequence

- Severity: Low
- Repro steps:
  1. Open the signup page in a new browser context.
  2. Observe the console and app state.
- Expected: The page should render a stable shell without startup data errors.
- Actual: The console shows warnings such as `ensureToken: attempt 0 failed`, `Failed to load resource`, and `Error storing user data` during initial page setup.
- Impact: These are signs of reliability issues and suggest the auth/session layer is not resilient when a user opens the product without a clean OAuth session.
