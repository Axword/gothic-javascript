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
  container?: any;
}

interface Chest {
  id: string;
  x: number;
  y: number;
  difficulty: number;
  opened: boolean;
  loot: string[];
  owner_faction?: string;
  container?: Phaser.GameObjects.Container;
}

type BiomeType = 'beach' | 'forest' | 'swamp' | 'mountain' | 'road' | 'dark' | 'fort' | 'camp' | 'water';

// World layout (duży świat)
const WORLD_W = 3200;
const WORLD_H = 2400;

// Biome regions (rectangles)
interface Region { x: number; y: number; w: number; h: number; biome: BiomeType; label?: string; }
const REGIONS: Region[] = [
  // Plaża na dole
  { x: 0, y: 1900, w: WORLD_W, h: 500, biome: 'beach' },
  { x: 0, y: 2200, w: WORLD_W, h: 200, biome: 'water' },
  // Las w centrum-prawa
  { x: 1200, y: 800, w: 1000, h: 1000, biome: 'forest', label: 'Bór Bezgłosu' },
  // Bagna na prawo-dół
  { x: 2000, y: 1500, w: 1200, h: 600, biome: 'swamp', label: 'Czerwone Bagna' },
  // Góry na górze
  { x: 600, y: 0, w: 1200, h: 500, biome: 'mountain', label: 'Szare Grzbiety' },
  // Szczelina w górach (ciemny biom)
  { x: 1300, y: 100, w: 400, h: 300, biome: 'dark', label: 'Szczelina' },
  // Cmentarzysko w lesie
  { x: 2300, y: 600, w: 400, h: 400, biome: 'dark', label: 'Stary Cmentarz' },
  // Trakt - droga z południa na północ
  { x: 700, y: 0, w: 100, h: WORLD_H, biome: 'road', label: 'Trakt Północny' },
];

