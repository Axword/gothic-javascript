/**
 * System przestępstw i kradzieży
 * 
 * NPC reagują tylko na faktycznie widziane czyny.
 * Eskalacja: ostrzeżenie → żądanie zwrotu → alarm → walka
 */
export class CrimeSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Próbuj okraść NPC (pickpocket)
   */
  tryPickpocket(
    thiefX: number, thiefY: number,
    npcX: number, npcY: number,
    skillRank: number,
    npcLevel: number
  ): { success: boolean; detected: boolean; message: string } {
    const dist = Phaser.Math.Distance.Between(thiefX, thiefY, npcX, npcY);
    if (dist > 40) {
      return { success: false, detected: false, message: 'Za daleko' };
    }

    // Base chance
    const baseChance = 0.2 + skillRank * 0.15 - (npcLevel - 1) * 0.05;
    const finalChance = Math.max(0.05, Math.min(0.95, baseChance));
    const roll = Math.random();

    if (roll < finalChance) {
      // Sukces!
      return { success: true, detected: false, message: 'Ukradzione! Nikt nie widział.' };
    } else if (roll < finalChance + 0.2) {
      // Nieudane, ale niezauważone
      return { success: false, detected: false, message: 'Nie udało się. Palce śliskie.' };
    } else {
      // Wykryty!
      return { success: false, detected: true, message: 'Złapany na gorącym uczynku!' };
    }
  }

  /**
   * Sprawdź czy NPC widzi przestępstwo (kradzież z pojemnika, podniesienie cudzego przedmiotu)
   */
  checkWitnesses(
    crimeX: number, crimeY: number,
    npcPositions: Array<{ x: number; y: number; isAlive: boolean }>,
    witnessThreshold: number = 200
  ): number[] {
    const witnesses: number[] = [];
    for (let i = 0; i < npcPositions.length; i++) {
      const npc = npcPositions[i];
      if (!npc.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(crimeX, crimeY, npc.x, npc.y);
      if (dist < witnessThreshold) {
        witnesses.push(i);
      }
    }
    return witnesses;
  }

  /**
   * Reakcja NPC na przestępstwo - eskalacja
   */
  escalateReaction(
    baseReaction: string,
    reputation: number,
    crimeCount: number
  ): 'warn' | 'demand' | 'call_guards' | 'attack' {
    if (crimeCount >= 3 || reputation < -50) return 'attack';
    if (crimeCount >= 2 || reputation < -20) return 'call_guards';
    if (crimeCount >= 1 || reputation < -10) return 'demand';
    return 'warn';
  }

  /**
   * Sys. alarms - alert nearby NPCs
   */
  alertNearby(
    sourceX: number, sourceY: number,
    npcs: Array<{ x: number; y: number; isAlive: boolean; faction?: string }>,
    alertRange: number = 300,
    faction?: string
  ): string[] {
    const alerted: string[] = [];
    for (const npc of npcs) {
      if (!npc.isAlive) continue;
      if (faction && npc.faction !== faction) continue;
      const dist = Phaser.Math.Distance.Between(sourceX, sourceY, npc.x, npc.y);
      if (dist < alertRange) {
        alerted.push(`${npc.x},${npc.y}`);
      }
    }
    return alerted;
  }
}
