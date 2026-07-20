import Phaser from 'phaser';
import { NpcData, DialogData, DialogNode, DialogResponse } from '../types';
import { GameScene } from './GameScene';

interface DialogState {
  dialogId: string;
  nodeId: string;
  npcLine: string;
  responses: DialogResponse[];
  dialogFlags: Record<string, any>;
}

const FALLBACK_GREETINGS: Record<string, string[]> = {
  'npc_beach_survivor': ['Hej! Żyjesz? Szczęściarz z ciebie.', 'Kolejny pechowiec wyrzucony przez morze...'],
  'npc_old_komendant': ['Stać! Czego tu szukasz, obcy?', 'Nie wyglądasz na kogoś z moich ludzi.'],
  'npc_old_weaponmaster': ['Potrzebujesz treningu, widzę po postawie.', 'Miecz sam się nie naostrzy.'],
  'npc_free_sep': ['Kolejna gęba do wyżywienia. Czego chcesz?', 'Wolne Chaty nie są dla mięczaków.'],
  'npc_free_thief_trainer': ['Cicho... Nie każdy musi wiedzieć, czym się zajmuję.', 'Masz spryt w oczach. Podoba mi się.'],
  'npc_free_herbalist': ['Zioła? Potrzebujesz lekarstwa?', 'Na Kresach każdy prędzej czy później potrzebuje zielarki.'],
  'npc_hunter_trainer': ['Polowanie to sztuka cierpliwości.', 'Masz oko? Bo bez oka nie upolujesz nawet ślepego szczura.'],
  'npc_mage_trainer': ['Czuję w tobie... potencjał. Albo szaleństwo.', 'Szczelina przemawia do tych, którzy słuchają.'],
  'npc_old_smith': ['Żelazo nie kłamie. Człowiek - owszem.', 'Potrzebujesz dobrego miecza? Mam parę sztuk.'],
  'npc_old_innkeeper': ['Wino, piwo, gorzała. Czego dusza zapragnie.', 'Gość w dom... zapłać z góry.'],
  'npc_traveling_merchant': ['Towar z daleka, ceny uczciwe. No... prawie.', 'Handel to wojna na sakiewki.'],
  'npc_woodcutter': ['Drzewo nie pyta, czy chcesz je ciąć.', 'Las daje, las bierze. Taka kolej rzeczy.'],
  'npc_swamp_hermit': ['Czego tu szukasz? Oprócz kłopotów?', 'Bagno połyka głupców. Jesteś głupcem?'],
  'npc_old_veteran': ['Stare kości bolą, gdy nadchodzi zmiana.', 'Widziałem więcej bitew niż ty ciepłych posiłków.'],
  'npc_old_messenger': ['List niesie wieści. Dobre, złe... rzadko obojętne.', 'Gonić, gonić, gonić. Tylko to umiem.'],
  'npc_free_scout': ['Widzę wszystko, zanim ty zobaczysz mnie.', 'Ruchy Straży... coś się szykuje.'],
  'npc_free_hunter': ['Dziczyzna na stole, skóra na grzbiecie.', 'W lesie jesteś nikim, dopóki nie udowodnisz.'],
  'npc_free_smith': ['Dla Wolnych kuję. Dla Straży - tylko gwoździe do trumien.', 'Mam stal lepszą niż w Grodzie.'],
  'npc_free_elder': ['Stare oczy widzą więcej, niż młode chcą przyznać.', 'Prawda jest jak woda - znajdzie szczelinę.'],
};

export class DialogScene extends Phaser.Scene {
  private npcData!: NpcData;
  private gameScene!: GameScene;
  private currentDialog: DialogState | null = null;
  private dialogBg!: Phaser.GameObjects.Rectangle;
  private npcNameText!: Phaser.GameObjects.Text;
  private npcLineText!: Phaser.GameObjects.Text;
  private responseButtons: Phaser.GameObjects.Container[] = [];
  private dialogFlags: Record<string, any> = {};

  constructor() {
    super({ key: 'DialogScene' });
  }

  init(data: { npcData: NpcData; gameScene: GameScene }) {
    this.npcData = data.npcData;
    this.gameScene = data.gameScene;
  }

  create() {
    // Pause game scene to prevent inputs
    this.scene.pause('GameScene');

    this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.5);

    this.dialogBg = this.add.rectangle(512, 550, 900, 300, 0x1a1a1a, 0.95);
    this.dialogBg.setStrokeStyle(2, 0x444444);

    this.npcNameText = this.add.text(80, 420, this.npcData.name, {
      fontSize: '16px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2
    });

