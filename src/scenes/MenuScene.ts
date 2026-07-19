import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(data: any) {
    const isPause = data?.from === 'pause';
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Półprzezroczyste tło (dla pauzy)
    if (isPause) {
      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    }
    
    // Tytuł
    const title = this.add.text(width / 2, isPause ? 100 : 150, isPause ? 'PAUZA' : 'KRWAWY SZLAK', {
      fontSize: isPause ? '28px' : '48px',
      color: '#8b0000',
      stroke: '#000000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    if (!isPause) {
      this.add.text(width / 2, 200, 'Mroczne Action RPG 2D', {
        fontSize: '14px',
        color: '#888888'
      }).setOrigin(0.5);
    }
    
    // Przyciski
    const buttons = isPause 
      ? [
          { text: 'Wznów grę', action: () => this.resumeGame(data) },
          { text: 'Zapisz grę', action: () => this.quickSave(data) },
          { text: 'Wczytaj grę', action: () => this.loadGame(data) },
          { text: 'Opcje', action: () => this.showOptions(data) },
          { text: 'Wyjście do menu', action: () => this.backToMenu() }
        ]
      : [
          { text: 'Nowa gra', action: () => this.newGame(data) },
          { text: 'Wczytaj grę', action: () => this.loadGame(data) },
          { text: 'Opcje', action: () => this.showOptions(data) },
          { text: 'Wyjście', action: () => {} }
        ];
    
    buttons.forEach((btn, i) => {
      const y = (isPause ? 180 : 280) + i * 50;
      const btnBg = this.add.rectangle(width / 2, y, 250, 40, 0x333333, 0.8)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x666666);
      
      const btnText = this.add.text(width / 2, y, btn.text, {
        fontSize: '16px',
        color: '#cccccc'
      }).setOrigin(0.5);
      
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x555555);
        btnText.setColor('#ffffff');
      });
      
      btnBg.on('pointerout', () => {
        btnBg.setFillStyle(0x333333, 0.8);
        btnText.setColor('#cccccc');
      });
      
      btnBg.on('pointerdown', () => {
        btn.action();
      });
    });
    
    // Instrukcje
    if (!isPause) {
      this.add.text(width / 2, height - 80, 
        'WASD - ruch | E - interakcja | I - ekwipunek\nJ - dziennik | ESC - pauza | F5 - szybki zapis', {
        fontSize: '10px',
        color: '#666666',
        align: 'center'
      }).setOrigin(0.5);
    }
  }

  private newGame(data: any) {
    this.scene.stop('MenuScene');
    this.scene.start('GameScene', {
      dataLoader: data.dataLoader,
      saveSystem: data.saveSystem,
      timeSystem: data.timeSystem,
      gameData: data.gameData
    });
  }

  private resumeGame(data: any) {
    this.scene.stop('MenuScene');
    if (data?.gameScene) {
      data.gameScene.scene.resume();
    }
  }

  private async quickSave(data: any) {
    if (data?.gameScene) {
      await data.gameScene.quickSave();
      const msg = this.add.text(512, 400, 'Zapisano!', {
        fontSize: '24px', color: '#00ff00', stroke: '#000000', strokeThickness: 3
      }).setOrigin(0.5);
      this.time.delayedCall(1000, () => msg.destroy());
    }
  }

  private loadGame(data: any) {
    // W pełnej wersji: pokaż sloty zapisu
    this.scene.stop('MenuScene');
    this.scene.start('GameScene', {
      dataLoader: data.dataLoader,
      saveSystem: data.saveSystem,
      timeSystem: data.timeSystem,
      gameData: data.gameData
    });
  }

  private showOptions(data: any) {
    // TODO: pełny ekran opcji
    const msg = this.add.text(512, 400, 'Opcje - w budowie', {
      fontSize: '20px', color: '#ffff00', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    this.time.delayedCall(1500, () => msg.destroy());
  }

  private backToMenu() {
    this.scene.stop('MenuScene');
    this.scene.stop('GameScene');
    this.scene.stop('UIScene');
    this.scene.start('MenuScene');
  }
}
