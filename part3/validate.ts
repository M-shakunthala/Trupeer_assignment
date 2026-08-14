import { chromium } from "@playwright/test";
import "dotenv/config";
import OpenAI from "openai";

const email = process.env.TRUPEER_EMAIL || "";
const password = process.env.TRUPEER_PASSWORD || "";
const provider = (process.env.LLM_PROVIDER || "mock").toLowerCase();
const mockMode = provider === "mock" || (!email && !password);

const prompts = [
  "Make this script more professional.",
  "Add a clear call to action at the end.",
  "Translate this script to Spanish.",
  "Shorten this script while keeping the key message intact.",
];

const llmConfig = {
  provider,
  apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "",
};

async function ensureLoggedIn(page: any) {
  await page.goto("https://app.trupeer.ai/auth?tab=login");
  await page.getByPlaceholder("Your email").fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page
    .getByRole("button", { name: /continue/i })
    .first()
    .click();
  await page.waitForURL(/dashboard|home|app/i, { timeout: 60000 });
}

async function openFirstVideo(page: any) {
  const candidate = page
    .locator(
      'a[href*="editor"], button:has-text("Open"), [data-testid*="video"], .video-card',
    )
    .first();
  await candidate.waitFor({ state: "visible", timeout: 30000 });
  await candidate.click();
  await page.waitForLoadState("networkidle");
}

async function readScriptText(page: any) {
  const scriptLocator = page
    .locator(
      'textarea, [role="textbox"], [data-testid*="script"], [aria-label*="script"]',
    )
    .first();
  await scriptLocator.waitFor({ state: "visible", timeout: 30000 });
  const value = await scriptLocator
    .inputValue()
    .catch(async () => await scriptLocator.textContent());
  return String(value ?? "").trim();
}

async function triggerRewrite(page: any, prompt: string) {
  const button = page
    .getByRole("button", { name: /modify script with ai/i })
    .first();
  await button.waitFor({ state: "visible", timeout: 30000 });
  await button.click();

  const promptField = page
    .getByPlaceholder(/prompt|describe|rewrite/i)
    .or(page.locator("textarea"))
    .first();
  await promptField.waitFor({ state: "visible", timeout: 30000 });
  await promptField.fill(prompt);

  const submit = page
    .getByRole("button", { name: /generate|rewrite|submit|apply/i })
    .first();
  await submit.click();

  await page.waitForTimeout(20000);

  const updated = page
    .locator(
      'textarea, [role="textbox"], [data-testid*="script"], [aria-label*="script"]',
    )
    .first();
  const text = await updated
    .inputValue()
    .catch(async () => await updated.textContent());
  return String(text ?? "").trim();
}

function createMockJudge() {
  return async function judge(
    original: string,
    prompt: string,
    candidate: string,
  ) {
    const similarity = candidate.length > original.length * 0.6 ? 0.82 : 0.63;
    const didPromptApply =
      candidate.toLowerCase().includes("call") ||
      candidate.toLowerCase().includes("cta") ||
      candidate.toLowerCase().includes("professional") ||
      candidate.toLowerCase().includes("hola") ||
      candidate.toLowerCase().includes("resumen") ||
      candidate.toLowerCase().length > 40;
    const criteria = {
      preservesCoreMeaning: { pass: similarity > 0.7, score: similarity },
      followsPrompt: {
        pass: didPromptApply || candidate.length > 0,
        score: didPromptApply ? 0.88 : 0.48,
      },
      readableAndCoherent: {
        pass: candidate.split(/\s+/).length > 15,
        score: candidate.split(/\s+/).length > 15 ? 0.9 : 0.6,
      },
    };

    const avg =
      Object.values(criteria).reduce((acc, item) => acc + item.score, 0) /
      Object.values(criteria).length;
    return {
      passed: avg >= 0.75,
      confidence: Number(avg.toFixed(2)),
      criteria,
      summary: `Mock judge evaluated ${prompt}.`,
    };
  };
}

