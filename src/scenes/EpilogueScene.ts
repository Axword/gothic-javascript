import Phaser from 'phaser';
import { audio } from '../systems/AudioSystem';

interface EpilogueData {
  faction: 'old_order' | 'new_order';
  level: number;
  gold: number;
  playTime: number;
  questsCompleted: number;
  kills: number;
}

export class EpilogueScene extends Phaser.Scene {
  constructor() {
    super({ key: 'EpilogueScene' });
  }

  create(data: EpilogueData) {
    audio.playEpilogue();
    audio.stopMusic();

    const W = 1024, H = 768;
    this.cameras.main.setBackgroundColor('#0a0000');

    // Fade in
    this.cameras.main.fadeIn(1500, 0, 0, 0);

    const factionName = data.faction === 'old_order' ? 'STRAŻY (STARY PORZĄDEK)' : 'WOLNYCH CHAT (NOWY PORZĄDEK)';
    const factionColor = data.faction === 'old_order' ? '#4466aa' : '#aa4444';
    const endingText = data.faction === 'old_order'
      ? 'Przyodziany w barwy Straży, stanąłeś u boku Komendanta. Pod żelazną pięścią prawa Gród umocnił swoją władzę nad traktem. Szczelina została zamknięta ogniem i modlitwą, choć weterani mówią, że takie rany nigdy się nie goją do końca. W Kresach Północnych zapanował porządek - surowy, ale bezpieczny. Przynajmniej na razie.'
      : 'Dołączyłeś do Sępa i jego wyjętych spod prawa Wolnych. Pod sztandarem wolności obaliliście stare przywileje, a Szczelinę zbadaliście własnymi sposobami. Prawo słabego jest teraz regułą, ale każdy ma szansę wykuć własną legendę. Kresy Północne stały się niebezpieczniejsze - i bardziej żywe. Na swój sposób.';

    const title = this.add.text(W / 2, 120, 'KONIEC', {
      fontSize: '56px', color: '#8b0000', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(W / 2, 200, `Dołączyłeś do ${factionName}`, {
      fontSize: '22px', color: factionColor,
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    const text = this.add.text(W / 2, 380, endingText, {
      fontSize: '15px', color: '#cccccc', align: 'center', wordWrap: { width: 640 },
      lineSpacing: 8
    }).setOrigin(0.5).setAlpha(0);

    const stats = this.add.text(W / 2, 540, 
      `Poziom: ${data.level}   |   Złoto: ${data.gold}   |   Ukończone zadania: ${data.questsCompleted}`,
      { fontSize: '12px', color: '#888888' }
    ).setOrigin(0.5).setAlpha(0);

    const info = this.add.text(W / 2, 640, 'Dziękujemy za grę w Krwawy Szlak', {
      fontSize: '16px', color: '#ffcc00',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0);

    const backBtn = this.add.rectangle(W / 2, 700, 220, 40, 0x333333, 0.9)
      .setStrokeStyle(2, 0x8b0000).setInteractive({ useHandCursor: true }).setAlpha(0);
    const backTxt = this.add.text(W / 2, 700, 'Powrót do menu', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0);

    // Reveal sequence
    this.tweens.add({ targets: title, alpha: 1, duration: 1500, delay: 500 });
    this.tweens.add({ targets: subtitle, alpha: 1, duration: 1500, delay: 2000 });
    this.tweens.add({ targets: text, alpha: 1, duration: 2000, delay: 3500 });
    this.tweens.add({ targets: stats, alpha: 1, duration: 1000, delay: 5500 });
    this.tweens.add({ targets: info, alpha: 1, duration: 1000, delay: 6500 });
    this.tweens.add({ targets: [backBtn, backTxt], alpha: 1, duration: 1000, delay: 7500 });

    backBtn.on('pointerover', () => backBtn.setFillStyle(0x552222));
    backBtn.on('pointerout', () => backBtn.setFillStyle(0x333333));
    backBtn.on('pointerdown', () => {
      audio.sfxClick();
      this.scene.stop('GameScene');
      this.scene.stop('UIScene');
      this.scene.start('MenuScene', {});
    });
  }
}
