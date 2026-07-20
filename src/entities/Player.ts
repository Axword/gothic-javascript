import Phaser from 'phaser';
import { Faction } from '../types';
import { audio } from '../systems/AudioSystem';

export class Player extends Phaser.GameObjects.Container {
  public speed: number = 120;
  public hp: number = 50;
  public maxHp: number = 50;
  public mana: number = 20;
  public maxMana: number = 20;
  public strength: number = 4;
  public dexterity: number = 4;
  public armor: number = 0;
  public magicResist: number = 0;
  public level: number = 1;
  public xp: number = 0;
  public xpToNext: number = 100;
  public skillPoints: number = 0;
  public gold: number = 20;
  public faction: Faction | null = null;
  public reputation: Record<string, number> = { old_order: 0, new_order: 0 };

  public equippedWeapon: string | null = null;
  public equippedArmor: string | null = null;
  public knownSpells: string[] = [];
  public skillRanks: Record<string, number> = {};

  public inventory: string[] = [];
  public inventoryCounts: Record<string, number> = {};

  public isAlive: boolean = true;
  public isInCombat: boolean = false;
  public currentCombatMode: 'idle' | 'melee' | 'ranged' | 'magic' = 'idle';
  private direction: 'down' | 'up' | 'left' | 'right' = 'down';

  private sprite!: Phaser.GameObjects.Image;
  private label: Phaser.GameObjects.Text;

