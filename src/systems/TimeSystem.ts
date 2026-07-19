/** System dnia/nocy */
export class TimeSystem {
  private currentTime: number = 28800; // sekund od północy (8:00 start)
  private gameDay: number = 1;
  private dayDuration: number = 1800; // 30 minut na dobę
  private timeScale: number = 60; // 1 sekunda realna = 60 sekund gry
  private paused: boolean = false;
  private listeners: Array<(time: number, day: number) => void> = [];

  constructor(dayDuration?: number) {
    if (dayDuration) this.dayDuration = dayDuration;
  }

  update(delta: number) {
    if (this.paused) return;
    this.currentTime += (delta / 1000) * this.timeScale;
    if (this.currentTime >= 86400) {
      this.currentTime -= 86400;
      this.gameDay++;
    }
    this.notify();
  }

  getTimeOfDay(): number { return this.currentTime; }
  getGameDay(): number { return this.gameDay; }
  
  /** Pobiera godzinę w formacie HH:MM */
  getFormattedTime(): string {
    const hours = Math.floor(this.currentTime / 3600);
    const minutes = Math.floor((this.currentTime % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /** Określa, czy jest noc (20:00 - 6:00) */
  isNight(): boolean {
    const hours = this.currentTime / 3600;
    return hours >= 20 || hours < 6;
  }

  /** Pobiera współczynnik oświetlenia (0 = noc, 1 = dzień) */
  getLightFactor(): number {
    const hours = this.currentTime / 3600;
    if (hours >= 6 && hours <= 8) return (hours - 6) / 2; // świt
    if (hours >= 8 && hours <= 18) return 1.0; // dzień
    if (hours >= 18 && hours <= 20) return 1.0 - (hours - 18) / 2; // zmierzch
    return 0.3; // noc z lekkim światłem księżyca
  }

  /** Dodaje nasłuchiwanie na zmianę czasu */
  onTimeChange(callback: (time: number, day: number) => void) {
    this.listeners.push(callback);
  }

  private notify() {
    for (const cb of this.listeners) {
      cb(this.currentTime, this.gameDay);
    }
  }

  setTime(time: number) {
    this.currentTime = time % 86400;
    this.notify();
  }

  setDay(day: number) {
    this.gameDay = day;
  }

  /** Przyspiesza czas (np. sen) */
  advanceTime(seconds: number) {
    this.currentTime = (this.currentTime + seconds) % 86400;
    if (seconds >= 86400) {
      this.gameDay += Math.floor(seconds / 86400);
    }
    this.notify();
  }

  setPaused(paused: boolean) { this.paused = paused; }

  /** Zwraca dane do zapisu */
  getSaveData() {
    return { currentTime: this.currentTime, gameDay: this.gameDay };
  }

  /** Wczytuje dane */
  loadSaveData(data: { currentTime: number; gameDay: number }) {
    this.currentTime = data.currentTime;
    this.gameDay = data.gameDay;
  }
}
