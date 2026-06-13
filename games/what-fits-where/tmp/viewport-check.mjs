import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(
  "C:/Users/juhye/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.js",
);
const { chromium } = require("playwright");

const ROOT = "C:/Users/juhye/OneDrive/Desktop/senior-care-game-hub/games/what-fits-where";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://127.0.0.1:8080";

const viewports = [
  { name: "desktop", width: 1366, height: 768, isMobile: false },
  { name: "mobile-landscape", width: 844, height: 390, isMobile: true },
  { name: "mobile-portrait", width: 390, height: 844, isMobile: true },
];

async function clickIfVisible(page, selector) {
  const target = page.locator(selector).first();
  if (!(await target.isVisible().catch(() => false))) return false;
  await target.click({ timeout: 3000 });
  return true;
}

async function waitForActive(page, id) {
  await page.waitForFunction(
    screenId => document.getElementById(screenId)?.classList.contains("active"),
    id,
    { timeout: 5000 },
  );
}

async function showScreen(page, id) {
  await page.evaluate(screenId => {
    document.getElementById("loading-screen")?.classList.remove("active");
    document.querySelectorAll(".modal.active").forEach(modal => modal.classList.remove("active"));
    document.querySelectorAll(".screen").forEach(screen => {
      screen.classList.toggle("active", screen.id === screenId);
    });
  }, id);
  await waitForActive(page, id);
}

async function audit(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const active = document.querySelector(".screen.active");
    const app = document.getElementById("app");
    const offenders = [];
    const visibleElements = Array.from(document.querySelectorAll("body *")).filter(el => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    });

    const isInsideViewport = rect =>
      rect.left >= -1 && rect.top >= -1 && rect.right <= vw + 1 && rect.bottom <= vh + 1;

    const hasViewportSafeScroller = el => {
      let parent = el.parentElement;
      while (parent && parent !== document.body) {
        const style = getComputedStyle(parent);
        const scrollsY = /(auto|scroll|overlay)/.test(style.overflowY);
        const scrollsX = /(auto|scroll|overlay)/.test(style.overflowX);
        const canScroll = parent.scrollHeight > parent.clientHeight + 1 || parent.scrollWidth > parent.clientWidth + 1;
        if ((scrollsY || scrollsX) && canScroll && isInsideViewport(parent.getBoundingClientRect())) return true;
        parent = parent.parentElement;
      }
      return false;
    };

    for (const el of visibleElements) {
      const rect = el.getBoundingClientRect();
      const overflow =
        rect.left < -1 ||
        rect.top < -1 ||
        rect.right > vw + 1 ||
        rect.bottom > vh + 1;
      if (!overflow) continue;
      if (hasViewportSafeScroller(el)) continue;
      offenders.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        className: typeof el.className === "string" ? el.className : "",
        text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80),
        rect: {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      });
      if (offenders.length >= 20) break;
    }

    return {
      activeScreen: active?.id || "",
      bodyScroll: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
        clientWidth: document.documentElement.clientWidth,
        clientHeight: document.documentElement.clientHeight,
      },
      app: app
        ? {
            scrollWidth: app.scrollWidth,
            scrollHeight: app.scrollHeight,
            clientWidth: app.clientWidth,
            clientHeight: app.clientHeight,
          }
        : null,
      active: active
        ? {
            scrollWidth: active.scrollWidth,
            scrollHeight: active.scrollHeight,
            clientWidth: active.clientWidth,
            clientHeight: active.clientHeight,
          }
        : null,
      offenders,
    };
  });
}

