/**
 * @file Constants.js
 * Source-of-truth constants, color palette, chassis specs, and mutation definitions
 * strictly following the BioPaper Arena GDD.
 */

export const DESIGN_WIDTH = 1080;
export const DESIGN_HEIGHT = 1920;
export const ARENA_CENTER_X = DESIGN_WIDTH * 0.5;
export const ARENA_CENTER_Y = 760;
export const ARENA_RADIUS = 475;

export const PALETTE = {
  ARENA_BACKDROP: 0x2B2D42,     // Dark Slate Paper
  ARENA_FLOOR: 0xF4ECD8,        // Parchment / Blueprint Wood Base
  ARENA_FLOOR_RING: 0xDFD3B8,   // Concentric porous ring engraving
  OUTLINE_STROKE: 0x1A1D20,     // 4px Thick Cartoon Ink Stroke
  CIRCLE_CHASSIS: 0xFF6B6B,     // Coral Red
  TRIANGLE_CHASSIS: 0x4D96FF,   // Cyan Blue
  RECTANGLE_CHASSIS: 0x6BCB77,  // Pastel Emerald
  VENOM_ACID: 0x00F5D4,         // Neon Toxic Green
  SUPPLY_PARASITE: 0x9B5DE5,    // Deep Bioluminescent Purple
  CRATE_CARDBOARD: 0xE0A96D,    // Cardboard Supply Crate
  PARACHUTE_RED: 0xFF4D6D,      // Parachute Red Stripe
  PARACHUTE_WHITE: 0xFFF8F0,    // Parachute White Stripe
  HIT_FLASH: 0xFFFFFF,          // 1-Frame Pure White Hit Flash
  GOLD_CROWN: 0xFFD166,         // Winner / Level 2 Accent
};

export const CHASSIS_TYPES = {
  CIRCLE: 'CIRCLE',
  TRIANGLE: 'TRIANGLE',
  RECTANGLE: 'RECTANGLE',
  PENTAGON: 'PENTAGON',
  TUBE: 'TUBE',
};

// 16 distinct juicy papercraft colors so each organism in the arena has a completely unique color
export const UNIT_PALETTE = [
  0xFF6B6B, // 1. Coral Crimson
  0x4D96FF, // 2. Cobalt Cyan
  0x6BCB77, // 3. Pastel Emerald
  0xFFD166, // 4. Mustard Gold
  0x9B5DE5, // 5. Vivid Amethyst
  0xF15BB5, // 6. Bubblegum Pink
  0x00F5D4, // 7. Neon Turquoise
  0xFB5607, // 8. Tangelo Orange
  0xB5651D, // 9. Cinnamon Copper Bronze (distinct from #2)
  0x606C38, // 10. Olive Moss Forest (distinct from #5)
  0x06D6A0, // 11. Mint Jade
  0xEF476F, // 12. Watermelon Rose
  0x118AB2, // 13. Ocean Blue
  0xFFB703, // 14. Amber Sunshine
  0x70E000, // 15. Lime Green
  0xE76F51, // 16. Burnt Sienna Terracotta
];

/**
 * Section 3.1: Chassis Variants & Socket Layouts
 * Base HP increased by 300% (new HP = original * 4):
 * Circle: 120 -> 480
 * Triangle: 85 -> 340
 * Soft Rectangle: 220 -> 880
 * Pentagon: 160 -> 640
 * Tube: 140 -> 560
 */