    this.npcLineText = this.add.text(80, 450, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 800 }
    });

    this.input.keyboard!.on('keydown-ESC', () => {
      this.closeDialog();
    });

    // Load dialog from JSON (BUG-002)
    this.startDialog();
  }

  private findDialogForNpc(): DialogData | null {
    const dialogs = (this.gameScene.gameData as any)?.dialogues;
    if (!Array.isArray(dialogs)) return null;
    // Match by npc_id first, else default_dialog field
    let d = dialogs.find((dd: DialogData) => dd.npc_id === this.npcData.id);
    if (!d && this.npcData.default_dialog) {
      d = dialogs.find((dd: DialogData) => dd.id === this.npcData.default_dialog);
    }
    return d || null;
  }

  private getNode(dialog: DialogData, nodeId: string): DialogNode | null {
    return dialog.nodes.find((n: DialogNode) => n.id === nodeId) || null;
  }

  private evaluateConditions(conds: any[] | undefined): boolean {
    if (!conds || conds.length === 0) return true;
    const p = this.gameScene.player;
    for (const c of conds) {
      switch (c.type) {
        case 'has_item':
          if (p.getItemCount(c.item_id) < (c.count || 1)) return false;
          break;
        case 'quest_state': {
          const q = this.gameScene.questSystem.getQuestState(c.quest_id);
          const want = c.state || 'active';
          const have = q ? q.status : 'not_started';
          if (have !== want) return false;
          break;
        }
        case 'has_flag':
          if (!!this.dialogFlags[c.flag_name] !== !!c.flag_value) return false;
          break;
        case 'reputation':
          if ((p.reputation[c.faction] || 0) < (c.min_reputation || 0)) return false;
          break;
        case 'level':
          if (p.level < (c.min_level || 1)) return false;
          break;
        case 'faction':
          if (p.faction !== c.faction) return false;
          break;
        case 'skill':
          if ((p.skillRanks[c.skill_id] || 0) < (c.min_skill_rank || 1)) return false;
          break;
      }
    }
    return true;
  }

  private startDialog() {
    const dialog = this.findDialogForNpc();

    if (!dialog) {
      // Fallback: generic greeting with leave option
      const lines = FALLBACK_GREETINGS[this.npcData.id] || ['...', 'Czego?'];
      const line = lines[Math.floor(Math.random() * lines.length)];
      this.currentDialog = {
        dialogId: '__fallback__',
        nodeId: 'start',
        npcLine: line,
        responses: [
          { id: 'r_quest', text: 'Masz jakieś zadanie?', actions: this.npcData.quest_ids?.[0] ? [{ type: 'start_quest', target: this.npcData.quest_ids[0] }] : undefined },
          { id: 'r_leave', text: 'Żegnaj.', is_leave: true }
        ].filter(r => r.actions || r.is_leave) as DialogResponse[],
        dialogFlags: this.dialogFlags
      };
      this.renderDialog();
      return;
    }

    const startNode = this.getNode(dialog, dialog.start_node);
    if (!startNode) {
      this.closeDialog();
      return;
    }

    // Execute node-level actions
    if (startNode.actions) this.executeActions(startNode.actions);

    this.currentDialog = {
      dialogId: dialog.id,
      nodeId: startNode.id,
      npcLine: startNode.npc_line,
      responses: startNode.responses || [],
      dialogFlags: this.dialogFlags
    };
    this.renderDialog();
  }

  private renderDialog() {
    if (!this.currentDialog) return;

    // Clean up buttons
    this.responseButtons.forEach(b => b.destroy());
    this.responseButtons = [];

    this.npcLineText.setText(`"${this.currentDialog.npcLine}"`);

    // Filter responses by conditions
    const available = this.currentDialog.responses.filter(r => this.evaluateConditions(r.conditions));

    available.forEach((resp, i) => {
      const y = 510 + i * 36;
      const bg = this.add.rectangle(100, y, 800, 30, 0x222222, 0.8)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x444444);
      const text = this.add.text(110, y, `${i + 1}. ${resp.text}`, {
        fontSize: '13px',
        color: resp.is_leave ? '#ff9999' : '#cccccc'
      }).setOrigin(0, 0.5);
      bg.on('pointerover', () => { bg.setFillStyle(0x333333); bg.setStrokeStyle(1, 0x888888); });
      bg.on('pointerout', () => { bg.setFillStyle(0x222222, 0.8); bg.setStrokeStyle(1, 0x444444); });
      bg.on('pointerdown', () => this.handleResponse(resp));
      // Number keys 1-9
      const num = i + 1;
      if (num <= 9) {
        const key = this.input.keyboard!.addKey(String(num));
        key.once('down', () => this.handleResponse(resp));
      }
      this.responseButtons.push(this.add.container(0, 0, [bg, text]));
    });
  }

  private handleResponse(response: DialogResponse) {
    if (response.actions) this.executeActions(response.actions);

    if (response.is_leave || !response.next_node) {
      this.closeDialog();
      return;
    }

    // Navigate to next node
    const dialogs = (this.gameScene.gameData as any)?.dialogues;
    const dialog = dialogs?.find((d: DialogData) => d.id === this.currentDialog?.dialogId);
    if (!dialog) { this.closeDialog(); return; }
    const nextNode = this.getNode(dialog, response.next_node);
    if (!nextNode) { this.closeDialog(); return; }

    if (nextNode.actions) this.executeActions(nextNode.actions);

    this.currentDialog = {
      dialogId: dialog.id,
      nodeId: nextNode.id,
      npcLine: nextNode.npc_line,
      responses: nextNode.responses || [],
      dialogFlags: this.dialogFlags
    };
    this.renderDialog();
  }

  private executeActions(actions: any[]) {
    const p = this.gameScene.player;
    const qs = this.gameScene.questSystem;
    for (const action of actions) {
      switch (action.type) {
        case 'start_quest':
          if (action.target && qs) {
            qs.startQuest(action.target);
            window.dispatchEvent(new CustomEvent('game:message', { detail: `Nowe zadanie!` }));
          }
          break;
        case 'complete_quest':
          if (action.target && qs) qs.advanceQuest(action.target);
          break;
        case 'set_quest_stage':
          // not implemented deeply — advance as needed
          break;
        case 'give_item':
          if (action.target) p.addToInventory(action.target, action.value as number || 1);
          break;
        case 'remove_item':
          if (action.target) p.removeFromInventory(action.target, action.value as number || 1);
          break;
        case 'set_flag':
          this.dialogFlags[action.target] = action.value ?? true;
          break;
        case 'clear_flag':
          delete this.dialogFlags[action.target];
          break;
        case 'change_reputation':
          if (action.target && action.value !== undefined) {
            p.reputation[action.target] = (p.reputation[action.target] || 0) + Number(action.value);
          }
          break;
        case 'heal_player':
          p.heal(action.value as number || 50);
          break;
        case 'close_dialog':
          this.closeDialog();
          return;
      }
    }
  }

  private closeDialog() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
