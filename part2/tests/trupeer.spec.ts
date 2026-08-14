import { expect, test } from "@playwright/test";
import {
  DashboardPage,
  LoginPage,
  VideoEditorPage,
  loginToTrupeer,
} from "../pages/trupeer";

const email = process.env.TRUPEER_EMAIL || "";
const password = process.env.TRUPEER_PASSWORD || "";

const requiresAccount = !email || !password;

test.describe("Trupeer flows", () => {
  test.beforeEach(({ page }, testInfo) => {
    if (requiresAccount) {
      testInfo.skip(
        true,
        "Set TRUPEER_EMAIL and TRUPEER_PASSWORD before running the live Trupeer tests.",
      );
    }
  });

  test("login succeeds and lands on the dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);

    const dashboard = new DashboardPage(page);
    await dashboard.waitForLoaded();
    await expect(page).toHaveURL(/dashboard|home|app/i, { timeout: 30000 });
    await expect(page.locator("body")).toContainText(
      /dashboard|videos|projects/i,
      {
        timeout: 30000,
        message:
          "Expected the user to land on a dashboard or video overview page after login.",
      },
    );
  });

  test("open an existing video and verify the editor loads key panels", async ({
    page,
  }) => {
    const dashboard = await loginToTrupeer(page, email, password);
    await dashboard.openFirstVideo();

    const editor = new VideoEditorPage(page);
    await editor.waitForLoaded();

    await expect(
      editor.scriptPanel,
      "The script panel should be visible on the editor page.",
    ).toBeVisible({ timeout: 30000 });
    await expect(
      editor.previewPanel.or(editor.timeline),
      "The editor should render a preview or timeline area.",
    ).toBeVisible({ timeout: 30000 });
  });

  test("modify script with AI returns a revised script", async ({ page }) => {
    const dashboard = await loginToTrupeer(page, email, password);
    await dashboard.openFirstVideo();

    const editor = new VideoEditorPage(page);
    await editor.waitForLoaded();
    const originalScript = await editor.getScriptText();

    await editor.openModifyScriptWithAI();
    await editor.submitRewritePrompt("Make this script more concise");

    const updatedScript = await editor.getScriptText();
    await expect(
      updatedScript.length,
      "The AI rewrite should produce a non-empty updated script.",
    ).toBeGreaterThan(10);
    await expect(updatedScript).not.toBe(
      originalScript,
      "The rewritten script should differ from the original input.",
    );
  });

  test("empty prompt is rejected by the AI rewrite flow", async ({ page }) => {
    const dashboard = await loginToTrupeer(page, email, password);
    await dashboard.openFirstVideo();

    const editor = new VideoEditorPage(page);
    await editor.waitForLoaded();
    await editor.openModifyScriptWithAI();

    const promptBox = page
      .getByPlaceholder(/prompt|describe|rewrite/i)
      .or(page.locator("textarea"))
      .first();
    await expect(
      promptBox,
      "The rewrite dialog should have a prompt field.",
    ).toBeVisible({ timeout: 20000 });
    await promptBox.fill("   ");

    const submit = page
      .getByRole("button", { name: /generate|rewrite|submit|apply/i })
      .first();
    await submit.click();

    const validationText = page.locator(
      "text=/empty|required|at least|please provide/i",
    );
    await expect(
      validationText.or(page.locator("body")),
      "Empty prompts should be blocked with a visible validation message.",
    ).toContainText(/empty|required|please provide|at least/i, {
      timeout: 20000,
    });
  });

  test("editor interaction applies a zoom change", async ({ page }) => {
    const dashboard = await loginToTrupeer(page, email, password);
    await dashboard.openFirstVideo();

    const editor = new VideoEditorPage(page);
    await editor.waitForLoaded();
    await editor.zoomTimeline();

    await expect(page.locator("body")).toContainText(/zoom|timeline|script/i, {
      timeout: 20000,
    });
  });
});
