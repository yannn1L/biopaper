/**
 * @file OrganismUnit.js
 * Represents a single genetic papercraft organism in BioPaper Arena.
 * Combines Physical Chassis, Socket Attachment System, and Hybrid Strategy Brain.
 */

import { Container, Sprite, Graphics } from 'pixi.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import {
  PALETTE,
  CHASSIS_SPECS,
  MUTATION_IDS,
  INNATE_MUTATIONS,
  SUPPLY_MUTAGEN_IDS,
  SUPPLY_MUTAGENS,
  selectBestSocketForMutation,
  getSpecimenConfigDesc,
} from '../core/Constants.js';
import { clamp, lerp, lerpAngle, fastCos, fastSin } from '../core/MathLUT.js';
import { SoundFX } from '../audio/SoundFX.js';

let NEXT_UNIT_ID = 1;

export class OrganismUnit {
  /**
   * @param {object} config
   * @param {string} config.chassisType
   * @param {string} config.innateMutationId
   * @param {string} config.targetStrategyId
   * @param {string} config.motionStrategyId
   * @param {number} config.spawnX
   * @param {number} config.spawnY
   */
  constructor(config) {
    this.id = NEXT_UNIT_ID++;
    this.chassisSpec = CHASSIS_SPECS[config.chassisType];
    this.chassisType = config.chassisType;
    // Each unit has its own unique color tint
    this.color = config.color !== undefined ? config.color : this.chassisSpec.color;
    this.slotIndex = config.slotIndex !== undefined ? config.slotIndex : 0;
    this.desc = config.desc || getSpecimenConfigDesc(this.chassisType, config.innateMutationId);

    this.targetStrategy = CentralRegistry.getTargetStrategy(config.targetStrategyId);
    this.motionStrategy = CentralRegistry.getMotionStrategy(config.motionStrategyId);
    this.targetStrategyId = config.targetStrategyId;
    this.motionStrategyId = config.motionStrategyId;

    // Position & Physics state
    this.x = config.spawnX;
    this.y = config.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.rotation = Math.random() * Math.PI * 2;
    this.orbitDirection = Math.random() < 0.5 ? 1 : -1;

    // Parachute Drop State (GDD 1.1: terjun payung ke dalam arena melingkar)
    this.isDropping = true;
    this.dropAltitude = 420 + Math.random() * 260;
    this.dropSpeed = 290 + Math.random() * 50;
    this.swayPhase = Math.random() * Math.PI * 2;

    // Core Stats Buffer
    this.baseMaxHp = this.chassisSpec.baseHp;
    this.maxHp = this.baseMaxHp;
    this.hp = this.maxHp;
    this.mass = this.chassisSpec.mass;
    this.baseSpeed = this.chassisSpec.speed;
    this.baseRadius = this.chassisSpec.radius;
    this.scaleMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.damageMultiplier = 1.0;
    this.lifestealRatio = 0.0;
    this.armorDamageMultiplier = 1.0;
    this.bonusCritChance = 0.0;
    this.toxicAuraTimer = 1.0;
    this.meleeReflectRatio = 0.0;
    this.hasGigantism = false;
    this.alive = true;
    this.kills = 0;

    // Status effects & timers
    this.stunTimer = 0;
    this.slowTimer = 0;
    this.slowRatio = 1.0;
    this.hitFlashTimer = 0; // 1-Frame (16ms) hit flash
    this.dashBoostTimer = 0;
    this.stealthTimer = 0;
    this.attackAnimTimer = 0;
    this.critReady = false;
    this.venomDots = []; // Array of { timer, dps, attacker }
    this.lastAttacker = null;

    // Squash & Stretch + Procedural Sine-Wave Animation Profile State
    this.squashX = 1.0;
    this.squashY = 1.0;
    this.animTime = Math.random() * 10;
    this.sinePhase = Math.random() * Math.PI * 2;
    this.wigglePhase = Math.random() * Math.PI * 2;
    this.curSquishAmp = 0.045;
    this.curWiggleAmp = 0.038;
    this.sineSquishY = 1.0;
    this.sineStretchX = 1.0;
    this.visualWiggle = 0.0;

    // Dynamic Eye Pupil Vector Tracking State
    this.pupilOffsetX = 1.8;
    this.pupilOffsetY = 0.0;

    // Socket Attachment System (expands dynamically when more than 5 mutations are grafted)
    this.graftCounter = 0;
    this.sockets = this.chassisSpec.sockets.map((s) => ({
      ...s,
      mutationId: null,
      category: null, // 'INNATE' | 'PARASITE'
      level: 1,
      graftOrder: 0,
      cooldownTimer: Math.random() * 0.4,
      sprite: null,
      grommetSprite: null,
      recoilOffset: 0,
      phaseOffset: s.id * 1.15,
    }));

    this.virusTraits = new Set();
    this.virusGraftOrder = new Map();
    this.desiredVel = { x: 0, y: 0 };
    this.leechTarget = null;

    // Build Pixi.js v8 Display Hierarchy
    this.root = new Container();
    this.shadowSprite = new Sprite(CentralRegistry.getTexture(`CHASSIS_SHADOW_${this.chassisType}`));
    this.shadowSprite.anchor.set(0.5);
    this.shadowSprite.alpha = 0.38;
    this.root.addChild(this.shadowSprite);

    this.bodyContainer = new Container();
    this.root.addChild(this.bodyContainer);

    // Optional Spiky Carapace underlay
    this.spikySprite = new Sprite(CentralRegistry.getTexture('VIRUS_SPIKY_RING'));
    this.spikySprite.anchor.set(0.5);
    this.spikySprite.visible = false;
    this.bodyContainer.addChild(this.spikySprite);

    // Perimeter Socket container (under/around chassis rim for front melee, flank ranged, rear utils)
    this.socketContainer = new Container();
    this.bodyContainer.addChild(this.socketContainer);

    // Chassis Sprite with unique organism paper color tint
    this.chassisSprite = new Sprite(CentralRegistry.getTexture(`CHASSIS_BODY_${this.chassisType}`));
    this.chassisSprite.anchor.set(0.5);
    this.chassisSprite.tint = this.color;
    this.bodyContainer.addChild(this.chassisSprite);

    // Diegetic Paper Vitality Ring inside body center (Zero UI overlay compliance)
    this.vitalityGraphic = new Graphics();
    this.bodyContainer.addChild(this.vitalityGraphic);

    // Dorsal Top Organ Container (mounted behind forward eyes on top of chassis)
    this.topOrganContainer = new Container();
    this.bodyContainer.addChild(this.topOrganContainer);

    // Forward-Offset Expressive Eyes Container (always legible above chassis & dorsal sockets)
    this.eyeContainer = new Container();
    this.bodyContainer.addChild(this.eyeContainer);
    this.eyes = [];
    const scleraTex = CentralRegistry.getTexture('EYE_SCLERA');
    const pupilTex = CentralRegistry.getTexture('EYE_PUPIL');
    const eyeSpecs = this.chassisSpec.eyeOffsets || [
      { x: 18, y: -10, r: 7.2 },
      { x: 18, y: 10, r: 7.2 },
    ];
    for (let i = 0; i < eyeSpecs.length; i++) {
      const es = eyeSpecs[i];
      const eyeWrap = new Container();
      eyeWrap.x = es.x;
      eyeWrap.y = es.y;
      const scaleRatio = (es.r || 7.5) / 7.5;
      eyeWrap.scale.set(scaleRatio);

      const sclera = new Sprite(scleraTex);
      sclera.anchor.set(0.5);
      eyeWrap.addChild(sclera);

      const pupil = new Sprite(pupilTex);
      pupil.anchor.set(0.5);
      pupil.x = 1.2;
      pupil.y = 0;
      eyeWrap.addChild(pupil);

      this.eyeContainer.addChild(eyeWrap);
      this.eyes.push({ wrap: eyeWrap, sclera, pupil, baseX: 0, baseY: 0, baseScale: scaleRatio });
    }

    // 1-Frame Hit Flash Pure White Silhouette Sprite
    this.flashSprite = new Sprite(CentralRegistry.getTexture(`CHASSIS_FLASH_${this.chassisType}`));
    this.flashSprite.anchor.set(0.5);
    this.flashSprite.visible = false;
    this.bodyContainer.addChild(this.flashSprite);

    // Parachute Sprite for Deployment Drop
    this.parachuteSprite = new Sprite(CentralRegistry.getTexture('SUPPLY_PARACHUTE'));
    this.parachuteSprite.anchor.set(0.5, 0.85);
    this.root.addChild(this.parachuteSprite);

    // Create socket grommets (perimeter grommets on rim; dorsal grommet on dorsal saddle)
    for (let i = 0; i < this.sockets.length; i++) {
      const skt = this.sockets[i];
      const grommet = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
      grommet.anchor.set(0.5);
      if (skt.isDorsal) {
        grommet.x = skt.x !== undefined ? skt.x : -9;
        grommet.y = skt.y !== undefined ? skt.y : 0;
        grommet.scale.set(0.85);
        this.topOrganContainer.addChild(grommet);
      } else {
        grommet.x = Math.cos(skt.angle) * (skt.dist - 6);
        grommet.y = Math.sin(skt.angle) * (skt.dist - 6);
        this.socketContainer.addChild(grommet);
      }
      skt.grommetSprite = grommet;
    }

    // Equip Innate Mutation into preferred anatomical socket
    if (config.innateMutationId) {
      this.graftMutation(config.innateMutationId, 'INNATE', false);
    }

    this.redrawVitalityEmblem();
    this.syncTransforms();
  }

