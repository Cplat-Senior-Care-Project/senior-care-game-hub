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

  async function requestWebFullscreen() {
    if (!isNativeMobileHost()) return false;

    const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime;
    if (!runtime || !runtime.requestFullscreen) return false;

    const target = document.documentElement;
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen({ navigationUI: "hide" });
        return true;
      }
      if (target.webkitRequestFullscreen) {
        await target.webkitRequestFullscreen();
        return true;
      }
    } catch (error) {
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
