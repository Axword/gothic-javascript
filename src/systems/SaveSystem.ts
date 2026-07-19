import { SaveData, SaveSlot, SAVE_VERSION } from '../types';

const DB_NAME = 'KrwawySzlak';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

export class SaveSystem {
  private db: IDBDatabase | null = null;
  private ready: boolean = false;

  async init(): Promise<void> {
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
        console.error('Błąd IndexedDB:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async save(slotIndex: number, label: string, data: SaveData): Promise<void> {
    if (!this.ready) await this.init();
    const slot: SaveSlot = {
      slot_index: slotIndex,
      label,
      version: SAVE_VERSION,
      timestamp: Date.now(),
      play_time: data.play_time,
      level: data.player.level,
      location: data.player.location_id,
      faction_choice: data.player.factionChoice || undefined
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(slot);
      
      // Zapisz pełne dane w osobnym kluczu
      const fullDataKey = `full_${slotIndex}`;
      localStorage.setItem(fullDataKey, JSON.stringify(data));
      
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  }

  async load(slotIndex: number): Promise<SaveData | null> {
    const fullDataKey = `full_${slotIndex}`;
    const raw = localStorage.getItem(fullDataKey);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SaveData;
      // Sprawdź wersję
      if (!data.version) data.version = '0.0.1';
      return data;
    } catch {
      return null;
    }
  }

  async getSlots(): Promise<SaveSlot[]> {
    if (!this.ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result as SaveSlot[]);
      request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  }

  async deleteSlot(slotIndex: number): Promise<void> {
    if (!this.ready) await this.init();
    localStorage.removeItem(`full_${slotIndex}`);
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(slotIndex);
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject((e.target as IDBTransaction).error);
    });
  }

  /** Eksport zapisu do pliku JSON */
  exportSave(slotIndex: number): string | null {
    const raw = localStorage.getItem(`full_${slotIndex}`);
    return raw;
  }

  /** Import zapisu z pliku JSON */
  importSave(slotIndex: number, jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData) as SaveData;
      localStorage.setItem(`full_${slotIndex}`, jsonData);
      return true;
    } catch {
      return false;
    }
  }

  /** Autozapis */
  async autosave(data: SaveData): Promise<void> {
    await this.save(0, 'Autozapis', data);
  }
}
