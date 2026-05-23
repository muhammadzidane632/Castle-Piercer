export class Sfx {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  ensure() {
    if (!this.enabled) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.enabled = false;
      return;
    }

    if (!this.context) {
      this.context = new AudioContext();
    }

    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {
        this.enabled = false;
      });
    }
  }

  playTone({ frequency = 440, duration = 0.12, type = 'square', gain = 0.035, slide = 0 }) {
    this.ensure();
    if (!this.context || !this.enabled) {
      return;
    }

    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const volume = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (slide !== 0) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration);
    }

    volume.gain.setValueAtTime(gain, now);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(volume);
    volume.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  click() {
    this.playTone({ frequency: 520, duration: 0.08, type: 'triangle', gain: 0.025, slide: 120 });
  }

  collect() {
    this.playTone({ frequency: 740, duration: 0.12, type: 'triangle', gain: 0.035, slide: 240 });
  }

  hit() {
    this.playTone({ frequency: 180, duration: 0.1, type: 'sawtooth', gain: 0.04, slide: -80 });
  }

  hurt() {
    this.playTone({ frequency: 120, duration: 0.18, type: 'square', gain: 0.045, slide: -40 });
  }

  heal() {
    this.playTone({ frequency: 480, duration: 0.16, type: 'sine', gain: 0.03, slide: 300 });
  }

  win() {
    this.playTone({ frequency: 620, duration: 0.18, type: 'triangle', gain: 0.04, slide: 500 });
    window.setTimeout(() => this.playTone({ frequency: 920, duration: 0.22, type: 'triangle', gain: 0.035, slide: 260 }), 110);
  }
}
