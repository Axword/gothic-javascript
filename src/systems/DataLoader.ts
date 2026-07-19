/** Rezultat ładowania danych */
export interface LoadedData {
  items_weapons_swords: any[];
  items_weapons_bows: any[];
  items_armors: any[];
  items_plants: any[];
  items_potions: any[];
  items_misc: any[];
  npcs: any[];
  npc_schedules: any[];
  monsters: any[];
  monster_spawns: any[];
  quests_main: any[];
  quests_old_faction: any[];
  quests_new_faction: any[];
  quests_side: any[];
  dialogues: any[];
  world_locations: any[];
  loot_tables: any[];
  trainers: any[];
  spells: any[];
  balance: any;
}

export class DataLoader {
  private data: Partial<LoadedData> = {};
  private errors: string[] = [];

  async loadAll(): Promise<LoadedData> {
    const files = [
      'items_weapons_swords', 'items_weapons_bows', 'items_armors',
      'items_plants', 'items_potions', 'items_misc',
      'npcs', 'npc_schedules', 'monsters', 'monster_spawns',
      'quests_main', 'quests_old_faction', 'quests_new_faction', 'quests_side',
      'world_locations', 'loot_tables', 'trainers', 'spells', 'balance'
    ];

    for (const file of files) {
      try {
        const response = await fetch(`data/json/${file}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        (this.data as any)[file] = json;
      } catch (e: any) {
        this.errors.push(`Nie można załadować ${file}.json: ${e.message}`);
      }
    }

    // Ładuj dialogi
    try {
      const response = await fetch('data/json/dialogues_intro.json');
      if (response.ok) {
        this.data.dialogues = await response.json();
      }
    } catch (e: any) {
      this.errors.push(`Nie można załadować dialogów: ${e.message}`);
    }

    if (this.errors.length > 0) {
      console.warn('[DataLoader] Błędy ładowania:', this.errors);
    }

    this.validateReferences();

    return this.data as LoadedData;
  }

  private validateReferences() {
    // Sprawdź duplikaty ID
    const allIds = new Map<string, string[]>();
    for (const [category, items] of Object.entries(this.data)) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        if (item.id) {
          if (!allIds.has(item.id)) allIds.set(item.id, []);
          allIds.get(item.id)!.push(category);
        }
      }
    }

    for (const [id, categories] of allIds) {
      if (categories.length > 1) {
        this.errors.push(`Duplikat ID "${id}" w: ${categories.join(', ')}`);
      }
    }

    // Sprawdź referencje NPC w harmonogramach
    if (this.data.npcs && this.data.npc_schedules) {
      const npcIds = new Set(this.data.npcs.map((n: any) => n.id));
      for (const schedule of this.data.npc_schedules) {
        if (!npcIds.has(schedule.npc_id)) {
          this.errors.push(`Harmonogram odwołuje się do nieistniejącego NPC: ${schedule.npc_id}`);
        }
      }
    }
  }

  getErrors(): string[] {
    return [...this.errors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getData<K extends keyof LoadedData>(key: K): LoadedData[K] {
    return this.data[key] || ([] as any);
  }

  /** Znajdź encję po ID w danych */
  findById(category: string, id: string): any {
    const items = (this.data as any)[category];
    if (!Array.isArray(items)) return null;
    return items.find((i: any) => i.id === id) || null;
  }
}
