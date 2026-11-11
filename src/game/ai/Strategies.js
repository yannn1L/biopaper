/**
 * @file Strategies.js
 * Advanced Tactical AI System with Context-Aware Evaluation, Spacing / Anti-Swarm Separation,
 * Weapon Cooldown Timing, Dynamic Threat Avoidance, Hit-and-Run, and Flanking.
 */

import { CentralRegistry } from '../core/CentralRegistry.js';
import {
  TARGET_STRATEGY_IDS,
  MOTION_STRATEGY_IDS,
  MUTATION_IDS,
  INNATE_MUTATIONS,
  SUPPLY_MUTAGEN_IDS,
  SUPPLY_MUTAGENS,
  MUTATION_TYPES,
  ARENA_CENTER_X,
  ARENA_CENTER_Y,
} from '../core/Constants.js';
import { fastCos, fastSin, clamp } from '../core/MathLUT.js';

/**
 * -------------------------------------------------------------
 * 1. SHARED SPATIAL & TACTICAL UTILITIES
 * -------------------------------------------------------------
 */

/**
 * Computes a soft repulsion vector to prevent all units from clumping
 * into a single messy melee ball (anti-swarm separation).
 */
export function computeSeparationVector(unit, units, outSep, personalSpace = 135) {
  outSep.x = 0;
  outSep.y = 0;
  let count = 0;
  const pSpaceSq = personalSpace * personalSpace;

  for (let i = 0; i < units.length; i++) {
    const other = units[i];
    if (other === unit || !other.alive || other.isDropping) continue;
    const dx = unit.x - other.x;
    const dy = unit.y - other.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < pSpaceSq && dSq > 1) {
      const d = Math.sqrt(dSq);
      const strength = (personalSpace - d) / personalSpace; // 0 to 1
      outSep.x += (dx / d) * strength;
      outSep.y += (dy / d) * strength;
      count++;
    }
  }

  if (count > 0) {
    const mag = Math.hypot(outSep.x, outSep.y);
    if (mag > 0.001) {
      outSep.x /= mag;
      outSep.y /= mag;
    }
  }
}

/**
 * Steers inward away from the closing/static arena ring perimeter so units don't trap themselves.
 */
export function computeArenaBoundaryAvoidance(unit, arenaRadius, outWall) {
  outWall.x = 0;
  outWall.y = 0;
  const toCenterX = ARENA_CENTER_X - unit.x;
  const toCenterY = ARENA_CENTER_Y - unit.y;
  const distFromCenter = Math.hypot(toCenterX, toCenterY);
  const dangerZone = arenaRadius - 100;

  if (distFromCenter > dangerZone && distFromCenter > 1) {
    const penetration = (distFromCenter - dangerZone) / 100; // 0 to 1+
    outWall.x = (toCenterX / distFromCenter) * penetration * 1.5;
    outWall.y = (toCenterY / distFromCenter) * penetration * 1.5;
  }
}

/**
 * Finds the nearest active Supply Drop crate within maxDist.
 */
export function findNearestCrate(unit, crates, maxDist) {
  if (!crates || crates.length === 0) return null;
  let best = null;
  let minDSq = maxDist * maxDist;
  for (let i = 0; i < crates.length; i++) {
    const c = crates[i];
    if (!c.active) continue;
    const dx = c.x - unit.x;
    const dy = c.y - unit.y;
    const dSq = dx * dx + dy * dy;
    if (dSq < minDSq) {
      minDSq = dSq;
      best = c;
    }
  }
  return best;
}

/**
 * Returns true if unit has any ready primary melee attack off cooldown.
 */
export function isMeleeReady(unit) {
  for (let i = 0; i < unit.sockets.length; i++) {
    const skt = unit.sockets[i];
    if (!skt.mutationId) continue;
    const spec = INNATE_MUTATIONS[skt.mutationId] || SUPPLY_MUTAGENS[skt.mutationId];
    if (spec?.mutationType === MUTATION_TYPES.MELEE && skt.cooldownTimer <= 0) {
      return true;
    }
  }
  return false;
}

/**
 * Analyzes the specimen's equipped active mutation sockets to compare ranged vs melee weapons.
 * When specimen has more ranged mutations than melee, it prioritizes keeping its distance (kiting).
 * When specimen has more melee than ranged, it aggressively closes distance into strike range.
 */