export const CHASSIS_SPECS = {
  [CHASSIS_TYPES.CIRCLE]: {
    id: CHASSIS_TYPES.CIRCLE,
    name: 'Circle',
    color: PALETTE.CIRCLE_CHASSIS,
    mass: 1.0,
    baseHp: 480,
    speed: 260,
    radius: 36,
    restitution: 0.92,
    knockbackResist: 0.0,
    socketCount: 4,
    // Forward-offset eyes so dorsal organs sit cleanly behind them
    eyeOffsets: [
      { x: 20, y: -11, r: 7.5 },
      { x: 20, y: 11, r: 7.5 },
    ],
    // Angles in radians relative to facing direction (0 = right/front)
    sockets: [
      { id: 0, role: 'dorsal', zone: 'dorsal', isDorsal: true, x: -9, y: 0, angle: -Math.PI * 0.5, dist: 10 }, // Top Dorsal Mount (behind eyes)
      { id: 1, role: 'weapon', zone: 'front', angle: 0, dist: 36 },                                            // Front Melee Nose
      { id: 2, role: 'mobility', zone: 'rear', angle: Math.PI, dist: 35 },                                     // Rear Propulsion Tail
      { id: 3, role: 'flank', zone: 'flank', angle: Math.PI * 0.55, dist: 34 },                                // Lateral Side Flank
    ],
  },
  [CHASSIS_TYPES.TRIANGLE]: {
    id: CHASSIS_TYPES.TRIANGLE,
    name: 'Triangle',
    color: PALETTE.TRIANGLE_CHASSIS,
    mass: 0.7,
    baseHp: 340,
    speed: 310,
    radius: 35,
    restitution: 0.85,
    knockbackResist: 0.0,
    nosePierceBonus: 0.25,
    socketCount: 3,
    eyeOffsets: [
      { x: 14, y: -9.5, r: 6.8 },
      { x: 14, y: 9.5, r: 6.8 },
    ],
    sockets: [
      { id: 0, role: 'dorsal', zone: 'dorsal', isDorsal: true, x: -11, y: 0, angle: -Math.PI * 0.65, dist: 12 }, // Dorsal Back Mount
      { id: 1, role: 'weapon', zone: 'front', angle: 0, dist: 40 },                                              // Sharp Front Nose
      { id: 2, role: 'mobility', zone: 'rear', angle: Math.PI, dist: 28 },                                       // Flat Rear / Flank
    ],
  },
  [CHASSIS_TYPES.RECTANGLE]: {
    id: CHASSIS_TYPES.RECTANGLE,
    name: 'Soft Rectangle',
    color: PALETTE.RECTANGLE_CHASSIS,
    mass: 2.4,
    baseHp: 880,
    speed: 160,
    radius: 42,
    restitution: 0.65,
    knockbackResist: 0.55,
    socketCount: 6,
    eyeOffsets: [
      { x: 25, y: -12.5, r: 8.0 },
      { x: 25, y: 12.5, r: 8.0 },
    ],
    sockets: [
      { id: 0, role: 'dorsal', zone: 'dorsal', isDorsal: true, x: -10, y: 0, angle: -Math.PI * 0.5, dist: 10 }, // Dorsal Center-Rear
      { id: 1, role: 'weapon', zone: 'front', angle: 0, dist: 40 },                                              // Front Main Jaw
      { id: 2, role: 'mobility', zone: 'rear', angle: Math.PI, dist: 40 },                                       // Rear Thruster
      { id: 3, role: 'flank', zone: 'flank', angle: Math.PI * 0.5, dist: 35 },                                   // Right Lateral Flank
      { id: 4, role: 'flank', zone: 'flank', angle: -Math.PI * 0.5, dist: 35 },                                  // Left Lateral Flank
      { id: 5, role: 'aux_front', zone: 'front', angle: Math.PI * 0.22, dist: 42 },                              // Front-Right Assault Corner
    ],
  },
  [CHASSIS_TYPES.PENTAGON]: {
    id: CHASSIS_TYPES.PENTAGON,
    name: 'Pentagon',
    color: 0x9B5DE5,
    mass: 1.4,
    baseHp: 640,
    speed: 230,
    radius: 39,
    restitution: 0.80,
    knockbackResist: 0.25,
    socketCount: 5,
    eyeOffsets: [
      { x: 21, y: -10.5, r: 7.2 },
      { x: 21, y: 10.5, r: 7.2 },
    ],
    sockets: [
      { id: 0, role: 'dorsal', zone: 'dorsal', isDorsal: true, x: -8, y: 0, angle: -Math.PI * 0.5, dist: 8 }, // Dorsal Crystal Crown
      { id: 1, role: 'weapon', zone: 'front', angle: 0, dist: 40 },                                           // Front Apex Vertex
      { id: 2, role: 'mobility', zone: 'rear', angle: Math.PI, dist: 36 },                                    // Rear Base
      { id: 3, role: 'flank', zone: 'flank', angle: -Math.PI * 0.62, dist: 36 },                              // Upper-Rear Shoulder Flank
      { id: 4, role: 'flank', zone: 'flank', angle: Math.PI * 0.62, dist: 36 },                               // Lower-Rear Shoulder Flank
    ],
  },
  [CHASSIS_TYPES.TUBE]: {
    id: CHASSIS_TYPES.TUBE,
    name: 'Tube Capsule',
    color: 0x00BBF9,
    mass: 1.2,
    baseHp: 560,
    speed: 250,
    radius: 37,
    restitution: 0.88,
    knockbackResist: 0.15,
    socketCount: 4,
    eyeOffsets: [
      { x: 27, y: -8.5, r: 6.8 },
      { x: 27, y: 8.5, r: 6.8 },
    ],
    sockets: [
      { id: 0, role: 'dorsal', zone: 'dorsal', isDorsal: true, x: -8, y: 0, angle: -Math.PI * 0.5, dist: 8 }, // Dorsal Spine Ridge
      { id: 1, role: 'weapon', zone: 'front', angle: 0, dist: 44 },                                           // Front Capsule Nose
      { id: 2, role: 'mobility', zone: 'rear', angle: Math.PI, dist: 44 },                                    // Rear Capsule Thruster
      { id: 3, role: 'flank', zone: 'flank', angle: Math.PI * 0.5, dist: 28 },                                // Lateral Tube Pod
    ],
  },
};

