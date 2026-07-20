import Phaser from 'phaser';
import { NpcData, Faction, ScheduleEntry } from '../types';
import { Player } from './Player';
import { GameScene } from '../scenes/GameScene';
import { TimeSystem } from '../systems/TimeSystem';

export class NPC extends Phaser.GameObjects.Container {
  public npcData: NpcData;
  public hp: number;
  public isAlive: boolean = true;
  public faction: Faction;
  public isHostile: boolean = false;
  public scheduleEntries: ScheduleEntry[] = [];

  private sprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private dialogBubble: Phaser.GameObjects.Container | null = null;
  private moveTarget: { x: number; y: number } | null = null;
  private moveSpeed: number = 40;
  private scheduleTimer: number = 0;
  private currentActivity: string = 'idle';
  private home: { x: number; y: number };

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
    this.home = { x, y };

    const texKey = this.getTextureKey();
    if (scene.textures.exists(texKey)) {
      this.sprite = scene.add.image(0, 0, texKey, 0);
      (this.sprite as Phaser.GameObjects.Image).setOrigin(0.5, 0.5);
    } else {
      const colors: Record<string, number> = {
        old_order: 0x4444aa, new_order: 0xaa4444, neutral: 0x888888, bandit: 0x664422, monster: 0x555555
      };
      const rect = scene.add.rectangle(0, 0, 18, 26, colors[data.faction] || 0x888888);
      this.add(rect);
      this.sprite = rect;
    }
    this.add(this.sprite);
    this.setScale(1.3);

    this.label = scene.add.text(0, -34, data.name, {
      fontSize: '10px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.add(this.label);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 22);
    body.setOffset(-9, -14);
    body.setCollideWorldBounds(true);

    this.setSize(32, 32);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerover', () => { (this.sprite as any).setTint?.(0xffff88); });
    this.on('pointerout', () => { (this.sprite as any).clearTint?.(); });

    // Load schedule entries (BUG-006)
    this.loadSchedules();
  }

  private loadSchedules() {
    const scene = this.scene as GameScene;
    const gameData = (scene as any).gameData;
    if (!gameData?.npc_schedules) return;
    const matches = gameData.npc_schedules.filter((s: any) => s.npc_id === this.npcData.id);
    if (matches.length === 0) return;
    for (const s of matches) {
      // Accept either "schedule" or "entries" field
      const list = s.schedule || s.entries;
      if (Array.isArray(list)) this.scheduleEntries.push(...list);
    }
  }

  update(delta: number, player: Player, timeSystem?: TimeSystem) {
    if (!this.isAlive) return;

    // Simple hostile AI: chase player if hostile
    if (this.isHostile) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (d > 25) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const b = this.body as Phaser.Physics.Arcade.Body;
        if (b) b.setVelocity(Math.cos(angle) * this.moveSpeed * 1.5, Math.sin(angle) * this.moveSpeed * 1.5);
      } else {
        // Attack
        const b = this.body as Phaser.Physics.Arcade.Body;
        if (b) b.setVelocity(0, 0);
        const now = this.scene.time.now;
        if (!(this as any).lastAttack || now - (this as any).lastAttack > 1200) {
          (this as any).lastAttack = now;
          const dmg = this.npcData.stats?.strength ? Math.max(2, Math.floor(this.npcData.stats.strength / 2)) : 3;
          const actualDmg = player.takeDamage(dmg);
          window.dispatchEvent(new CustomEvent('game:playerHit', { detail: { damage: actualDmg } }));
          const gs = this.scene as GameScene;
          if (!player.isAlive) gs.onPlayerDeath();
        }
      }
      return;
    }

    // Schedule-driven movement (BUG-006)
    this.scheduleTimer += delta;
    if (this.scheduleTimer > 2500) {
      this.scheduleTimer = 0;
      this.followSchedule(timeSystem);
    }