  getRadius() {
    return this.baseRadius * this.scaleMultiplier;
  }

  getEffectiveSpeed() {
    let spd = this.baseSpeed * this.speedMultiplier;
    if (this.dashBoostTimer > 0) {
      spd *= 3.0; // Cilia Flagella +200% burst dash
    }
    if (this.slowTimer > 0) {
      spd *= this.slowRatio;
    }
    return spd;
  }

  getSpeed() {
    return this.getEffectiveSpeed();
  }

  hasMutation(mutationId) {
    for (let i = 0; i < this.sockets.length; i++) {
      if (this.sockets[i].mutationId === mutationId) return true;
    }
    return false;
  }

  getTotalMutationScore() {
    let score = this.virusTraits.size;
    for (let i = 0; i < this.sockets.length; i++) {
      if (this.sockets[i].mutationId) {
        score += this.sockets[i].level;
      }
    }
    return score;
  }

  /**
   * Returns all active socket mutations and virus traits ordered chronologically from oldest to newest.
   */
  getAllActiveMutations() {
    const items = [];
    for (let i = 0; i < this.sockets.length; i++) {
      const skt = this.sockets[i];
      if (!skt.mutationId) continue;
      const spec = INNATE_MUTATIONS[skt.mutationId] || SUPPLY_MUTAGENS[skt.mutationId];
      if (spec) {
        items.push({
          id: skt.mutationId,
          name: spec.name,
          level: skt.level,
          desc: spec.desc || 'Grafted combat mutation organ',
          color: spec.color || 0xFF8A5B,
          type: (spec.mutationType || 'GENE').toUpperCase(),
          texKey:
            skt.category === 'PARASITE' ? skt.mutationId : `${skt.mutationId}_LVL${skt.level}`,
          graftOrder: skt.graftOrder || 0,
        });
      }
    }

    this.virusTraits.forEach((vid) => {
      const spec = SUPPLY_MUTAGENS[vid];
      if (spec) {
        items.push({
          id: vid,
          name: spec.name,
          level: 1,
          desc: spec.desc || 'Living supply drop pathogen',
          color: spec.color || PALETTE.SUPPLY_PARASITE,
          type: 'VIRUS',
          texKey: vid,
          graftOrder: this.virusGraftOrder.get(vid) || 0,
        });
      }
    });

    items.sort((a, b) => a.graftOrder - b.graftOrder);
    return items;
  }

  /**
   * Creates an additional anatomical socket on the specimen when all initial sockets are filled,
   * ensuring the specimen has no upper limit on active mutations.
   */
  createDynamicSocket(spec) {
    const newId = this.sockets.length;
    const desiredZone = spec?.mountZone || 'flank';
    const extraIdx = Math.max(0, newId - 4);
    const sign = extraIdx % 2 === 0 ? 1 : -1;
    const step = Math.ceil(extraIdx * 0.5);

    let angle = 0;
    let dist = this.baseRadius * 0.9;
    let isDorsal = false;
    let dx = -9;
    let dy = 0;

    if (desiredZone === 'dorsal' || spec?.isDorsalVisual) {
      isDorsal = true;
      dx = -8 - (step % 2) * 8;
      dy = sign * Math.min(14, step * 7);
      angle = Math.atan2(dy, dx);
      dist = Math.hypot(dx, dy);
    } else if (desiredZone === 'front') {
      angle = sign * Math.min(0.85, 0.24 + step * 0.2);
    } else if (desiredZone === 'rear') {
      angle = Math.PI + sign * Math.min(0.75, 0.22 + step * 0.18);
    } else {
      // flank
      angle = sign * (Math.PI * 0.5 + ((step % 3) - 1) * 0.32);
    }

    const grommet = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
    grommet.anchor.set(0.5);
    if (isDorsal) {
      grommet.x = dx;
      grommet.y = dy;
      grommet.scale.set(0.8);
      this.topOrganContainer.addChild(grommet);
    } else {
      grommet.x = Math.cos(angle) * (dist - 6);
      grommet.y = Math.sin(angle) * (dist - 6);
      this.socketContainer.addChild(grommet);
    }

    const newSocket = {
      id: newId,
      angle,
      dist,
      zone: desiredZone,
      isDorsal,
      x: dx,
      y: dy,
      mutationId: null,
      category: null,
      level: 1,
      graftOrder: 0,
      cooldownTimer: Math.random() * 0.35,
      sprite: null,
      grommetSprite: grommet,
      recoilOffset: 0,
      phaseOffset: newId * 1.15,
    };

    this.sockets.push(newSocket);
    return newSocket;
  }

  /**
   * Section 4.2: Socket Allocation & Mutational Fusion (Level 2)
   * Specimens have no cap on active mutations: duplicate organs fuse to Level 2,
   * and new organs beyond the base 5 sockets dynamically add a new anatomical socket.
   */
  graftMutation(mutationId, category = 'INNATE', playPopFX = true, simContext = null) {
    const spec =
      category === 'INNATE'
        ? INNATE_MUTATIONS[mutationId]
        : SUPPLY_MUTAGENS[mutationId];
    if (!spec) return null;

    // 1. If we already have a Level 1 copy of this exact mutation, fuse it to Level 2!
    const existingSocket = this.sockets.find((s) => s.mutationId === mutationId && s.level < 2);
    if (existingSocket) {
      existingSocket.level = 2;
      existingSocket.graftOrder = ++this.graftCounter;
      this.refreshSocketSprite(existingSocket);
      if (playPopFX) {
        this.applySquash(1.32, 1.32);
        SoundFX.playFusionChime();
      }
      if (simContext && simContext.spawnCalloutPopup) {
        simContext.spawnCalloutPopup(this.x, this.y, `${spec.name.toUpperCase()} FUSED! LVL 2`, PALETTE.GOLD_CROWN);
      }
      return existingSocket;
    }

    // 2. Find best anatomical empty socket, or create a dynamic socket if all current sockets are occupied
    const emptySockets = this.sockets.filter((s) => !s.mutationId);
    let chosenSocket = null;
    if (emptySockets.length > 0) {
      chosenSocket = selectBestSocketForMutation(this.sockets, spec);
    }
    if (!chosenSocket) {
      chosenSocket = this.createDynamicSocket(spec);
    }

    chosenSocket.mutationId = mutationId;
    chosenSocket.category = category;
    chosenSocket.level = 1;
    chosenSocket.graftOrder = ++this.graftCounter;
    chosenSocket.cooldownTimer = 0.2;
    this.refreshSocketSprite(chosenSocket);

    if (playPopFX) {
      this.applySquash(1.26, 0.82);
      SoundFX.playThumbtackPop();
    }
    return chosenSocket;
  }

