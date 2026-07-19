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

export class GameScene extends Phaser.Scene {
  public player!: Player;
  public npcs: NPC[] = [];
  public monsters: Monster[] = [];
  public dataLoader!: DataLoader;
  public timeSystem!: TimeSystem;
  public saveSystem!: SaveSystem;
  public questSystem!: QuestSystem;
  public projectileSystem!: ProjectileSystem;
  public lockpickMinigame!: LockpickMinigame;
  public crimeSystem!: CrimeSystem;
  public gameData!: LoadedData;
  
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

  constructor() {
    super({ key: 'GameScene' });
  }

  async init(data: any) {
    this.dataLoader = data.dataLoader || new DataLoader();
    this.timeSystem = data.timeSystem || new TimeSystem();
    this.saveSystem = data.saveSystem || new SaveSystem();
    this.gameData = data.gameData || await this.dataLoader.loadAll();
    this.questSystem = new QuestSystem(this.gameData);
  }

  create() {
    this.generateProceduralMap();
    
    this.player = new Player(this, 400, 500);
    
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // Init systems
    this.projectileSystem = new ProjectileSystem(this);
    this.lockpickMinigame = new LockpickMinigame(this);
    this.crimeSystem = new CrimeSystem(this);
    
    // Controls
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
      ESC: this.input.keyboard!.addKey('ESC'),
      SPACE: this.input.keyboard!.addKey('SPACE'),
      SHIFT: this.input.keyboard!.addKey('SHIFT'),
      F5: this.input.keyboard!.addKey('F5'),
      F9: this.input.keyboard!.addKey('F9'),
      TAB: this.input.keyboard!.addKey('TAB'),
      ONE: this.input.keyboard!.addKey('ONE'),
      TWO: this.input.keyboard!.addKey('TWO'),
      THREE: this.input.keyboard!.addKey('THREE'),
    };
    
    this.spawnNPCs();
    this.spawnMonsters();
    
