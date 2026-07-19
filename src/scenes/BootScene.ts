import Phaser from 'phaser';
import { DataLoader, LoadedData } from '../systems/DataLoader';
import { SaveSystem } from '../systems/SaveSystem';
import { TimeSystem } from '../systems/TimeSystem';
import { ProceduralAssets } from '../systems/ProceduralAssets';

export class BootScene extends Phaser.Scene {
  private dataLoader!: DataLoader;
  private saveSystem!: SaveSystem;
  private timeSystem!: TimeSystem;
  private loadedData!: LoadedData;

  constructor() {
    super({ key: 'BootScene' });
  }

  async preload() {
    // Ekran ładowania
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    
    const title = this.add.text(width / 2, height / 2 - 60, 'KRWAWY SZLAK', {
      fontSize: '36px',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const loadingText = this.add.text(width / 2, height / 2, 'ŁADOWANIE...', {
      fontSize: '16px',
      color: '#888888'
    }).setOrigin(0.5);
    
    const progressBar = this.add.rectangle(width / 2, height / 2 + 40, 300, 20, 0x333333);
    const progressFill = this.add.rectangle(width / 2 - 148, height / 2 + 40, 0, 16, 0x8b0000);
    progressFill.setOrigin(0, 0.5);
    
    this.load.on('progress', (value: number) => {
      progressFill.width = 296 * value;
    });
    
    this.load.on('complete', () => {
      loadingText.setText('Wczytywanie danych...');
    });
    
    // Generujemy proceduralne tekstury
    this.generateProceduralTextures();
  }

  generateProceduralTextures() {
    // Legacy default texture
    const canvas = this.textures.createCanvas('__DEFAULT', 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;
    ctx.fillStyle = '#3a5a2a';
    ctx.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * 32);
      const y = Math.floor(Math.random() * 32);
      const shade = Math.floor(Math.random() * 40) + 40;
      ctx.fillStyle = `rgb(0, ${shade + 40}, 0)`;
      ctx.fillRect(x, y, 1, 1);
    }
    canvas.refresh();
    
    // Generate ALL game assets
    const assets = new ProceduralAssets(this);
    assets.generateAll();
  }

  async create() {
    this.dataLoader = new DataLoader();
    this.saveSystem = new SaveSystem();
    this.timeSystem = new TimeSystem();
    
    try {
      this.loadedData = await this.dataLoader.loadAll();
      
      if (this.dataLoader.hasErrors()) {
        console.warn('[Boot] Błędy danych:', this.dataLoader.getErrors());
      }
      
      await this.saveSystem.init();
      
      this.scene.start('MenuScene', {
        dataLoader: this.dataLoader,
        saveSystem: this.saveSystem,
        timeSystem: this.timeSystem,
        gameData: this.loadedData
      });
      
    } catch (e) {
      console.error('[Boot] Krytyczny błąd:', e);
      // Wyświetl błąd na ekranie
      this.add.text(320, 300, 'Błąd ładowania gry:\n' + (e as Error).message, {
        fontSize: '14px',
        color: '#ff0000'
      }).setOrigin(0.5);
    }
  }
}
