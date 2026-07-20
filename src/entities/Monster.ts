import Phaser from 'phaser';
import { MonsterData, AIState } from '../types';
import { Player } from './Player';
import { NPC } from './NPC';

export class Monster extends Phaser.GameObjects.Container {
  public monsterData: MonsterData;
  public hp: number;
  public isAlive: boolean = true;
  
  private sprite!: Phaser.GameObjects.Image;
  private healthBar: Phaser.GameObjects.Rectangle;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private aiState: AIState = 'idle';
  private stateTimer: number = 0;
  private targetX: number = 0;
  private targetY: number = 0;
  private patrolCenter: { x: number; y: number };
  private patrolRadius: number = 120;
  private aggroRadius: number = 220;

  constructor(scene: Phaser.Scene, x: number, y: number, data: MonsterData) {
    super(scene, x, y);
    this.monsterData = data;
    this.hp = data.stats.hp;
    this.patrolCenter = { x, y };

    const scale = data.scale || 1.0;
    
    // Rozmiary per potwór
    const spriteSizeMap: Record<string, {w:number;h:number;hw:number;hh:number}> = {
      'monster_grey_wolf': { w: 64, h: 48, hw: 20, hh: 14 },
      'monster_forest_boar': { w: 72, h: 56, hw: 24, hh: 16 },
      'monster_marsh_crawler': { w: 56, h: 56, hw: 18, hh: 14 },
      'monster_mutant': { w: 72, h: 72, hw: 22, hh: 22 },
      'monster_sand_wyrm': { w: 80, h: 56, hw: 28, hh: 16 },
      'monster_shade': { w: 56, h: 72, hw: 18, hh: 22 },
    };
    const sz = spriteSizeMap[data.id] || { w: 48, h: 48, hw: 18, hh: 16 };
    this.hw = sz.hw * scale;
    this.hh = sz.hh * scale;

    if (scene.textures.exists(data.id)) {
      this.sprite = scene.make.image({ key: data.id, add: false }) as Phaser.GameObjects.Image;
      this.sprite.setOrigin(0.5, 0.95);
      this.sprite.setDisplaySize(sz.w * scale, sz.h * scale);
    } else {
      const fb = scene.add.rectangle(0, -sz.hh, 24*scale, 24*scale, 0x884422);
      this.sprite = fb as any;
    }
    this.add(this.sprite);

    // Cień
    const shadow = scene.add.ellipse(0, 2, sz.w*0.35*scale, 6*scale, 0x000000, 0.4);
    shadow.setOrigin(0.5, 1);
    this.add(shadow);
    
    // Health bar
    const hbWidth = 28 * scale;
    this.healthBarBg = scene.add.rectangle(0, -sz.h*scale - 6, hbWidth, 5, 0x333333);
    this.healthBarBg.setVisible(false);
    this.add(this.healthBarBg);
    this.healthBar = scene.add.rectangle(-hbWidth/2, -sz.h*scale - 6, hbWidth, 5, 0xff0000);
    this.healthBar.setOrigin(0, 0.5);
    this.healthBar.setVisible(false);
    this.add(this.healthBar);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setSize(this.hw*2, this.hh*2);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.hw*2, this.hh*2);
    body.setOffset(-this.hw, -this.hh*2);
    body.setCollideWorldBounds(true);
    body.setDrag(600);
    body.setMaxSpeed(240);
  }

  private hw: number;
  private hh: number;

  update(delta: number, player: Player, npcs: NPC[]) {
    if (!this.isAlive) return;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, this.y);
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
        if (dist < aggroR) {
          this.aiState = 'chase'; this.stateTimer = 0;
          this.healthBarBg.setVisible(true); this.healthBar.setVisible(true);
        }
        break;
      case 'patrol':
        this.moveToward(this.targetX, this.targetY, this.monsterData.stats.speed * 0.4);
        if (dist < aggroR) { this.aiState = 'chase'; this.stateTimer = 0; }
        if (this.stateTimer > 6000 || Phaser.Math.Distance.Between(this.x, this.y,this.targetX,this.targetY) < 12) {
          this.aiState = 'idle'; this.stateTimer = 0; this.stop();
        }
        break;
      case 'chase':
        this.moveToward(player.x, player.y, this.monsterData.stats.speed);
        if (dist < 36) { this.aiState = 'attack'; this.stateTimer = 0; }
        if (dist > 500) { this.aiState = 'return'; this.stateTimer = 0; }
        break;
      case 'attack':
        this.stop();
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
    if (this.healthBar.visible) {
      const ratio = Math.max(0, this.hp / this.monsterData.stats.hp);
      this.healthBar.setScale(ratio, 1);
    }
    // Spójrz w stronę ruchu
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const vx = body.velocity.x;
      if (Math.abs(vx) > 5) this.sprite.setFlipX(vx < 0);
    }
  }

  private moveToward(tx: number, ty: number, speed: number) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, tx, ty);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private stop() { const b = this.body as Phaser.Physics.Arcade.Body; if (b) b.setVelocity(0, 0); }

  private performAttack(player: Player) {
    const dmg = this.monsterData.attacks?.[0]?.damage ?? 5;
    const actualDmg = player.takeDamage(dmg);
    (this.sprite as any).setTint?.(0xff4040);
    this.scene.time.delayedCall(120, () => (this.sprite as any).clearTint?.());
    window.dispatchEvent(new CustomEvent('game:playerHit', { detail: { damage: actualDmg } }));
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    (this.sprite as any).setTint?.(0xffffff);
    this.scene.time.delayedCall(100, () => (this.sprite as any).clearTint?.());
    this.healthBarBg.setVisible(true); this.healthBar.setVisible(true);
    if (this.aiState === 'idle' || this.aiState === 'patrol' || this.aiState === 'return') {
      this.aiState = 'chase'; this.stateTimer = 0;
    }
    if (this.hp <= 0) {
      this.hp = 0; this.isAlive = false;
      this.sprite.setAlpha(0.6);
      this.stop();
      // Wyłącz kolizje żeby nie blokował gracza
      const b = this.body as Phaser.Physics.Arcade.Body;
      if (b) b.checkCollision.none = true;
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

  destroy() {
    try { this.sprite.destroy(); this.healthBar.destroy(); this.healthBarBg.destroy(); } catch {}
    super.destroy();
  }
}
