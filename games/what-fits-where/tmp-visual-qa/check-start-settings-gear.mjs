const base = "http://127.0.0.1:8091/";
const cdp = "http://127.0.0.1:9227";
const outDir = new URL("./", import.meta.url);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
  await delay(2600);

  return {
    send,
    close: async () => {
      ws.close();
      await fetch(`${cdp}/json/close/${target.id}`).catch(() => null);
    },
  };
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

async function inspect(path, name) {
  const page = await createPage(path);
  const state = await evaluate(page, `(() => {
    const visible = el => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden";
    const rectOf = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      mode: document.body.className,
      loaded: document.querySelector("#screen-start")?.classList.contains("is-loaded") || false,
      gearVisible: visible(document.querySelector("#btn-settings")),
      gearRect: rectOf(document.querySelector("#btn-settings")),
      startSettingsVisible: visible(document.querySelector("#btn-start-settings")),
      startSettingsRect: rectOf(document.querySelector("#btn-start-settings")),
      howToVisible: visible(document.querySelector("#btn-howto")),
      startVisible: visible(document.querySelector("#btn-start")),
    };
  })()`);
  const shot = await screenshot(page, `${name}.png`);
  const modalState = await evaluate(page, `(() => {
    document.querySelector("#btn-settings")?.click();
    const modal = document.querySelector("#settings-modal");
    return {
      settingsModalVisible: !!modal && !modal.classList.contains("is-hidden"),
      focusedId: document.activeElement?.id || "",
    };
  })()`);
  await page.close();
  return { name, shot, state, modalState };
}

const results = [];
results.push(await inspect("?mode=standard&show_condition_check=false", "gear-standard-start"));
results.push(await inspect("?mode=care", "gear-care-start"));
results.push(await inspect("?mode=ai_assisted", "gear-ai-start"));

console.log(JSON.stringify(results, null, 2));
