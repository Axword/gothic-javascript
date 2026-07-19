import Phaser from 'phaser';
import { Faction } from '../types';

export class Player extends Phaser.GameObjects.Container {
  public speed: number = 120;
  public hp: number = 50;
  public maxHp: number = 50;
  public mana: number = 20;
  public maxMana: number = 20;
  public strength: number = 4;
  public dexterity: number = 4;
  public armor: number = 1;
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
  
  private bodySprite: Phaser.GameObjects.Rectangle;
  private weaponSprite: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    // Ciało gracza - brązowa postać
    this.bodySprite = scene.add.rectangle(0, 0, 20, 28, 0x6b4423);
    this.add(this.bodySprite);
    
    // Głowa
    const head = scene.add.rectangle(0, -16, 14, 14, 0xd4a574);
    this.add(head);
    
    // Broń (placeholder)
    this.weaponSprite = scene.add.rectangle(16, 0, 4, 20, 0x888888);
    this.weaponSprite.setVisible(false);
    this.add(this.weaponSprite);
    
    // Etykieta
    this.label = scene.add.text(0, -30, '', {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.add(this.label);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 28);
    body.setOffset(-10, -14);
    body.setCollideWorldBounds(true);
  }

  setDirection(dir: 'down' | 'up' | 'left' | 'right') {
    this.direction = dir;
    // Obrót sprite'a
    this.bodySprite.setRotation(dir === 'right' ? 0 : dir === 'left' ? Math.PI : dir === 'up' ? Math.PI : 0);
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

  takeDamage(amount: number): number {
    const effectiveArmor = this.armor * 1; // 1 pkt armor = 1% redukcji... let's use simpler formula
    const reduction = Math.min(this.armor * 0.5, amount * 0.5);
    const finalDamage = Math.max(1, Math.floor(amount - reduction));
    this.hp -= finalDamage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isAlive = false;
    }
    return finalDamage;
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  restoreMana(amount: number) {
    this.mana = Math.min(this.maxMana, this.mana + amount);
  }

  addXp(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.levelUp();
      return true;
    }
    return false;
  }

  private levelUp() {
    this.xp -= this.xpToNext;
    this.level++;
    this.xpToNext = Math.floor(100 * Math.pow(1.5, this.level - 1));
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.maxMana += 5;
    this.skillPoints += 2;
    this.mana = this.maxMana;
  }

  addToInventory(itemId: string, count: number = 1) {
    if (!this.inventoryCounts[itemId]) {
      this.inventory.push(itemId);
      this.inventoryCounts[itemId] = 0;
    }
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

  getItemCount(itemId: string): number {
    return this.inventoryCounts[itemId] || 0;
  }

  /** Zwraca dane do zapisu */
  getSaveData() {
    return {
      x: this.x, y: this.y,
      hp: this.hp, maxHp: this.maxHp,
      mana: this.mana, maxMana: this.maxMana,
      strength: this.strength, dexterity: this.dexterity,
      level: this.level, xp: this.xp,
      skillPoints: this.skillPoints, gold: this.gold,
      equippedWeapon: this.equippedWeapon,
      equippedArmor: this.equippedArmor,
      knownSpells: this.knownSpells,
      faction: this.faction,
      reputation: { ...this.reputation },
      inventory: [...this.inventory],
      inventoryCounts: { ...this.inventoryCounts },
      skillRanks: { ...this.skillRanks }
    };
  }

  loadSaveData(data: any) {
    this.hp = data.hp; this.maxHp = data.maxHp;
    this.mana = data.mana; this.maxMana = data.maxMana;
    this.strength = data.strength; this.dexterity = data.dexterity;
    this.level = data.level; this.xp = data.xp;
    this.skillPoints = data.skillPoints; this.gold = data.gold;
    this.equippedWeapon = data.equippedWeapon;
    this.equippedArmor = data.equippedArmor;
    this.knownSpells = data.knownSpells || [];
    this.faction = data.faction;
    this.reputation = data.reputation || {};
    this.inventory = data.inventory || [];
    this.inventoryCounts = data.inventoryCounts || {};
    this.skillRanks = data.skillRanks || {};
    this.xpToNext = Math.floor(100 * Math.pow(1.5, this.level - 1));
    this.setPosition(data.x, data.y);
  }
}