/**
 * Mutation Classification Types
 * melee: Close-range physical strikes / pincers / jaws / drills
 * ranged: Direct projectile spitters / spines / web shooters
 * homing: Seeking organic spores / guided hornets
 * effect: AoE clouds, radiation, magnetic pulses, frost
 * utils: Dash fins, stealth eyes, regenerative sacs, shell armor
 */
export const MUTATION_TYPES = {
  MELEE: 'melee',
  RANGED: 'ranged',
  HOMING: 'homing',
  EFFECT: 'effect',
  UTILS: 'utils',
};

/**
 * Section 4.1 & Expansion: Mutations Catalog (16 Total Unique Mutations)
 */
export const MUTATION_IDS = {
  // Original 4
  BIO_PINCER: 'BIO_PINCER',
  ACID_SPITTER: 'ACID_SPITTER',
  VENOM_GLAND: 'VENOM_GLAND',
  CILIA_FLAGELLA: 'CILIA_FLAGELLA',

  // 12 New Unique Mutations
  MANTIS_SCYTHE: 'MANTIS_SCYTHE',       // MELEE: high crit folding blade
  SPIRAL_DRILL: 'SPIRAL_DRILL',         // MELEE: rapid drill multihit
  BONE_SPEAR: 'BONE_SPEAR',             // MELEE: thrusting piercer reach
  QUILL_VOLLEY: 'QUILL_VOLLEY',         // RANGED: fast 3-quill burst
  PLASMA_SIPHON: 'PLASMA_SIPHON',       // RANGED: linear energy laser beam
  SPORE_HOMER: 'SPORE_HOMER',           // HOMING: curved heat-seeking seeker spore
  HORNET_NEST: 'HORNET_NEST',           // HOMING: swarming guided mini paper hornets
  SHOCK_PULSAR: 'SHOCK_PULSAR',         // EFFECT: electric stun wave
  FROST_AURA: 'FROST_AURA',             // EFFECT: chilling slow field
  CHITIN_CARAPACE: 'CHITIN_CARAPACE',   // UTILS: reinforced paper armor plating
  SPRING_TENDON: 'SPRING_TENDON',       // UTILS: elastic recoil leap
  REGEN_BLADDER: 'REGEN_BLADDER',       // UTILS: passive restorative organ
};

