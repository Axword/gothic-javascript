import { Position, Faction } from './npc';
import { QuestStatus } from './quests';

export const SAVE_VERSION = '0.1.0';

/** Stan gracza do zapisu */
export interface PlayerSaveData {
  x: number;
  y: number;
  location_id: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  level: number;
  xp: number;
  skillPoints: number;
  gold: number;
  equippedWeapon: string | null;
  equippedArmor: string | null;
  knownSpells: string[];
  factionChoice: string | null;
  reputation: Record<string, number>;
  inventory: string[];
  inventoryCounts: Record<string, number>;
  skillRanks: Record<string, number>;
}

/** Stan NPC do zapisu */
export interface NpcSaveData {
  npc_id: string;
  hp: number;
  position: { x: number; y: number; location_id: string };
  is_alive: boolean;
  is_knocked_out: boolean;
  current_activity: string;
  flags: Record<string, boolean>;
  inventory: string[];
}

/** Zapisywalny stan questu */
export interface QuestSaveData {
  quest_id: string;
  status: QuestStatus;
  current_stage: string;
  completed_stages: string[];
  objectives_progress: Record<string, number>;
}

/** Główna struktura zapisu */
export interface SaveData {
  version: string;
  timestamp: number;
  play_time: number;
  player: PlayerSaveData;
  quests: QuestSaveData[];
  npcs: NpcSaveData[];
  reputation: Record<string, number>;
  dialog_flags: Record<string, boolean>;
  discovered_locations: string[];
  opened_chests: string[];
  harvested_plants: string[];
  killed_monsters: Record<string, number>;
  faction_choice: string | null;
  time_of_day: number;
  game_day: number;
}

/** Metadane slotu zapisu */
export interface SaveSlot {
  slot_index: number;
  label: string;
  version: string;
  timestamp: number;
  play_time: number;
  player_name?: string;
  level: number;
  location: string;
  faction_choice?: string;
}
