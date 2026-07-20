import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { Monster } from '../entities/Monster';
import { DataLoader, LoadedData } from '../systems/DataLoader';
import { TimeSystem } from '../systems/TimeSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { QuestSystem } from '../systems/QuestSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { LockpickMinigame } from '../systems/LockpickMinigame';
import { CrimeSystem } from '../systems/CrimeSystem';
import { audio } from '../systems/AudioSystem';

interface WorldItem {
  id: string;
  x: number;
  y: number;
  itemId: string;
  collected: boolean;
  container?: Phaser.GameObjects.Container;
}

interface Chest {
  id: string;
  x: number;
  y: number;
  difficulty: number; // 1-3
  opened: boolean;
  loot: string[];
  owner_faction?: string;
  container?: Phaser.GameObjects.Container;
}

export class GameScene extends Phaser.Scene {
  public player!: Player;
  public npcs: NPC[] = [];
  public monsters: Monster[] = [];
  public chests: Chest[] = [];
  public worldItems: WorldItem[] = [];
  public dataLoader!: DataLoader;
  public timeSystem!: TimeSystem;
  public saveSystem!: SaveSystem;
  public questSystem!: QuestSystem;
  public projectileSystem!: ProjectileSystem;
  public lockpickMinigame!: LockpickMinigame;
  public crimeSystem!: CrimeSystem;
  public gameData!: LoadedData;
  public gameOver: boolean = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private currentInteractable: any = null;
  private groundLayer!: Phaser.GameObjects.TileSprite;
  private debugText!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private attackCooldown: number = 0;
  private attackRange: number = 40;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private aimLine!: Phaser.GameObjects.Line;
  private aimVisible: boolean = false;
  private currentSpellIndex: number = 0;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private uiSceneLaunched: boolean = false;
  private dialogFlags: Record<string, any> = {};
  private openedChestIds: Set<string> = new Set();
  private harvestedPlants: Set<string> = new Set();

  constructor() {
    super({ key: 'GameScene' });
  }

  async init(data: any) {
    this.dataLoader = data.dataLoader || new DataLoader();
    this.timeSystem = data.timeSystem || new TimeSystem();
    this.saveSystem = data.saveSystem || new SaveSystem();
    this.gameData = data.gameData || await this.dataLoader.loadAll();
    this.questSystem = new QuestSystem(this.gameData);
    this.npcs = [];
    this.monsters = [];
    this.chests = [];
    this.worldItems = [];
    this.gameOver = false;
    this.openedChestIds = new Set();
    this.harvestedPlants = new Set();
    this.currentInteractable = null;
    this.isPaused = false;
    this.attackCooldown = 0;
  }

  create() {
    this.generateProceduralMap();
    this.player = new Player(this, 400, 500);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.cameras.main.setBounds(0, 0, 1024 * 4, 768 * 4);

    // Ensure audio initialized on first user interaction
    this.input.once('pointerdown', () => audio.init().then(() => audio.startMusic()));
    this.input.keyboard!.on('keydown', () => audio.init().then(() => audio.startMusic()), this);

    // Configure time from balance (BUG-014)
    if (this.gameData.balance?.time) {
      this.timeSystem.configureFromBalance(this.gameData.balance);
    }

    this.projectileSystem = new ProjectileSystem(this);
    this.lockpickMinigame = new LockpickMinigame(this);
    this.crimeSystem = new CrimeSystem(this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey('W'),
      A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'),
      D: this.input.keyboard!.addKey('D'),
      E: this.input.keyboard!.addKey('E'),
      I: this.input.keyboard!.addKey('I'),
      C: this.input.keyboard!.addKey('C'),
      J: this.input.keyboard!.addKey('J'),
      M: this.input.keyboard!.addKey('M'),
      ESC: this.input.keyboard!.addKey('ESC'),
      SPACE: this.input.keyboard!.addKey('SPACE'),
      SHIFT: this.input.keyboard!.addKey('SHIFT'),
      CTRL: this.input.keyboard!.addKey('CTRL'),
      F5: this.input.keyboard!.addKey('F5'),
      F9: this.input.keyboard!.addKey('F9'),
      TAB: this.input.keyboard!.addKey('TAB'),
      ONE: this.input.keyboard!.addKey('ONE'),
      TWO: this.input.keyboard!.addKey('TWO'),
      THREE: this.input.keyboard!.addKey('THREE'),
      FOUR: this.input.keyboard!.addKey('FOUR'),
    };

    this.spawnNPCs();
    this.spawnMonsters();
    this.spawnChests();
    this.spawnWorldItems();

    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0xff4444, 0.5);
    this.aimLine.setLineWidth(1);
    this.aimLine.setVisible(false);
    this.aimLine.setDepth(90);

