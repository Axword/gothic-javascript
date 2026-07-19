/** Typ lokacji */
export type LocationType = 
  | 'town' | 'camp' | 'road' | 'forest' | 'swamp' | 'mountain' | 'beach' 
  | 'dungeon' | 'ruins' | 'cemetery' | 'cave' | 'special';

/** Poziom trudności lokacji */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

/** Warstwa tilemapy */
export interface TileLayer {
  name: string;
  data: number[][]; // 2D array tile IDs
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
}

/** Warstwa obiektów */
export interface ObjectLayer {
  name: string;
  objects: MapObject[];
}

/** Obiekt na mapie */
export interface MapObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, string | number | boolean>;
}

 /** Lokacja */
export interface Location {
  id: string;
  name: string;
  type: LocationType;
  description: string;
  difficulty: DifficultyLevel;
  tilemap: string; // ścieżka do pliku tilemapy
  tileset: string;
  music?: string;
  ambient_sound?: string;
  lighting: {
    ambient_light: number; // 0.0 - 1.0 (dzienna pora)
    night_ambient: number;
  };
  spawns: {
    monsters: string[]; // ID potworów
    npcs: string[]; // ID NPC
    items: string[]; // ID przedmiotów leżących
  };
  connections: Record<string, string>; // direction -> location_id (np. "north": "location_2")
  is_indoors: boolean;
  weather_enabled: boolean;
  player_start?: { x: number; y: number };
}

/** Marker na mapie */
export interface MapMarker {
  id: string;
  location_id: string;
  name: string;
  x: number;
  y: number;
  type: 'town' | 'dungeon' | 'landmark' | 'quest' | 'fast_travel';
  discovered: boolean;
}
