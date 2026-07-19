/** Kategorie przedmiotów */
export type ItemCategory = 
  | 'weapon_sword' | 'weapon_bow' | 'armor' | 'plant' | 'potion'
  | 'trophy' | 'ammo' | 'lockpick' | 'currency' | 'key' | 'quest_item' | 'misc';

/** Typ obrażeń */
export type DamageType = 'physical' | 'fire' | 'ice' | 'magic';

/** Podstawowe wymagania przedmiotu */
export interface ItemRequirement {
  strength?: number;
  dexterity?: number;
  level?: number;
  faction?: string;
  quest_completed?: string;
}

/** Baza dla wszystkich przedmiotów */
export interface ItemBase {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  value: number;
  weight: number;
  icon: string;
  asset_path?: string;
  requirements?: ItemRequirement;
  quest_item?: boolean;
  unique?: boolean;
}

/** Miecz */
export interface SwordItem extends ItemBase {
  category: 'weapon_sword';
  damage: number;
  damage_type: DamageType;
  speed: number; // ms między atakami
  range: number; // w pikselach
  strength_scaling: number; // 0.0 - 1.0
  combo_length?: number; // ile ataków w combo
}

/** Łuk */
export interface BowItem extends ItemBase {
  category: 'weapon_bow';
  damage: number;
  damage_type: DamageType;
  draw_time: number; // ms pełnego naciągu
  range: number;
  dexterity_scaling: number;
  arrow_type?: string;
}

/** Zbroja */
export interface ArmorItem extends ItemBase {
  category: 'armor';
  armor: number;
  magic_resist: number;
  faction?: string;
  slot: 'chest' | 'head' | 'legs';
}

/** Roślina */
export interface PlantItem extends ItemBase {
  category: 'plant';
  effect: string;
  effect_value: number;
  effect_duration?: number;
  biom: string;
  rarity: 'common' | 'uncommon' | 'rare';
}

/** Mikstura */
export interface PotionItem extends ItemBase {
  category: 'potion';
  effect: 'heal' | 'mana' | 'stamina' | 'buff_strength' | 'buff_dexterity' | 'poison' | 'antidote' | 'cure';
  effect_value: number;
  effect_duration?: number;
}

/** Trofeum */
export interface TrophyItem extends ItemBase {
  category: 'trophy';
  source_monster: string;
  used_in_crafting?: boolean;
  crafted_item?: string;
}

/** Amunicja, wytrychy, waluta, klucze, przedmioty questowe */
export interface MiscItem extends ItemBase {
  category: 'ammo' | 'lockpick' | 'currency' | 'key' | 'quest_item' | 'misc';
  stackable?: boolean;
  max_stack?: number;
  ammo_type?: string;
  lockpick_level?: number; // 1-3
}

/** Suma typów przedmiotu */
export type GameItem = SwordItem | BowItem | ArmorItem | PlantItem | PotionItem | TrophyItem | MiscItem;