  /**
   * Section 5.1: Apply Virus or Parasite Supply Drop
   */
  applySupplyMutagen(mutagenId, simContext) {
    const spec = SUPPLY_MUTAGENS[mutagenId];
    if (!spec) return;

    if (spec.type === 'VIRUS') {
      this.virusTraits.add(mutagenId);
      this.virusGraftOrder.set(mutagenId, ++this.graftCounter);
      if (mutagenId === SUPPLY_MUTAGEN_IDS.GIGANTISM_VIRUS && !this.hasGigantism) {
        // Gigantism Virus: +40% size, +100% Max HP, -20% speed, Trample Damage
        this.hasGigantism = true;
        this.scaleMultiplier *= 1.4;
        this.mass *= 1.8;
        const oldMax = this.maxHp;
        this.maxHp = Math.round(this.maxHp * 2.0);
        this.hp = Math.min(this.maxHp, this.hp + (this.maxHp - oldMax));
        this.speedMultiplier *= 0.8;
        SoundFX.playThumbtackPop();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.SPIKY_CARAPACE) {
        // Spiky Carapace: Reflects 35% melee damage
        this.meleeReflectRatio = Math.min(0.65, this.meleeReflectRatio + spec.reflectRatio);
        this.spikySprite.visible = true;
        this.hp = Math.min(this.maxHp, this.hp + 35);
        SoundFX.playChitinArmorClack();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.HYPER_SPEED_MUTAGEN) {
        this.speedMultiplier *= 1.45;
        this.cooldownMultiplier *= 0.75;
        this.hp = Math.min(this.maxHp, this.hp + 25);
        SoundFX.playCiliaFlagellaDash();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.BERSERKER_STRAIN) {
        this.damageMultiplier *= 1.35;
        this.lifestealRatio = Math.min(0.45, this.lifestealRatio + 0.18);
        this.cooldownMultiplier *= 0.85;
        this.hp = Math.min(this.maxHp, this.hp + 35);
        SoundFX.playBerserkerRoar();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.MITOSIS_STRAIN) {
        const oldMax = this.maxHp;
        this.maxHp = Math.round(this.maxHp * 1.45);
        this.hp = Math.min(this.maxHp, this.hp + (this.maxHp - oldMax) + 40);
        SoundFX.playRegenBladderPulse();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.FERRO_CHITIN_STRAIN) {
        this.mass *= 1.65;
        this.armorDamageMultiplier *= 0.8;
        this.hp = Math.min(this.maxHp, this.hp + 50);
        SoundFX.playChitinArmorClack();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.NEURO_OVERCLOCK_VIRUS) {
        this.cooldownMultiplier *= 0.68;
        this.speedMultiplier *= 1.22;
        this.bonusCritChance = Math.min(0.6, this.bonusCritChance + 0.25);
        this.hp = Math.min(this.maxHp, this.hp + 30);
        SoundFX.playCiliaFlagellaDash();
      } else if (mutagenId === SUPPLY_MUTAGEN_IDS.TOXIC_SPORE_STRAIN) {
        this.hp = Math.min(this.maxHp, this.hp + 40);
        SoundFX.playVenomCloudHiss();
      } else {
        SoundFX.playThumbtackPop();
      }
      this.applySquash(1.38, 0.74);
      this.redrawVitalityEmblem();
    } else if (spec.type === 'PARASITE') {
      this.graftMutation(mutagenId, 'PARASITE', true, simContext);
      this.hp = Math.min(this.maxHp, this.hp + 20);
      this.redrawVitalityEmblem();
    }

    if (simContext) {
      simContext.spawnThumbtackRing(this.x, this.y, spec.color);
      if (simContext.spawnCalloutPopup) {
        simContext.spawnCalloutPopup(this.x, this.y, `${spec.name.toUpperCase()}!`, spec.color);
      }
    }
  }

  refreshSocketSprite(skt) {
    if (skt.sprite) {
      skt.sprite.destroy();
      skt.sprite = null;
    }
    if (!skt.mutationId) return;

    const spec =
      skt.category === 'INNATE'
        ? INNATE_MUTATIONS[skt.mutationId]
        : SUPPLY_MUTAGENS[skt.mutationId];

    let texKey = skt.mutationId;
    if (skt.category === 'INNATE') {
      texKey = `${skt.mutationId}_LVL${skt.level}`;
    }
    const tex = CentralRegistry.getTexture(texKey);
    if (!tex) return;

    const spr = new Sprite(tex);
    const baseScale = skt.level === 2 ? 1.12 : 1.0;
    spr.scale.set(baseScale);

    const isDorsalOrgan = Boolean(spec && spec.isDorsalVisual);

    if (skt.isDorsal) {
      // Mounted on the dorsal top surface behind the forward-offset eyes
      spr.anchor.set(0.5);
      spr.x = skt.x !== undefined ? skt.x : -9;
      spr.y = skt.y !== undefined ? skt.y : 0;
      spr.rotation = isDorsalOrgan ? 0 : (spec?.mountZone === 'rear' ? Math.PI : 0);
      this.topOrganContainer.addChild(spr);
    } else if (isDorsalOrgan) {
      // Radial/Dorsal organ mounted on a perimeter fallback socket
      spr.anchor.set(0.5);
      spr.x = Math.cos(skt.angle) * (skt.dist * 0.78);
      spr.y = Math.sin(skt.angle) * (skt.dist * 0.78);
      spr.rotation = skt.angle;
      this.socketContainer.addChild(spr);
    } else {
      // Directional weapon / propulsion organ mounted on perimeter socket
      spr.anchor.set(0.15, 0.5);
      spr.x = Math.cos(skt.angle) * skt.dist;
      spr.y = Math.sin(skt.angle) * skt.dist;
      spr.rotation = skt.angle;
      this.socketContainer.addChild(spr);
    }
    skt.sprite = spr;
  }

  applySquash(sx, sy) {
    this.squashX = clamp(sx, 0.55, 1.55);
    this.squashY = clamp(sy, 0.55, 1.55);
  }

  takeDamage(amount, attacker, simContext, isReflectOrDot = false, isCrit = false) {
    if (!this.alive || this.isDropping) return;

    let modifiedAmount = amount;
    if (attacker && attacker !== this && !isReflectOrDot) {
      modifiedAmount *= attacker.damageMultiplier || 1.0;
      if (!isCrit && attacker.bonusCritChance > 0 && Math.random() < attacker.bonusCritChance) {
        isCrit = true;
        modifiedAmount *= 1.45;
      }
    }

    let finalDmg = Math.max(1, modifiedAmount) * (this.armorDamageMultiplier || 1.0);
    // Chitin Carapace: -25% passive damage reduction
    const hasArmor =
      this.hasMutation(MUTATION_IDS.CHITIN_CARAPACE) ||
      this.virusTraits.has(SUPPLY_MUTAGEN_IDS.FERRO_CHITIN_STRAIN);
    if (this.hasMutation(MUTATION_IDS.CHITIN_CARAPACE)) {
      finalDmg *= 0.75;
    }
    this.hp -= finalDmg;
    if (attacker && attacker !== this) {
      this.lastAttacker = attacker;
      if (!isReflectOrDot && attacker.lifestealRatio > 0 && attacker.alive) {
        attacker.heal(finalDmg * attacker.lifestealRatio);
      }
    }

    // GDD 2.1: Hit Flash - Unit flashes pure white for 1 frame (16ms) on hit
    if (!isReflectOrDot) {
      this.hitFlashTimer = 0.024; // ~1.5 frames at 60fps so it is unmistakably visible
      this.flashSprite.visible = true;
      if (hasArmor) {
        SoundFX.playChitinArmorClack();
      } else {
        SoundFX.playHitImpact(isCrit);
      }
    }

    this.redrawVitalityEmblem();

    // Spawn Juicy Damage Popup
    if (simContext && simContext.spawnDamagePopup) {
      simContext.spawnDamagePopup(this.x, this.y, Math.round(finalDmg), isCrit, isReflectOrDot);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      if (simContext) {
        simContext.handleUnitEliminated(this, this.lastAttacker);
      }
    }
  }

