class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private oceanNoiseNode: AudioNode | null = null;
  private humOscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      // Create gentle wave noise generator
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // pink/brown noise
        lastOut = output[i];
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter for oceanic swell
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.gainNode);
      whiteNoise.start();

      // Low frequency hum for data lab & pumps
      this.humOscillator = this.ctx.createOscillator();
      this.humOscillator.type = 'sine';
      this.humOscillator.frequency.setValueAtTime(60, this.ctx.currentTime);

      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.humOscillator.connect(humGain);
      humGain.connect(this.gainNode);
      this.humOscillator.start();

      this.oceanNoiseNode = whiteNoise;
    } catch {
      // Audio not supported or blocked
    }
  }

  public toggleMute(): boolean {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx || !this.gainNode) return true;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    const targetGain = this.isMuted ? 0.0 : 0.6;
    this.gainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.5);
    return this.isMuted;
  }

  public playSwell(): void {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.85);
    } catch {
      // Audio context error or blocked
    }
  }

  public playAlert(): void {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.setValueAtTime(440, this.ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(580, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch {
      // Audio context error or blocked
    }
  }

  public playCriticalAlarm(): void {
    if (!this.ctx) {
      this.init();
    }
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const now = this.ctx.currentTime;
      // Staccato dual-tone critical anomaly buzzer
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // 880Hz to 440Hz rapid downward warning warble
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(740, now + 0.12);
      osc1.frequency.setValueAtTime(880, now + 0.24);
      osc1.frequency.setValueAtTime(660, now + 0.36);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.setValueAtTime(370, now + 0.12);
      osc2.frequency.setValueAtTime(440, now + 0.24);
      osc2.frequency.setValueAtTime(330, now + 0.36);

      const peakGain = this.isMuted ? 0.08 : 0.25;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.setValueAtTime(0.01, now + 0.11);
      gain.gain.setValueAtTime(peakGain, now + 0.13);
      gain.gain.setValueAtTime(0.01, now + 0.23);
      gain.gain.setValueAtTime(peakGain, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch {
      // Audio context error or blocked
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