export const INNATE_MUTATIONS = {
  // 1. BIO_PINCER (MELEE -> FRONT)
  [MUTATION_IDS.BIO_PINCER]: {
    id: MUTATION_IDS.BIO_PINCER,
    name: 'Bio-Pincer',
    desc: 'Crushing pincer stuns foes',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.MELEE,
    mountZone: 'front',
    preferredSocket: 1,
    range: 60,
    damage: 25,
    stunDuration: 0.25,
    cooldown: 0.75,
    knockback: 320,
    color: 0xFF8A5B,
  },
  // 2. ACID_SPITTER (RANGED -> FLANK / SIDE)
  [MUTATION_IDS.ACID_SPITTER]: {
    id: MUTATION_IDS.ACID_SPITTER,
    name: 'Acid Spitter',
    desc: 'Spits curving corrosive globs',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.RANGED,
    mountZone: 'flank',
    preferredSocket: 3,
    cooldown: 1.4,
    damage: 18,
    projectileSpeed: 460,
    range: 420,
    color: PALETTE.VENOM_ACID,
  },
  // 3. VENOM_GLAND (EFFECT -> DORSAL TOP MOUNT)
  [MUTATION_IDS.VENOM_GLAND]: {
    id: MUTATION_IDS.VENOM_GLAND,
    name: 'Venom Gland',
    desc: 'Emits toxic poison clouds',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.EFFECT,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    cooldown: 3.0,
    radius: 120,
    dotDamagePerSec: 5,
    dotDuration: 4.0,
    color: PALETTE.VENOM_ACID,
  },
  // 4. CILIA_FLAGELLA (UTILS -> REAR TAIL)
  [MUTATION_IDS.CILIA_FLAGELLA]: {
    id: MUTATION_IDS.CILIA_FLAGELLA,
    name: 'Cilia Flagella',
    desc: 'Sudden explosive speed bursts',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.UTILS,
    mountZone: 'rear',
    preferredSocket: 2,
    cooldown: 1.8,
    speedBoostMultiplier: 3.0,
    boostDuration: 0.4,
    color: 0xFFD166,
  },

  // --- 12 NEW UNIQUE MUTATIONS ---

  // 5. MANTIS SCYTHE (MELEE -> FRONT)
  [MUTATION_IDS.MANTIS_SCYTHE]: {
    id: MUTATION_IDS.MANTIS_SCYTHE,
    name: 'Mantis Scythe',
    desc: 'Rapid high-crit folding blade',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.MELEE,
    mountZone: 'front',
    preferredSocket: 1,
    range: 75,
    damage: 38,
    cooldown: 1.0,
    critChance: 0.35,
    knockback: 180,
    color: 0x52B788,
  },
  // 6. SPIRAL DRILL (MELEE -> FRONT)
  [MUTATION_IDS.SPIRAL_DRILL]: {
    id: MUTATION_IDS.SPIRAL_DRILL,
    name: 'Spiral Drill',
    desc: 'Multi-hit piercing drill strike',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.MELEE,
    mountZone: 'front',
    preferredSocket: 1,
    range: 55,
    damage: 14,
    cooldown: 0.45,
    knockback: 90,
    color: 0xF77F00,
  },
  // 7. BONE SPEAR (MELEE -> FRONT)
  [MUTATION_IDS.BONE_SPEAR]: {
    id: MUTATION_IDS.BONE_SPEAR,
    name: 'Bone Spear',
    desc: 'Long-range thrusting bone lance',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.MELEE,
    mountZone: 'front',
    preferredSocket: 1,
    range: 95,
    damage: 32,
    cooldown: 0.85,
    knockback: 260,
    color: 0xE9D8A6,
  },

  // 8. QUILL VOLLEY (RANGED -> FLANK / SIDE)
  [MUTATION_IDS.QUILL_VOLLEY]: {
    id: MUTATION_IDS.QUILL_VOLLEY,
    name: 'Quill Volley',
    desc: 'Fast multi-quill spine burst',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.RANGED,
    mountZone: 'flank',
    preferredSocket: 3,
    cooldown: 1.2,
    damage: 11,
    burstCount: 3,
    projectileSpeed: 520,
    range: 380,
    color: 0xEE9B00,
  },
  // 9. PLASMA SIPHON (RANGED -> FLANK / SHOULDER)
  [MUTATION_IDS.PLASMA_SIPHON]: {
    id: MUTATION_IDS.PLASMA_SIPHON,
    name: 'Plasma Siphon',
    desc: 'Drains life with laser',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.RANGED,
    mountZone: 'flank',
    preferredSocket: 3,
    cooldown: 2.0,
    damage: 28,
    range: 360,
    color: 0x48CAE4,
  },

  // 10. SPORE HOMER (HOMING -> FLANK / BACK)
  [MUTATION_IDS.SPORE_HOMER]: {
    id: MUTATION_IDS.SPORE_HOMER,
    name: 'Seeking Spore',
    desc: 'Heat-seeking organic seeker spore',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.HOMING,
    mountZone: 'flank',
    preferredSocket: 3,
    cooldown: 1.9,
    damage: 22,
    projectileSpeed: 310,
    homingSteer: 4.8,
    range: 480,
    color: 0x9B5DE5,
  },
  // 11. HORNET NEST (HOMING -> REAR / FLANK)
  [MUTATION_IDS.HORNET_NEST]: {
    id: MUTATION_IDS.HORNET_NEST,
    name: 'Paper Hornet',
    desc: 'Swarming guided paper wasps',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.HOMING,
    mountZone: 'rear',
    preferredSocket: 2,
    cooldown: 2.6,
    damage: 13,
    projectileSpeed: 360,
    homingSteer: 6.2,
    range: 520,
    color: 0xFFB703,
  },

  // 12. SHOCK PULSAR (EFFECT -> DORSAL TOP MOUNT)
  [MUTATION_IDS.SHOCK_PULSAR]: {
    id: MUTATION_IDS.SHOCK_PULSAR,
    name: 'Shock Pulsar',
    desc: 'Electric shock stuns ring',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.EFFECT,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    cooldown: 3.4,
    radius: 140,
    damage: 24,
    stunDuration: 0.65,
    color: 0x00F5D4,
  },
  // 13. FROST AURA (EFFECT -> DORSAL TOP MOUNT)
  [MUTATION_IDS.FROST_AURA]: {
    id: MUTATION_IDS.FROST_AURA,
    name: 'Frost Aura',
    desc: 'Chilling aura slows enemies',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.EFFECT,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    cooldown: 2.8,
    radius: 135,
    slowRatio: 0.5,
    slowDuration: 2.5,
    color: 0x90E0EF,
  },

  // 14. CHITIN CARAPACE (UTILS -> FLANK / BACK ARMOR)
  [MUTATION_IDS.CHITIN_CARAPACE]: {
    id: MUTATION_IDS.CHITIN_CARAPACE,
    name: 'Chitin Plating',
    desc: 'Hardened shell reduces damage',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.UTILS,
    mountZone: 'flank',
    preferredSocket: 3,
    armorBonus: 40,
    damageReduction: 0.25,
    color: 0x6C757D,
  },
  // 15. SPRING TENDON (UTILS -> REAR LEAP THRUSTER)
  [MUTATION_IDS.SPRING_TENDON]: {
    id: MUTATION_IDS.SPRING_TENDON,
    name: 'Spring Tendon',
    desc: 'Elastic tendon leaps targets',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.UTILS,
    mountZone: 'rear',
    preferredSocket: 2,
    cooldown: 2.2,
    leapImpulse: 460,
    color: 0xFF758F,
  },
  // 16. REGEN BLADDER (UTILS -> DORSAL TOP HEART SAC)
  [MUTATION_IDS.REGEN_BLADDER]: {
    id: MUTATION_IDS.REGEN_BLADDER,
    name: 'Regen Bladder',
    desc: 'Continuously restores lost health',
    category: 'INNATE',
    mutationType: MUTATION_TYPES.UTILS,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    healPerSec: 10,
    color: 0x57CC99,
  },
};