    if (this.moveTarget) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
      if (d < 6) {
        this.moveTarget = null;
        const b = this.body as Phaser.Physics.Arcade.Body;
        if (b) b.setVelocity(0, 0);
      } else {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.moveTarget.x, this.moveTarget.y);
        const b = this.body as Phaser.Physics.Arcade.Body;
        if (b) b.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
      }
    } else {
      // Idle bob / small wander around home
      if (Math.random() < 0.02) {
        const rx = this.home.x + Phaser.Math.Between(-30, 30);
        const ry = this.home.y + Phaser.Math.Between(-30, 30);
        this.moveTarget = { x: rx, y: ry };
      } else {
        const b = this.body as Phaser.Physics.Arcade.Body;
        if (b && Math.abs(b.velocity.x) < 1 && Math.abs(b.velocity.y) < 1) {
          b.setVelocity(0, 0);
        }
      }
    }

    // Greeting bubble when player gets near
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (dist < 60 && dist > 30 && !this.dialogBubble) {
      this.showDialogBubble('...', 1500);
    }
  }

  private followSchedule(timeSystem?: TimeSystem) {
    if (this.scheduleEntries.length === 0) return;
    // Pick schedule entry matching current time
    const t = timeSystem ? timeSystem.getTimeOfDay() : 36000;
    let entry: ScheduleEntry | null = null;
    for (const e of this.scheduleEntries) {
      const start = e.time.start;
      let end = e.time.end;
      if (end < start) {
        // crosses midnight
        if (t >= start || t < end) { entry = e; break; }
      } else {
        if (t >= start && t < end) { entry = e; break; }
      }
    }
    if (!entry) return;
    this.currentActivity = entry.activity;
    // Use fallback_position if position's location isn't loaded (simplified: always use schedule position with fallback)
    const pos = entry.position || entry.fallback_position;
    if (pos) {
      // Positions are world coordinates in data; game uses multiplied spawn positions so keep consistency
      this.moveTarget = { x: pos.x * 2, y: pos.y * 2 };
    }
  }

  private showDialogBubble(text: string, duration: number = 2000) {
    if (this.dialogBubble) {
      this.dialogBubble.destroy();
    }

    this.dialogBubble = this.scene.add.container(0, -40);
    const bg = this.scene.add.rectangle(0, 0, Math.max(40, text.length * 6 + 10), 18, 0x000000, 0.7);
    const txt = this.scene.add.text(0, 0, text, { fontSize: '8px', color: '#ffffff' }).setOrigin(0.5);

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
    // Stop NPC movement while talking
    this.moveTarget = null;
    const b = this.body as Phaser.Physics.Arcade.Body;
    if (b) b.setVelocity(0, 0);

    // Check if NPC can train player -> open trainer dialog (simple)
    if (this.npcData.is_trainer || this.npcData.teaching) {
      const trainers = scene.gameData.trainers || [];
      const trainer = trainers.find((t: any) => t.npc_id === this.npcData.id);
      if (trainer) {
        this.openTrainerDialog(scene, trainer);
        return;
      }
    }

    // Check if NPC is faction leader for join
    if (this.npcData.id === 'npc_old_komendant' || this.npcData.id === 'npc_free_sep') {
      const targetFaction = this.npcData.id === 'npc_old_komendant' ? 'old_order' : 'new_order';
      const q = scene.questSystem.getQuestState('quest_main_arrival');
      // Offer to join faction if at stage_choice
      if (q && (q.current_stage === 'stage3' || q.current_stage === 'stage_choice') && !scene.player.faction) {
        this.openJoinDialog(scene, targetFaction as 'old_order' | 'new_order');
        return;
      }
    }

    scene.scene.launch('DialogScene', {
      npcData: this.npcData,
      gameScene: scene
    });
  }

  private openTrainerDialog(scene: GameScene, trainer: any) {
    const cx = scene.cameras.main.width / 2 / scene.cameras.main.zoom;
    const cy = scene.cameras.main.height / 2 / scene.cameras.main.zoom;
    scene.scene.pause('GameScene');
    const cont = scene.add.container(this.x, this.y - 60);
    const bg = scene.add.rectangle(0, 0, 360, 80 + trainer.skills.length * 36, 0x1a1a1a, 0.95).setStrokeStyle(2, 0x666666);
    cont.add(bg);
    cont.add(scene.add.text(0, -bg.height / 2 + 20, trainer.name, { fontSize: '14px', color: '#ffcc00' }).setOrigin(0.5));
    let y = -bg.height / 2 + 45;
    const buttons: Phaser.GameObjects.Rectangle[] = [];
    trainer.skills.forEach((sk: any, i: number) => {
      const cur = scene.player.skillRanks[sk.skill_id] || 0;
      const text = `${sk.skill_name} (ranga ${cur}/${sk.max_rank}) - ${sk.cost_per_rank.gold}zł, ${sk.cost_per_rank.skill_points}pn`;
      const rect = scene.add.rectangle(0, y, 320, 28, 0x333333).setStrokeStyle(1, 0x666666);
      const txt = scene.add.text(0, y, text, { fontSize: '10px', color: '#cccccc' }).setOrigin(0.5);
      cont.add([rect, txt]);
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => {
        const res = scene.trainSkill(sk.skill_id, sk.cost_per_rank, sk.max_rank);
        window.dispatchEvent(new CustomEvent('game:message', { detail: res.ok ? `Nauczono: ${sk.skill_name}` : (res.reason || 'Nie można') }));
        if (res.ok) {
          cont.destroy();
          scene.scene.resume('GameScene');
        }
      });
      buttons.push(rect);
      y += 36;
    });
    const closeRect = scene.add.rectangle(0, bg.height / 2 - 20, 120, 26, 0x553333).setStrokeStyle(1, 0x886666);
    const closeTxt = scene.add.text(0, bg.height / 2 - 20, 'Zamknij', { fontSize: '11px', color: '#ffffff' }).setOrigin(0.5);
    cont.add([closeRect, closeTxt]);
    closeRect.setInteractive({ useHandCursor: true });
    closeRect.on('pointerdown', () => {
      cont.destroy();
      scene.scene.resume('GameScene');
    });
    cont.setDepth(150);
  }

  private openJoinDialog(scene: GameScene, faction: 'old_order' | 'new_order') {
    scene.scene.pause('GameScene');
    const cont = scene.add.container(this.x, this.y - 60);
    const bg = scene.add.rectangle(0, 0, 340, 130, 0x1a1a1a, 0.95).setStrokeStyle(2, 0x880000);
    cont.add(bg);
    cont.add(scene.add.text(0, -50, 'Dołączyć do frakcji?', { fontSize: '14px', color: '#ffcc00' }).setOrigin(0.5));
    cont.add(scene.add.text(0, -25, 'Decyzja jest ostateczna i zablokuje drugą ścieżkę.', { fontSize: '10px', color: '#cccccc', wordWrap: { width: 300 }, align: 'center' }).setOrigin(0.5));
    const yes = scene.add.rectangle(-70, 25, 100, 30, 0x446644).setStrokeStyle(1, 0x88aa88);
    const no = scene.add.rectangle(70, 25, 100, 30, 0x664444).setStrokeStyle(1, 0xaa8888);
    cont.add([yes, no,
      scene.add.text(-70, 25, 'Dołącz', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5),
      scene.add.text(70, 25, 'Anuluj', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5)
    ]);
    yes.setInteractive({ useHandCursor: true });
    no.setInteractive({ useHandCursor: true });
    yes.on('pointerdown', () => {
      scene.joinFaction(faction);
      cont.destroy();
      scene.scene.resume('GameScene');
    });
    no.on('pointerdown', () => {
      cont.destroy();
      scene.scene.resume('GameScene');
    });
    cont.setDepth(150);
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    (this.sprite as any).setTint?.(0xffffff);
    this.scene.time.delayedCall(100, () => (this.sprite as any).clearTint?.());
    this.isHostile = true;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
      this.setAlpha(0.5);
      const b = this.body as Phaser.Physics.Arcade.Body;
      if (b) b.setVelocity(0, 0);
      return true;
    }
    return false;
  }

  destroy(fromScene?: boolean) {
    this.label.destroy();
    this.sprite.destroy();
    super.destroy(fromScene);
  }
}
