/**
 * Generator proceduralnych assetów graficznych
 * Tworzy wszystkie tekstury, sprite'y i ikony przez Canvas API
 */
export class ProceduralAssets {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll() {
    this.genTiles();
    this.genItemIcons();
    this.genCharacters();
    this.genMonsters();
    this.genUI();
    this.genVFX();
    this.genWorldObjects();
  }

  // ============================================================
  // TILES
  // ============================================================
  private genTiles() {
    this.makeTile('tile_grass', 32, 32, (ctx) => {
      ctx.fillStyle = '#3a5a2a'; ctx.fillRect(0, 0, 32, 32);
      for (let i=0;i<30;i++) this.dot(ctx, Math.random()*32, Math.random()*32, 1, `hsl(${90+Math.random()*20},40%,${15+Math.random()*15}%)`);
    });
    this.makeTile('tile_road', 32, 32, (ctx) => {
      ctx.fillStyle = '#7a6a4a'; ctx.fillRect(0, 0, 32, 32);
      for (let i=0;i<15;i++) this.dot(ctx, Math.random()*32, Math.random()*32, 1, '#8a7a5a');
      for (let i=0;i<5;i++) this.dot(ctx, Math.random()*32, Math.random()*32, 2, '#6a5a3a');
    });
    this.makeTile('tile_water', 32, 32, (ctx) => {
      ctx.fillStyle = '#1a2a4a'; ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#2a4a6a'; ctx.lineWidth = 1;
      for (let i=0;i<4;i++) { ctx.beginPath(); ctx.moveTo(i*12,0); ctx.lineTo(i*12+8,32); ctx.stroke(); }
    });
    this.makeTile('tile_swamp', 32, 32, (ctx) => {
      ctx.fillStyle = '#2a3a1a'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#3a4a1a';
      for (let i=0;i<6;i++) ctx.fillRect(Math.random()*24, Math.random()*24, 4+Math.random()*6, 2);
    });
    this.makeTile('tile_mountain', 32, 32, (ctx) => {
      ctx.fillStyle = '#5a5a5a'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#6a6a6a';
      for (let i=0;i<10;i++) this.dot(ctx, Math.random()*32, Math.random()*32, 2, '#7a7a7a');
    });
    this.makeTile('tile_beach', 32, 32, (ctx) => {
      ctx.fillStyle = '#c4a456'; ctx.fillRect(0, 0, 32, 32);
      for (let i=0;i<20;i++) this.dot(ctx, Math.random()*32, Math.random()*32, 1, '#d4b466');
    });
    this.makeTile('tile_dark', 32, 32, (ctx) => {
      ctx.fillStyle = '#1a1a2a'; ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#2a2a3a';
      for (let i=0;i<8;i++) ctx.fillRect(Math.random()*28, Math.random()*28, 3, 3);
    });
    this.makeTile('tile_wood', 32, 32, (ctx) => {
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#4a2a0a'; ctx.lineWidth = 1;
      for (let i=0;i<4;i++) { ctx.beginPath(); ctx.moveTo(0, i*10); ctx.lineTo(32, i*10); ctx.stroke(); }
    });
    this.makeTile('tile_stone', 32, 32, (ctx) => {
      ctx.fillStyle = '#6a6a6a'; ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1;
      ctx.strokeRect(2, 2, 13, 13); ctx.strokeRect(17, 2, 13, 13);
      ctx.strokeRect(4, 17, 12, 13); ctx.strokeRect(18, 17, 12, 13);
    });
    this.makeTile('tile_roof', 32, 32, (ctx) => {
      ctx.fillStyle = '#6a2a0a'; ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#8a3a1a';
      for (let i=0;i<4;i++) { ctx.beginPath(); ctx.moveTo(0, i*10); ctx.lineTo(32, i*10); ctx.stroke(); }
    });
  }

