import { expect, type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly continueButton: Locator;
  readonly loginToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("Your email");
    this.passwordInput = page.getByPlaceholder(/password/i);
    this.continueButton = page
      .getByRole("button", { name: /continue/i })
      .first();
    this.loginToggle = page.getByRole("button", { name: /login/i }).first();
  }

  async goto() {
    await this.page.goto("https://app.trupeer.ai/auth?tab=login");
    await expect(this.emailInput).toBeVisible({ timeout: 30000 });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.continueButton.click();
  }
}

export class DashboardPage {
  readonly page: Page;
  readonly newVideoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newVideoButton = page
      .getByRole("button", { name: /new video|upload/i })
      .first();
  }

  async waitForLoaded() {
    await expect(this.page).toHaveURL(/dashboard|app|home/i, {
      timeout: 30000,
    });
    await expect(this.page.locator("body")).toContainText(
      /dashboard|videos|projects/i,
      { timeout: 30000 },
    );
  }

  async openFirstVideo() {
    const candidate = this.page
      .locator(
        'a[href*="editor"], button:has-text("Open"), [data-testid*="video"], .video-card',
      )
      .first();
    await expect(candidate).toBeVisible({ timeout: 30000 });
    await candidate.click();
  }
}

export class VideoEditorPage {
  readonly page: Page;
  readonly scriptPanel: Locator;
  readonly timeline: Locator;
  readonly previewPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.scriptPanel = page
      .locator(
        'textarea, [role="textbox"], [data-testid*="script"], [aria-label*="script"]',
      )
      .first();
    this.timeline = page
      .locator(
        '[data-testid*="timeline"], .timeline, [aria-label*="timeline"], [data-slot="timeline"]',
      )
      .first();
    this.previewPanel = page
      .locator(
        '[data-testid*="preview"], .preview, [aria-label*="preview"], video',
      )
      .first();
  }

  async waitForLoaded() {
    await expect(this.page.locator("body")).toContainText(
      /script|timeline|preview|editor/i,
      { timeout: 30000 },
    );
    await expect(
      this.timeline.or(this.previewPanel).or(this.scriptPanel),
    ).toBeVisible({ timeout: 30000 });
  }

  async openModifyScriptWithAI() {
    const button = this.page
      .getByRole("button", { name: /modify script with ai/i })
      .first();
    await expect(button).toBeVisible({ timeout: 30000 });
    await button.click();
  }

  async submitRewritePrompt(prompt: string) {
    const promptBox = this.page
      .getByPlaceholder(/prompt|describe|rewrite/i)
      .or(this.page.locator("textarea"))
      .first();
    await expect(promptBox).toBeVisible({ timeout: 30000 });
    await promptBox.fill(prompt);
    const submit = this.page
      .getByRole("button", { name: /generate|rewrite|submit|apply/i })
      .first();
    await submit.click();
  }

  async getScriptText(): Promise<string> {
    const value = await this.scriptPanel.inputValue().catch(async () => {
      return await this.scriptPanel.textContent();
    });
    return (value ?? "").trim();
  }

  async zoomTimeline() {
    const zoomIn = this.page
      .getByRole("button", { name: /zoom in|increase zoom|\+/i })
      .first();
    const maybeZoom = this.page
      .locator('button[aria-label*="zoom"], button:has-text("+")')
      .first();
    const target = zoomIn.or(maybeZoom);
    if (await target.count()) {
      await target.click();
      return;
    }
    await this.page.keyboard.press("Control+Plus");
  }
}

export async function loginToTrupeer(
  page: Page,
  email: string,
  password: string,
) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  const dashboard = new DashboardPage(page);
  await dashboard.waitForLoaded();
  return dashboard;
}
