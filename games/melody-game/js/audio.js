(function () {
  "use strict";

  const NOTE_FREQUENCIES = {
    C4: 261.63,
    "C#4": 277.18,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    "F#4": 369.99,
    G4: 392.0,
    "G#4": 415.3,
    A4: 440.0,
    "A#4": 466.16,
    Bb4: 466.16,
    B4: 493.88,
    C5: 523.25,
    "C#5": 554.37,
    D5: 587.33
  };

  class MelodyAudio {
    constructor() {
      this.context = null;
      this.enabled = true;
      this.volume = 1;
      this.noteVolumeBoost = this.isMobileDevice() ? 2.8 : 1.8;
      this.audioCache = new Map();
      this.effectAudioElements = new Map();
      this.missingAudioFiles = new Set();
      this.audioSupported = typeof fetch === "function";
      this.backgroundEnabled = true;
      this.backgroundAudio = null;
      this.backgroundFadeHandle = null;
      this.backgroundPlaying = false;
      this.backgroundVolume = 0.48;
      this.backgroundPlayToken = 0;
      this.clapAudio = null;
    }

    isBackgroundPlaying() {
      return Boolean(this.backgroundPlaying);
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }

    setVolume(value) {
      const nextValue = Number(value);
      this.volume = Math.min(1, Math.max(0, Number.isFinite(nextValue) ? nextValue : 1));
    }

    isMobileDevice() {
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
    }

    ensureContext(options) {
      const allowWhenEffectsDisabled = options && options.allowWhenEffectsDisabled;

      if (!this.enabled && !allowWhenEffectsDisabled) {
        return null;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return null;
      }

      if (!this.context) {
        this.context = new AudioContext();
      }

      if (this.context.state === "suspended") {
        this.context.resume();
      }

      return this.context;
    }

    setBackgroundEnabled(enabled) {
      this.backgroundEnabled = Boolean(enabled);
      if (!this.backgroundEnabled) {
        this.stopBackgroundMusic();
      }
    }

    startBackgroundMusic() {
      if (!this.backgroundEnabled) {
        return;
      }

      const backgroundAudio = this.getBackgroundAudio();

      if (this.backgroundPlaying) {
        this.playBackgroundElement(backgroundAudio);
        return;
      }

      const playToken = ++this.backgroundPlayToken;
      window.clearInterval(this.backgroundFadeHandle);
      backgroundAudio.volume = 0;
      this.backgroundPlaying = true;
      this.playBackgroundElement(backgroundAudio);
      this.fadeBackgroundVolume(this.backgroundVolume, 600, playToken);
    }

    stopBackgroundMusic() {
      this.backgroundPlayToken += 1;
      window.clearInterval(this.backgroundFadeHandle);

      if (!this.backgroundAudio) {
        this.backgroundPlaying = false;
        return;
      }

      const backgroundAudio = this.backgroundAudio;
      this.backgroundPlaying = false;
      this.fadeBackgroundVolume(0, 180, this.backgroundPlayToken, () => {
        backgroundAudio.pause();
      });
    }

    getBackgroundAudio() {
      if (!this.backgroundAudio) {
        const backgroundAudio = new Audio("assets/audio/background.wav");
        backgroundAudio.loop = true;
        backgroundAudio.preload = "auto";
        backgroundAudio.volume = 0;
        backgroundAudio.addEventListener("ended", () => {
          if (this.backgroundPlaying) {
            backgroundAudio.currentTime = 0;
            this.playBackgroundElement(backgroundAudio);
          }
        });
        this.backgroundAudio = backgroundAudio;
      }

      return this.backgroundAudio;
    }

    playBackgroundElement(backgroundAudio) {
      const playResult = backgroundAudio.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {
          this.backgroundPlaying = false;
        });
      }
    }

    fadeBackgroundVolume(targetVolume, duration, token, after) {
      const backgroundAudio = this.backgroundAudio;
      if (!backgroundAudio) {
        return;
      }

      const startVolume = backgroundAudio.volume;
      const startedAt = performance.now();

      window.clearInterval(this.backgroundFadeHandle);
      this.backgroundFadeHandle = window.setInterval(() => {
        if (token !== this.backgroundPlayToken) {
          window.clearInterval(this.backgroundFadeHandle);
          return;
        }

        const progress = Math.min(1, (performance.now() - startedAt) / duration);
        backgroundAudio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress >= 1) {
          window.clearInterval(this.backgroundFadeHandle);
          this.backgroundFadeHandle = null;
          if (typeof after === "function") {
            after();
          }
        }
      }, 30);
    }

    playEffectAudio(key, src, volumeScale, options) {
      const allowWhenEffectsDisabled = options && options.allowWhenEffectsDisabled;
      if ((!this.enabled && !allowWhenEffectsDisabled) || this.volume <= 0 || typeof Audio !== "function") {
        return;
      }

      const effectAudio = this.getEffectAudio(key, src);
      effectAudio.volume = Math.min(1, this.volume * (volumeScale || 1));
      try {
        effectAudio.currentTime = 0;
      } catch (error) {}

      const playResult = effectAudio.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {});
      }
    }

    getEffectAudio(key, src) {
      if (!this.effectAudioElements.has(key)) {
        const effectAudio = new Audio(src);
        effectAudio.preload = "auto";
        this.effectAudioElements.set(key, effectAudio);
      }

      return this.effectAudioElements.get(key);
    }

    playClick() {
      this.playTone(220, 0.04, "sine", 0.18);
    }

    playButtonClick() {
      this.playEffectAudio("buttonClick", "assets/audio/button-click2.wav", 0.85);
    }

    playCountdownTick() {
      this.playEffectAudio("countdownTick", "assets/audio/countdown-tick.wav", 0.9);
    }

    playStartCue() {
      this.playEffectAudio("startCue", "assets/audio/start.wav", 0.9);
    }

    playVoiceReady() {
      this.playEffectAudio("voiceReady", "assets/audio/voice-ready.wav", 1, { allowWhenEffectsDisabled: true });
    }

    playComplete() {
      this.playEffectAudio("complete", "assets/audio/complete2.wav", 1);
    }

    playSuccess() {
      this.playTone(523.25, 0.09, "sine", 0.2);
      setTimeout(() => this.playTone(659.25, 0.1, "sine", 0.18), 70);
    }

    playClap() {
      if (!this.enabled || this.volume <= 0) {
        return;
      }

      const clapAudio = this.getClapAudio();
      clapAudio.volume = Math.min(1, this.volume * 0.9);
      clapAudio.currentTime = 0;

      const playResult = clapAudio.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {});
      }
    }

    getClapAudio() {
      if (!this.clapAudio) {
        const clapAudio = new Audio("assets/audio/clap.wav");
        clapAudio.preload = "auto";
        this.clapAudio = clapAudio;
      }

      return this.clapAudio;
    }

    playNote(noteName, noteIndex) {
      if (!this.enabled) {
        return;
      }

      this.tryAudioFile(noteIndex)
        .then((played) => {
          if (!played) {
            const frequency = NOTE_FREQUENCIES[noteName] || NOTE_FREQUENCIES.C4;
            this.playMelodyTone(frequency);
          }
        })
        .catch(() => {
          const frequency = NOTE_FREQUENCIES[noteName] || NOTE_FREQUENCIES.C4;
          this.playMelodyTone(frequency);
        });
    }

    tryAudioFile(noteIndex) {
      return new Promise((resolve) => {
        if (!this.audioSupported) {
          resolve(false);
          return;
        }

        const context = this.ensureContext();
        if (!context) {
          resolve(false);
          return;
        }

        const fileNumber = String((noteIndex % 6) + 1).padStart(2, "0");
        const src = `assets/audio/note_${fileNumber}.mp3`;
        if (this.missingAudioFiles.has(src)) {
          resolve(false);
          return;
        }

        let audioBufferPromise = this.audioCache.get(src);

        if (!audioBufferPromise) {
          audioBufferPromise = fetch(src)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Audio file not found: ${src}`);
              }
              return response.arrayBuffer();
            })
            .then((arrayBuffer) => this.decodeAudioBuffer(context, arrayBuffer))
            .catch(() => {
              this.missingAudioFiles.add(src);
              this.audioCache.set(src, null);
              return null;
            });
          this.audioCache.set(src, audioBufferPromise);
        }

        if (!audioBufferPromise) {
          resolve(false);
          return;
        }

        audioBufferPromise
          .then((audioBuffer) => {
            if (!audioBuffer) {
              resolve(false);
              return;
            }

            this.playAudioBuffer(context, audioBuffer);
            resolve(true);
          })
          .catch(() => resolve(false));
      });
    }

    decodeAudioBuffer(context, arrayBuffer) {
      return new Promise((resolve, reject) => {
        const decoded = context.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
        if (decoded && typeof decoded.then === "function") {
          decoded.then(resolve).catch(reject);
        }
      });
    }

    playAudioBuffer(context, audioBuffer) {
      const source = context.createBufferSource();
      const gainNode = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const now = context.currentTime;

      source.buffer = audioBuffer;
      gainNode.gain.setValueAtTime(Math.min(3, this.volume * this.noteVolumeBoost), now);
      compressor.threshold.setValueAtTime(-14, now);
      compressor.knee.setValueAtTime(18, now);
      compressor.ratio.setValueAtTime(8, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.12, now);

      source.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(context.destination);
      source.start(now);
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
        compressor.disconnect();
      };
    }

    playMelodyTone(frequency) {
      const context = this.ensureContext();
      if (!context || !this.enabled || this.volume <= 0) {
        return;
      }

      const now = context.currentTime;
      const filter = context.createBiquadFilter();
      const output = context.createGain();
      const compressor = context.createDynamicsCompressor();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(0.6, now);
      output.gain.setValueAtTime(this.noteVolumeBoost, now);
      compressor.threshold.setValueAtTime(-14, now);
      compressor.knee.setValueAtTime(18, now);
      compressor.ratio.setValueAtTime(8, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.12, now);

      filter.connect(output);
      output.connect(compressor);
      compressor.connect(context.destination);

      this.playPartial(context, filter, frequency, 1, "sine", 0.48, 0.62, now);
      this.playPartial(context, filter, frequency, 2, "triangle", 0.18, 0.32, now);
      this.playPartial(context, filter, frequency, 3.01, "sine", 0.09, 0.22, now);

      window.setTimeout(() => {
        filter.disconnect();
        output.disconnect();
        compressor.disconnect();
      }, 720);
    }

    playPartial(context, destination, baseFrequency, multiplier, waveform, gainScale, duration, startTime) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const peak = Math.max(0.0001, this.volume * gainScale);
      const attackEnd = startTime + 0.012;
      const decayPoint = startTime + Math.min(0.12, duration * 0.4);
      const end = startTime + duration;

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(baseFrequency * multiplier, startTime);
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(peak, attackEnd);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * 0.24), decayPoint);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gainNode);
      gainNode.connect(destination);
      oscillator.start(startTime);
      oscillator.stop(end + 0.03);
    }

    playTone(frequency, duration, waveform, gainScale) {
      const context = this.ensureContext();
      if (!context || !this.enabled || this.volume <= 0) {
        return;
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const now = context.currentTime;
      const end = now + duration;

      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, now);
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, this.volume * gainScale), now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(end + 0.02);
    }
  }

  window.MelodyAudio = MelodyAudio;
})();