    this.debugText = this.add.text(10, 10, '', {
      fontSize: '10px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);

    if (!this.uiSceneLaunched) {
      this.scene.launch('UIScene', { gameScene: this });
      this.uiSceneLaunched = true;
    }

    // Inputs
    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.togglePause());
    this.keys.F5.on('down', () => this.quickSave());
    this.keys.F9.on('down', () => this.quickLoad());
    this.keys.TAB.on('down', () => this.cycleCombatMode());
    this.keys.ONE.on('down', () => { this.player.currentCombatMode = 'melee'; this.updateUI(); });
    this.keys.TWO.on('down', () => { this.player.currentCombatMode = 'ranged'; this.aimVisible = true; this.aimLine.setVisible(true); this.updateUI(); });
    this.keys.THREE.on('down', () => { this.player.currentCombatMode = 'magic'; this.aimVisible = true; this.aimLine.setVisible(true); this.updateUI(); });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.mouseX = pointer.worldX;
      this.mouseY = pointer.worldY;
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver) return;
      if (this.isPaused) return;
      if (pointer.leftButtonDown()) {
        if (this.player.currentCombatMode === 'melee') this.meleeAttack();
        else if (this.player.currentCombatMode === 'ranged') this.rangedAttack();
        else if (this.player.currentCombatMode === 'magic') this.magicAttack();
        else this.meleeAttack();
      } else if (pointer.rightButtonDown()) {
        if (this.player.currentCombatMode === 'ranged' || this.player.currentCombatMode === 'magic') {
          this.aimVisible = !this.aimVisible;
          this.aimLine.setVisible(this.aimVisible);
        }
      }
    });

    this.input.mouse!.disableContextMenu();

    // Listen to reward events from dialogs/quests
    window.addEventListener('game:grantRewards', (e: any) => this.applyRewards(e.detail) as any);

    // Load save if requested
    const initData: any = this.scene.settings.data || {};
    if (initData.loadSlot !== undefined) {
      const slot = initData.loadSlot;
      this.time.delayedCall(50, () => this.quickLoad(slot));
    } else {
      // Auto-start main quest when new game begins for guidance
      this.time.delayedCall(200, () => {
        this.questSystem.startQuest('quest_main_arrival');
      });
    }
  }

  generateProceduralMap() {
    const width = this.cameras.main.width * 4;
    const height = this.cameras.main.height * 4;

    if (this.textures.exists('tile_grass')) {
      this.groundLayer = this.add.tileSprite(0, 0, width, height, 'tile_grass');
    } else {
      this.groundLayer = this.add.tileSprite(0, 0, width, height, '__DEFAULT');
      this.groundLayer.setTint(0x3a5a2a);
    }
    this.groundLayer.setOrigin(0, 0);

    if (this.textures.exists('tile_road')) {
      const road = this.add.tileSprite(240, 230, 60, 500, 'tile_road');
      road.setOrigin(0, 0).setDepth(0);
    }

    this.addProceduralDecorations(width, height);
  }

  addProceduralDecorations(width: number, height: number) {
    const rng = new Phaser.Math.RandomDataGenerator(['gothic-world']);

    if (this.textures.exists('tree')) {
      for (let i = 0; i < 60; i++) {
        const x = rng.between(50, width - 50);
        const y = rng.between(50, height - 50);
        if (Math.abs(x - 200) < 120 && Math.abs(y - 200) < 100) continue;
        if (Math.abs(x - 700) < 100 && Math.abs(y - 400) < 80) continue;
        const tree = this.add.image(x, y, 'tree');
        tree.setDepth(y);
        tree.setScale(rng.between(8, 12) / 10);
      }
    }
    if (this.textures.exists('rock')) {
      for (let i = 0; i < 25; i++) {
        const x = rng.between(50, width - 50);
        const y = rng.between(50, height - 50);
        this.add.image(x, y, 'rock').setDepth(y);
      }
    }

    this.addBuilding(200, 200, 140, 90, 0x5a4a3a, 'Gród Straży', 'old_order');
    this.addBuilding(700, 400, 120, 80, 0x6b4a2a, 'Wolne Chaty', 'new_order');

    this.add.text(800, 150, 'Cmentarzysko', { fontSize: '9px', color: '#666666' }).setOrigin(0.5).setDepth(1).setScrollFactor(1);
    this.add.text(1200, 700, 'Zapadlisko', { fontSize: '9px', color: '#445533' }).setOrigin(0.5).setDepth(1).setScrollFactor(1);
    this.add.text(1300, 200, 'Szczelina', { fontSize: '9px', color: '#442244' }).setOrigin(0.5).setDepth(1).setScrollFactor(1);
    this.add.text(150, 580, 'Mokra Plaża', { fontSize: '9px', color: '#889966' }).setOrigin(0.5).setDepth(1).setScrollFactor(1);

    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(4, 0x8b7355, 0.6);
    pathGraphics.beginPath();
    pathGraphics.moveTo(260, 240);
    pathGraphics.lineTo(700, 400);
    pathGraphics.strokePath();
    pathGraphics.setDepth(0);

    this.nightOverlay = this.add.rectangle(0, 0, width, height, 0x000033, 0).setOrigin(0, 0).setDepth(95);
  }

  addBuilding(x: number, y: number, w: number, h: number, color: number, label: string, _faction?: string) {
    this.add.rectangle(x, y, w, h, color).setDepth(y - h / 2).setStrokeStyle(2, 0x2a1a0a);
    this.add.triangle(x, y - h / 2 - 15, 0, 15, w, 15, w / 2, -15, 0x6a3a1a).setDepth(y - h / 2 - 20);
    this.add.rectangle(x, y + h / 4, 16, 24, 0x3a2a1a).setDepth(y);
    this.add.text(x, y - h / 2 - 30, label, { fontSize: '12px', color: '#ffffcc', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(y - h / 2 - 25);
  }

  spawnNPCs() {
    if (!this.gameData.npcs) return;
    for (const data of this.gameData.npcs) {
      const sx = data.spawn_position?.x ?? 200;
      const sy = data.spawn_position?.y ?? 200;
      this.npcs.push(new NPC(this, sx * 2, sy * 2, data));
    }
  }

  spawnMonsters() {
    if (!this.gameData.monsters) return;
    const rng = new Phaser.Math.RandomDataGenerator(['monsters']);
    for (const data of this.gameData.monsters) {
      const count = (data.behavior || []).includes('pack') ? 3 : 2;
      for (let i = 0; i < count; i++) {
        this.monsters.push(new Monster(this, rng.between(200, 1400), rng.between(200, 1000), data));
      }
    }
  }

  spawnChests() {
    // Place chests: 1 in old fort, 1 in new camp, plus a few scattered
    const defs = [
      { id: 'chest_old_armory', x: 180, y: 230, difficulty: 2, loot: ['sword_iron_longsword', 'misc_gold', 'misc_arrow'], owner: 'old_order' },
      { id: 'chest_new_cache', x: 720, y: 420, difficulty: 2, loot: ['bow_shortbow', 'misc_lockpick_iron', 'potion_healing_small'], owner: 'new_order' },
      { id: 'chest_roadbox', x: 480, y: 320, difficulty: 1, loot: ['misc_gold', 'potion_healing_small'], owner: undefined },
      { id: 'chest_swamp_cache', x: 1100, y: 750, difficulty: 3, loot: ['sword_obsidian_cleaver', 'misc_gold', 'potion_mana_small'], owner: undefined },
      { id: 'chest_beach_wreck', x: 100, y: 620, difficulty: 1, loot: ['misc_gold', 'misc_arrow'], owner: undefined },
    ];
    for (const def of defs) {
      const cont = this.add.container(def.x, def.y);
      const box = this.add.rectangle(0, 0, 24, 20, 0x6a4a1a).setStrokeStyle(2, 0x2a1a0a);
      const lock = this.add.rectangle(0, 2, 4, 6, 0xccaa33);
      cont.add([box, lock]);
      cont.setDepth(def.y);
      const chest: Chest = {
        id: def.id, x: def.x, y: def.y, difficulty: def.difficulty,
        opened: false, loot: def.loot, owner_faction: def.owner, container: cont
      };
      this.chests.push(chest);
    }
  }

  spawnWorldItems() {
    // Plants & loose items scattered around
    const plants = this.gameData.items_plants || [];
    const rng = new Phaser.Math.RandomDataGenerator(['world-items']);
    for (let i = 0; i < 20 && i < plants.length * 2; i++) {
      const plant = plants[rng.between(0, plants.length - 1)];
      const x = rng.between(100, 1400);
      const y = rng.between(100, 800);
      const cont = this.add.container(x, y);
      const icon = this.add.rectangle(0, 0, 8, 8, 0x33aa33).setStrokeStyle(1, 0x226622);
      cont.add(icon);
      cont.setDepth(y);
      this.worldItems.push({
        id: `plant_${plant.id}_${i}`, x, y, itemId: plant.id, collected: false, container: cont
      });
    }
    // Loose arrows
    for (let i = 0; i < 5; i++) {
      const x = rng.between(100, 1000);
      const y = rng.between(100, 800);
      const cont = this.add.container(x, y);
      const icon = this.add.rectangle(0, 0, 6, 6, 0xcccc88);
      cont.add(icon);
      cont.setDepth(y);
      this.worldItems.push({
        id: `loose_arrow_${i}`, x, y, itemId: 'misc_arrow', collected: false, container: cont
      });
    }
  }

  update(_time: number, delta: number) {
    if (this.isPaused || this.gameOver) return;

    // Clamp delta
    const d = Math.min(delta, 100);

    // Time update (BUG-014: proper delta)
    this.timeSystem.update(d);
    // Night overlay (BUG-015)
    const light = this.timeSystem.getLightFactor();
    this.nightOverlay.setFillStyle(0x000033, Phaser.Math.Linear(0.6, 0, light));

    // Player movement
    let vx = 0, vy = 0;
    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -1;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = 1;
    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -1;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = 1;
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    if (vx !== 0 || vy !== 0) this.player.move(vx, vy);
    else this.player.stopMoving();
    this.player.speed = this.keys.SHIFT.isDown ? 180 : 120;

    // Aim line
    if (this.aimVisible && (this.player.currentCombatMode === 'ranged' || this.player.currentCombatMode === 'magic')) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.mouseX, this.mouseY);
      const len = Math.min(200, Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mouseX, this.mouseY));
      this.aimLine.setTo(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
      this.aimLine.setPosition(this.player.x, this.player.y);
      const col = this.player.currentCombatMode === 'magic' ? 0x4488ff : 0xff8844;
      this.aimLine.setStrokeStyle(1, col, 0.5);
    }

    this.checkInteraction();

    for (const npc of this.npcs) {
      if (npc.isAlive) npc.update(d, this.player, this.timeSystem);
    }
    for (const monster of this.monsters) {
      if (monster.isAlive) monster.update(d, this.player, this.npcs);
    }

    // Projectile system
    this.projectileSystem.update(d, (p) => {
      if (p.owner === 'player') {
        for (const monster of this.monsters) {
          if (!monster.isAlive) continue;
          const dist = Phaser.Math.Distance.Between(p.x, p.y, monster.x, monster.y);
          if (dist < 18) {
            const killed = monster.takeDamage(p.damage);
            if (killed) {
              this.player.addXp(monster.monsterData.stats.xp_reward);
              this.player.gold += Phaser.Math.Between(1, 3);
              this.showXpPopup(monster.x, monster.y, `+${monster.monsterData.stats.xp_reward} XP`);
            }
            // VFX
            this.add.circle(p.x, p.y, 10, p.damageType === 'fire' ? 0xff4400 : p.damageType === 'ice' ? 0x44aaff : 0xcccc88, 0.7).setDepth(80);
            return true;
          }
        }
        for (const npc of this.npcs) {
          if (!npc.isAlive) continue;
          if (npc.npcData.is_essential) continue;
          const dist = Phaser.Math.Distance.Between(p.x, p.y, npc.x, npc.y);
          if (dist < 16) {
            npc.takeDamage(p.damage);
            return true;
          }
        }
      } else {
        // Enemy projectile hits player (BUG-021)
        const dist = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
        if (dist < 16) {
          const actualDmg = this.player.takeDamage(p.damage);
          window.dispatchEvent(new CustomEvent('game:playerHit', { detail: { damage: actualDmg } }));
          if (!this.player.isAlive) this.onPlayerDeath();
          return true;
        }
      }
      return false;
    });

    // Regen
    if (this.player.isAlive && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (d / 5000));
    }
    if (this.player.isAlive && this.player.mana < this.player.maxMana) {
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + (d / 3000));
    }

    // Monster melee vs player (BUG-019)
    for (const monster of this.monsters) {
      if (!monster.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (d < 28) {
        // Damage on contact at attack interval
        const now = _time;
        if (!(monster as any).lastHit || now - (monster as any).lastHit > 900) {
          const atk = monster.monsterData.attacks?.[0];
          const dmg = atk?.damage ?? 5;
          const actualDmg = this.player.takeDamage(dmg);
          (monster as any).lastHit = now;
          window.dispatchEvent(new CustomEvent('game:playerHit', { detail: { damage: actualDmg } }));
          this.cameras.main.shake(100, 0.005);
          if (!this.player.isAlive) this.onPlayerDeath();
        }
      }
    }

    // Debug text
    this.debugText.setText(
      `Tryb: ${this.player.currentCombatMode} | LVL:${this.player.level} | ` +
      `HP:${Math.floor(this.player.hp)}/${this.player.maxHp} | MP:${Math.floor(this.player.mana)}/${this.player.maxMana} | ` +
      `XP:${this.player.xp}/${this.player.xpToNext} | Zł:${this.player.gold} | PKT:${this.player.skillPoints}\n` +
      `Czas: ${this.timeSystem.getFormattedTime()} Dzień ${this.timeSystem.getGameDay()} | NPC:${this.npcs.filter(n => n.isAlive).length} | Pot:${this.monsters.filter(m => m.isAlive).length}\n` +
      `[1]Miecz [2]Łuk [3]Magia | E-interakcja | Najbliższy: ${this.getInteractableLabel()}`
    );

    if (this.attackCooldown > 0) this.attackCooldown -= d;
  }

  private getInteractableLabel(): string {
    if (!this.currentInteractable) return 'brak';
    if (this.currentInteractable instanceof NPC) return this.currentInteractable.npcData.name;
    if (this.currentInteractable instanceof Monster) return 'Trup';
    if (this.currentInteractable.kind === 'chest') return 'Skrzynia [E]';
    if (this.currentInteractable.kind === 'item') return 'Podnieś [E]';
    return '?';
  }

  cycleCombatMode() {
    const modes: Array<'melee' | 'ranged' | 'magic'> = ['melee', 'ranged', 'magic'];
    const current = this.player.currentCombatMode === 'idle' ? 'melee' : this.player.currentCombatMode;
    const idx = modes.indexOf(current as any);
    const nextIdx = idx < 0 ? 0 : (idx + 1) % 3;
    this.player.currentCombatMode = modes[nextIdx];
    this.aimVisible = this.player.currentCombatMode !== 'melee';
    this.aimLine.setVisible(this.aimVisible);
    this.updateUI();
  }

  private updateUI() {
    window.dispatchEvent(new CustomEvent('game:combatMode', { detail: { mode: this.player.currentCombatMode } }));
  }

  checkInteraction() {
    let nearest: any = null;
    let nearestDist = 70;
    for (const npc of this.npcs) {
      if (!npc.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (d < nearestDist) { nearestDist = d; nearest = npc; }
    }
    for (const monster of this.monsters) {
      if (monster.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (d < nearestDist) { nearestDist = d; nearest = monster; }
    }
    for (const chest of this.chests) {
      if (chest.opened) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y);
      if (d < nearestDist) { nearestDist = d; nearest = { kind: 'chest', chest }; }
    }
    for (const item of this.worldItems) {
      if (item.collected) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (d < nearestDist) { nearestDist = d; nearest = { kind: 'item', item }; }
    }
    this.currentInteractable = nearest;
  }

  interact() {
    if (!this.currentInteractable) return;
    if (this.currentInteractable instanceof NPC) {
      const npc = this.currentInteractable as NPC;
      // Pickpocket with CTRL (BUG-012)
      if (this.keys.CTRL?.isDown) { this.tryPickpocket(npc); return; }
      npc.interact(this);
    } else if (this.currentInteractable instanceof Monster) {
      const monster = this.currentInteractable as Monster;
      if (!monster.isAlive) this.lootMonster(monster);
    } else if (this.currentInteractable.kind === 'chest') {
      this.openChest(this.currentInteractable.chest);
    } else if (this.currentInteractable.kind === 'item') {
      this.pickUpWorldItem(this.currentInteractable.item);
    }
  }

  private openChest(chest: Chest) {
    // Check witness reaction (BUG-012)
    if (chest.owner_faction) {
      const witnesses = this.crimeSystem.checkWitnesses(
        chest.x, chest.y,
        this.npcs.filter(n => n.isAlive && n.npcData.faction === chest.owner_faction).map(n => ({ x: n.x, y: n.y, isAlive: n.isAlive })),
        150
      );
      if (witnesses.length > 0) {
        window.dispatchEvent(new CustomEvent('game:message', { detail: 'Ktoś widzi! Złodziej!' }));
        // Hostile reaction
        for (const npc of this.npcs) {
          if (npc.isAlive && npc.npcData.faction === chest.owner_faction) {
            const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
            if (d < 200) npc.isHostile = true;
          }
        }
        this.player.reputation[chest.owner_faction] = (this.player.reputation[chest.owner_faction] || 0) - 5;
        return;
      }
    }

    // Open based on lockpick skill
    const lockpickLevel = this.player.skillRanks['lockpicking'] || 0;
    const onComplete = (success: boolean) => {
      if (success) {
        chest.opened = true;
        this.openedChestIds.add(chest.id);
        if (chest.container) chest.container.setAlpha(0.6);
        for (const id of chest.loot) this.player.addToInventory(id);
        audio.sfxChestOpen();
        audio.sfxLockpickSuccess();
        window.dispatchEvent(new CustomEvent('game:message', { detail: `Skrzynia otwarta! ${chest.loot.length} przedmiotów` }));
      } else {
        // Consume a lockpick
        if (this.player.getItemCount('misc_lockpick_iron') > 0) {
          this.player.removeFromInventory('misc_lockpick_iron');
          window.dispatchEvent(new CustomEvent('game:message', { detail: 'Wytrych złamany!' }));
        } else if (this.player.getItemCount('misc_lockpick_steel') > 0) {
          this.player.removeFromInventory('misc_lockpick_steel');
          window.dispatchEvent(new CustomEvent('game:message', { detail: 'Wytrych złamany!' }));
        } else if (this.player.getItemCount('misc_lockpick_master') > 0) {
          this.player.removeFromInventory('misc_lockpick_master');
          window.dispatchEvent(new CustomEvent('game:message', { detail: 'Wytrych złamany!' }));
        } else {
          audio.sfxError();
          window.dispatchEvent(new CustomEvent('game:message', { detail: 'Brak wytrychów!' }));
        }
        audio.sfxLockpickFail();
      }
    };

    if (chest.difficulty === 1 && lockpickLevel === 0) {
      // Easy chests can be opened without minigame if no skill
      onComplete(true);
      return;
    }
    // Need at least one lockpick
    if (this.player.getItemCount('misc_lockpick_iron') + this.player.getItemCount('misc_lockpick_steel') + this.player.getItemCount('misc_lockpick_master') === 0) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Potrzebujesz wytrychu.' }));
      return;
    }
    this.lockpickMinigame.start(chest.difficulty, lockpickLevel, onComplete);
  }

  private pickUpWorldItem(item: WorldItem) {
    item.collected = true;
    if (item.container) item.container.destroy();
    this.player.addToInventory(item.itemId);
    if (item.itemId.startsWith('misc_gold')) audio.sfxGold(); else audio.sfxPickup();
    window.dispatchEvent(new CustomEvent('game:message', { detail: `Znaleziono: ${item.itemId}` }));
    this.harvestedPlants.add(item.id);
  }

  private tryPickpocket(npc: NPC) {
    const skillRank = this.player.skillRanks['pickpocket'] || 0;
    const result = this.crimeSystem.tryPickpocket(
      this.player.x, this.player.y, npc.x, npc.y, skillRank, npc.npcData.stats.level
    );
    window.dispatchEvent(new CustomEvent('game:message', { detail: result.message }));
    if (result.success) {
      const items = npc.npcData.inventory;
      if (items && items.length > 0) {
        const stolen = items[Math.floor(Math.random() * items.length)];
        this.player.addToInventory(stolen);
        window.dispatchEvent(new CustomEvent('game:message', { detail: `Zdobyto: ${stolen}` }));
      } else {
        this.player.gold += Phaser.Math.Between(1, 5);
      }
    } else if (result.detected) {
      this.player.reputation[npc.npcData.faction] = (this.player.reputation[npc.npcData.faction] || 0) - 10;
      npc.isHostile = true;
    }
  }

  lootMonster(monster: Monster) {
    // Use loot table from monster (BUG-031)
    const items = monster.getLoot();
    for (const itemId of items) this.player.addToInventory(itemId);

    const skinningRank = this.player.skillRanks['skinning'] || 0;
    if (skinningRank > 0) {
      // Extra trophy based on loot_table
      const lt = monster.monsterData.loot_table;
      const trophyMap: Record<string, string> = {
        loot_wolf: 'misc_skins_wolf',
        loot_boar: 'misc_skins_boar',
        loot_mutant: 'misc_trophy_mutant_eye',
        loot_wyrm: 'misc_trophy_wyrm_scale',
        loot_shade: 'plant_grave_moss'
      };
      if (trophyMap[lt]) this.player.addToInventory(trophyMap[lt]);
    } else if (monster.monsterData.loot_table !== 'loot_shade') {
      // Tell player they could skin it
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Możesz to oskórować jeśli znasz tę sztukę.' }));
    }

    window.dispatchEvent(new CustomEvent('game:message', { detail: `Łup: ${items.length} przedmiotów` }));
    monster.destroy();
    this.monsters = this.monsters.filter(m => m !== monster);
  }

  meleeAttack() {
    if (this.attackCooldown > 0) return;
    let cooldown = 500;
    let weaponDmg = 5;
    let weaponRange = this.attackRange;
    let strengthScaling = 0.5;
    const weaponId = this.player.equippedWeapon;
    if (weaponId) {
      let weapon = this.dataLoader.findById('items_weapons_swords', weaponId);
      if (weapon) {
        // Check requirements
        const req = this.player.meetsRequirements(weapon.requirements);
        if (!req.ok) {
          window.dispatchEvent(new CustomEvent('game:message', { detail: req.reason || 'Nie masz siły/zręczności' }));
          weaponDmg = 2; // fist
          cooldown = 600;
          strengthScaling = 0.2;
        } else {
          cooldown = weapon.speed || 500;
          weaponDmg = weapon.damage || 8;
          weaponRange = weapon.range || this.attackRange;
          strengthScaling = weapon.strength_scaling ?? 0.5;
        }
      } else {
        weapon = this.dataLoader.findById('items_weapons_bows', weaponId);
        if (weapon) {
          // Can't melee with bow
          window.dispatchEvent(new CustomEvent('game:message', { detail: 'Wyposaż broń białą!' }));
          return;
        }
      }
    }
    this.attackCooldown = cooldown;
    this.tweens.add({ targets: this.player, scaleX: 1.3, scaleY: 0.8, duration: 80, yoyo: true });

    let target: Monster | NPC | null = null;
    let targetDist = weaponRange;
    for (const monster of this.monsters) {
      if (!monster.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (d < targetDist) { targetDist = d; target = monster; }
    }
    for (const npc of this.npcs) {
      if (!npc.isAlive) continue;
      if (npc.npcData.is_essential) continue;
      if (!npc.isHostile) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (d < targetDist) { targetDist = d; target = npc; }
    }

    if (target) {
      // Apply damage using strength scaling
      const strBonus = Math.floor(this.player.strength * strengthScaling);
      const totalDmg = Math.max(1, weaponDmg + strBonus);
      let killed = false;
      audio.sfxSwordHit();
      if (target instanceof Monster) killed = target.takeDamage(totalDmg);
      else killed = target.takeDamage(totalDmg);

      const knockAngle = Phaser.Math.Angle.Between(target.x, target.y, this.player.x, this.player.y);
      this.tweens.add({ targets: target, x: target.x + Math.cos(knockAngle) * 12, y: target.y + Math.sin(knockAngle) * 12, duration: 100 });

      if (killed && target instanceof Monster) {
        this.player.addXp((target as Monster).monsterData.stats.xp_reward);
        this.player.gold += Phaser.Math.Between(1, 5);
        audio.sfxDeath();
        audio.sfxGold();
        this.showXpPopup(target.x, target.y, `+${(target as Monster).monsterData.stats.xp_reward} XP`);
      }
    } else {
      audio.sfxSwordMiss();
    }
  }

  rangedAttack() {
    if (this.attackCooldown > 0) return;
    // Need bow equipped
    const bowId = this.player.equippedWeapon;
    let bowData = null;
    if (bowId) bowData = this.dataLoader.findById('items_weapons_bows', bowId);
    if (!bowData) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Wyposaż łuk.' }));
      return;
    }
    if (this.player.getItemCount('misc_arrow') <= 0) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Brak strzał!' }));
      return;
    }
    const req = this.player.meetsRequirements(bowData.requirements);
    if (!req.ok) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: req.reason || 'Nie masz wymagań' }));
      return;
    }
    this.player.removeFromInventory('misc_arrow');
    this.attackCooldown = bowData.draw_time || 800;
    const dexBonus = Math.floor(this.player.dexterity * (bowData.dexterity_scaling ?? 0.3));
    const totalDmg = Math.max(1, (bowData.damage || 6) + dexBonus);
    this.projectileSystem.fire(
      this.player.x, this.player.y, this.mouseX, this.mouseY,
      350, totalDmg, 'physical', 'player'
    );
    audio.sfxBow();
    this.tweens.add({ targets: this.player, scaleX: 1.1, duration: 100, yoyo: true });
  }

  magicAttack() {
    if (this.attackCooldown > 0) return;
    const known = this.player.knownSpells.length > 0 ? this.player.knownSpells : ['spell_fire_bolt'];
    const spellId = known[this.currentSpellIndex % known.length];
    const spellData = this.dataLoader.findById('spells', spellId);
    if (!spellData) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Nie znasz żadnego czaru.' }));
      return;
    }
    // BUG-003: use spell mana_cost
    const cost = spellData.mana_cost ?? 15;
    if (this.player.mana < cost) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Za mało many!' }));
      return;
    }
    // Check requirements
    const req = spellData.requirements;
    if (req?.min_level && this.player.level < req.min_level) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: `Wymaga poziomu ${req.min_level}` }));
      return;
    }
    this.player.mana -= cost;
    this.attackCooldown = spellData.cooldown ?? 1200;
    const damageType: 'fire' | 'ice' | 'physical' = spellData.damage_type === 'ice' ? 'ice' : 'fire';
    const totalDmg = spellData.damage || 15;
    this.tweens.add({ targets: this.player, scaleX: 0.85, scaleY: 1.15, duration: 180, yoyo: true });
    this.projectileSystem.fire(
      this.player.x, this.player.y, this.mouseX, this.mouseY,
      spellData.projectile_speed ?? 280, totalDmg, damageType, 'player'
    );
    audio.sfxMagic();
    window.dispatchEvent(new CustomEvent('game:message', { detail: `Rzucasz ${spellData.name}!` }));
  }

  private showXpPopup(x: number, y: number, text: string) {
    const popup = this.add.text(x, y - 20, text, {
      fontSize: '10px', color: '#ffcc00', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.tweens.add({ targets: popup, y: y - 50, alpha: 0, duration: 1000, onComplete: () => popup.destroy() });
  }

  togglePause() {
    if (this.gameOver) return;
    if (this.scene.isActive('DialogScene')) return;
    this.isPaused = true;
    audio.sfxUINavigate();
    this.scene.launch('MenuScene', { from: 'pause', gameScene: this });
  }

  resumeFromPause() {
    this.isPaused = false;
  }

  async quickSave() {
    try {
      await this.saveSystem.autosave(this.buildSaveData());
      audio.sfxQuestCompleted();
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Gra zapisana!' }));
    } catch (e) {
      audio.sfxError();
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Błąd zapisu' }));
    }
  }

  async quickLoad(slot?: number) {
    const slotIdx = slot ?? 0;
    const data = await this.saveSystem.load(slotIdx);
    if (data) {
      this.loadSaveData(data);
      audio.sfxMagic();
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Gra wczytana!' }));
    } else {
      audio.sfxError();
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Brak zapisu' }));
    }
  }

  buildSaveData(): import('../types').SaveData {
    return {
      version: '0.1.0', timestamp: Date.now(), play_time: 0,
      player: {
        x: this.player.x, y: this.player.y, location_id: 'loc_beach',
        hp: this.player.hp, maxHp: this.player.maxHp,
        mana: this.player.mana, maxMana: this.player.maxMana,
        strength: this.player.strength, dexterity: this.player.dexterity,
        level: this.player.level, xp: this.player.xp,
        skillPoints: this.player.skillPoints, gold: this.player.gold,
        equippedWeapon: this.player.equippedWeapon, equippedArmor: this.player.equippedArmor,
        knownSpells: this.player.knownSpells, factionChoice: this.player.faction,
        reputation: this.player.reputation, inventory: this.player.inventory,
        inventoryCounts: this.player.inventoryCounts, skillRanks: this.player.skillRanks
      },
      quests: this.questSystem.getSaveData(),
      npcs: this.npcs.filter(n => n.isAlive).map(n => ({
        npc_id: n.npcData.id, hp: n.hp,
        position: { x: n.x, y: n.y, location_id: 'loc_beach' },
        is_alive: n.isAlive, is_knocked_out: false, current_activity: 'idle', flags: {}, inventory: []
      })),
      reputation: this.player.reputation, dialog_flags: this.dialogFlags,
      discovered_locations: ['loc_beach'],
      opened_chests: Array.from(this.openedChestIds),
      harvested_plants: Array.from(this.harvestedPlants),
      killed_monsters: {},
      faction_choice: this.player.faction,
      time_of_day: this.timeSystem.getTimeOfDay(), game_day: this.timeSystem.getGameDay()
    };
  }

  loadSaveData(data: any) {
    this.player.loadSaveData(data.player);
    this.timeSystem.loadSaveData({ currentTime: data.time_of_day ?? 28800, gameDay: data.game_day ?? 1 });
    if (data.quests) this.questSystem.loadSaveData(data.quests);
    if (data.dialog_flags) this.dialogFlags = data.dialog_flags;
    if (data.opened_chests) {
      this.openedChestIds = new Set(data.opened_chests);
      for (const c of this.chests) {
        if (this.openedChestIds.has(c.id)) {
          c.opened = true;
          if (c.container) c.container.setAlpha(0.6);
        }
      }
    }
    if (data.harvested_plants) {
      this.harvestedPlants = new Set(data.harvested_plants);
      for (const it of this.worldItems) {
        if (this.harvestedPlants.has(it.id)) {
          it.collected = true;
          if (it.container) it.container.destroy();
        }
      }
    }
    this.gameOver = false;
    this.isPaused = false;
  }

  private updateTime() {
    // Replaced by proper update in update()
  }

  getPlayerDistanceFrom(x: number, y: number, maxDist: number = 400): boolean {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < maxDist;
  }

  applyRewards(rewards: any) {
    if (!rewards) return;
    if (rewards.xp) this.player.addXp(rewards.xp);
    if (rewards.gold) this.player.gold += rewards.gold;
    if (rewards.skill_points) this.player.skillPoints += rewards.skill_points;
    if (rewards.items && Array.isArray(rewards.items)) {
      for (const id of rewards.items) this.player.addToInventory(id);
    }
    if (rewards.reputation_changes) {
      for (const [fac, val] of Object.entries(rewards.reputation_changes)) {
        this.player.reputation[fac] = (this.player.reputation[fac] || 0) + Number(val);
      }
    }
  }

  /** Called by UIScene or DialogScene when player equips an item */
  equipFromInventory(itemId: string): boolean {
    const item = this.dataLoader.findById('items_weapons_swords', itemId)
      || this.dataLoader.findById('items_weapons_bows', itemId)
      || this.dataLoader.findById('items_armors', itemId);
    if (!item) return false;
    const req = this.player.meetsRequirements(item.requirements);
    if (!req.ok) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: req.reason || 'Nie możesz tego użyć' }));
      return false;
    }
    const previous = this.player.equip(itemId, item);
    if (previous) this.player.addToInventory(previous);
    this.player.removeFromInventory(itemId);
    return true;
  }

  /** Learn a spell, adding it to knownSpells */
  learnSpell(spellId: string) {
    if (!this.player.knownSpells.includes(spellId)) this.player.knownSpells.push(spellId);
  }

  /** Train a skill (from trainer) */
  trainSkill(skillId: string, cost: { gold: number; skill_points: number }, maxRank: number): { ok: boolean; reason?: string } {
    const cur = this.player.skillRanks[skillId] || 0;
    if (cur >= maxRank) return { ok: false, reason: 'Osiągnąłeś maksymalną rangę' };
    if (this.player.gold < cost.gold) return { ok: false, reason: 'Brak złota' };
    if (this.player.skillPoints < cost.skill_points) return { ok: false, reason: 'Brak punktów nauki' };
    this.player.gold -= cost.gold;
    this.player.skillPoints -= cost.skill_points;
    this.player.skillRanks[skillId] = cur + 1;
    // Learning fire/ice magic grants spells
    if (skillId === 'magic_fire') this.learnSpell('spell_fire_bolt');
    if (skillId === 'magic_ice') this.learnSpell('spell_ice_shard');
    return { ok: true };
  }

  /** Join a faction (mutual exclusion) - triggers finale and epilogue. */
  joinFaction(faction: 'old_order' | 'new_order') {
    this.player.faction = faction;
    this.questSystem.chooseFaction(faction);
    audio.sfxJoinFaction();
    window.dispatchEvent(new CustomEvent('game:message', { detail: `Dołączyłeś do ${faction === 'old_order' ? 'Straży' : 'Wolnych'}!` }));
    // Advance to finale stage
    this.questSystem.advanceQuest('quest_main_arrival', 'stage_choice');

    // Show finale sequence then epilogue after short delay
    this.time.delayedCall(2500, () => {
      this.showFinaleSequence(faction);
    });
  }

  private showFinaleSequence(faction: 'old_order' | 'new_order') {
    const cx = this.cameras.main.midPoint.x;
    const cy = this.cameras.main.midPoint.y;
    const overlay = this.add.rectangle(cx, cy, 800, 500, 0x000000, 0).setScrollFactor(1).setDepth(200);
    const txt = this.add.text(cx, cy, '', {
      fontSize: '22px', color: '#ffcc00', align: 'center', wordWrap: { width: 700 },
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(1).setDepth(201).setAlpha(0);

    const lines = faction === 'old_order'
      ? [
        'Wraz z żołnierzami Straży wymaszerowałeś na Szczelinę...',
        'Ostrza i zaklęcia przecięły ciemność. Bestie z głębin padły jeden po drugim.',
        'Gdy kurz opadł, Szczelina została zapieczętowana.',
        'Kresy Północne wróciły pod żelazny porządek Grodu.',
        'Twoja historia zaczyna się tu — od dziś jesteś jednym z nich.'
      ]
      : [
        'Zebraliście wolnych ludzi i uderzyliście na Szczelinę pod osłoną nocy...',
        'Ogień, stal i spryt pokonały stwory z głębin. Nikt nie wam rozkazował, nikt nie trzymał was w ryzach.',
        'Szczelina została zamknięta przez samego Pustelnika - twoją sprawką jest, że przeżył.',
        'Kresy Północne są teraz wolne - niebezpieczne, wolne.',
        'Twoja historia zaczyna się tu — od dziś twoje imię wymawiane będzie przy ogniskach.'
      ];

    this.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 1500 });
    let lineIndex = 0;
    const showLine = () => {
      if (lineIndex >= lines.length) {
        this.time.delayedCall(2500, () => {
          overlay.destroy();
          txt.destroy();
          this.scene.stop('UIScene');
          this.scene.stop('GameScene');
          this.scene.start('EpilogueScene', {
            faction,
            level: this.player.level,
            gold: this.player.gold,
            playTime: 0,
            questsCompleted: this.questSystem.getCompletedQuests().length,
            kills: 0
          });
        });
        return;
      }
      txt.setText(lines[lineIndex]);
      this.tweens.add({ targets: txt, alpha: 1, duration: 800, onComplete: () => {
        this.time.delayedCall(2400, () => {
          this.tweens.add({ targets: txt, alpha: 0, duration: 600, onComplete: () => {
            lineIndex++;
            showLine();
          }});
        });
      }});
    };
    this.time.delayedCall(1500, showLine);
  }

  onPlayerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.player.stopMoving();
    audio.sfxDeath();
    audio.stopMusic();
    const cx = this.cameras.main.width / 2 / this.cameras.main.zoom;
    const cy = this.cameras.main.height / 2 / this.cameras.main.zoom;
    const overlay = this.add.rectangle(this.player.x, this.player.y, 600, 400, 0x000000, 0.8).setScrollFactor(1).setDepth(200);
    const txt = this.add.text(this.player.x, this.player.y - 20, 'UMARŁEŚ\n\n[F9] wczytaj ostatni zapis\n[ESC] menu główne', {
      fontSize: '20px', color: '#ff0000', align: 'center', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(1).setDepth(201);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        window.removeEventListener('keydown', handler);
        overlay.destroy(); txt.destroy();
        this.quickLoad(0);
      } else if (e.key === 'Escape') {
        window.removeEventListener('keydown', handler);
        overlay.destroy(); txt.destroy();
        this.scene.stop('UIScene');
        this.scene.start('MenuScene', {});
      }
    };
    window.addEventListener('keydown', handler);
  }
}
