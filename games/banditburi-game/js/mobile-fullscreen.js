(function () {
  const root = document.documentElement;
  const currentScript = document.currentScript;
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const fitTextSelectors = [
    ".message",
    ".panel-guide strong",
    ".panel-guide span",
    ".stat span",
    ".modal-card h2",
    ".modal-card p",
    ".checkin-note",
    ".checkin-section strong",
    ".tutorial-title",
    ".tutorial-desc",
    ".result-card p",
    "button",
  ].join(",");
  const isStandalone = () =>
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const ensureGameViewport = () => {
    let viewport = document.querySelector(".game-viewport");
    if (viewport) return viewport;

    viewport = document.createElement("div");
    viewport.className = "game-viewport";

    const stageNodes = Array.from(document.body.children).filter((element) => {
      const tagName = element.tagName.toLowerCase();
      return element !== currentScript && tagName !== "script";
    });

    if (stageNodes.length > 0) {
      document.body.insertBefore(viewport, stageNodes[0]);
      stageNodes.forEach((element) => viewport.appendChild(element));
      return viewport;
    }

    document.body.insertBefore(viewport, currentScript || null);
    return viewport;
  };

  const gameViewport = ensureGameViewport();

  const setViewportSize = () => {
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const width = viewport ? viewport.width : window.innerWidth;
    const stageScale = Math.max(0.1, Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT));

    root.style.setProperty("--app-height", `${height}px`);
    root.style.setProperty("--app-width", `${width}px`);
    root.style.setProperty("--stage-width", `${STAGE_WIDTH}px`);
    root.style.setProperty("--stage-height", `${STAGE_HEIGHT}px`);
    root.style.setProperty("--stage-scale", String(stageScale));
    gameViewport.style.setProperty("--stage-scale", String(stageScale));
    root.classList.toggle("mobile-standalone", isStandalone());
    root.classList.toggle(
      "mobile-fullscreen-active",
      Boolean(document.fullscreenElement || document.webkitFullscreenElement)
    );
    requestAnimationFrame(fitVisibleText);
  };

  const isVisible = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const overflows = (element) =>
    element.scrollWidth > element.clientWidth + 1 ||
    element.scrollHeight > element.clientHeight + 1;

  function fitVisibleText() {
    document.querySelectorAll(fitTextSelectors).forEach((element) => {
      if (!isVisible(element)) return;

      element.style.removeProperty("--fit-font-size");
      const computed = window.getComputedStyle(element);
      let size = parseFloat(computed.fontSize);
      if (!Number.isFinite(size) || size <= 0) return;

      const minSize = Math.max(10, Math.min(size, 12));
      let attempts = 0;
      while (overflows(element) && size > minSize && attempts < 18) {
        size = Math.max(minSize, size - 1);
        element.style.setProperty("--fit-font-size", `${size}px`);
        attempts += 1;
      }
    });
  }

  const hasFullscreenElement = () =>
    Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);

  const canRequestFullscreen = () =>
    document.fullscreenEnabled !== false ||
    document.webkitFullscreenEnabled === true ||
    document.msFullscreenEnabled === true;

  let fullscreenAttempted = false;

  const requestFullscreenFromGesture = () => {
    if (fullscreenAttempted || hasFullscreenElement() || isStandalone()) return;

    const target = document.documentElement;
    const requestFullscreen =
      target.requestFullscreen ||
      target.webkitRequestFullscreen ||
      target.msRequestFullscreen;

    fullscreenAttempted = true;
    if (!requestFullscreen || !canRequestFullscreen()) {
      setViewportSize();
      return;
    }

    try {
      const request = requestFullscreen.call(target);
      if (request && typeof request.catch === "function") {
        request.catch(() => {}).finally(setViewportSize);
        return;
      }
    } catch (_error) {
      setViewportSize();
      return;
    }

    setTimeout(setViewportSize, 250);
  };

  const handleFirstInteraction = (event) => {
    if (event.type === "pointerup" && event.button !== undefined && event.button !== 0) return;
    requestFullscreenFromGesture();
    if (fullscreenAttempted || hasFullscreenElement() || isStandalone()) {
      document.removeEventListener("pointerup", handleFirstInteraction, true);
      document.removeEventListener("click", handleFirstInteraction, true);
      document.removeEventListener("touchend", handleFirstInteraction, true);
      document.removeEventListener("keydown", handleFirstInteraction, true);
    }
  };

  const registerServiceWorker = () => {
    if (!("serviceWorker" in navigator) || location.protocol === "file:" || !currentScript) return;

    const scriptUrl = new URL(currentScript.src, location.href);
    const workerUrl = new URL("../sw.js", scriptUrl);
    const scopeUrl = new URL("../", scriptUrl);

    navigator.serviceWorker.register(workerUrl, { scope: scopeUrl.pathname }).catch(() => {});
  };

  setViewportSize();
  registerServiceWorker();

  window.addEventListener("resize", setViewportSize);
  window.addEventListener("orientationchange", setViewportSize);
  document.addEventListener("fullscreenchange", setViewportSize);
  document.addEventListener("webkitfullscreenchange", setViewportSize);
  document.addEventListener("pointerup", handleFirstInteraction, true);
  document.addEventListener("click", handleFirstInteraction, true);
  document.addEventListener("touchend", handleFirstInteraction, true);
  document.addEventListener("keydown", handleFirstInteraction, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportSize);
  }
  document.addEventListener("DOMContentLoaded", () => {
    fitVisibleText();
    const observer = new MutationObserver(() => requestAnimationFrame(fitVisibleText));
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
})();
