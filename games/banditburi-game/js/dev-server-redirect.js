(() => {
  if (window.__BANDITBURI_DEV_REDIRECT__ || window.location.protocol !== "file:") return;
  window.__BANDITBURI_DEV_REDIRECT__ = true;

  const hubMarker = "/senior-care-game-hub/";
  const gameMarker = "/banditburi-game/";
  const healthPath = "/games/banditburi-game/assets/images/image-01-c44771d0.png";
  const firstPort = 8080;
  const portCount = 21;
  const probeTimeoutMs = 350;

  function getServerPath() {
    const pathname = decodeURIComponent(window.location.pathname).replace(/\\/g, "/");
    const lowerPathname = pathname.toLowerCase();
    const hubIndex = lowerPathname.lastIndexOf(hubMarker);
    if (hubIndex >= 0) {
      return pathname.slice(hubIndex + hubMarker.length - 1);
    }

    const gameIndex = lowerPathname.lastIndexOf(gameMarker);
    if (gameIndex >= 0) {
      return `/games/banditburi-game${pathname.slice(gameIndex + gameMarker.length - 1)}`;
    }

    return null;
  }

  const serverPath = getServerPath();
  if (!serverPath) return;

  let nextPortOffset = 0;
  const tryNextPort = () => {
    if (nextPortOffset >= portCount) return;

    const port = firstPort + nextPortOffset;
    nextPortOffset += 1;
    const origin = `http://127.0.0.1:${port}`;
    const probe = new Image();
    let finished = false;

    const cleanup = () => {
      finished = true;
      clearTimeout(timeoutId);
      probe.onload = null;
      probe.onerror = null;
    };

    const timeoutId = setTimeout(() => {
      if (finished) return;
      cleanup();
      tryNextPort();
    }, probeTimeoutMs);

    probe.onload = () => {
      if (finished) return;
      cleanup();
      window.location.replace(`${origin}${serverPath}${window.location.search}${window.location.hash}`);
    };

    probe.onerror = () => {
      if (finished) return;
      cleanup();
      tryNextPort();
    };

    probe.src = `${origin}${healthPath}?devRedirect=${Date.now()}`;
  };

  tryNextPort();
})();
