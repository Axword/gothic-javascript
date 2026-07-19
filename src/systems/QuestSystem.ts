import { QuestState, QuestStatus } from '../types';

export class QuestSystem {
  private quests: Map<string, QuestState> = new Map();
  private allQuestsData: any[] = [];

  constructor(gameData: any) {
    // Zbierz wszystkie questy z danych
    const categories = ['quests_main', 'quests_old_faction', 'quests_new_faction', 'quests_side'];
    for (const cat of categories) {
      const data = (gameData as any)[cat];
      if (Array.isArray(data)) {
        this.allQuestsData.push(...data);
      }
    }
  }

  /** Rozpocznij quest */
  startQuest(questId: string): boolean {
    if (this.quests.has(questId)) return false;
    
    const questData = this.allQuestsData.find(q => q.id === questId);
    if (!questData) return false;
    
    this.quests.set(questId, {
      quest_id: questId,
      status: 'active',
      current_stage: questData.initial_stage || 'start',
      completed_stages: [],
      objectives_progress: {}
    });
    
    const event = new CustomEvent('game:questStarted', { detail: { questId, title: questData.title } });
    window.dispatchEvent(event);
    return true;
  }

  /** Postęp w quście */
  advanceQuest(questId: string, stageId?: string): boolean {
    const state = this.quests.get(questId);
    if (!state || state.status !== 'active') return false;
    
    const questData = this.allQuestsData.find(q => q.id === questId);
    if (!questData) return false;
    
    if (stageId) {
      state.current_stage = stageId;
    }
    
    state.completed_stages.push(state.current_stage);
    
    // Sprawdź czy mamy next_stage
    const currentStageData = questData.stages[state.current_stage];
    if (currentStageData?.next_stage_on_complete) {
      state.current_stage = currentStageData.next_stage_on_complete;
      return true;
    }
    
    // Jeśli brak next stage, quest ukończony
    state.status = 'completed';
    const event = new CustomEvent('game:questCompleted', { detail: { questId, title: questData.title } });
    window.dispatchEvent(event);
    return true;
  }

  /** Sprawdź stan questu */
  getQuestState(questId: string): QuestState | undefined {
    return this.quests.get(questId);
  }

  isQuestActive(questId: string): boolean {
    return this.quests.get(questId)?.status === 'active';
  }

  isQuestCompleted(questId: string): boolean {
    return this.quests.get(questId)?.status === 'completed';
  }

  /** Zwróć aktywne questy */
  getActiveQuests(): QuestState[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'active');
  }

  /** Zwróć ukończone questy */
  getCompletedQuests(): QuestState[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'completed');
  }

  /** Zwróć dane do zapisu */
  getSaveData() {
    return Array.from(this.quests.values());
  }

  /** Wczytaj stan questów */
  loadSaveData(data: QuestState[]) {
    for (const q of data) {
      this.quests.set(q.quest_id, q);
    }
  }
}
