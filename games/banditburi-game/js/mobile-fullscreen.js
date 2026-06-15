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

  const hasFullscreenElement = () =>
    Boolean(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);

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
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setViewportSize);
  }
})();
