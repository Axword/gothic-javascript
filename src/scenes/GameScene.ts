import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { Monster } from '../entities/Monster';
import { DataLoader, LoadedData } from '../systems/DataLoader';
import { TimeSystem } from '../systems/TimeSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { QuestSystem } from '../systems/QuestSystem';

export class GameScene extends Phaser.Scene {
  public player!: Player;
  public npcs: NPC[] = [];
  public monsters: Monster[] = [];
  public dataLoader!: DataLoader;
  public timeSystem!: TimeSystem;
  public saveSystem!: SaveSystem;
  public questSystem!: QuestSystem;
  public gameData!: LoadedData;
  
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private interactionZone!: Phaser.GameObjects.Zone;
  private currentInteractable: any = null;
  private groundLayer!: Phaser.GameObjects.TileSprite;
  private debugText!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private attackCooldown: number = 0;
  private attackRange: number = 40;
  private xpPopup: Phaser.GameObjects.Text | null = null;

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
    // Tło proceduralne
    this.generateProceduralMap();
    
    // Gracz
    this.player = new Player(this, 400, 500);
    
    // Kamera
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // Sterowanie
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
    };
    
    // Interakcja
    this.interactionZone = this.add.zone(0, 0, 32, 32);
    this.physics.add.existing(this.interactionZone, true);
    
    // NPC (generacja proceduralna)
    this.spawnNPCs();
    this.spawnMonsters();
    
    // Debug text
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '11px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setScrollFactor(0).setDepth(100);
    
    // Uruchom UI
    this.scene.launch('UIScene', { gameScene: this });
    
    // Time events
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateTime(),
      loop: true
    });
    
    // Klawisz E - interakcja
    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.togglePause());
    
    // Przyciski szybkiego zapisu
    this.keys.F5.on('down', () => this.quickSave());
    this.keys.F9.on('down', () => this.quickLoad());
    
    // Atak lewym przyciskiem myszy
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.playerAttack();
      }
    });
  }

  generateProceduralMap() {
    // Tworzymy tło proceduralne
    const width = this.cameras.main.width * 4;
    const height = this.cameras.main.height * 4;
    
    // Główna płaszczyzna trawy
    this.groundLayer = this.add.tileSprite(0, 0, width, height, '__DEFAULT');
    this.groundLayer.setOrigin(0, 0);
    this.groundLayer.setTint(0x3a5a2a);
    
    // Światło otoczenia
    const ambientLight = this.add.rectangle(0, 0, width, height, 0xffffff, 0.1);
    ambientLight.setOrigin(0, 0);
    
    // Dodaj jakieś proceduralne elementy (drzewa, skały, budynki)
    this.addProceduralDecorations(width, height);
  }

  addProceduralDecorations(width: number, height: number) {
    const rng = new Phaser.Math.RandomDataGenerator(['gothic']);
    
    // Drzewa
    for (let i = 0; i < 80; i++) {
      const x = rng.between(50, width - 50);
      const y = rng.between(50, height - 50);
      const treeHeight = rng.between(40, 70);
      const treeColor = Phaser.Display.Color.GetColor(
        rng.between(20, 60),
        rng.between(60, 120),
        rng.between(20, 50)
      );
      
      const trunk = this.add.rectangle(x - 3, y, 6, treeHeight * 0.4, 0x3d2b1f);
      trunk.setDepth(y);
      
      const crown = this.add.circle(x, y - treeHeight * 0.3, treeHeight * 0.3, treeColor);
      crown.setDepth(y + 1);
    }
    
    // Skały
    for (let i = 0; i < 30; i++) {
      const x = rng.between(50, width - 50);
      const y = rng.between(50, height - 50);
      const rock = this.add.circle(x, y, rng.between(8, 18), 0x666666);
      rock.setDepth(y);
    }
    
    // Budynek - Gród Straży
    this.addBuilding(200, 200, 120, 80, 0x5a4a3a, 'Gród Straży');
    
    // Budynek - Wolne Chaty
    this.addBuilding(700, 400, 100, 70, 0x6b4a2a, 'Wolne Chaty');
    
    // Ścieżka/łącznik między osadami
    const pathGraphics = this.add.graphics();
    pathGraphics.lineStyle(4, 0x8b7355, 0.6);
    pathGraphics.beginPath();
    pathGraphics.moveTo(260, 240);
    pathGraphics.lineTo(700, 400);
    pathGraphics.strokePath();
    pathGraphics.setDepth(0);
    
    // Kamienna droga (wariant kropkowany)
    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const px = 260 + (700 - 260) * t;
      const py = 240 + (400 - 240) * t;
      const dot = this.add.circle(px + rng.between(-5, 5), py + rng.between(-5, 5), 
        rng.between(2, 4), 0x9a8a6a, 0.5);
      dot.setDepth(0);
    }
  }

  addBuilding(x: number, y: number, w: number, h: number, color: number, label: string) {
    const building = this.add.rectangle(x, y, w, h, color);
    building.setDepth(y - h / 2);
    building.setStrokeStyle(2, 0x2a1a0a);
    
    // Dach (trójkąt)
    const roof = this.add.triangle(x, y - h/2 - 15, 0, 15, w, 15, w/2, -15, 0x6a3a1a);
    roof.setDepth(y - h/2 - 20);
    
    // Drzwi
    const door = this.add.rectangle(x, y + h/4, 16, 24, 0x3a2a1a);
    door.setDepth(y);
    
    // Etykieta
    const text = this.add.text(x, y - h/2 - 30, label, {
      fontSize: '12px',
      color: '#ffffcc',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    text.setDepth(y - h/2 - 25);
  }

  spawnNPCs() {
    const npcData = this.gameData.npcs;
    if (!npcData) return;
    
    for (const data of npcData) {
      const npc = new NPC(this, data.spawn_position.x * 2, data.spawn_position.y * 2, data);
      this.npcs.push(npc);
    }
  }

  spawnMonsters() {
    const monsterData = this.gameData.monsters;
    if (!monsterData) return;
    
    const rng = new Phaser.Math.RandomDataGenerator(['monsters']);
    
    for (const data of monsterData) {
      // Spawn po kilka sztuk
      const count = data.behavior.includes('pack') ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const x = rng.between(200, 1400);
        const y = rng.between(200, 1000);
        const monster = new Monster(this, x, y, data);
        this.monsters.push(monster);
      }
    }
  }

  update(_time: number, delta: number) {
    if (this.isPaused) return;
    
    // Ruch gracza
    let vx = 0, vy = 0;
    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -1;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = 1;
    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -1;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = 1;
    
    // Normalizacja prędkości diagonalnej
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }
    
    if (vx !== 0 || vy !== 0) {
      this.player.move(vx, vy);
    } else {
      this.player.stopMoving();
    }
    
    // Bieg z shift
    if (this.keys.SHIFT.isDown) {
      this.player.speed = 180;
    } else {
      this.player.speed = 120;
    }
    
    // Interakcja - sprawdzanie najbliższego NPC
    this.checkInteraction();
    
    // Update NPC
    for (const npc of this.npcs) {
      npc.update(delta, this.player);
    }
    
    // Update monsters
    for (const monster of this.monsters) {
      monster.update(delta, this.player, this.npcs);
    }
    
    // Awaryjna regeneracja HP (co 5 sekund 1 HP)
    if (this.player.hp < this.player.maxHp && delta > 0) {
      const regenRate = 1; // HP na 5 sekund
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + (delta / 5000) * regenRate);
    }
    
    // Debug text
    this.debugText.setText(
      `XP: ${this.player.xp}/${this.player.xpToNext}  LVL: ${this.player.level}\n` +
      `HP: ${Math.floor(this.player.hp)}/${this.player.maxHp}  MP: ${Math.floor(this.player.mana)}/${this.player.maxMana}\n` +
      `Złoto: ${this.player.gold}  PKT: ${this.player.skillPoints}\n` +
      `Pozycja: ${Math.floor(this.player.x)},${Math.floor(this.player.y)}\n` +
      `Bron: ${this.player.equippedWeapon || 'brak'}\n` +
      `Interakcja: ${this.currentInteractable ? this.currentInteractable.npcData?.name || 'obiekt' : 'brak'}`
    );
    
    // Time
    this.timeSystem.update(delta);
    
    // Atak cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= delta;
  }

  checkInteraction() {
    let nearest = null;
    let nearestDist = 80; // zasięg interakcji
    
    for (const npc of this.npcs) {
      if (!npc.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = npc;
      }
    }
    
    // Sprawdź też monstra (martwe = loot)
    for (const monster of this.monsters) {
      if (monster.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = monster;
      }
    }
    
    this.currentInteractable = nearest;
  }

  interact() {
    if (!this.currentInteractable) return;
    
    if (this.currentInteractable instanceof NPC) {
      const npc = this.currentInteractable as NPC;
      npc.interact(this);
    } else if (this.currentInteractable instanceof Monster) {
      const monster = this.currentInteractable as Monster;
      if (!monster.isAlive) {
        this.lootMonster(monster);
      }
    }
  }

  lootMonster(monster: Monster) {
    const items = monster.getLoot();
    let msg = '';
    for (const itemId of items) {
      this.player.addToInventory(itemId);
      msg += `${itemId}, `;
    }
    const event = new CustomEvent('game:message', { 
      detail: `Łup: ${msg}${this.player.gold > 0 ? `złoto: ${this.player.gold}` : ''}` 
    });
    window.dispatchEvent(event);
    monster.destroy();
  }

  /** Gracz atakuje najbliższego potwora lub NPC */
  playerAttack() {
    if (this.attackCooldown > 0) return;
    
    // Szukaj celu w zasięgu przed graczem
    let target: Monster | null = null;
    let targetDist = this.attackRange;
    
    for (const monster of this.monsters) {
      if (!monster.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, monster.x, monster.y);
      if (dist < targetDist) {
        targetDist = dist;
        target = monster;
      }
    }
    
    // Ustaw cooldown (szybkość broni)
    this.attackCooldown = 500; // ms
    
    // Animacja ataku
    this.tweens.add({
      targets: this.player,
      scaleX: 1.3,
      scaleY: 0.8,
      duration: 80,
      yoyo: true,
    });
    
    if (target) {
      // Oblicz obrażenia
      const baseDmg = 8; // bazowe obrażenia bez broni
      const strBonus = Math.floor(this.player.strength * 1.5);
      const totalDmg = Math.max(1, baseDmg + strBonus);
      
      const killed = target.takeDamage(totalDmg);
      
      // Komunikat o trafieniu
      const event = new CustomEvent('game:playerHit', { 
        detail: { damage: totalDmg, target: 'potwór' } 
      });
      window.dispatchEvent(event);
      
      // Odbicie potwora
      const knockAngle = Phaser.Math.Angle.Between(target.x, target.y, this.player.x, this.player.y);
      this.tweens.add({
        targets: target,
        x: target.x + Math.cos(knockAngle) * 15,
        y: target.y + Math.sin(knockAngle) * 15,
        duration: 100,
        ease: 'Power2'
      });
      
      if (killed) {
        this.player.addXp(target.monsterData.stats.xp_reward);
        this.player.gold += Phaser.Math.Between(1, 5);
        
        const event2 = new CustomEvent('game:message', { 
          detail: `Pokonano ${target.monsterData.name}! +${target.monsterData.stats.xp_reward} XP` 
        });
        window.dispatchEvent(event2);
        
        // Popup XP
        this.showXpPopup(target.x, target.y, `+${target.monsterData.stats.xp_reward} XP`);
      }
    } else {
      // Atak w powietrze
      const event = new CustomEvent('game:message', { detail: 'Ciach! (pusto)' });
      window.dispatchEvent(event);
    }
  }
  
  private showXpPopup(x: number, y: number, text: string) {
    const popup = this.add.text(x, y - 20, text, {
      fontSize: '10px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => popup.destroy()
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.scene.launch('MenuScene', { from: 'pause', gameScene: this });
    }
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
      version: '0.1.0',
      timestamp: Date.now(),
      play_time: 0,
      player: {
        x: this.player.x,
        y: this.player.y,
        location_id: 'loc_beach',
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        mana: this.player.mana,
        maxMana: this.player.maxMana,
        strength: this.player.strength,
        dexterity: this.player.dexterity,
        level: this.player.level,
        xp: this.player.xp,
        skillPoints: this.player.skillPoints,
        gold: this.player.gold,
        equippedWeapon: this.player.equippedWeapon,
        equippedArmor: this.player.equippedArmor,
        knownSpells: this.player.knownSpells,
        factionChoice: this.player.faction,
        reputation: this.player.reputation,
        inventory: this.player.inventory,
        inventoryCounts: this.player.inventoryCounts,
        skillRanks: this.player.skillRanks
      },
      quests: [],
      npcs: this.npcs.filter(n => n.isAlive).map(n => ({
        npc_id: n.npcData.id,
        hp: n.hp,
        position: { x: n.x, y: n.y, location_id: 'loc_beach' },
        is_alive: n.isAlive,
        is_knocked_out: false,
        current_activity: 'idle',
        flags: {},
        inventory: []
      })),
      reputation: this.player.reputation,
      dialog_flags: {},
      discovered_locations: ['loc_beach'],
      opened_chests: [],
      harvested_plants: [],
      killed_monsters: {},
      faction_choice: this.player.faction,
      time_of_day: this.timeSystem.getTimeOfDay(),
      game_day: this.timeSystem.getGameDay()
    };
  }

  loadSaveData(data: any) {
    this.player.loadSaveData(data.player);
    this.timeSystem.loadSaveData({
      currentTime: data.time_of_day,
      gameDay: data.game_day
    });
  }

  private updateTime() {
    // Miganie światła w zależności od pory dnia
    const lightFactor = this.timeSystem.getLightFactor();
    const ambient = this.children.list.find(c => 
      c.type === 'Rectangle' && c === this.children.list.find(cc => cc === c && (c as any).fillAlpha === 0.1)
    ) as Phaser.GameObjects.Rectangle | undefined;
    
    // Emituj event do UI
    const event = new CustomEvent('game:time', { 
      detail: { 
        time: this.timeSystem.getFormattedTime(), 
        day: this.timeSystem.getGameDay(),
        isNight: this.timeSystem.isNight(),
        lightFactor 
      } 
    });
    window.dispatchEvent(event);
  }

  getPlayerDistanceFrom(x: number, y: number, maxDist: number = 400): boolean {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < maxDist;
  }
}