/**
 * Section 5: Dynamic Supply Drops (Virus & Parasite)
 */
export const SUPPLY_DROP_INTERVAL = 5.0; // Every 5.0 seconds per GDD

export const SUPPLY_MUTAGEN_IDS = {
  // Virus Drops (8 Total: 3 Original + 5 New Stat, Aura & Behavioral Overhauls)
  GIGANTISM_VIRUS: 'GIGANTISM_VIRUS',
  HYPER_SPEED_MUTAGEN: 'HYPER_SPEED_MUTAGEN',
  SPIKY_CARAPACE: 'SPIKY_CARAPACE',
  BERSERKER_STRAIN: 'BERSERKER_STRAIN',
  MITOSIS_STRAIN: 'MITOSIS_STRAIN',
  FERRO_CHITIN_STRAIN: 'FERRO_CHITIN_STRAIN',
  NEURO_OVERCLOCK_VIRUS: 'NEURO_OVERCLOCK_VIRUS',
  TOXIC_SPORE_STRAIN: 'TOXIC_SPORE_STRAIN',

  // Parasite Drops (8 Total: 3 Original + 5 New Living Symbiont Weapons)
  LEECH_MAW: 'LEECH_MAW',
  BOMBARDIER_SAC: 'BOMBARDIER_SAC',
  SHADOW_CHAMELEON: 'SHADOW_CHAMELEON',
  TESLA_BARNACLE: 'TESLA_BARNACLE',
  REAPER_TENDRIL: 'REAPER_TENDRIL',
  SPORE_CANNON_POD: 'SPORE_CANNON_POD',
  ABYSSAL_JAW: 'ABYSSAL_JAW',
  CRYO_SPINE_SYMBIONT: 'CRYO_SPINE_SYMBIONT',
};

