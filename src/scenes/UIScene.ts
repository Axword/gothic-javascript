import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { audio } from '../systems/AudioSystem';

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
  private combatModeText!: Phaser.GameObjects.Text;
  private messageTimer: number = 0;
  private inventoryOpen: boolean = false;
  private inventoryContainer!: Phaser.GameObjects.Container;
  private questLogOpen: boolean = false;
  private questContainer!: Phaser.GameObjects.Container;

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
    
    // Combat mode indicator (center-left)
    this.combatModeText = this.add.text(180, 718, '⚔️ Miecz', {
      fontSize: '10px', color: '#ffaa44'
    });
    
    // Gold
    this.goldText = this.add.text(W - 120, 730, 'Złoto: 20', { fontSize: '11px', color: '#ffcc00' });
    
    // Weapon
    this.weaponText = this.add.text(W - 120, 748, 'Broń: brak', { fontSize: '9px', color: '#aaaaaa' });
    
    // Time
    this.timeText = this.add.text(W / 2, 748, '08:00 - Dzień 1', { 
      fontSize: '10px', color: '#aaaaaa' 
    }).setOrigin(0.5);
    
    // Messages
    this.messageText = this.add.text(W / 2, 690, '', {
      fontSize: '12px', color: '#ffffcc', stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);
    
    // Events
    window.addEventListener('game:message', (e: any) => {
      this.showMessage(e.detail);
    });
    window.addEventListener('game:playerHit', (e: any) => {
      this.showMessage(`-${e.detail.damage} HP`, '#ff4444');
    });
    window.addEventListener('game:time', (e: any) => {
      this.timeText.setText(`${e.detail.time} - Dzień ${e.detail.day}`);
    });
    window.addEventListener('game:combatMode', (e: any) => {
      const icons: Record<string, string> = { melee: '⚔️ Miecz', ranged: '🏹 Łuk', magic: '🔮 Magia' };
      this.combatModeText.setText(icons[e.detail.mode] || '⚔️ Miecz');
    });
    window.addEventListener('game:questStarted', (e: any) => {
      this.showMessage(`Nowe zadanie: ${e.detail.title}`, '#44ff44');
    });
    window.addEventListener('game:questCompleted', (e: any) => {
      this.showMessage(`Zadanie ukończone: ${e.detail.title}!`, '#ffcc00');
    });
    
    // Keys
    this.input.keyboard!.on('keydown-I', () => this.toggleInventory());
    this.input.keyboard!.on('keydown-J', () => this.toggleQuestLog());
    this.input.keyboard!.on('keydown-C', () => this.showStats());
  }

  update() {
    if (!this.gameScene || !this.gameScene.player) return;
    
    const player = this.gameScene.player;
    
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    this.hpBar.setScale(hpRatio, 1);
    this.hpText.setText(`HP: ${Math.floor(player.hp)}/${player.maxHp}`);
    
    const manaRatio = Math.max(0, player.mana / player.maxMana);
    this.manaBar.setScale(manaRatio, 1);
    this.manaText.setText(`MP: ${Math.floor(player.mana)}/${player.maxMana}`);
    
    const xpRatio = Math.max(0, player.xp / player.xpToNext);
    this.xpBar.setScale(xpRatio, 1);
    
    this.levelText.setText(`LVL ${player.level}`);
    this.goldText.setText(`Złoto: ${player.gold}`);
    this.weaponText.setText(`Broń: ${player.equippedWeapon || 'brak'}`);
    
    const icons: Record<string, string> = { melee: '⚔️ Miecz', ranged: '🏹 Łuk', magic: '🔮 Magia' };
    this.combatModeText.setText(icons[player.currentCombatMode] || '⚔️ Miecz');
    
    if (this.messageTimer > 0) {
      this.messageTimer -= 16;
      if (this.messageTimer <= 0) this.messageText.setText('');
    }
  }

  private showMessage(msg: string, color: string = '#ffffcc') {
    this.messageText.setText(msg);
    this.messageText.setColor(color);
    this.messageTimer = 3000;
  }

  private toggleInventory() {
    this.inventoryOpen = !this.inventoryOpen;
    if (this.inventoryOpen) this.showInventory();
    else if (this.inventoryContainer) this.inventoryContainer.destroy();
  }

  private showInventory() {
    if (this.inventoryContainer) this.inventoryContainer.destroy();
    
    const cont = this.add.container(512, 384);
    this.inventoryContainer = cont;
    
    const bg = this.add.rectangle(0, 0, 560, 420, 0x1a1a1a, 0.95).setStrokeStyle(2, 0x444444);
    cont.add(bg);
    cont.add(this.add.text(0, -185, 'EKWIPUNEK', { fontSize: '18px', color: '#ffcc00' }).setOrigin(0.5));
    
    // Stat block
    const p = this.gameScene.player;
    cont.add(this.add.text(-250, -160, `Siła:${p.strength} Zręcz:${p.dexterity} Pkt:${p.skillPoints}`, { fontSize: '10px', color: '#aaaaaa' }));
    cont.add(this.add.text(-250, -148, `Umiejętności: ${Object.entries(p.skillRanks).map(([k,v]) => `${k}:${v}`).join(', ') || 'brak'}`, { fontSize: '9px', color: '#888888' }));
    
    // Items (click to equip/use)
    const items = p.inventory;
    if (items.length === 0) {
      cont.add(this.add.text(0, 0, 'Pusto.', { fontSize: '14px', color: '#666666' }).setOrigin(0.5));
    } else {
      items.slice(0, 24).forEach((itemId, i) => {
        const col = i < 12 ? 0 : 1;
        const row = i < 12 ? i : i - 12;
        const x = -240 + col * 260;
        const y = -120 + row * 18;
        const count = p.getItemCount(itemId);
        const isEquipped = p.equippedWeapon === itemId || p.equippedArmor === itemId;
        const itemData = this.gameScene.dataLoader.findById('items_weapons_swords', itemId)
          || this.gameScene.dataLoader.findById('items_weapons_bows', itemId)
          || this.gameScene.dataLoader.findById('items_armors', itemId)
          || this.gameScene.dataLoader.findById('items_potions', itemId)
          || this.gameScene.dataLoader.findById('items_plants', itemId)
          || this.gameScene.dataLoader.findById('items_misc', itemId);
        const name = itemData?.name || itemId;
        const label = this.add.text(x, y, `${isEquipped ? '★ ' : ''}${name}${count > 1 ? ` (${count})` : ''}`, {
          fontSize: '10px', color: isEquipped ? '#ffcc00' : '#cccccc'
        }).setInteractive({ useHandCursor: true });
        label.on('pointerdown', () => this.useItem(itemId));
        cont.add(label);
      });
    }
    
    // Close
    const closeBtn = this.add.text(250, -185, '[X]', { fontSize: '14px', color: '#ff4444' })
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleInventory());
    cont.add(closeBtn);
    
    cont.add(this.add.text(0, 185, 'I-zamknij | C-stats | J-zadania | 1/2/3-tryb', { fontSize: '9px', color: '#666666' }).setOrigin(0.5));
  }

  private toggleQuestLog() {
    this.questLogOpen = !this.questLogOpen;
    if (this.questLogOpen) this.showQuestLog();
    else if (this.questContainer) this.questContainer.destroy();
  }

  private showQuestLog() {
    if (this.questContainer) this.questContainer.destroy();
    
    const cont = this.add.container(512, 384);
    this.questContainer = cont;
    
    const bg = this.add.rectangle(0, 0, 500, 420, 0x0a0a0a, 0.95).setStrokeStyle(2, 0x444444);
    cont.add(bg);
    cont.add(this.add.text(0, -190, 'DZIENNIK ZADAŃ', { fontSize: '18px', color: '#ffcc00' }).setOrigin(0.5));
    
    const quests = this.gameScene.questSystem.getActiveQuests();
    const completed = this.gameScene.questSystem.getCompletedQuests();
    
    let y = -160;
    if (quests.length === 0 && completed.length === 0) {
      cont.add(this.add.text(0, 0, 'Brak zadań.', { fontSize: '14px', color: '#666666' }).setOrigin(0.5));
    } else {
      cont.add(this.add.text(-220, y, '--- AKTYWNE ---', { fontSize: '11px', color: '#44ff44' }));
      y += 18;
      
      for (const q of quests) {
        cont.add(this.add.text(-220, y, `• ${q.quest_id}: etap ${q.current_stage}`, { fontSize: '10px', color: '#cccccc' }));
        y += 16;
      }
      
      y += 10;
      cont.add(this.add.text(-220, y, '--- UKOŃCZONE ---', { fontSize: '11px', color: '#ffcc00' }));
      y += 18;
      
      for (const q of completed) {
        cont.add(this.add.text(-220, y, `✓ ${q.quest_id}`, { fontSize: '10px', color: '#888888' }));
        y += 16;
      }
    }
    
    const closeBtn = this.add.text(220, -190, '[X]', { fontSize: '14px', color: '#ff4444' })
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.toggleQuestLog());
    cont.add(closeBtn);
    
    cont.add(this.add.text(0, 190, 'J-zamknij', { fontSize: '9px', color: '#666666' }).setOrigin(0.5));
  }

  private useItem(itemId: string) {
    const p = this.gameScene.player;
    const dl = this.gameScene.dataLoader;
    const item = dl.findById('items_potions', itemId) || dl.findById('items_plants', itemId)
      || dl.findById('items_weapons_swords', itemId) || dl.findById('items_weapons_bows', itemId)
      || dl.findById('items_armors', itemId);
    if (!item) {
      this.showMessage('Tego przedmiotu nie da się użyć.');
      return;
    }
    // Consumables
    if (item.category === 'potion' || item.category === 'plant') {
      if (item.effect === 'heal') {
        p.heal(item.effect_value || 20);
        p.removeFromInventory(itemId);
        audio.sfxPotion();
        this.showMessage(`+${item.effect_value || 20} HP`);
      } else if (item.effect === 'mana') {
        p.restoreMana(item.effect_value || 20);
        p.removeFromInventory(itemId);
        audio.sfxMana();
        this.showMessage(`+${item.effect_value || 20} MP`);
      } else if (item.effect === 'buff_strength') {
        p.strength += (item.effect_value || 1);
        p.removeFromInventory(itemId);
        audio.sfxPotion();
        this.showMessage(`+${item.effect_value || 1} siły (tymczasowo)`);
      } else {
        this.showMessage(`Efekt: ${item.effect}`);
      }
      this.showInventory(); // refresh
      return;
    }
    // Equipment
    if (item.category === 'weapon_sword' || item.category === 'weapon_bow' || item.category === 'armor') {
      const ok = this.gameScene.equipFromInventory(itemId);
      if (ok) { audio.sfxPickup(); this.showMessage(`Wyposażono: ${item.name || itemId}`, '#44ff44'); this.showInventory(); }
      else audio.sfxError();
      return;
    }
    this.showMessage('Tego przedmiotu nie da się użyć.');
  }

  private showStats() {
    const p = this.gameScene.player;
    this.showMessage(
      `LVL${p.level} | S:${p.strength} Z:${p.dexterity} | HP:${Math.floor(p.hp)}/${p.maxHp} MP:${Math.floor(p.mana)}/${p.maxMana} | ` +
      `Rep: Straż ${p.reputation.old_order || 0} Wolni ${p.reputation.new_order || 0}`
    );
  }
}
