/**
 * Generator proceduralnych assetów graficznych.
 * Generuje większe, mroczniejsze, bardziej szczegółowe sprite'y.
 * Ludzie: 32x56, drzewa/skały/obiekty większe, biomy zróżnicowane.
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
  // TILES (32x32) - zróżnicowane biomy
  // ============================================================
  private genTiles() {
    // Trawa (las/lasy) - ciemna zieleń
    this.makeTile('tile_grass', 32, 32, (ctx) => {
      ctx.fillStyle = '#253c1a'; ctx.fillRect(0, 0, 32, 32);
      for (let i=0;i<40;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, `rgb(${20+Math.random()*30},${50+Math.random()*30},${20+Math.random()*20})`);
      for (let i=0;i<8;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1.5, '#3a5a25');
    });
    // Trakt (droga) - błotnisto-kamienny brąz
    this.makeTile('tile_road', 32, 32, (ctx) => {
      ctx.fillStyle = '#4a3a28'; ctx.fillRect(0, 0, 32, 32);
      for (let i=0;i<20;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#6a553a');
      for (let i=0;i<10;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1.5, '#3a2a18');
      for (let i=0;i<5;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 2, '#2a1a08');
      // Koleiny
      ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(8, 32); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(24, 32); ctx.stroke();
    });
    // Woda (rzeka/plaża?) - nie używane ale dostępne
    this.makeTile('tile_water', 32, 32, (ctx) => {
      ctx.fillStyle = '#15283d'; ctx.fillRect(0,0,32,32);
      ctx.strokeStyle = '#2a4a6a'; ctx.lineWidth = 1;
      for (let i=0;i<5;i++) { ctx.beginPath(); ctx.moveTo(0, i*7); ctx.quadraticCurveTo(16, i*7+2, 32, i*7); ctx.stroke(); }
    });
    // Bagno
    this.makeTile('tile_swamp', 32, 32, (ctx) => {
      ctx.fillStyle = '#1e2a14'; ctx.fillRect(0,0,32,32);
      for (let i=0;i<15;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 2, '#2e3a1e');
      for (let i=0;i<6;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 2.5, '#0e1a04');
      ctx.fillStyle = '#243018';
      for (let i=0;i<4;i++) { const x=Math.random()*28,y=Math.random()*28; ctx.fillRect(x,y,5,2); }
    });
    // Góry/skały
    this.makeTile('tile_mountain', 32, 32, (ctx) => {
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(0,0,32,32);
      for (let i=0;i<25;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1.5, '#555555');
      for (let i=0;i<8;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 2, '#6a6a6a');
      for (let i=0;i<5;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#222222');
    });
    // Plaża
    this.makeTile('tile_beach', 32, 32, (ctx) => {
      ctx.fillStyle = '#8a7040'; ctx.fillRect(0,0,32,32);
      for (let i=0;i<30;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#a88a50');
      for (let i=0;i<8;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#6a5028');
    });
    // Ciemna ziemia (Cmentarzysko/ Szczelina)
    this.makeTile('tile_dark', 32, 32, (ctx) => {
      ctx.fillStyle = '#121018'; ctx.fillRect(0,0,32,32);
      for (let i=0;i<20;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#24202c');
      for (let i=0;i<4;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 2, '#0a0810');
    });
    // Las (ciemniejsza trawa z gęstszą roślinnością)
    this.makeTile('tile_forest', 32, 32, (ctx) => {
      ctx.fillStyle = '#1a2e12'; ctx.fillRect(0,0,32,32);
      for (let i=0;i<50;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, `rgb(${10+Math.random()*20},${35+Math.random()*25},${10+Math.random()*15})`);
      for (let i=0;i<8;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1.5, '#2a4a1a');
    });
    // Drewno
    this.makeTile('tile_wood', 32, 32, (ctx) => {
      ctx.fillStyle = '#3a2410'; ctx.fillRect(0,0,32,32);
      ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 1;
      for (let i=0;i<5;i++) { ctx.beginPath(); ctx.moveTo(0, i*7); ctx.lineTo(32, i*7); ctx.stroke(); }
      for (let i=0;i<8;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#4a3020');
    });
    // Kamień (mury)
    this.makeTile('tile_stone', 32, 32, (ctx) => {
      ctx.fillStyle = '#4a4a4a'; ctx.fillRect(0,0,32,32);
      ctx.strokeStyle = '#333333'; ctx.lineWidth = 1;
      ctx.strokeRect(1,1,14,10); ctx.strokeRect(17,1,14,10);
      ctx.strokeRect(1,13,10,10); ctx.strokeRect(13,13,8,10); ctx.strokeRect(23,13,8,10);
      ctx.strokeRect(1,25,18,6); ctx.strokeRect(21,25,10,6);
      for (let i=0;i<15;i++) this.dotCtx(ctx, Math.random()*32, Math.random()*32, 1, '#6a6a6a');
    });
    // Dach
    this.makeTile('tile_roof', 32, 32, (ctx) => {
      ctx.fillStyle = '#3a1810'; ctx.fillRect(0,0,32,32);
      ctx.strokeStyle = '#5a2810'; ctx.lineWidth = 2;
      for (let i=0;i<6;i++) { ctx.beginPath(); ctx.moveTo(0, i*6); ctx.lineTo(32, i*6); ctx.stroke(); }
    });
    // Podłoga wnętrz
    this.makeTile('tile_floor', 32, 32, (ctx) => {
      ctx.fillStyle = '#2a1e14'; ctx.fillRect(0,0,32,32);
      ctx.strokeStyle = '#1a0e04'; ctx.lineWidth = 1;
      for (let i=0;i<4;i++) for (let j=0;j<4;j++) ctx.strokeRect(i*8, j*8, 8, 8);
    });
  }

  // ============================================================
  // ITEM ICONS (32x32) - ciemniejsze, bardziej czytelne
  // ============================================================
  private genItemIcons() {
    // SWORDS (20) - większe, ciemniejsze
    this.makeIcon('sword_rusted_dagger', (ctx) => { this.dagger(ctx,16,26,'#6a4a28','#4a2a18'); });
    this.makeIcon('sword_old_shortsword', (ctx) => { this.sword(ctx,16,26,'#7a7a7a','#5a5a5a','#3a2818'); });
    this.makeIcon('sword_iron_longsword', (ctx) => { this.sword(ctx,16,26,'#9a9a9a','#7a7a7a','#3a2818'); });
    this.makeIcon('sword_steel_blade', (ctx) => { this.sword(ctx,16,26,'#bcbcbc','#9a9a9a','#3a2818'); this.dotCtx(ctx,16,4,2,'#ffdd00'); });
    this.makeIcon('sword_obsidian_cleaver', (ctx) => { this.sword(ctx,16,26,'#151018','#353040','#1a0808'); });
    this.makeIcon('sword_wolfs_fang', (ctx) => { this.sword(ctx,16,26,'#aaa080','#706040','#3a2818'); this.dotCtx(ctx,14,4,3,'#aa0000'); });
    this.makeIcon('sword_executioner', (ctx) => { this.sword(ctx,16,26,'#404040','#202020','#2a1810'); ctx.fillStyle='#aa0000'; ctx.fillRect(8,6,16,2); });
    this.makeIcon('sword_hunters_blade', (ctx) => { this.curveSword(ctx,16,26,'#4a8040','#2a5020','#3a2818'); });
    this.makeIcon('sword_serrated_gladius', (ctx) => { this.sword(ctx,16,26,'#806040','#503820','#3a2818'); for(let i=0;i<4;i++) ctx.fillRect(10+i*2,2+i*3,2,2); });
    this.makeIcon('sword_rusted_machete', (ctx) => { this.sword(ctx,16,26,'#7a4020','#4a2010','#3a2818'); ctx.fillStyle='#a06030'; ctx.fillRect(6,2,20,3); });
    this.makeIcon('sword_bone_carver', (ctx) => { this.sword(ctx,16,26,'#ccbba0','#908060','#3a2010'); ctx.fillStyle='#3a1800'; ctx.fillRect(14,2,4,6); });
    this.makeIcon('sword_mercenary_blade', (ctx) => { this.sword(ctx,16,26,'#707080','#505060','#2a1818'); ctx.fillStyle='#cc0000'; ctx.fillRect(13,22,6,2); });
    this.makeIcon('sword_ceremonial_sabre', (ctx) => { this.curveSword(ctx,16,26,'#bcb080','#908060','#4a3810'); this.dotCtx(ctx,8,4,3,'#ffdd00'); });
    this.makeIcon('sword_black_iron', (ctx) => { this.sword(ctx,16,26,'#0a0a18','#2a2a38','#1a1018'); });
    this.makeIcon('sword_fire_steel', (ctx) => { this.sword(ctx,16,26,'#a03010','#701000','#2a1008'); this.dotCtx(ctx,12,8,4,'#ff6000'); });
    this.makeIcon('sword_frozen_razor', (ctx) => { this.sword(ctx,16,26,'#90b0d0','#5080b0','#2a3848'); this.dotCtx(ctx,8,8,3,'#ffffff'); });
    this.makeIcon('sword_rusty_spatha', (ctx) => { this.sword(ctx,16,26,'#7a5540','#4a3020','#3a2018'); });
    this.makeIcon('sword_double_blade', (ctx) => { this.sword(ctx,16,26,'#808070','#505040','#2a2018'); ctx.fillStyle='#303030'; ctx.fillRect(8,6,16,3); });
    this.makeIcon('sword_brass_short', (ctx) => { this.sword(ctx,16,26,'#a08830','#705810','#4a3810'); });
    this.makeIcon('sword_broken_heirloom', (ctx) => { this.sword(ctx,16,26,'#605040','#403020','#3a2818'); ctx.fillRect(18,8,3,2); });

    // BOWS (10)
    this.makeIcon('bow_shortbow', (ctx) => { this.bow(ctx,16,18,'#6a4020','#3a2010'); });
    this.makeIcon('bow_longbow', (ctx) => { ctx.strokeStyle='#7a4820'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,22,16,0.1,0.9); ctx.stroke(); ctx.fillStyle='#4a2810'; ctx.fillRect(12,2,8,5); });
    this.makeIcon('bow_hunter', (ctx) => { this.bow(ctx,16,18,'#5a3a18','#302008'); });
    this.makeIcon('bow_elm', (ctx) => { this.bow(ctx,16,18,'#806030','#403018'); ctx.strokeStyle='#303020'; });
    this.makeIcon('bow_recurve', (ctx) => { ctx.strokeStyle='#906020'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,20,14,Math.PI*0.3,Math.PI*0.7); ctx.stroke(); ctx.fillStyle='#604020'; ctx.fillRect(12,4,8,4); });
    this.makeIcon('bow_ash_bow', (ctx) => { ctx.strokeStyle='#c0a870'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(16,20,12,0.2,0.8); ctx.stroke(); });
    this.makeIcon('bow_war_bow', (ctx) => { ctx.strokeStyle='#604020'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(16,22,16,0.1,0.9); ctx.stroke(); ctx.fillStyle='#402810'; ctx.fillRect(10,2,12,4); });
    this.makeIcon('bow_dark_yew', (ctx) => { ctx.strokeStyle='#201810'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,20,13,0.2,0.8); ctx.stroke(); });
    this.makeIcon('bow_composite', (ctx) => { ctx.strokeStyle='#806020'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(16,20,14,0.15,0.85); ctx.stroke(); ctx.fillStyle='#604020'; ctx.fillRect(10,4,12,3); });
    this.makeIcon('bow_short_elk', (ctx) => { ctx.strokeStyle='#b0a060'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(16,20,11,0.2,0.8); ctx.stroke(); ctx.fillStyle='#806030'; ctx.fillRect(11,4,10,2); });

    // ARMORS (6)
    this.makeIcon('armor_rags', (ctx) => { ctx.fillStyle='#3a2818'; ctx.fillRect(8,8,16,20); ctx.fillStyle='#2a1810'; for(let i=0;i<4;i++) ctx.fillRect(10+i*2,10+i*4,6,3); });
    this.makeIcon('armor_leather_vest', (ctx) => { ctx.fillStyle='#4a3018'; ctx.fillRect(6,6,20,22); ctx.strokeStyle='#301808'; ctx.lineWidth=1; ctx.strokeRect(8,8,16,18); this.dotCtx(ctx,12,12,2,'#2a1810'); this.dotCtx(ctx,20,16,2,'#2a1810'); });
    this.makeIcon('armor_guard_chainmail', (ctx) => { ctx.fillStyle='#505870'; ctx.fillRect(6,6,20,22); ctx.strokeStyle='#707890'; ctx.lineWidth=1; for(let i=0;i<5;i++) for(let j=0;j<4;j++) ctx.strokeRect(8+i*3,8+j*5,2,3); });
    this.makeIcon('armor_free_hide', (ctx) => { ctx.fillStyle='#3a2010'; ctx.fillRect(6,6,20,22); ctx.fillStyle='#4a3020'; for(let i=0;i<3;i++) ctx.fillRect(10+i*6,8,4,18); ctx.fillStyle='#704020'; ctx.fillRect(6,6,20,4); });
    this.makeIcon('armor_iron_plate', (ctx) => { ctx.fillStyle='#606068'; ctx.fillRect(6,6,20,22); ctx.strokeStyle='#909098'; ctx.lineWidth=2; ctx.strokeRect(6,6,20,22); this.dotCtx(ctx,12,10,3,'#303038'); this.dotCtx(ctx,20,10,3,'#303038'); });
    this.makeIcon('armor_shadow_leather', (ctx) => { ctx.fillStyle='#0a0810'; ctx.fillRect(6,6,20,22); ctx.fillStyle='#1a1828'; for(let i=0;i<5;i++) ctx.fillRect(8+i*5,8,2,20); ctx.fillStyle='#303050'; ctx.fillRect(6,6,20,2); });

    // PLANTS (10)
    this.makeIcon('plant_bloodroot', (ctx) => { ctx.fillStyle='#2a8020'; ctx.fillRect(14,14,4,12); ctx.fillStyle='#b01020'; for(let i=0;i<3;i++) ctx.fillRect(10+i*6,8,4,6); });
    this.makeIcon('plant_dewleaf', (ctx) => { ctx.fillStyle='#30a030'; ctx.beginPath(); ctx.ellipse(16,18,8,4,0.3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#60c060'; ctx.beginPath(); ctx.ellipse(16,14,6,3,-0.3,0,Math.PI*2); ctx.fill(); });
    this.makeIcon('plant_swamp_moss', (ctx) => { ctx.fillStyle='#304a20'; ctx.fillRect(8,16,16,6); for(let i=0;i<6;i++) ctx.fillRect(8+i*3,10,2,6); });
    this.makeIcon('plant_ember_flower', (ctx) => { ctx.fillStyle='#204020'; ctx.fillRect(14,16,4,10); ctx.fillStyle='#ff4010'; for(let i=0;i<5;i++) ctx.fillRect(10+i*3,6,3,8); ctx.fillStyle='#ffaa00'; this.dotCtx(ctx,16,10,3,'#ffcc00'); });
    this.makeIcon('plant_frost_grass', (ctx) => { ctx.fillStyle='#6090c0'; for(let i=0;i<5;i++) ctx.fillRect(8+i*5,8,2,16); ctx.fillStyle='#ddeeff'; for(let i=0;i<3;i++) this.dotCtx(ctx,12+i*4,14,2,'#ddeeff'); });
    this.makeIcon('plant_moonweed', (ctx) => { ctx.fillStyle='#204020'; ctx.fillRect(14,16,4,10); ctx.fillStyle='#a0a0dd'; ctx.beginPath(); ctx.arc(16,8,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(16,8,3,0,Math.PI*2); ctx.fill(); });
    this.makeIcon('plant_beach_vine', (ctx) => { ctx.strokeStyle='#608040'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,24); ctx.quadraticCurveTo(12,12,20,20); ctx.quadraticCurveTo(24,16,28,24); ctx.stroke(); for(let i=0;i<3;i++) this.dotCtx(ctx,8+i*6,16-i*4,3,'#407020'); });
    this.makeIcon('plant_poison_cap', (ctx) => { ctx.fillStyle='#ccc'; ctx.fillRect(14,16,4,10); ctx.fillStyle='#a01020'; ctx.beginPath(); ctx.arc(16,10,8,Math.PI,0); ctx.fill(); this.dotCtx(ctx,12,8,2,'#ffffff'); this.dotCtx(ctx,18,10,2,'#ffffff'); });
    this.makeIcon('plant_grave_moss', (ctx) => { ctx.fillStyle='#303a30'; ctx.fillRect(6,12,20,10); ctx.fillStyle='#404a40'; for(let i=0;i<6;i++) this.dotCtx(ctx,8+i*4,12,2+i/3,'#506050'); });
    this.makeIcon('plant_firethorn', (ctx) => { ctx.fillStyle='#204020'; ctx.fillRect(14,14,4,12); ctx.fillStyle='#ff3000'; for(let i=0;i<5;i++) this.dotCtx(ctx,10+i*3,8+i*2,2,'#ff5000'); });

    // POTIONS (6)
    this.makeIcon('potion_healing_small', (ctx) => { this.potion(ctx, '#8a1818', '#dd3030', 0.6, '#302020'); });
    this.makeIcon('potion_healing_medium', (ctx) => { this.potion(ctx, '#8a1818', '#ee4040', 0.8, '#302020'); this.dotCtx(ctx,16,14,3,'#ff8080'); });
    this.makeIcon('potion_healing_large', (ctx) => { this.potion(ctx, '#8a1818', '#ff4040', 1.0, '#302020'); this.dotCtx(ctx,14,12,4,'#ffaaaa'); this.dotCtx(ctx,18,16,3,'#ff8080'); });
    this.makeIcon('potion_mana_small', (ctx) => { this.potion(ctx, '#18288a', '#3050dd', 0.7, '#202030'); });
    this.makeIcon('potion_stamina', (ctx) => { this.potion(ctx, '#288a28', '#40dd40', 0.7, '#203020'); });
    this.makeIcon('potion_antidote', (ctx) => { this.potion(ctx, '#8a188a', '#cc40cc', 0.7, '#302030'); });

    // MISC (rozszerzone)
    this.makeIcon('misc_gold', (ctx) => { ctx.fillStyle='#b88800'; ctx.beginPath(); ctx.arc(16,16,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ddaa00'; ctx.beginPath(); ctx.arc(16,15,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#886600'; ctx.beginPath(); ctx.arc(16,16,8,0,Math.PI*2); ctx.stroke(); this.dotCtx(ctx,14,13,2,'#ffdd44'); });
    this.makeIcon('misc_arrow', (ctx) => { ctx.fillStyle='#604028'; ctx.fillRect(4,14,22,3); ctx.fillStyle='#907050'; ctx.fillRect(2,13,6,5); ctx.fillStyle='#303030'; ctx.beginPath(); ctx.moveTo(26,12); ctx.lineTo(30,15); ctx.lineTo(26,18); ctx.closePath(); ctx.fill(); });
    this.makeIcon('misc_lockpick_iron', (ctx) => { ctx.fillStyle='#808080'; ctx.fillRect(14,4,3,20); ctx.fillRect(10,20,10,4); ctx.fillRect(8,4,8,3); });
    this.makeIcon('misc_lockpick_steel', (ctx) => { ctx.fillStyle='#aaaaaa'; ctx.fillRect(14,4,3,20); ctx.fillRect(10,20,10,4); ctx.fillRect(8,4,8,3); ctx.strokeStyle='#ccc'; ctx.lineWidth=1; ctx.strokeRect(9,5,6,2); });
    this.makeIcon('misc_lockpick_master', (ctx) => { ctx.fillStyle='#ccccaa'; ctx.fillRect(14,4,3,20); ctx.fillRect(10,20,10,4); ctx.fillRect(8,4,8,3); ctx.fillStyle='#ffcc00'; this.dotCtx(ctx,10,8,2,'#ffcc00'); });
    this.makeIcon('misc_key_guard_tower', (ctx) => { ctx.fillStyle='#806030'; this.dotCtx(ctx,16,22,6,'#a08040'); ctx.fillRect(14,6,4,14); ctx.strokeStyle='#ccaa50'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(16,8,4,0,Math.PI*2); ctx.stroke(); });
    this.makeIcon('misc_key_free_cache', (ctx) => { ctx.fillStyle='#a08040'; this.dotCtx(ctx,16,22,5,'#c0a050'); ctx.fillRect(14,8,4,12); ctx.strokeStyle='#ddbb60'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(16,8,3,0,Math.PI*2); ctx.stroke(); });
    this.makeIcon('misc_quest_letter', (ctx) => { ctx.fillStyle='#ccbba0'; ctx.fillRect(6,6,20,24); ctx.strokeStyle='#807060'; ctx.lineWidth=1; ctx.strokeRect(6,6,20,24); ctx.fillStyle='#706050'; ctx.fillRect(10,12,12,2); ctx.fillRect(10,16,14,1); ctx.fillRect(10,18,12,1); ctx.fillStyle='#cc2020'; this.dotCtx(ctx,22,10,2,'#cc2020'); });
    this.makeIcon('misc_quest_artifact', (ctx) => { ctx.fillStyle='#604060'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#806080'; ctx.beginPath(); ctx.arc(16,16,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffaa00'; this.dotCtx(ctx,16,16,3,'#ffcc00'); });
    this.makeIcon('misc_quest_herb_packet', (ctx) => { ctx.fillStyle='#405030'; ctx.fillRect(8,8,16,18); ctx.fillStyle='#203010'; ctx.fillRect(10,6,12,4); ctx.fillStyle='#607040'; for(let i=0;i<3;i++) ctx.fillRect(10+i*4,10,3,12); });
    this.makeIcon('misc_skins_wolf', (ctx) => { ctx.fillStyle='#605040'; ctx.beginPath(); ctx.moveTo(8,24); ctx.quadraticCurveTo(4,14,10,6); ctx.quadraticCurveTo(16,2,22,8); ctx.quadraticCurveTo(28,16,24,24); ctx.closePath(); ctx.fill(); ctx.fillStyle='#807060'; ctx.beginPath(); ctx.moveTo(12,24); ctx.quadraticCurveTo(16,10,20,24); ctx.closePath(); ctx.fill(); });
    this.makeIcon('misc_skins_boar', (ctx) => { ctx.fillStyle='#503010'; ctx.fillRect(6,6,20,18); ctx.fillStyle='#704820'; for(let i=0;i<5;i++) ctx.fillRect(8+i*4,8,2,14); ctx.fillStyle='#704020'; ctx.fillRect(6,6,20,4); });
    this.makeIcon('misc_trophy_mutant_eye', (ctx) => { ctx.fillStyle='#604020'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ff4000'; ctx.beginPath(); ctx.arc(16,16,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.arc(16,16,3,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#000'; this.dotCtx(ctx,16,16,1,'#000'); });
    this.makeIcon('misc_trophy_wyrm_scale', (ctx) => { ctx.fillStyle='#685838'; ctx.beginPath(); ctx.moveTo(8,24); ctx.lineTo(4,12); ctx.lineTo(10,6); ctx.lineTo(16,4); ctx.lineTo(22,6); ctx.lineTo(28,12); ctx.lineTo(24,24); ctx.closePath(); ctx.fill(); ctx.fillStyle='#908860'; ctx.beginPath(); ctx.moveTo(12,20); ctx.lineTo(10,12); ctx.lineTo(16,8); ctx.lineTo(22,12); ctx.lineTo(20,20); ctx.closePath(); ctx.fill(); });
    this.makeIcon('misc_quest_medallion', (ctx) => { ctx.fillStyle='#b0a070'; ctx.beginPath(); ctx.arc(16,16,10,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#806020'; ctx.lineWidth=2; ctx.stroke(); ctx.fillStyle='#806020'; ctx.beginPath(); ctx.arc(16,16,6,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='#402810'; ctx.fillRect(14,4,4,6); });
  }

  // ============================================================
  // CHARACTERS (32x56, 4 directions) - mroczniej, więcej detali
  // ============================================================
  private genCharacters() {
    this.genCharacter('char_player', '#4a3018', '#b89060', '#3a2818', '#8a7040');
    this.genCharacter('char_old_guard', '#283050', '#b89060', '#485080', '#6070aa');
    this.genCharacter('char_old_guard_f', '#283050', '#c8a070', '#485080', '#6070aa', true);
    this.genCharacter('char_old_commander', '#181848', '#b89060', '#303070', '#ffcc00', false, true);
    this.genCharacter('char_new_fighter', '#601818', '#b89060', '#a04040', '#cc4040');
    this.genCharacter('char_new_fighter_f', '#601818', '#c8a070', '#a04040', '#cc4040', true);
    this.genCharacter('char_new_leader', '#400808', '#b89060', '#802020', '#ff4000', false, true);
    this.genCharacter('char_neutral', '#504838', '#b89060', '#686050', '#807060');
    this.genCharacter('char_neutral_f', '#504848', '#c8a070', '#685860', '#807080', true);
    this.genCharacter('char_female', '#482840', '#c8a070', '#604058', '#805078', true);
    this.genCharacter('char_bandit', '#382810', '#a88050', '#503020', '#804828');
    this.genCharacter('char_merchant', '#284028', '#b89060', '#486048', '#d0a040');
  }

  /**
   * @param bodyColor główne ubranie
   * @param skinColor kolor skóry
   * @param cloakColor płaszcz/narzutka
   * @param accentColor akcenty (pas, buty, broń)
   * @param female kobieca sylwetka
   * @param crowned hełm/korona
   */
  private genCharacter(key: string, bodyColor: string, skinColor: string, cloakColor: string, accentColor: string, female: boolean = false, crowned: boolean = false) {
    const w = 32, h = 56;
    const canvas = this.scene.textures.createCanvas(key, w*4, h);
    if (!canvas) return;
    const ctx = canvas.getContext(); if (!ctx) return;

    for (let dir = 0; dir < 4; dir++) {
      const ox = dir*w;
      const isFront = dir === 0;
      const isBack = dir === 3;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(ox+16, 52, 10, 3, 0, 0, Math.PI*2);
      ctx.fill();

      // Legs - spodnie, ciemniejsze
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(ox+11, 32, 4, 14);
      ctx.fillRect(ox+17, 32, 4, 14);
      // Boots
      ctx.fillStyle = accentColor;
      ctx.fillRect(ox+10, 44, 6, 4);
      ctx.fillRect(ox+16, 44, 6, 4);
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(ox+10, 46, 6, 2);
      ctx.fillRect(ox+16, 46, 6, 2);

      // Torso - ciemne ubranie
      ctx.fillStyle = bodyColor;
      ctx.fillRect(ox+8, 20, 16, 16);
      // Cloak / narzutka z tyłu/boków
      ctx.fillStyle = cloakColor;
      if (isBack) {
        ctx.fillRect(ox+6, 18, 20, 18);
      } else {
        // narzutka ramion
        ctx.fillRect(ox+6, 20, 20, 8);
      }
      // Belt
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(ox+8, 32, 16, 3);
      ctx.fillStyle = accentColor;
      this.dotCtx(ctx, ox+16, 33, 1.5, accentColor);

      // Arms
      ctx.fillStyle = bodyColor;
      ctx.fillRect(ox+6, 22, 3, 12);
      ctx.fillRect(ox+23, 22, 3, 12);
      // Hands
      ctx.fillStyle = skinColor;
      ctx.fillRect(ox+6, 32, 3, 3);
      ctx.fillRect(ox+23, 32, 3, 3);

      // Head
      ctx.fillStyle = skinColor;
      ctx.fillRect(ox+11, 6, 10, 12);
      // Jaw shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(ox+11, 14, 10, 4);
      // Hair - długie u kobiet
      ctx.fillStyle = female ? '#201008' : '#2a1a0a';
      ctx.fillRect(ox+10, 5, 12, 5);
      if (female) {
        ctx.fillRect(ox+8, 6, 3, 14);
        ctx.fillRect(ox+21, 6, 3, 14);
      }
      // Eyes (front)
      if (isFront) {
        ctx.fillStyle = '#000';
        ctx.fillRect(ox+13, 11, 2, 2);
        ctx.fillRect(ox+17, 11, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(ox+13, 11, 1, 1);
        ctx.fillRect(ox+17, 11, 1, 1);
        // Brow - zmarszczka
        ctx.fillStyle = '#000';
        ctx.fillRect(ox+13, 10, 2, 1);
        ctx.fillRect(ox+17, 10, 2, 1);
        // Beard stubble
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(ox+12, 14, 8, 3);
      } else if (isBack) {
        // Hair covers head
        ctx.fillStyle = '#1a0e04';
        ctx.fillRect(ox+10, 6, 12, 12);
      } else {
        // Side: one eye visible
        ctx.fillStyle = '#000';
        const ex = dir === 1 ? ox+12 : ox+18;
        ctx.fillRect(ex, 11, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(ex, 11, 1, 1);
        // Nose
        ctx.fillStyle = skinColor;
        ctx.fillRect(dir === 1 ? ox+21 : ox+10, 13, 1, 3);
      }

      // Weapon at side
      ctx.fillStyle = '#404040';
      ctx.fillRect(ox+24, 20, 2, 14);
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(ox+23, 32, 4, 2);

      // Helmet/Crown for leaders
      if (crowned) {
        ctx.fillStyle = '#202030';
        ctx.fillRect(ox+10, 3, 12, 5);
        ctx.fillStyle = accentColor;
        ctx.fillRect(ox+12, 1, 2, 4);
        ctx.fillRect(ox+15, 0, 2, 5);
        ctx.fillRect(ox+18, 1, 2, 4);
      }
    }
    canvas.refresh();
  }

  // ============================================================
  // MONSTERS - większe, ciemniejsze
  // ============================================================
  private genMonsters() {
    // Wilk - 64x48 szary, agresywny
    this.makeCreature('monster_grey_wolf', 64, 48, (ctx) => {
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath(); ctx.ellipse(32,32,20,12,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#383838';
      ctx.beginPath(); ctx.ellipse(32,36,14,6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#5a5a5a';
      ctx.beginPath(); ctx.ellipse(18,20,12,10,0,0,Math.PI*2); ctx.fill(); // head
      // Ears
      ctx.fillStyle = '#303030';
      ctx.beginPath(); ctx.moveTo(10,14); ctx.lineTo(14,6); ctx.lineTo(16,14); ctx.fill();
      ctx.beginPath(); ctx.moveTo(22,14); ctx.lineTo(26,6); ctx.lineTo(26,14); ctx.fill();
      // Snout
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath(); ctx.ellipse(12,24,6,4,0,0,Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#ffaa00'; this.dotCtx(ctx,18,18,3); this.dotCtx(ctx,24,18,3);
      ctx.fillStyle = '#000'; this.dotCtx(ctx,18,18,1); this.dotCtx(ctx,24,18,1);
      // Teeth
      ctx.fillStyle = '#ddd'; ctx.fillRect(8,24,2,3); ctx.fillRect(12,24,2,3);
      // Legs
      ctx.fillStyle = '#383838';
      ctx.fillRect(20,38,5,10); ctx.fillRect(28,38,5,10); ctx.fillRect(36,38,5,10); ctx.fillRect(44,38,5,8);
      // Tail
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath(); ctx.moveTo(50,30); ctx.quadraticCurveTo(58,22,56,14); ctx.lineTo(52,28); ctx.fill();
    });
    // Dzik - 72x56 brązowy, kły
    this.makeCreature('monster_forest_boar', 72, 56, (ctx) => {
      ctx.fillStyle = '#3a2010';
      ctx.beginPath(); ctx.ellipse(36,34,24,16,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4a2818';
      ctx.beginPath(); ctx.ellipse(36,38,18,10,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#3a2010'; ctx.beginPath(); ctx.ellipse(16,32,12,10,0,0,Math.PI*2); ctx.fill();
      // Fur/spikes
      ctx.fillStyle = '#2a1808';
      for (let i=0;i<8;i++) ctx.fillRect(20+i*4, 22, 3, 4);
      // Tusks
      ctx.fillStyle = '#ccb090';
      ctx.beginPath(); ctx.moveTo(6,32); ctx.lineTo(0,28); ctx.lineTo(6,36); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12,36); ctx.lineTo(6,38); ctx.lineTo(10,38); ctx.fill();
      // Eye
      ctx.fillStyle = '#ff2000'; this.dotCtx(ctx,16,28,3);
      ctx.fillStyle = '#000'; this.dotCtx(ctx,16,28,1);
      // Legs
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(22,44,6,10); ctx.fillRect(32,44,6,10); ctx.fillRect(44,44,6,10);
      // Hooves
      ctx.fillStyle = '#1a1004';
      ctx.fillRect(22,52,6,3); ctx.fillRect(32,52,6,3); ctx.fillRect(44,52,6,3);
    });
    // Bagienny stwór - 56x56 zielony, macki
    this.makeCreature('monster_marsh_crawler', 56, 56, (ctx) => {
      ctx.fillStyle = '#1e2e10';
      ctx.beginPath(); ctx.ellipse(28,32,18,14,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2a4018';
      ctx.beginPath(); ctx.ellipse(28,36,14,8,0,0,Math.PI*2); ctx.fill();
      // Tentacles
      ctx.strokeStyle = '#304820'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(12,28); ctx.quadraticCurveTo(4,18,8,8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18,24); ctx.quadraticCurveTo(10,14,16,4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38,24); ctx.quadraticCurveTo(46,14,42,6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(44,28); ctx.quadraticCurveTo(52,20,50,12); ctx.stroke();
      // Eyes
      ctx.fillStyle = '#ff8800'; this.dotCtx(ctx,20,28,4); this.dotCtx(ctx,36,28,4);
      ctx.fillStyle = '#000'; this.dotCtx(ctx,20,28,2); this.dotCtx(ctx,36,28,2);
      // Mouth
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(28, 40, 6, 3, 0, 0, Math.PI*2); ctx.fill();
    });
    // Mutant - 72x72 czerwono-brązowy, kolce
    this.makeCreature('monster_mutant', 72, 72, (ctx) => {
      ctx.fillStyle = '#5a1808';
      ctx.beginPath(); ctx.ellipse(36,38,22,18,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#7a2810';
      ctx.beginPath(); ctx.ellipse(36,44,16,10,0,0,Math.PI*2); ctx.fill();
      // Head
      ctx.fillStyle = '#5a1808'; ctx.beginPath(); ctx.ellipse(36,18,14,12,0,0,Math.PI*2); ctx.fill();
      // Spikes
      ctx.fillStyle = '#aa4020';
      for (let i=0;i<7;i++) {
        ctx.beginPath(); ctx.moveTo(10+i*9, 24); ctx.lineTo(14+i*9, 10); ctx.lineTo(18+i*9, 24); ctx.fill();
      }
      // Eyes
      ctx.fillStyle = '#ff0000'; this.dotCtx(ctx,30,18,4); this.dotCtx(ctx,42,18,4);
      ctx.fillStyle = '#ff8000'; this.dotCtx(ctx,30,18,2); this.dotCtx(ctx,42,18,2);
      // Arms
      ctx.fillStyle = '#5a1808'; ctx.fillRect(10,30,8,16); ctx.fillRect(54,30,8,16);
      // Claws
      ctx.fillStyle = '#ddd'; ctx.fillRect(8,46,4,4); ctx.fillRect(58,46,4,4);
      // Legs
      ctx.fillStyle = '#401000'; ctx.fillRect(22,52,8,16); ctx.fillRect(42,52,8,16);
    });
    // Piaskowy czerw / Sand Wyrm - 80x56
    this.makeCreature('monster_sand_wyrm', 80, 56, (ctx) => {
      ctx.fillStyle = '#706040';
      // body segments
      for (let i=0;i<4;i++) {
        ctx.beginPath(); ctx.ellipse(60-i*12, 30+Math.sin(i)*3, 10, 8, 0, 0, Math.PI*2); ctx.fill();
      }
      ctx.beginPath(); ctx.ellipse(32,30,22,12,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#807048';
      for (let i=0;i<6;i++) for(let j=0;j<3;j++) this.dotCtx(ctx,16+i*8,24+j*8,2,'#908058');
      // head
      ctx.fillStyle = '#706040'; ctx.beginPath(); ctx.ellipse(22,22,16,12,0,0,Math.PI*2); ctx.fill();
      // Mouth
      ctx.fillStyle = '#200'; ctx.beginPath(); ctx.ellipse(12,24,8,4,0,0,Math.PI*2); ctx.fill();
      // Teeth
      ctx.fillStyle = '#ddc0a0';
      for (let i=0;i<4;i++) { ctx.fillRect(7+i*2,22,1,3); ctx.fillRect(7+i*2,26,1,2); }
      // Eyes
      ctx.fillStyle = '#ffcc00'; this.dotCtx(ctx,24,16,3); this.dotCtx(ctx,32,16,3);
      ctx.fillStyle = '#000'; this.dotCtx(ctx,24,16,1); this.dotCtx(ctx,32,16,1);
    });
    // Cień / Shade - 56x72 eteryczny
    this.makeCreature('monster_shade', 56, 72, (ctx) => {
      // Body - ghostly
      const g = ctx.createRadialGradient(28, 36, 4, 28, 36, 28);
      g.addColorStop(0, 'rgba(30,30,70,0.85)');
      g.addColorStop(1, 'rgba(10,10,30,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(28,36,20,26,0,0,Math.PI*2); ctx.fill();
      // Inner core
      ctx.fillStyle = 'rgba(40,40,90,0.6)';
      ctx.beginPath(); ctx.ellipse(28,40,14,18,0,0,Math.PI*2); ctx.fill();
      // Eyes
      ctx.fillStyle = '#aaccff'; this.dotCtx(ctx,22,32,4); this.dotCtx(ctx,34,32,4);
      ctx.fillStyle = '#ffffff'; this.dotCtx(ctx,22,32,2); this.dotCtx(ctx,34,32,2);
      ctx.fillStyle = '#000'; this.dotCtx(ctx,22,32,1); this.dotCtx(ctx,34,32,1);
      // Wisps
      ctx.fillStyle = 'rgba(40,40,80,0.4)';
      ctx.beginPath(); ctx.ellipse(16,10,8,10,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(38,8,6,8,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10,20,5,7,0,0,Math.PI*2); ctx.fill();
    });
  }

  // ============================================================
  // UI
  // ============================================================
  private genUI() {
    this.makeTile('ui_button', 32, 16, (ctx) => {
      ctx.fillStyle='#2a2a2a'; ctx.fillRect(0,0,32,16);
      ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.strokeRect(0,0,32,16);
    });
    this.makeTile('ui_button_hover', 32, 16, (ctx) => {
      ctx.fillStyle='#444'; ctx.fillRect(0,0,32,16);
      ctx.strokeStyle='#888'; ctx.lineWidth=1; ctx.strokeRect(0,0,32,16);
    });
    this.makeTile('ui_panel', 64, 64, (ctx) => {
      ctx.fillStyle='rgba(20,10,5,0.92)'; ctx.fillRect(0,0,64,64);
      ctx.strokeStyle='#3a2a1a'; ctx.lineWidth=2; ctx.strokeRect(1,1,62,62);
    });
  }

  // ============================================================
  // VFX
  // ============================================================
  private genVFX() {
    this.makeTile('vfx_fire_bolt', 16, 16, (ctx) => {
      const g = ctx.createRadialGradient(8,8,1,8,8,8);
      g.addColorStop(0,'#ffff80'); g.addColorStop(0.4,'#ff6000'); g.addColorStop(1,'rgba(120,20,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,16,16);
    });
    this.makeTile('vfx_ice_shard', 16, 16, (ctx) => {
      ctx.fillStyle='#aaddff'; ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(14,8); ctx.lineTo(8,16); ctx.lineTo(2,8); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.moveTo(8,2); ctx.lineTo(11,8); ctx.lineTo(8,14); ctx.lineTo(5,8); ctx.closePath(); ctx.fill();
    });
    this.makeTile('vfx_fire_explosion', 32, 32, (ctx) => {
      const g = ctx.createRadialGradient(16,16,2,16,16,16);
      g.addColorStop(0,'#ffff00'); g.addColorStop(0.3,'#ff4000'); g.addColorStop(1,'rgba(80,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,32,32);
    });
    this.makeTile('vfx_hit_spark', 16, 16, (ctx) => {
      ctx.fillStyle='#ffdd00';
      for (let i=0;i<6;i++) { const a = i*Math.PI/3; ctx.fillRect(8+Math.cos(a)*5-1, 8+Math.sin(a)*5-1, 2, 2); }
      this.dotCtx(ctx,8,8,3,'#ff8000');
    });
  }

  // ============================================================
  // WORLD OBJECTS - większe i ciemniejsze
  // ============================================================
  private genWorldObjects() {
    // Drzewo - duże 64x96
    this.makeTile('tree', 64, 96, (ctx) => {
      // Trunk
      ctx.fillStyle = '#1a0f05'; ctx.fillRect(26, 50, 12, 40);
      ctx.fillStyle = '#2a1808'; ctx.fillRect(28, 50, 4, 40);
      // Roots
      ctx.fillStyle = '#1a0f05';
      ctx.fillRect(22, 86, 6, 6); ctx.fillRect(36, 86, 6, 6);
      // Canopy - warstwowa, ciemna zieleń
      ctx.fillStyle = '#0f2008';
      ctx.beginPath(); ctx.arc(32,36,26,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a3010';
      ctx.beginPath(); ctx.arc(22,28,18,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(42,30,18,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(32,20,16,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#244018';
      ctx.beginPath(); ctx.arc(26,24,12,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(38,26,12,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(32,18,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#2f5020';
      for (let i=0;i<12;i++) this.dotCtx(ctx, 12+Math.random()*40, 8+Math.random()*40, 2, '#2f5020');
    });
    // Dead tree
    this.makeTile('tree_dead', 64, 96, (ctx) => {
      ctx.fillStyle = '#0f0804'; ctx.fillRect(28, 30, 8, 60);
      // Gałęzie
      ctx.strokeStyle='#1a1008'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(32,40); ctx.lineTo(16,20); ctx.lineTo(10,10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(32,50); ctx.lineTo(50,30); ctx.lineTo(58,18); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(32,32); ctx.lineTo(24,18); ctx.stroke();
    });
    // Pine/swamp tree
    this.makeTile('tree_pine', 64, 96, (ctx) => {
      ctx.fillStyle = '#1a0f05'; ctx.fillRect(28, 70, 8, 22);
      ctx.fillStyle = '#0a2010';
      ctx.beginPath(); ctx.moveTo(32, 10); ctx.lineTo(10,70); ctx.lineTo(54,70); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#143018';
      ctx.beginPath(); ctx.moveTo(32, 22); ctx.lineTo(16,60); ctx.lineTo(48,60); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1e4020';
      ctx.beginPath(); ctx.moveTo(32, 30); ctx.lineTo(20,55); ctx.lineTo(44,55); ctx.closePath(); ctx.fill();
    });
    // Rock - 48x40
    this.makeTile('rock', 48, 40, (ctx) => {
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath(); ctx.ellipse(24, 26, 20, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#505050';
      ctx.beginPath(); ctx.ellipse(18, 22, 12, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#606060';
      ctx.beginPath(); ctx.ellipse(14, 18, 8, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#202020';
      ctx.beginPath(); ctx.ellipse(30, 30, 10, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#202020'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, 22); ctx.lineTo(20, 28); ctx.stroke();
    });
    // Large rock / boulder (góry)
    this.makeTile('boulder', 64, 56, (ctx) => {
      ctx.fillStyle = '#282828';
      ctx.beginPath(); ctx.moveTo(8, 50); ctx.lineTo(20, 18); ctx.lineTo(40, 10); ctx.lineTo(56, 22); ctx.lineTo(58, 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#484848';
      ctx.beginPath(); ctx.moveTo(16, 48); ctx.lineTo(28, 22); ctx.lineTo(42, 18); ctx.lineTo(52, 30); ctx.lineTo(54, 48); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a5a5a';
      this.dotCtx(ctx,26,24,3); this.dotCtx(ctx,36,20,3); this.dotCtx(ctx,44,30,3);
    });
    // Mushroom
    this.makeTile('mushroom', 24, 28, (ctx) => {
      ctx.fillStyle = '#e8e0d0'; ctx.fillRect(10,14,4,12);
      ctx.fillStyle = '#a02020'; ctx.beginPath(); ctx.arc(12,14,10,Math.PI,0); ctx.fill();
      this.dotCtx(ctx,8,10,2,'#fff'); this.dotCtx(ctx,14,8,2,'#fff'); this.dotCtx(ctx,18,12,2,'#fff');
    });
    // Bush
    this.makeTile('bush', 32, 28, (ctx) => {
      ctx.fillStyle = '#0e2008';
      ctx.beginPath(); ctx.arc(10,18,10,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(22,18,10,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(16,14,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1a3010';
      for (let i=0;i<10;i++) this.dotCtx(ctx, 6+Math.random()*20, 8+Math.random()*16, 2, '#204018');
      this.dotCtx(ctx,12,16,2,'#602020'); this.dotCtx(ctx,20,14,2,'#602020');
    });
    // Gravestone
    this.makeTile('gravestone', 32, 40, (ctx) => {
      ctx.fillStyle = '#303038';
      ctx.fillRect(8,10,16,26);
      ctx.beginPath(); ctx.arc(16,10,8,Math.PI,0); ctx.fill();
      ctx.fillStyle = '#202028'; ctx.fillRect(4,34,24,4);
      ctx.fillStyle = '#101018';
      ctx.fillRect(12,16,8,1); ctx.fillRect(12,20,6,1); ctx.fillRect(12,24,7,1);
    });
    // Skull (decor)
    this.makeTile('skull', 24, 24, (ctx) => {
      ctx.fillStyle = '#d8ccb0'; ctx.beginPath(); ctx.arc(12,10,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; this.dotCtx(ctx,8,10,3); this.dotCtx(ctx,16,10,3);
      ctx.fillRect(10,16,4,3);
      ctx.fillStyle = '#887060'; ctx.fillRect(10,19,1,4); ctx.fillRect(13,19,1,4);
    });
    // Campfire
    this.makeTile('campfire', 32, 32, (ctx) => {
      ctx.fillStyle = '#1a0a04'; ctx.fillRect(4,26,24,4);
      ctx.fillStyle = '#3a2010'; ctx.fillRect(8,20,16,8);
      // logs
      ctx.strokeStyle='#2a1808'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(6,24); ctx.lineTo(26,20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6,20); ctx.lineTo(26,24); ctx.stroke();
      // fire
      const g = ctx.createRadialGradient(16,18,1,16,18,12);
      g.addColorStop(0,'#ffff80'); g.addColorStop(0.5,'#ff6000'); g.addColorStop(1,'rgba(200,20,0,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(16,18,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff4000'; ctx.beginPath(); ctx.moveTo(16,4); ctx.lineTo(12,18); ctx.lineTo(20,18); ctx.closePath(); ctx.fill();
    });
    // Hut / small building
    this.makeTile('hut', 80, 72, (ctx) => {
      // Walls
      ctx.fillStyle='#2a1a08'; ctx.fillRect(8,24,64,40);
      ctx.strokeStyle='#1a0c04'; ctx.lineWidth=1;
      for (let i=0;i<5;i++) for (let j=0;j<3;j++) ctx.strokeRect(8+i*13, 24+j*13, 13, 13);
      // Roof
      ctx.fillStyle='#281008'; ctx.beginPath(); ctx.moveTo(4,24); ctx.lineTo(40,4); ctx.lineTo(76,24); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#402010'; ctx.lineWidth=2;
      for (let i=0;i<7;i++) { ctx.beginPath(); ctx.moveTo(8+i*10, 22-i*3); ctx.lineTo(14+i*10, 22-i*3); ctx.stroke(); }
      // Door
      ctx.fillStyle='#0a0402'; ctx.fillRect(32,40,16,24);
      ctx.fillStyle='#b08030'; this.dotCtx(ctx,44,52,1);
      // Window
      ctx.fillStyle='#402008'; ctx.fillRect(16,32,10,10);
      ctx.fillStyle='#ffa020'; ctx.fillRect(17,33,8,8);
      ctx.fillRect(52,32,10,10); ctx.fillStyle='#ffa020'; ctx.fillRect(53,33,8,8);
    });
    // Tent
    this.makeTile('tent', 64, 48, (ctx) => {
      ctx.fillStyle='#4a2a18'; ctx.beginPath(); ctx.moveTo(4,42); ctx.lineTo(32,6); ctx.lineTo(60,42); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#6a4020'; ctx.beginPath(); ctx.moveTo(32,6); ctx.lineTo(32,42); ctx.stroke();
      ctx.fillStyle='#2a1008'; ctx.beginPath(); ctx.moveTo(24,42); ctx.lineTo(32,24); ctx.lineTo(40,42); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#3a2010'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(8,40); ctx.lineTo(32,10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(56,40); ctx.lineTo(32,10); ctx.stroke();
    });
    // Wooden wall (fort)
    this.makeTile('wall_wood', 48, 56, (ctx) => {
      ctx.fillStyle='#2a1808';
      for (let i=0;i<6;i++) {
        ctx.fillRect(i*8, 4, 7, 50);
        ctx.beginPath(); ctx.moveTo(i*8+3, 0); ctx.lineTo(i*8+7, 4); ctx.lineTo(i*8-1, 4); ctx.fill();
      }
      ctx.fillStyle='#402810'; ctx.fillRect(0,24,48,4);
      ctx.fillStyle='#503018'; ctx.fillRect(0,40,48,4);
    });
    // Chest closed 32x28
    this.makeTile('chest_closed', 32, 28, (ctx) => {
      ctx.fillStyle='#3a2008'; ctx.fillRect(2,10,28,16);
      ctx.strokeStyle='#201004'; ctx.lineWidth=1; ctx.strokeRect(2,10,28,16);
      ctx.fillStyle='#503010'; ctx.fillRect(2,10,28,5);
      ctx.fillStyle='#1a0c04'; ctx.fillRect(2,16,28,2);
      ctx.fillStyle='#c8a040'; this.dotCtx(ctx,16,18,2);
      ctx.fillStyle='#ffdd40'; this.dotCtx(ctx,16,18,1);
    });
    // Chest open
    this.makeTile('chest_open', 32, 28, (ctx) => {
      ctx.fillStyle='#3a2008'; ctx.fillRect(2,16,28,10);
      ctx.fillStyle='#503010'; ctx.fillRect(2,4,28,10);
      ctx.strokeStyle='#201004'; ctx.lineWidth=1; ctx.strokeRect(2,4,28,10);
      ctx.fillStyle='#ffdd40'; this.dotCtx(ctx,16,20,2);
      // Glow inside
      ctx.fillStyle='rgba(255,200,40,0.3)'; ctx.fillRect(4,18,24,6);
    });
    // Herb pickup
    this.makeTile('herb', 16, 20, (ctx) => {
      ctx.fillStyle='#2a7020'; ctx.fillRect(7,10,2,8);
      ctx.fillStyle='#40a030'; ctx.beginPath(); ctx.ellipse(5,8,4,3,-0.4,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11,8,4,3,0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#b02020'; this.dotCtx(ctx,8,5,2);
    });
    // Waypost (drogowskaz)
    this.makeTile('waypost', 24, 48, (ctx) => {
      ctx.fillStyle='#2a1808'; ctx.fillRect(10,4,4,42);
      ctx.fillStyle='#4a3020'; ctx.fillRect(2,8,20,8);
      ctx.fillRect(2,22,16,6);
      ctx.fillStyle='#c0a060'; ctx.fillRect(3,10,1,1);
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
    ctx.clearRect(0,0,w,h);
    draw(ctx);
    canvas.refresh();
  }

  private makeIcon(key: string, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = this.scene.textures.createCanvas(key, 32, 32);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;
    ctx.clearRect(0,0,32,32);
    // ciemne tło ikony
    ctx.fillStyle = 'rgba(20,10,5,0.6)';
    ctx.fillRect(0,0,32,32);
    ctx.strokeStyle = 'rgba(80,50,20,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0,0,32,32);
    draw(ctx);
    canvas.refresh();
  }

  private sword(ctx: CanvasRenderingContext2D, cx: number, cy: number, blade: string, guard: string, grip: string) {
    // Ostrze
    ctx.fillStyle = blade;
    ctx.beginPath(); ctx.moveTo(cx, cy-22); ctx.lineTo(cx+3, cy+2); ctx.lineTo(cx-3, cy+2); ctx.closePath(); ctx.fill();
    // Highlight na ostrzu
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx-1, cy-20, 1, 20);
    // Jelec
    ctx.fillStyle = guard;
    ctx.fillRect(cx-7, cy+2, 14, 3);
    // Rękojeść
    ctx.fillStyle = grip;
    ctx.fillRect(cx-1, cy+5, 2, 7);
    // Głowica
    this.dotCtx(ctx, cx, cy+14, 3, guard);
  }

  private curveSword(ctx: CanvasRenderingContext2D, cx: number, cy: number, blade: string, guard: string, grip: string) {
    ctx.strokeStyle = blade; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy+4); ctx.quadraticCurveTo(cx+8, cy-8, cx+3, cy-20); ctx.stroke();
    ctx.fillStyle = guard; ctx.fillRect(cx-5, cy+2, 12, 3);
    ctx.fillStyle = grip; ctx.fillRect(cx, cy+5, 2, 6);
  }

  private dagger(ctx: CanvasRenderingContext2D, cx: number, cy: number, blade: string, grip: string) {
    ctx.fillStyle = blade;
    ctx.beginPath(); ctx.moveTo(cx, cy-12); ctx.lineTo(cx+3, cy+2); ctx.lineTo(cx-3, cy+2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = grip; ctx.fillRect(cx-1, cy+2, 2, 6);
  }

  private bow(ctx: CanvasRenderingContext2D, cx: number, cy: number, wood: string, grip: string) {
    ctx.strokeStyle = wood; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy+4, 14, 0.2, Math.PI-0.2); ctx.stroke();
    ctx.fillStyle = grip; ctx.fillRect(cx-2, cy-2, 4, 8);
    // Ciastawa
    ctx.strokeStyle = '#bb9060'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx-8, cy-8); ctx.lineTo(cx+8, cy-8); ctx.stroke();
  }

  private potion(ctx: CanvasRenderingContext2D, bottle: string, liquid: string, fill: number, shadow: string) {
    // Butelka
    ctx.fillStyle = shadow;
    ctx.fillRect(9, 10, 14, 18);
    ctx.fillStyle = bottle;
    ctx.fillRect(10, 10, 12, 18);
    // Szyjka
    ctx.fillRect(12, 6, 8, 6);
    ctx.fillStyle = '#604020'; ctx.fillRect(11, 5, 10, 3);
    // korek
    ctx.fillStyle = '#402008'; ctx.fillRect(12, 3, 8, 3);
    // Blik
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(11, 12, 2, 10);
    // Ciecz
    ctx.fillStyle = liquid;
    const h = 12*fill;
    ctx.fillRect(11, 26-h, 10, h);
    // Bąbelki
    this.dotCtx(ctx, 13, 26-h+3, 1, 'rgba(255,255,255,0.4)');
    this.dotCtx(ctx, 18, 26-h+5, 1, 'rgba(255,255,255,0.4)');
  }

  private dotCtx(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color?: string) {
    if (color) ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }

  private makeCreature(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = this.scene.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    if (!ctx) return;
    ctx.clearRect(0,0,w,h);
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(w/2, h-4, w*0.35, 4, 0, 0, Math.PI*2); ctx.fill();
    draw(ctx);
    canvas.refresh();
  }
}