export const SUPPLY_MUTAGENS = {
  // --- VIRUSES (8 TOTAL) ---
  [SUPPLY_MUTAGEN_IDS.GIGANTISM_VIRUS]: {
    id: SUPPLY_MUTAGEN_IDS.GIGANTISM_VIRUS,
    name: 'Gigantism Virus',
    desc: 'Massive size and health',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    scaleBonus: 0.40,
    maxHpBonus: 1.00,
    speedPenalty: -0.20,
    color: 0xFF595E,
  },
  [SUPPLY_MUTAGEN_IDS.SPIKY_CARAPACE]: {
    id: SUPPLY_MUTAGEN_IDS.SPIKY_CARAPACE,
    name: 'Spiky Carapace',
    desc: 'Reflects incoming melee damage',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    reflectRatio: 0.35,
    armorBonus: 35,
    color: 0xADB5BD,
  },
  [SUPPLY_MUTAGEN_IDS.HYPER_SPEED_MUTAGEN]: {
    id: SUPPLY_MUTAGEN_IDS.HYPER_SPEED_MUTAGEN,
    name: 'Hyper-Speed Mutagen',
    desc: 'Extreme speed and haste',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    speedBonus: 0.45,
    cooldownReduction: 0.25,
    color: 0x00BBF9,
  },
  [SUPPLY_MUTAGEN_IDS.BERSERKER_STRAIN]: {
    id: SUPPLY_MUTAGEN_IDS.BERSERKER_STRAIN,
    name: 'Berserker Virus',
    desc: 'Boosts attack damage and lifesteal',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    damageBonus: 0.35,
    lifestealBonus: 0.18,
    color: 0xEF476F,
  },
  [SUPPLY_MUTAGEN_IDS.MITOSIS_STRAIN]: {
    id: SUPPLY_MUTAGEN_IDS.MITOSIS_STRAIN,
    name: 'Mitosis Virus',
    desc: 'Expands max health and regen',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    maxHpBonus: 0.45,
    regenPerSec: 12,
    color: 0x06D6A0,
  },
  [SUPPLY_MUTAGEN_IDS.FERRO_CHITIN_STRAIN]: {
    id: SUPPLY_MUTAGEN_IDS.FERRO_CHITIN_STRAIN,
    name: 'Ferro-Chitin Virus',
    desc: 'Heavy armor resists knockback',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    damageReduction: 0.20,
    massBonus: 0.65,
    color: 0x4EA8DE,
  },
  [SUPPLY_MUTAGEN_IDS.NEURO_OVERCLOCK_VIRUS]: {
    id: SUPPLY_MUTAGEN_IDS.NEURO_OVERCLOCK_VIRUS,
    name: 'Overclock Virus',
    desc: 'Hyper-accelerates weapon fire rates',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.UTILS,
    cooldownReduction: 0.32,
    critBonus: 0.25,
    color: 0xFFD166,
  },
  [SUPPLY_MUTAGEN_IDS.TOXIC_SPORE_STRAIN]: {
    id: SUPPLY_MUTAGEN_IDS.TOXIC_SPORE_STRAIN,
    name: 'Bio-Hazard Virus',
    desc: 'Radiates corrosive aura to foes',
    type: 'VIRUS',
    mutationType: MUTATION_TYPES.EFFECT,
    auraRadius: 115,
    auraDamage: 10,
    color: 0x70E000,
  },

  // --- PARASITES (8 TOTAL) ---
  [SUPPLY_MUTAGEN_IDS.LEECH_MAW]: {
    id: SUPPLY_MUTAGEN_IDS.LEECH_MAW,
    name: 'Leech Maw Tendril',
    desc: 'Drains target vital fluids',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.RANGED,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    drainPerSec: 12,
    range: 195,
    color: PALETTE.SUPPLY_PARASITE,
  },
  [SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC]: {
    id: SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC,
    name: 'Bombardier Shell',
    desc: 'Lobs high-damage explosive sacs',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.RANGED,
    mountZone: 'rear',
    preferredSocket: 2,
    cooldown: 4.0,
    damage: 34,
    blastRadius: 115,
    color: PALETTE.SUPPLY_PARASITE,
  },
  [SUPPLY_MUTAGEN_IDS.SHADOW_CHAMELEON]: {
    id: SUPPLY_MUTAGEN_IDS.SHADOW_CHAMELEON,
    name: 'Shadow Chameleon Eye',
    desc: 'Stealth cloak guarantees crit',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.UTILS,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    cooldown: 4.5,
    stealthDuration: 1.6,
    critMultiplier: 1.6,
    color: PALETTE.SUPPLY_PARASITE,
  },
  [SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE]: {
    id: SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE,
    name: 'Tesla Barnacle',
    desc: 'Zaps foes with chain lightning',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.EFFECT,
    mountZone: 'dorsal',
    isDorsalVisual: true,
    preferredSocket: 0,
    cooldown: 2.0,
    damage: 24,
    range: 250,
    stunDuration: 0.3,
    color: 0x00BBF9,
  },
  [SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL]: {
    id: SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL,
    name: 'Reaper Symbiont',
    desc: 'Cleaves enemies with venomous blade',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.MELEE,
    mountZone: 'front',
    preferredSocket: 1,
    cooldown: 0.9,
    damage: 30,
    range: 82,
    knockback: 210,
    color: 0xF15BB5,
  },
  [SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD]: {
    id: SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD,
    name: 'Spore Mortar Pod',
    desc: 'Launches twin homing spore clusters',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.HOMING,
    mountZone: 'flank',
    preferredSocket: 3,
    cooldown: 2.1,
    damage: 16,
    range: 450,
    color: 0x80ED99,
  },
  [SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW]: {
    id: SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW,
    name: 'Abyssal Angler Jaw',
    desc: 'Snaps foes and pulls them closer',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.MELEE,
    mountZone: 'front',
    preferredSocket: 1,
    cooldown: 1.25,
    damage: 28,
    range: 115,
    pullImpulse: 240,
    color: 0x7209B7,
  },
  [SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT]: {
    id: SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT,
    name: 'Cryo-Quill Symbiont',
    desc: 'Fires freezing ice needle volleys',
    type: 'PARASITE',
    mutationType: MUTATION_TYPES.RANGED,
    mountZone: 'flank',
    preferredSocket: 3,
    cooldown: 1.5,
    damage: 13,
    range: 390,
    slowRatio: 0.55,
    slowDuration: 2.0,
    color: 0x90E0EF,
  },
};

