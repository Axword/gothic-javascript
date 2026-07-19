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
  
  private bodySprite: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private dialogBubble: Phaser.GameObjects.Container | null = null;
  private moveTarget: { x: number; y: number } | null = null;
  private moveSpeed: number = 40;
  private scheduleIndex: number = 0;
  private scheduleTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, data: NpcData) {
    super(scene, x, y);
    this.npcData = data;
    this.hp = data.stats?.hp || 30;
    this.faction = data.faction;
    
    // Kolory frakcji
    let bodyColor = 0x888888;
    if (data.faction === 'old_order') bodyColor = 0x4444aa;
    else if (data.faction === 'new_order') bodyColor = 0xaa4444;
    else if (data.faction === 'bandit') bodyColor = 0x664422;
    
    // Ciało NPC
    this.bodySprite = scene.add.rectangle(0, 0, 18, 26, bodyColor);
    this.add(this.bodySprite);
    
    // Głowa
    const headColor = data.gender === 'female' ? 0xd4a574 : 0xc4956a;
    const head = scene.add.rectangle(0, -15, 12, 12, headColor);
    this.add(head);
    
    // Etykieta
    this.label = scene.add.text(0, -28, data.name, {
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.label);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 26);
    body.setOffset(-9, -13);
    body.setCollideWorldBounds(true);
    
    // Podświetlenie interakcji
    this.setSize(32, 32);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => {
      this.bodySprite.setStrokeStyle(2, 0xffff00);
    });
    this.on('pointerout', () => {
      this.bodySprite.setStrokeStyle(0);
    });
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
    this.bodySprite.destroy();
    super.destroy();
  }
}
