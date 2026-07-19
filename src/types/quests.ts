/** Typ questu */
export type QuestType = 'main' | 'old_faction' | 'new_faction' | 'side';

/** Status questu */
export type QuestStatus = 'not_started' | 'active' | 'completed' | 'failed';

/** Warunek */
export interface QuestCondition {
  type: 'quest_state' | 'has_item' | 'has_flag' | 'reputation' | 'level' | 'skill' | 'faction' | 'time' | 'random';
  quest_id?: string;
  state?: QuestStatus;
  item_id?: string;
  flag_name?: string;
  flag_value?: boolean;
  faction?: string;
  min_reputation?: number;
  min_level?: number;
  skill_id?: string;
  min_skill_rank?: number;
  time_of_day?: TimeOfDay;
  chance?: number; // 0.0 - 1.0 dla random
}

/** Pora dnia */
export type TimeOfDay = 'any' | 'day' | 'night' | 'dawn' | 'dusk';

/** Nagroda questu */
export interface QuestReward {
  xp: number;
  gold: number;
  items?: string[]; // ID przedmiotów
  reputation_changes?: Record<string, number>; // faction -> change
  skill_points?: number;
  flags?: Record<string, boolean>;
}

/** Etap questu */
export interface QuestStage {
  id: string;
  description: string;
  objectives: QuestObjective[];
  next_stage_on_complete?: string;
  fail_conditions?: QuestCondition[];
  rewards?: QuestReward;
}

/** Cel etapu */
export interface QuestObjective {
  type: 'talk_to' | 'kill' | 'collect' | 'reach' | 'use_item' | 'escort' | 'deliver' | 'custom';
  target_id?: string; // NPC ID, monster ID, item ID, location ID
  target_count?: number;
  description: string;
  location_id?: string;
  dialog_id?: string;
}

/** Quest */
export interface QuestData {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  faction?: string;
  prerequisites: QuestCondition[];
  stages: Record<string, QuestStage>; // stage_id -> stage
  initial_stage: string;
  fail_conditions?: QuestCondition[];
  rewards?: QuestReward;
  alternative_solutions?: AlternativeSolution[];
  journal_entries: Record<string, string>; // stage_id -> tekst w dzienniku
  next_quests?: string[]; // ID questów odblokowywanych po ukończeniu
  blocked_by_quest?: string[]; // questy które blokują ten quest
}

/** Alternatywne rozwiązanie */
export interface AlternativeSolution {
  description: string;
  conditions: QuestCondition[];
  result_stage: string;
  rewards_override?: QuestReward;
  reputation_changes?: Record<string, number>;
}

/** Stan questu w runtime */
export interface QuestState {
  quest_id: string;
  status: QuestStatus;
  current_stage: string;
  completed_stages: string[];
  objectives_progress: Record<string, number>; // objective_desc -> postęp
  chosen_solution?: string;
  failed_reason?: string;
}
