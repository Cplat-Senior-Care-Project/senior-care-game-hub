const fs = require("fs");
const { chromium } = require("playwright");

async function enterStart(page) {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.evaluate(() => document.getElementById("conditionSkip").click());
  await page.waitForTimeout(250);
}

(async () => {
  fs.mkdirSync(".qa", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await enterStart(page);
  await page.evaluate(() => document.getElementById("startButton").click());
  await page.waitForTimeout(250);
  await page.evaluate(() => document.querySelector(".difficulty-card.is-selected").click());
  await page.waitForTimeout(450);
  const gauge = await page.evaluate(() => {
    const box = document.getElementById("memoryCountdownGauge").getBoundingClientRect();
    const track = document.querySelector(".memory-gauge-track").getBoundingClientRect();
    return {
      badgeExists: !!document.querySelector(".memory-gauge-badge"),
      boxHeight: Math.round(box.height),
      trackHeight: Math.round(track.height),
      bottomGap: Math.round(box.bottom - track.bottom)
    };
  });
  await page.evaluate(() => document.getElementById("pauseButton").click());
  await page.waitForTimeout(250);
  await page.evaluate(() => document.getElementById("pauseHowtoButton").click());
  await page.waitForTimeout(250);
  await page.screenshot({ path: ".qa/pause-howto-overlay.png", fullPage: false });
  const pauseHowto = await page.evaluate(() => ({
    bodyActive: document.body.dataset.activeScreen,
    playActive: document.querySelector('[data-screen="play"]').classList.contains("is-active"),
    pauseOverlayHidden: document.getElementById("pauseOverlay").hidden,
    howtoActive: document.querySelector('[data-screen="howto"]').classList.contains("is-active"),
    howtoPauseOverlay: document.querySelector('[data-screen="howto"]').classList.contains("is-pause-overlay"),
    title: document.getElementById("howtoTitle").textContent.trim()
  }));

  const hardPage = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await enterStart(hardPage);
  await hardPage.evaluate(() => document.getElementById("startButton").click());
  await hardPage.waitForTimeout(250);
  await hardPage.evaluate(() => document.querySelector('[data-difficulty="hard"]').click());
  await hardPage.waitForTimeout(450);
  await hardPage.screenshot({ path: ".qa/hard-board-expanded.png", fullPage: false });
  const hardBoard = await hardPage.evaluate(() => {
    const grid = document.getElementById("bulbGrid").getBoundingClientRect();
    const card = document.querySelector(".bulb-card").getBoundingClientRect();
    return {
      className: document.getElementById("bulbGrid").className,
      gridWidth: Math.round(grid.width),
      gridHeight: Math.round(grid.height),
      cardWidth: Math.round(card.width),
      cardHeight: Math.round(card.height)
    };
  });

  const fullscreenFns = await page.evaluate(() => ({
    requestFullscreen: typeof document.documentElement.requestFullscreen,
    webkitRequestFullscreen: typeof document.documentElement.webkitRequestFullscreen,
    fullscreenElement: !!document.fullscreenElement
  }));

  console.log(JSON.stringify({ gauge, pauseHowto, hardBoard, fullscreenFns }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
