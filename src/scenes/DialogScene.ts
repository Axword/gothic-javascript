import Phaser from 'phaser';
import { NpcData } from '../types';
import { GameScene } from './GameScene';

interface DialogState {
  nodeId: string;
  npcLine: string;
  responses: Array<{
    id: string;
    text: string;
    nextNode: string | null;
    isLeave: boolean;
    actions?: any[];
    conditions?: any[];
  }>;
}

export class DialogScene extends Phaser.Scene {
  private npcData!: NpcData;
  private gameScene!: GameScene;
  private currentDialog: DialogState | null = null;
  private dialogBg!: Phaser.GameObjects.Rectangle;
  private npcNameText!: Phaser.GameObjects.Text;
  private npcLineText!: Phaser.GameObjects.Text;
  private responseButtons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'DialogScene' });
  }

  init(data: { npcData: NpcData; gameScene: GameScene }) {
    this.npcData = data.npcData;
    this.gameScene = data.gameScene;
  }

  create() {
    // Przyciemnienie w tle
    this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.5);
    
    // Panel dialogowy
    this.dialogBg = this.add.rectangle(512, 550, 900, 300, 0x1a1a1a, 0.95);
    this.dialogBg.setStrokeStyle(2, 0x444444);
    
    // Nazwa NPC
    this.npcNameText = this.add.text(80, 420, this.npcData.name, {
      fontSize: '16px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    // Tekst NPC
    this.npcLineText = this.add.text(80, 450, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 800 }
    });
    
    // Zamknij ESC
    this.input.keyboard!.on('keydown-ESC', () => {
      this.closeDialog();
    });
    
    // Rozpocznij pierwszy dialog
    this.startDialog();
  }

  private startDialog() {
    // W prawdziwej grze: wczytaj z dialogues.json
    // Na razie: generyczny dialog
    const greetings: Record<string, string[]> = {
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
      'npc_old_guard_1': ['Stać! A, to ty. Przechodź.', 'Nudna służba. Nawet bandyci mają dziś wolne.'],
      'npc_old_guard_2': ['Patrol, patrol, patrol. Żeby choć raz coś się działo.', 'Nie widziałeś tu włóczęgów?'],
      'npc_exile_leader': ['Myślisz, że jesteś lepszy? Też tu zgniłjesz.', 'Wygnanie to wolność, której nikt nie rozumie.'],
      'npc_exile_fighter': ['Kolejny ochotnik do grobu?', 'Miecz sam nie chodzi. Trzeba nim machać.'],
      'npc_old_prisoner': ['Wypuść mnie... Proszę... zrobię wszystko.', 'Nie jestem winny. Nikt tu nie jest winny.'],
      'npc_free_fighter_1': ['Waligóra nie gada. Waligóra robi.', 'Staniesz po stronie Wolnych? To udowodnij.'],
      'npc_old_merchant': ['Towar pierwszej klasy! No, może drugiej.', 'Zobacz, co mam. Palce lizać, mówię ci.'],
      'npc_free_merchant': ['Dla ciebie specjalna cena. Dla Straży - podwójna.', 'Kupujesz czy oglądasz? Nie mam całego dnia.'],
    };
    
    const npcLines = greetings[this.npcData.id] || ['...', 'Czego?'];
    const line = npcLines[Math.floor(Math.random() * npcLines.length)];
    
    this.currentDialog = {
      nodeId: 'start',
      npcLine: line,
      responses: [
        { id: 'r1', text: 'Opowiedz o sobie.', nextNode: null, isLeave: false },
        { id: 'r2', text: 'Masz jakieś zadanie?', nextNode: null, isLeave: false,
          actions: [{ type: 'start_quest', target: this.npcData.quest_ids?.[0] }] 
        },
        { id: 'r_leave', text: 'Żegnaj.', nextNode: null, isLeave: true }
      ]
    };
    
    this.renderDialog();
  }

  private renderDialog() {
    if (!this.currentDialog) return;
    
    // Wyczyść stare przyciski
    this.responseButtons.forEach(b => b.destroy());
    this.responseButtons = [];
    
    // Tekst NPC
    this.npcLineText.setText(`"${this.currentDialog.npcLine}"`);
    
    // Przyciski odpowiedzi
    this.currentDialog.responses.forEach((resp, i) => {
      const y = 510 + i * 40;
      
      const bg = this.add.rectangle(100, y, 800, 32, 0x222222, 0.8)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0x444444);
      
      const text = this.add.text(110, y, `${i + 1}. ${resp.text}`, {
        fontSize: '13px',
        color: resp.isLeave ? '#ff6666' : '#cccccc'
      }).setOrigin(0, 0.5);
      
      bg.on('pointerover', () => {
        bg.setFillStyle(0x333333);
        bg.setStrokeStyle(1, 0x888888);
      });
      
      bg.on('pointerout', () => {
        bg.setFillStyle(0x222222, 0.8);
        bg.setStrokeStyle(1, 0x444444);
      });
      
      bg.on('pointerdown', () => {
        this.handleResponse(resp);
      });
      
      this.responseButtons.push(this.add.container(0, 0, [bg, text]));
    });
  }

  private handleResponse(response: any) {
    if (response.actions) {
      for (const action of response.actions) {
        this.executeAction(action);
      }
    }
    
    if (response.isLeave || response.nextNode === null) {
      this.closeDialog();
    } else {
      // W pełnej implementacji: przejdź do następnego węzła
      this.closeDialog();
    }
  }

  private executeAction(action: any) {
    switch (action.type) {
      case 'start_quest':
        const event = new CustomEvent('game:message', { 
          detail: `Nowe zadanie: ${action.target}` 
        });
        window.dispatchEvent(event);
        break;
      case 'give_item':
        if (this.gameScene?.player) {
          this.gameScene.player.addToInventory(action.target);
        }
        break;
      case 'remove_item':
        if (this.gameScene?.player) {
          this.gameScene.player.removeFromInventory(action.target);
        }
        break;
      case 'set_flag':
        break; // Do implementacji z systemem flag
    }
  }

  private closeDialog() {
    // Wznów główną scenę
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
