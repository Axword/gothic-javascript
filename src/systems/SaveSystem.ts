import { SaveData, SaveSlot, SAVE_VERSION } from '../types';

const DB_NAME = 'KrwawySzlak';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SLOT_COUNT = 5;

export class SaveSystem {
  private db: IDBDatabase | null = null;
  private ready: boolean = false;

  async init(): Promise<void> {
    if (this.ready && this.db) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'slot_index' });
        }
      };
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.ready = true;
        resolve();
      };
      request.onerror = (event) => {
        const err = (event.target as IDBOpenDBRequest).error;
        console.error('Błąd IndexedDB:', err);
        // Fallback - still resolve so that localStorage-only works
        this.ready = true;
        resolve();
      };
    });
  }

  async save(slotIndex: number, label: string, data: SaveData): Promise<void> {
    if (!this.ready) await this.init();
    // Stamp schema version on outgoing data
    data.version = SAVE_VERSION;
    data.timestamp = Date.now();
    const slot: SaveSlot = {
      slot_index: slotIndex,
      label,
      version: SAVE_VERSION,
      timestamp: data.timestamp,
      play_time: data.play_time || 0,
      level: data.player.level,
      location: data.player.location_id,
      faction_choice: data.player.factionChoice || undefined
    };

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db ? this.db.transaction(STORE_NAME, 'readwrite') : null;
        if (tx) tx.objectStore(STORE_NAME).put(slot);
        localStorage.setItem(`full_${slotIndex}`, JSON.stringify(data));
        if (tx) {
          tx.oncomplete = () => resolve();
          tx.onerror = (e) => reject((e.target as IDBTransaction).error);
        } else {
          resolve();
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  /** Migrate older save versions (currently 0.0.1 -> 0.1.0) */
  private migrate(raw: any): SaveData | null {
    if (!raw || typeof raw !== 'object') return null;
    const v = raw.version || '0.0.1';
    if (v === SAVE_VERSION) return raw as SaveData;
    // Accept older versions but normalize missing fields
    const data = raw as SaveData;
    data.version = v;
    if (!data.player) return null;
    if (data.player.inventoryCounts === undefined) data.player.inventoryCounts = {};
    if (data.player.reputation === undefined) data.player.reputation = { old_order: 0, new_order: 0 };
    if (data.player.skillRanks === undefined) data.player.skillRanks = {};
    if (data.player.knownSpells === undefined) data.player.knownSpells = [];
    if (!data.quests) data.quests = [];
    if (!data.npcs) data.npcs = [];
    if (!data.dialog_flags) data.dialog_flags = {};
    if (!data.discovered_locations) data.discovered_locations = [];
    if (!data.opened_chests) data.opened_chests = [];
    if (!data.harvested_plants) data.harvested_plants = [];
    if (!data.killed_monsters) data.killed_monsters = {};
    if (data.time_of_day === undefined) data.time_of_day = 28800;
    if (data.game_day === undefined) data.game_day = 1;
    return data;
  }

  async load(slotIndex: number): Promise<SaveData | null> {
    const raw = localStorage.getItem(`full_${slotIndex}`);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return this.migrate(parsed);
    } catch {
      return null;
    }
  }

  async getSlots(): Promise<SaveSlot[]> {
    if (!this.ready) await this.init();
    return new Promise((resolve) => {
      if (!this.db) {
        // Fallback - scan localStorage
        const slots: SaveSlot[] = [];
        for (let i = 0; i < SLOT_COUNT; i++) {
          const raw = localStorage.getItem(`full_${i}`);
          if (raw) {
            try {
              const d = JSON.parse(raw) as SaveData;
              slots.push({
                slot_index: i,
                label: `Slot ${i + 1}`,
                version: d.version || '0.0.1',
                timestamp: d.timestamp || 0,
                play_time: d.play_time || 0,
                level: d.player?.level || 1,
                location: d.player?.location_id || '',
                faction_choice: d.player?.factionChoice || undefined
              });
            } catch {}
          }
        }
        resolve(slots);
        return;
      }
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as SaveSlot[]);
      request.onerror = () => resolve([]);
    });
  }

  async deleteSlot(slotIndex: number): Promise<void> {
    if (!this.ready) await this.init();
    localStorage.removeItem(`full_${slotIndex}`);
    return new Promise((resolve) => {
      if (!this.db) { resolve(); return; }
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(slotIndex);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  exportSave(slotIndex: number): string | null {
    return localStorage.getItem(`full_${slotIndex}`);
  }

  importSave(slotIndex: number, jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as SaveData;
      // Reject incompatible versions (major mismatch)
      if (data.version && data.version[0] !== SAVE_VERSION[0]) return false;
      localStorage.setItem(`full_${slotIndex}`, jsonData);
      return true;
    } catch {
      return false;
    }
  }

  async autosave(data: SaveData): Promise<void> {
    await this.save(0, 'Autozapis', data);
  }

  /** Check if any save exists */
  async hasAnySave(): Promise<boolean> {
    const slots = await this.getSlots();
    return slots.length > 0;
  }
}