async function snapshot(page, viewportName, stepName) {
  await page.waitForTimeout(350);
  const result = await audit(page);
  const screenshot = path.join(ROOT, "tmp", `viewport-${viewportName}-${stepName}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  return { stepName, screenshot, ...result };
}

async function runViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    deviceScaleFactor: viewport.isMobile ? 2 : 1,
    hasTouch: viewport.isMobile,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const logs = [];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") logs.push(message.text());
  });

  await page.goto(`${URL}?viewport_check=${Date.now()}`, { waitUntil: "networkidle" });
  await waitForActive(page, "screen-condition");
  const results = [];
  results.push(await snapshot(page, viewport.name, "condition"));

  await clickIfVisible(page, "#cc-skip");
  await waitForActive(page, "screen-start");
  results.push(await snapshot(page, viewport.name, "start"));

  await clickIfVisible(page, "#btn-settings");
  await page.waitForTimeout(200);
  if (await page.locator("#settings-modal.active").isVisible().catch(() => false)) {
    results.push(await snapshot(page, viewport.name, "settings"));
    await clickIfVisible(page, "#btn-settings-back");
  }

  await clickIfVisible(page, "#btn-howto");
  await page.waitForTimeout(200);
  if (await page.locator("#help-modal.active").isVisible().catch(() => false)) {
    results.push(await snapshot(page, viewport.name, "help"));
    await clickIfVisible(page, "#help-prev");
  }

  await clickIfVisible(page, "#btn-start");
  await waitForActive(page, "screen-difficulty");
  results.push(await snapshot(page, viewport.name, "difficulty"));

  await clickIfVisible(page, "#diff-row-select [data-diff='hard']");
  await page.waitForSelector("#countdown-modal.active", { timeout: 5000 }).catch(() => {});
  if (await page.locator("#countdown-modal.active").isVisible().catch(() => false)) {
    results.push(await snapshot(page, viewport.name, "countdown"));
  }
  await page.waitForFunction(
    () => document.getElementById("screen-play")?.classList.contains("active"),
    null,
    { timeout: 6000 },
  );
  await page.waitForFunction(
    () => !document.getElementById("countdown-modal")?.classList.contains("active"),
    null,
    { timeout: 6000 },
  );
  results.push(await snapshot(page, viewport.name, "play"));

  await clickIfVisible(page, "#btn-hint");
  await page.waitForTimeout(200);
  if (await page.locator("#hint-modal.active").isVisible().catch(() => false)) {
    results.push(await snapshot(page, viewport.name, "hint"));
    await clickIfVisible(page, "#btn-hint-close");
  }

  await clickIfVisible(page, "#btn-pause");
  await page.waitForTimeout(200);
  if (await page.locator("#pause-modal.active").isVisible().catch(() => false)) {
    results.push(await snapshot(page, viewport.name, "pause"));
    await clickIfVisible(page, "#btn-pause-end");
    await page.waitForTimeout(200);
    if (await page.locator("#exit-modal.active").isVisible().catch(() => false)) {
      results.push(await snapshot(page, viewport.name, "exit"));
      await clickIfVisible(page, "#btn-keep");
    }
    await clickIfVisible(page, "#btn-resume");
  }

  await page.evaluate(() => {
    const resultHero = document.getElementById("r-hero");
    const resultMsg = document.getElementById("r-msg");
    if (resultHero) resultHero.textContent = "수고하셨어요";
    if (resultMsg) {
      resultMsg.textContent = "오늘의 준비물 미션을 끝까지 잘 마무리했어요.\n\n상황에 맞는 물건을 차분히 고르는 연습을 했습니다.";
      resultMsg.style.whiteSpace = "pre-line";
    }
    const correct = document.getElementById("score-correct");
    const wrong = document.getElementById("score-wrong");
    const accuracy = document.getElementById("score-accuracy");
    if (correct) correct.textContent = "8문항";
    if (wrong) wrong.textContent = "2문항";
    if (accuracy) accuracy.textContent = "80%";
  });
  await showScreen(page, "screen-result");
  results.push(await snapshot(page, viewport.name, "result"));
  await showScreen(page, "screen-score");
  results.push(await snapshot(page, viewport.name, "score"));
  await showScreen(page, "screen-post-check-1");
  results.push(await snapshot(page, viewport.name, "post1"));
  await showScreen(page, "screen-post-check-2");
  results.push(await snapshot(page, viewport.name, "post2"));

  await context.close();
  return { viewport, results, errors, logs };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: EDGE,
  args: ["--disable-gpu", "--no-sandbox"],
});

const report = [];
for (const viewport of viewports) {
  report.push(await runViewport(browser, viewport));
}
await browser.close();

await fs.writeFile(path.join(ROOT, "tmp", "viewport-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
