(function () {
  const root = document.documentElement;
  const currentScript = document.currentScript;
  const isStandalone = () =>
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const setViewportSize = () => {
    const viewport = window.visualViewport;
    const height = viewport ? viewport.height : window.innerHeight;
    const width = viewport ? viewport.width : window.innerWidth;

    root.style.setProperty("--app-height", `${height}px`);
    root.style.setProperty("--app-width", `${width}px`);
    root.classList.toggle("mobile-standalone", isStandalone());
    root.classList.toggle(
      "mobile-fullscreen-active",
      Boolean(document.fullscreenElement || document.webkitFullscreenElement)
    );
  };

  const getFullscreenRequest = () =>
    root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.msRequestFullscreen;

  const getFullscreenExit = () =>
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.msExitFullscreen;

  const hasFullscreenElement = () =>
    Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);

  const supportsFullscreen = () => Boolean(getFullscreenRequest());
  const settingsActions = document.querySelector("#settingsModal .settings-actions");
  const settingsBackButton = document.getElementById("settingsBackButton");

  const fullscreenButton = document.createElement("button");
  fullscreenButton.type = "button";
  fullscreenButton.className = "mobile-fullscreen-button";
  fullscreenButton.setAttribute("aria-label", "전체화면으로 보기");
  fullscreenButton.title = "전체화면으로 보기";
  fullscreenButton.textContent = "전체화면 켜기";

  const syncFullscreenButton = () => {
    const isFullscreen = hasFullscreenElement();
    const shouldHide = isStandalone() || !supportsFullscreen() || !settingsActions;
    fullscreenButton.hidden = shouldHide;
    fullscreenButton.textContent = isFullscreen ? "전체화면 끄기" : "전체화면 켜기";
    fullscreenButton.setAttribute(
      "aria-label",
      isFullscreen ? "전체화면 끄기" : "전체화면으로 보기"
    );
    fullscreenButton.title = isFullscreen ? "전체화면 끄기" : "전체화면으로 보기";
  };

  let requestAttempts = 0;
  const enterFullscreen = async () => {
    if (isStandalone() || hasFullscreenElement() || requestAttempts >= 4) return;

    const requestFullscreen = getFullscreenRequest();
    if (!requestFullscreen) return;

    requestAttempts += 1;
    try {
      if (root.requestFullscreen) {
        await root.requestFullscreen({ navigationUI: "hide" });
      } else {
        await requestFullscreen.call(root);
      }
      root.classList.add("mobile-fullscreen-active");
      setViewportSize();
    } catch (_) {
      setViewportSize();
    }
    syncFullscreenButton();
  };

  const exitFullscreen = async () => {
    if (!hasFullscreenElement()) return;
    const exit = getFullscreenExit();
    if (!exit) return;
    try {
      await exit.call(document);
    } catch (_) {
      setViewportSize();
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
  if (supportsFullscreen() && settingsActions) {
    settingsActions.insertBefore(
      fullscreenButton,
      settingsBackButton?.parentElement === settingsActions ? settingsBackButton : null
    );
    syncFullscreenButton();
  }

  window.addEventListener("resize", setViewportSize);
  window.addEventListener("orientationchange", setViewportSize);
  document.addEventListener("fullscreenchange", () => {
    setViewportSize();
    syncFullscreenButton();
  });
  document.addEventListener("webkitfullscreenchange", () => {
    setViewportSize();
    syncFullscreenButton();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportSize);
  }

  fullscreenButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (hasFullscreenElement()) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      exitFullscreen();
    }
  });
})();