  getDirectionFrame(): number {
    const frames: Record<string, number> = { 'down': 0, 'left': 1, 'right': 2, 'up': 3 };
    return frames[this.direction] || 0;
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // Player sprite - 32x56 z 4 klatkami kierunku
    if (scene.textures.exists('char_player')) {
      this.sprite = scene.add.image(0, -4, 'char_player', 0);
      this.sprite.setOrigin(0.5, 1.0); // pivot na stopach
      this.sprite.setDisplaySize(32, 56);
    } else {
      // Fallback
      this.sprite = scene.add.image(0, -4, '__missing');
    }
    this.add(this.sprite);

    // Cień
    const shadow = scene.add.ellipse(0, 2, 16, 5, 0x000000, 0.4);
    shadow.setOrigin(0.5, 1);
    this.add(shadow);

    // Label (nazwa gracza)
    this.label = scene.add.text(0, -60, 'TY', {
      fontSize: '10px',
      color: '#ffff80',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add(this.label);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Hitbox 16x20, center pod stopami (sprite 32x56, pivot u dołu = stopa na 0,0)
    body.setSize(16, 20);
    body.setOffset(-8, -22);
    body.setCollideWorldBounds(true);
    body.setDrag(800);

    // Initialize starting inventory
    this.initStartingInventory();
    this.setDirection('down');
  }

  /** Initialize starting inventory based on balance */
  private initStartingInventory() {
    this.maxHp = 50 + 10 + this.strength * 3; // 72 HP at start
    this.hp = this.maxHp;
    this.maxMana = 20;
    this.mana = this.maxMana;
    this.gold = 20;
    this.xpToNext = 100;
    // Starting items
    this.clearInventory();
    this.addToInventory('misc_gold', 20);
    this.addToInventory('misc_arrow', 20);
    this.addToInventory('misc_lockpick_iron', 3);
    this.addToInventory('potion_healing_small', 2);
    this.addToInventory('sword_old_shortsword', 1);
    this.equippedWeapon = 'sword_old_shortsword';
  }

  clearInventory() {
    this.inventory = [];
    this.inventoryCounts = {};
  }

  setDirection(dir: 'down' | 'up' | 'left' | 'right') {
    this.direction = dir;
    if (this.sprite && 'setFrame' in this.sprite) {
      (this.sprite as Phaser.GameObjects.Image).setFrame(this.getDirectionFrame());
    }
  }

  getDirection() { return this.direction; }

  setLabel(text: string) {
    this.label.setText(text);
  }

  move(velX: number, velY: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(velX * this.speed, velY * this.speed);
    }
    if (velX < 0) this.setDirection('left');
    else if (velX > 0) this.setDirection('right');
    if (velY < 0) this.setDirection('up');
    else if (velY > 0) this.setDirection('down');
  }

  stopMoving() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);
  }

  /**
   * Apply damage using balance formula (BUG-005):
   * reduction_per_point=0.01, max_reduction=0.8, min_dmg=1
   */
  takeDamage(amount: number): number {
    const reduction = Math.min(this.armor * 0.01 * amount, amount * 0.8);
    const finalDamage = Math.max(1, Math.floor(amount - reduction));
    this.hp -= finalDamage;
    if (this.hp <= 0) { this.hp = 0; this.isAlive = false; }
    return finalDamage;
  }

  heal(amount: number) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  restoreMana(amount: number) { this.mana = Math.min(this.maxMana, this.mana + amount); }

  addXp(amount: number): boolean {
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.levelUp();
      leveledUp = true;
    }
    return leveledUp;
  }

  private levelUp() {
    this.level++;
    this.xpToNext = Math.floor(100 * Math.pow(1.5, this.level - 1));
    this.maxHp += 10; this.hp = this.maxHp;
    this.maxMana += 5; this.skillPoints += 2; this.mana = this.maxMana;
    try { audio.sfxLevelUp(); } catch {}
  }

  addToInventory(itemId: string, count: number = 1) {
    if (!this.inventoryCounts[itemId]) { this.inventory.push(itemId); this.inventoryCounts[itemId] = 0; }
    this.inventoryCounts[itemId] = (this.inventoryCounts[itemId] || 0) + count;
  }

  removeFromInventory(itemId: string, count: number = 1): boolean {
    if (!this.inventoryCounts[itemId] || this.inventoryCounts[itemId] < count) return false;
    this.inventoryCounts[itemId] -= count;
    if (this.inventoryCounts[itemId] <= 0) {
      this.inventory = this.inventory.filter(id => id !== itemId);
      delete this.inventoryCounts[itemId];
    }
    return true;
  }

  getItemCount(itemId: string): number { return this.inventoryCounts[itemId] || 0; }

  /** Equip weapon or armor; returns previously equipped item id (or null) to inventory */
  equip(itemId: string, itemData?: any): string | null {
    if (!itemData) return null;
    const cat = itemData.category;
    let previous: string | null = null;
    if (cat === 'weapon_sword' || cat === 'weapon_bow') {
      previous = this.equippedWeapon;
      this.equippedWeapon = itemId;
      // Apply stat requirements check is done externally
    } else if (cat === 'armor') {
      previous = this.equippedArmor;
      this.equippedArmor = itemId;
      this.armor = itemData.armor || 0;
      this.magicResist = itemData.magic_resist || 0;
    }
    return previous;
  }

  unequip(slot: 'weapon' | 'armor') {
    if (slot === 'weapon') this.equippedWeapon = null;
    else {
      this.equippedArmor = null;
      this.armor = 0;
      this.magicResist = 0;
    }
  }

  /** Check if player meets requirements */
  meetsRequirements(reqs: any): { ok: boolean; reason?: string } {
    if (!reqs) return { ok: true };
    if (reqs.strength && this.strength < reqs.strength) return { ok: false, reason: `Wymaga siły ${reqs.strength}` };
    if (reqs.dexterity && this.dexterity < reqs.dexterity) return { ok: false, reason: `Wymaga zręczności ${reqs.dexterity}` };
    if (reqs.level && this.level < reqs.level) return { ok: false, reason: `Wymaga poziomu ${reqs.level}` };
    if (reqs.faction && this.faction !== reqs.faction) return { ok: false, reason: `Wymaga frakcji ${reqs.faction}` };
    return { ok: true };
  }

  getSaveData() {
    return {
      x: this.x, y: this.y, hp: this.hp, maxHp: this.maxHp,
      mana: this.mana, maxMana: this.maxMana,
      strength: this.strength, dexterity: this.dexterity,
      level: this.level, xp: this.xp,
      skillPoints: this.skillPoints, gold: this.gold,
      equippedWeapon: this.equippedWeapon, equippedArmor: this.equippedArmor,
      knownSpells: this.knownSpells, faction: this.faction,
      reputation: { ...this.reputation }, inventory: [...this.inventory],
      inventoryCounts: { ...this.inventoryCounts }, skillRanks: { ...this.skillRanks }
    };
  }

  loadSaveData(data: any) {
    this.hp = data.hp ?? this.hp;
    this.maxHp = data.maxHp ?? this.maxHp;
    this.mana = data.mana ?? this.mana;
    this.maxMana = data.maxMana ?? this.maxMana;
    this.strength = data.strength ?? this.strength;
    this.dexterity = data.dexterity ?? this.dexterity;
    this.level = data.level ?? this.level;
    this.xp = data.xp ?? this.xp;
    this.skillPoints = data.skillPoints ?? this.skillPoints;
    this.gold = data.gold ?? this.gold;
    this.equippedWeapon = data.equippedWeapon ?? null;
    this.equippedArmor = data.equippedArmor ?? null;
    this.knownSpells = data.knownSpells || [];
    this.faction = data.faction ?? null;
    this.reputation = data.reputation || { old_order: 0, new_order: 0 };
    this.inventory = data.inventory || [];
    this.inventoryCounts = data.inventoryCounts || {};
    this.skillRanks = data.skillRanks || {};
    this.xpToNext = Math.floor(100 * Math.pow(1.5, Math.max(1, this.level) - 1));
    this.isAlive = this.hp > 0;
    // Re-apply armor from equipped armor item if present
    this.armor = 0; this.magicResist = 0;
    this.setPosition(data.x ?? this.x, data.y ?? this.y);
  }
}
