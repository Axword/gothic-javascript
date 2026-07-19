/**
 * Minigra otwierania zamków
 * 
 * Zasady:
 * - Pokazana jest sekwencja lewo/prawo do odtworzenia
 * - Gracz musi kliknąć we właściwą stronę w czasie
 * - Poziom umiejętności (lockpicking) zwiększa okno czasowe
 * - Wytrychy pękają przy błędzie
 */
export class LockpickMinigame {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private sequence: ('left' | 'right')[] = [];
  private currentStep: number = 0;
  private timeWindow: number = 1500;
  private timer: number = 0;
  private active: boolean = false;
  private difficulty: number = 1; // 1-3
  private onComplete: ((success: boolean) => void) | null = null;
  private arrows: Phaser.GameObjects.Text[] = [];
  private stepIndicator!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  start(difficulty: number, lockpickLevel: number, callback: (success: boolean) => void) {
    this.difficulty = difficulty;
    this.onComplete = callback;
    this.active = true;
    this.currentStep = 0;

    // Generate sequence (length based on difficulty)
    const seqLen = 3 + difficulty;
    this.sequence = [];
    for (let i = 0; i < seqLen; i++) {
      this.sequence.push(Math.random() > 0.5 ? 'left' : 'right');
    }

    // Time window based on skill
    this.timeWindow = 1500 + lockpickLevel * 200 - difficulty * 200;

    this.createUI();
  }

  private createUI() {
    if (this.container) this.container.destroy();
    this.arrows = [];

    const cx = this.scene.cameras.main.width / 2;
    const cy = this.scene.cameras.main.height / 2;

    this.container = this.scene.add.container(cx, cy);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 400, 250, 0x1a1a1a, 0.95);
    bg.setStrokeStyle(2, 0x666666);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(0, -100, 'OTWIERANIE ZAMKA', {
      fontSize: '16px', color: '#ffcc00'
    }).setOrigin(0.5);
    this.container.add(title);

    // Difficulty info
    const diffText = this.scene.add.text(0, -80, `Poziom trudności: ${this.difficulty}/3`, {
      fontSize: '11px', color: '#aaaaaa'
    }).setOrigin(0.5);
    this.container.add(diffText);

    // Sequence display
    for (let i = 0; i < this.sequence.length; i++) {
      const x = -120 + i * 60;
      const arrow = this.scene.add.text(x, -30, 
        this.sequence[i] === 'left' ? '◄' : '►', {
        fontSize: '28px', color: '#666666'
      }).setOrigin(0.5);
      this.arrows.push(arrow);
      this.container.add(arrow);
    }

    // Step indicator
    this.stepIndicator = this.scene.add.text(0, 10, 'Naciśnij strzałkę', {
      fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    this.container.add(this.stepIndicator);

    // Controls hint
    const hint = this.scene.add.text(0, 60, '◄ Lewo strzałka  |  Prawo strzałka ►', {
      fontSize: '12px', color: '#888888'
    }).setOrigin(0.5);
    this.container.add(hint);

    // Close hint
    const escHint = this.scene.add.text(0, 90, 'ESC - anuluj', {
      fontSize: '10px', color: '#666666'
    }).setOrigin(0.5);
    this.container.add(escHint);

    // Highlight first arrow
    this.highlightStep(0);

    // Pause game
    this.scene.scene.pause('GameScene');

    // Input handlers
    this.scene.input.keyboard!.on('keydown-LEFT', () => this.onInput('left'));
    this.scene.input.keyboard!.on('keydown-RIGHT', () => this.onInput('right'));
    this.scene.input.keyboard!.on('keydown-ESC', () => this.cancel());
  }

  private highlightStep(step: number) {
    this.arrows.forEach((a, i) => {
      a.setColor(i === step ? '#ffcc00' : '#666666');
    });
    this.stepIndicator.setText(`Krok ${step + 1} z ${this.sequence.length}`);
  }

  private onInput(dir: 'left' | 'right') {
    if (!this.active) return;

    const expected = this.sequence[this.currentStep];
    if (dir === expected) {
      // Correct!
      this.currentStep++;
      if (this.currentStep >= this.sequence.length) {
        // Success!
        this.end(true);
      } else {
        this.highlightStep(this.currentStep);
      }
    } else {
      // Wrong! Lockpick breaks
      this.end(false);
    }
  }

  private cancel() {
    this.end(false);
  }

  private end(success: boolean) {
    this.active = false;
    
    // Cleanup
    this.scene.input.keyboard!.off('keydown-LEFT');
    this.scene.input.keyboard!.off('keydown-RIGHT');
    this.scene.input.keyboard!.off('keydown-ESC');

    if (this.container) {
      this.container.destroy();
      this.container = null;
    }

    // Resume game
    this.scene.scene.resume('GameScene');

    if (this.onComplete) {
      this.onComplete(success);
    }
  }

  isActive(): boolean { return this.active; }
}
