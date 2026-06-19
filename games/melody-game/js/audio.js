(function () {
  "use strict";

  const NOTE_FREQUENCIES = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25
  };

  class MelodyAudio {
    constructor() {
      this.context = null;
      this.enabled = true;
      this.volume = 0.7;
      this.audioCache = new Map();
      this.missingAudioFiles = new Set();
      this.audioSupported = typeof Audio !== "undefined";
    }

    setEnabled(enabled) {
      this.enabled = Boolean(enabled);
    }

    setVolume(value) {
      const nextValue = Number(value);
      this.volume = Math.min(1, Math.max(0, Number.isFinite(nextValue) ? nextValue : 0.7));
    }

    ensureContext() {
      if (!this.enabled) {
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

    playClick() {
      this.playTone(220, 0.04, "sine", 0.18);
    }

    playSuccess() {
      this.playTone(523.25, 0.09, "sine", 0.2);
      setTimeout(() => this.playTone(659.25, 0.1, "sine", 0.18), 70);
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

        const fileNumber = String((noteIndex % 6) + 1).padStart(2, "0");
        const src = `assets/audio/note_${fileNumber}.mp3`;
        if (this.missingAudioFiles.has(src)) {
          resolve(false);
          return;
        }

        let audio = this.audioCache.get(src);

        if (!audio) {
          audio = new Audio(src);
          audio.preload = "auto";
          audio.volume = this.volume;
          audio.addEventListener("error", () => {
            this.missingAudioFiles.add(src);
            this.audioCache.set(src, null);
          }, { once: true });
          this.audioCache.set(src, audio);
        }

        if (!audio) {
          resolve(false);
          return;
        }

        audio.currentTime = 0;
        audio.volume = this.volume;
        const playPromise = audio.play();

        if (!playPromise || typeof playPromise.then !== "function") {
          resolve(true);
          return;
        }

        playPromise.then(() => resolve(true)).catch(() => resolve(false));
      });
    }

    playMelodyTone(frequency) {
      const context = this.ensureContext();
      if (!context || !this.enabled || this.volume <= 0) {
        return;
      }

      const now = context.currentTime;
      const filter = context.createBiquadFilter();
      const output = context.createGain();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.setValueAtTime(0.6, now);
      output.gain.setValueAtTime(0.9, now);

      filter.connect(output);
      output.connect(context.destination);

      this.playPartial(context, filter, frequency, 1, "sine", 0.34, 0.62, now);
      this.playPartial(context, filter, frequency, 2, "triangle", 0.13, 0.32, now);
      this.playPartial(context, filter, frequency, 3.01, "sine", 0.06, 0.22, now);

      window.setTimeout(() => {
        filter.disconnect();
        output.disconnect();
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
