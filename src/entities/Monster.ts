import Phaser from 'phaser';
import { MonsterData, AIState } from '../types';
import { Player } from './Player';
import { NPC } from './NPC';

export class Monster extends Phaser.GameObjects.Container {
  public monsterData: MonsterData;
  public hp: number;
  public isAlive: boolean = true;
  
  private sprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private healthBar: Phaser.GameObjects.Rectangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private aiState: AIState = 'idle';
  private stateTimer: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private patrolCenter: { x: number; y: number };
  private patrolRadius: number = 100;

  constructor(scene: Phaser.Scene, x: number, y: number, data: MonsterData) {
    super(scene, x, y);
    this.monsterData = data;
    this.hp = data.stats.hp;
    this.patrolCenter = { x, y };
    
    const size = (data.scale || 1) * 12;
    
    // Try to use texture, fallback to rect
    if (scene.textures.exists(data.id)) {
      this.sprite = scene.add.image(0, 0, data.id);
      this.sprite.setOrigin(0.5, 0.5);
    } else {
      const colorMap: Record<string, number> = {
        'monster_grey_wolf': 0x888888, 'monster_forest_boar': 0x664422,
        'monster_marsh_crawler': 0x445533, 'monster_mutant': 0x884422,
        'monster_sand_wyrm': 0x887755, 'monster_shade': 0x222244,
      };
      this.sprite = scene.add.rectangle(0, 0, size * 2, size * 2, colorMap[data.id] || 0x666666);
    }
    this.add(this.sprite);
    
    // Health bar
    this.healthBarBg = scene.add.rectangle(0, -size - 5, 24, 4, 0x333333);
    this.healthBarBg.setVisible(false);
    this.add(this.healthBarBg);
    this.healthBar = scene.add.rectangle(-12, -size - 5, 24, 4, 0xff0000);
    this.healthBar.setOrigin(0, 0.5);
    this.healthBar.setVisible(false);
    this.add(this.healthBar);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(size * 2, size * 2);
    body.setOffset(-size, -size);
    body.setCollideWorldBounds(true);
  }

  update(delta: number, player: Player, npcs: NPC[]) {
    if (!this.isAlive) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.stateTimer += delta;
    
    switch (this.aiState) {
      case 'idle':
        if (this.stateTimer > 3000) {
          this.aiState = 'patrol'; this.stateTimer = 0;
          this.targetX = this.patrolCenter.x + Phaser.Math.Between(-this.patrolRadius, this.patrolRadius);
          this.targetY = this.patrolCenter.y + Phaser.Math.Between(-this.patrolRadius, this.patrolRadius);
        }
        if (dist < (this.monsterData.behavior.includes('aggressive') ? 200 : 120)) {
          this.aiState = 'chase'; this.stateTimer = 0;
          this.healthBarBg.setVisible(true); this.healthBar.setVisible(true);
        }
        break;
      case 'patrol':
        this.moveToward(this.targetX, this.targetY, this.monsterData.stats.speed * 0.5);
        if (dist < 200 && this.monsterData.behavior.includes('aggressive')) { this.aiState = 'chase'; this.stateTimer = 0; }
        if (this.stateTimer > 5000 || Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY) < 10) {
          this.aiState = 'idle'; this.stateTimer = 0; this.stop();
        }
        break;
      case 'chase':
        this.moveToward(player.x, player.y, this.monsterData.stats.speed);
        if (dist < 32) { this.aiState = 'attack'; this.stateTimer = 0; }
        if (dist > 400) { this.aiState = 'return'; this.stateTimer = 0; }
        break;
      case 'attack':
        this.stop();
        if (this.stateTimer > this.monsterData.attacks[0].cooldown) { this.stateTimer = 0; this.performAttack(player); }
        if (dist > 40) { this.aiState = 'chase'; this.stateTimer = 0; }
        break;
      case 'return':
        this.moveToward(this.patrolCenter.x, this.patrolCenter.y, this.monsterData.stats.speed * 0.7);
        if (Phaser.Math.Distance.Between(this.x, this.y, this.patrolCenter.x, this.patrolCenter.y) < 20) {
          this.aiState = 'idle'; this.stateTimer = 0;
          this.healthBarBg.setVisible(false); this.healthBar.setVisible(false);
        }
        break;
    }
    if (this.healthBar.visible) { this.healthBar.setScale(Math.max(0, this.hp / this.monsterData.stats.hp), 1); }
  }

  private moveToward(tx: number, ty: number, speed: number) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private stop() { const b = this.body as Phaser.Physics.Arcade.Body; if (b) b.setVelocity(0, 0); }

  private performAttack(player: Player) {
    const dmg = this.monsterData.attacks[0].damage;
    const actualDmg = player.takeDamage(dmg);
    (this.sprite as any).setTint?.(0xff0000);
    this.scene.time.delayedCall(100, () => (this.sprite as any).clearTint?.());
    window.dispatchEvent(new CustomEvent('game:playerHit', { detail: { damage: actualDmg } }));
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    (this.sprite as any).setTint?.(0xffffff);
    this.scene.time.delayedCall(100, () => (this.sprite as any).clearTint?.());
    this.healthBarBg.setVisible(true); this.healthBar.setVisible(true);
    if (this.hp <= 0) {
      this.hp = 0; this.isAlive = false; this.sprite.setAlpha(0.5);
      this.aiState = 'idle'; this.stop(); return true;
    }
    if (this.aiState === 'idle' || this.aiState === 'patrol') { this.aiState = 'chase'; this.stateTimer = 0; }
    return false;
  }

  getLoot(): string[] {
    const items: string[] = ['misc_gold'];
    switch(this.monsterData.loot_table) {
      case 'loot_wolf': items.push('misc_skins_wolf'); break;
      case 'loot_boar': items.push('misc_skins_boar'); break;
      case 'loot_mutant': items.push('misc_trophy_mutant_eye'); break;
      case 'loot_wyrm': items.push('misc_trophy_wyrm_scale'); break;
      case 'loot_shade': items.push('plant_grave_moss'); break;
    }
    return items;
  }

  destroy() { this.sprite.destroy(); this.healthBar.destroy(); this.healthBarBg.destroy(); super.destroy(); }
}