// Camps/settlements - clusters of buildings
const OLD_FORT = { x: 500, y: 600, label: 'Gród Straży' };
const NEW_CAMP = { x: 1600, y: 1300, label: 'Wolne Chaty' };

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
  private debugText!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private attackCooldown: number = 0;
  private attackRange: number = 50;
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
  private stepTimer: number = 0;

  constructor() { super({ key: 'GameScene' }); }

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
    this.stepTimer = 0;
  }

  create() {
    // Duży świat
    this.generateWorld();

    // Gracz startuje na plaży
    this.player = new Player(this, 750, 2050);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.setBackgroundColor('#0a0a0a');
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    if (this.gameData.balance?.time) this.timeSystem.configureFromBalance(this.gameData.balance);

    this.projectileSystem = new ProjectileSystem(this);
    this.lockpickMinigame = new LockpickMinigame(this);
    this.crimeSystem = new CrimeSystem(this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = {
      W: this.input.keyboard!.addKey('W'), A: this.input.keyboard!.addKey('A'),
      S: this.input.keyboard!.addKey('S'), D: this.input.keyboard!.addKey('D'),
      E: this.input.keyboard!.addKey('E'), I: this.input.keyboard!.addKey('I'),
      C: this.input.keyboard!.addKey('C'), J: this.input.keyboard!.addKey('J'),
      M: this.input.keyboard!.addKey('M'), ESC: this.input.keyboard!.addKey('ESC'),
      SPACE: this.input.keyboard!.addKey('SPACE'), SHIFT: this.input.keyboard!.addKey('SHIFT'),
      CTRL: this.input.keyboard!.addKey('CTRL'),
      F5: this.input.keyboard!.addKey('F5'), F9: this.input.keyboard!.addKey('F9'),
      TAB: this.input.keyboard!.addKey('TAB'),
      ONE: this.input.keyboard!.addKey('ONE'), TWO: this.input.keyboard!.addKey('TWO'), THREE: this.input.keyboard!.addKey('THREE'),
      FOUR: this.input.keyboard!.addKey('FOUR'),
    };

    this.spawnAllEntities();

    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0xff4444, 0.5);
    this.aimLine.setLineWidth(1.5);
    this.aimLine.setVisible(false);
    this.aimLine.setDepth(300);

    this.debugText = this.add.text(10, 10, '', {
      fontSize: '11px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(1000);

    if (!this.uiSceneLaunched) {
      this.scene.launch('UIScene', { gameScene: this });
      this.uiSceneLaunched = true;
    }

    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.togglePause());
    this.keys.F5.on('down', () => this.quickSave());
    this.keys.F9.on('down', () => this.quickLoad());
    this.keys.TAB.on('down', () => this.cycleCombatMode());
    this.keys.ONE.on('down', () => { this.player.currentCombatMode = 'melee'; this.aimLine.setVisible(false); this.aimVisible=false; this.updateUI(); });
    this.keys.TWO.on('down', () => { this.player.currentCombatMode = 'ranged'; this.aimVisible = true; this.aimLine.setVisible(true); this.updateUI(); });
    this.keys.THREE.on('down', () => { this.player.currentCombatMode = 'magic'; this.aimVisible = true; this.aimLine.setVisible(true); this.updateUI(); });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.mouseX = p.worldX; this.mouseY = p.worldY;
    });

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isPaused) return;
      audio.init().then(() => audio.startMusic());
      if (p.leftButtonDown()) {
        if (this.player.currentCombatMode === 'melee') this.meleeAttack();
        else if (this.player.currentCombatMode === 'ranged') this.rangedAttack();
        else if (this.player.currentCombatMode === 'magic') this.magicAttack();
        else this.meleeAttack();
      } else if (p.rightButtonDown()) {
        if (this.player.currentCombatMode === 'ranged' || this.player.currentCombatMode === 'magic') {
          this.aimVisible = !this.aimVisible;
          this.aimLine.setVisible(this.aimVisible);
        }
      }
    });

    this.input.mouse!.disableContextMenu();

    this.input.once('pointerdown', () => audio.init().then(() => audio.startMusic()));
    this.input.keyboard!.on('keydown', () => audio.init().then(() => audio.startMusic()));

    // Załaduj zapis jeśli wskazany
    const initData: any = this.scene.settings.data || {};
    if (initData.loadSlot !== undefined) {
      this.time.delayedCall(50, () => this.quickLoad(initData.loadSlot));
    } else {
      this.time.delayedCall(200, () => this.questSystem.startQuest('quest_main_arrival'));
    }
  }

  // ============================================================
  // GENERACJA ŚWIATA - duży, zróżnicowany
  // ============================================================
  private getBiomeAt(x: number, y: number): BiomeType {
    // Sprawdź od najbardziej szczegółowego do ogólnego
    for (const r of REGIONS) {
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r.biome;
    }
    return 'forest'; // domyślnie las
  }

  private getTileForBiome(b: BiomeType): string {
    switch (b) {
      case 'beach': return 'tile_beach';
      case 'swamp': return 'tile_swamp';
      case 'mountain': return 'tile_mountain';
      case 'road': return 'tile_road';
      case 'dark': return 'tile_dark';
      case 'water': return 'tile_water';
      case 'fort': case 'camp': return 'tile_grass';
      default: return 'tile_forest';
    }
  }

  private generateWorld() {
    // Podstawa - cała mapa trawa/las
    const defaultTex = this.textures.exists('tile_forest') ? 'tile_forest' : '__DEFAULT';
    const bg = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, defaultTex).setOrigin(0,0);

    // Nakładanie biomów - warstwami tile'ów
    for (const r of REGIONS) {
      const tex = this.getTileForBiome(r.biome);
      if (!this.textures.exists(tex)) continue;
      if (r.biome === 'road') {
        // Droga - węższy pas
        const road = this.add.tileSprite(r.x+10, r.y, 70, r.h, tex).setOrigin(0,0);
        road.setDepth(1);
      } else {
        const layer = this.add.tileSprite(r.x, r.y, r.w, r.h, tex).setOrigin(0,0);
        layer.setDepth(0.5);
      }
    }

    // Labels regionów
    for (const r of REGIONS) {
      if (r.label) {
        this.add.text(r.x+r.w/2, r.y+30, r.label, { fontSize: '14px', color: '#666', fontStyle: 'italic', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5).setDepth(2).setScrollFactor(1);
      }
    }

    // Old Fort - zabudowania drewniane/stone
    this.buildFort(OLD_FORT.x, OLD_FORT.y);
    // New Camp - namioty i szałasy
    this.buildCamp(NEW_CAMP.x, NEW_CAMP.y);

    // Rozmieszczenie dekoracji wg biomów
    this.populateWorld();

    // Night overlay
    this.nightOverlay = this.add.rectangle(0,0,WORLD_W,WORLD_H,0x000033,0).setOrigin(0,0).setDepth(500);
  }

  private buildFort(cx: number, cy: number) {
    // Palisada dookoła
    for (let i = -3; i <= 3; i++) {
      this.add.image(cx+i*50, cy-140, 'wall_wood').setDepth(cy-140).setScale(1);
      this.add.image(cx+i*50, cy+140, 'wall_wood').setDepth(cy+140).setScale(1);
    }
    for (let i = -2; i <= 2; i++) {
      this.add.image(cx-150, cy+i*50, 'wall_wood').setDepth(cy+i*50).setScale(1);
      this.add.image(cx+150, cy+i*50, 'wall_wood').setDepth(cy+i*50).setScale(1);
    }
    // Brama
    this.add.image(cx, cy-140, 'wall_wood').setScale(1,0.6).setDepth(cy-140);

    // Budynki wewnątrz
    this.addBuilding(cx-80, cy-40, 90, 70, '#4a3828', '#6a3818', 'KWATERA KOMENDANTA');
    this.addBuilding(cx+60, cy-60, 80, 60, '#3a3040', '#602010', 'ZBROJOWNIA');
    this.addBuilding(cx-30, cy+60, 100, 60, '#483820', '#6a4018', 'KUŹNIA I KARCZMA');
    this.add.image(cx, cy, 'campfire').setDepth(cy);

    this.add.text(cx, cy-170, OLD_FORT.label, { fontSize: '18px', color: '#ffcc00', stroke:'#000', strokeThickness: 4, fontStyle: 'bold' }).setOrigin(0.5).setDepth(cy+50).setScrollFactor(1);
  }

  private buildCamp(cx: number, cy: number) {
    // Namioty wokół ogniska
    for (let i=0; i<6; i++) {
      const ang = i * Math.PI/3;
      const tx = cx + Math.cos(ang)*100;
      const ty = cy + Math.sin(ang)*80;
      const flip = i % 2 === 0;
      const img = this.add.image(tx, ty, 'tent').setDepth(ty).setScale(1.2);
      if (flip) img.setFlipX(true);
    }
    // Szałas herszta
    this.add.image(cx+150, cy-80, 'hut').setDepth(cy-80).setScale(1.3);
    this.add.image(cx-140, cy+60, 'hut').setDepth(cy+60).setScale(1);
    this.add.image(cx, cy, 'campfire').setDepth(cy);

    this.add.text(cx, cy-120, NEW_CAMP.label, { fontSize: '18px', color: '#ff4020', stroke:'#000', strokeThickness: 4, fontStyle: 'bold' }).setOrigin(0.5).setDepth(cy+100).setScrollFactor(1);
  }

  private addBuilding(x: number, y: number, w: number, h: number, color: string, roof: string, label: string) {
    const r = this.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(color).color).setStrokeStyle(2, 0x1a0c04).setDepth(y);
    const roofH = 20;
    const tri = this.add.triangle(x, y-h/2-roofH/2+2, 0, roofH+5, w, roofH+5, w/2, -roofH, Phaser.Display.Color.HexStringToColor(roof).color).setDepth(y-h/2);
    // Drzwi
    this.add.rectangle(x, y+h/4-4, 14, 20, 0x1a0804).setDepth(y+1);
    this.add.text(x, y-h/2-35, label, { fontSize: '9px', color: '#ccaa66', stroke:'#000', strokeThickness: 2 }).setOrigin(0.5).setDepth(y+h);
  }

  private populateWorld() {
    const rng = new Phaser.Math.RandomDataGenerator(['gothic-world-2']);

    // Drzewa w lesie
    this.scatterInRegion('forest', 800, (x,y) => {
      const dead = rng.frac() < 0.1;
      const key = dead ? 'tree_dead' : 'tree';
      if (!this.textures.exists(key)) return;
      const s = 0.8 + rng.frac()*0.5;
      const t = this.add.image(x,y,key).setDepth(y).setScale(s);
    });
    // Drzewa na przejściu między lasem a górami
    this.scatterInRect(1200, 300, 1000, 500, 200, (x,y) => {
      if (this.textures.exists('tree_pine')) this.add.image(x,y,'tree_pine').setDepth(y).setScale(0.7 + rng.frac()*0.4);
    });
    // Skały w górach
    this.scatterInRegion('mountain', 300, (x,y) => {
      const b = rng.frac() < 0.2;
      if (b && this.textures.exists('boulder')) this.add.image(x,y,'boulder').setDepth(y).setScale(0.7+rng.frac()*0.5);
      else if (this.textures.exists('rock')) this.add.image(x,y,'rock').setDepth(y).setScale(0.8+rng.frac()*0.6);
    });
    // Skały na bagnach (rzadziej)
    this.scatterInRegion('swamp', 100, (x,y) => {
      if (this.textures.exists('rock')) this.add.image(x,y,'rock').setDepth(y).setScale(0.6+rng.frac()*0.4);
    });
    // Grzyby i krzewy w lesie
    this.scatterInRegion('forest', 150, (x,y) => {
      if (rng.frac() < 0.4 && this.textures.exists('bush')) this.add.image(x,y,'bush').setDepth(y).setScale(0.6+rng.frac()*0.4);
      if (rng.frac() < 0.3 && this.textures.exists('mushroom')) this.add.image(x,y,'mushroom').setDepth(y+1);
    });
    // Groby na cmentarzysku
    this.scatterInRect(2300, 600, 400, 400, 25, (x,y) => {
      if (this.textures.exists('gravestone')) this.add.image(x,y,'gravestone').setDepth(y).setScale(0.8+rng.frac()*0.4);
    });
    // Czaszki w ciemnych biomach
    this.scatterInRegion('dark', 30, (x,y) => {
      if (this.textures.exists('skull')) this.add.image(x,y,'skull').setDepth(y+1);
    });
    // Drogowskazy przy trakcie
    for (let y = 400; y < 2000; y += 500) {
      if (this.textures.exists('waypost')) this.add.image(750, y, 'waypost').setDepth(y);
    }
    // Rozrzucone skrzynie i przedmioty w świecie
    this.scatterWorldChestsAndItems();
  }

  private scatterInRegion(biome: BiomeType, count: number, cb: (x:number,y:number)=>void) {
    const rng = new Phaser.Math.RandomDataGenerator(['scatter', biome]);
    let placed = 0, tries = 0;
    while (placed < count && tries < count*10) {
      tries++;
      const x = rng.between(30, WORLD_W-30);
      const y = rng.between(30, WORLD_H-30);
      if (this.getBiomeAt(x,y) === biome) { cb(x,y); placed++; }
    }
  }

  private scatterInRect(x:number,y:number,w:number,h:number,count:number,cb:(xx:number,yy:number)=>void) {
    const seed = 'rect' + x + ',' + y + ',' + w + ',' + h;
    const rng = new Phaser.Math.RandomDataGenerator([seed]);
    for (let i=0;i<count;i++) cb(rng.between(x,x+w), rng.between(y,y+h));
  }

  private scatterWorldChestsAndItems() {
    // Skrzynie: w forcie, w obozie, w lesie, na bagnach, w ciemnych strefach
    const defs: Array<{x:number;y:number;diff:number;loot:string[];owner?:string}> = [
      { x: OLD_FORT.x-80, y: OLD_FORT.y-40, diff: 2, loot: ['sword_iron_longsword','misc_gold','misc_arrow'], owner: 'old_order' },
      { x: OLD_FORT.x+60, y: OLD_FORT.y-60, diff: 2, loot: ['armor_guard_chainmail','misc_lockpick_iron','potion_healing_small'], owner: 'old_order' },
      { x: NEW_CAMP.x+150, y: NEW_CAMP.y-80, diff: 2, loot: ['bow_shortbow','misc_lockpick_iron','potion_healing_small'], owner: 'new_order' },
      { x: 1000, y: 1200, diff: 1, loot: ['misc_gold','potion_healing_small'], owner: undefined },
      { x: 2200, y: 1700, diff: 3, loot: ['sword_obsidian_cleaver','misc_gold','potion_mana_small'] },
      { x: 1400, y: 200, diff: 3, loot: ['misc_trophy_mutant_eye','potion_healing_large','misc_gold'] }, // w Szczelinie
      { x: 2400, y: 800, diff: 2, loot: ['sword_bone_carver','misc_skins_wolf','misc_gold'] }, // cmentarzysko
      { x: 750, y: 2100, diff: 1, loot: ['misc_gold','misc_arrow','potion_healing_small'] }, // plaża
      { x: 2500, y: 1800, diff: 1, loot: ['plant_frost_grass','plant_moonweed','potion_stamina'] }, // bagna
    ];
    for (const def of defs) {
      const cont = this.add.container(def.x, def.y);
      const box = this.add.rectangle(0,0,28,22,0x4a2808).setStrokeStyle(2,0x201004);
      const lock = this.add.rectangle(0,2,4,6,0xccaa40);
      cont.add([box,lock]);
      cont.setDepth(def.y);
      this.chests.push({ id: `chest_${def.x}_${def.y}`, x:def.x, y:def.y, difficulty:def.diff, opened:false, loot:def.loot, owner_faction:def.owner, container:cont });
    }

    // Rośliny i luźne przedmioty rozsiane w odpowiednich biomach
    const rng = new Phaser.Math.RandomDataGenerator(['items-world']);
    const plants = this.gameData.items_plants || [];
    let plantIdx = 0;
    for (let i=0;i<80;i++) {
      const x = rng.between(100, WORLD_W-100);
      const y = rng.between(100, WORLD_H-100);
      const b = this.getBiomeAt(x,y);
      if (b === 'water') continue;
      const pickPlant = plants[plantIdx % plants.length];
      plantIdx++;
      const sprite = this.add.image(x,y,'herb').setDepth(y);
      if (b === 'dark') sprite.setTint(0x6655aa);
      else if (b === 'swamp') sprite.setTint(0x6a7a3a);
      else if (b === 'mountain') sprite.setTint(0x888888);
      this.worldItems.push({ id: `plant_${x}_${y}`, x, y, itemId: pickPlant.id, collected:false, container: sprite });
    }
    // Luźne strzały i złoto
    for (let i=0;i<30;i++) {
      const x = rng.between(100, WORLD_W-100);
      const y = rng.between(100, WORLD_H-100);
      if (this.getBiomeAt(x,y) === 'water') continue;
      const dot = this.add.rectangle(x,y,6,6,rng.frac()<0.5?0xccaa40:0xbbbb90).setDepth(y+1);
      const id = rng.frac()<0.5 ? 'misc_gold' : 'misc_arrow';
      this.worldItems.push({ id: `loose_${x}_${y}`, x, y, itemId: id, collected:false, container: dot });
    }
  }

  // ============================================================
  // NPC I POTWORY
  // ============================================================
  private spawnAllEntities() {
    this.spawnNPCsByFaction();
    this.spawnMonstersByBiome();
  }

  private spawnNPCsByFaction() {
    if (!this.gameData.npcs) return;
    // Podziel NPC wg frakcji
    const oldNpcs = this.gameData.npcs.filter(n => n.faction === 'old_order');
    const newNpcs = this.gameData.npcs.filter(n => n.faction === 'new_order');
    const neutralNpcs = this.gameData.npcs.filter(n => n.faction === 'neutral');
    const bandits = this.gameData.npcs.filter(n => n.faction === 'bandit');

    // Rozmieszczenie w obozie Straży
    this.placeNpcsInArea(oldNpcs, OLD_FORT.x-120, OLD_FORT.y-120, 240, 240, true);
    // Rozmieszczenie w Wolnych Chatach
    this.placeNpcsInArea(newNpcs, NEW_CAMP.x-140, NEW_CAMP.y-120, 280, 240, true);
    // Neutralni rozrzuceni po świecie (przy trakcie, na plaży, w lesie)
    this.placeNpcsScattered(neutralNpcs, [
      { x: 750, y: 2050, r: 150 }, // plaża/rozbitek
      { x: 750, y: 1300, r: 200 }, // przy trakcie
      { x: 750, y: 1700, r: 100 },
      { x: 1100, y: 1600, r: 200 },
      { x: 2000, y: 1100, r: 250 },
      { x: 2500, y: 1900, r: 200 },
      { x: 2500, y: 500, r: 150 },
    ]);
    // Bandyci w lesie i na bagnach
    this.placeNpcsScattered(bandits, [
      { x: 1200, y: 1000, r: 300 },
      { x: 2100, y: 1700, r: 300 },
      { x: 1800, y: 500, r: 200 },
    ]);
  }

  private placeNpcsInArea(list: any[], cx:number, cy:number, w:number, h:number, cluster:boolean) {
    const seed = 'npc-area' + cx + ',' + cy;
    const rng = new Phaser.Math.RandomDataGenerator([seed]);
    let i = 0;
    for (const data of list) {
      let x, y;
      if (cluster) {
        // Rozsyp wewnątrz obszaru w siatce + szum
        const col = i % 4; const row = Math.floor(i/4);
        x = cx + col * (w/4) + rng.between(-20,20);
        y = cy + row * (h/4) + rng.between(-20,20);
      } else {
        x = cx + rng.between(-w/2,w/2); y = cy + rng.between(-h/2,h/2);
      }
      i++;
      this.npcs.push(new NPC(this, x, y, data));
    }
  }

  private placeNpcsScattered(list: any[], areas: Array<{x:number;y:number;r:number}>) {
    const rng = new Phaser.Math.RandomDataGenerator(['npc-scatter']);
    let idx = 0;
    for (const data of list) {
      // Rozbitek - plaża, ustalona pozycja
      if (data.id === 'npc_beach_survivor') {
        this.npcs.push(new NPC(this, 750, 2050, data));
        idx++; continue;
      }
      const area = areas[idx % areas.length];
      const ang = rng.frac()*Math.PI*2;
      const dist = rng.frac()*area.r;
      const x = area.x + Math.cos(ang)*dist;
      const y = area.y + Math.sin(ang)*dist;
      this.npcs.push(new NPC(this, Phaser.Math.Clamp(x,60,WORLD_W-60), Phaser.Math.Clamp(y,60,WORLD_H-60), data));
      idx++;
    }
  }

  private spawnMonstersByBiome() {
    if (!this.gameData.monsters) return;
    const rng = new Phaser.Math.RandomDataGenerator(['monsters']);
    // Zasady spawnu biom -> typ potwora
    const biomeMonster: Record<BiomeType, string[]> = {
      forest: ['monster_grey_wolf', 'monster_forest_boar'],
      swamp: ['monster_marsh_crawler'],
      mountain: ['monster_sand_wyrm', 'monster_forest_boar'],
      dark: ['monster_mutant', 'monster_shade'],
      beach: ['monster_grey_wolf'],
      road: ['monster_grey_wolf'],
      water: [],
      fort: [], camp: []
    };
    // Punkty spawnu
    const spawnPoints: Array<{x:number;y:number;biome:BiomeType}> = [];
    for (let i=0;i<80;i++) {
      const x = rng.between(100, WORLD_W-100);
      const y = rng.between(100, WORLD_H-200);
      const b = this.getBiomeAt(x,y);
      if (b === 'fort' || b === 'camp' || b === 'water') continue;
      spawnPoints.push({x,y,biome:b});
    }
    for (const sp of spawnPoints) {
      const options = biomeMonster[sp.biome] || [];
      if (options.length === 0) continue;
      const mid = options[Math.floor(rng.frac()*options.length)];
      const data = this.gameData.monsters.find(m => m.id === mid);
      if (!data) continue;
      const count = (data.behavior||[]).includes('pack') ? rng.between(2,3) : 1;
      for (let j=0;j<count;j++) {
        const jx = sp.x + rng.between(-60,60);
        const jy = sp.y + rng.between(-60,60);
        this.monsters.push(new Monster(this, jx, jy, data));
      }
    }
  }

  // ============================================================
  // UPDATE I PĘTLA GRY
  // ============================================================
  update(_time: number, delta: number) {
    if (this.isPaused || this.gameOver) return;
    const d = Math.min(delta, 100);

    this.timeSystem.update(d);
    const light = this.timeSystem.getLightFactor();
    this.nightOverlay.setFillStyle(0x000033, Phaser.Math.Linear(0.6, 0, light));

    // Ruch
    let vx=0, vy=0;
    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -1;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = 1;
    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -1;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = 1;
    if (vx!==0 && vy!==0) { vx*=0.707; vy*=0.707; }
    if (vx!==0 || vy!==0) {
      this.player.move(vx,vy);
      // Kroki
      this.stepTimer += d;
      if (this.stepTimer > 350 && !this.keys.SHIFT.isDown) { this.stepTimer = 0; try { audio.sfxStep(); } catch{} }
      else if (this.stepTimer > 230 && this.keys.SHIFT.isDown) { this.stepTimer = 0; try { audio.sfxStep(); } catch{} }
    } else this.player.stopMoving();
    this.player.speed = this.keys.SHIFT.isDown ? 180 : 120;

    if (this.aimVisible && (this.player.currentCombatMode==='ranged'||this.player.currentCombatMode==='magic')) {
      const angle = Phaser.Math.Angle.Between(this.player.x,this.player.y,this.mouseX,this.mouseY);
      const len = Math.min(240, Phaser.Math.Distance.Between(this.player.x,this.player.y,this.mouseX,this.mouseY));
      this.aimLine.setTo(0,0,Math.cos(angle)*len,Math.sin(angle)*len);
      this.aimLine.setPosition(this.player.x,this.player.y);
      this.aimLine.setStrokeStyle(1.5, this.player.currentCombatMode==='magic'?0x4488ff:0xff8844, 0.6);
    }

    this.checkInteraction();

    for (const npc of this.npcs) { if (npc.isAlive) npc.update(d, this.player, this.timeSystem); }
    for (const m of this.monsters) { if (m.isAlive) m.update(d, this.player, this.npcs); }

    this.projectileSystem.update(d, (p) => {
      if (p.owner === 'player') {
        for (const m of this.monsters) {
          if (!m.isAlive) continue;
          const dist = Phaser.Math.Distance.Between(p.x,p.y,m.x,m.y);
          if (dist < 22) {
            const killed = m.takeDamage(p.damage);
            this.add.circle(p.x,p.y,14,p.damageType==='fire'?0xff4000:p.damageType==='ice'?0x44aaff:0xcccc88,0.7).setDepth(400);
            audio.sfxHit();
            if (killed) {
              this.player.addXp(m.monsterData.stats.xp_reward);
              this.player.gold += Phaser.Math.Between(1,5);
              audio.sfxDeath(); audio.sfxGold();
              this.showXpPopup(m.x,m.y,`+${m.monsterData.stats.xp_reward} XP`);
            }
            return true;
          }
        }
        for (const npc of this.npcs) {
          if (!npc.isAlive || npc.npcData.is_essential || !npc.isHostile) continue;
          const dist = Phaser.Math.Distance.Between(p.x,p.y,npc.x,npc.y);
          if (dist < 20) { npc.takeDamage(p.damage); audio.sfxHit(); return true; }
        }
      } else {
        const dist = Phaser.Math.Distance.Between(p.x,p.y,this.player.x,this.player.y);
        if (dist < 18) {
          const actual = this.player.takeDamage(p.damage);
          audio.sfxHit();
          this.cameras.main.shake(80,0.004);
          window.dispatchEvent(new CustomEvent('game:playerHit',{detail:{damage:actual}}));
          if (!this.player.isAlive) this.onPlayerDeath();
          return true;
        }
      }
      return false;
    });

    if (this.player.isAlive) {
      if (this.player.hp < this.player.maxHp) this.player.hp = Math.min(this.player.maxHp, this.player.hp + d/5000);
      if (this.player.mana < this.player.maxMana) this.player.mana = Math.min(this.player.maxMana, this.player.mana + d/3000);
    }

    for (const m of this.monsters) {
      if (!m.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(this.player.x,this.player.y,m.x,m.y);
      if (dist < 36) {
        const now = this.time.now;
        if (!(m as any).lastHit || now - (m as any).lastHit > 900) {
          (m as any).lastHit = now;
          const atk = m.monsterData.attacks?.[0];
          const dmg = atk?.damage ?? 5;
          const actual = this.player.takeDamage(dmg);
          audio.sfxHit();
          this.cameras.main.shake(100,0.006);
          window.dispatchEvent(new CustomEvent('game:playerHit',{detail:{damage:actual}}));
          if (!this.player.isAlive) this.onPlayerDeath();
        }
      }
    }

    this.debugText.setText(
      `Tryb: ${this.player.currentCombatMode} | LVL:${this.player.level} | `+
      `HP:${Math.floor(this.player.hp)}/${this.player.maxHp} MP:${Math.floor(this.player.mana)}/${this.player.maxMana} | `+
      `XP:${this.player.xp}/${this.player.xpToNext} | Zł:${this.player.gold} | Pkt:${this.player.skillPoints}\n`+
      `${this.timeSystem.getFormattedTime()} Dzień ${this.timeSystem.getGameDay()} | NPC:${this.npcs.filter(n=>n.isAlive).length} Pot:${this.monsters.filter(m=>m.isAlive).length} | `+
      `${this.getBiomeAt(this.player.x,this.player.y)}\n`+
      `[1]Miecz [2]Łuk [3]Magia | E-interakcja | CTRL+E kradzież | Najbliższy: ${this.getInteractableLabel()}`
    );

    if (this.attackCooldown > 0) this.attackCooldown -= d;
  }

  private getInteractableLabel():string {
    if (!this.currentInteractable) return 'brak';
    if (this.currentInteractable instanceof NPC) return this.currentInteractable.npcData.name;
    if (this.currentInteractable instanceof Monster) return 'Trup';
    if (this.currentInteractable.kind==='chest') return 'Skrzynia [E]';
    if (this.currentInteractable.kind==='item') return 'Podnieś [E]';
    return '?';
  }

  cycleCombatMode() {
    const modes: Array<'melee'|'ranged'|'magic'> = ['melee','ranged','magic'];
    const cur = this.player.currentCombatMode === 'idle' ? 'melee' : this.player.currentCombatMode;
    const idx = modes.indexOf(cur as any);
    this.player.currentCombatMode = modes[(idx<0?0:idx)+1 < modes.length ? (idx+1) : 0];
    this.aimVisible = this.player.currentCombatMode !== 'melee';
    this.aimLine.setVisible(this.aimVisible);
    this.updateUI();
  }
  private updateUI() { window.dispatchEvent(new CustomEvent('game:combatMode',{detail:{mode:this.player.currentCombatMode}})); }

  checkInteraction() {
    let nearest:any = null; let nearestDist = 70;
    for (const npc of this.npcs) {
      if (!npc.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,npc.x,npc.y);
      if (d < nearestDist) { nearestDist=d; nearest=npc; }
    }
    for (const m of this.monsters) {
      if (m.isAlive) continue;
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,m.x,m.y);
      if (d < nearestDist) { nearestDist=d; nearest=m; }
    }
    for (const c of this.chests) {
      if (c.opened) continue;
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,c.x,c.y);
      if (d < nearestDist) { nearestDist=d; nearest={kind:'chest',chest:c}; }
    }
    for (const it of this.worldItems) {
      if (it.collected) continue;
      const d = Phaser.Math.Distance.Between(this.player.x,this.player.y,it.x,it.y);
      if (d < nearestDist) { nearestDist=d; nearest={kind:'item',item:it}; }
    }
    this.currentInteractable = nearest;
  }

  interact() {
    if (!this.currentInteractable) return;
    audio.sfxClick();
    if (this.currentInteractable instanceof NPC) {
      const npc = this.currentInteractable;
      if (this.keys.CTRL?.isDown) { this.tryPickpocket(npc); return; }
      npc.interact(this);
    } else if (this.currentInteractable instanceof Monster) {
      if (!this.currentInteractable.isAlive) this.lootMonster(this.currentInteractable);
    } else if (this.currentInteractable.kind === 'chest') {
      this.openChest(this.currentInteractable.chest);
    } else if (this.currentInteractable.kind === 'item') {
      this.pickUpWorldItem(this.currentInteractable.item);
    }
  }

  private openChest(chest: Chest) {
    if (chest.owner_faction) {
      const witnesses = this.crimeSystem.checkWitnesses(
        chest.x, chest.y,
        this.npcs.filter(n => n.isAlive && n.npcData.faction === chest.owner_faction).map(n=>({x:n.x,y:n.y,isAlive:n.isAlive})),
        200
      );
      if (witnesses.length > 0) {
        window.dispatchEvent(new CustomEvent('game:message',{detail:'Ktoś widzi! Złodziej!'}));
        for (const n of this.npcs) {
          if (n.isAlive && n.npcData.faction === chest.owner_faction) {
            if (Phaser.Math.Distance.Between(this.player.x,this.player.y,n.x,n.y)<250) n.isHostile=true;
          }
        }
        this.player.reputation[chest.owner_faction] = (this.player.reputation[chest.owner_faction]||0) - 5;
        audio.sfxError();
        return;
      }
    }
    const level = this.player.skillRanks['lockpicking']||0;
    const onComplete = (success:boolean) => {
      if (success) {
        chest.opened=true; this.openedChestIds.add(chest.id);
        if (chest.container) chest.container.setAlpha(0.5);
        for (const id of chest.loot) this.player.addToInventory(id);
        audio.sfxChestOpen(); audio.sfxLockpickSuccess(); audio.sfxGold();
        window.dispatchEvent(new CustomEvent('game:message',{detail:`Skrzynia otwarta! ${chest.loot.length} przedmiotów.`}));
      } else {
        if (this.player.getItemCount('misc_lockpick_master')>0) this.player.removeFromInventory('misc_lockpick_master');
        else if (this.player.getItemCount('misc_lockpick_steel')>0) this.player.removeFromInventory('misc_lockpick_steel');
        else if (this.player.getItemCount('misc_lockpick_iron')>0) this.player.removeFromInventory('misc_lockpick_iron');
        else { window.dispatchEvent(new CustomEvent('game:message',{detail:'Brak wytrychów!'})); audio.sfxError(); return; }
        audio.sfxLockpickFail();
        window.dispatchEvent(new CustomEvent('game:message',{detail:'Wytrych złamany!'}));
      }
    };
    if (chest.difficulty === 1 && level === 0) { onComplete(true); return; }
    if (this.player.getItemCount('misc_lockpick_iron')+this.player.getItemCount('misc_lockpick_steel')+this.player.getItemCount('misc_lockpick_master')===0) {
      window.dispatchEvent(new CustomEvent('game:message',{detail:'Potrzebujesz wytrychu.'})); audio.sfxError();
      return;
    }
    audio.sfxLockpick();
    this.lockpickMinigame.start(chest.difficulty, level, onComplete);
  }

  private pickUpWorldItem(item: WorldItem) {
    item.collected = true;
    if (item.container) (item.container as any).destroy?.();
    this.player.addToInventory(item.itemId);
    if (item.itemId === 'misc_gold') audio.sfxGold(); else audio.sfxPickup();
    window.dispatchEvent(new CustomEvent('game:message',{detail:`Znaleziono: ${item.itemId}`}));
    this.harvestedPlants.add(item.id);
  }

  private tryPickpocket(npc: NPC) {
    const rank = this.player.skillRanks['pickpocket']||0;
    const r = this.crimeSystem.tryPickpocket(this.player.x,this.player.y,npc.x,npc.y,rank,npc.npcData.stats.level);
    window.dispatchEvent(new CustomEvent('game:message',{detail:r.message}));
    if (r.success) {
      const items = npc.npcData.inventory;
      if (items && items.length>0) {
        const stolen = items[Math.floor(Math.random()*items.length)];
        this.player.addToInventory(stolen);
        audio.sfxPickup();
        window.dispatchEvent(new CustomEvent('game:message',{detail:`Zdobyto: ${stolen}`}));
      } else { this.player.gold += Phaser.Math.Between(1,5); audio.sfxGold(); }
    } else if (r.detected) {
      this.player.reputation[npc.npcData.faction] = (this.player.reputation[npc.npcData.faction]||0)-10;
      npc.isHostile = true; audio.sfxError();
    }
  }

  lootMonster(monster: Monster) {
    const items = monster.getLoot();
    for (const id of items) this.player.addToInventory(id);
    const skinning = this.player.skillRanks['skinning']||0;
    if (skinning > 0) {
      const map:Record<string,string> = {
        loot_wolf:'misc_skins_wolf', loot_boar:'misc_skins_boar',
        loot_mutant:'misc_trophy_mutant_eye', loot_wyrm:'misc_trophy_wyrm_scale',
        loot_shade:'plant_grave_moss'
      };
      if (map[monster.monsterData.loot_table]) this.player.addToInventory(map[monster.monsterData.loot_table]);
    } else if (monster.monsterData.loot_table !== 'loot_shade') {
      window.dispatchEvent(new CustomEvent('game:message',{detail:'Możesz to oskórować jeśli znasz tę sztukę.'}));
    }
    audio.sfxPickup(); audio.sfxGold();
    window.dispatchEvent(new CustomEvent('game:message',{detail:`Łup: ${items.length} przedmiotów`}));
    monster.destroy();
    this.monsters = this.monsters.filter(m => m !== monster);
  }

  meleeAttack() {
    if (this.attackCooldown > 0) return;
    let cd=500, wDmg=5, range=this.attackRange, scaling=0.5;
    const wid = this.player.equippedWeapon;
    let weapon:any = null;
    if (wid) {
      weapon = this.dataLoader.findById('items_weapons_swords', wid) || this.dataLoader.findById('items_weapons_bows', wid);
      if (weapon && this.dataLoader.findById('items_weapons_bows', wid)) {
        window.dispatchEvent(new CustomEvent('game:message',{detail:'Wyposaż broń białą!'})); audio.sfxError(); return;
      }
    }
    if (weapon) {
      const req = this.player.meetsRequirements(weapon.requirements);
      if (!req.ok) { wDmg=2; cd=600; scaling=0.2; window.dispatchEvent(new CustomEvent('game:message',{detail:req.reason||'Brak wymagań'})); }
      else { cd=weapon.speed||500; wDmg=weapon.damage||8; range=weapon.range||this.attackRange; scaling=weapon.strength_scaling??0.5; }
    }
    this.attackCooldown = cd;
    this.tweens.add({targets:this.player,scaleX:1.3,scaleY:0.8,duration:80,yoyo:true});
    let target: Monster|NPC|null = null; let td=range;
    for (const m of this.monsters) {
      if (!m.isAlive) continue;
      const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,m.x,m.y);
      if (d<td){td=d;target=m;}
    }
    for (const n of this.npcs) {
      if (!n.isAlive||n.npcData.is_essential||!n.isHostile) continue;
      const d=Phaser.Math.Distance.Between(this.player.x,this.player.y,n.x,n.y);
      if (d<td){td=d;target=n;}
    }
    if (target) {
      const total = Math.max(1, wDmg + Math.floor(this.player.strength*scaling));
      let killed=false;
      audio.sfxSwordHit();
      if (target instanceof Monster) killed = target.takeDamage(total);
      else killed = target.takeDamage(total);
      const a = Phaser.Math.Angle.Between(target.x,target.y,this.player.x,this.player.y);
      this.tweens.add({targets:target,x:target.x+Math.cos(a)*12,y:target.y+Math.sin(a)*12,duration:100});
      if (killed && target instanceof Monster) {
        this.player.addXp((target as Monster).monsterData.stats.xp_reward);
        this.player.gold += Phaser.Math.Between(1,5);
        audio.sfxDeath(); audio.sfxGold();
        this.showXpPopup(target.x,target.y,`+${(target as Monster).monsterData.stats.xp_reward} XP`);
      }
    } else audio.sfxSwordMiss();
  }

  rangedAttack() {
    if (this.attackCooldown>0) return;
    const bowId = this.player.equippedWeapon;
    const bow = bowId ? this.dataLoader.findById('items_weapons_bows', bowId) : null;
    if (!bow) { window.dispatchEvent(new CustomEvent('game:message',{detail:'Wyposaż łuk.'})); audio.sfxError(); return; }
    if (this.player.getItemCount('misc_arrow')<=0) { window.dispatchEvent(new CustomEvent('game:message',{detail:'Brak strzał!'})); audio.sfxError(); return; }
    const req = this.player.meetsRequirements(bow.requirements);
    if (!req.ok) { window.dispatchEvent(new CustomEvent('game:message',{detail:req.reason||'Brak wymagań'})); audio.sfxError(); return; }
    this.player.removeFromInventory('misc_arrow');
    this.attackCooldown = bow.draw_time||800;
    const total = Math.max(1,(bow.damage||6)+Math.floor(this.player.dexterity*(bow.dexterity_scaling??0.3)));
    this.projectileSystem.fire(this.player.x,this.player.y,this.mouseX,this.mouseY,350,total,'physical','player');
    audio.sfxBow();
    this.tweens.add({targets:this.player,scaleX:1.1,duration:100,yoyo:true});
  }

  magicAttack() {
    if (this.attackCooldown > 0) return;
    var known = this.player.knownSpells.length > 0 ? this.player.knownSpells : ['spell_fire_bolt'];
    var spellId = known[this.currentSpellIndex % known.length];
    var spell = this.dataLoader.findById('spells', spellId);
    if (!spell) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Brak czaru' }));
      return;
    }
    var cost = spell.mana_cost || 15;
    if (this.player.mana < cost) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Za malo many!' }));
      audio.sfxError();
      return;
    }
    var reqMin = spell.requirements ? spell.requirements.min_level : 0;
    if (reqMin && this.player.level < reqMin) {
      window.dispatchEvent(new CustomEvent('game:message', { detail: 'Wymaga poziomu ' + reqMin }));
      audio.sfxError();
      return;
    }
    this.player.mana -= cost;
    this.attackCooldown = spell.cooldown || 1200;
    var dt = spell.damage_type === 'ice' ? 'ice' : 'fire';
    this.projectileSystem.fire(
      this.player.x, this.player.y, this.mouseX, this.mouseY,
      spell.projectile_speed || 280, spell.damage || 15, dt, 'player'
    );
    audio.sfxMagic();
    window.dispatchEvent(new CustomEvent('game:message', { detail: 'Rzucasz ' + spell.name + '!' }));
    this.currentSpellIndex++;
  }

  private showXpPopup(x:number,y:number,text:string) {
    const p = this.add.text(x,y-20,text,{fontSize:'12px',color:'#ffcc00',stroke:'#000',strokeThickness:3}).setOrigin(0.5);
    this.tweens.add({targets:p,y:y-60,alpha:0,duration:1200,onComplete:()=>p.destroy()});
  }

  togglePause() {
    if (this.gameOver) return;
    if (this.scene.isActive('DialogScene')) return;
    this.isPaused = true; audio.sfxUINavigate();
    this.scene.launch('MenuScene',{from:'pause',gameScene:this});
  }
  resumeFromPause() { this.isPaused = false; }

  async quickSave() {
    try { await this.saveSystem.autosave(this.buildSaveData()); audio.sfxLockpickSuccess(); window.dispatchEvent(new CustomEvent('game:message',{detail:'Gra zapisana!'})); }
    catch { audio.sfxError(); window.dispatchEvent(new CustomEvent('game:message',{detail:'Błąd zapisu'})); }
  }
  async quickLoad(slot?:number) {
    const data = await this.saveSystem.load(slot??0);
    if (data) { this.loadSaveData(data); audio.sfxMagic(); window.dispatchEvent(new CustomEvent('game:message',{detail:'Gra wczytana!'})); }
    else { audio.sfxError(); window.dispatchEvent(new CustomEvent('game:message',{detail:'Brak zapisu'})); }
  }

  buildSaveData(): import('../types').SaveData {
    return {
      version:'0.1.0', timestamp:Date.now(), play_time:0,
      player:{
        x:this.player.x,y:this.player.y,location_id:'loc_beach',
        hp:this.player.hp,maxHp:this.player.maxHp,mana:this.player.mana,maxMana:this.player.maxMana,
        strength:this.player.strength,dexterity:this.player.dexterity,
        level:this.player.level,xp:this.player.xp,skillPoints:this.player.skillPoints,gold:this.player.gold,
        equippedWeapon:this.player.equippedWeapon,equippedArmor:this.player.equippedArmor,
        knownSpells:this.player.knownSpells,factionChoice:this.player.faction,
        reputation:this.player.reputation,inventory:this.player.inventory,
        inventoryCounts:this.player.inventoryCounts,skillRanks:this.player.skillRanks
      },
      quests: this.questSystem.getSaveData(),
      npcs: this.npcs.filter(n=>n.isAlive).map(n=>({npc_id:n.npcData.id,hp:n.hp,position:{x:n.x,y:n.y,location_id:'loc_beach'},is_alive:n.isAlive,is_knocked_out:false,current_activity:'idle',flags:{},inventory:[]})),
      reputation:this.player.reputation,dialog_flags:this.dialogFlags,
      discovered_locations:['loc_beach'],
      opened_chests:Array.from(this.openedChestIds), harvested_plants:Array.from(this.harvestedPlants),
      killed_monsters:{}, faction_choice:this.player.faction,
      time_of_day:this.timeSystem.getTimeOfDay(), game_day:this.timeSystem.getGameDay()
    };
  }

  loadSaveData(data:any) {
    this.player.loadSaveData(data.player);
    this.timeSystem.loadSaveData({currentTime:data.time_of_day??28800,gameDay:data.game_day??1});
    if (data.quests) this.questSystem.loadSaveData(data.quests);
    if (data.dialog_flags) this.dialogFlags=data.dialog_flags;
    if (data.opened_chests) {
      this.openedChestIds = new Set(data.opened_chests);
      for (const c of this.chests) { if (this.openedChestIds.has(c.id)) { c.opened=true; if(c.container)c.container.setAlpha(0.5); } }
    }
    if (data.harvested_plants) {
      this.harvestedPlants = new Set(data.harvested_plants);
      for (const it of this.worldItems) if (this.harvestedPlants.has(it.id)) { it.collected=true; if (it.container) (it.container as any).destroy?.(); }
    }
    this.gameOver=false; this.isPaused=false;
  }

  applyRewards(r:any) {
    if (!r) return;
    if (r.xp) this.player.addXp(r.xp);
    if (r.gold) { this.player.gold += r.gold; audio.sfxGold(); }
    if (r.skill_points) this.player.skillPoints += r.skill_points;
    if (r.items) for (const id of r.items) this.player.addToInventory(id);
    if (r.reputation_changes) for (const [k,v] of Object.entries(r.reputation_changes)) this.player.reputation[k]=(this.player.reputation[k]||0)+Number(v);
  }

  equipFromInventory(itemId:string):boolean {
    const item = this.dataLoader.findById('items_weapons_swords',itemId) || this.dataLoader.findById('items_weapons_bows',itemId) || this.dataLoader.findById('items_armors',itemId);
    if (!item) return false;
    const req = this.player.meetsRequirements(item.requirements);
    if (!req.ok) { window.dispatchEvent(new CustomEvent('game:message',{detail:req.reason||'Nie możesz tego użyć'})); audio.sfxError(); return false; }
    const prev = this.player.equip(itemId,item);
    if (prev) this.player.addToInventory(prev);
    this.player.removeFromInventory(itemId);
    audio.sfxPickup();
    return true;
  }

  learnSpell(id:string) { if (!this.player.knownSpells.includes(id)) this.player.knownSpells.push(id); }

  trainSkill(skillId:string,cost:{gold:number;skill_points:number},maxRank:number):{ok:boolean;reason?:string} {
    const cur = this.player.skillRanks[skillId]||0;
    if (cur>=maxRank) return {ok:false,reason:'Maksymalna ranga'};
    if (this.player.gold<cost.gold) return {ok:false,reason:'Brak złota'};
    if (this.player.skillPoints<cost.skill_points) return {ok:false,reason:'Brak punktów nauki'};
    this.player.gold -= cost.gold; this.player.skillPoints -= cost.skill_points;
    this.player.skillRanks[skillId] = cur+1;
    if (skillId==='magic_fire') this.learnSpell('spell_fire_bolt');
    if (skillId==='magic_ice') this.learnSpell('spell_ice_shard');
    audio.sfxLevelUp();
    return {ok:true};
  }

  joinFaction(faction:'old_order'|'new_order') {
    this.player.faction = faction;
    this.questSystem.chooseFaction(faction);
    audio.sfxJoinFaction();
    window.dispatchEvent(new CustomEvent('game:message',{detail:`Dołączyłeś do ${faction==='old_order'?'Straży':'Wolnych'}!`}));
    this.questSystem.advanceQuest('quest_main_arrival','stage_choice');
    this.time.delayedCall(2500, () => this.showFinaleSequence(faction));
  }

  private showFinaleSequence(faction:'old_order'|'new_order') {
    const cx = this.cameras.main.midPoint.x;
    const cy = this.cameras.main.midPoint.y;
    const overlay = this.add.rectangle(cx,cy,2000,1500,0x000000,0).setScrollFactor(1).setDepth(2000);
    const txt = this.add.text(cx,cy,'',{fontSize:'24px',color:'#ffcc00',align:'center',wordWrap:{width:800},stroke:'#000',strokeThickness:4}).setOrigin(0.5).setScrollFactor(1).setDepth(2001).setAlpha(0);
    const lines = faction==='old_order' ? [
      'Wraz z żołnierzami Straży wymaszerowałeś na Szczelinę...',
      'Ostrza i zaklęcia przecięły ciemność. Bestie z głębin padły jeden po drugim.',
      'Gdy kurz opadł, Szczelina została zapieczętowana pod żelaznym nadzorem Grodu.',
      'Kresy Północne wróciły pod surowy, ale bezpieczny porządek.',
      'Twoja historia zaczyna się tu - od dziś nosisz barwy Straży.'
    ] : [
      'Zebraliście wolnych ludzi i uderzyliście na Szczelinę pod osłoną nocy...',
      'Ogień, stal i spryt pokonały stwory z głębin. Nikt wam nie rozkazywał.',
      'Szczelina została zamknięta, a jej tajemnice pozostały w rękach Wolnych.',
      'Kresy Północne są teraz wolne - niebezpieczne, ale wasze.',
      'Twoja historia zaczyna się tu - od dziś twoje imię wymawiane będzie przy ogniskach.'
    ];
    this.tweens.add({targets:overlay,fillAlpha:0.9,duration:1500});
    let i=0;
    const show = () => {
      if (i>=lines.length) {
        this.time.delayedCall(2500, () => {
          overlay.destroy(); txt.destroy();
          this.scene.stop('UIScene'); this.scene.stop('GameScene');
          audio.stopMusic();
          this.scene.start('EpilogueScene',{faction,level:this.player.level,gold:this.player.gold,playTime:0,questsCompleted:this.questSystem.getCompletedQuests().length,kills:0});
        });
        return;
      }
      txt.setText(lines[i]);
      this.tweens.add({targets:txt,alpha:1,duration:800,onComplete:()=>{
        this.time.delayedCall(2600,()=>{this.tweens.add({targets:txt,alpha:0,duration:600,onComplete:()=>{i++;show();}});});
      }});
    };
    this.time.delayedCall(1500, show);
  }

  onPlayerDeath() {
    if (this.gameOver) return;
    this.gameOver=true;
    this.player.stopMoving();
    audio.sfxDeath(); audio.stopMusic();
    const cx = this.cameras.main.midPoint.x, cy = this.cameras.main.midPoint.y;
    const overlay = this.add.rectangle(cx,cy,2000,1500,0x000000,0.7).setScrollFactor(1).setDepth(2000);
    const txt = this.add.text(cx,cy-40,'UMARŁEŚ\n\n[F9] wczytaj ostatni zapis\n[ESC] menu główne',{fontSize:'26px',color:'#ff2020',align:'center',stroke:'#000',strokeThickness:4}).setOrigin(0.5).setScrollFactor(1).setDepth(2001);
    const handler = (e:KeyboardEvent)=>{
      if (e.key==='F9') { window.removeEventListener('keydown',handler); overlay.destroy(); txt.destroy(); this.quickLoad(0); }
      else if (e.key==='Escape') { window.removeEventListener('keydown',handler); overlay.destroy(); txt.destroy(); this.scene.stop('UIScene'); this.scene.start('MenuScene',{}); }
    };
    window.addEventListener('keydown',handler);
  }
}
