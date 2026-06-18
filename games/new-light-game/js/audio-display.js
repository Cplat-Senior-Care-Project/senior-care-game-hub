(function (global) {
  "use strict";

  class GameAudio {
    constructor() {
      this.enabled = true;
      this.musicEnabled = true;
      this.voiceEnabled = true;
      this.context = null;
      this.masterGain = null;
      this.backgroundAudio = null;
      this.backgroundRestartTimer = null;
      this.backgroundFadeTimer = null;
      this.backgroundVolume = 0.28;
      this.activeVoiceAudio = null;
      this.pausedVoiceAudio = null;
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }

    setMusicEnabled(enabled) {
      this.musicEnabled = Boolean(enabled);

      if (this.musicEnabled) {
        this.playBackground({ fadeIn: true });
      } else {
        this.pauseBackground();
      }
    }

    setVoiceEnabled(enabled) {
      this.voiceEnabled = Boolean(enabled);
    }

    unlock() {
      if (this.enabled) {
        const context = this.getContext();
        if (context && context.state === "suspended") {
          context.resume();
        }
      }

      this.playBackground({ fadeIn: true });
    }

    play(soundName) {
      const fileSound = this.getFileSound(soundName);
      if (fileSound) {
        if (fileSound.type === "voice") {
          if (!this.voiceEnabled) {
            return;
          }
        } else if (!this.enabled) {
          return;
        }

        this.resumeContext();
        this.playAudioFile(soundName, fileSound.src, fileSound.volume, fileSound.type);
        return;
      }

      if (!this.enabled) {
        return;
      }

      const context = this.getContext();
      if (!context) {
        return;
      }

      this.resumeContext();

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
        return;
      }

      if (soundName === "countdown") {
        this.tone(520, now, 0.08, "sine", 0.04, gain);
        this.tone(780, now + 0.045, 0.09, "triangle", 0.028, gain);
      }
    }

    getFileSound(soundName) {
      const fileSounds = {
        button: { src: "assets/audio/button-click2.wav", volume: 0.52, type: "sfx" },
        countdown: { src: "assets/audio/countdown-tick.wav", volume: 0.64, type: "sfx" },
        start: { src: "assets/audio/start.wav", volume: 0.72, type: "sfx" },
        correct: { src: "assets/audio/correct2.wav", volume: 0.72, type: "sfx" },
        retry: { src: "assets/audio/retry2.wav", volume: 0.7, type: "sfx" },
        complete: { src: "assets/audio/complete2.wav", volume: 0.72, type: "sfx" },
        readyVoice: { src: "assets/audio/voice-ready.wav", volume: 0.9, type: "voice" },
        memoryVoice: { src: "assets/audio/voice-memory.wav", volume: 0.9, type: "voice" },
        questionVoice: { src: "assets/audio/voice-question.wav", volume: 0.9, type: "voice" },
        correctVoice: { src: "assets/audio/voice-correct.wav", volume: 0.9, type: "voice" },
        retryVoice: { src: "assets/audio/voice-retry.wav", volume: 0.9, type: "voice" },
        retry3Voice: { src: "assets/audio/voice-retry3.wav", volume: 0.9, type: "voice" },
        careMemoryVoice: { src: "assets/audio/voice-care-memory.wav", volume: 0.9, type: "voice" },
        careHideVoice: { src: "assets/audio/voice-care-hide.wav", volume: 0.9, type: "voice" },
        careSelectVoice: { src: "assets/audio/voice-care-select.wav", volume: 0.9, type: "voice" },
        careRetryVoice: { src: "assets/audio/voice-care-retry.wav", volume: 0.9, type: "voice" },
        softFeedbackCorrectVoice: { src: "assets/audio/voice-soft_feedback_correct.wav", volume: 0.9, type: "voice" },
        softFeedbackRetry3Voice: { src: "assets/audio/voice-soft_feedback_retry3.wav", volume: 0.9, type: "voice" }
      };

      return fileSounds[soundName] || null;
    }

    resumeContext() {
      const context = this.getContext();
      if (context && context.state === "suspended") {
        context.resume();
      }
    }

    primeBackground() {
      if (!this.musicEnabled) {
        return;
      }

      const audio = this.getBackgroundAudio();
      if (!audio) {
        return;
      }

      audio.muted = true;
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    playBackground(options = {}) {
      if (!this.musicEnabled) {
        return;
      }

      const audio = this.getBackgroundAudio();
      if (!audio) {
        return;
      }

      audio.muted = false;

      if (options.fadeIn) {
        this.fadeBackgroundTo(this.backgroundVolume, 700);
      } else {
        audio.volume = this.backgroundVolume;
      }

      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    }

    playAudioFile(key, src, volume, type) {
      if (typeof global.Audio !== "function") {
        return;
      }

      if (type === "voice") {
        this.stopActiveVoice();
        this.pausedVoiceAudio = null;
      }

      const audio = new global.Audio(src);
      audio.preload = "auto";
      audio.volume = volume;
      if (type === "voice") {
        this.activeVoiceAudio = audio;
        audio.addEventListener("ended", () => {
          if (this.activeVoiceAudio === audio) {
            this.activeVoiceAudio = null;
          }
        });
      }
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          if (this.activeVoiceAudio === audio) {
            this.activeVoiceAudio = null;
          }
        });
      }
    }

    stopActiveVoice() {
      if (!this.activeVoiceAudio) {
        return;
      }

      this.activeVoiceAudio.pause();
      this.activeVoiceAudio.currentTime = 0;
      this.activeVoiceAudio = null;
    }

    pauseActiveVoice() {
      if (!this.activeVoiceAudio) {
        return false;
      }

      this.activeVoiceAudio.pause();
      this.pausedVoiceAudio = this.activeVoiceAudio;
      return true;
    }

    resumeActiveVoice() {
      if (!this.pausedVoiceAudio || !this.voiceEnabled) {
        return false;
      }

      this.activeVoiceAudio = this.pausedVoiceAudio;
      this.pausedVoiceAudio = null;
      const playPromise = this.activeVoiceAudio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      return true;
    }

    pauseBackground() {
      if (this.backgroundAudio) {
        this.backgroundAudio.pause();
        this.backgroundAudio.muted = false;
      }
      if (this.backgroundRestartTimer) {
        clearTimeout(this.backgroundRestartTimer);
        this.backgroundRestartTimer = null;
      }
      if (this.backgroundFadeTimer) {
        clearInterval(this.backgroundFadeTimer);
        this.backgroundFadeTimer = null;
      }
    }

    getBackgroundAudio() {
      if (this.backgroundAudio) {
        return this.backgroundAudio;
      }

      if (typeof global.Audio !== "function") {
        return null;
      }

      const audio = new global.Audio("assets/audio/background.wav");
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = this.backgroundVolume;
      audio.addEventListener("timeupdate", () => this.scheduleSeamlessBackgroundRestart());
      audio.addEventListener("ended", () => this.restartBackground());
      this.backgroundAudio = audio;
      return audio;
    }

    fadeBackgroundTo(targetVolume, durationMs) {
      const audio = this.backgroundAudio;
      if (!audio) {
        return;
      }

      if (this.backgroundFadeTimer) {
        clearInterval(this.backgroundFadeTimer);
        this.backgroundFadeTimer = null;
      }

      const startVolume = Number.isFinite(audio.volume) ? audio.volume : 0;
      const startedAt = Date.now();
      audio.volume = startVolume;

      this.backgroundFadeTimer = setInterval(() => {
        const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
        audio.volume = startVolume + ((targetVolume - startVolume) * progress);

        if (progress >= 1) {
          clearInterval(this.backgroundFadeTimer);
          this.backgroundFadeTimer = null;
          audio.volume = targetVolume;
        }
      }, 50);
    }

    scheduleSeamlessBackgroundRestart() {
      const audio = this.backgroundAudio;
      if (!audio || !this.musicEnabled || !Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      const remaining = audio.duration - audio.currentTime;
      if (remaining > 0.18 || this.backgroundRestartTimer) {
        return;
      }

      this.backgroundRestartTimer = setTimeout(() => {
        this.backgroundRestartTimer = null;
        this.restartBackground();
      }, Math.max(0, (remaining * 1000) - 20));
    }

    restartBackground() {
      const audio = this.backgroundAudio;
      if (!audio || !this.musicEnabled) {
        return;
      }

      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
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