export function getWeaponProfile(unit) {
  let rangedCount = 0;
  let meleeCount = 0;

  for (let i = 0; i < unit.sockets.length; i++) {
    const mid = unit.sockets[i].mutationId;
    if (!mid) continue;
    const spec = INNATE_MUTATIONS[mid] || SUPPLY_MUTAGENS[mid];
    if (!spec) continue;

    const mType = spec.mutationType;
    if (
      mType === MUTATION_TYPES.RANGED ||
      mType === MUTATION_TYPES.HOMING ||
      mType === MUTATION_TYPES.EFFECT
    ) {
      rangedCount++;
    } else if (mType === MUTATION_TYPES.MELEE) {
      meleeCount++;
    }
  }

  const isRangedDominant = rangedCount > meleeCount;
  const isMeleeDominant = meleeCount > rangedCount;
  // If tied or utility only: default based on whether any ranged exists
  const prefersDistance = isRangedDominant || (rangedCount > 0 && meleeCount === 0);

  return {
    rangedCount,
    meleeCount,
    isRangedDominant,
    isMeleeDominant,
    prefersDistance,
    // Ideal standoff distance in pixels
    idealMinDist: prefersDistance ? 210 : 45,
    idealMaxDist: prefersDistance ? 310 : 80,
  };
}

/**
 * Returns true if unit predominantly relies on ranged weapons (Acid Spitter, Venom Gland, Bombardier, Leech Maw).
 */
export function isRangedOriented(unit) {
  return getWeaponProfile(unit).prefersDistance;
}

function fallbackAnyLivingTarget(unit, units) {
  for (let i = 0; i < units.length; i++) {
    const other = units[i];
    if (other !== unit && other.alive && !other.isDropping) return other;
  }
  return null;
}

/**
 * -------------------------------------------------------------
 * 2. TARGETING STRATEGIES
 * -------------------------------------------------------------
 */

/**
 * 1. Nearest Target Strategy (With Crowd Penalty)
 * Instead of mindlessly locking onto whatever is 1px closer into a giant brawl,
 * weights distance plus an anti-cluster penalty if 3+ enemies are dogpiling.
 */
export class NearestTargetStrategy {
  selectTarget(unit, context) {
    const units = context.units;
    let bestTarget = null;
    let lowestScore = Infinity;

    for (let i = 0; i < units.length; i++) {
      const other = units[i];
      if (other === unit || !other.alive || other.isDropping || other.stealthTimer > 0) continue;
      const dx = other.x - unit.x;
      const dy = other.y - unit.y;
      const dist = Math.hypot(dx, dy);

      // Check density around candidate (avoid walking into a 4-way blender)
      let crowdCount = 0;
      for (let j = 0; j < units.length; j++) {
        const neighbor = units[j];
        if (neighbor !== other && neighbor.alive && !neighbor.isDropping) {
          if (Math.hypot(neighbor.x - other.x, neighbor.y - other.y) < 110) {
            crowdCount++;
          }
        }
      }

      const score = dist + crowdCount * 65;
      if (score < lowestScore) {
        lowestScore = score;
        bestTarget = other;
      }
    }
    return bestTarget || fallbackAnyLivingTarget(unit, units);
  }
}

/**
 * 2. Lowest HP Hunt (Opportunistic Finisher)
 * Prioritizes low HP units that are vulnerable to steal their genetic organs.
 */
export class LowestHPTargetStrategy {
  selectTarget(unit, context) {
    const units = context.units;
    let bestTarget = null;
    let lowestScore = Infinity;

    for (let i = 0; i < units.length; i++) {
      const other = units[i];
      if (other === unit || !other.alive || other.isDropping || other.stealthTimer > 0) continue;
      const dx = other.x - unit.x;
      const dy = other.y - unit.y;
      const dist = Math.hypot(dx, dy);
      const hpRatio = other.hp / other.maxHp;

      // Heavy priority on low HP, but don't sprint all the way across the arena if an easy target is nearby
      const score = hpRatio * 750 + dist * 0.45;
      if (score < lowestScore) {
        lowestScore = score;
        bestTarget = other;
      }
    }
    return bestTarget || fallbackAnyLivingTarget(unit, units);
  }
}

/**
 * 3. Apex Threat Hunter
 * Identifies the raid boss in the arena (most mutations/fusions/Gigantism) to contest victory.
 */
