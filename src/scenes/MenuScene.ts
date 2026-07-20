import Phaser from 'phaser';
import { SaveSlot } from '../types';
import { audio } from '../systems/AudioSystem';

export class MenuScene extends Phaser.Scene {
  private messageText?: Phaser.GameObjects.Text;
  private saveSlots: SaveSlot[] = [];
  private started: boolean = false;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(data: any) {
    const isPause = data?.from === 'pause';
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Boot audio on first interaction (browser policy) - ensure init called early
    audio.init().catch(() => {});

    if (isPause) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a);
    }

    this.add.text(width / 2, isPause ? 80 : 120, isPause ? 'PAUZA' : 'KRWAWY SZLAK', {
      fontSize: isPause ? '28px' : '48px',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    if (!isPause) {
      this.add.text(width / 2, 180, 'Mroczne Action RPG 2D', {
        fontSize: '14px',
        color: '#888888'
      }).setOrigin(0.5);
    }

    this.messageText = this.add.text(width / 2, height - 120, '', {
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    if (isPause) {
      this.buildPauseMenu(data, width);
    } else {
      this.buildMainMenu(data, width);
    }

    if (!isPause) {
      this.add.text(width / 2, height - 60,
        'WASD - ruch | E - interakcja | I - ekwipunek\nJ - dziennik | ESC - pauza | F5 - zapis | F9 - wczytanie', {
        fontSize: '10px',
        color: '#666666',
        align: 'center'
      }).setOrigin(0.5);
    }
  }

  private buildMainMenu(data: any, width: number) {
    const baseY = 280;
    // Tip / "press any key" style starting hint
    const startHint = this.add.text(width / 2, 240, '— Kliknij dowolny przycisk aby rozpocząć —', {
      fontSize: '12px', color: '#666666'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: startHint, alpha: 1, duration: 1000, yoyo: true, repeat: -1 });

    const buttons = [
      { text: 'Nowa gra', action: () => this.newGame(data) },
      { text: 'Wczytaj grę', action: () => this.showLoadMenu(data) },
      { text: 'Opcje', action: () => this.showOptions() },
      { text: 'Wyjście', action: () => this.exitGame() }
    ];
    buttons.forEach((btn, i) => this.makeButton(width / 2, baseY + i * 50, 250, 40, btn.text, btn.action));
  }

  private buildPauseMenu(data: any, width: number) {
    const baseY = 150;
    const buttons = [
      { text: 'Wznów grę', action: () => this.resumeGame(data) },
      { text: 'Zapisz grę', action: () => this.quickSave(data) },
      { text: 'Wczytaj grę', action: () => this.showLoadMenu(data) },
      { text: 'Opcje', action: () => this.showOptions() },
      { text: 'Wyjście do menu', action: () => this.backToMenu() }
    ];
    buttons.forEach((btn, i) => this.makeButton(width / 2, baseY + i * 50, 250, 40, btn.text, btn.action));
  }

  private makeButton(x: number, y: number, w: number, h: number, text: string, action: () => void) {
    const bg = this.add.rectangle(x, y, w, h, 0x333333, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x666666);
    const t = this.add.text(x, y, text, { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5);
    bg.on('pointerover', () => { bg.setFillStyle(0x555555); t.setColor('#ffffff'); audio.sfxUINavigate(); });
    bg.on('pointerout', () => { bg.setFillStyle(0x333333, 0.8); t.setColor('#cccccc'); });
    bg.on('pointerdown', () => {
      audio.init().then(() => {
        audio.sfxClick();
        if (!this.started) {
          this.started = true;
          audio.startMusic();
        }
      });
      action();
    });
  }

  private showMessage(msg: string, color: string = '#ffff00', duration: number = 2000) {
    if (this.messageText) {
      this.messageText.setText(msg);
      this.messageText.setColor(color);
      this.time.delayedCall(duration, () => { if (this.messageText) this.messageText.setText(''); });
    }
  }

  private newGame(data: any) {
    this.scene.stop('MenuScene');
    // Stop game scene if running (new game from pause or submenu)
    if (this.scene.isActive('GameScene')) this.scene.stop('GameScene');
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    if (this.scene.isActive('DialogScene')) this.scene.stop('DialogScene');
    this.scene.start('GameScene', {
      dataLoader: data.dataLoader,
      saveSystem: data.saveSystem,
      timeSystem: data.timeSystem,
      gameData: data.gameData,
      isNewGame: true
    });
  }

  private resumeGame(data: any) {
    this.scene.stop('MenuScene');
    if (data?.gameScene) {
      data.gameScene.scene.resume();
      if (this.scene.isPaused('UIScene')) this.scene.resume('UIScene');
    } else {
      this.scene.stop('MenuScene');
    }
  }

  private async quickSave(data: any) {
    if (data?.gameScene) {
      try {
        await data.gameScene.quickSave();
        this.showMessage('Zapisano!', '#00ff00');
      } catch (e) {
        this.showMessage('Błąd zapisu', '#ff4444');
      }
    } else {
      this.showMessage('Brak aktywnej gry', '#ff4444');
    }
  }

  private async showLoadMenu(data: any) {
    // Simple: list saves then load chosen one
    if (!data?.saveSystem) {
      this.showMessage('System zapisu niedostępny', '#ff4444');
      return;
    }
    try {
      this.saveSlots = await data.saveSystem.getSlots();
    } catch {
      this.saveSlots = [];
    }
    if (this.saveSlots.length === 0) {
      // Try loading autosave directly
      const autosave = await data.saveSystem.load(0);
      if (autosave) {
        this.loadSave(data, 0);
        return;
      }
      this.showMessage('Brak zapisów', '#ff4444');
      return;
    }
    // For simplicity: load most recent save
    const latest = this.saveSlots.sort((a, b) => b.timestamp - a.timestamp)[0];
    this.loadSave(data, latest.slot_index);
  }

  private loadSave(data: any, slot: number) {
    this.scene.stop('MenuScene');
    if (this.scene.isActive('GameScene')) this.scene.stop('GameScene');
    if (this.scene.isActive('UIScene')) this.scene.stop('UIScene');
    if (this.scene.isActive('DialogScene')) this.scene.stop('DialogScene');
    this.scene.start('GameScene', {
      dataLoader: data.dataLoader,
      saveSystem: data.saveSystem,
      timeSystem: data.timeSystem,
      gameData: data.gameData,
      loadSlot: slot
    });
  }

  private showOptions() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const overlay = this.add.container(width / 2, height / 2);
    const bg = this.add.rectangle(0, 0, 500, 380, 0x1a1a1a, 0.98).setStrokeStyle(2, 0x666666);
    const title = this.add.text(0, -170, 'OPCJE', { fontSize: '20px', color: '#ffcc00' }).setOrigin(0.5);

    const info = this.add.text(-220, -140,
      'Sterowanie:\n  WASD / Strzałki - ruch\n  Shift - bieg\n  E - interakcja\n  Lewy przycisk - atak\n  Prawy przycisk - blok/celowanie\n  Tab / 1 / 2 / 3 - tryb walki\n  CTRL+E - kradzież kieszonkowa\n  I - ekwipunek   J - dziennik\n  C - statystyki   Esc - pauza\n  F5 - zapis   F9 - wczytanie',
      { fontSize: '12px', color: '#cccccc', align: 'left', lineSpacing: 2 }
    ).setOrigin(0, 0);

    // Audio toggles
    let musicOn = audio.isMusicEnabled();
    let sfxOn = audio.isSfxEnabled();
    const musicTxt = this.add.text(-220, 90, `Muzyka: ${musicOn ? 'WŁ' : 'WYŁ'}  [klik]`, { fontSize: '13px', color: musicOn ? '#44ff44' : '#888888' });
    const sfxTxt = this.add.text(-220, 115, `Efekty: ${sfxOn ? 'WŁ' : 'WYŁ'}  [klik]`, { fontSize: '13px', color: sfxOn ? '#44ff44' : '#888888' });
    musicTxt.setInteractive({ useHandCursor: true });
    sfxTxt.setInteractive({ useHandCursor: true });
    musicTxt.on('pointerdown', () => {
      audio.sfxClick();
      musicOn = !musicOn;
      audio.setMusicEnabled(musicOn);
      musicTxt.setText(`Muzyka: ${musicOn ? 'WŁ' : 'WYŁ'}  [klik]`);
      musicTxt.setColor(musicOn ? '#44ff44' : '#888888');
    });
    sfxTxt.on('pointerdown', () => {
      sfxOn = !sfxOn;
      audio.setSfxEnabled(sfxOn);
      if (sfxOn) audio.sfxClick();
      sfxTxt.setText(`Efekty: ${sfxOn ? 'WŁ' : 'WYŁ'}  [klik]`);
      sfxTxt.setColor(sfxOn ? '#44ff44' : '#888888');
    });

    this.add.text(-220, 145, 'Rozdzielczość: dopasowuje się do okna (FIT).\nMuzyka i efekty syntezowane proceduralnie.', {
      fontSize: '11px', color: '#888888'
    }).setOrigin(0, 0);

    const close = this.add.rectangle(0, 160, 160, 36, 0x444444).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x888888);
    const closeT = this.add.text(0, 160, 'Zamknij', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    overlay.add([bg, title, info, musicTxt, sfxTxt, close, closeT]);
    close.on('pointerover', () => close.setFillStyle(0x666666));
    close.on('pointerout', () => close.setFillStyle(0x444444));
    close.on('pointerdown', () => { audio.sfxClick(); overlay.destroy(); });
  }

  private exitGame() {
    // In browser, just show message
    this.showMessage('Aby wyjść, zamknij kartę przeglądarki.', '#cccccc', 4000);
  }

  private backToMenu() {
    // BUG-016: stop all game scenes and restart menu fresh
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.stop('DialogScene');
    this.scene.stop('MenuScene');
    this.scene.start('MenuScene', {});
  }
}
