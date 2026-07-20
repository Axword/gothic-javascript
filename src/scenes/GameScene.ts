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

type BiomeType = 'beach' | 'forest' | 'swamp' | 'mountain' | 'road' | 'dark' | 'fort' | 'camp' | 'water' | 'grass';

// Świat 3200x2400
const WORLD_W = 3200;
const WORLD_H = 2400;

// Lokacje (osady)
const OLD_FORT = { x: 500, y: 700, r: 180, label: 'Gród Straży' };
const NEW_CAMP = { x: 2450, y: 1100, r: 180, label: 'Wolne Chaty' };
const START_POINT = { x: 700, y: 2050 }; // bezpieczny start na plaży
const BEACH_SURVIVOR = { x: 780, y: 2020 }; // Gniewosz - obok gracza, nie na nim

// Safe zones (brak spawnu potworów): start, obie osady, droga przy startcie
const SAFE_ZONES = [
  { x: START_POINT.x, y: START_POINT.y, r: 350 },  // plaża startowa
  { x: OLD_FORT.x, y: OLD_FORT.y, r: OLD_FORT.r + 80 },
  { x: NEW_CAMP.x, y: NEW_CAMP.y, r: NEW_CAMP.r + 80 },
];

/**
 * Sprawdzanie biomu - używa prostokątnych regionów.
 * Kolejność: najbardziej szczegółowe pierwsze.
 */