export class ApexPredatorStrategy {
  selectTarget(unit, context) {
    const units = context.units;
    let bestTarget = null;
    let highestThreat = -Infinity;

    for (let i = 0; i < units.length; i++) {
      const other = units[i];
      if (other === unit || !other.alive || other.isDropping || other.stealthTimer > 0) continue;
      const dx = other.x - unit.x;
      const dy = other.y - unit.y;
      const dist = Math.hypot(dx, dy);
      const mutationCount = other.getTotalMutationScore();
      const gigantismBonus = other.hasGigantism ? 8 : 0;
      const score = (mutationCount + gigantismBonus) * 260 - dist * 0.3;
      if (score > highestThreat) {
        highestThreat = score;
        bestTarget = other;
      }
    }
    return bestTarget || fallbackAnyLivingTarget(unit, units);
  }
}

/**
 * 4. Tactical Opportunist Strategy (NEW)
 * Evaluates match-ups dynamically:
 * - If unit has ranged weapons, targets slow/heavy tanks or melee brawlers it can safely exploit.
 * - If unit has melee, targets isolated enemies or distracted fighters rather than engaging clumps.
 */
export class TacticalOpportunistStrategy {
  selectTarget(unit, context) {
    const units = context.units;
    let bestTarget = null;
    let highestScore = -Infinity;
    const amRanged = isRangedOriented(unit);

    for (let i = 0; i < units.length; i++) {
      const other = units[i];
      if (other === unit || !other.alive || other.isDropping || other.stealthTimer > 0) continue;
      const dist = Math.hypot(other.x - unit.x, other.y - unit.y);

      let score = 500 - dist * 0.5;

      // Advantage evaluation: if we are ranged and other is melee, huge bonus
      const otherProfile = getWeaponProfile(other);
      const otherIsMelee = otherProfile.meleeCount > 0;
      if (amRanged && otherIsMelee) {
        score += 240; // Free kiting advantage
      }

      // Bonus if target is currently stunned or fleeing
      if (other.stunTimer > 0) score += 200;
      if (other.hp / other.maxHp < 0.3) score += 180;

      // Severe penalty if target has Spiky Carapace reflection and we are melee
      if (!amRanged && other.meleeReflectRatio > 0) {
        score -= 220;
      }

      if (score > highestScore) {
        highestScore = score;
        bestTarget = other;
      }
    }
    return bestTarget || fallbackAnyLivingTarget(unit, units);
  }
}

/**
 * 5. Threat Avoidance Target Strategy (NEW)
 * Avoids direct confrontation with high-damage dangerous organisms (e.g. Gigantism or Spiky Carapace)
 * and picks safer, winnable skirmishes.
 */
export class ThreatAvoidanceTargetStrategy {
  selectTarget(unit, context) {
    const units = context.units;
    let bestTarget = null;
    let lowestThreatScore = Infinity;

    for (let i = 0; i < units.length; i++) {
      const other = units[i];
      if (other === unit || !other.alive || other.isDropping || other.stealthTimer > 0) continue;
      const dist = Math.hypot(other.x - unit.x, other.y - unit.y);

      let threat = other.mass * 40 + (other.hasGigantism ? 200 : 0);
      if (other.meleeReflectRatio > 0) threat += 150;
      if (getWeaponProfile(other).meleeCount > 0) threat += 80;

      const score = threat * 1.5 + dist * 0.4 + (other.hp / other.maxHp) * 200;
      if (score < lowestThreatScore) {
        lowestThreatScore = score;
        bestTarget = other;
      }
    }
    return bestTarget || fallbackAnyLivingTarget(unit, units);
  }
}

/**
 * -------------------------------------------------------------
 * 3. MOVEMENT & LOCOMOTION STRATEGIES
 * -------------------------------------------------------------
 */

const tempSep = { x: 0, y: 0 };
const tempWall = { x: 0, y: 0 };

/**
 * 1. Direct Charge Strategy (Refined with Spacing & Smart Approach)
 * Closes in aggressively when weapons or burst dash are ready, but uses lateral
 * weave and soft peer separation instead of stacking on top of other units.
 */
/**
 * 1. Direct Charge / Approach Strategy
 * - When specimen has MORE MELEE than ranged: relentlessly closes the gap to melee strike distance (< 60px).
 * - When specimen has MORE RANGED than melee: does NOT mindlessly slam into melee; instead holds ideal bombardment range (200px - 280px) and kites.
 */
