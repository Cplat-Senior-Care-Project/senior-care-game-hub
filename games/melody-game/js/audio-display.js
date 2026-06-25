(function () {
  "use strict";

  function postHostMessage(type, payload) {
    const message = { type, payload: payload || {} };

    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }

    if (window.parent && window.parent !== window && typeof window.parent.postMessage === "function") {
      window.parent.postMessage(message, "*");
    }

    window.dispatchEvent(new CustomEvent("melody-drum:host-message", { detail: message }));
  }

  function isNativeMobileHost() {
    return Boolean(window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function");
  }

  function isMobileLandscape() {
    const isLandscape = window.matchMedia("(orientation: landscape)").matches
      || window.innerWidth > window.innerHeight;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches
      || navigator.maxTouchPoints > 0
      || isNativeMobileHost();
    return isLandscape && isTouchDevice;
  }

  function isFullscreenActive() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function scheduleViewportRefresh() {
    window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 250);
  }

  function requestNativeDisplay(source) {
    const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime;
    if (!isNativeMobileHost() || !runtime || !runtime.nativeDisplayRequest) {
      return false;
    }

    postHostMessage("REQUEST_DISPLAY", {
      source: source || "user_gesture",
      fullscreen: Boolean(runtime.requestFullscreen),
      orientation_lock: runtime.orientationLock || "landscape"
    });
    return true;
  }

  async function requestWebFullscreen() {
    const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime;
    if (!runtime || !runtime.requestFullscreen) return false;
    if (!isMobileLandscape()) return false;
    if (isFullscreenActive()) {
      scheduleViewportRefresh();
      return true;
    }

    const target = document.documentElement;
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen({ navigationUI: "hide" });
        scheduleViewportRefresh();
        return true;
      }
      if (target.webkitRequestFullscreen) {
        await target.webkitRequestFullscreen();
        scheduleViewportRefresh();
        return true;
      }
    } catch (error) {
      scheduleViewportRefresh();
      return false;
    }
    return false;
  }

  async function lockOrientation() {
    const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime;
    if (!runtime || !runtime.orientationLock || !screen.orientation || !screen.orientation.lock) return false;

    try {
      await screen.orientation.lock(runtime.orientationLock);
      return true;
    } catch (error) {
      return false;
    }
  }

  async function requestDisplay(source) {
    requestNativeDisplay(source);
    await requestWebFullscreen();
    await lockOrientation();
  }

  function returnToHost(reason) {
    const runtime = window.MelodyRuntime && window.MelodyRuntime.runtimeSnapshot
      ? window.MelodyRuntime.runtimeSnapshot()
      : {};
    const target = runtime.mode === "ai_assisted" ? "ai_chat" : "app";
    postHostMessage("RETURN_TO_APP", {
      reason: reason || "user_complete",
      target,
      mode: runtime.mode || "standard",
      session_id: runtime.sessionId || null
    });
  }

  window.DisplayBridge = {
    postHostMessage,
    requestDisplay,
    returnToHost
  };
})();
