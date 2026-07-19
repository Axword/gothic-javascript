import { DamageType } from './items';

/** Tryb walki */
export type CombatMode = 'idle' | 'melee' | 'ranged' | 'magic';

/** Stan AI */
export type AIState = 'idle' | 'patrol' | 'alert' | 'chase' | 'attack' | 'flee' | 'return';

/** Typ potwora */
export type MonsterBehavior = 
  | 'aggressive' | 'territorial' | 'passive' | 'pack' | 'nocturnal' | 'ranged' | 'tank';

/** Gatunek potwora */
export interface MonsterData {
  id: string;
  name: string;
  description: string;
  stats: {
    hp: number;
    strength: number;
    dexterity: number;
    armor: number;
    speed: number;
    xp_reward: number;
  };
  attacks: MonsterAttack[];
  behavior: MonsterBehavior[];
  loot_table: string; // ID loot table
  biom: string[];
  asset_path: string;
  sprite: {
    width: number;
    height: number;
    frames: number;
  };
  scale?: number;
  night_active?: boolean;
  faction?: string;
}

/** Atak potwora */
export interface MonsterAttack {
  id: string;
  name: string;
  type: DamageType;
  damage: number;
  range: number;
  cooldown: number;
  windup: number; // ms przed atakiem
  area_effect?: number; // promień AOE
  projectile_speed?: number;
  effect?: string; // VFX ID
}

/** Pocisk */
export interface ProjectileData {
  id: string;
  type: 'arrow' | 'magic_fire' | 'magic_ice' | 'thrown';
  speed: number;
  damage: number;
  damage_type: DamageType;
  range: number;
  asset_path: string;
  vfx: string;
  pierce?: boolean;
  aoe_radius?: number;
}

/** Wynik ataku */
export interface AttackResult {
  hit: boolean;
  damage: number;
  damage_type: DamageType;
  critical: boolean;
  blocked: boolean;
  dodged: boolean;
  target_id: string;
  status_effects?: StatusEffect[];
}

/** Efekt statusu */
export interface StatusEffect {
  id: string;
  name: string;
  type: 'burn' | 'freeze' | 'poison' | 'stun' | 'slow';
  duration: number;
  value: number;
  tick_interval?: number; // ms między tickami
}

/** Czar */
export interface SpellData {
  id: string;
  name: string;
  description: string;
  type: 'fire' | 'ice';
  mana_cost: number;
  cast_time: number; // ms
  cooldown: number; // ms
  damage: number;
  damage_type: DamageType;
  range: number;
  projectile_speed: number;
  aoe_radius?: number;
  status_effect?: StatusEffect;
  asset_path: string;
  vfx_path: string;
  requirements?: {
    min_level?: number;
    quest_completed?: string[];
    mana_min?: number;
  };
}