export const TARGET_STRATEGY_IDS = {
  NEAREST: 'NearestTargetStrategy',
  LOWEST_HP: 'LowestHPTargetStrategy',
  APEX_PREDATOR: 'ApexPredatorStrategy',
  TACTICAL_OPPORTUNIST: 'TacticalOpportunistStrategy',
  THREAT_AVOIDANCE: 'ThreatAvoidanceTargetStrategy',
};

export const MOTION_STRATEGY_IDS = {
  DIRECT_CHARGE: 'DirectChargeStrategy',
  KITING_STRAFE: 'KitingStrafeStrategy',
  FLEE_WHEN_LOW: 'FleeWhenLowStrategy',
  HIT_AND_RUN: 'HitAndRunMotionStrategy',
  STALKER_FLANK: 'StalkerFlankMotionStrategy',
};

/**
 * Selects the best anatomical socket for a mutation based on its mountZone and mutationType:
 * - melee -> front sockets (angle ~ 0)
 * - ranged / homing -> flank or rear sockets
 * - effect / dorsal utils / dorsal parasites -> dorsal top socket (behind eyes) or rear
 * - propulsion utils -> rear socket (angle ~ PI)
 */
export function selectBestSocketForMutation(sockets, spec) {
  const emptySockets = sockets.filter((s) => !s.mutationId);
  if (emptySockets.length === 0) return null;

  const targetZone = spec.mountZone || (
    spec.mutationType === MUTATION_TYPES.MELEE
      ? 'front'
      : spec.mutationType === MUTATION_TYPES.EFFECT
      ? 'dorsal'
      : spec.mutationType === MUTATION_TYPES.RANGED || spec.mutationType === MUTATION_TYPES.HOMING
      ? 'flank'
      : 'rear'
  );

  // Priority order of zones for each targetZone
  const fallbackZones = {
    front: ['front', 'flank', 'rear', 'dorsal'],
    flank: ['flank', 'rear', 'dorsal', 'front'],
    rear: ['rear', 'flank', 'dorsal', 'front'],
    dorsal: ['dorsal', 'rear', 'flank', 'front'],
  }[targetZone] || ['front', 'flank', 'rear', 'dorsal'];

  for (const z of fallbackZones) {
    const match = emptySockets.find((s) => s.zone === z);
    if (match) return match;
  }

  return emptySockets[0];
}

