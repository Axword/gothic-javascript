import { QuestCondition } from './quests';

/** Typ odpowiedzi */
export type DialogActionType = 
  | 'set_flag' | 'clear_flag' | 'give_item' | 'remove_item' 
  | 'start_quest' | 'complete_quest' | 'fail_quest' | 'set_quest_stage'
  | 'change_reputation' | 'teleport' | 'start_combat'
  | 'open_merchant' | 'open_trainer' | 'heal_player' | 'close_dialog';

/** Akcja dialogu */
export interface DialogAction {
  type: DialogActionType;
  target?: string;
  value?: string | number | boolean;
}

/** Odpowiedź */
export interface DialogResponse {
  id: string;
  text: string;
  conditions?: QuestCondition[];
  actions?: DialogAction[];
  next_node?: string; // ID następnego węzła, null = zakończ dialog
  is_leave?: boolean; // odpowiedź kończąca dialog
}

/** Węzeł dialogu */
export interface DialogNode {
  id: string;
  npc_id: string;
  npc_line: string;
  npc_emotion?: 'neutral' | 'angry' | 'sad' | 'happy' | 'sarcastic';
  responses: DialogResponse[];
  conditions?: QuestCondition[];
  actions?: DialogAction[];
  journal_entry?: string; // tekst do dziennika przy tym węźle
  is_quest_dialog?: boolean;
}

/** Dialog (zbiór węzłów) */
export interface DialogData {
  id: string;
  title: string;
  npc_id: string;
  nodes: DialogNode[];
  start_node: string;
}
