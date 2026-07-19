/**
 * System rzucania pocisków (łuk, magia)
 */
export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  damageType: 'physical' | 'fire' | 'ice';
  graphic: Phaser.GameObjects.Arc;
  lifetime: number;
  pierce: boolean;
  owner: 'player' | 'enemy';
}

export class ProjectileSystem {
  private projectiles: Projectile[] = [];
  private scene: Phaser.Scene;
  private nextId: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  fire(
    x: number, y: number, tx: number, ty: number,
    speed: number, damage: number, damageType: 'physical' | 'fire' | 'ice',
    owner: 'player' | 'enemy', pierce: boolean = false
  ): Projectile {
    const angle = Phaser.Math.Angle.Between(x, y, tx, ty);
    const color = damageType === 'fire' ? 0xff4400 : damageType === 'ice' ? 0x44aaff : 0xcccc88;
    const size = damageType === 'physical' ? 3 : 5;
    
    const graphic = this.scene.add.circle(x, y, size, color);
    graphic.setDepth(50);
    
    // Strzała ma kształt linii
    if (damageType === 'physical') {
      graphic.setStrokeStyle(1, 0x886644);
    } else if (damageType === 'fire') {
      this.scene.tweens.add({
        targets: graphic,
        scaleX: 1.5, scaleY: 1.5,
        duration: 150,
        yoyo: true,
        repeat: -1
      });
    } else {
      // Ice - migotanie
      this.scene.tweens.add({
        targets: graphic,
        alpha: 0.6,
        duration: 100,
        yoyo: true,
        repeat: -1
      });
    }

    const p: Projectile = {
      id: `proj_${this.nextId++}`,
      x, y, targetX: tx, targetY: ty,
      speed, damage, damageType,
      graphic, lifetime: 3000,
      pierce, owner
    };
    this.projectiles.push(p);
    return p;
  }

  update(delta: number, checkHit: (p: Projectile) => boolean): Projectile[] {
    const hits: Projectile[] = [];
    const toRemove: string[] = [];

    for (const p of this.projectiles) {
      const angle = Phaser.Math.Angle.Between(p.x, p.y, p.targetX, p.targetY);
      const moveAmount = p.speed * (delta / 1000);
      p.x += Math.cos(angle) * moveAmount;
      p.y += Math.sin(angle) * moveAmount;
      p.lifetime -= delta;

      // Update graphic
      p.graphic.setPosition(p.x, p.y);
      if (p.damageType === 'physical') {
        p.graphic.setRotation(angle);
      }

      // Check hit
      if (checkHit(p)) {
        hits.push(p);
        if (!p.pierce) {
          toRemove.push(p.id);
        }
      }

      // Lifetime expired or out of range
      if (p.lifetime <= 0) {
        toRemove.push(p.id);
      }
      
      // Out of camera bounds cleanup
      const cam = this.scene.cameras.main;
      if (p.x < cam.scrollX - 100 || p.x > cam.scrollX + cam.width + 100 ||
          p.y < cam.scrollY - 100 || p.y > cam.scrollY + cam.height + 100) {
        toRemove.push(p.id);
      }
    }

    // Remove dead projectiles
    for (const id of toRemove) {
      const idx = this.projectiles.findIndex(p => p.id === id);
      if (idx >= 0) {
        this.projectiles[idx].graphic.destroy();
        this.projectiles.splice(idx, 1);
      }
    }

    return hits;
  }

  getProjectiles(): Projectile[] {
    return [...this.projectiles];
  }

  destroy() {
    for (const p of this.projectiles) {
      p.graphic.destroy();
    }
    this.projectiles = [];
  }
}