  applySlow(ratio, duration, simContext) {
    this.slowRatio = Math.min(this.slowRatio, ratio);
    this.slowTimer = Math.max(this.slowTimer, duration);
    if (simContext && simContext.spawnStatusPopup) {
      simContext.spawnStatusPopup(this.x, this.y, 'SLOW -50%', 0x90E0EF);
    }
  }

  heal(amount, simContext) {
    if (!this.alive) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.redrawVitalityEmblem();
    if (simContext && simContext.spawnStatusPopup && amount >= 4) {
      simContext.spawnStatusPopup(this.x, this.y, `+${Math.round(amount)} HP`, 0x57CC99);
    }
  }

  addVenomDot(dps, duration, attacker) {
    // Refresh or stack up to 2 venom clouds
    if (this.venomDots.length < 2) {
      this.venomDots.push({ timer: duration, dps, attacker });
    } else {
      this.venomDots[0].timer = Math.max(this.venomDots[0].timer, duration);
    }
  }

  /**
   * Diegetic papercraft vitality core drawn on the dorsal mount pad (zero UI bars).
   */
  redrawVitalityEmblem() {
    const g = this.vitalityGraphic;
    g.clear();
    const ratio = clamp(this.hp / this.maxHp, 0, 1);
    const r = 10;

    // Recessed paper socket well behind the eyes
    g.circle(-9, 0, r);
    g.fill({ color: 0x1A1D20, alpha: 0.45 });

    // Colored paper vitality pie/arc
    if (ratio > 0.02) {
      const col = ratio > 0.5 ? 0xFFFDF9 : ratio > 0.25 ? 0xFFD166 : 0xFF4D6D;
      g.circle(-9, 0, r * Math.sqrt(ratio));
      g.fill({ color: col, alpha: 0.9 });
    }

    // Level 2 / Gigantism gold paper star stud
    if (this.hasGigantism || this.sockets.some((s) => s.level >= 2)) {
      g.circle(-9, 0, 3.5);
      g.fill({ color: PALETTE.GOLD_CROWN });
    }
  }

  /**
   * Eye & Pupil Tracking: combines movement velocity vector and targeted enemy vector
   * into local chassis space so pupils actively track where the specimen moves and fights.
   */
  updateEyeTracking(dt, currentTarget) {
    if (!this.eyes || this.eyes.length === 0) return;

    const maxPupilOffset = 2.0;

    // Dizzy spinning pupils when stunned (strictly within sclera radius)
    if (this.stunTimer > 0) {
      const spinPhase = this.animTime * 22;
      const spinRadius = 1.8;
      for (let i = 0; i < this.eyes.length; i++) {
        const eye = this.eyes[i];
        const dir = i % 2 === 0 ? 1 : -1;
        eye.pupil.x = (eye.baseX || 0) + fastCos(spinPhase * dir) * spinRadius;
        eye.pupil.y = (eye.baseY || 0) + fastSin(spinPhase * dir) * spinRadius;
        eye.pupil.scale.set(0.95);
      }
      return;
    }

    // 1. Velocity direction vector (way it moves)
    const speed = Math.hypot(this.vx, this.vy);
    let vxNorm = 0;
    let vyNorm = 0;
    if (speed > 8) {
      vxNorm = this.vx / speed;
      vyNorm = this.vy / speed;
    }

    // 2. Target enemy direction vector
    let txNorm = 0;
    let tyNorm = 0;
    let hasTarget = false;
    if (currentTarget && currentTarget.alive && !currentTarget.isDropping) {
      const tdx = currentTarget.x - this.x;
      const tdy = currentTarget.y - this.y;
      const tDist = Math.hypot(tdx, tdy) || 1;
      txNorm = tdx / tDist;
      tyNorm = tdy / tDist;
      hasTarget = true;
    }

    // Blend movement direction (38%) and target enemy (62%) when fighting, or 100% movement
    let lookWorldX = hasTarget ? vxNorm * 0.38 + txNorm * 0.62 : vxNorm;
    let lookWorldY = hasTarget ? vyNorm * 0.38 + tyNorm * 0.62 : vyNorm;
    const lookMag = Math.hypot(lookWorldX, lookWorldY);

    let targetLocalX = 0.7; // slight forward gaze when idle
    let targetLocalY = 0;

    if (lookMag > 0.05) {
      lookWorldX /= lookMag;
      lookWorldY /= lookMag;
      // Rotate world look vector into local chassis space by -this.rotation
      const cosR = fastCos(-this.rotation);
      const sinR = fastSin(-this.rotation);
      const localX = lookWorldX * cosR - lookWorldY * sinR;
      const localY = lookWorldX * sinR + lookWorldY * cosR;
      // Circular radial clamp so pupil stays strictly inside the circular sclera rim
      const localMag = Math.hypot(localX, localY) || 1;
      const clampedMag = Math.min(localMag, 1.0) * maxPupilOffset;
      targetLocalX = (localX / localMag) * clampedMag;
      targetLocalY = (localY / localMag) * clampedMag;
    }

    const lerpRate = Math.min(1, dt * 16);
    this.pupilOffsetX += (targetLocalX - this.pupilOffsetX) * lerpRate;
    this.pupilOffsetY += (targetLocalY - this.pupilOffsetY) * lerpRate;

    // Enforce circular radial bound after lerp
    const curMag = Math.hypot(this.pupilOffsetX, this.pupilOffsetY);
    if (curMag > maxPupilOffset) {
      this.pupilOffsetX = (this.pupilOffsetX / curMag) * maxPupilOffset;
      this.pupilOffsetY = (this.pupilOffsetY / curMag) * maxPupilOffset;
    }

    // Subtle pupil dilation during attack or dash
    const pupilScale = this.attackAnimTimer > 0 ? 1.08 : this.dashBoostTimer > 0 ? 0.92 : 1.0;

    for (let i = 0; i < this.eyes.length; i++) {
      const eye = this.eyes[i];
      eye.pupil.x = (eye.baseX || 0) + this.pupilOffsetX;
      eye.pupil.y = (eye.baseY || 0) + this.pupilOffsetY;
      eye.pupil.scale.set(pupilScale);
    }
  }

