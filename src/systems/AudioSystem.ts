/**
 * Procedural Audio System - syntezuje dźwięki i muzykę w Web Audio API.
 * Brak zewnętrznych plików - tony generowane na żywo za pomocą oscillatorów.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicEnabled: boolean = true;
  private sfxEnabled: boolean = true;
  private musicVolume: number = 0.15;
  private sfxVolume: number = 0.3;
  private musicTimer: number | null = null;
  private ambientNodes: OscillatorNode[] = [];
  private musicPattern: number = 0;

  async init(): Promise<void> {
    if (this.ctx) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    this.ctx = new AC();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);
  }

  private ensureCtx() {
    if (!this.ctx) {
      // Autostart przy pierwszym interakcji
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /** Beep: prosty ton z obwiednią */
  beep(freq: number, durationMs: number, type: OscillatorType = 'square', volume: number = 0.3, slideTo?: number) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxEnabled) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + durationMs / 1000);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  }

  /** Krótki szum (np. do uderzenia) */
  noise(durationMs: number, volume: number = 0.2, filterFreq: number = 800) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.sfxEnabled) return;
    const bufferSize = ctx.sampleRate * durationMs / 1000;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain!);
    src.start();
    src.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  }

  // === SFX API ===
  sfxClick() { this.beep(660, 50, 'square', 0.2); }
  sfxUINavigate() { this.beep(440, 30, 'square', 0.15); }
  sfxSwordHit() {
    this.noise(120, 0.3, 1200);
    this.beep(180, 80, 'sawtooth', 0.2, 80);
  }
  sfxSwordMiss() { this.beep(400, 60, 'triangle', 0.08, 200); }
  sfxBow() {
    this.beep(800, 80, 'triangle', 0.15, 200);
    this.noise(60, 0.15, 2000);
  }
  sfxMagic() {
    this.beep(400, 200, 'sine', 0.2, 1200);
    this.beep(600, 200, 'sine', 0.15, 1800);
  }
  sfxHit() {
    this.noise(150, 0.35, 600);
    this.beep(120, 100, 'sawtooth', 0.2, 60);
  }
  sfxArrowHit() { this.beep(900, 40, 'triangle', 0.2, 300); this.noise(80, 0.15, 1500); }
  sfxDeath() {
    this.beep(300, 400, 'sawtooth', 0.3, 60);
    this.noise(400, 0.25, 400);
  }
  sfxLevelUp() {
    this.beep(523, 120, 'square', 0.25);
    setTimeout(() => this.beep(659, 120, 'square', 0.25), 100);
    setTimeout(() => this.beep(784, 200, 'square', 0.25), 200);
  }
  sfxPickup() { this.beep(880, 60, 'sine', 0.2); setTimeout(() => this.beep(1320, 80, 'sine', 0.2), 50); }
  sfxGold() { this.beep(1200, 40, 'square', 0.15); setTimeout(() => this.beep(1600, 60, 'square', 0.15), 40); }
  sfxDoor() { this.beep(200, 300, 'sawtooth', 0.2, 100); }
  sfxChestOpen() {
    this.beep(150, 100, 'sawtooth', 0.2, 300);
    setTimeout(() => this.beep(600, 100, 'square', 0.2), 80);
    setTimeout(() => this.noise(200, 0.15, 3000), 120);
  }
  sfxLockpick() { this.beep(1500, 40, 'square', 0.1); }
  sfxLockpickFail() {
    this.beep(200, 150, 'sawtooth', 0.3, 80);
    this.noise(100, 0.2, 3000);
  }
  sfxLockpickSuccess() {
    this.beep(800, 80, 'sine', 0.25);
    setTimeout(() => this.beep(1200, 120, 'sine', 0.25), 80);
  }
  sfxPotion() { this.beep(500, 150, 'sine', 0.15, 800); }
  sfxQuestStarted() {
    this.beep(523, 100, 'square', 0.2);
    setTimeout(() => this.beep(784, 150, 'square', 0.2), 100);
  }
  sfxQuestCompleted() {
    this.beep(523, 100, 'square', 0.25);
    setTimeout(() => this.beep(659, 100, 'square', 0.25), 100);
    setTimeout(() => this.beep(784, 100, 'square', 0.25), 200);
    setTimeout(() => this.beep(1047, 250, 'square', 0.3), 300);
  }
  sfxMana() { this.beep(300, 200, 'sine', 0.15, 900); }
  sfxError() { this.beep(200, 150, 'sawtooth', 0.25, 100); }
  sfxStep() { this.noise(30, 0.05, 400); }
  sfxAnimal(unit: string) {
    if (unit === 'wolf') this.beep(300, 200, 'sawtooth', 0.2, 150);
    else if (unit === 'boar') this.beep(150, 250, 'sawtooth', 0.2, 80);
    else this.beep(500, 100, 'sine', 0.1, 300);
  }
  sfxJoinFaction() {
    this.beep(440, 200, 'square', 0.3);
    setTimeout(() => this.beep(554, 200, 'square', 0.3), 200);
    setTimeout(() => this.beep(660, 400, 'square', 0.3), 400);
  }

  // === Procedural music: dark ambient drone + melody ===
  startMusic() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.musicEnabled) return;
    if (this.musicTimer !== null) return; // already playing
    this.startDrone(ctx);
    // Melody - wolne nuty na pentatonice d-moll (klimat Gothic/mroczny)
    const melody = [
      146.83, 0, 174.61, 196.00, 0, 174.61, 146.83, 0,
      130.81, 0, 146.83, 174.61, 0, 196.00, 220.00, 0,
      196.00, 0, 174.61, 146.83, 0, 130.81, 146.83, 0,
      110.00, 0, 146.83, 0, 174.61, 0, 196.00, 0
    ];
    const beatMs = 600;
    let idx = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicEnabled) return;
      const freq = melody[idx % melody.length];
      idx++;
      if (freq > 0) {
        this.musicNote(freq);
      }
    }, beatMs);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    for (const o of this.ambientNodes) {
      try { o.stop(); } catch {}
      try { o.disconnect(); } catch {}
    }
    this.ambientNodes = [];
  }

  private startDrone(ctx: AudioContext) {
    // Niski drone - 2 detunowane oscylatory
    const freqs = [55, 55.5, 82.4];
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(this.musicGain!);
      o.start();
      this.ambientNodes.push(o);
    }
  }

  private musicNote(freq: number) {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    o.connect(g);
    g.connect(this.musicGain!);
    o.start();
    o.stop(ctx.currentTime + 1.0);
  }

  setMusicEnabled(v: boolean) {
    this.musicEnabled = v;
    if (this.musicGain) this.musicGain.gain.value = v ? this.musicVolume : 0;
    if (v) this.startMusic(); else this.stopMusic();
  }
  setSfxEnabled(v: boolean) {
    this.sfxEnabled = v;
    if (this.sfxGain) this.sfxGain.gain.value = v ? this.sfxVolume : 0;
  }
  isMusicEnabled() { return this.musicEnabled; }
  isSfxEnabled() { return this.sfxEnabled; }

  /** Fanfara (dla epilogu) */
  playEpilogue() {
    const notes = [330, 392, 523, 659, 523, 659, 784];
    notes.forEach((f, i) => {
      setTimeout(() => this.beep(f, 400, 'square', 0.3), i * 300);
    });
  }
}

export const audio = new AudioSystem();