async function callLLMJudge(
  original: string,
  prompt: string,
  candidate: string,
) {
  if (provider === "mock" || !llmConfig.apiKey) {
    return createMockJudge()(original, prompt, candidate);
  }

  const client = new OpenAI({ apiKey: llmConfig.apiKey });

  const systemPrompt = `You are a strict but practical judge for script rewrites. Return valid JSON only with this schema:
  {
    "passed": true,
    "confidence": 0.0,
    "summary": "short summary",
    "criteria": {
      "preservesCoreMeaning": { "pass": true, "score": 0.0 },
      "followsPrompt": { "pass": true, "score": 0.0 },
      "readableAndCoherent": { "pass": true, "score": 0.0 }
    }
  }
  Score must be in the range 0 to 1. Do not add markdown or commentary outside JSON.`;

  const response = await client.responses.create({
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Original script:\n${original}\n\nUser prompt:\n${prompt}\n\nAI rewritten output:\n${candidate}`,
      },
    ],
  });

  const text = response.output_text || "";
  const first = text.trim();
  try {
    return JSON.parse(first);
  } catch {
    const match = first.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(
        `LLM response was not valid JSON: ${first.slice(0, 300)}`,
      );
    }
    return JSON.parse(match[0]);
  }
}

async function main() {
  if (mockMode) {
    const originalScript =
      "Hi everyone, thanks for joining today. We are launching a product that helps teams save time by automating repetitive work. Let's walk through the main benefits, how to get started, and what success looks like in the first 30 days.";

    console.log(
      "Running in mock validation mode. No live Trupeer credentials were detected.",
    );

    const results: any[] = [];
    for (const prompt of prompts) {
      const candidate = (() => {
        switch (prompt) {
          case "Make this script more professional.":
            return "Hello everyone, thank you for joining us today. We are introducing a product designed to help teams reduce manual effort by automating repetitive tasks. We will review its core advantages, onboarding steps, and the measurable outcomes teams can expect within the first 30 days.";
          case "Add a clear call to action at the end.":
            return "Hi everyone, thank you for joining us today. We are launching a product that helps teams save time by automating repetitive work. We will walk through the main benefits, onboarding steps, and success metrics for the first 30 days. Ready to simplify your workflow? Book a demo today.";
          case "Translate this script to Spanish.":
            return "Hola a todos, gracias por acompañarnos hoy. Estamos lanzando un producto que ayuda a los equipos a ahorrar tiempo automatizando tareas repetitivas. Revisaremos los principales beneficios, cómo empezar, y los resultados esperados en los primeros 30 días.";
          default:
            return "Hi everyone, thank you for joining us today. This product helps teams work faster by automating repetitive tasks. We will review the key benefits, the onboarding steps, and the results to expect in the first month.";
        }
      })();

      const judged = await callLLMJudge(originalScript, prompt, candidate);
      const result = {
        prompt,
        passed: Boolean(judged.passed),
        confidence: Number(judged.confidence ?? 0),
        summary: judged.summary || "No summary returned.",
        criteria: judged.criteria || {},
      };
      results.push(result);

      console.log(`\nPrompt: ${prompt}`);
      console.log(`Passed: ${result.passed ? "YES" : "NO"}`);
      console.log(`Confidence: ${result.confidence}`);
      console.log(`Summary: ${result.summary}`);
      console.log(`Criteria: ${JSON.stringify(result.criteria, null, 2)}`);
    }

    const overall =
      results.reduce((acc, item) => acc + Number(item.confidence), 0) /
      results.length;
    console.log("\nOverall result summary");
    console.log(`Average confidence: ${overall.toFixed(2)}`);
    console.log(
      `Pass count: ${results.filter((r) => r.passed).length}/${results.length}`,
    );
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await ensureLoggedIn(page);
    await openFirstVideo(page);

    const originalScript = await readScriptText(page);
    if (!originalScript) {
      throw new Error(
        "No script was detected in the selected video. Please create or open a video with a transcript.",
      );
    }

    console.log("Original script captured.");
    console.log(`Script length: ${originalScript.length} chars`);

    const results: any[] = [];
    for (const prompt of prompts) {
      const candidate = await triggerRewrite(page, prompt);
      const judged = await callLLMJudge(originalScript, prompt, candidate);
      const result = {
        prompt,
        passed: Boolean(judged.passed),
        confidence: Number(judged.confidence ?? 0),
        summary: judged.summary || "No summary returned.",
        criteria: judged.criteria || {},
      };
      results.push(result);

      console.log(`\nPrompt: ${prompt}`);
      console.log(`Passed: ${result.passed ? "YES" : "NO"}`);
      console.log(`Confidence: ${result.confidence}`);
      console.log(`Summary: ${result.summary}`);
      console.log(`Criteria: ${JSON.stringify(result.criteria, null, 2)}`);
    }

    const overall =
      results.reduce((acc, item) => acc + Number(item.confidence), 0) /
      results.length;
    console.log("\nOverall result summary");
    console.log(`Average confidence: ${overall.toFixed(2)}`);
    console.log(
      `Pass count: ${results.filter((r) => r.passed).length}/${results.length}`,
    );
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Validation script failed");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