export class DirectChargeStrategy {
  computeDesiredVelocity(unit, target, context, outVel) {
    const crate = findNearestCrate(unit, context.crates, 190);
    const goal = crate || target;

    if (!goal) {
      outVel.x = fastCos(unit.rotation) * unit.getEffectiveSpeed() * 0.4;
      outVel.y = fastSin(unit.rotation) * unit.getEffectiveSpeed() * 0.4;
      return;
    }

    const dx = goal.x - unit.x;
    const dy = goal.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const maxSpd = unit.getEffectiveSpeed();
    const nx = dx / dist;
    const ny = dy / dist;

    // Check weapon balance profile
    const profile = getWeaponProfile(unit);

    let radial = 1.0;
    if (!crate) {
      if (profile.isRangedDominant) {
        // Specimen has more ranged mutations: KEEP DISTANCE!
        if (dist < profile.idealMinDist) {
          radial = -1.2; // Back away firmly from approaching enemy
        } else if (dist > profile.idealMaxDist) {
          radial = 0.85; // Approach slightly into firing range
        } else {
          radial = 0.0; // In ideal firing pocket
        }
      } else {
        // Specimen has more melee mutations: close the gap into pincer strike range!
        radial = 1.25;
      }
    }

    computeSeparationVector(unit, context.units, tempSep, profile.prefersDistance ? 150 : 95);
    computeArenaBoundaryAvoidance(unit, context.currentArenaRadius, tempWall);

    // Lateral weave/orbit component
    const orbitSign = unit.orbitDirection || 1;
    const perpX = -ny * orbitSign;
    const perpY = nx * orbitSign;
    const lateralWeight = profile.isRangedDominant ? 0.85 : 0.25;

    let vx = nx * radial + perpX * lateralWeight + tempSep.x * 0.75 + tempWall.x * 0.9;
    let vy = ny * radial + perpY * lateralWeight + tempSep.y * 0.75 + tempWall.y * 0.9;
    const mag = Math.hypot(vx, vy) || 1;

    outVel.x = (vx / mag) * maxSpd;
    outVel.y = (vy / mag) * maxSpd;
  }
}

/**
 * 2. Kiting & Strafe Strategy
 * - When specimen has MORE RANGED than melee: maintains 220px - 320px standoff range, rapidly backpedaling if enemies rush.
 * - When specimen has MORE MELEE than ranged: orbits into a blind spot then lunges directly into point-blank range.
 */
export class KitingStrafeStrategy {
  computeDesiredVelocity(unit, target, context, outVel) {
    const crate = findNearestCrate(unit, context.crates, 210);
    if (crate) {
      const dx = crate.x - unit.x;
      const dy = crate.y - unit.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = unit.getEffectiveSpeed();
      outVel.x = (dx / d) * spd;
      outVel.y = (dy / d) * spd;
      return;
    }

    if (!target) {
      outVel.x = 0;
      outVel.y = 0;
      return;
    }

    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    const profile = getWeaponProfile(unit);
    const targetHasMelee = getWeaponProfile(target).meleeCount > 0 || target.hasGigantism;

    let idealMin = profile.prefersDistance ? 210 : 50;
    let idealMax = profile.prefersDistance ? 310 : 85;

    if (profile.isRangedDominant && targetHasMelee) {
      // Extra safety cushion against rushing melee monsters
      idealMin = 240;
      idealMax = 340;
    }

    let radialFactor = 0;
    if (profile.prefersDistance) {
      // Ranged dominant: Keep distance at all costs
      if (dist < idealMin) {
        radialFactor = -1.35; // Intense backpedal
      } else if (dist > idealMax) {
        radialFactor = 0.85;
      }
    } else {
      // Melee dominant: Dive into claw reach!
      radialFactor = dist > 55 ? 1.25 : 0.1;
    }

    // Tangential orbit component
    const orbitSign = unit.orbitDirection || 1;
    const tx = -ny * orbitSign;
    const ty = nx * orbitSign;

    computeSeparationVector(unit, context.units, tempSep, profile.prefersDistance ? 150 : 100);
    computeArenaBoundaryAvoidance(unit, context.currentArenaRadius, tempWall);

    const spd = unit.getEffectiveSpeed();
    let vx = nx * radialFactor + tx * 0.9 + tempSep.x * 0.85 + tempWall.x * 1.1;
    let vy = ny * radialFactor + ty * 0.9 + tempSep.y * 0.85 + tempWall.y * 1.1;
    const mag = Math.hypot(vx, vy) || 1;

    outVel.x = (vx / mag) * spd;
    outVel.y = (vy / mag) * spd;
  }
}

/**
 * 3. Flee & Loot Strategy (Defensive Survival Arc)
 * Prioritizes perimeter survival and supplies when endangered, engages opportunistically when safe.
 */
