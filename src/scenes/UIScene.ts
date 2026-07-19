import Phaser from 'phaser';
import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private manaBar!: Phaser.GameObjects.Rectangle;
  private manaBarBg!: Phaser.GameObjects.Rectangle;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private manaText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private messageTimer: number = 0;
  private inventoryOpen: boolean = false;
  private inventoryContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: { gameScene: GameScene }) {
    this.gameScene = data.gameScene;
  }

  create() {
    const W = 1024;
    
    // Tło HUD
    this.add.rectangle(W / 2, 745, W, 46, 0x0a0a0a, 0.8);
    this.add.rectangle(W / 2, 745, W, 1, 0x444444);
    
    // HP bar
    this.hpBarBg = this.add.rectangle(20, 730, 200, 14, 0x333333).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(20, 730, 200, 14, 0xcc0000).setOrigin(0, 0.5);
    this.hpText = this.add.text(20, 730, 'HP: 50/50', { fontSize: '10px', color: '#ffffff' }).setOrigin(0, 0.5);
    
    // Mana bar
    this.manaBarBg = this.add.rectangle(20, 748, 130, 10, 0x333333).setOrigin(0, 0.5);
    this.manaBar = this.add.rectangle(20, 748, 130, 10, 0x0044cc).setOrigin(0, 0.5);
    this.manaText = this.add.text(20, 748, 'MP: 20/20', { fontSize: '9px', color: '#ffffff' }).setOrigin(0, 0.5);
    
    // XP bar
    this.xpBarBg = this.add.rectangle(180, 748, 100, 6, 0x333333).setOrigin(0, 0.5);
    this.xpBar = this.add.rectangle(180, 748, 100, 6, 0xccaa00).setOrigin(0, 0.5);
    
    // Level
    this.levelText = this.add.text(20, 718, 'LVL 1', { fontSize: '10px', color: '#ffcc00' });
    
    // Złoto
    this.goldText = this.add.text(W - 120, 730, 'Złoto: 20', { fontSize: '11px', color: '#ffcc00' });
    
    // Broń
    this.weaponText = this.add.text(W - 120, 748, 'Broń: brak', { fontSize: '9px', color: '#aaaaaa' });
    
    // Czas
    this.timeText = this.add.text(W / 2, 748, '08:00 - Dzień 1', { 
      fontSize: '10px', color: '#aaaaaa' 
    }).setOrigin(0.5);
    
    // Komunikaty (przewijane)
    this.messageText = this.add.text(W / 2, 690, '', {
      fontSize: '12px',
      color: '#ffffcc',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Nasłuchiwanie eventów
    window.addEventListener('game:message', (e: any) => {
      this.showMessage(e.detail);
    });
    
    window.addEventListener('game:playerHit', (e: any) => {
      this.showMessage(`Obrażenia: ${e.detail.damage}`, '#ff4444');
    });
    
    window.addEventListener('game:time', (e: any) => {
      this.timeText.setText(`${e.detail.time} - Dzień ${e.detail.day}`);
    });
    
    // Ekwipunek (przycisk I)
    this.input.keyboard!.on('keydown-I', () => {
      this.toggleInventory();
    });
  }

  update() {
    if (!this.gameScene || !this.gameScene.player) return;
    
    const player = this.gameScene.player;
    
    // HP bar
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    this.hpBar.setScale(hpRatio, 1);
    this.hpText.setText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`);
    
    // Mana bar
    const manaRatio = Math.max(0, player.mana / player.maxMana);
    this.manaBar.setScale(manaRatio, 1);
    this.manaText.setText(`MP: ${Math.floor(player.mana)}/${player.maxMana}`);
    
    // XP bar
    const xpRatio = Math.max(0, player.xp / player.xpToNext);
    this.xpBar.setScale(xpRatio, 1);
    
    // Level
    this.levelText.setText(`LVL ${player.level}`);
    
    // Złoto
    this.goldText.setText(`Złoto: ${player.gold}`);
    
    // Broń
    this.weaponText.setText(`Broń: ${player.equippedWeapon || 'brak'}`);
    
    // Komunikaty
    if (this.messageTimer > 0) {
      this.messageTimer -= 16;
      if (this.messageTimer <= 0) {
        this.messageText.setText('');
      }
    }
  }

  private showMessage(msg: string, color: string = '#ffffcc') {
    this.messageText.setText(msg);
    this.messageText.setColor(color);
    this.messageTimer = 3000;
  }

  private toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    
    if (this.inventoryOpen) {
      this.showInventory();
    } else {
      if (this.inventoryContainer) {
        this.inventoryContainer.destroy();
      }
    }
  }

  private showInventory() {
    if (this.inventoryContainer) this.inventoryContainer.destroy();
    
    this.inventoryContainer = this.add.container(512, 384);
    
    // Tło
    const bg = this.add.rectangle(0, 0, 500, 400, 0x1a1a1a, 0.95);
    bg.setStrokeStyle(2, 0x444444);
    this.inventoryContainer.add(bg);
    
    // Tytuł
    const title = this.add.text(0, -180, 'EKWIPUNEK', {
      fontSize: '18px', color: '#ffcc00'
    }).setOrigin(0.5);
    this.inventoryContainer.add(title);
    
    // Lista przedmiotów
    const player = this.gameScene.player;
    const items = player.inventory;
    
    if (items.length === 0) {
      const empty = this.add.text(0, 0, 'Pusto. Znajdź coś po drodze.', {
        fontSize: '14px', color: '#666666'
      }).setOrigin(0.5);
      this.inventoryContainer.add(empty);
    } else {
      items.forEach((itemId, i) => {
        if (i > 15) return; // limit widocznych
        const y = -140 + i * 22;
        const count = player.getItemCount(itemId);
        const itemText = this.add.text(-220, y, `${itemId}${count > 1 ? ` (${count})` : ''}`, {
          fontSize: '11px', color: '#cccccc'
        });
        this.inventoryContainer.add(itemText);
      });
    }
    
    // Zamknij
    const closeBtn = this.add.text(220, -180, '[X]', {
      fontSize: '14px', color: '#ff4444'
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleInventory());
    this.inventoryContainer.add(closeBtn);
    
    // Instrukcja
    const help = this.add.text(0, 170, 'I - zamknij | C - statystyki | J - dziennik', {
      fontSize: '10px', color: '#666666'
    }).setOrigin(0.5);
    this.inventoryContainer.add(help);
  }
}