  update(dt, simContext) {
    if (!this.alive) return;
    this.animTime += dt;

    // 1. Parachute Deployment Phase
    if (this.isDropping) {
      this.dropAltitude -= this.dropSpeed * dt;
      this.swayPhase += dt * 4.5;
      this.parachuteSprite.visible = true;
      this.parachuteSprite.rotation = fastSin(this.swayPhase) * 0.18;
      this.parachuteSprite.y = -this.dropAltitude - 26;
      this.parachuteSprite.x = fastSin(this.swayPhase) * 10;

      if (this.dropAltitude <= 0) {
        this.dropAltitude = 0;
        this.isDropping = false;
        this.parachuteSprite.visible = false;
        this.applySquash(1.36, 0.68);
        SoundFX.playThumbtackPop();
        simContext.spawnDustBurst(this.x, this.y, 10);
      }
      this.syncTransforms();
      return;
    }

    // 2. Hit Flash countdown (16ms pure white flash)
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        this.flashSprite.visible = false;
      }
    }

    // 3. Venom DoT processing
    for (let i = this.venomDots.length - 1; i >= 0; i--) {
      const dot = this.venomDots[i];
      dot.timer -= dt;
      this.takeDamage(dot.dps * dt, dot.attacker, simContext, true);
      if (!this.alive) return;
      if (dot.timer <= 0) {
        this.venomDots.splice(i, 1);
      }
    }

    // 4. Timers, Slow, & Stealth
    if (this.dashBoostTimer > 0) this.dashBoostTimer -= dt;
    if (this.attackAnimTimer > 0) this.attackAnimTimer -= dt;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowRatio = 1.0;
      }
    }
    if (this.stealthTimer > 0) {
      this.stealthTimer -= dt;
      this.bodyContainer.alpha = 0.42;
    } else {
      this.bodyContainer.alpha = 1.0;
    }

    // 5. AI Strategy Execution (Target Strategy -> Motion Strategy)
    let currentTarget = null;
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
    } else {
      currentTarget = this.targetStrategy.selectTarget(this, simContext);
      this.motionStrategy.computeDesiredVelocity(this, currentTarget, simContext, this.desiredVel);

      // Smooth steering force based on chassis mass
      const accel = (8.5 / Math.sqrt(this.mass)) * dt;
      this.vx += (this.desiredVel.x - this.vx) * Math.min(1, accel);
      this.vy += (this.desiredVel.y - this.vy) * Math.min(1, accel);

      // Rotate toward target or velocity vector
      if (currentTarget) {
        const aimAngle = Math.atan2(currentTarget.y - this.y, currentTarget.x - this.x);
        this.rotation = lerpAngle(this.rotation, aimAngle, Math.min(1, dt * 10));
      } else if (Math.hypot(this.vx, this.vy) > 15) {
        const velAngle = Math.atan2(this.vy, this.vx);
        this.rotation = lerpAngle(this.rotation, velAngle, Math.min(1, dt * 8));
      }
    }

    // 6. Integrate Velocity & Damping
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.92, dt * 60);
    this.vy *= Math.pow(0.92, dt * 60);

    // 7. Dynamic Sine-Wave Animation Profiles (Idle, Moving, Attacking, Dashing, Stunned)
    const speedMag = Math.hypot(this.vx, this.vy);
    const speedRatio = clamp(speedMag / Math.max(80, this.baseSpeed), 0, 1.8);

    let targetFreq = 3.2;
    let targetSquishAmp = 0.045;
    let targetWiggleFreq = 2.4;
    let targetWiggleAmp = 0.025;

    if (this.stunTimer > 0) {
      // Stunned Profile: High-frequency dizzy shudder + rapid rotational wobble
      targetFreq = 24.0;
      targetSquishAmp = 0.085;
      targetWiggleFreq = 28.0;
      targetWiggleAmp = 0.14;
    } else if (this.dashBoostTimer > 0) {
      // Dashing Profile: Rapid elastic propulsion waves + energetic tilt
      targetFreq = 18.5;
      targetSquishAmp = 0.165;
      targetWiggleFreq = 16.0;
      targetWiggleAmp = 0.115;
    } else if (this.attackAnimTimer > 0) {
      // Attacking Profile: Snappy recoil oscillation + aggressive lunge wobble
      targetFreq = 15.5;
      targetSquishAmp = 0.145;
      targetWiggleFreq = 14.0;
      targetWiggleAmp = 0.095;
    } else if (speedMag > 18) {
      // Moving Profile: Frequency and amplitude scale dynamically with movement speed
      targetFreq = 6.5 + speedRatio * 5.2;
      targetSquishAmp = 0.065 + speedRatio * 0.055;
      targetWiggleFreq = 5.8 + speedRatio * 4.5;
      targetWiggleAmp = 0.045 + speedRatio * 0.045;
    }

    // Smoothly blend amplitudes and advance phases (zero phase-jump jitter)
    const blend = Math.min(1, dt * 12);
    this.curSquishAmp += (targetSquishAmp - this.curSquishAmp) * blend;
    this.curWiggleAmp += (targetWiggleAmp - this.curWiggleAmp) * blend;
    this.sinePhase += dt * targetFreq;
    this.wigglePhase += dt * targetWiggleFreq;

    const waveY = fastSin(this.sinePhase);
    // Sine wave applied to Y scale with volume-preserving inverse X scale
    this.sineSquishY = 1.0 + waveY * this.curSquishAmp;
    this.sineStretchX = 1.0 - waveY * (this.curSquishAmp * 0.75);
    // Rotational Wiggle applied to visual body & shadow
    this.visualWiggle = fastSin(this.wigglePhase) * this.curWiggleAmp;

    // Impact squash & velocity stretch recovery
    const targetStretch = 1.0 + clamp(speedMag / 1600, 0, 0.18);
    const targetSquash = 1.0 / Math.sqrt(targetStretch);
    this.squashX += (targetStretch - this.squashX) * Math.min(1, dt * 14);
    this.squashY += (targetSquash - this.squashY) * Math.min(1, dt * 14);

    // 8. Update Expressive Eye & Pupil Tracking (movement + target enemy)
    this.updateEyeTracking(dt, currentTarget);

    // 9. Execute Active Socket Mutations & Passive Virus Effects
    if (this.virusTraits.has(SUPPLY_MUTAGEN_IDS.MITOSIS_STRAIN)) {
      this.heal(12 * dt);
    }
    if (this.virusTraits.has(SUPPLY_MUTAGEN_IDS.TOXIC_SPORE_STRAIN)) {
      this.toxicAuraTimer -= dt;
      if (this.toxicAuraTimer <= 0) {
        this.toxicAuraTimer = 1.8;
        if (currentTarget && Math.hypot(currentTarget.x - this.x, currentTarget.y - this.y) <= 145) {
          simContext.triggerVenomCloud(this, this.x, this.y, 115, 4, 3.0);
          SoundFX.playVenomCloudHiss();
        }
      }
    }

    this.leechTarget = null;
    for (let i = 0; i < this.sockets.length; i++) {
      const skt = this.sockets[i];
      if (!skt.mutationId) continue;
      this.updateSocketMutation(skt, dt, currentTarget, simContext);
    }

    if (this.spikySprite.visible) {
      this.spikySprite.rotation += dt * 1.8;
    }

    this.syncTransforms();
  }

  updateSocketMutation(skt, dt, target, simContext) {
    skt.cooldownTimer -= dt / this.cooldownMultiplier;
    if (skt.recoilOffset > 0) {
      skt.recoilOffset = Math.max(0, skt.recoilOffset - dt * 45);
    } else if (skt.recoilOffset < 0) {
      skt.recoilOffset = Math.min(0, skt.recoilOffset + dt * 45);
    }

    const id = skt.mutationId;
    const lvl = skt.level;
    const baseScale = lvl === 2 ? 1.15 : 1.0;
    const sktIdx = skt.id ?? 0;
    const phase = this.sinePhase + sktIdx * 1.15;

    // Compute world coordinates of this socket (handling both dorsal and perimeter mounts)
    let worldX = this.x;
    let worldY = this.y;
    if (skt.isDorsal) {
      const cosR = fastCos(this.rotation);
      const sinR = fastSin(this.rotation);
      const lx = (skt.x ?? -9) * this.scaleMultiplier;
      const ly = (skt.y ?? 0) * this.scaleMultiplier;
      worldX = this.x + lx * cosR - ly * sinR;
      worldY = this.y + lx * sinR + ly * cosR;
    } else {
      const worldAngle = this.rotation + skt.angle;
      worldX = this.x + fastCos(worldAngle) * (skt.dist * this.scaleMultiplier);
      worldY = this.y + fastSin(worldAngle) * (skt.dist * this.scaleMultiplier);
    }

    // Expressive sine-wave animation per organ category & mutation ID
    if (skt.sprite) {
      // Optional local turret micro-aiming toward target for flank ranged weapons
      let aimOffset = 0;
      if (target && target.alive && !skt.isDorsal) {
        const desiredWorldAngle = Math.atan2(target.y - worldY, target.x - worldX);
        const rawDiff = lerpAngle(this.rotation + skt.angle, desiredWorldAngle, 1) - (this.rotation + skt.angle);
        aimOffset = clamp(rawDiff, -0.38, 0.38);
      }

      if (id === MUTATION_IDS.BIO_PINCER || id === SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW) {
        const snapWave = fastSin(this.animTime * 11 + sktIdx) * 0.16;
        skt.sprite.rotation = skt.angle + snapWave;
        const lunge = 1 - skt.recoilOffset * 0.022;
        skt.sprite.scale.set(baseScale * lunge, baseScale / Math.sqrt(Math.max(0.7, lunge)));
      } else if (id === MUTATION_IDS.MANTIS_SCYTHE || id === SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL) {
        const slashWave = fastSin(this.animTime * 9.5 + sktIdx) * 0.24 - skt.recoilOffset * 0.04;
        skt.sprite.rotation = skt.angle + slashWave;
        skt.sprite.scale.set(baseScale * (1 - skt.recoilOffset * 0.015), baseScale);
      } else if (id === MUTATION_IDS.SPIRAL_DRILL) {
        // High-frequency drill vibration & longitudinal bore oscillation
        const buzz = fastSin(this.animTime * 36) * 0.09;
        skt.sprite.rotation = skt.angle + buzz * 0.4;
        skt.sprite.scale.set(baseScale * (1 + buzz), baseScale * (1 - buzz * 0.8));
      } else if (id === MUTATION_IDS.BONE_SPEAR) {
        const poise = fastSin(phase * 0.8) * 0.06;
        skt.sprite.rotation = skt.angle + poise;
        const thrust = 1 - skt.recoilOffset * 0.025;
        skt.sprite.scale.set(baseScale * thrust, baseScale / Math.sqrt(Math.max(0.7, thrust)));
      } else if (id === MUTATION_IDS.ACID_SPITTER) {
        const pulse = 1 + fastSin(this.animTime * 7.5 + sktIdx) * 0.1;
        skt.sprite.rotation = skt.angle + aimOffset * 0.7;
        skt.sprite.scale.set(baseScale * pulse, baseScale / pulse);
      } else if (id === MUTATION_IDS.QUILL_VOLLEY || id === SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT) {
        const bristle = 1 + fastSin(this.animTime * 8.5 + sktIdx) * 0.08;
        skt.sprite.rotation = skt.angle + aimOffset * 0.65;
        skt.sprite.scale.set(baseScale / bristle, baseScale * bristle);
      } else if (id === MUTATION_IDS.PLASMA_SIPHON) {
        const charge = 1 + fastSin(this.animTime * 12) * 0.09;
        skt.sprite.rotation = skt.angle + aimOffset * 0.85;
        skt.sprite.scale.set(baseScale * charge, baseScale * (2 - charge));
      } else if (
        id === MUTATION_IDS.SPORE_HOMER ||
        id === MUTATION_IDS.HORNET_NEST ||
        id === SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD
      ) {
        const throb = 1 + fastSin(this.animTime * 6.5 + sktIdx) * 0.11;
        skt.sprite.rotation = skt.angle + fastSin(this.animTime * 4 + sktIdx) * 0.08;
        skt.sprite.scale.set(baseScale * throb, baseScale * (2 - throb));
      } else if (id === MUTATION_IDS.CILIA_FLAGELLA) {
        const wagFreq = this.dashBoostTimer > 0 ? 32 : 15;
        const wagAmp = this.dashBoostTimer > 0 ? 0.42 : 0.28;
        const wag = fastSin(this.animTime * wagFreq + sktIdx) * wagAmp;
        skt.sprite.rotation = skt.angle + wag;
        skt.sprite.scale.set(baseScale * (1 + Math.abs(wag) * 0.2), baseScale);
      } else if (id === MUTATION_IDS.SPRING_TENDON) {
        const coil = 1 + fastSin(this.animTime * 7 + sktIdx) * 0.12;
        skt.sprite.rotation = skt.angle + fastSin(this.wigglePhase) * 0.1;
        skt.sprite.scale.set(baseScale * coil, baseScale / coil);
      } else if (id === MUTATION_IDS.CHITIN_CARAPACE) {
        const brace = 1 + fastSin(phase * 0.7) * 0.05;
        skt.sprite.rotation = skt.angle + fastSin(this.wigglePhase) * 0.05;
        skt.sprite.scale.set(baseScale * brace);
      } else if (id === SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC) {
        const swell = 1 + fastSin(this.animTime * 8) * 0.14;
        skt.sprite.rotation = skt.angle + fastSin(this.wigglePhase) * 0.12;
        skt.sprite.scale.set(baseScale * swell, baseScale * (2 - swell * 0.9));
      } else if (skt.isDorsal) {
        // Dorsal top-mounted organs (Venom Gland, Shock Pulsar, Frost Aura, Regen Bladder, Leech Maw, Shadow Chameleon, Tesla Barnacle)
        const dorsalPulse = 1 + fastSin(this.animTime * 6.8 + sktIdx) * 0.12;
        const dorsalSquish = 1 + fastCos(this.animTime * 6.8 + sktIdx) * 0.10;
        skt.sprite.scale.set(baseScale * dorsalPulse, baseScale * dorsalSquish);
        if (
          id === MUTATION_IDS.SHOCK_PULSAR ||
          id === MUTATION_IDS.FROST_AURA ||
          id === SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE
        ) {
          skt.sprite.rotation += dt * 1.15;
        } else if (id === SUPPLY_MUTAGEN_IDS.LEECH_MAW) {
          skt.sprite.rotation = fastSin(this.animTime * 9.5) * 0.22;
        } else {
          skt.sprite.rotation = fastSin(this.wigglePhase) * 0.15;
        }
      }

      // Update socket sprite position (perimeter sockets recoil along their radial axis; dorsal stays on dorsal pad)
      if (skt.isDorsal) {
        skt.sprite.x = skt.x ?? -9;
        skt.sprite.y = skt.y ?? 0;
      } else {
        const d = skt.dist - skt.recoilOffset;
        skt.sprite.x = fastCos(skt.angle) * d;
        skt.sprite.y = fastSin(skt.angle) * d;
      }
    }

    if (!target || !target.alive || target.isDropping) return;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distToTarget = Math.hypot(dx, dy);

    // 1. BIO-PINCER (Melee 60px, 25 DMG [50 at Lvl 2], 0.25s stun, knockback)
    if (id === MUTATION_IDS.BIO_PINCER) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.BIO_PINCER];
      const reach = (spec.range + this.getRadius() + target.getRadius()) * (lvl === 2 ? 1.25 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= reach) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = -10;
        this.attackAnimTimer = 0.26;
        let dmg = spec.damage * (lvl === 2 ? 2.0 : 1.0);
        let isCrit = false;
        if (this.critReady) {
          dmg *= 1.6;
          this.critReady = false;
          this.stealthTimer = 0;
          isCrit = true;
        }
        target.takeDamage(dmg, this, simContext, false, isCrit);
        target.stunTimer = Math.max(target.stunTimer, spec.stunDuration);
        if (simContext?.spawnStatusPopup) {
          simContext.spawnStatusPopup(target.x, target.y, 'STUNNED!', 0x00F5D4);
        }

        // Apply Knockback respecting target knockbackResist
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        const kb = spec.knockback * (1 - (target.chassisSpec.knockbackResist || 0));
        target.vx += nx * kb;
        target.vy += ny * kb;
        target.applySquash(0.68, 1.35);

        // Check Spiky Carapace 35% melee damage reflection
        if (target.meleeReflectRatio > 0) {
          this.takeDamage(dmg * target.meleeReflectRatio, target, simContext, true);
        }

        simContext.spawnDustBurst((worldX + target.x) * 0.5, (worldY + target.y) * 0.5, 5);
        SoundFX.playPincerSnap();
      }
    }

    // 2. ACID SPITTER (Every 1.4s fires curving acid glob, 18 DMG; Lvl 2 fires 2 spread shot)
    else if (id === MUTATION_IDS.ACID_SPITTER) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.ACID_SPITTER];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 8;
        this.attackAnimTimer = 0.22;
        const baseAngle = Math.atan2(target.y - worldY, target.x - worldX);
        if (lvl >= 2) {
          // Level 2 Fusion: Spread shot (2 projectiles)
          simContext.spawnAcidProjectile(this, worldX, worldY, baseAngle - 0.14, spec.damage);
          simContext.spawnAcidProjectile(this, worldX, worldY, baseAngle + 0.14, spec.damage);
        } else {
          simContext.spawnAcidProjectile(this, worldX, worldY, baseAngle, spec.damage);
        }
        SoundFX.playAcidSquelch();
      }
    }

    // 3. VENOM GLAND (Every 3.0s sprays 120px toxic spore cloud, 5 DMG/s DoT for 4s)
    else if (id === MUTATION_IDS.VENOM_GLAND) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.VENOM_GLAND];
      const radius = spec.radius * (lvl === 2 ? 1.3 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= radius * 1.15) {
        skt.cooldownTimer = spec.cooldown;
        this.attackAnimTimer = 0.25;
        const dps = spec.dotDamagePerSec * (lvl === 2 ? 1.6 : 1.0);
        simContext. triggerVenomCloud(this, this.x, this.y, radius, dps, spec.dotDuration);
        this.applySquash(1.24, 1.24);
        SoundFX.playVenomCloudHiss();
      }
    }

    // 4. CILIA FLAGELLA (+200% burst dash for 0.4s when closing in or turning)
    else if (id === MUTATION_IDS.CILIA_FLAGELLA) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.CILIA_FLAGELLA];
      if (skt.cooldownTimer <= 0 && distToTarget > 75) {
        skt.cooldownTimer = spec.cooldown * (lvl === 2 ? 0.7 : 1.0);
        this.dashBoostTimer = spec.boostDuration * (lvl === 2 ? 1.35 : 1.0);
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        this.vx += nx * 360;
        this.vy += ny * 360;
        this.applySquash(1.42, 0.68);
        simContext.spawnDustBurst(worldX, worldY, 6);
        SoundFX.playCiliaFlagellaDash();
      }
    }

    // 5. MANTIS SCYTHE (Melee 75px, high damage, 35% crit)
    else if (id === MUTATION_IDS.MANTIS_SCYTHE) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.MANTIS_SCYTHE];
      const reach = (spec.range + this.getRadius() + target.getRadius()) * (lvl === 2 ? 1.25 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= reach) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = -14;
        this.attackAnimTimer = 0.28;
        let dmg = spec.damage * (lvl === 2 ? 1.8 : 1.0);
        const isCrit = Math.random() < spec.critChance || this.critReady;
        if (isCrit) {
          dmg *= 1.75;
          this.critReady = false;
        }
        target.takeDamage(dmg, this, simContext, false, isCrit);
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        target.vx += nx * spec.knockback;
        target.vy += ny * spec.knockback;
        target.applySquash(0.7, 1.3);
        if (target.meleeReflectRatio > 0) {
          this.takeDamage(dmg * target.meleeReflectRatio, target, simContext, true);
        }
        simContext.spawnDustBurst((worldX + target.x) * 0.5, (worldY + target.y) * 0.5, 6);
        SoundFX.playMantisScytheSlash();
      }
    }

    // 6. SPIRAL DRILL (Melee 55px rapid multi-hit drill)
    else if (id === MUTATION_IDS.SPIRAL_DRILL) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.SPIRAL_DRILL];
      const reach = (spec.range + this.getRadius() + target.getRadius()) * (lvl === 2 ? 1.2 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= reach) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = -6;
        this.attackAnimTimer = 0.2;
        const dmg = spec.damage * (lvl === 2 ? 1.7 : 1.0);
        target.takeDamage(dmg, this, simContext);
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        target.vx += nx * spec.knockback;
        target.vy += ny * spec.knockback;
        if (target.meleeReflectRatio > 0) {
          this.takeDamage(dmg * target.meleeReflectRatio, target, simContext, true);
        }
        simContext.spawnDustBurst((worldX + target.x) * 0.5, (worldY + target.y) * 0.5, 3);
        SoundFX.playSpiralDrillBuzz();
      }
    }

    // 7. BONE SPEAR (Melee 95px long reach thrust)
    else if (id === MUTATION_IDS.BONE_SPEAR) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.BONE_SPEAR];
      const reach = (spec.range + this.getRadius() + target.getRadius()) * (lvl === 2 ? 1.3 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= reach) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = -18;
        this.attackAnimTimer = 0.28;
        const dmg = spec.damage * (lvl === 2 ? 1.85 : 1.0);
        target.takeDamage(dmg, this, simContext);
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        target.vx += nx * spec.knockback;
        target.vy += ny * spec.knockback;
        target.stunTimer = Math.max(target.stunTimer, 0.2);
        if (target.meleeReflectRatio > 0) {
          this.takeDamage(dmg * target.meleeReflectRatio, target, simContext, true);
        }
        simContext.spawnDustBurst(worldX, worldY, 5);
        SoundFX.playBoneSpearThrust();
      }
    }

    // 8. QUILL VOLLEY (Ranged shotgun 3-quill spread)
    else if (id === MUTATION_IDS.QUILL_VOLLEY) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.QUILL_VOLLEY];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 10;
        this.attackAnimTimer = 0.24;
        const baseAngle = Math.atan2(target.y - worldY, target.x - worldX);
        const spread = lvl === 2 ? [-0.28, -0.14, 0, 0.14, 0.28] : [-0.18, 0, 0.18];
        for (const off of spread) {
          simContext.spawnQuillProjectile(this, worldX, worldY, baseAngle + off, spec.damage);
        }
        SoundFX.playQuillVolleyShot();
      }
    }

    // 9. PLASMA SIPHON (Ranged linear energy beam)
    else if (id === MUTATION_IDS.PLASMA_SIPHON) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.PLASMA_SIPHON];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 8;
        this.attackAnimTimer = 0.24;
        const dmg = spec.damage * (lvl === 2 ? 1.75 : 1.0);
        target.takeDamage(dmg, this, simContext);
        this.heal(dmg * 0.35); // Siphon lifesteal
        simContext.triggerPlasmaBeam(worldX, worldY, target.x, target.y);
        SoundFX.playPlasmaSiphonBeam();
      }
    }

    // 10. SPORE HOMER (Homing seeker spore)
    else if (id === MUTATION_IDS.SPORE_HOMER) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.SPORE_HOMER];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 6;
        this.attackAnimTimer = 0.22;
        const angle = Math.atan2(target.y - worldY, target.x - worldX);
        simContext.spawnHomingSpore(this, worldX, worldY, angle, target, spec.damage * (lvl === 2 ? 1.5 : 1.0));
        SoundFX.playSporeHomerLaunch();
      }
    }

    // 11. HORNET NEST (Homing swarming mini paper wasps)
    else if (id === MUTATION_IDS.HORNET_NEST) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.HORNET_NEST];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 5;
        this.attackAnimTimer = 0.22;
        const baseAngle = Math.atan2(target.y - worldY, target.x - worldX);
        const count = lvl === 2 ? 3 : 2;
        for (let i = 0; i < count; i++) {
          const off = (i - (count - 1) * 0.5) * 0.45;
          simContext.spawnHornetProjectile(this, worldX, worldY, baseAngle + off, target, spec.damage);
        }
        SoundFX.playHornetSwarmBuzz();
      }
    }

    // 12. SHOCK PULSAR (Effect electric shock ring)
    else if (id === MUTATION_IDS.SHOCK_PULSAR) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.SHOCK_PULSAR];
      const radius = spec.radius * (lvl === 2 ? 1.35 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= radius * 1.2) {
        skt.cooldownTimer = spec.cooldown;
        this.attackAnimTimer = 0.26;
        simContext.triggerShockPulsar(this, this.x, this.y, radius, spec.damage, spec.stunDuration);
        SoundFX.playShockPulsarZap();
      }
    }

    // 13. FROST AURA (Effect chilling slow field)
    else if (id === MUTATION_IDS.FROST_AURA) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.FROST_AURA];
      const radius = spec.radius * (lvl === 2 ? 1.3 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= radius * 1.25) {
        skt.cooldownTimer = spec.cooldown;
        this.attackAnimTimer = 0.24;
        simContext.triggerFrostAura(this, this.x, this.y, radius, spec.slowRatio, spec.slowDuration);
        SoundFX.playFrostAuraChime();
      }
    }

    // 14. CHITIN CARAPACE (Utils passive damage reduction & armor)
    else if (id === MUTATION_IDS.CHITIN_CARAPACE) {
      // Passive armor already factored in takeDamage
    }

    // 15. SPRING TENDON (Utils elastic leap)
    else if (id === MUTATION_IDS.SPRING_TENDON) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.SPRING_TENDON];
      if (skt.cooldownTimer <= 0) {
        skt.cooldownTimer = spec.cooldown;
        this.dashBoostTimer = 0.35;
        const jumpAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.vx += fastCos(jumpAngle) * spec.leapImpulse;
        this.vy += fastSin(jumpAngle) * spec.leapImpulse;
        this.applySquash(1.4, 0.7);
        simContext.spawnDustBurst(this.x, this.y, 8);
        SoundFX.playSpringTendonBoing();
      }
    }

    // 16. REGEN BLADDER (Utils passive health regeneration)
    else if (id === MUTATION_IDS.REGEN_BLADDER) {
      const spec = INNATE_MUTATIONS[MUTATION_IDS.REGEN_BLADDER];
      const prevHp = this.hp;
      this.heal(spec.healPerSec * (lvl === 2 ? 1.8 : 1.0) * dt);
      if (this.hp > prevHp + 0.01) {
        SoundFX.playRegenBladderPulse();
      }
    }

    // Supply drop parasite weapons
    else if (id === SUPPLY_MUTAGEN_IDS.LEECH_MAW) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.LEECH_MAW];
      const range = spec.range * (lvl === 2 ? 1.25 : 1.0);
      if (distToTarget <= range) {
        this.leechTarget = target;
        const drain = spec.drainPerSec * (lvl === 2 ? 1.5 : 1.0) * dt;
        target.takeDamage(drain, this, simContext, true);
        this.heal(drain);
        SoundFX.playLeechMawSiphon();
      }
    }

    else if (id === SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC];
      if (skt.cooldownTimer <= 0) {
        skt.cooldownTimer = spec.cooldown * (lvl === 2 ? 0.75 : 1.0);
        skt.recoilOffset = 9;
        this.attackAnimTimer = 0.25;
        simContext.spawnBombardierLob(
          this,
          worldX,
          worldY,
          target.x,
          target.y,
          spec.damage * (lvl === 2 ? 1.4 : 1.0),
          spec.blastRadius
        );
        SoundFX.playBombardierLaunch();
      }
    }

    else if (id === SUPPLY_MUTAGEN_IDS.SHADOW_CHAMELEON) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.SHADOW_CHAMELEON];
      if (skt.cooldownTimer <= 0) {
        skt.cooldownTimer = spec.cooldown;
        this.stealthTimer = spec.stealthDuration;
        this.critReady = true;
        SoundFX.playShadowChameleonCloak();
      }
    }

    // 4. TESLA BARNACLE (Dorsal chain-lightning arc parasite)
    else if (id === SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE];
      const range = spec.range * (lvl === 2 ? 1.25 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= range) {
        skt.cooldownTimer = spec.cooldown;
        this.attackAnimTimer = 0.24;
        const dmg = spec.damage * (lvl === 2 ? 1.65 : 1.0);
        target.takeDamage(dmg, this, simContext);
        target.stunTimer = Math.max(target.stunTimer, spec.stunDuration);
        simContext.triggerPlasmaBeam(worldX, worldY, target.x, target.y);
        simContext.spawnThumbtackRing(target.x, target.y, 0x00BBF9);
        SoundFX.playTeslaBarnacleZap();
      }
    }

    // 5. REAPER TENDRIL (Front venomous scythe symbiont)
    else if (id === SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL];
      const reach = (spec.range + this.getRadius() + target.getRadius()) * (lvl === 2 ? 1.25 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= reach) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = -12;
        this.attackAnimTimer = 0.26;
        const dmg = spec.damage * (lvl === 2 ? 1.75 : 1.0);
        target.takeDamage(dmg, this, simContext);
        target.addVenomDot(5, 3.0, this);
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        target.vx += nx * spec.knockback;
        target.vy += ny * spec.knockback;
        target.applySquash(0.7, 1.32);
        simContext.spawnDustBurst((worldX + target.x) * 0.5, (worldY + target.y) * 0.5, 5);
        SoundFX.playMantisScytheSlash();
      }
    }

    // 6. SPORE CANNON POD (Flank twin homing spore mortar pod)
    else if (id === SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 7;
        this.attackAnimTimer = 0.22;
        const baseAngle = Math.atan2(target.y - worldY, target.x - worldX);
        const count = lvl === 2 ? 3 : 2;
        for (let i = 0; i < count; i++) {
          const off = (i - (count - 1) * 0.5) * 0.35;
          simContext.spawnHomingSpore(this, worldX, worldY, baseAngle + off, target, spec.damage);
        }
        SoundFX.playSporeHomerLaunch();
      }
    }

    // 7. ABYSSAL JAW (Front angler snap that pulls foes closer & heals)
    else if (id === SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW];
      const reach = (spec.range + this.getRadius() + target.getRadius()) * (lvl === 2 ? 1.25 : 1.0);
      if (skt.cooldownTimer <= 0 && distToTarget <= reach) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = -14;
        this.attackAnimTimer = 0.28;
        const dmg = spec.damage * (lvl === 2 ? 1.7 : 1.0);
        target.takeDamage(dmg, this, simContext);
        this.heal(12);
        const nx = dx / (distToTarget || 1);
        const ny = dy / (distToTarget || 1);
        target.vx -= nx * spec.pullImpulse;
        target.vy -= ny * spec.pullImpulse;
        target.applySquash(0.72, 1.3);
        simContext.spawnThumbtackRing(target.x, target.y, 0x7209B7);
        SoundFX.playAbyssalJawSnap();
      }
    }

    // 8. CRYO-SPINE SYMBIONT (Flank freezing quill burst)
    else if (id === SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT) {
      const spec = SUPPLY_MUTAGENS[SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT];
      if (skt.cooldownTimer <= 0 && distToTarget <= spec.range) {
        skt.cooldownTimer = spec.cooldown;
        skt.recoilOffset = 8;
        this.attackAnimTimer = 0.22;
        const baseAngle = Math.atan2(target.y - worldY, target.x - worldX);
        const spread = lvl === 2 ? [-0.24, -0.08, 0.08, 0.24] : [-0.12, 0.12];
        for (const off of spread) {
          simContext.spawnQuillProjectile(this, worldX, worldY, baseAngle + off, spec.damage);
        }
        target.applySlow(spec.slowRatio, spec.slowDuration, simContext);
        SoundFX.playFrostAuraChime();
      }
    }
  }

  syncTransforms() {
    this.root.x = this.x;
    this.root.y = this.y;

    const finalScaleX = this.scaleMultiplier * this.squashX * this.sineStretchX;
    const finalScaleY = this.scaleMultiplier * this.squashY * this.sineSquishY;
    const finalRot = this.rotation + this.visualWiggle;

    // 45-degree drop shadow offset (GDD 2.1: sudut 45°, alpha 0.35)
    const shadowOffset = this.isDropping ? 12 + this.dropAltitude * 0.18 : 9;
    this.shadowSprite.x = shadowOffset;
    this.shadowSprite.y = shadowOffset;
    const dropFactor = this.isDropping ? clamp(1 - this.dropAltitude / 900, 0.35, 1) : 1;
    this.shadowSprite.scale.set(finalScaleX * dropFactor, finalScaleY * dropFactor);
    this.shadowSprite.rotation = finalRot;

    // Body altitude, Sine Squish & Stretch, and Rotational Wiggle
    this.bodyContainer.y = -this.dropAltitude;
    this.bodyContainer.rotation = finalRot;
    this.bodyContainer.scale.set(finalScaleX, finalScaleY);
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}
