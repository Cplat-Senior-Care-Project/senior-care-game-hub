const fs = require("fs");
const { chromium } = require("playwright");

async function enterStart(page, query = "") {
  await page.goto(`http://127.0.0.1:4173/${query}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.evaluate(() => document.getElementById("conditionSkip").click());
  await page.waitForTimeout(250);
}

async function startSelectedDifficulty(page) {
  await page.evaluate(() => document.getElementById("startButton").click());
  await page.waitForTimeout(250);
  await page.evaluate(() => document.querySelector(".difficulty-card.is-selected").click());
  await page.waitForTimeout(450);
}

(async () => {
  fs.mkdirSync(".qa", { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe"
  });

  const easyPage = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await enterStart(easyPage);
  await startSelectedDifficulty(easyPage);
  await easyPage.screenshot({ path: ".qa/gauge-expanded.png", fullPage: false });
  const gauge = await easyPage.evaluate(() => {
    const box = document.getElementById("memoryCountdownGauge").getBoundingClientRect();
    const track = document.querySelector(".memory-gauge-track").getBoundingClientRect();
    return {
      badgeExists: !!document.querySelector(".memory-gauge-badge"),
      boxHeight: Math.round(box.height),
      trackHeight: Math.round(track.height),
      bottomGap: Math.round(box.bottom - track.bottom)
    };
  });

  await easyPage.evaluate(() => document.getElementById("pauseButton").click());
  await easyPage.waitForTimeout(250);
  await easyPage.evaluate(() => document.getElementById("pauseHowtoButton").click());
  await easyPage.waitForTimeout(250);
  const pauseHowto = await easyPage.evaluate(() => ({
    active: document.body.dataset.activeScreen,
    title: document.getElementById("howtoTitle").textContent.trim(),
    firstPageActive: document.querySelector('[data-tutorial-page="0"]').classList.contains("is-active"),
    closeText: document.getElementById("tutorialClose").textContent.trim()
  }));
  await easyPage.screenshot({ path: ".qa/pause-howto.png", fullPage: false });

  const hardPage = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await enterStart(hardPage);
  await hardPage.evaluate(() => {
    document.getElementById("startButton").click();
  });
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

  console.log(JSON.stringify({ gauge, pauseHowto, hardBoard }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
