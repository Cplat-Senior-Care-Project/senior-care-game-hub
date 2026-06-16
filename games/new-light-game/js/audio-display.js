(function (global) {
  "use strict";

  class GameAudio {
    constructor() {
      this.enabled = true;
      this.context = null;
      this.masterGain = null;
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }

    unlock() {
      if (!this.enabled) {
        return;
      }

      const context = this.getContext();
      if (context && context.state === "suspended") {
        context.resume();
      }
    }

    play(soundName) {
      if (!this.enabled) {
        return;
      }

      const context = this.getContext();
      if (!context) {
        return;
      }

      if (context.state === "suspended") {
        context.resume();
      }

      const now = context.currentTime;
      const gain = this.masterGain;

      if (soundName === "sparkle") {
        this.tone(660, now, 0.12, "sine", 0.06, gain);
        this.tone(880, now + 0.08, 0.18, "triangle", 0.045, gain);
        return;
      }

      if (soundName === "flip") {
        this.tone(280, now, 0.09, "triangle", 0.05, gain);
        this.tone(220, now + 0.07, 0.12, "sine", 0.035, gain);
        return;
      }

      if (soundName === "correct") {
        this.tone(523, now, 0.16, "sine", 0.055, gain);
        this.tone(659, now + 0.08, 0.18, "sine", 0.055, gain);
        this.tone(784, now + 0.16, 0.22, "sine", 0.05, gain);
        return;
      }

      if (soundName === "wrong") {
        this.tone(330, now, 0.14, "triangle", 0.04, gain);
        this.tone(294, now + 0.12, 0.18, "triangle", 0.032, gain);
        return;
      }

      if (soundName === "complete") {
        this.tone(392, now, 0.16, "sine", 0.05, gain);
        this.tone(523, now + 0.11, 0.16, "sine", 0.05, gain);
        this.tone(659, now + 0.22, 0.24, "sine", 0.045, gain);
        return;
      }

      if (soundName === "hint") {
        this.tone(740, now, 0.12, "sine", 0.03, gain);
      }
    }

    getContext() {
      const AudioContext = global.AudioContext || global.webkitAudioContext;

      if (!AudioContext) {
        return null;
      }

      if (!this.context) {
        this.context = new AudioContext();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = 0.18;
        this.masterGain.connect(this.context.destination);
      }

      return this.context;
    }

    tone(frequency, startAt, duration, type, peakVolume, destination) {
      const context = this.context;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(peakVolume, startAt + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

      oscillator.connect(gain);
      gain.connect(destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.03);
    }
  }

  global.GameAudio = GameAudio;
})(window);
