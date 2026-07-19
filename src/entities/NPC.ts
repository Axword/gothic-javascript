import Phaser from 'phaser';
import { NpcData, Faction } from '../types';
import { Player } from './Player';
import { GameScene } from '../scenes/GameScene';

export class NPC extends Phaser.GameObjects.Container {
  public npcData: NpcData;
  public hp: number;
  public isAlive: boolean = true;
  public faction: Faction;
  public isHostile: boolean = false;
  
  private sprite!: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;
  private dialogBubble: Phaser.GameObjects.Container | null = null;
  private moveTarget: { x: number; y: number } | null = null;
  private moveSpeed: number = 40;
  private scheduleIndex: number = 0;
  private scheduleTimer: number = 0;

  private getTextureKey(): string {
    if (this.npcData.is_merchant) return 'char_merchant';
    if (this.faction === 'old_order') {
      if (this.npcData.role?.toLowerCase().includes('komendant') || this.npcData.role?.toLowerCase().includes('dowódca')) return 'char_old_commander';
      if (this.npcData.gender === 'female') return 'char_old_guard_f';
      return 'char_old_guard';
    }
    if (this.faction === 'new_order') {
      if (this.npcData.title === 'Sęp' || this.npcData.role?.toLowerCase().includes('przywódca')) return 'char_new_leader';
      if (this.npcData.gender === 'female') return 'char_new_fighter_f';
      return 'char_new_fighter';
    }
    if (this.faction === 'bandit') return 'char_bandit';
    if (this.npcData.gender === 'female') return 'char_female';
    return 'char_neutral';
  }

  constructor(scene: Phaser.Scene, x: number, y: number, data: NpcData) {
    super(scene, x, y);
    this.npcData = data;
    this.hp = data.stats?.hp || 30;
    this.faction = data.faction;
    
    // Use sprite texture
    const texKey = this.getTextureKey();
    if (scene.textures.exists(texKey)) {
      this.sprite = scene.add.image(0, 0, texKey, 0);
      this.sprite.setOrigin(0.5, 0.5);
    } else {
      // Fallback colored rect
      const colors: Record<string, number> = { old_order: 0x4444aa, new_order: 0xaa4444, neutral: 0x888888, bandit: 0x664422 };
      const rect = scene.add.rectangle(0, 0, 18, 26, colors[data.faction] || 0x888888);
      this.add(rect);
      this.sprite = rect as any;
    }
    this.add(this.sprite);
    
    // Label
    this.label = scene.add.text(0, -28, data.name, {
      fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.label);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 26);
    body.setOffset(-9, -13);
    body.setCollideWorldBounds(true);
    
    this.setSize(32, 32);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => { this.sprite.setTint(0xffff88); });
    this.on('pointerout', () => { this.sprite.clearTint(); });
  }

  update(delta: number, player: Player) {
    if (!this.isAlive) return;
    
    // Zachowanie harmonogramu (uproszczone)
    this.scheduleTimer += delta;
    if (this.scheduleTimer > 5000) {
      this.scheduleTimer = 0;
      this.followSchedule();
    }
    
    // Reakcja na gracza w pobliżu
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 100) {
      // NPC patrzy w stronę gracza
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      // Upraszczamy - etykieta z przywitaniem
      this.showDialogBubble('...', 2000);
    }
  }

  private followSchedule() {
    // Uproszczone poruszanie się po harmonogramie
    const schedule = this.npcData.schedules;
    if (!schedule || schedule.length === 0) return;
    
    // Teleport między lokacjami (uproszczenie)
    // W pełnej wersji: pathfinding do pozycji
  }

  private showDialogBubble(text: string, duration: number = 2000) {
    if (this.dialogBubble) {
      this.dialogBubble.destroy();
    }
    
    this.dialogBubble = this.scene.add.container(0, -40);
    const bg = this.scene.add.rectangle(0, 0, text.length * 6 + 10, 18, 0x000000, 0.7);
    const txt = this.scene.add.text(0, 0, text, {
      fontSize: '8px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    this.dialogBubble.add([bg, txt]);
    this.add(this.dialogBubble);
    
    this.scene.time.delayedCall(duration, () => {
      if (this.dialogBubble) {
        this.dialogBubble.destroy();
        this.dialogBubble = null;
      }
    });
  }

  interact(scene: GameScene) {
    // Otwórz dialog
    scene.scene.launch('DialogScene', {
      npcData: this.npcData,
      gameScene: scene
    });
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      this.setAlpha(0.5);
      return true; // dead
    }
    return false;
  }

  destroy() {
    this.label.destroy();
    this.sprite.destroy();
    super.destroy();
  }
}