function biomeAt(x: number, y: number): BiomeType {
  // Woda - na samym dole (morze)
  if (y >= 2280) return 'water';
  // Plaża - pas wzdłuż wody
  if (y >= 1950) return 'beach';
  // Szczelina (ciemność) - środek gór
  if (x >= 1400 && x < 1800 && y >= 80 && y < 380) return 'dark';
  // Stary Cmentarz - we wschodnich górach
  if (x >= 2500 && x < 2900 && y >= 500 && y < 900) return 'dark';
  // Góry - pas na północy
  if (y < 500) return 'mountain';
  // Bagna - wschód, między plażą a lasem
  if (x >= 2200 && y >= 1500) return 'swamp';
  // Trakt Północny - droga od plaży (x~750) do gór
  if (x >= 720 && x <= 800 && y < 1950) return 'road';
  // Gród Straży
  const dxo = x - OLD_FORT.x, dyo = y - OLD_FORT.y;
  if (dxo*dxo + dyo*dyo < OLD_FORT.r*OLD_FORT.r) return 'fort';
  // Wolne Chaty
  const dxn = x - NEW_CAMP.x, dyn = y - NEW_CAMP.y;
  if (dxn*dxn + dyn*dyn < NEW_CAMP.r*NEW_CAMP.r) return 'camp';
  // Reszta - las (domyślny)
  return 'forest';
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
  private debugText!: Phaser.GameObjects.Text;
  private minimapTexture!: Phaser.GameObjects.RenderTexture;
  private minimap!: Phaser.GameObjects.Ellipse;
  private biomeLabel!: Phaser.GameObjects.Text;
  private isPaused: boolean = false;
  private attackCooldown: number = 0;
  private attackRange: number = 50;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private aimLine!: Phaser.GameObjects.Line;
  private aimVisible: boolean = false;
  private currentSpellIndex: number = 0;
  private nightOverlay!: Phaser.GameObjects.Rectangle;
  private waterOverlay!: Phaser.GameObjects.Rectangle;
  private uiSceneLaunched: boolean = false;
  private dialogFlags: Record<string, any> = {};
  private openedChestIds: Set<string> = new Set();
  private harvestedPlants: Set<string> = new Set();
  private stepTimer: number = 0;
  private locationLabels: Array<{ x: number; y: number; text: string; color: string }> = [];

  private obstacles: Phaser.Physics.Arcade.StaticGroup | null = null;

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
    this.uiSceneLaunched = false;
  }

  create() {
    this.generateWorld();

    // Gracz startuje bezpiecznie na plaży
    this.player = new Player(this, START_POINT.x, START_POINT.y);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.3);
    this.cameras.main.setBackgroundColor('#0a0a0a');
    this.cameras.main.setBounds(-50, -50, WORLD_W + 100, WORLD_H + 50);
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.physics.world.setBoundsCollision(true, true, true, false);

    if (this.gameData.balance?.time) this.timeSystem.configureFromBalance(this.gameData.balance);

    this.projectileSystem = new ProjectileSystem(this);
    this.lockpickMinigame = new LockpickMinigame(this);
    this.crimeSystem = new CrimeSystem(this);

    // Obstacles (drzewa, skały, palisady, mury)
    this.obstacles = this.physics.add.staticGroup();

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

    // Kolizja gracza z przeszkodami
    if (this.obstacles) {
      this.physics.add.collider(this.player, this.obstacles);
      this.physics.add.collider(this.npcs, this.obstacles);
      this.physics.add.collider(this.monsters, this.obstacles);
    }
    this.physics.add.collider(this.npcs, this.npcs);
    this.physics.add.collider(this.monsters, this.monsters);

    this.aimLine = this.add.line(0, 0, 0, 0, 0, 0, 0xff4444, 0.5);
    this.aimLine.setLineWidth(1.5);
    this.aimLine.setVisible(false);
    this.aimLine.setDepth(300);

    this.debugText = this.add.text(10, 10, '', {
      fontSize: '11px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3,
    }).setScrollFactor(0).setDepth(1000);

    // Woda overlay (dla efektu wchodzenia do wody)
    this.waterOverlay = this.add.rectangle(0, 0, 9999, 9999, 0x15283d, 0).setOrigin(0, 0).setDepth(600).setScrollFactor(1);

    // Etykieta biomu (gdzie jesteś)
    this.biomeLabel = this.add.text(this.cameras.main.width / 2, 80, '', {
      fontSize: '18px', color: '#ddbb88', fontStyle: 'bold', stroke: '#000', strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);

    // Minimapa
    this.createMinimap();

    if (!this.uiSceneLaunched) {
      this.scene.launch('UIScene', { gameScene: this });
      this.uiSceneLaunched = true;
    }

    this.keys.E.on('down', () => this.interact());
    this.keys.ESC.on('down', () => this.togglePause());
    this.keys.F5.on('down', () => this.quickSave());
    this.keys.F9.on('down', () => this.quickLoad());
    this.keys.TAB.on('down', () => this.cycleCombatMode());
    this.keys.M.on('down', () => this.toggleMinimap());
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

    // Początkowy label lokacji
    this.showBiomeLabel('PLAŻA - Wybrzeże');

    const initData: any = this.scene.settings.data || {};
    if (initData.loadSlot !== undefined) {
      this.time.delayedCall(50, () => this.quickLoad(initData.loadSlot));
    } else {
      this.time.delayedCall(500, () => this.questSystem.startQuest('quest_main_arrival'));
    }
  }

  // ============================================================
  // MINIMAPA
  // ============================================================
  private createMinimap() {
    const mmSize = 140;
    const mmX = 10; // prawy górny róg
    const mmY = 10;

    const tex = this.add.renderTexture(mmX, mmY, mmSize, mmSize).setOrigin(0,0).setScrollFactor(0).setDepth(999);
    const mmScale = mmSize / Math.max(WORLD_W, WORLD_H);
    const mmW = WORLD_W * mmScale;
    const mmH = WORLD_H * mmScale;
    const offX = (mmSize - mmW) / 2;
    const offY = (mmSize - mmH) / 2;
    tex.fill(0x000000, 1);

    const step = 20;
    const biomColor: Record<BiomeType, number> = {
      forest: 0x1a3010, beach: 0x8a7040, swamp: 0x2e3a1e, mountain: 0x4a4a4a,
      road: 0x4a3a28, dark: 0x0a0810, water: 0x15283d, fort: 0x6a4020,
      camp: 0x503018, grass: 0x253c1a
    };
    for (let x = 0; x < WORLD_W; x += step) {
      for (let y = 0; y < WORLD_H; y += step) {
        const b = biomeAt(x + step/2, y + step/2);
        tex.fill(biomColor[b] || 0x000000, 1, offX + x*mmScale, offY + y*mmScale, step*mmScale+1, step*mmScale+1);
      }
    }
    // Tło pod mapą (ramka)
    this.add.rectangle(mmX-2, mmY-2, mmSize+4, mmSize+4, 0x000000, 0.8).setOrigin(0,0).setScrollFactor(0).setDepth(998);
    const border = this.add.rectangle(mmX, mmY, mmSize, mmSize).setOrigin(0,0).setScrollFactor(0).setDepth(1000).setStrokeStyle(2,0x8a6020);
    border.setFillStyle(0,0);
    this.minimapTexture = tex;
    (this as any)._mmOffX = offX; (this as any)._mmOffY = offY; (this as any)._mmScale = mmScale;
    (this as any)._mmX = mmX; (this as any)._mmY = mmY;

    const dots: Array<{x:number;y:number;color:number;r:number}> = [
      { x: OLD_FORT.x, y: OLD_FORT.y, color: 0xffcc00, r: 3 },
      { x: NEW_CAMP.x, y: NEW_CAMP.y, color: 0xff4020, r: 3 },
      { x: START_POINT.x, y: START_POINT.y, color: 0x80ff80, r: 2 },
    ];
    for (const d of dots) {
      tex.fill(d.color, 1, offX + d.x*mmScale - d.r, offY + d.y*mmScale - d.r, d.r*2, d.r*2);
    }

    this.minimap = this.add.ellipse(mmX + offX + START_POINT.x*mmScale, mmY + offY + START_POINT.y*mmScale, 5, 5, 0xffffff).setScrollFactor(0).setDepth(1001);

    // Etykieta "MAPA [M]"
    this.add.text(mmX, mmY + mmSize + 4, 'MAPA [M]', {
      fontSize: '9px', color: '#aa8855', stroke: '#000', strokeThickness: 2
    }).setOrigin(0,0).setScrollFactor(0).setDepth(1001);
  }

  private toggleMinimap() {
    this.minimapTexture.setVisible(!this.minimapTexture.visible);
    this.minimap.setVisible(!this.minimap.visible);
  }

  private updateMinimap() {
    if (!this.minimap || !this.minimap.visible) return;
    const scale = (this as any)._mmScale, offX = (this as any)._mmOffX, offY = (this as any)._mmOffY;
    const mmX = (this as any)._mmX, mmY = (this as any)._mmY;
    this.minimap.setPosition(mmX + offX + this.player.x*scale, mmY + offY + this.player.y*scale);
  }

  private lastBiome: string = '';
  private updateBiomeLabel() {
    const b = biomeAt(this.player.x, this.player.y);
    if (b === this.lastBiome) return;
    this.lastBiome = b;
    const labels: Record<BiomeType, string> = {
      beach: 'PLAŻA - Wybrzeże', forest: 'LAS - Bór Bezgłosu',
      swamp: 'BAGNA - Czerwone Bagna', mountain: 'GÓRY - Szare Grzbiety',
      road: 'TRAKT PÓŁNOCNY', dark: 'CIEMNOŚĆ - Szczelina',
      water: 'MORZE', fort: 'GRÓD STRAŻY', camp: 'WOLNE CHATY',
      grass: 'RÓWNINA'
    };
    this.showBiomeLabel(labels[b]);
  }

  private showBiomeLabel(text: string) {
    this.biomeLabel.setText(text);
    this.biomeLabel.setAlpha(0);
    this.tweens.add({ targets: this.biomeLabel, alpha: 1, duration: 400, yoyo: false,
      onComplete: () => this.tweens.add({ targets: this.biomeLabel, alpha: 0, duration: 600, delay: 2500 }) });
  }

  // ============================================================
  // GENERACJA ŚWIATA
  // ============================================================
  private generateWorld() {
    // Warstwa bazowa: las jako domyślny
    const def = this.textures.exists('tile_forest') ? 'tile_forest' : '__DEFAULT';
    const bg = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, def).setOrigin(0,0).setDepth(0);

    // Rysujemy kafelki biomu warstwami po prostokątach (bez nakładania na forcie/campie)
    // Najpierw woda na samym dole
    this.paintBiomeRect(0, 2280, WORLD_W, WORLD_H-2280, 'tile_water');
    // Plaża
    this.paintBiomeRect(0, 1950, WORLD_W, 2280-1950, 'tile_beach');
    // Góry na górze
    this.paintBiomeRect(0, 0, WORLD_W, 500, 'tile_mountain');
    // Bagna
    this.paintBiomeRect(2200, 1500, WORLD_W-2200, 1950-1500, 'tile_swamp');
    // Ciemność (Szczelina + Cmentarz)
    this.paintBiomeRect(1400, 80, 400, 300, 'tile_dark');
    this.paintBiomeRect(2500, 500, 400, 400, 'tile_dark');
    // Droga (węższa)
    this.paintBiomeRect(730, 0, 60, 1950, 'tile_road');
    // Fort i camp - podłoga
    this.paintBiomeCircle(OLD_FORT.x, OLD_FORT.y, OLD_FORT.r, 'tile_grass');
    this.paintBiomeCircle(NEW_CAMP.x, NEW_CAMP.y, NEW_CAMP.r, 'tile_grass');

    // Etykiety lokacji (stałe na świecie)
    this.addLocationLabels();

    // Budynki/obiekty
    this.buildFort(OLD_FORT.x, OLD_FORT.y, OLD_FORT.label);
    this.buildCamp(NEW_CAMP.x, NEW_CAMP.y, NEW_CAMP.label);

    // Dekoracje (drzewa, skały itd.)
    this.populateWorld();

    // Night overlay
    this.nightOverlay = this.add.rectangle(0,0,WORLD_W,WORLD_H,0x000033,0).setOrigin(0,0).setDepth(500);
  }

  private paintBiomeRect(x:number, y:number, w:number, h:number, tex:string) {
    if (!this.textures.exists(tex)) return;
    this.add.tileSprite(x, y, w, h, tex).setOrigin(0,0).setDepth(0.3);
  }

  private paintBiomeCircle(cx:number, cy:number, r:number, tex:string) {
    if (!this.textures.exists(tex)) return;
    // Proste wypełnienie kwadratem + maską koła - używamy Graphics jako maski
    const size = r*2;
    const g = this.make.graphics({x:cx-r, y:cy-r}, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(r, r, r);
    const mask = g.createGeometryMask();
    const ts = this.add.tileSprite(cx-r, cy-r, size, size, tex).setOrigin(0,0).setDepth(0.4);
    ts.setMask(mask);
  }

  private addLocationLabels() {
    this.locationLabels = [
      { x: OLD_FORT.x, y: OLD_FORT.y - OLD_FORT.r - 30, text: OLD_FORT.label, color: '#ffcc00' },
      { x: NEW_CAMP.x, y: NEW_CAMP.y - NEW_CAMP.r - 30, text: NEW_CAMP.label, color: '#ff4020' },
      { x: 1600, y: 200, text: 'SZCZELINA', color: '#8040a0' },
      { x: 2700, y: 700, text: 'STARY CMENTARZ', color: '#8040a0' },
      { x: 760, y: 1000, text: 'TRAKT PÓŁNOCNY', color: '#aa8855' },
      { x: 400, y: 250, text: 'SZARE GRZBIETY', color: '#888888' },
      { x: 2700, y: 1700, text: 'CZERWONE BAGNA', color: '#6a7a3a' },
      { x: 500, y: 2000, text: 'WYBRZEŻE', color: '#c0a060' },
    ];
    for (const lbl of this.locationLabels) {
      const t = this.add.text(lbl.x, lbl.y, lbl.text, {
        fontSize: '16px', color: lbl.color, fontStyle: 'bold', stroke: '#000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(3).setScrollFactor(1);
    }
  }

  private addObstacle(x: number, y: number, w: number, h: number, sprite?: Phaser.GameObjects.Image) {
    if (!this.obstacles) return;
    // Statyczna skrzynka kolizyjna
    const box = this.obstacles.create(x, y, '__DEFAULT') as Phaser.Physics.Arcade.Sprite;
    if (box && box.body) {
      box.setVisible(false);
      box.body.setSize(w, h);
      box.body.setOffset(-w/2, -h/2);
      box.refreshBody();
    }
  }

  private buildFort(cx: number, cy: number, label: string) {
    // Palisada dookoła (koło) - większa
    const radius = 180;
    const posts = 28;
    for (let i = 0; i < posts; i++) {
      const ang = (i / posts) * Math.PI * 2;
      const px = cx + Math.cos(ang) * radius;
      const py = cy + Math.sin(ang) * radius;
      // Brama na południu (od strony drogi/traktu)
      if (ang > Math.PI*0.7 && ang < Math.PI*0.8) continue;
      const img = this.add.image(px, py, 'wall_wood').setDepth(py).setScale(1.2);
      this.addObstacle(px, py, 30, 40);
    }
    // Wieżyczki w narożnikach
    for (let i = 0; i < 4; i++) {
      const ang = Math.PI/4 + i*Math.PI/2;
      const px = cx + Math.cos(ang) * radius;
      const py = cy + Math.sin(ang) * radius;
      this.add.image(px, py, 'wall_wood').setDepth(py-10).setScale(1.6);
    }

    // Budynki wewnątrz (większe, używamy hut i prostokątów)
    this.addBuilding(cx-60, cy-40, 110, 80, '#4a3020', '#5a2010', 'KWATERA KOMENDANTA');
    this.addBuilding(cx+70, cy-50, 90, 70, '#384050', '#402010', 'ZBROJOWNIA');
    this.addBuilding(cx, cy+70, 120, 70, '#402818', '#604020', 'KUŹNIA I KARCZMA');
    // Ognisko na środku
    const fire = this.add.image(cx, cy, 'campfire').setDepth(cy);
    this.addObstacle(cx, cy, 20, 20);

    // Etykieta
    this.add.text(cx, cy - radius - 60, label, { fontSize: '20px', color: '#ffcc00', stroke:'#000', strokeThickness: 5, fontStyle: 'bold' }).setOrigin(0.5).setDepth(cy+200).setScrollFactor(1);
  }

  private buildCamp(cx: number, cy: number, label: string) {
    // Luźny krąg namiotów/szałasów wokół ogniska
    const tentCount = 7;
    const radius = 110;
    for (let i=0; i<tentCount; i++) {
      const ang = (i / tentCount) * Math.PI*2;
      const tx = cx + Math.cos(ang)*radius;
      const ty = cy + Math.sin(ang)*radius*0.8;
      const useHut = i % 3 === 0;
      const img = this.add.image(tx, ty, useHut ? 'hut' : 'tent').setDepth(ty).setScale(useHut?1.0:1.3);
      if (useHut) img.setFlipX(i%2===0);
      this.addObstacle(tx, ty+10, useHut?50:40, useHut?40:30);
    }
    // Palisada częściowa od strony lasu/gór (północ i wschód)
    for (let i=0;i<8;i++) {
      const ang = Math.PI*1.0 + (i/8)*Math.PI*0.8;
      const px = cx + Math.cos(ang)*(radius+30);
      const py = cy + Math.sin(ang)*(radius+30);
      this.add.image(px, py, 'wall_wood').setDepth(py).setScale(1.1);
      this.addObstacle(px, py, 30, 40);
    }
    const fire = this.add.image(cx, cy, 'campfire').setDepth(cy);
    this.addObstacle(cx, cy, 20, 20);

    this.add.text(cx, cy - radius - 80, label, { fontSize: '20px', color: '#ff4020', stroke:'#000', strokeThickness: 5, fontStyle: 'bold' }).setOrigin(0.5).setDepth(cy+200).setScrollFactor(1);
  }

  private addBuilding(x: number, y: number, w: number, h: number, bodyColor: string, roofColor: string, label: string) {
    // Cień
    this.add.ellipse(x+8, y+h/2+6, w, 10, 0x000000, 0.35).setDepth(y-h/2);
    // Korpus
    const body = this.add.rectangle(x, y, w, h, Phaser.Display.Color.HexStringToColor(bodyColor).color)
      .setStrokeStyle(3, 0x1a0c04).setDepth(y);
    // Dach trójkątny
    const roofH = 28;
    const tri = this.add.triangle(x, y-h/2-roofH/2+4, 0, roofH+6, w, roofH+6, w/2, -roofH-4,
      Phaser.Display.Color.HexStringToColor(roofColor).color).setDepth(y-h/2-4);
    // Drzwi
    this.add.rectangle(x, y+h/4-4, 18, 26, 0x1a0804).setDepth(y+2);
    // Okna
    this.add.rectangle(x-w/4, y-h/4, 12, 14, 0xffaa20, 0.8).setDepth(y+1).setStrokeStyle(2,0x1a0804);
    this.add.rectangle(x+w/4, y-h/4, 12, 14, 0xffaa20, 0.8).setDepth(y+1).setStrokeStyle(2,0x1a0804);
    // Etykieta budynku
    this.add.text(x, y-h/2-45, label, { fontSize: '9px', color: '#ccaa66', stroke:'#000', strokeThickness: 2, fontStyle:'bold' }).setOrigin(0.5).setDepth(y+h);
    // Kolizja
    this.addObstacle(x, y, w-6, h-6);
  }

  private populateWorld() {
    const rng = new Phaser.Math.RandomDataGenerator(['krwawy-szlak-v3']);

    // Drzewa w lesie
    this.scatterInBiome('forest', 600, (x,y) => {
      if (x > 720 && x < 800) return; // nie na drodze
      const dead = rng.frac() < 0.08;
      const pine = rng.frac() < 0.15;
      let key = 'tree'; if (dead) key = 'tree_dead'; else if (pine) key = 'tree_pine';
      if (!this.textures.exists(key)) return;
      const s = 0.8 + rng.frac()*0.5;
      const t = this.add.image(x,y,key).setDepth(y).setScale(s);
      this.addObstacle(x, y+10, 24*s, 24*s);
    });
    // Drzewa na przejściu las-góry (iglaki)
    this.scatterInRect(600, 400, 2000, 150, 150, (x,y) => {
      const b = biomeAt(x,y);
      if (b !== 'mountain' && b !== 'forest') return;
      if (x > 720 && x < 800) return;
      if (this.textures.exists('tree_pine')) {
        const img = this.add.image(x,y,'tree_pine').setDepth(y).setScale(0.8 + rng.frac()*0.4);
        this.addObstacle(x, y+10, 22, 22);
      }
    });
    // Skały w górach
    this.scatterInBiome('mountain', 200, (x,y) => {
      // Nie na Szczelinie/Cmentarzu
      const b = biomeAt(x,y);
      if (b !== 'mountain') return;
      const isBoulder = rng.frac() < 0.35;
      const key = isBoulder ? 'boulder' : 'rock';
      if (this.textures.exists(key)) {
        const s = 0.7 + rng.frac()*0.6;
        this.add.image(x,y,key).setDepth(y).setScale(s);
        this.addObstacle(x, y, 30*s, 30*s);
      }
    });
    // Skały na bagnach
    this.scatterInBiome('swamp', 60, (x,y) => {
      if (this.textures.exists('rock')) this.add.image(x,y,'rock').setDepth(y).setScale(0.6+rng.frac()*0.4);
    });
    // Krzewy i grzyby w lesie
    this.scatterInBiome('forest', 200, (x,y) => {
      if (rng.frac() < 0.5 && this.textures.exists('bush')) this.add.image(x,y,'bush').setDepth(y).setScale(0.6+rng.frac()*0.4);
      if (rng.frac() < 0.3 && this.textures.exists('mushroom')) this.add.image(x,y,'mushroom').setDepth(y+1);
    });
    // Groby na cmentarzysku
    this.scatterInRect(2500, 500, 400, 400, 30, (x,y) => {
      if (biomeAt(x,y) !== 'dark') return;
      if (this.textures.exists('gravestone')) this.add.image(x,y,'gravestone').setDepth(y).setScale(0.8+rng.frac()*0.4);
    });
    // Czaszki w ciemnych biomach
    this.scatterInBiome('dark', 40, (x,y) => {
      if (this.textures.exists('skull')) this.add.image(x,y,'skull').setDepth(y+1);
    });
    // Drogowskazy przy trakcie
    if (this.textures.exists('waypost')) {
      for (let y = 400; y < 1950; y += 400) {
        this.add.image(790, y, 'waypost').setDepth(y);
      }
    }
    // Wrak łodzi na plaży (dekoracja)
    this.drawWreck(300, 2080);
    this.drawWreck(1800, 2090);
    this.drawWreck(2800, 2110);

    // Skrzynie i przedmioty rozrzucone po świecie
    this.scatterWorldChestsAndItems(rng);
  }

  private drawWreck(x:number, y:number) {
    // Prosty "wrak łodzi" z desek
    this.add.rectangle(x, y, 60, 18, 0x3a2008).setStrokeStyle(2,0x1a0c04).setDepth(y);
    this.add.rectangle(x-10, y-8, 40, 6, 0x4a2808).setDepth(y+1);
    this.add.rectangle(x+10, y+8, 30, 4, 0x2a1808).setDepth(y+1);
  }

  private scatterInBiome(biome: BiomeType, count: number, cb: (x:number,y:number)=>void) {
    const seed = 'scatter-' + biome;
    const rng = new Phaser.Math.RandomDataGenerator([seed]);
    let placed = 0, tries = 0;
    while (placed < count && tries < count*20) {
      tries++;
      const x = rng.between(30, WORLD_W-30);
      const y = rng.between(30, WORLD_H-30);
      const b = biomeAt(x,y);
      if (b === biome) { cb(x,y); placed++; }
    }
  }

  private scatterInRect(x:number,y:number,w:number,h:number,count:number,cb:(xx:number,yy:number)=>void) {
    const seed = 'rect-' + x + ',' + y + ',' + w + ',' + h;
    const rng = new Phaser.Math.RandomDataGenerator([seed]);
    for (let i=0;i<count;i++) cb(rng.between(x,x+w), rng.between(y,y+h));
  }

  private isInSafeZone(x:number,y:number): boolean {
    for (const s of SAFE_ZONES) {
      const dx = x-s.x, dy = y-s.y;
      if (dx*dx + dy*dy < s.r*s.r) return true;
    }
    return false;
  }

  private scatterWorldChestsAndItems(rng: Phaser.Math.RandomDataGenerator) {
    type CDef = {x:number;y:number;diff:number;loot:string[];owner?:string};
    const defs: CDef[] = [
      { x: OLD_FORT.x-60, y: OLD_FORT.y-40, diff: 2, loot: ['sword_iron_longsword','misc_gold','misc_arrow'], owner: 'old_order' },
      { x: OLD_FORT.x+70, y: OLD_FORT.y-50, diff: 2, loot: ['armor_guard_chainmail','misc_lockpick_iron','potion_healing_small'], owner: 'old_order' },
      { x: NEW_CAMP.x+70, y: NEW_CAMP.y-60, diff: 2, loot: ['bow_shortbow','misc_lockpick_iron','potion_healing_small'], owner: 'new_order' },
      { x: 1200, y: 1000, diff: 1, loot: ['misc_gold','potion_healing_small'] },
      { x: 2400, y: 1700, diff: 3, loot: ['sword_obsidian_cleaver','misc_gold','potion_mana_small'] },
      { x: 1600, y: 220, diff: 3, loot: ['misc_trophy_mutant_eye','potion_healing_large','misc_gold'] },
      { x: 2700, y: 700, diff: 2, loot: ['sword_bone_carver','misc_skins_wolf','misc_gold'] },
      { x: 400, y: 2100, diff: 1, loot: ['misc_gold','misc_arrow','potion_healing_small'] },
      { x: 2700, y: 1800, diff: 1, loot: ['plant_frost_grass','plant_moonweed','potion_stamina'] },
    ];
    for (const def of defs) {
      // Używamy tekstury skrzyni jeśli jest
      let cont: Phaser.GameObjects.Container | Phaser.GameObjects.Image;
      if (this.textures.exists('chest_closed')) {
        const img = this.add.image(def.x, def.y, 'chest_closed').setDepth(def.y);
        cont = img;
        this.addObstacle(def.x, def.y+5, 22, 18);
      } else {
        const c = this.add.container(def.x, def.y);
        const box = this.add.rectangle(0,0,28,22,0x4a2808).setStrokeStyle(2,0x201004);
        const lock = this.add.rectangle(0,2,4,6,0xccaa40);
        c.add([box,lock]); c.setDepth(def.y);
        cont = c;
      }
      this.chests.push({ id: `chest_${def.x}_${def.y}`, x:def.x, y:def.y, difficulty:def.diff, opened:false, loot:def.loot, owner_faction:def.owner, container: cont as any });
    }

    // Rośliny
    const plants = this.gameData.items_plants || [];
    let plantIdx = 0;
    for (let i=0;i<80;i++) {
      const x = rng.between(100, WORLD_W-100);
      const y = rng.between(100, WORLD_H-100);
      const b = biomeAt(x,y);
      if (b === 'water') continue;
      if (this.isInSafeZone(x,y) && rng.frac() < 0.5) continue;
      const pickPlant = plants[plantIdx % plants.length];
      plantIdx++;
      if (!this.textures.exists('herb')) continue;
      const sprite = this.add.image(x,y,'herb').setDepth(y);
      if (b === 'dark') sprite.setTint(0x6655aa);
      else if (b === 'swamp') sprite.setTint(0x6a7a3a);
      else if (b === 'mountain') sprite.setTint(0x888888);
      else if (b === 'beach') sprite.setTint(0xc0a060);
      this.worldItems.push({ id: `plant_${x}_${y}`, x, y, itemId: pickPlant.id, collected:false, container: sprite });
    }
    // Luźne itemy
    for (let i=0;i<25;i++) {
      const x = rng.between(100, WORLD_W-100);
      const y = rng.between(100, WORLD_H-100);
      if (biomeAt(x,y) === 'water') continue;
      if (this.isInSafeZone(x,y) && rng.frac() < 0.5) continue;
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
    const oldNpcs = this.gameData.npcs.filter(n => n.faction === 'old_order');
    const newNpcs = this.gameData.npcs.filter(n => n.faction === 'new_order');
    const neutralNpcs = this.gameData.npcs.filter(n => n.faction === 'neutral');
    const bandits = this.gameData.npcs.filter(n => n.faction === 'bandit');

    // Gród Straży - większy obszar, rozstawienie bez nakładania
    this.placeNpcsInArea(oldNpcs, OLD_FORT.x, OLD_FORT.y, OLD_FORT.r*1.6, OLD_FORT.r*1.6, true, 30);
    // Wolne Chaty
    this.placeNpcsInArea(newNpcs, NEW_CAMP.x, NEW_CAMP.y, NEW_CAMP.r*1.6, NEW_CAMP.r*1.6, true, 30);

    // Neutralni: rozrzuceni w klastrach
    this.placeNpcsScattered(neutralNpcs, [
      { x: BEACH_SURVIVOR.x, y: BEACH_SURVIVOR.y, r: 20 },   // Gniewosz (stała pozycja jest w kodzie)
      { x: 750, y: 1200, r: 180 },    // przy trakcie
      { x: 750, y: 1600, r: 120 },
      { x: 1100, y: 1400, r: 180 },
      { x: 1800, y: 1000, r: 220 },
      { x: 2800, y: 1700, r: 200 },   // bagna
      { x: 2700, y: 500, r: 180 },    // góry (Cmentarz)
      { x: 300, y: 2050, r: 150 },    // plaża (rybak itp.)
    ]);
    // Bandyci w lesie i na bagnach - Z DALA od startu
    this.placeNpcsScattered(bandits, [
      { x: 1300, y: 900, r: 250 },    // głęboko w lesie
      { x: 2300, y: 1500, r: 250 },   // wejście na bagna
      { x: 1800, y: 400, r: 180 },    // w górach
    ]);
  }

  private placeNpcsInArea(list: any[], cx:number, cy:number, w:number, h:number, cluster:boolean, spacing:number) {
    const seed = 'npc-area-' + cx + ',' + cy;
    const rng = new Phaser.Math.RandomDataGenerator([seed]);
    let i = 0;
    const placed: Array<{x:number;y:number}> = [];
    for (const data of list) {
      let x=0, y=0, ok = false;
      for (let attempt=0; attempt<30; attempt++) {
        if (cluster) {
          const col = i % 4; const row = Math.floor(i/4);
          x = cx - w/2 + col * (w/4) + rng.between(-15,15);
          y = cy - h/2 + row * (h/4) + rng.between(-15,15);
        } else {
          x = cx + rng.between(-w/2,w/2); y = cy + rng.between(-h/2,h/2);
        }
        // Sprawdź czy miejsce nie jest zajęte
        let free = true;
        for (const p of placed) {
          if (Phaser.Math.Distance.Between(x,y,p.x,p.y) < spacing) { free = false; break; }
        }
        if (free) { ok = true; break; }
      }
      placed.push({x,y});
      i++;
      this.npcs.push(new NPC(this, x, y, data));
    }
  }

  private placeNpcsScattered(list: any[], areas: Array<{x:number;y:number;r:number}>) {
    const rng = new Phaser.Math.RandomDataGenerator(['npc-scatter-v3']);
    let idx = 0;
    for (const data of list) {
      // Gniewosz - plaża, ściśle określona pozycja obok gracza
      if (data.id === 'npc_beach_survivor') {
        this.npcs.push(new NPC(this, BEACH_SURVIVOR.x, BEACH_SURVIVOR.y, data));
        idx++; continue;
      }
      const area = areas[idx % areas.length];
      let x=0,y=0;
      for (let attempt=0; attempt<10; attempt++) {
        const ang = rng.frac()*Math.PI*2;
        const dist = Math.sqrt(rng.frac())*area.r;
        x = Phaser.Math.Clamp(area.x + Math.cos(ang)*dist, 60, WORLD_W-60);
        y = Phaser.Math.Clamp(area.y + Math.sin(ang)*dist, 60, WORLD_H-60);
        const b = biomeAt(x,y);
        if (b !== 'water') break;
      }
      this.npcs.push(new NPC(this, x, y, data));
      idx++;
    }
  }

  private spawnMonstersByBiome() {
    if (!this.gameData.monsters) return;
    const rng = new Phaser.Math.RandomDataGenerator(['monsters-v3']);
    // Biome -> potwory (UWAGA: plaża NIE ma wilków - to startowa lokacja)
    const biomeMonster: Record<BiomeType, string[]> = {
      forest: ['monster_grey_wolf', 'monster_forest_boar'],
      swamp: ['monster_marsh_crawler'],
      mountain: ['monster_sand_wyrm', 'monster_forest_boar'],
      dark: ['monster_mutant', 'monster_shade'],
      beach: [],          // PLAŻA BEZPIECZNA
      road: [],           // TRAKT BEZPIECZNY (handlowy)
      water: [], fort: [], camp: [], grass: []
    };
    // Nocą pojawiają się cienie w lesie i droga staje się niebezpieczna
    // (dodamy w prosty sposób: spawn 60 pkt)
    const spawnPoints: Array<{x:number;y:number;biome:BiomeType}> = [];
    let tries = 0;
    while (spawnPoints.length < 60 && tries < 2000) {
      tries++;
      const x = rng.between(120, WORLD_W-120);
      const y = rng.between(120, WORLD_H-200);
      const b = biomeAt(x,y);
      // Bez potworów w bezpiecznych strefach i w wodzie
      if (this.isInSafeZone(x,y)) continue;
      if (b === 'water' || b === 'fort' || b === 'camp') continue;
      // Oddal od startu
      const ds = Phaser.Math.Distance.Between(x,y,START_POINT.x,START_POINT.y);
      if (ds < 500) continue;
      spawnPoints.push({x,y,biome:b});
    }
    for (const sp of spawnPoints) {
      const options = biomeMonster[sp.biome] || [];
      if (options.length === 0) continue;
      const mid = options[Math.floor(rng.frac()*options.length)];
      const data = this.gameData.monsters.find(m => m.id === mid);
      if (!data) continue;
      const pack = (data.behavior||[]).includes('pack');
      const count = pack ? rng.between(2,3) : 1;
      for (let j=0;j<count;j++) {
        const jx = Phaser.Math.Clamp(sp.x + rng.between(-50,50), 60, WORLD_W-60);
        const jy = Phaser.Math.Clamp(sp.y + rng.between(-50,50), 60, WORLD_H-100);
        if (this.isInSafeZone(jx,jy)) continue;
        if (biomeAt(jx,jy) === 'water') continue;
        this.monsters.push(new Monster(this, jx, jy, data));
      }
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update(_time: number, delta: number) {
    if (this.isPaused || this.gameOver) return;
    const d = Math.min(delta, 100);

    this.timeSystem.update(d);
    const light = this.timeSystem.getLightFactor();
    this.nightOverlay.setFillStyle(0x000033, Phaser.Math.Linear(0.55, 0, light));

    // Sprawdź czy gracz w wodzie (obrażenia + slow)
    const b = biomeAt(this.player.x, this.player.y);
    if (b === 'water') {
      if (!this.player.body || (this.player.body as Phaser.Physics.Arcade.Body).touching.none === false) {
        // Spowolnienie
        this.player.speed = 40;
        this.waterOverlay.setFillStyle(0x15283d, 0.5);
      }
    } else {
      this.waterOverlay.setFillStyle(0x15283d, 0);
    }

    // Ruch
    let vx=0, vy=0;
    if (this.keys.A.isDown || this.cursors.left.isDown) vx = -1;
    else if (this.keys.D.isDown || this.cursors.right.isDown) vx = 1;
    if (this.keys.W.isDown || this.cursors.up.isDown) vy = -1;
    else if (this.keys.S.isDown || this.cursors.down.isDown) vy = 1;
    if (vx!==0 && vy!==0) { vx*=0.707; vy*=0.707; }
    const wantSprint = this.keys.SHIFT.isDown && b !== 'water';
    const baseSpeed = wantSprint ? 180 : 120;
    this.player.speed = b === 'water' ? 40 : baseSpeed;

    if (vx!==0 || vy!==0) {
      this.player.move(vx,vy);
      this.stepTimer += d;
      if (this.stepTimer > (wantSprint?230:350)) { this.stepTimer = 0; try { audio.sfxStep(); } catch{} }
    } else this.player.stopMoving();

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
      `${biomeAt(this.player.x,this.player.y)}\n`+
      `[1]Miecz [2]Łuk [3]Magia | E-interakcja | M-mapa | CTRL+E kradzież | Najbliższy: ${this.getInteractableLabel()}`
    );

    this.updateMinimap();
    this.updateBiomeLabel();

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
        if (chest.container) {
          const c: any = chest.container;
          if (c.setTexture) c.setTexture('chest_open');
          else c.setAlpha?.(0.5);
        }
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
      window.dispatchEvent(new CustomEvent('game:message',{detail:'Potrzebujesz wytrychu.'})); audio.sfxError(); return;
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
    this.tweens.add({targets:this.player,scaleX:1.2,scaleY:0.85,duration:80,yoyo:true});
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