export class FleeWhenLowStrategy {
  computeDesiredVelocity(unit, target, context, outVel) {
    const hpRatio = unit.hp / unit.maxHp;
    const spd = unit.getEffectiveSpeed();
    const profile = getWeaponProfile(unit);

    // Flee threshold
    if (hpRatio < 0.35) {
      const crate = findNearestCrate(unit, context.crates, 9999);
      if (crate) {
        const dx = crate.x - unit.x;
        const dy = crate.y - unit.y;
        const d = Math.hypot(dx, dy) || 1;
        computeSeparationVector(unit, context.units, tempSep, 130);
        const vx = (dx / d) + tempSep.x * 0.5;
        const vy = (dy / d) + tempSep.y * 0.5;
        const mag = Math.hypot(vx, vy) || 1;
        outVel.x = (vx / mag) * spd;
        outVel.y = (vy / mag) * spd;
        return;
      }

      if (target) {
        const awayX = unit.x - target.x;
        const awayY = unit.y - target.y;
        const dist = Math.hypot(awayX, awayY) || 1;

        computeSeparationVector(unit, context.units, tempSep, 160);
        computeArenaBoundaryAvoidance(unit, context.currentArenaRadius, tempWall);

        const vx = (awayX / dist) * 1.1 + tempSep.x * 0.9 + tempWall.x * 1.3;
        const vy = (awayY / dist) * 1.1 + tempSep.y * 0.9 + tempWall.y * 1.3;
        const mag = Math.hypot(vx, vy) || 1;
        outVel.x = (vx / mag) * spd;
        outVel.y = (vy / mag) * spd;
        return;
      }
    }

    // When healthy, skirmish respecting ranged vs melee profile
    const nearbyCrate = findNearestCrate(unit, context.crates, 260);
    const goal = nearbyCrate || target;
    if (!goal) {
      outVel.x = fastCos(unit.rotation) * spd * 0.3;
      outVel.y = fastSin(unit.rotation) * spd * 0.3;
      return;
    }

    const dx = goal.x - unit.x;
    const dy = goal.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    let radial = 1.0;
    if (!nearbyCrate && profile.prefersDistance) {
      if (dist < profile.idealMinDist) {
        radial = -1.2;
      } else if (dist > profile.idealMaxDist) {
        radial = 0.8;
      } else {
        radial = 0.0;
      }
    }

    computeSeparationVector(unit, context.units, tempSep, profile.prefersDistance ? 145 : 105);
    computeArenaBoundaryAvoidance(unit, context.currentArenaRadius, tempWall);

    const vx = nx * radial + tempSep.x * 0.7 + tempWall.x * 0.85;
    const vy = ny * radial + tempSep.y * 0.7 + tempWall.y * 0.85;
    const mag = Math.hypot(vx, vy) || 1;

    outVel.x = (vx / mag) * spd;
    outVel.y = (vy / mag) * spd;
  }
}

/**
 * 4. Hit-and-Run Ambush Strategy
 * - If MORE RANGED: permanently avoids melee proximity and shoots from afar.
 * - If MORE MELEE: strikes aggressively when weapons/dash are ready, then retreats to recharge.
 */
export class HitAndRunMotionStrategy {
  computeDesiredVelocity(unit, target, context, outVel) {
    const crate = findNearestCrate(unit, context.crates, 180);
    if (crate) {
      const dx = crate.x - unit.x;
      const dy = crate.y - unit.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = unit.getEffectiveSpeed();
      outVel.x = (dx / d) * spd;
      outVel.y = (dy / d) * spd;
      return;
    }

    if (!target) {
      outVel.x = 0;
      outVel.y = 0;
      return;
    }

    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    const spd = unit.getEffectiveSpeed();
    const profile = getWeaponProfile(unit);

    let radial = 0;
    if (profile.isRangedDominant) {
      // Ranged specimens don't dive in; they keep their distance and fire continuously
      if (dist < profile.idealMinDist) {
        radial = -1.3;
      } else if (dist > profile.idealMaxDist) {
        radial = 0.85;
      }
    } else {
      // Melee specimens: dive in when ready to strike, then disengage
      const readyToStrike = isMeleeReady(unit) || unit.critReady || unit.dashBoostTimer > 0;
      if (readyToStrike) {
        radial = 1.35;
      } else {
        radial = dist < 180 ? -1.25 : 0.05;
      }
    }

    // Juke laterally
    const perpX = -ny * (unit.orbitDirection || 1);
    const perpY = nx * (unit.orbitDirection || 1);

    computeSeparationVector(unit, context.units, tempSep, profile.prefersDistance ? 150 : 120);
    computeArenaBoundaryAvoidance(unit, context.currentArenaRadius, tempWall);

    const vx = nx * radial + perpX * 0.8 + tempSep.x * 0.75 + tempWall.x * 1.0;
    const vy = ny * radial + perpY * 0.8 + tempSep.y * 0.75 + tempWall.y * 1.0;
    const mag = Math.hypot(vx, vy) || 1;

    outVel.x = (vx / mag) * spd;
    outVel.y = (vy / mag) * spd;
  }
}