  // ============================================================
  // ITEM ICONS (32x32)
  // ============================================================
  private genItemIcons() {
    // --- SWORDS (20) ---
    this.makeIcon('sword_rusted_dagger', (ctx) => { ctx.fillStyle='#886644'; this.dagger(ctx, 16,24, '#886644'); this.dot(ctx,8,6,3,'#664422'); });
    this.makeIcon('sword_old_shortsword', (ctx) => { ctx.fillStyle='#999999'; this.sword(ctx,16,24, '#999999', '#666666'); });
    this.makeIcon('sword_iron_longsword', (ctx) => { ctx.fillStyle='#aaaaaa'; this.sword(ctx,16,24, '#aaaaaa', '#555555'); });
    this.makeIcon('sword_steel_blade', (ctx) => { ctx.fillStyle='#cccccc'; this.sword(ctx,16,24, '#cccccc', '#888888'); this.dot(ctx,10,8,2,'#ffff00'); });
    this.makeIcon('sword_obsidian_cleaver', (ctx) => { ctx.fillStyle='#222233'; this.sword(ctx,16,24, '#222233', '#555566'); });
    this.makeIcon('sword_wolfs_fang', (ctx) => { ctx.fillStyle='#888866'; this.sword(ctx,16,24, '#888866', '#555533'); ctx.fillStyle='#ff0000'; ctx.fillRect(14,4,4,3); });
    this.makeIcon('sword_executioner', (ctx) => { ctx.fillStyle='#555555'; this.sword(ctx,16,24, '#555555', '#333333'); ctx.fillStyle='#ff0000'; ctx.fillRect(10,8,12,2); });
    this.makeIcon('sword_hunters_blade', (ctx) => { ctx.fillStyle='#66aa66'; this.sword(ctx,16,24, '#66aa66', '#448844'); });
    this.makeIcon('sword_serrated_gladius', (ctx) => { ctx.fillStyle='#aa8866'; this.sword(ctx,16,24, '#aa8866', '#775544'); for(let i=0;i<4;i++) ctx.fillRect(12+i*2,6+i*3,2,2); });
    this.makeIcon('sword_rusted_machete', (ctx) => { ctx.fillStyle='#885533'; this.sword(ctx,16,24, '#885533', '#553311'); ctx.fillStyle='#aa6633'; ctx.fillRect(8,4,16,3); });
    this.makeIcon('sword_bone_carver', (ctx) => { ctx.fillStyle='#ddccaa'; this.sword(ctx,16,24, '#ddccaa', '#998866'); ctx.fillStyle='#553311'; ctx.fillRect(14,4,4,6); });
    this.makeIcon('sword_mercenary_blade', (ctx) => { ctx.fillStyle='#888899'; this.sword(ctx,16,24, '#888899', '#555566'); ctx.fillStyle='#ff4444'; ctx.fillRect(13,20,6,2); });
    this.makeIcon('sword_ceremonial_sabre', (ctx) => { ctx.fillStyle='#ccccaa'; this.curveSword(ctx,16,24,'#ccccaa','#999977'); this.dot(ctx,8,6,3,'#ffff00'); });
    this.makeIcon('sword_black_iron', (ctx) => { ctx.fillStyle='#111118'; this.sword(ctx,16,24, '#111118', '#333344'); });
    this.makeIcon('sword_fire_steel', (ctx) => { ctx.fillStyle='#cc4422'; this.sword(ctx,16,24, '#cc4422', '#882211'); this.dot(ctx,12,10,4,'#ff8800'); });
    this.makeIcon('sword_frozen_razor', (ctx) => { ctx.fillStyle='#aaccff'; this.sword(ctx,16,24, '#aaccff', '#6699cc'); this.dot(ctx,8,8,3,'#ffffff'); });
    this.makeIcon('sword_rusty_spatha', (ctx) => { ctx.fillStyle='#885544'; this.sword(ctx,16,24, '#885544', '#553322'); });
    this.makeIcon('sword_double_blade', (ctx) => { ctx.fillStyle='#999988'; this.sword(ctx,16,24, '#999988', '#666655'); ctx.fillStyle='#444444'; ctx.fillRect(10,8,12,3); });
    this.makeIcon('sword_brass_short', (ctx) => { ctx.fillStyle='#ccaa44'; this.sword(ctx,16,24, '#ccaa44', '#997722'); });
    this.makeIcon('sword_broken_heirloom', (ctx) => { ctx.fillStyle='#776655'; this.sword(ctx,16,24, '#776655', '#443322'); ctx.fillRect(16,10,3,2); });

    // --- BOWS (10) ---
    this.makeIcon('bow_shortbow', (ctx) => { this.bow(ctx,16,24,'#886644','#664422'); });
    this.makeIcon('bow_hunting_bow', (ctx) => { this.bow(ctx,16,24,'#aa7744','#885522'); });
    this.makeIcon('bow_longbow', (ctx) => { this.bow(ctx,16,28,'#bb8855','#996633'); });
    this.makeIcon('bow_crossbow', (ctx) => { ctx.fillStyle='#666666'; ctx.fillRect(4,18,24,4); ctx.fillRect(8,8,4,16); ctx.fillStyle='#444444'; ctx.fillRect(4,22,24,2); });
    this.makeIcon('bow_recurve', (ctx) => { ctx.strokeStyle='#cc8844'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,20,14,Math.PI*0.3,Math.PI*0.7); ctx.stroke(); ctx.fillStyle='#884422'; ctx.fillRect(12,4,8,4); });
    this.makeIcon('bow_ash_bow', (ctx) => { ctx.strokeStyle='#ddccaa'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(16,20,12,0.2,0.8); ctx.stroke(); });
    this.makeIcon('bow_war_bow', (ctx) => { ctx.strokeStyle='#885533'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(16,22,16,0.1,0.9); ctx.stroke(); ctx.fillStyle='#664422'; ctx.fillRect(10,4,12,4); });
    this.makeIcon('bow_dark_yew', (ctx) => { ctx.strokeStyle='#332211'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,20,13,0.2,0.8); ctx.stroke(); });
    this.makeIcon('bow_composite', (ctx) => { ctx.strokeStyle='#aa8844'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(16,20,14,0.15,0.85); ctx.stroke(); ctx.fillStyle='#886633'; ctx.fillRect(10,4,12,3); });
    this.makeIcon('bow_short_elk', (ctx) => { ctx.strokeStyle='#ccbb88'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,20,11,0.2,0.8); ctx.stroke(); ctx.fillStyle='#aa9955'; ctx.fillRect(11,4,10,2); });

    // --- ARMORS (6) ---
    this.makeIcon('armor_rags', (ctx) => { ctx.fillStyle='#554433'; ctx.fillRect(8,8,16,20); ctx.fillStyle='#443322'; for(let i=0;i<4;i++) ctx.fillRect(10+i*2,10+i*4,6,3); });
    this.makeIcon('armor_leather_vest', (ctx) => { ctx.fillStyle='#664422'; ctx.fillRect(6,6,20,22); ctx.strokeStyle='#553311'; ctx.lineWidth=1; ctx.strokeRect(8,8,16,18); this.dot(ctx,12,12,2,'#444422'); this.dot(ctx,18,16,2,'#444422'); });
    this.makeIcon('armor_guard_chainmail', (ctx) => { ctx.fillStyle='#777788'; ctx.fillRect(6,6,20,22); ctx.strokeStyle='#888899'; ctx.lineWidth=1; for(let i=0;i<5;i++) for(let j=0;j<4;j++) ctx.strokeRect(8+i*4,8+j*5,3,4); });
    this.makeIcon('armor_free_hide', (ctx) => { ctx.fillStyle='#553322'; ctx.fillRect(6,6,20,22); ctx.fillStyle='#664433'; for(let i=0;i<3;i++) ctx.fillRect(10+i*6,8,4,18); ctx.fillStyle='#884422'; ctx.fillRect(6,6,20,4); });
    this.makeIcon('armor_iron_plate', (ctx) => { ctx.fillStyle='#888888'; ctx.fillRect(6,6,20,22); ctx.strokeStyle='#999999'; ctx.lineWidth=2; ctx.strokeRect(6,6,20,22); this.dot(ctx,12,10,3,'#666666'); this.dot(ctx,20,10,3,'#666666'); });
    this.makeIcon('armor_shadow_leather', (ctx) => { ctx.fillStyle='#111122'; ctx.fillRect(6,6,20,22); ctx.fillStyle='#222233'; for(let i=0;i<5;i++) ctx.fillRect(8+i*5,8,2,20); ctx.fillStyle='#444466'; ctx.fillRect(6,6,20,2); });

    // --- PLANTS (10) ---
    this.makeIcon('plant_bloodroot', (ctx) => { ctx.fillStyle='#33aa33'; ctx.fillRect(14,14,4,12); ctx.fillStyle='#cc2222'; for(let i=0;i<3;i++) ctx.fillRect(10+i*6,8,4,6); });
    this.makeIcon('plant_dewleaf', (ctx) => { ctx.fillStyle='#44bb44'; ctx.beginPath(); ctx.ellipse(16,18,8,4,0.3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#88dd88'; ctx.beginPath(); ctx.ellipse(16,14,6,3,-0.3,0,Math.PI*2); ctx.fill(); });
    this.makeIcon('plant_swamp_moss', (ctx) => { ctx.fillStyle='#446633'; ctx.fillRect(8,16,16,6); for(let i=0;i<6;i++) ctx.fillRect(8+i*4,10,3,6); });
    this.makeIcon('plant_ember_flower', (ctx) => { ctx.fillStyle='#336633'; ctx.fillRect(14,16,4,10); ctx.fillStyle='#ff6622'; for(let i=0;i<5;i++) ctx.fillRect(10+i*3,6,3,8); ctx.fillStyle='#ffaa00'; this.dot(ctx,16,10,3,'#ffcc00'); });
    this.makeIcon('plant_frost_grass', (ctx) => { ctx.fillStyle='#88bbdd'; for(let i=0;i<5;i++) ctx.fillRect(8+i*5,8,2,16); ctx.fillStyle='#ffffff'; for(let i=0;i<3;i++) this.dot(ctx,12+i*4,14,2,'#ddeeff'); });
    this.makeIcon('plant_moonweed', (ctx) => { ctx.fillStyle='#336633'; ctx.fillRect(14,16,4,10); ctx.fillStyle='#ccccff'; ctx.beginPath(); ctx.arc(16,8,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(16,8,3,0,Math.PI*2); ctx.fill(); });
    this.makeIcon('plant_beach_vine', (ctx) => { ctx.strokeStyle='#88aa66'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,24); ctx.quadraticCurveTo(12,12,20,20); ctx.quadraticCurveTo(24,16,28,24); ctx.stroke(); for(let i=0;i<3;i++) { this.dot(ctx,8+i*6,16-i*4,3,'#669944'); } });
    this.makeIcon('plant_poison_cap', (ctx) => { ctx.fillStyle='#dddddd'; ctx.fillRect(14,16,4,10); ctx.fillStyle='#aa2222'; ctx.beginPath(); ctx.arc(16,10,8,Math.PI,0); ctx.fill(); this.dot(ctx,12,8,3,'#ffffff'); this.dot(ctx,18,10,2,'#ffffff'); });
    this.makeIcon('plant_grave_moss', (ctx) => { ctx.fillStyle='#445544'; ctx.fillRect(6,12,20,10); ctx.fillStyle='#556655'; for(let i=0;i<6;i++) this.dot(ctx,8+i*4,12,2+i/2,'#667766'); });
    this.makeIcon('plant_firethorn', (ctx) => { ctx.fillStyle='#335533'; ctx.fillRect(14,14,4,12); ctx.fillStyle='#ff4400'; for(let i=0;i<5;i++) this.dot(ctx,10+i*3,8+i*2,2,'#ff6600'); });

    // --- POTIONS (6) ---
    this.makeIcon('potion_healing_small', (ctx) => { this.potion(ctx, '#cc2222', '#ff4444', 0.6); });
    this.makeIcon('potion_healing_medium', (ctx) => { this.potion(ctx, '#cc2222', '#ff4444', 0.8); this.dot(ctx,16,14,3,'#ff8888'); });
    this.makeIcon('potion_healing_large', (ctx) => { this.potion(ctx, '#cc2222', '#ff4444', 1.0); this.dot(ctx,14,12,4,'#ffaaaa'); this.dot(ctx,18,16,3,'#ff8888'); });
    this.makeIcon('potion_mana_small', (ctx) => { this.potion(ctx, '#2244cc', '#4466ff', 0.7); });
    this.makeIcon('potion_stamina', (ctx) => { this.potion(ctx, '#44cc44', '#66ff66', 0.7); });
    this.makeIcon('potion_antidote', (ctx) => { this.potion(ctx, '#cc44cc', '#ff66ff', 0.7); });

    // --- MISC (13) ---
    this.makeIcon('misc_gold', (ctx) => { ctx.fillStyle='#ffcc00'; this.dot(ctx,16,16,8,'#ffdd33'); ctx.fillStyle='#ccaa00'; ctx.beginPath(); ctx.arc(16,16,8,0,Math.PI*2); ctx.stroke(); this.dot(ctx,14,13,2,'#ffee66'); });
    this.makeIcon('misc_arrow', (ctx) => { ctx.fillStyle='#886644'; ctx.fillRect(4,14,20,4); ctx.fillStyle='#aa8866'; ctx.fillRect(8,10,12,12); ctx.fillStyle='#444444'; ctx.beginPath(); ctx.moveTo(24,14); ctx.lineTo(30,16); ctx.lineTo(24,18); ctx.closePath(); ctx.fill(); });
    this.makeIcon('misc_lockpick_iron', (ctx) => { ctx.fillStyle='#888888'; ctx.fillRect(8,6,4,20); ctx.fillRect(10,20,8,4); ctx.fillRect(6,4,8,3); });
    this.makeIcon('misc_lockpick_steel', (ctx) => { ctx.fillStyle='#aaaaaa'; ctx.fillRect(8,6,4,20); ctx.fillRect(10,20,8,4); ctx.fillRect(6,4,8,3); ctx.strokeStyle='#cccccc'; ctx.lineWidth=1; ctx.strokeRect(7,5,6,2); });
    this.makeIcon('misc_lockpick_master', (ctx) => { ctx.fillStyle='#ccccaa'; ctx.fillRect(8,6,4,20); ctx.fillRect(10,20,8,4); ctx.fillRect(6,4,8,3); ctx.fillStyle='#ffcc00'; this.dot(ctx,10,8,2,'#ffcc00'); });
    this.makeIcon('misc_key_guard_tower', (ctx) => { ctx.fillStyle='#aa8844'; this.dot(ctx,16,22,6,'#bb9955'); ctx.fillRect(14,8,4,14); ctx.beginPath(); ctx.arc(16,8,4,0,Math.PI*2); ctx.stroke(); });
    this.makeIcon('misc_key_free_cache', (ctx) => { ctx.fillStyle='#ccaa66'; this.dot(ctx,16,22,5,'#ddbb77'); ctx.fillRect(14,8,4,14); ctx.beginPath(); ctx.arc(16,8,3,0,Math.PI*2); ctx.stroke(); });
    this.makeIcon('misc_quest_letter', (ctx) => { ctx.fillStyle='#ddccaa'; ctx.fillRect(6,6,20,24); ctx.strokeStyle='#998877'; ctx.lineWidth=1; ctx.strokeRect(6,6,20,24); ctx.fillStyle='#998877'; ctx.fillRect(10,12,12,2); ctx.fillRect(10,16,16,1); ctx.fillRect(10,18,14,1); ctx.fillStyle='#cc2222'; this.dot(ctx,22,10,2,'#cc2222'); });
    this.makeIcon('misc_quest_artifact', (ctx) => { ctx.fillStyle='#886688'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#aa88aa'; ctx.beginPath(); ctx.arc(16,16,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffaa00'; this.dot(ctx,16,16,3,'#ffcc00'); });
    this.makeIcon('misc_quest_herb_packet', (ctx) => { ctx.fillStyle='#556644'; ctx.fillRect(8,8,16,18); ctx.fillStyle='#334422'; ctx.fillRect(10,6,12,4); ctx.fillStyle='#778866'; for(let i=0;i<3;i++) ctx.fillRect(10+i*4,10,3,12); });
    this.makeIcon('misc_skins_wolf', (ctx) => { ctx.fillStyle='#776655'; ctx.beginPath(); ctx.moveTo(8,24); ctx.quadraticCurveTo(4,16,10,8); ctx.quadraticCurveTo(16,4,22,8); ctx.quadraticCurveTo(28,16,24,24); ctx.closePath(); ctx.fill(); ctx.fillStyle='#887766'; ctx.beginPath(); ctx.moveTo(12,24); ctx.quadraticCurveTo(16,12,20,24); ctx.closePath(); ctx.fillStyle='#997766'; ctx.fill(); });
    this.makeIcon('misc_skins_boar', (ctx) => { ctx.fillStyle='#664422'; ctx.fillRect(6,8,20,18); ctx.fillStyle='#775533'; for(let i=0;i<5;i++) ctx.fillRect(8+i*4,10,2,14); ctx.fillStyle='#885544'; ctx.fillRect(6,8,20,4); });
    this.makeIcon('misc_trophy_mutant_eye', (ctx) => { ctx.fillStyle='#886644'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ff4400'; ctx.beginPath(); ctx.arc(16,16,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.arc(16,16,3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000000'; this.dot(ctx,16,16,1,'#000000'); });
    this.makeIcon('misc_trophy_wyrm_scale', (ctx) => { ctx.fillStyle='#887755'; ctx.beginPath(); ctx.moveTo(8,24); ctx.lineTo(4,12); ctx.lineTo(10,6); ctx.lineTo(16,4); ctx.lineTo(22,6); ctx.lineTo(28,12); ctx.lineTo(24,24); ctx.closePath(); ctx.fill(); ctx.fillStyle='#999866'; ctx.beginPath(); ctx.moveTo(12,20); ctx.lineTo(10,12); ctx.lineTo(16,8); ctx.lineTo(22,12); ctx.lineTo(20,20); ctx.closePath(); ctx.fill(); });
    this.makeIcon('misc_quest_medallion', (ctx) => { ctx.fillStyle='#cccc99'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#aa9944'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#aa8844'; ctx.beginPath(); ctx.arc(16,16,6,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='#664422'; ctx.fillRect(14,4,4,6); });
  }

  // ============================================================
  // CHARACTER SPRITES (32x48, 4 directions)
  // ============================================================
  private genCharacters() {
    // Player - brown clothes
    this.genCharacter('char_player', '#6b4423', '#d4a574', '#4444aa');
    
    // Old Order guards
    this.genCharacter('char_old_guard', '#4444aa', '#c4956a', '#6666cc');
    this.genCharacter('char_old_guard_f', '#4444aa', '#d4a574', '#6666cc');
    
    // Old Order commander
    this.genCharacter('char_old_commander', '#3333aa', '#c4956a', '#8888cc', true);
    
    // New Order fighters
    this.genCharacter('char_new_fighter', '#aa4444', '#c4956a', '#cc6666');
    this.genCharacter('char_new_fighter_f', '#aa4444', '#d4a574', '#cc6666');
    
    // New Order leader
    this.genCharacter('char_new_leader', '#882222', '#c4956a', '#cc4444', true);
    
    // Neutral
    this.genCharacter('char_neutral', '#776655', '#c4956a', '#998877');
    this.genCharacter('char_neutral_f', '#776655', '#d4a574', '#998877');
    
    // Bandit
    this.genCharacter('char_bandit', '#554422', '#c4956a', '#886644');
    
    // Merchant
    this.genCharacter('char_merchant', '#446644', '#c4956a', '#558855');
    
    // Female neutral
    this.genCharacter('char_female', '#664466', '#d4a574', '#885588');
  }

  private genCharacter(key: string, bodyColor: string, skinColor: string, accentColor: string, crowned: boolean = false) {
    // Generate 4-direction character: down, left, right, up
    const w = 32, h = 48;
    const canvas = this.scene.textures.createCanvas(key, w * 4, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;

    for (let dir = 0; dir < 4; dir++) {
      const ox = dir * w;
      
      // Legs
      ctx.fillStyle = bodyColor;
      ctx.fillRect(ox + 10, 28, 5, 12);
      ctx.fillRect(ox + 17, 28, 5, 12);
      
      // Feet
      ctx.fillStyle = '#332211';
      ctx.fillRect(ox + 9, 38, 6, 4);
      ctx.fillRect(ox + 17, 38, 6, 4);
      
      // Body/torso
      ctx.fillStyle = bodyColor;
      ctx.fillRect(ox + 8, 14, 16, 18);
      
      // Belt
      ctx.fillStyle = '#443322';
      ctx.fillRect(ox + 8, 26, 16, 3);
      
      // Arms
      ctx.fillStyle = skinColor;
      if (dir === 0 || dir === 2) { // front/back
        ctx.fillRect(ox + 6, 16, 4, 12);
        ctx.fillRect(ox + 22, 16, 4, 12);
      } else {
        ctx.fillRect(ox + 6, 16, 4, 12);
        ctx.fillRect(ox + 22, 16, 4, 12);
      }
      
      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(ox + 10, 4, 12, 12);
      
      // Hair
      ctx.fillStyle = '#443322';
      ctx.fillRect(ox + 9, 3, 14, 5);
      
      // Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(ox + 12, 9, 2, 2);
      ctx.fillRect(ox + 18, 9, 2, 2);
      
      // Weapon on side
      ctx.fillStyle = accentColor;
      ctx.fillRect(ox + 24, 18, 3, 14);
      
      // Crown/helmet for leaders
      if (crowned) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(ox + 9, 1, 14, 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(ox + 14, 0, 4, 4);
      }
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(ox + 8, 42, 16, 4);
    }
    canvas.refresh();
  }

  // ============================================================
  // MONSTERS (48x48)
  // ============================================================
  private genMonsters() {
    // Grey Wolf - 48x48
    this.makeCreature('monster_grey_wolf', 48, 48, (ctx) => {
      ctx.fillStyle = '#777777';
      ctx.beginPath(); ctx.ellipse(24,30,16,12,0,0,Math.PI*2); ctx.fill(); // body
      ctx.beginPath(); ctx.ellipse(18,16,10,8,0,0,Math.PI*2); ctx.fill(); // head
      ctx.fillStyle = '#666666';
      ctx.beginPath(); ctx.ellipse(24,34,10,6,0,0,Math.PI*2); ctx.fill(); // belly
      // ears
      ctx.fillRect(14,6,4,8); ctx.fillRect(26,6,4,8);
      // eyes
      ctx.fillStyle = '#ffaa00'; this.dotCtx(ctx,16,14,3); this.dotCtx(ctx,22,14,3);
      ctx.fillStyle = '#000000'; this.dotCtx(ctx,16,14,1); this.dotCtx(ctx,22,14,1);
      // legs
      ctx.fillStyle = '#666666'; ctx.fillRect(14,36,5,10); ctx.fillRect(22,36,5,10); ctx.fillRect(30,36,5,10);
      // tail
      ctx.fillStyle = '#777777'; ctx.beginPath(); ctx.arc(38,26,6,0,Math.PI*2); ctx.fill();
    });
    
    // Forest Boar - 56x56
    this.makeCreature('monster_forest_boar', 56, 56, (ctx) => {
      ctx.fillStyle = '#553322';
      ctx.beginPath(); ctx.ellipse(28,34,20,14,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#664433';
      ctx.beginPath(); ctx.ellipse(28,38,16,8,0,0,Math.PI*2); ctx.fill();
      // head
      ctx.fillStyle = '#553322'; ctx.beginPath(); ctx.ellipse(14,30,8,8,0,0,Math.PI*2); ctx.fill();
      // tusks
      ctx.fillStyle = '#ddccaa'; ctx.fillRect(6,32,6,3); ctx.fillRect(8,34,6,2);
      // eyes
      ctx.fillStyle = '#000000'; this.dotCtx(ctx,12,28,2); this.dotCtx(ctx,18,28,2);
      // legs
      ctx.fillStyle = '#443322'; ctx.fillRect(16,44,6,10); ctx.fillRect(24,44,6,10); ctx.fillRect(34,44,6,10);
    });
    
    // Marsh Crawler - 48x48
    this.makeCreature('monster_marsh_crawler', 48, 48, (ctx) => {
      ctx.fillStyle = '#3a4a2a';
      ctx.beginPath(); ctx.ellipse(24,28,14,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2a3a1a';
      ctx.beginPath(); ctx.ellipse(24,30,12,6,0,0,Math.PI*2); ctx.fill();
      // tentacles
      ctx.fillStyle = '#4a5a3a'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(10,24); ctx.quadraticCurveTo(4,16,8,8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14,22); ctx.quadraticCurveTo(8,14,12,6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38,24); ctx.quadraticCurveTo(44,16,40,8); ctx.stroke();
      // eyes
      ctx.fillStyle = '#ff6600'; this.dotCtx(ctx,18,24,3); this.dotCtx(ctx,30,24,3);
      ctx.fillStyle = '#000000'; this.dotCtx(ctx,18,24,1); this.dotCtx(ctx,30,24,1);
    });
    
    // Mutant - 56x56
    this.makeCreature('monster_mutant', 56, 56, (ctx) => {
      ctx.fillStyle = '#662211';
      ctx.beginPath(); ctx.ellipse(28,30,18,14,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#883322';
      ctx.beginPath(); ctx.ellipse(28,34,14,8,0,0,Math.PI*2); ctx.fill();
      // head
      ctx.fillStyle = '#662211'; ctx.beginPath(); ctx.ellipse(28,14,12,10,0,0,Math.PI*2); ctx.fill();
      // spikes
      ctx.fillStyle = '#aa4422';
      ctx.fillRect(8,18,4,8); ctx.fillRect(16,12,4,6); ctx.fillRect(36,12,4,6); ctx.fillRect(44,18,4,8);
      // eyes
      ctx.fillStyle = '#ff0000'; this.dotCtx(ctx,24,14,4); this.dotCtx(ctx,34,14,4);
      ctx.fillStyle = '#ff6600'; this.dotCtx(ctx,24,14,2); this.dotCtx(ctx,34,14,2);
      // arms
      ctx.fillStyle = '#662211'; ctx.fillRect(8,26,6,12); ctx.fillRect(42,26,6,12);
    });
    
    // Sand Wyrm - 64x48
    this.makeCreature('monster_sand_wyrm', 64, 48, (ctx) => {
      ctx.fillStyle = '#665544';
      ctx.beginPath(); ctx.ellipse(32,28,24,14,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#554433';
      // scales
      for(let i=0;i<5;i++) for(let j=0;j<3;j++) this.dotCtx(ctx,12+i*10,20+j*8,3,'#776655');
      // head
      ctx.fillStyle = '#665544'; ctx.beginPath(); ctx.ellipse(32,14,16,10,0,0,Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = '#ffcc00'; this.dotCtx(ctx,26,14,4); this.dotCtx(ctx,38,14,4);
      ctx.fillStyle = '#000000'; this.dotCtx(ctx,26,14,2); this.dotCtx(ctx,38,14,2);
      // tail
      ctx.fillStyle = '#665544'; ctx.beginPath(); ctx.ellipse(58,32,8,4,0,0,Math.PI*2); ctx.fill();
    });
    
    // Shade - 48x56
    this.makeCreature('monster_shade', 48, 56, (ctx) => {
      ctx.fillStyle = 'rgba(30,30,60,0.7)';
      ctx.beginPath(); ctx.ellipse(24,34,16,20,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(40,40,80,0.5)';
      ctx.beginPath(); ctx.ellipse(24,38,12,14,0,0,Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = '#88ccff'; this.dotCtx(ctx,20,30,4); this.dotCtx(ctx,28,30,4);
      ctx.fillStyle = '#ffffff'; this.dotCtx(ctx,20,30,2); this.dotCtx(ctx,28,30,2);
      // wisps
      ctx.fillStyle = 'rgba(40,40,80,0.3)';
      ctx.beginPath(); ctx.ellipse(18,14,6,8,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(30,12,5,7,0,0,Math.PI*2); ctx.fill();
    });
  }

  // ============================================================
  // UI ELEMENTS
  // ============================================================
  private genUI() {
    this.makeTile('ui_button', 32, 16, (ctx) => {
      ctx.fillStyle = '#333333'; ctx.fillRect(0,0,32,16);
      ctx.strokeStyle = '#666666'; ctx.strokeRect(1,1,30,14);
      ctx.fillStyle = '#444444'; ctx.fillRect(2,2,28,12);
    });
    this.makeTile('ui_button_hover', 32, 16, (ctx) => {
      ctx.fillStyle = '#444444'; ctx.fillRect(0,0,32,16);
      ctx.strokeStyle = '#888888'; ctx.strokeRect(1,1,30,14);
      ctx.fillStyle = '#555555'; ctx.fillRect(2,2,28,12);
    });
    this.makeTile('ui_panel', 64, 64, (ctx) => {
      ctx.fillStyle = 'rgba(20,20,20,0.9)'; ctx.fillRect(0,0,64,64);
      ctx.strokeStyle = '#444444'; ctx.strokeRect(1,1,62,62);
    });
  }

  // ============================================================
  // VFX (32x32)
  // ============================================================
  private genVFX() {
    // Fire bolt projectile
    this.makeTile('vfx_fire_bolt', 16, 16, (ctx) => {
      ctx.fillStyle = '#ff6600'; ctx.beginPath(); ctx.arc(8,8,6,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffaa00'; ctx.beginPath(); ctx.arc(8,8,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(8,8,2,0,Math.PI*2); ctx.fill();
    });
    this.makeTile('vfx_ice_shard', 16, 16, (ctx) => {
      ctx.fillStyle = '#88ccff'; ctx.beginPath(); ctx.moveTo(8,2); ctx.lineTo(14,14); ctx.lineTo(2,14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#bbddff'; ctx.beginPath(); ctx.moveTo(8,4); ctx.lineTo(12,13); ctx.lineTo(4,13); ctx.closePath(); ctx.fill();
    });
    this.makeTile('vfx_fire_explosion', 32, 32, (ctx) => {
      for(let i=0;i<8;i++) { ctx.fillStyle = ['#ff4400','#ff6600','#ff8800','#ffaa00'][i%4]; this.dotCtx(ctx,16+Math.cos(i)*8-4,16+Math.sin(i)*8-4,4); }
    });
    this.makeTile('vfx_hit_spark', 16, 16, (ctx) => {
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(8,8,3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(8,8,2,0,Math.PI*2); ctx.fill();
    });
  }

  // ============================================================
  // WORLD OBJECTS
  // ============================================================
  private genWorldObjects() {
    // Tree
    this.makeTile('tree', 48, 64, (ctx) => {
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(20,32,8,28);
      ctx.fillStyle = '#2a5a2a';
      ctx.beginPath(); ctx.arc(24,24,18,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a6a3a';
      ctx.beginPath(); ctx.arc(18,20,12,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(30,22,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a7a4a';
      ctx.beginPath(); ctx.arc(24,18,10,0,Math.PI*2); ctx.fill();
    });
    
    // Rock
    this.makeTile('rock', 32, 24, (ctx) => {
      ctx.fillStyle = '#666666'; ctx.beginPath(); ctx.ellipse(16,16,14,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#777777'; ctx.beginPath(); ctx.ellipse(12,14,8,6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#555555'; ctx.beginPath(); ctx.ellipse(20,18,6,4,0,0,Math.PI*2); ctx.fill();
    });
    
    // Chest (closed)
    this.makeTile('chest_closed', 32, 24, (ctx) => {
      ctx.fillStyle = '#664422'; ctx.fillRect(4,8,24,14);
      ctx.strokeStyle = '#553311'; ctx.lineWidth=1; ctx.strokeRect(4,8,24,14);
      ctx.fillStyle = '#885533'; ctx.fillRect(4,8,24,4);
      ctx.fillStyle = '#ffcc00'; this.dotCtx(ctx,16,16,2);
    });
    
    // Chest (open)
    this.makeTile('chest_open', 32, 24, (ctx) => {
      ctx.fillStyle = '#664422'; ctx.fillRect(4,14,24,8);
      ctx.fillStyle = '#885533'; ctx.fillRect(4,6,24,4);
      ctx.strokeStyle = '#553311'; ctx.lineWidth=1; ctx.strokeRect(4,6,24,4);
      ctx.fillStyle = '#ffcc00'; this.dotCtx(ctx,16,18,2);
    });
  }

  // ============================================================
  // HELPERS
  // ============================================================
  private makeTile(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = this.scene.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;
    draw(ctx);
    canvas.refresh();
  }

  private makeIcon(key: string, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = this.scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, 32, 32);
    draw(ctx);
    canvas.refresh();
  }

  private sword(ctx: CanvasRenderingContext2D, cx: number, cy: number, blade: string, guard: string) {
    // Blade
    ctx.fillStyle = blade;
    ctx.fillRect(cx - 2, cy - 20, 4, 22);
    // Guard
    ctx.fillStyle = guard;
    ctx.fillRect(cx - 6, cy + 2, 12, 3);
    // Handle
    ctx.fillStyle = '#443322';
    ctx.fillRect(cx - 1, cy + 5, 2, 6);
    // Pommel
    this.dotCtx(ctx, cx, cy + 12, 3, guard);
  }

  private curveSword(ctx: CanvasRenderingContext2D, cx: number, cy: number, blade: string, guard: string) {
    ctx.strokeStyle = blade; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.quadraticCurveTo(cx+6, cy-6, cx+2, cy-18); ctx.stroke();
    ctx.fillStyle = guard; ctx.fillRect(cx - 4, cy + 2, 10, 3);
    ctx.fillStyle = '#443322'; ctx.fillRect(cx, cy + 5, 2, 5);
  }

  private dagger(ctx: CanvasRenderingContext2D, cx: number, cy: number, blade: string) {
    ctx.fillStyle = blade;
    ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx + 4, cy + 2); ctx.lineTo(cx - 4, cy + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#443322'; ctx.fillRect(cx - 1, cy + 2, 2, 5);
  }

  private bow(ctx: CanvasRenderingContext2D, cx: number, cy: number, wood: string, grip: string) {
    ctx.strokeStyle = wood; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy + 6, 14, 0.15, Math.PI - 0.15); ctx.stroke();
    ctx.fillStyle = grip; ctx.fillRect(cx - 2, cy - 2, 4, 8);
    // String
    ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy - 8); ctx.stroke();
  }

  private potion(ctx: CanvasRenderingContext2D, bottle: string, liquid: string, fill: number) {
    ctx.fillStyle = bottle;
    ctx.fillRect(10, 8, 12, 18); // body
    ctx.fillRect(12, 4, 8, 6); // neck
    ctx.fillStyle = '#888888'; ctx.fillRect(12, 3, 8, 3); // cork
    // Liquid
    ctx.fillStyle = liquid;
    const h = 14 * fill;
    ctx.fillRect(11, 24 - h, 10, h);
  }

  private dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private dotCtx(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color?: string) {
    if (color) ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  private makeCreature(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = this.scene.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    draw(ctx);
    canvas.refresh();
  }
}
