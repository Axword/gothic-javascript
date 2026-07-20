import { QuestState, QuestStatus } from '../types';

export class QuestSystem {
  private quests: Map<string, QuestState> = new Map();
  private allQuestsData: any[] = [];
  private gameData: any;
  private rewardGranted: Set<string> = new Set(); // idempotency: quest_id + stage_id

  constructor(gameData: any) {
    this.gameData = gameData;
    const categories = ['quests_main', 'quests_old_faction', 'quests_new_faction', 'quests_side'];
    for (const cat of categories) {
      const data = (gameData as any)[cat];
      if (Array.isArray(data)) {
        this.allQuestsData.push(...data);
      }
    }
  }

  /** Start quest (idempotent) */
  startQuest(questId: string): boolean {
    if (this.quests.has(questId)) return false; // already started / completed

    const questData = this.allQuestsData.find(q => q.id === questId);
    if (!questData) return false;

    // Mutual exclusion of faction quests after choice
    const faction = questData.faction;
    if (faction === 'old_order' && this.chosenFaction() === 'new_order') return false;
    if (faction === 'new_order' && this.chosenFaction() === 'old_order') return false;

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

  /** Get or start quest helper */
  getOrStart(questId: string): QuestState | null {
    if (!this.quests.has(questId)) {
      this.startQuest(questId);
    }
    return this.quests.get(questId) || null;
  }

  /** Progress quest to next stage */
  advanceQuest(questId: string, stageId?: string): boolean {
    const state = this.quests.get(questId);
    if (!state || state.status !== 'active') return false;

    const questData = this.allQuestsData.find(q => q.id === questId);
    if (!questData) return false;

    const currentStageId = state.current_stage;
    const currentStageData = questData.stages[currentStageId];
    if (!currentStageData) return false;

    // Award rewards only once per stage (BUG-022 idempotency)
    const rewardKey = `${questId}::${currentStageId}`;
    if (!this.rewardGranted.has(rewardKey) && currentStageData.rewards) {
      this.grantRewards(currentStageData.rewards);
      this.rewardGranted.add(rewardKey);
    }

    // Mark current stage completed
    if (!state.completed_stages.includes(currentStageId)) {
      state.completed_stages.push(currentStageId);
    }

    // Move to next stage
    const nextStage = stageId || currentStageData.next_stage_on_complete;
    if (nextStage && questData.stages[nextStage]) {
      state.current_stage = nextStage;
      const event = new CustomEvent('game:questStageAdvanced', { detail: { questId, stage: nextStage } });
      window.dispatchEvent(event);
      return true;
    }

    // No next stage -> quest completed
    state.status = 'completed';
    // Grant top-level quest rewards (if not already granted by stages)
    if (questData.rewards) {
      const finalKey = `${questId}::__final__`;
      if (!this.rewardGranted.has(finalKey)) {
        this.grantRewards(questData.rewards);
        this.rewardGranted.add(finalKey);
      }
    }
    const event = new CustomEvent('game:questCompleted', { detail: { questId, title: questData.title } });
    window.dispatchEvent(event);
    return true;
  }

  failQuest(questId: string, reason: string = ''): boolean {
    const state = this.quests.get(questId);
    if (!state || state.status !== 'active') return false;
    state.status = 'failed';
    (state as any).failed_reason = reason;
    const event = new CustomEvent('game:questFailed', { detail: { questId, reason } });
    window.dispatchEvent(event);
    return true;
  }

  private grantRewards(rewards: any) {
    const event = new CustomEvent('game:grantRewards', { detail: rewards });
    window.dispatchEvent(event);
  }

  /** Choose faction - mutual exclusion (BUG-008) */
  chooseFaction(faction: 'old_order' | 'new_order'): boolean {
    // Fail all quests from the opposite faction that are still active
    const opposite = faction === 'old_order' ? 'new_order' : 'old_order';
    for (const [id, state] of this.quests) {
      if (state.status !== 'active') continue;
      const qd = this.allQuestsData.find(q => q.id === id);
      if (!qd) continue;
      if (qd.faction === opposite) {
        state.status = 'failed';
        (state as any).failed_reason = `Wybrano drugą frakcję (${faction})`;
      }
    }
    return true;
  }

  chosenFaction(): 'old_order' | 'new_order' | null {
    // Check if any final-choice main quest stage is reached
    const main = this.quests.get('quest_main_arrival');
    if (main && main.status === 'completed') {
      // Determined by player's faction externally; just return based on completed quest states
      return null;
    }
    // Look at faction quest sets
    const oldComplete = this.allQuestsData.some((q: any) => q.faction === 'old_order' && this.isQuestCompleted(q.id));
    const newComplete = this.allQuestsData.some((q: any) => q.faction === 'new_order' && this.isQuestCompleted(q.id));
    if (oldComplete && !newComplete) return 'old_order';
    if (newComplete && !oldComplete) return 'new_order';
    return null;
  }

  getQuestState(questId: string): QuestState | undefined {
    return this.quests.get(questId);
  }

  isQuestActive(questId: string): boolean {
    return this.quests.get(questId)?.status === 'active';
  }

  isQuestCompleted(questId: string): boolean {
    return this.quests.get(questId)?.status === 'completed';
  }

  isQuestFailed(questId: string): boolean {
    return this.quests.get(questId)?.status === 'failed';
  }

  getActiveQuests(): QuestState[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'active');
  }

  getCompletedQuests(): QuestState[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'completed');
  }

  getFailedQuests(): QuestState[] {
    return Array.from(this.quests.values()).filter(q => q.status === 'failed');
  }

  /** Update objective progress */
  updateObjective(questId: string, objectiveKey: string, value: number = 1) {
    const state = this.quests.get(questId);
    if (!state || state.status !== 'active') return;
    state.objectives_progress[objectiveKey] = (state.objectives_progress[objectiveKey] || 0) + value;
  }

  getSaveData() {
    return Array.from(this.quests.values());
  }

  loadSaveData(data: QuestState[]) {
    this.quests.clear();
    this.rewardGranted.clear();
    for (const q of data) {
      this.quests.set(q.quest_id, q);
    }
  }

  /** Can a quest be started (prerequisites met)? */
  canStartQuest(questId: string): boolean {
    const questData = this.allQuestsData.find(q => q.id === questId);
    if (!questData) return false;
    if (this.quests.has(questId)) return false;
    if (!questData.prerequisites || questData.prerequisites.length === 0) return true;
    for (const prereq of questData.prerequisites) {
      if (prereq.type === 'quest_state') {
        const s = this.quests.get(prereq.quest_id);
        if (!s || s.status !== prereq.state) return false;
      }
    }
    return true;
  }
}
