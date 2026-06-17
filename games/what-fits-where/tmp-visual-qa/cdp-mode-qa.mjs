const base = "http://127.0.0.1:8091/";
const cdp = "http://127.0.0.1:9227";
const outDir = new URL("./", import.meta.url);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createPage(path) {
  const response = await fetch(`${cdp}/json/new?${encodeURIComponent(base + path)}`, { method: "PUT" });
  if (!response.ok) throw new Error(`CDP new target failed: ${response.status}`);
  const target = await response.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", event => {
    const msg = JSON.parse(event.data);
    if (!msg.id) return;
    const handlers = pending.get(msg.id);
    if (!handlers) return;
    pending.delete(msg.id);
    if (msg.error) handlers.reject(new Error(msg.error.message));
    else handlers.resolve(msg.result || {});
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(400);
  return { send, close: () => ws.close(), targetId: target.id };
}

async function evaluate(page, expression) {
  const result = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result ? result.result.value : undefined;
}

async function screenshot(page, name) {
  const result = await page.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = new URL(name, outDir);
  await import("node:fs/promises").then(fs => fs.writeFile(file, Buffer.from(result.data, "base64")));
  return file.pathname;
}

async function inspectMode(path, setup, name) {
  const page = await createPage(path);
  await delay(2600);
  if (setup) await setup(page);
  const state = await evaluate(page, `(() => {
    const visible = el => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden";
    const active = document.querySelector(".screen.active");
    const returnBtn = document.querySelector("#btn-return");
    return {
      activeScreen: active && active.id,
      startLoaded: document.querySelector("#screen-start")?.classList.contains("is-loaded") || false,
      startLoading: document.querySelector("#screen-start")?.classList.contains("is-loading") || false,
      startSettingsVisible: visible(document.querySelector("#btn-start-settings")),
      gearVisible: visible(document.querySelector("#btn-settings")),
      pauseVisible: visible(document.querySelector("#btn-pause")),
      qnumVisible: visible(document.querySelector("#p-qnum")),
      qnumText: document.querySelector("#p-qnum")?.textContent.trim() || "",
      choiceCount: document.querySelectorAll("#p-choices .choice").length,
      prompt: document.querySelector("#p-situation")?.textContent.trim() || "",
      returnText: returnBtn?.textContent.trim() || "",
      returnClientWidth: returnBtn?.clientWidth || 0,
      returnScrollWidth: returnBtn?.scrollWidth || 0,
      countdownActive: document.querySelector("#countdown-modal")?.classList.contains("active") || false,
      pauseModalVisible: !document.querySelector("#pause-modal")?.classList.contains("is-hidden"),
    };
  })()`);
  const shot = await screenshot(page, `${name}.png`);
  page.close();
  return { name, shot, state };
}

const results = [];

results.push(await inspectMode(
  "?mode=standard&difficulty=normal&show_condition_check=false&show_difficulty_select=false",
  async page => {
    await evaluate(page, `document.querySelector("#btn-start").click()`);
    await delay(3600);
  },
  "qa-normal-play"
));

results.push(await inspectMode(
  "?mode=reminder",
  async page => {
    await delay(3600);
  },
  "qa-reminder-autostart"
));

results.push(await inspectMode(
  "?mode=care",
  null,
  "qa-care-start"
));

results.push(await inspectMode(
  "?mode=care",
  async page => {
    await evaluate(page, `document.querySelector("#btn-start").click()`);
    await delay(3600);
    await evaluate(page, `document.querySelector("#btn-pause").click()`);
    await delay(300);
  },
  "qa-care-play-pause"
));

results.push(await inspectMode(
  "?mode=care",
  async page => {
    await evaluate(page, `document.querySelector("#btn-start").click()`);
    await delay(3600);
    await evaluate(page, `finishGame(false, false)`);
    await delay(300);
  },
  "qa-care-result"
));

results.push(await inspectMode(
  "?mode=ai_assisted",
  null,
  "qa-ai-start"
));

results.push(await inspectMode(
  "?mode=ai_assisted",
  async page => {
    await evaluate(page, `document.querySelector("#btn-start").click()`);
    await delay(3600);
    await evaluate(page, `document.querySelector("#btn-pause").click()`);
    await delay(300);
  },
  "qa-ai-play-pause"
));

console.log(JSON.stringify(results, null, 2));
