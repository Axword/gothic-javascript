/**
 * System dnia/nocy
 * Uwaga: update(delta) jest wołane z pętli gry co klatkę; delta w ms.
 */
export class TimeSystem {
  private currentTime: number = 28800; // sekund od północy (8:00 start)
  private gameDay: number = 1;
  private dayDuration: number = 1800; // sekund realnych na dobę
  private timeScale: number = 60; // 1s real = 60s gry
  private paused: boolean = false;
  private listeners: Array<(time: number, day: number) => void> = [];
  private cachedFormatted: string = '08:00';
  private cachedLightFactor: number = 1.0;
  private cachedIsNight: boolean = false;

  constructor(dayDuration?: number, timeScale?: number) {
    if (dayDuration) this.dayDuration = dayDuration;
    if (timeScale) this.timeScale = timeScale;
    this.recalcCache();
  }

  /** Configure from balance JSON */
  configureFromBalance(balance: any) {
    if (balance?.time?.day_duration_seconds) this.dayDuration = balance.time.day_duration_seconds;
    if (balance?.time?.time_scale) this.timeScale = balance.time.time_scale;
  }

  update(deltaMs: number) {
    if (this.paused) return;
    // 1 real second -> timeScale game seconds
    this.currentTime += (deltaMs / 1000) * this.timeScale;
    let newDay = false;
    while (this.currentTime >= 86400) {
      this.currentTime -= 86400;
      this.gameDay++;
      newDay = true;
    }
    this.recalcCache();
    this.notify(newDay);
  }

  private recalcCache() {
    const hours = this.currentTime / 3600;
    const h = Math.floor(this.currentTime / 3600);
    const m = Math.floor((this.currentTime % 3600) / 60);
    this.cachedFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    this.cachedIsNight = hours >= 20 || hours < 6;
    // Light factor 0..1
    if (hours >= 6 && hours < 8) this.cachedLightFactor = (hours - 6) / 2;
    else if (hours >= 8 && hours < 18) this.cachedLightFactor = 1.0;
    else if (hours >= 18 && hours < 20) this.cachedLightFactor = 1.0 - (hours - 18) / 2;
    else this.cachedLightFactor = 0.25; // noc z lekkim światłem księżyca
  }

  getTimeOfDay(): number { return this.currentTime; }
  getGameDay(): number { return this.gameDay; }
  getFormattedTime(): string { return this.cachedFormatted; }
  isNight(): boolean { return this.cachedIsNight; }
  getLightFactor(): number { return this.cachedLightFactor; }

  onTimeChange(callback: (time: number, day: number) => void) {
    this.listeners.push(callback);
  }

  private notify(newDay: boolean = false) {
    for (const cb of this.listeners) cb(this.currentTime, this.gameDay);
  }

  setTime(time: number) {
    this.currentTime = ((time % 86400) + 86400) % 86400;
    this.recalcCache();
    this.notify();
  }

  setDay(day: number) { this.gameDay = Math.max(1, day); }

  advanceTime(seconds: number) {
    this.currentTime += seconds;
    while (this.currentTime >= 86400) {
      this.currentTime -= 86400;
      this.gameDay++;
    }
    this.recalcCache();
    this.notify(true);
  }

  setPaused(paused: boolean) { this.paused = paused; }

  getSaveData() {
    return { currentTime: this.currentTime, gameDay: this.gameDay };
  }

  loadSaveData(data: { currentTime: number; gameDay: number }) {
    this.currentTime = data.currentTime ?? 28800;
    this.gameDay = data.gameDay ?? 1;
    this.recalcCache();
  }
}