    // Aim line for ranged/magic
    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0xff4444, 0.5);
    this.aimLine.setLineWidth(1);
    this.aimLine.setVisible(false);
    this.aimLine.setDepth(90);
    
    // Debug
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '11px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);
    
    this.scene.launch('UIScene', { gameScene: this });
    
    this.time.addEvent({ delay: 1000, callback: () => this.updateTime(), loop: true });
    
    // Inputs
    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.togglePause());
    this.keys.F5.on('down', () => this.quickSave());
    this.keys.F9.on('down', () => this.quickLoad());
    
    // Tab to switch combat mode: melee -> ranged -> magic
    this.keys.TAB.on('down', () => this.cycleCombatMode());
    
    // Number keys for spell/weapon selection
    this.keys.ONE.on('down', () => { this.player.currentCombatMode = 'melee'; this.updateUI(); });
    this.keys.TWO.on('down', () => { this.player.currentCombatMode = 'ranged'; this.updateUI(); });
    this.keys.THREE.on('down', () => { this.player.currentCombatMode = 'magic'; this.updateUI(); });
    
    // Mouse move for aiming
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.mouseX = pointer.worldX;
      this.mouseY = pointer.worldY;
    });
    
    // Mouse clicks
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        if (this.player.currentCombatMode === 'melee') {
          this.meleeAttack();
        } else if (this.player.currentCombatMode === 'ranged') {
          this.rangedAttack();
        } else if (this.player.currentCombatMode === 'magic') {
          this.magicAttack();
        }
      }
    });
    
    // Right-click = block (melee) or toggle aim
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        if (this.player.currentCombatMode === 'ranged' || this.player.currentCombatMode === 'magic') {
          this.aimVisible = !this.aimVisible;
          this.aimLine.setVisible(this.aimVisible);
        }
      }
    });
    
    this.input.mouse!.disableContextMenu();
  }

  generateProceduralMap() {
    const width = this.cameras.main.width * 4;
    const height = this.cameras.main.height * 4;
    
    // Use generated grass tile texture
    if (this.textures.exists('tile_grass')) {
      this.groundLayer = this.add.tileSprite(0, 0, width, height, 'tile_grass');
    } else {
      this.groundLayer = this.add.tileSprite(0, 0, width, height, '__DEFAULT');
      this.groundLayer.setTint(0x3a5a2a);
    }
    this.groundLayer.setOrigin(0, 0);
    
    // Road layer
    if (this.textures.exists('tile_road')) {
      const road = this.add.tileSprite(240, 230, 60, 500, 'tile_road');
      road.setOrigin(0, 0);
      road.setDepth(0);
    }
    
    this.addProceduralDecorations(width, height);
  }

  addProceduralDecorations(width: number, height: number) {
    const rng = new Phaser.Math.RandomDataGenerator(['gothic']);
    
    // Trees using generated texture
    if (this.textures.exists('tree')) {
      for (let i = 0; i < 50; i++) {
        const x = rng.between(50, width - 50);
        const y = rng.between(50, height - 50);
        // Avoid building areas
        if (Math.abs(x-200) < 100 && Math.abs(y-200) < 80) continue;
        if (Math.abs(x-700) < 90 && Math.abs(y-400) < 70) continue;
        const tree = this.add.image(x, y, 'tree');
        tree.setDepth(y);
        tree.setScale(rng.between(8, 12) / 10);
      }
    } else {
      // Fallback circles
      for (let i = 0; i < 50; i++) {
        const x = rng.between(50, width - 50);
        const y = rng.between(50, height - 50);
        this.add.circle(x, y - 10, rng.between(8, 16), 0x2a5a2a).setDepth(y);
      }
    }
    
    // Rocks
    if (this.textures.exists('rock')) {
      for (let i = 0; i < 20; i++) {
        const x = rng.between(50, width - 50);
        const y = rng.between(50, height - 50);
        this.add.image(x, y, 'rock').setDepth(y);
      }
    } else {
      for (let i = 0; i < 20; i++) {
        const x = rng.between(50, width - 50);
        const y = rng.between(50, height - 50);
        this.add.circle(x, y, rng.between(8, 18), 0x666666).setDepth(y);
      }
    }
    
    this.addBuilding(200, 200, 120, 80, 0x5a4a3a, 'Gród Straży');
    this.addBuilding(700, 400, 100, 70, 0x6b4a2a, 'Wolne Chaty');
    
    // Location labels
    this.add.text(800, 150, 'Cmentarzysko', { fontSize: '9px', color: '#666666' }).setOrigin(0.5).setDepth(1);
    this.add.text(1200, 700, 'Zapadlisko', { fontSize: '9px', color: '#445533' }).setOrigin(0.5).setDepth(1);
    this.add.text(1300, 200, 'Szczelina', { fontSize: '9px', color: '#442244' }).setOrigin(0.5).setDepth(1);
    this.add.text(150, 480, 'Mokra Plaża', { fontSize: '9px', color: '#889966' }).setOrigin(0.5).setDepth(1);
    
    // Path
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(4, 0x8b7355, 0.6);
    pathGraphics.beginPath();
    pathGraphics.moveTo(260, 240);
    pathGraphics.lineTo(700, 400);
    pathGraphics.strokePath();
    pathGraphics.setDepth(0);
    
    // Activate night overlay if needed
    this.add.rectangle(0, 0, width, height, 0x000022, 0).setOrigin(0, 0).setDepth(95).setName('nightOverlay');
  }

  addBuilding(x: number, y: number, w: number, h: number, color: number, label: string) {
    const building = this.add.rectangle(x, y, w, h, color).setDepth(y - h/2).setStrokeStyle(2, 0x2a1a0a);
    this.add.triangle(x, y - h/2 - 15, 0, 15, w, 15, w/2, -15, 0x6a3a1a).setDepth(y - h/2 - 20);
    this.add.rectangle(x, y + h/4, 16, 24, 0x3a2a1a).setDepth(y);
    this.add.text(x, y - h/2 - 30, label, { fontSize: '12px', color: '#ffffcc', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(y - h/2 - 25);
  }

  spawnNPCs() {
    if (!this.gameData.npcs) return;
    for (const data of this.gameData.npcs) {
      this.npcs.push(new NPC(this, data.spawn_position.x * 2, data.spawn_position.y * 2, data));
    }
  }

  spawnMonsters() {
    if (!this.gameData.monsters) return;
    const rng = new Phaser.Math.RandomDataGenerator(['monsters']);
    for (const data of this.gameData.monsters) {
      const count = data.behavior.includes('pack') ? 3 : 2;
      for (let i = 0; i < count; i++) {
        this.monsters.push(new Monster(this, rng.between(200, 1400), rng.between(200, 1000), data));
      }
    }
  }

  update(_time: number, delta: number) {
    if (this.isPaused) return;
    
    // Movement
    let vx = 0, vy = 0;
    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -1;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = 1;
    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -1;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = 1;
    
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    
    if (vx !== 0 || vy !== 0) this.player.move(vx, vy);
    else this.player.stopMoving();
    this.player.speed = this.keys.SHIFT.isDown ? 180 : 120;
    
    // Aim line for ranged/magic
    if (this.aimVisible && (this.player.currentCombatMode === 'ranged' || this.player.currentCombatMode === 'magic')) {
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, this.mouseX, this.mouseY);
      const len = Math.min(200, Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mouseX, this.mouseY));
      this.aimLine.setTo(0, 0, Math.cos(angle) * len, Math.sin(angle) * len);
      this.aimLine.setPosition(this.player.x, this.player.y);
    }
    
    this.checkInteraction();
    
    for (const npc of this.npcs) npc.update(delta, this.player);
    for (const monster of this.monsters) monster.update(delta, this.player, this.npcs);
    
    // Projectile system
    this.projectileSystem.update(delta, (p) => {
      for (const monster of this.monsters) {
        if (!monster.isAlive) continue;
        const dist = Phaser.Math.Distance.Between(p.x, p.y, monster.x, monster.y);
        if (dist < 20) {
          const killed = monster.takeDamage(p.damage);
          if (killed) {
            this.player.addXp(monster.monsterData.stats.xp_reward);
            this.player.gold += Phaser.Math.Between(1, 3);
            this.showXpPopup(monster.x, monster.y, `+${monster.monsterData.stats.xp_reward} XP`);
          }
          return true;
        }
      }
      return false;
    });
    
    // Regen
    if (this.player.hp < this.player.maxHp && delta > 0) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (delta / 5000));
    }
    if (this.player.mana < this.player.maxMana && delta > 0) {
      this.player.mana = Math.min(this.player.maxMana, this.player.mana + (delta / 3000));
    }
    
    this.debugText.setText(
      `Tryb: ${this.player.currentCombatMode} | LVL:${this.player.level} | ` +
      `HP:${Math.floor(this.player.hp)}/${this.player.maxHp} | MP:${Math.floor(this.player.mana)}/${this.player.maxMana} | ` +
      `XP:${this.player.xp}/${this.player.xpToNext} | Zł:${this.player.gold} | PKT:${this.player.skillPoints}\n` +
      `NPC:${this.npcs.filter(n => n.isAlive).length} | Pot:${this.monsters.filter(m => m.isAlive).length}\n` +
      `[1]Miecz [2]Łuk [3]Magia | Tab:zmiana | Interakcja: ${this.currentInteractable?.npcData?.name || (this.currentInteractable ? 'trup' : 'brak')}`
    );
    
    this.timeSystem.update(delta);
    
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
  }

  cycleCombatMode() {
    const modes: Array<'melee' | 'ranged' | 'magic'> = ['melee', 'ranged', 'magic'];
    const current = this.player.currentCombatMode === 'idle' ? 'melee' : this.player.currentCombatMode;
    const idx = modes.indexOf(current);
    if (idx < 0) { this.player.currentCombatMode = 'melee'; }
    else { this.player.currentCombatMode = modes[(idx + 1) % 3]; }
    this.aimVisible = this.player.currentCombatMode === 'ranged' || this.player.currentCombatMode === 'magic';
    this.aimLine.setVisible(this.aimVisible);
    this.updateUI();
  }

  private updateUI() {
    const event = new CustomEvent('game:combatMode', { detail: { mode: this.player.currentCombatMode } });
    window.dispatchEvent(event);
  }

  checkInteraction() {
    let nearest = null;
    let nearestDist = 80;
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
    this.currentInteractable = nearest;
  }

  interact() {
    if (!this.currentInteractable) return;
    if (this.currentInteractable instanceof NPC) {
      const npc = this.currentInteractable as NPC;
      
      // Try pickpocket if sneaking (CTRL held)
      if (this.keys.SPACE.isDown) {
        this.tryPickpocket(npc);
        return;
      }
      
      npc.interact(this);
    } else if (this.currentInteractable instanceof Monster) {
      const monster = this.currentInteractable as Monster;
      if (!monster.isAlive) {
        this.lootMonster(monster);
      }
    }
  }

  private tryPickpocket(npc: NPC) {
    const skillRank = this.player.skillRanks['pickpocket'] || 0;
    const result = this.crimeSystem.tryPickpocket(
      this.player.x, this.player.y, npc.x, npc.y, skillRank, npc.npcData.stats.level
    );
    
    const event = new CustomEvent('game:message', { detail: result.message });
    window.dispatchEvent(event);
    
    if (result.success) {
      // Steal random item from NPC
      const items = npc.npcData.inventory;
      if (items.length > 0) {
        const stolen = items[Math.floor(Math.random() * items.length)];
        this.player.addToInventory(stolen);
        const event2 = new CustomEvent('game:message', { detail: `Zdobyto: ${stolen}` });
        window.dispatchEvent(event2);
      } else {
        this.player.gold += Phaser.Math.Between(1, 5);
      }
    } else if (result.detected) {
      this.player.reputation[npc.npcData.faction] = (this.player.reputation[npc.npcData.faction] || 0) - 10;
      // NPC becomes hostile
      npc.isHostile = true;
    }
  }

  lootMonster(monster: Monster) {
    const items = monster.getLoot();
    for (const itemId of items) this.player.addToInventory(itemId);
    
    // Skinning
    const skinningRank = this.player.skillRanks['skinning'] || 0;
    if (skinningRank > 0) {
      const bonusLoot = monster.monsterData.loot_table;
      if (bonusLoot === 'loot_wolf') this.player.addToInventory('misc_skins_wolf');
      else if (bonusLoot === 'loot_boar') this.player.addToInventory('misc_skins_boar');
      else if (bonusLoot === 'loot_mutant') this.player.addToInventory('misc_trophy_mutant_eye');
      else if (bonusLoot === 'loot_wyrm') this.player.addToInventory('misc_trophy_wyrm_scale');
    }
    
    const event = new CustomEvent('game:message', { detail: `Łup: ${items.length} przedmiotów${skinningRank > 0 ? ' (+skórowanie)' : ''}` });
    window.dispatchEvent(event);
    monster.destroy();
  }

  meleeAttack() {
    if (this.attackCooldown > 0) return;
    
    // Find weapon speed
    let cooldown = 500;
    const weaponId = this.player.equippedWeapon;
    if (weaponId) {
      const weapon = this.dataLoader.findById('items_weapons_swords', weaponId);
      if (weapon) cooldown = weapon.speed || 500;
    }
    this.attackCooldown = cooldown;
    
    // Melee swing animation
    this.tweens.add({ targets: this.player, scaleX: 1.3, scaleY: 0.8, duration: 80, yoyo: true });
    
    let target: Monster | null = null;
    let targetDist = this.attackRange;
    for (const monster of this.monsters) {
      if (!monster.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (d < targetDist) { targetDist = d; target = monster; }
    }
    
    if (target) {
      const baseDmg = 8;
      const weaponBonus = this.player.equippedWeapon ? 5 : 0;
      const strBonus = Math.floor(this.player.strength * 1.5);
      const totalDmg = Math.max(1, baseDmg + weaponBonus + strBonus);
      
      const killed = target.takeDamage(totalDmg);
      const event = new CustomEvent('game:playerHit', { detail: { damage: totalDmg } });
      window.dispatchEvent(event);
      
      const knockAngle = Phaser.Math.Angle.Between(target.x, target.y, this.player.x, this.player.y);
      this.tweens.add({ targets: target, x: target.x + Math.cos(knockAngle) * 15, y: target.y + Math.sin(knockAngle) * 15, duration: 100 });
      
      if (killed) {
        this.player.addXp(target.monsterData.stats.xp_reward);
        this.player.gold += Phaser.Math.Between(1, 5);
        this.showXpPopup(target.x, target.y, `+${target.monsterData.stats.xp_reward} XP`);
      }
    }
  }

  rangedAttack() {
    if (this.attackCooldown > 0) return;
    if (this.player.getItemCount('misc_arrow') <= 0) {
      const event = new CustomEvent('game:message', { detail: 'Brak strzał!' });
      window.dispatchEvent(event);
      return;
    }
    
    this.player.removeFromInventory('misc_arrow');
    this.attackCooldown = 800;
    
    const bowDmg = 6;
    const dexBonus = Math.floor(this.player.dexterity * 1.2);
    const totalDmg = Math.max(1, bowDmg + dexBonus);
    
    this.projectileSystem.fire(
      this.player.x, this.player.y, this.mouseX, this.mouseY,
      350, totalDmg, 'physical', 'player'
    );
    
    this.tweens.add({ targets: this.player, scaleX: 1.1, duration: 100, yoyo: true });
  }

  magicAttack() {
    if (this.attackCooldown > 0) return;
    if (this.player.mana < 15) {
      const event = new CustomEvent('game:message', { detail: 'Za mało many!' });
      window.dispatchEvent(event);
      return;
    }
    
    this.attackCooldown = 1200;
    this.player.mana -= 15;
    
    // Cycle spells if multiple known
    const spells = this.player.knownSpells.length > 0 ? this.player.knownSpells : ['spell_fire_bolt'];
    this.currentSpellIndex = (this.currentSpellIndex + 1) % spells.length;
    const spellId = spells[this.currentSpellIndex];
    
    const spellData = this.dataLoader.findById('spells', spellId) || { damage: 15, damage_type: 'fire' };
    const damageType = spellData.damage_type === 'ice' ? 'ice' : 'fire';
    const totalDmg = spellData.damage || 15;
    
    // Cast animation
    this.tweens.add({
      targets: this.player,
      scaleX: 0.8, scaleY: 1.2,
      duration: 200, yoyo: true,
    });
    
    this.projectileSystem.fire(
      this.player.x, this.player.y, this.mouseX, this.mouseY,
      280, totalDmg, damageType, 'player'
    );
    
    const color = damageType === 'fire' ? '#ff4400' : '#44aaff';
    const event = new CustomEvent('game:message', { detail: `Rzucasz ${spellData.name || 'czar'}!` });
    window.dispatchEvent(event);
  }

  private showXpPopup(x: number, y: number, text: string) {
    const popup = this.add.text(x, y - 20, text, {
      fontSize: '10px', color: '#ffcc00', stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5);
    this.tweens.add({ targets: popup, y: y - 50, alpha: 0, duration: 1000, onComplete: () => popup.destroy() });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) this.scene.launch('MenuScene', { from: 'pause', gameScene: this });
  }

  async quickSave() {
    await this.saveSystem.autosave(this.buildSaveData());
    const event = new CustomEvent('game:message', { detail: 'Gra zapisana!' });
    window.dispatchEvent(event);
  }

  async quickLoad() {
    const data = await this.saveSystem.load(0);
    if (data) {
      this.loadSaveData(data);
      const event = new CustomEvent('game:message', { detail: 'Gra wczytana!' });
      window.dispatchEvent(event);
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
      reputation: this.player.reputation, dialog_flags: {},
      discovered_locations: ['loc_beach'], opened_chests: [],
      harvested_plants: [], killed_monsters: {},
      faction_choice: this.player.faction, time_of_day: this.timeSystem.getTimeOfDay(), game_day: this.timeSystem.getGameDay()
    };
  }

  loadSaveData(data: any) {
    this.player.loadSaveData(data.player);
    this.timeSystem.loadSaveData({ currentTime: data.time_of_day, gameDay: data.game_day });
    if (data.quests) this.questSystem.loadSaveData(data.quests);
  }

  private updateTime() {
    const lightFactor = this.timeSystem.getLightFactor();
    const event = new CustomEvent('game:time', {
      detail: {
        time: this.timeSystem.getFormattedTime(), day: this.timeSystem.getGameDay(),
        isNight: this.timeSystem.isNight(), lightFactor
      }
    });
    window.dispatchEvent(event);
  }

  getPlayerDistanceFrom(x: number, y: number, maxDist: number = 400): boolean {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < maxDist;
  }
}