/**
 * 5. Stalker Flank Motion Strategy
 * - If MORE RANGED: flanks to an unobstructed angle and keeps distance (200px - 280px).
 * - If MORE MELEE: slips behind target's back to deliver surprise claw strikes.
 */
export class StalkerFlankMotionStrategy {
  computeDesiredVelocity(unit, target, context, outVel) {
    const crate = findNearestCrate(unit, context.crates, 200);
    if (crate) {
      const dx = crate.x - unit.x;
      const dy = crate.y - unit.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = unit.getEffectiveSpeed();
      outVel.x = (dx / d) * spd;
      outVel.y = (dy / d) * spd;
      return;
    }

    if (!target) {
      outVel.x = 0;
      outVel.y = 0;
      return;
    }

    const profile = getWeaponProfile(unit);
    const targetFacing = target.rotation;

    // Stalking flank standoff: ranged stays far behind (220px), melee sneaks close behind (65px)
    const flankDist = profile.prefersDistance
      ? 230
      : target.getRadius() + unit.getRadius() + 25;

    const flankTargetX = target.x - Math.cos(targetFacing) * flankDist;
    const flankTargetY = target.y - Math.sin(targetFacing) * flankDist;

    const dx = flankTargetX - unit.x;
    const dy = flankTargetY - unit.y;
    const distToFlank = Math.hypot(dx, dy) || 1;
    const spd = unit.getEffectiveSpeed();

    computeSeparationVector(unit, context.units, tempSep, profile.prefersDistance ? 145 : 110);
    computeArenaBoundaryAvoidance(unit, context.currentArenaRadius, tempWall);

    const vx = (dx / distToFlank) * 1.1 + tempSep.x * 0.75 + tempWall.x * 0.9;
    const vy = (dy / distToFlank) * 1.1 + tempSep.y * 0.75 + tempWall.y * 0.9;
    const mag = Math.hypot(vx, vy) || 1;

    outVel.x = (vx / mag) * spd;
    outVel.y = (vy / mag) * spd;
  }
}

/**
 * -------------------------------------------------------------
 * 4. REGISTRATION
 * -------------------------------------------------------------
 */
export function registerAllStrategies() {
  CentralRegistry.registerTargetStrategy(TARGET_STRATEGY_IDS.NEAREST, new NearestTargetStrategy());
  CentralRegistry.registerTargetStrategy(TARGET_STRATEGY_IDS.LOWEST_HP, new LowestHPTargetStrategy());
  CentralRegistry.registerTargetStrategy(TARGET_STRATEGY_IDS.APEX_PREDATOR, new ApexPredatorStrategy());
  CentralRegistry.registerTargetStrategy(TARGET_STRATEGY_IDS.TACTICAL_OPPORTUNIST, new TacticalOpportunistStrategy());
  CentralRegistry.registerTargetStrategy(TARGET_STRATEGY_IDS.THREAT_AVOIDANCE, new ThreatAvoidanceTargetStrategy());

  CentralRegistry.registerMotionStrategy(MOTION_STRATEGY_IDS.DIRECT_CHARGE, new DirectChargeStrategy());
  CentralRegistry.registerMotionStrategy(MOTION_STRATEGY_IDS.KITING_STRAFE, new KitingStrafeStrategy());
  CentralRegistry.registerMotionStrategy(MOTION_STRATEGY_IDS.FLEE_WHEN_LOW, new FleeWhenLowStrategy());
  CentralRegistry.registerMotionStrategy(MOTION_STRATEGY_IDS.HIT_AND_RUN, new HitAndRunMotionStrategy());
  CentralRegistry.registerMotionStrategy(MOTION_STRATEGY_IDS.STALKER_FLANK, new StalkerFlankMotionStrategy());
}