/**
 * Generates a concise 3-5 word tactical description for any specimen configuration.
 * @param {string} chassisType 
 * @param {string} mutationId 
 * @returns {string} 3-5 words
 */
export function getSpecimenConfigDesc(chassisType, mutationId) {
  const titles = {
    BIO_PINCER: 'Aggressive brawler with pincer',
    ACID_SPITTER: 'Agile sniper spitting acid',
    VENOM_GLAND: 'Armored spreader of venom',
    CILIA_FLAGELLA: 'Swift dasher stalking prey',
    MANTIS_SCYTHE: 'Deadly hunter with mantis blades',
    SPIRAL_DRILL: 'Piercing juggernaut with drill',
    BONE_SPEAR: 'Heavy titan thrusting spears',
    QUILL_VOLLEY: 'Volley striker showering spines',
    PLASMA_SIPHON: 'Vampiric siphon draining life',
    SPORE_HOMER: 'Guided spore launcher organism',
    HORNET_NEST: 'Swarm commander releasing wasps',
    SHOCK_PULSAR: 'Disruptor discharging stun rings',
    FROST_AURA: 'Frost predator chilling enemies',
    CHITIN_CARAPACE: 'Heavy brawler with armor',
    SPRING_TENDON: 'Elastic jumper leaping targets',
    REGEN_BLADDER: 'Regenerative survivor restoring health',
  };
  return titles[mutationId] || 'Evolving papercraft arena gladiator';
}
