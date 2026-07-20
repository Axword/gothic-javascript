import Phaser from 'phaser';
import { MonsterData, AIState } from '../types';
import { Player } from './Player';
import { NPC } from './NPC';

export class Monster extends Phaser.Physics.Arcade.Sprite {
  public monsterData: MonsterData;
  public hp: number;
  public isAlive: boolean = true;
  
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private aiState: AIState = 'idle';
  private stateTimer: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private patrolCenter: { x: number; y: number };
  private patrolRadius: number = 120;
  private aggroRadius: number = 220;
  private hbWidth: number = 28;

  constructor(scene: Phaser.Scene, x: number, y: number, data: MonsterData) {
    const tex = scene.textures.exists(data.id) ? data.id : '__DEFAULT';
    super(scene, x, y, tex);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.monsterData = data;
    this.hp = data.stats.hp;
    this.patrolCenter = { x, y };
    const scale = data.scale || 1.0;
    this.setScale(scale);
    this.setOrigin(0.5, 0.9);
    this.setDepth(y);
    this.setCollideWorldBounds(true);
    this.setDrag(600);
    this.setMaxVelocity(200);

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dw = this.displayWidth * 0.35;
    const dh = this.displayHeight * 0.35;
    body.setSize(dw*2, dh*2);
    body.setOffset((this.displayWidth - dw*2)/2, this.displayHeight - dh*2);

    this.hbWidth = Math.max(20, 28*scale);
    this.healthBarBg = scene.add.rectangle(x, y - this.displayHeight - 8, this.hbWidth, 5, 0x333333).setDepth(y+2);
    this.healthBarBg.setVisible(false);
    this.healthBar = scene.add.rectangle(x - this.hbWidth/2, y - this.displayHeight - 8, this.hbWidth, 5, 0xff0000).setOrigin(0,0.5).setDepth(y+3);
    this.healthBar.setVisible(false);
  }

  update(delta: number, player: Player, _npcs: NPC[]) {
    // Paski życia podążają
    this.healthBar.setPosition(this.x - this.hbWidth/2, this.y - this.displayHeight - 8);
    this.healthBarBg.setPosition(this.x, this.y - this.displayHeight - 8);
    this.setDepth(this.y);
    this.healthBar.setDepth(this.depth+2);
    this.healthBarBg.setDepth(this.depth+1);

    if (!this.isAlive) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    this.stateTimer += delta;
    const isAggressive = (this.monsterData.behavior||[]).includes('aggressive');
    const aggroR = isAggressive ? this.aggroRadius : 140;

    switch (this.aiState) {
      case 'idle':
        if (this.stateTimer > 3000) {
          this.aiState = 'patrol'; this.stateTimer = 0;
          this.targetX = this.patrolCenter.x + Phaser.Math.Between(-this.patrolRadius, this.patrolRadius);
          this.targetY = this.patrolCenter.y + Phaser.Math.Between(-this.patrolRadius, this.patrolRadius);
        }
        if (dist < aggroR) { this.aiState = 'chase'; this.stateTimer = 0; this.healthBarBg.setVisible(true); this.healthBar.setVisible(true); }
        break;
      case 'patrol':
        this.moveToward(this.targetX, this.targetY, this.monsterData.stats.speed * 0.4);
        if (dist < aggroR) { this.aiState = 'chase'; this.stateTimer = 0; }
        if (this.stateTimer > 6000 || Phaser.Math.Distance.Between(this.x,this.y,this.targetX,this.targetY) < 12) {
          this.aiState = 'idle'; this.stateTimer = 0; this.halt();
        }
        break;
      case 'chase':
        this.moveToward(player.x, player.y, this.monsterData.stats.speed);
        if (dist < 36) { this.aiState = 'attack'; this.stateTimer = 0; }
        if (dist > 500) { this.aiState = 'return'; this.stateTimer = 0; }
        break;
      case 'attack':
        this.halt();
        const cd = this.monsterData.attacks?.[0]?.cooldown ?? 900;
        if (this.stateTimer > cd) { this.stateTimer = 0; this.performAttack(player); }
        if (dist > 44) { this.aiState = 'chase'; this.stateTimer = 0; }
        break;
      case 'return':
        this.moveToward(this.patrolCenter.x, this.patrolCenter.y, this.monsterData.stats.speed * 0.6);
        if (Phaser.Math.Distance.Between(this.x,this.y,this.patrolCenter.x,this.patrolCenter.y) < 20) {
          this.aiState = 'idle'; this.stateTimer = 0;
          this.healthBarBg.setVisible(false); this.healthBar.setVisible(false);
        }
        break;
    }
    if (this.healthBar.visible) this.healthBar.setScale(Math.max(0, this.hp / this.monsterData.stats.hp), 1);
    const b = this.body as Phaser.Physics.Arcade.Body;
    if (b && Math.abs(b.velocity.x) > 5) this.setFlipX(b.velocity.x < 0);
  }

  private moveToward(tx: number, ty: number, speed: number) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(Math.cos(angle)*speed, Math.sin(angle)*speed);
  }

  private halt() { const b = this.body as Phaser.Physics.Arcade.Body; if (b) b.setVelocity(0,0); }

  private performAttack(player: Player) {
    const dmg = this.monsterData.attacks?.[0]?.damage ?? 5;
    const actualDmg = player.takeDamage(dmg);
    this.setTint(0xff4040);
    this.scene.time.delayedCall(120, () => this.clearTint());
    window.dispatchEvent(new CustomEvent('game:playerHit', { detail: { damage: actualDmg } }));
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => this.clearTint());
    this.healthBarBg.setVisible(true); this.healthBar.setVisible(true);
    if (this.aiState === 'idle' || this.aiState === 'patrol' || this.aiState === 'return') { this.aiState = 'chase'; this.stateTimer = 0; }
    if (this.hp <= 0) {
      this.hp = 0; this.isAlive = false; this.setAlpha(0.6); this.halt();
      const b = this.body as Phaser.Physics.Arcade.Body; if (b) b.checkCollision.none = true;
      this.healthBar.destroy(); this.healthBarBg.destroy();
      return true;
    }
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
      case 'loot_crawler': items.push('plant_swamp_moss'); break;
    }
    return items;
  }

  destroy(fromScene?: boolean) {
    try { this.healthBar.destroy(); this.healthBarBg.destroy(); } catch {}
    super.destroy(fromScene);
  }
}
