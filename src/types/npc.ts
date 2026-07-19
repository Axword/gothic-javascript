/** Frakcja */
export type Faction = 'old_order' | 'new_order' | 'neutral' | 'bandit' | 'monster';

/** Płeć NPC */
export type Gender = 'male' | 'female';

/** Typ aktywności w harmonogramie */
export type ActivityType = 
  | 'idle' | 'walk' | 'work' | 'eat' | 'sleep' | 'patrol' | 'talk' 
  | 'train' | 'guard' | 'hunt' | 'flee' | 'combat';

/** Statystyki bazowe */
export interface Stats {
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  strength: number;
  dexterity: number;
  armor: number;
  magic_resist: number;
  level: number;
  xp: number;
  xp_to_next: number;
  skill_points: number;
}

/** Pozycja na mapie */
export interface Position {
  x: number;
  y: number;
  location_id: string;
}

/** Zakres czasu (w sekundach od północy, 0-86400) */
export interface TimeRange {
  start: number; // sekund od 00:00
  end: number;
}

/** Wpis harmonogramu NPC */
export interface ScheduleEntry {
  time: TimeRange;
  location_id: string;
  position: Position;
  activity: ActivityType;
  animation?: string;
  target_id?: string; // ID NPC do interakcji
  day_variant?: ('weekday' | 'weekend' | 'any')[];
  quest_condition?: {
    quest_id: string;
    state: 'not_started' | 'active' | 'completed' | 'failed';
  };
  fallback_position?: Position;
  dialog_id?: string;
}

/** Reakcja NPC na przestępstwo */
export interface CrimeReaction {
  witness_threshold: number; // odległość w px do zauważenia
  alert_range: number; // zasięg alarmowania innych NPC
  reaction: 'warn' | 'demand_return' | 'call_guards' | 'attack' | 'report_faction';
  reputation_change: number; // zmiana reputacji
  fine?: number; // ewentualna grzywna
}

/** Poziom nauczania */
export interface TeachingAbility {
  skill_id: string;
  skill_name: string;
  max_rank: number;
  cost_per_rank: number; // złoto
  skill_points_per_rank: number;
  requirements?: {
    min_level?: number;
    quest_completed?: string[];
    faction?: string;
    reputation_min?: number;
  };
  description: string;
}

/** NPC */
export interface NpcData {
  id: string;
  name: string;
  role: string;
  gender: Gender;
  faction: Faction;
  title?: string;
  stats: Stats;
  equipment: {
    weapon?: string; // ID przedmiotu
    armor?: string;
    shield?: string;
  };
  inventory: string[]; // list ID przedmiotów
  default_dialog: string; // ID domyślnego dialogu
  dialogs: string[]; // ID wszystkich dostępnych dialogów
  schedules: string[]; // ID wpisów harmonogramu
  crime_reaction: CrimeReaction;
  teaching?: TeachingAbility[];
  reputation_default: number; // domyślna reputacja frakcji
  is_essential?: boolean; // NPC nie może zginąć
  is_trainer?: boolean;
  is_merchant?: boolean;
  merchant_group?: string;
  quest_ids: string[]; // powiązane questy
  spawn_position: Position;
  patrol_path?: Position[];
}

/** Stan NPC w runtime */
export interface NpcState {
  npc_id: string;
  current_hp: number;
  current_position: Position;
  current_activity: ActivityType;
  current_schedule_index: number;
  is_alive: boolean;
  is_knocked_out: boolean;
  reputation_override?: number;
  flags: Record<string, boolean>;
  inventory_state: string[]; // aktualny ekwipunek
  equipment_state: {
    weapon?: string;
    armor?: string;
  };
  dialog_flags: Record<string, boolean>;
  quest_progress: Record<string, string>; // quest_id -> stage
}
