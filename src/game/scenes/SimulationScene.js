/**
 * @file SimulationScene.js
 * Section 7.1: Scene 3 - 100% UI-Free Pure Spectator Simulation Scene.
 * Implements Parachute Drop deployment, Chassis Physics, Innate & Supply Drop Mutations,
 * Bezier Gene Stealing with Thumbtack Pop Grafting, Mutational Fusion (Lvl 2),
 * Paper Confetti Elimination Physics, and Auto-Reset.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  ARENA_CENTER_X,
  ARENA_CENTER_Y,
  ARENA_RADIUS,
  PALETTE,
  CHASSIS_TYPES,
  SUPPLY_DROP_INTERVAL,
  SUPPLY_MUTAGEN_IDS,
} from '../core/Constants.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import { ObjectPool } from '../core/ObjectPool.js';
import { evalQuadraticBezier, lerp } from '../core/MathLUT.js';
import { OrganismUnit } from '../entities/OrganismUnit.js';
import { CombatPopupManager } from '../entities/CombatPopupManager.js';
import { ApexSpecimenCard } from '../entities/ApexSpecimenCard.js';
import { VictoryPopupModal } from '../entities/VictoryPopupModal.js';
import { SlotMachineOverlay } from '../entities/SlotMachineOverlay.js';
import { SoundFX } from '../audio/SoundFX.js';

const ALL_SUPPLY_IDS = Object.values(SUPPLY_MUTAGEN_IDS);

export class SimulationScene {
  constructor(engine) {
    this.engine = engine;
    this.container = new Container();

    // World Camera Container (for screen shake & champion zoom spotlight)
    this.world = new Container();
    this.container.addChild(this.world);

    this.units = [];
    this.crates = [];
    this.rings = [];
    this.beams = [];
    this.elapsedTime = 0;
    this.supplyDropTimer = 3.2; // First supply drop shortly after landing, then every 5.0s
    this.currentArenaRadius = ARENA_RADIUS;
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.victoryTimer = 0;
    this.postMatchTimer = 0;
    this.winPopupShown = false;
    this.matchEndDuration = 0;
    this.matchEnded = false;
    this.championUnit = null;
    this.inspectedUnit = null;
    this.inspectTimer = 0;
    this.isSlotRolling = false;
    this.ringShrinkAlertCooldown = 0;
    this.bezierTemp = { x: 0, y: 0 };

    this.initObjectPools();
  }

  initObjectPools() {
    // 1. Paper Confetti & Dust Particle Pool
    this.particlePool = new ObjectPool(
      () => {
        const spr = new Sprite(CentralRegistry.getTexture('PAPER_CONFETTI'));
        spr.anchor.set(0.5);
        spr.visible = false;
        return {
          sprite: spr,
          x: 0,
          y: 0,
          z: 0,
          vx: 0,
          vy: 0,
          vz: 0,
          vr: 0,
          scale: 1,
          life: 0,
          maxLife: 1,
          isConfetti: true,
        };
      },
      (p) => {
        p.sprite.visible = false;
      },
      180
    );

    // 2. Projectile Pool (Acid, Bombardier, Quill, Homing Spore, Hornet)
    this.projectilePool = new ObjectPool(
      () => {
        const spr = new Sprite(CentralRegistry.getTexture('PROJ_ACID_GLOB'));
        spr.anchor.set(0.5);
        spr.visible = false;
        return {
          sprite: spr,
          type: 'ACID', // 'ACID' | 'BOMB' | 'QUILL' | 'HOMING_SPORE' | 'HORNET'
          owner: null,
          target: null,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          startX: 0,
          startY: 0,
          ctrlX: 0,
          ctrlY: 0,
          targetX: 0,
          targetY: 0,
          t: 0,
          duration: 0.65,
          damage: 18,
          blastRadius: 0,
          curveSign: 1,
          wobblePhase: 0,
          life: 0,
        };
      },
      (proj) => {
        proj.sprite.visible = false;
        proj.owner = null;
        proj.target = null;
      },
      120
    );

    // 3. Bezier Lootable Gene Pool (GDD 4.2: Grafting Snap Effect)
    this.genePool = new ObjectPool(
      () => {
        const spr = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
        spr.anchor.set(0.5);
        spr.visible = false;
        return {
          sprite: spr,
          mutationId: null,
          category: 'INNATE',
          targetUnit: null,
          startX: 0,
          startY: 0,
          ctrlX: 0,
          ctrlY: 0,
          t: 0,
          duration: 0.58,
        };
      },
      (g) => {
        g.sprite.visible = false;
        g.targetUnit = null;
      },
      24
    );
  }

  enter() {
    this.world.removeChildren();
    this.particlePool.releaseAll();
    this.projectilePool.releaseAll();
    this.genePool.releaseAll();

    this.units = [];
    this.crates = [];
    this.rings = [];
    this.beams = [];
    this.elapsedTime = 0;
    this.supplyDropTimer = SUPPLY_DROP_INTERVAL;
    this.currentArenaRadius = ARENA_RADIUS;
    this.shakeTimer = 0;
    this.victoryTimer = 0;
    this.postMatchTimer = 0;
    this.winPopupShown = false;
    this.matchEndDuration = 0;
    this.matchEnded = false;
    this.championUnit = null;
    this.inspectedUnit = null;
    this.inspectTimer = 0;
    this.isSlotRolling = false;
    this.ringShrinkAlertCooldown = 0;

    // Allow clicking on specimens in the arena to inspect them on the Specimen Info Card
    if (this.engine.app?.canvas) {
      this.engine.app.canvas.style.cursor = 'default';
    }

    // 1. Dark Slate Paper Backdrop (#2B2D42)
    const backdrop = new Graphics();
    backdrop.rect(-400, -400, DESIGN_WIDTH + 800, DESIGN_HEIGHT + 800);
    backdrop.fill({ color: PALETTE.ARENA_BACKDROP });
    this.world.addChild(backdrop);

    // 2. Parchment / Wood Blueprint Circular Arena Board
    this.arenaSprite = new Sprite(CentralRegistry.getTexture('ARENA_FLOOR_BOARD'));
    this.arenaSprite.anchor.set(0.5);
    this.arenaSprite.x = ARENA_CENTER_X;
    this.arenaSprite.y = ARENA_CENTER_Y;
    this.arenaSprite.width = 1024;
    this.arenaSprite.height = 1024;
    this.world.addChild(this.arenaSprite);

    // Dynamic Arena Perimeter Ring & AoE Effect Graphics Layer
    this.floorFXGraphics = new Graphics();
    this.world.addChild(this.floorFXGraphics);

    // Layer for Crates, Particles, Units, Tendrils, Projectiles, Flying Genes, and Juicy Combat Popups
    this.particleLayer = new Container();
    this.unitLayer = new Container();
    this.tendrilGraphics = new Graphics();
    this.projectileLayer = new Container();
    this.airDropLayer = new Container();
    this.popupLayer = new Container();

    this.world.addChild(this.particleLayer);
    this.world.addChild(this.unitLayer);
    this.world.addChild(this.tendrilGraphics);
    this.world.addChild(this.projectileLayer);
    this.world.addChild(this.airDropLayer);
    this.world.addChild(this.popupLayer);

    this.popupManager = new CombatPopupManager(this.popupLayer);

    // Pre-attach pooled sprites to their respective layers
    this.particlePool.freeList.forEach((p) => this.particleLayer.addChild(p.sprite));
    this.projectilePool.freeList.forEach((p) => this.projectileLayer.addChild(p.sprite));
    this.genePool.freeList.forEach((g) => this.airDropLayer.addChild(g.sprite));

    // Also allow clicking near any moving specimen on the arena board
    this.world.eventMode = 'static';
    this.world.removeAllListeners('pointerdown');
    this.world.on('pointerdown', (e) => {
      const localPos = this.world.toLocal(e.global);
      let closest = null;
      let minDist = Infinity;
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (!u.alive) continue;
        const d = Math.hypot(u.x - localPos.x, u.y - localPos.y);
        if (d <= u.getRadius() + 34 && d < minDist) {
          minDist = d;
          closest = u;
        }
      }
      if (closest) {
        this.selectInspectedUnit(closest);
      }
    });

    // 4. Game Title Banner at top of arena
    this.createTitleBanner();

    // 5. Papercraft Specimen Info Card (positioned below the arena, tracking apex leader with most mutations)
    if (this.specimenCard) {
      this.specimenCard.destroy();
    }
    this.specimenCard = new ApexSpecimenCard(this.container);

    // 6. Simple Win Popup Modal (appears 2s after match end, then returns to Editor Scene after 5s)
    if (this.victoryModal) {
      this.victoryModal.destroy();
    }
    this.victoryModal = new VictoryPopupModal(this.container);

    // 7. 4-Reel Specimen Slot Machine Overlay (rolls 4 random specimens when Auto Pick is enabled)
    if (this.slotMachine) {
      this.slotMachine.destroy();
    }
    this.slotMachine = new SlotMachineOverlay(this.container);

    if (this.engine.autoPickRandomSpecimens) {
      const draftedConfigs = this.engine.rollFourRandomSpecimens();
      this.isSlotRolling = true;
      if (this.titleBannerStatusText) {
        this.titleBannerStatusText.text = 'DRAFTING 4...';
        this.titleBannerStatusText.style.fill = PALETTE.GOLD_CROWN;
      }
      this.slotMachine.startRoll(draftedConfigs, () => {
        this.isSlotRolling = false;
        this.spawnArenaUnits();
      });
    } else {
      this.isSlotRolling = false;
      this.spawnArenaUnits();
    }

    // Reset camera transform
    this.world.pivot.set(ARENA_CENTER_X, ARENA_CENTER_Y);
    this.world.position.set(ARENA_CENTER_X, ARENA_CENTER_Y);
    this.world.scale.set(1.0);
  }

  /**
   * Deploys the roster of parachuting organisms into the circular arena formation
   */
  spawnArenaUnits() {
    SoundFX.playParachuteWhoosh();
    const count = this.engine.unitCount;
    const spawnRing = ARENA_RADIUS * 0.66;
    for (let i = 0; i < count; i++) {
      const cfg = this.engine.rosterConfigs[i];
      const angle = (i / count) * Math.PI * 2 - Math.PI * 0.5;
      const sx = ARENA_CENTER_X + Math.cos(angle) * spawnRing;
      const sy = ARENA_CENTER_Y + Math.sin(angle) * spawnRing;

      const unit = new OrganismUnit({
        ...cfg,
        slotIndex: i,
        spawnX: sx,
        spawnY: sy,
      });
      unit.rotation = angle + Math.PI; // Face inward toward arena center
      unit.root.eventMode = 'static';
      unit.root.cursor = 'pointer';
      unit.root.on('pointerdown', (e) => {
        e.stopPropagation();
        this.selectInspectedUnit(unit);
      });
      this.units.push(unit);
      this.unitLayer.addChild(unit.root);
    }
  }

  /**
   * Selects a clicked specimen to display on the Specimen Info Card for 3.0 seconds
   * before automatically reverting to the specimen with the most mutations.
   * @param {OrganismUnit} unit
   */
  selectInspectedUnit(unit) {
    if (!unit || !unit.alive) return;
    SoundFX.unlock();
    SoundFX.playThumbtackPop();
    this.inspectedUnit = unit;
    this.inspectTimer = 3.0;
    this.spawnThumbtackRing(unit.x, unit.y, PALETTE.GOLD_CROWN);
  }

  /**
   * Diegetic cut-out papercraft Game Title Banner positioned at the top of the arena
   */
  createTitleBanner() {
    if (this.titleBanner) {
      this.titleBanner.destroy({ children: true });
      this.titleBanner = null;
      this.titleBannerStatusText = null;
    }

    const banner = new Container();
    banner.x = DESIGN_WIDTH * 0.5; // 540
    banner.y = 120;

    // 1. Tactile Drop Shadow
    const shadow = new Graphics();
    shadow.roundRect(-420 + 6, -60 + 8, 840, 120, 22);
    shadow.fill({ color: 0x0F1219, alpha: 0.38 });
    banner.addChild(shadow);

    // 2. Parchment Base Card
    const card = new Graphics();
    card.roundRect(-420, -60, 840, 120, 22);
    card.fill({ color: PALETTE.ARENA_FLOOR });
    card.stroke({ width: 4.5, color: PALETTE.OUTLINE_STROKE });
    banner.addChild(card);

    // 3. Inner Blueprint Accent Rim
    const innerRim = new Graphics();
    innerRim.roundRect(-408, -48, 816, 96, 14);
    innerRim.stroke({ width: 2, color: 0xDFD3B8 });
    banner.addChild(innerRim);

    // 4. Brass Corner Eyelet Grommets
    const grommetPositions = [
      { x: -392, y: -36 },
      { x: 392, y: -36 },
      { x: -392, y: 36 },
      { x: 392, y: 36 },
    ];
    grommetPositions.forEach((pos) => {
      const gSpr = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
      gSpr.anchor.set(0.5);
      gSpr.x = pos.x;
      gSpr.y = pos.y;
      gSpr.scale.set(0.65);
      banner.addChild(gSpr);
    });

    // 5. Left Pill Badge: "BATTLE ROYALE"
    const leftPill = new Graphics();
    leftPill.roundRect(-375, -22, 135, 44, 12);
    leftPill.fill({ color: 0xEDE2CE });
    leftPill.stroke({ width: 2.5, color: PALETTE.OUTLINE_STROKE });
    banner.addChild(leftPill);

    const leftPillText = new Text({
      text: 'BATTLE ROYALE',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 13,
        fontWeight: '700',
        fill: 0x4A4E69,
        letterSpacing: 0.5,
      },
    });
    leftPillText.anchor.set(0.5);
    leftPillText.x = -307.5;
    leftPillText.y = 0;
    banner.addChild(leftPillText);

    // 6. Right Pill Badge: Live Survivors Count
    const rightPill = new Graphics();
    rightPill.roundRect(240, -22, 135, 44, 12);
    rightPill.fill({ color: 0xEDE2CE });
    rightPill.stroke({ width: 2.5, color: PALETTE.OUTLINE_STROKE });
    banner.addChild(rightPill);

    this.titleBannerStatusText = new Text({
      text: `${this.engine.unitCount} ALIVE`,
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 15,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
      },
    });
    this.titleBannerStatusText.anchor.set(0.5);
    this.titleBannerStatusText.x = 307.5;
    this.titleBannerStatusText.y = 0;
    banner.addChild(this.titleBannerStatusText);

    // 7. Center Game Title Text
    const titleText = new Text({
      text: 'BIOPAPER ARENA',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 44,
        fontWeight: '900',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 2.5,
      },
    });
    titleText.anchor.set(0.5);
    titleText.x = 0;
    titleText.y = -14;
    banner.addChild(titleText);

    // 8. Subtitle Tagline
    const subtitleText = new Text({
      text: 'GENETIC AUTO-BATTLER  ·  MUTATION SIMULATION',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 13,
        fontWeight: '800',
        fill: 0x4A4E69,
        letterSpacing: 1.6,
      },
    });
    subtitleText.anchor.set(0.5);
    subtitleText.x = 0;
    subtitleText.y = 22;
    banner.addChild(subtitleText);

    this.titleBanner = banner;
    this.container.addChild(banner);
  }

  /**
   * Section 5: Spawn a Parachute Supply Drop Crate every 5.0 seconds
   */
  spawnSupplyDropCrate() {
    SoundFX.playParachuteWhoosh();
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (this.currentArenaRadius * 0.68);
    const tx = ARENA_CENTER_X + Math.cos(angle) * dist;
    const ty = ARENA_CENTER_Y + Math.sin(angle) * dist;
    const mutagenId = ALL_SUPPLY_IDS[Math.floor(Math.random() * ALL_SUPPLY_IDS.length)];

    const root = new Container();
    root.x = tx;
    root.y = ty;

    const shadow = new Graphics();
    shadow.circle(0, 0, 26);
    shadow.fill({ color: 0x0F1219, alpha: 0.35 });
    root.addChild(shadow);

    const crateSprite = new Sprite(CentralRegistry.getTexture('SUPPLY_CRATE'));
    crateSprite.anchor.set(0.5);
    root.addChild(crateSprite);

    const chuteSprite = new Sprite(CentralRegistry.getTexture('SUPPLY_PARACHUTE'));
    chuteSprite.anchor.set(0.5, 0.85);
    root.addChild(chuteSprite);

    this.airDropLayer.addChild(root);

    // GDD Section 5: Starts high in sky (equivalent to Y: -100) and descends gently to target X,Y
    const startAltitude = Math.max(460, ty + 140);
    this.crates.push({
      root,
      shadow,
      crateSprite,
      chuteSprite,
      x: tx,
      y: ty,
      altitude: startAltitude,
      dropSpeed: 240,
      swayPhase: Math.random() * Math.PI * 2,
      mutagenId,
      landed: false,
      active: true,
    });
  }

  spawnAcidProjectile(owner, x, y, angle, damage) {
    const proj = this.projectilePool.acquire();
    if (!proj.sprite.parent) this.projectileLayer.addChild(proj.sprite);

    proj.type = 'ACID';
    proj.owner = owner;
    proj.x = x;
    proj.y = y;
    const speed = 460;
    proj.vx = Math.cos(angle) * speed;
    proj.vy = Math.sin(angle) * speed;
    proj.damage = damage;
    proj.curveSign = Math.random() < 0.5 ? 1 : -1;
    proj.life = 1.1;

    proj.sprite.texture = CentralRegistry.getTexture('PROJ_ACID_GLOB');
    proj.sprite.x = x;
    proj.sprite.y = y;
    proj.sprite.scale.set(1.0);
    proj.sprite.visible = true;
  }

  spawnBombardierLob(owner, startX, startY, targetX, targetY, damage, blastRadius) {
    const proj = this.projectilePool.acquire();
    if (!proj.sprite.parent) this.projectileLayer.addChild(proj.sprite);

    proj.type = 'BOMB';
    proj.owner = owner;
    proj.startX = startX;
    proj.startY = startY;
    proj.targetX = targetX;
    proj.targetY = targetY;
    proj.ctrlX = (startX + targetX) * 0.5;
    proj.ctrlY = Math.min(startY, targetY) - 160;
    proj.t = 0;
    proj.duration = 0.68;
    proj.damage = damage;
    proj.blastRadius = blastRadius;

    proj.sprite.texture = CentralRegistry.getTexture('PROJ_BOMB_SAC');
    proj.sprite.x = startX;
    proj.sprite.y = startY;
    proj.sprite.visible = true;
  }

  triggerVenomCloud(owner, x, y, radius, dps, dotDuration) {
    // Visual expanding toxic ring
    this.rings.push({
      x,
      y,
      radius: 18,
      maxRadius: radius,
      color: PALETTE.VENOM_ACID,
      alpha: 0.85,
      lineWidth: 8,
      speed: (radius - 18) / 0.35,
    });

    // Apply Venom DoT to all enemy units in radius
    for (let i = 0; i < this.units.length; i++) {
      const other = this.units[i];
      if (other === owner || !other.alive || other.isDropping) continue;
      const d = Math.hypot(other.x - x, other.y - y);
      if (d <= radius + other.getRadius()) {
        other.addVenomDot(dps, dotDuration, owner);
        other.takeDamage(4, owner, this, true);
      }
    }
  }

  spawnQuillProjectile(owner, x, y, angle, damage) {
    const proj = this.projectilePool.acquire();
    if (!proj.sprite.parent) this.projectileLayer.addChild(proj.sprite);

    proj.type = 'QUILL';
    proj.owner = owner;
    proj.target = null;
    proj.x = x;
    proj.y = y;
    const speed = 520;
    proj.vx = Math.cos(angle) * speed;
    proj.vy = Math.sin(angle) * speed;
    proj.damage = damage;
    proj.life = 0.85;

    proj.sprite.texture = CentralRegistry.getTexture('PROJ_QUILL');
    proj.sprite.x = x;
    proj.sprite.y = y;
    proj.sprite.rotation = angle;
    proj.sprite.scale.set(1.0);
    proj.sprite.visible = true;
  }

  spawnHomingSpore(owner, x, y, angle, target, damage) {
    const proj = this.projectilePool.acquire();
    if (!proj.sprite.parent) this.projectileLayer.addChild(proj.sprite);

    proj.type = 'HOMING_SPORE';
    proj.owner = owner;
    proj.target = target;
    proj.x = x;
    proj.y = y;
    const speed = 310;
    proj.vx = Math.cos(angle) * speed;
    proj.vy = Math.sin(angle) * speed;
    proj.damage = damage;
    proj.life = 2.4;

    proj.sprite.texture = CentralRegistry.getTexture('PROJ_HOMING_SPORE');
    proj.sprite.x = x;
    proj.sprite.y = y;
    proj.sprite.rotation = angle;
    proj.sprite.scale.set(1.1);
    proj.sprite.visible = true;
  }

  spawnHornetProjectile(owner, x, y, angle, target, damage) {
    const proj = this.projectilePool.acquire();
    if (!proj.sprite.parent) this.projectileLayer.addChild(proj.sprite);

    proj.type = 'HORNET';
    proj.owner = owner;
    proj.target = target;
    proj.x = x;
    proj.y = y;
    const speed = 350;
    proj.vx = Math.cos(angle) * speed;
    proj.vy = Math.sin(angle) * speed;
    proj.wobblePhase = Math.random() * Math.PI * 2;
    proj.damage = damage;
    proj.life = 2.6;

    proj.sprite.texture = CentralRegistry.getTexture('PROJ_HORNET');
    proj.sprite.x = x;
    proj.sprite.y = y;
    proj.sprite.rotation = angle;
    proj.sprite.scale.set(1.0);
    proj.sprite.visible = true;
  }

  triggerPlasmaBeam(x1, y1, x2, y2) {
    this.beams.push({
      x1,
      y1,
      x2,
      y2,
      life: 0.16,
      maxLife: 0.16,
    });
    this.spawnDustBurst((x1 + x2) * 0.5, (y1 + y2) * 0.5, 3);
  }

  triggerShockPulsar(owner, x, y, radius, damage, stunDuration) {
    this.rings.push({
      x,
      y,
      radius: 16,
      maxRadius: radius,
      color: 0x00F5D4,
      alpha: 0.95,
      lineWidth: 9,
      speed: (radius - 16) / 0.28,
    });
    this.spawnDustBurst(x, y, 6);
    this.triggerScreenShake(0.12, 5);

    for (let i = 0; i < this.units.length; i++) {
      const other = this.units[i];
      if (other === owner || !other.alive || other.isDropping) continue;
      const dx = other.x - x;
      const dy = other.y - y;
      const d = Math.hypot(dx, dy);
      if (d <= radius + other.getRadius()) {
        other.takeDamage(damage, owner, this);
        other.stunTimer = Math.max(other.stunTimer, stunDuration);
        const nx = dx / (d || 1);
        const ny = dy / (d || 1);
        other.vx += nx * 220;
        other.vy += ny * 220;
        other.applySquash(0.7, 1.3);
      }
    }
  }

  triggerFrostAura(owner, x, y, radius, slowRatio, slowDuration) {
    this.rings.push({
      x,
      y,
      radius: 20,
      maxRadius: radius,
      color: 0x90E0EF,
      alpha: 0.9,
      lineWidth: 7,
      speed: (radius - 20) / 0.35,
    });

    for (let i = 0; i < this.units.length; i++) {
      const other = this.units[i];
      if (other === owner || !other.alive || other.isDropping) continue;
      const d = Math.hypot(other.x - x, other.y - y);
      if (d <= radius + other.getRadius()) {
        if (other.applySlow) {
          other.applySlow(slowRatio, slowDuration);
        }
        other.takeDamage(6, owner, this, true);
        other.applySquash(0.85, 1.15);
      }
    }
  }

  spawnThumbtackRing(x, y, color = PALETTE.GOLD_CROWN) {
    this.rings.push({
      x,
      y,
      radius: 12,
      maxRadius: 68,
      color,
      alpha: 0.95,
      lineWidth: 6,
      speed: 210,
    });
    this.spawnDustBurst(x, y, 8);
  }

  spawnDustBurst(x, y, count = 8) {
    const tex = CentralRegistry.getTexture('PAPER_DUST');
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.acquire();
      if (!p.sprite.parent) this.particleLayer.addChild(p.sprite);
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const spd = 65 + Math.random() * 110;
      p.sprite.texture = tex;
      p.sprite.tint = 0xFFF8F0;
      p.x = x;
      p.y = y;
      p.z = 0;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.vz = 0;
      p.vr = (Math.random() - 0.5) * 6;
      p.scale = 0.7 + Math.random() * 0.6;
      p.life = 0.28 + Math.random() * 0.18;
      p.maxLife = p.life;
      p.isConfetti = false;
      p.sprite.x = x;
      p.sprite.y = y;
      p.sprite.scale.set(p.scale);
      p.sprite.alpha = 0.85;
      p.sprite.visible = true;
    }
  }

  spawnPaperConfettiExplosion(x, y, primaryColor, count = 34) {
    const tex = CentralRegistry.getTexture('PAPER_CONFETTI');
    const accentColors = [primaryColor, primaryColor, 0xFFF8F0, PALETTE.GOLD_CROWN, PALETTE.VENOM_ACID];

    for (let i = 0; i < count; i++) {
      const p = this.particlePool.acquire();
      if (!p.sprite.parent) this.particleLayer.addChild(p.sprite);
      const angle = Math.random() * Math.PI * 2;
      const spd = 90 + Math.random() * 340;
      p.sprite.texture = tex;
      p.sprite.tint = accentColors[i % accentColors.length];
      p.x = x;
      p.y = y;
      p.z = 10 + Math.random() * 25;
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.vz = 140 + Math.random() * 220;
      p.vr = (Math.random() - 0.5) * 16;
      p.scale = 0.85 + Math.random() * 0.65;
      p.life = 1.1 + Math.random() * 0.7;
      p.maxLife = p.life;
      p.isConfetti = true;
      p.sprite.x = x;
      p.sprite.y = y - p.z;
      p.sprite.scale.set(p.scale);
      p.sprite.alpha = 1.0;
      p.sprite.visible = true;
    }
  }

  spawnDamagePopup(x, y, amount, isCrit = false, isReflectOrDot = false) {
    if (this.popupManager) {
      this.popupManager.spawnDamage(x, y, amount, isCrit, isReflectOrDot);
    }
  }

  spawnStatusPopup(x, y, message, color = 0x00F5D4) {
    if (this.popupManager) {
      this.popupManager.spawnStatus(x, y, message, color);
    }
  }

  spawnCalloutPopup(x, y, message, color = PALETTE.GOLD_CROWN) {
    if (this.popupManager) {
      this.popupManager.spawnCallout(x, y, message, color);
    }
  }

  /**
   * Section 4.2: Gene Stealing & Bezier Grafting Mechanic
   */
  handleUnitEliminated(victim, killer) {
    victim.root.visible = false;
    SoundFX.playPaperTearConfetti();
    this.triggerScreenShake(0.18, 9);
    this.spawnCalloutPopup(victim.x, victim.y, 'ELIMINATED!', PALETTE.CIRCLE_CHASSIS);

    // 1. Paper Confetti Explosion using the unit's unique organism color
    this.spawnPaperConfettiExplosion(victim.x, victim.y, victim.color || victim.chassisSpec.color, 36);

    // Find recipient killer (or nearest living survivor if self/environment KO)
    let recipient = killer && killer.alive ? killer : null;
    if (!recipient) {
      let minDist = Infinity;
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (u.alive && u !== victim) {
          const d = Math.hypot(u.x - victim.x, u.y - victim.y);
          if (d < minDist) {
            minDist = d;
            recipient = u;
          }
        }
      }
    }

    if (recipient) {
      recipient.kills++;
      recipient.heal(22);
      this.spawnCalloutPopup(recipient.x, recipient.y, 'GENE THEFT!', PALETTE.GOLD_CROWN);

      // 2. Detach all organs from victim as Lootable Genes flying along Bezier curve to recipient
      const victimSockets = victim.sockets.filter((s) => s.mutationId !== null);
      victimSockets.forEach((skt, idx) => {
        const gene = this.genePool.acquire();
        if (!gene.sprite.parent) this.airDropLayer.addChild(gene.sprite);

        const texKey =
          skt.category === 'INNATE' ? `${skt.mutationId}_LVL${skt.level}` : skt.mutationId;
        gene.sprite.texture = CentralRegistry.getTexture(texKey) || CentralRegistry.getTexture('SOCKET_GROMMET');
        gene.mutationId = skt.mutationId;
        gene.category = skt.category;
        gene.targetUnit = recipient;
        gene.startX = victim.x;
        gene.startY = victim.y;

        // Perpendicular Bezier control point for a juicy curved grafting trajectory
        const midX = (victim.x + recipient.x) * 0.5;
        const midY = (victim.y + recipient.y) * 0.5;
        const offsetAngle = Math.atan2(recipient.y - victim.y, recipient.x - victim.x) + (idx % 2 === 0 ? 1.2 : -1.2);
        gene.ctrlX = midX + Math.cos(offsetAngle) * 145;
        gene.ctrlY = midY + Math.sin(offsetAngle) * 145 - 60;
        gene.t = 0;
        gene.duration = 0.48 + idx * 0.08;

        gene.sprite.x = victim.x;
        gene.sprite.y = victim.y;
        gene.sprite.scale.set(1.25);
        gene.sprite.visible = true;
      });
    }
  }

  triggerScreenShake(duration, intensity) {
    this.shakeTimer = Math.max(this.shakeTimer, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  update(dt) {
    const clampedDt = Math.min(dt, 0.05);

    // If the 4-Reel Specimen Slot Machine is currently rolling, update it and pause arena combat
    if (this.isSlotRolling) {
      if (this.slotMachine) {
        this.slotMachine.update(clampedDt);
      }
      this.updateParticles(clampedDt);
      return;
    }

    this.elapsedTime += clampedDt;

    // 1. Arena Ring Tightening for 35–45s Retention Arc (starts gently after 14s)
    if (!this.matchEnded && this.elapsedTime > 14) {
      const shrinkProgress = Math.min(1, (this.elapsedTime - 14) / 26);
      this.currentArenaRadius = lerp(ARENA_RADIUS, 215, shrinkProgress);
      this.ringShrinkAlertCooldown -= clampedDt;
      if (this.ringShrinkAlertCooldown <= 0 && shrinkProgress < 1) {
        this.ringShrinkAlertCooldown = 6.5;
        SoundFX.playRingShrinkAlert();
      }
    }

    // 2. Supply Drop Spawner (Strictly every 5.0 seconds per GDD Section 5)
    if (!this.matchEnded) {
      this.supplyDropTimer -= clampedDt;
      if (this.supplyDropTimer <= 0) {
        this.supplyDropTimer = SUPPLY_DROP_INTERVAL;
        this.spawnSupplyDropCrate();
      }
    }

    // 3. Update Organisms
    let aliveCount = 0;
    let lastSurvivor = null;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.alive) {
        u.update(clampedDt, this);
        aliveCount++;
        lastSurvivor = u;
      }
    }

    // 4. Resolve Unit-vs-Unit & Unit-vs-Arena Physics Collisions
    this.resolvePhysicsCollisions(clampedDt);

    // 5. Update Supply Drop Crates
    this.updateSupplyCrates(clampedDt);

    // 6. Update Projectiles (Acid Globs & Bombardier Bombs)
    this.updateProjectiles(clampedDt);

    // 7. Update Bezier Flying Lootable Genes
    this.updateFlyingGenes(clampedDt);

    // 8. Update Particles (Paper Confetti & Dust)
    this.updateParticles(clampedDt);

    // 9. Draw Dynamic Floor Rings & Leech Maw Bioluminescent Tendrils
    this.renderFloorAndTendrils(clampedDt);

    // 10. Update Juicy Combat Popups & Floating Text
    if (this.popupManager) {
      this.popupManager.update(clampedDt);
    }

    // 11. Update 3-second Clicked Specimen Inspection Timer
    if (this.inspectTimer > 0) {
      this.inspectTimer -= clampedDt;
      if (this.inspectTimer <= 0 || !this.inspectedUnit || !this.inspectedUnit.alive) {
        this.inspectTimer = 0;
        this.inspectedUnit = null;
      }
    }

    // 12. Update Specimen Info Card (shows clicked specimen for 3s, then reverts to specimen with most mutations)
    if (this.specimenCard) {
      this.specimenCard.update(clampedDt, this.units, this.championUnit, this.inspectedUnit);
    }

    // 12. Update Live Title Banner Status
    if (this.titleBannerStatusText) {
      if (this.matchEnded && this.championUnit) {
        this.titleBannerStatusText.text = 'CHAMPION!';
        this.titleBannerStatusText.style.fill = PALETTE.GOLD_CROWN;
      } else {
        this.titleBannerStatusText.text = `${aliveCount} / ${this.units.length} ALIVE`;
        this.titleBannerStatusText.style.fill = PALETTE.OUTLINE_STROKE;
      }
    }

    // 11. Check Victory / End of Battle Royale
    if (!this.matchEnded && aliveCount <= 1 && this.elapsedTime > 3.0) {
      this.matchEnded = true;
      this.championUnit = lastSurvivor || this.units[0] || null;
      this.postMatchTimer = 0;
      this.winPopupShown = false;
      this.matchEndDuration = this.elapsedTime;
      SoundFX.playVictoryChord();
      if (this.championUnit) {
        this.spawnCalloutPopup(this.championUnit.x, this.championUnit.y, 'APEX CHAMPION!', PALETTE.GOLD_CROWN);
        this.spawnPaperConfettiExplosion(
          this.championUnit.x,
          this.championUnit.y,
          PALETTE.GOLD_CROWN,
          45
        );
      }
    }

    if (this.matchEnded) {
      this.postMatchTimer += clampedDt;

      // Smoothly spotlight the surviving Apex Organism during the 2-second post-match celebration
      if (this.championUnit && this.championUnit.alive) {
        this.world.pivot.x = lerp(this.world.pivot.x, this.championUnit.x, clampedDt * 4);
        this.world.pivot.y = lerp(this.world.pivot.y, this.championUnit.y, clampedDt * 4);
        const s = lerp(this.world.scale.x, 1.28, clampedDt * 4);
        this.world.scale.set(s);
      }

      // Show Win Popup after 2.0 seconds of game end
      if (this.postMatchTimer >= 2.0 && !this.winPopupShown) {
        this.winPopupShown = true;
        SoundFX.playThumbtackPop();
        if (this.victoryModal) {
          this.victoryModal.show(this.championUnit, this.matchEndDuration);
        }
      }

      // Update Win Popup for 5.0 seconds (from 2.0s to 7.0s)
      if (this.winPopupShown && this.victoryModal) {
        const remainingReturnSec = Math.max(0, 7.0 - this.postMatchTimer);
        this.victoryModal.update(clampedDt, remainingReturnSec);
      }

      // Automatically return to Editor Scene 5.0 seconds after Win Popup appears (7.0s total)
      if (this.postMatchTimer >= 7.0) {
        this.engine.switchToEditorScene();
        return;
      }
    }

    // 11. Apply Screen Shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= clampedDt;
      const ox = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.world.position.set(ARENA_CENTER_X + ox, ARENA_CENTER_Y + oy);
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
        this.world.position.set(ARENA_CENTER_X, ARENA_CENTER_Y);
      }
    }
  }

  resolvePhysicsCollisions(dt) {
    const n = this.units.length;

    // A. Organism vs Arena Boundary Wall
    for (let i = 0; i < n; i++) {
      const u = this.units[i];
      if (!u.alive || u.isDropping) continue;

      const dx = u.x - ARENA_CENTER_X;
      const dy = u.y - ARENA_CENTER_Y;
      const dist = Math.hypot(dx, dy);
      const maxDist = this.currentArenaRadius - u.getRadius();

      if (dist > maxDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        u.x = ARENA_CENTER_X + nx * maxDist;
        u.y = ARENA_CENTER_Y + ny * maxDist;

        // Reflect velocity inward
        const dot = u.vx * nx + u.vy * ny;
        if (dot > 0) {
          const rest = u.chassisSpec.restitution;
          u.vx -= (1 + rest) * dot * nx;
          u.vy -= (1 + rest) * dot * ny;
          u.applySquash(0.75, 1.3);
          SoundFX.playWallBounce();
          this.spawnDustBurst(u.x + nx * u.getRadius(), u.y + ny * u.getRadius(), 4);
        }
      }
    }

    // B. Organism vs Organism Elastic & Combat Collisions
    for (let i = 0; i < n; i++) {
      const a = this.units[i];
      if (!a.alive || a.isDropping) continue;

      for (let j = i + 1; j < n; j++) {
        const b = this.units[j];
        if (!b.alive || b.isDropping) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.getRadius() + b.getRadius();

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          const totalMass = a.mass + b.mass;
          const aShare = b.mass / totalMass;
          const bShare = a.mass / totalMass;

          a.x -= nx * overlap * aShare;
          a.y -= ny * overlap * aShare;
          b.x += nx * overlap * bShare;
          b.y += ny * overlap * bShare;

          // Relative velocity along normal
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const e = Math.min(a.chassisSpec.restitution, b.chassisSpec.restitution);
            const jImpulse = Math.max(190, (-(1 + e) * velAlongNormal) / (1 / a.mass + 1 / b.mass));

            const impX = jImpulse * nx;
            const impY = jImpulse * ny;

            a.vx -= (impX / a.mass) * (1 - (a.chassisSpec.knockbackResist || 0));
            a.vy -= (impY / a.mass) * (1 - (a.chassisSpec.knockbackResist || 0));
            b.vx += (impX / b.mass) * (1 - (b.chassisSpec.knockbackResist || 0));
            b.vy += (impY / b.mass) * (1 - (b.chassisSpec.knockbackResist || 0));

            // Smooth elastic bumper bounce without body slam squash distortion or attack sound.
            // Specimen damage and attack animations are strictly delivered via equipped weapons and utility mutations.
            this.spawnDustBurst((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 2);
          }
        }
      }
    }
  }

  updateSupplyCrates(dt) {
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      if (!c.active) continue;

      if (!c.landed) {
        c.altitude -= c.dropSpeed * dt;
        c.swayPhase += dt * 4.2;
        const swayX = Math.sin(c.swayPhase) * 14;
        c.crateSprite.x = swayX;
        c.crateSprite.y = -c.altitude;
        c.chuteSprite.x = swayX;
        c.chuteSprite.y = -c.altitude - 22;
        c.chuteSprite.rotation = Math.sin(c.swayPhase) * 0.2;
        c.shadow.scale.set(Math.max(0.3, 1 - c.altitude / 600));

        if (c.altitude <= 0) {
          c.altitude = 0;
          c.landed = true;
          c.crateSprite.x = 0;
          c.crateSprite.y = 0;
          c.chuteSprite.visible = false;
          c.shadow.scale.set(1.1);
          this.spawnDustBurst(c.x, c.y, 8);
          SoundFX.playThumbtackPop();
        }
      } else {
        // Bob gently on arena floor and check organism pickup
        c.swayPhase += dt * 6;
        const pulse = 1 + Math.sin(c.swayPhase) * 0.07;
        c.crateSprite.scale.set(pulse, 1 / pulse);

        for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
          const u = this.units[uIdx];
          if (!u.alive || u.isDropping) continue;
          const d = Math.hypot(u.x - c.x, u.y - c.y);
          if (d <= u.getRadius() + 28) {
            u.applySupplyMutagen(c.mutagenId, this);
            this.spawnPaperConfettiExplosion(c.x, c.y, PALETTE.CRATE_CARDBOARD, 16);
            c.active = false;
            c.root.destroy({ children: true });
            this.crates.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  updateProjectiles(dt) {
    const active = this.projectilePool.activeList;
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];

      if (p.type === 'ACID') {
        p.life -= dt;
        // Slight organic curving trajectory (GDD 4.1: Proyektil melengkung dan meletup saat kontak)
        const perpX = -p.vy * 0.0018 * p.curveSign;
        const perpY = p.vx * 0.0018 * p.curveSign;
        p.vx += perpX;
        p.vy += perpY;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.sprite.x = p.x;
        p.sprite.y = p.y;
        p.sprite.rotation += dt * 10;

        let hit = false;
        for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
          const u = this.units[uIdx];
          if (u === p.owner || !u.alive || u.isDropping) continue;
          if (Math.hypot(u.x - p.x, u.y - p.y) <= u.getRadius() + 10) {
            u.takeDamage(p.damage, p.owner, this);
            u.applySquash(0.8, 1.22);
            this.spawnThumbtackRing(p.x, p.y, PALETTE.VENOM_ACID);
            SoundFX.playAcidSquelch();
            hit = true;
            break;
          }
        }

        if (hit || p.life <= 0) {
          this.projectilePool.release(p);
        }
      } else if (p.type === 'BOMB') {
        p.t += dt / p.duration;
        evalQuadraticBezier(
          p.startX,
          p.startY,
          p.ctrlX,
          p.ctrlY,
          p.targetX,
          p.targetY,
          Math.min(1, p.t),
          this.bezierTemp
        );
        p.sprite.x = this.bezierTemp.x;
        p.sprite.y = this.bezierTemp.y;
        const arcScale = 1 + Math.sin(Math.min(1, p.t) * Math.PI) * 0.65;
        p.sprite.scale.set(arcScale);
        p.sprite.rotation += dt * 8;

        if (p.t >= 1) {
          // Massive AoE Bombardier Explosion (GDD 5.1)
          this.rings.push({
            x: p.targetX,
            y: p.targetY,
            radius: 16,
            maxRadius: p.blastRadius,
            color: PALETTE.SUPPLY_PARASITE,
            alpha: 0.95,
            lineWidth: 10,
            speed: 340,
          });
          this.spawnPaperConfettiExplosion(p.targetX, p.targetY, PALETTE.SUPPLY_PARASITE, 20);
          this.triggerScreenShake(0.15, 7);
          SoundFX.playBombExplosion();

          for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
            const u = this.units[uIdx];
            if (u === p.owner || !u.alive || u.isDropping) continue;
            const dx = u.x - p.targetX;
            const dy = u.y - p.targetY;
            const d = Math.hypot(dx, dy);
            if (d <= p.blastRadius + u.getRadius()) {
              u.takeDamage(p.damage, p.owner, this);
              const nx = dx / (d || 1);
              const ny = dy / (d || 1);
              u.vx += nx * 280;
              u.vy += ny * 280;
              u.applySquash(0.68, 1.38);
            }
          }

          this.projectilePool.release(p);
        }
      } else if (p.type === 'QUILL') {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.sprite.x = p.x;
        p.sprite.y = p.y;
        p.sprite.rotation = Math.atan2(p.vy, p.vx);

        let hit = false;
        for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
          const u = this.units[uIdx];
          if (u === p.owner || !u.alive || u.isDropping) continue;
          if (Math.hypot(u.x - p.x, u.y - p.y) <= u.getRadius() + 12) {
            u.takeDamage(p.damage, p.owner, this);
            u.applySquash(0.78, 1.25);
            this.spawnDustBurst(p.x, p.y, 4);
            SoundFX.playPincerSnap();
            hit = true;
            break;
          }
        }
        if (hit || p.life <= 0) {
          this.projectilePool.release(p);
        }
      } else if (p.type === 'HOMING_SPORE') {
        p.life -= dt;
        if (p.target && p.target.alive && !p.target.isDropping) {
          const toTargetAngle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          const steerSpeed = 4.8 * dt;
          let diff = toTargetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = currentAngle + Math.max(-steerSpeed, Math.min(steerSpeed, diff));
          const spd = 310;
          p.vx = Math.cos(newAngle) * spd;
          p.vy = Math.sin(newAngle) * spd;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.sprite.x = p.x;
        p.sprite.y = p.y;
        p.sprite.rotation = Math.atan2(p.vy, p.vx) + Math.sin(p.life * 12) * 0.2;

        let hit = false;
        for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
          const u = this.units[uIdx];
          if (u === p.owner || !u.alive || u.isDropping) continue;
          if (Math.hypot(u.x - p.x, u.y - p.y) <= u.getRadius() + 14) {
            u.takeDamage(p.damage, p.owner, this);
            u.applySquash(0.75, 1.28);
            this.spawnThumbtackRing(p.x, p.y, 0x9B5DE5);
            SoundFX.playAcidSquelch();
            hit = true;
            break;
          }
        }
        if (hit || p.life <= 0) {
          this.projectilePool.release(p);
        }
      } else if (p.type === 'HORNET') {
        p.life -= dt;
        p.wobblePhase += dt * 18;
        if (p.target && p.target.alive && !p.target.isDropping) {
          const toTargetAngle = Math.atan2(p.target.y - p.y, p.target.x - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          const steerSpeed = 6.2 * dt;
          let diff = toTargetAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const newAngle = currentAngle + Math.max(-steerSpeed, Math.min(steerSpeed, diff));
          const spd = 350;
          p.vx = Math.cos(newAngle) * spd;
          p.vy = Math.sin(newAngle) * spd;
        }
        // Lateral wobble flutter for paper insect flight
        const perpX = -p.vy / 350;
        const perpY = p.vx / 350;
        const wobble = Math.sin(p.wobblePhase) * 65 * dt;

        p.x += p.vx * dt + perpX * wobble;
        p.y += p.vy * dt + perpY * wobble;
        p.sprite.x = p.x;
        p.sprite.y = p.y;
        p.sprite.rotation = Math.atan2(p.vy, p.vx) + Math.sin(p.wobblePhase) * 0.35;

        let hit = false;
        for (let uIdx = 0; uIdx < this.units.length; uIdx++) {
          const u = this.units[uIdx];
          if (u === p.owner || !u.alive || u.isDropping) continue;
          if (Math.hypot(u.x - p.x, u.y - p.y) <= u.getRadius() + 12) {
            u.takeDamage(p.damage, p.owner, this);
            u.applySquash(0.72, 1.3);
            this.spawnDustBurst(p.x, p.y, 4);
            SoundFX.playPincerSnap();
            hit = true;
            break;
          }
        }
        if (hit || p.life <= 0) {
          this.projectilePool.release(p);
        }
      }
    }
  }

  updateFlyingGenes(dt) {
    const active = this.genePool.activeList;
    for (let i = active.length - 1; i >= 0; i--) {
      const g = active[i];
      const target = g.targetUnit;
      if (!target || !target.alive) {
        this.genePool.release(g);
        continue;
      }

      g.t += dt / g.duration;
      evalQuadraticBezier(
        g.startX,
        g.startY,
        g.ctrlX,
        g.ctrlY,
        target.x,
        target.y,
        Math.min(1, g.t),
        this.bezierTemp
      );
      g.sprite.x = this.bezierTemp.x;
      g.sprite.y = this.bezierTemp.y;
      g.sprite.rotation += dt * 12;

      if (g.t >= 1) {
        // Graft onto host socket or trigger Level 2 Mutational Fusion!
        target.graftMutation(g.mutationId, g.category, true, this);
        this.spawnThumbtackRing(target.x, target.y, PALETTE.GOLD_CROWN);
        this.genePool.release(g);
      }
    }
  }

  updateParticles(dt) {
    const active = this.particlePool.activeList;
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particlePool.release(p);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.isConfetti) {
        p.vz -= 680 * dt; // Gravity on 2.5D height
        p.z += p.vz * dt;
        if (p.z < 0) {
          p.z = 0;
          p.vz = -p.vz * 0.45;
          p.vx *= 0.72;
          p.vy *= 0.72;
        }
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.sprite.x = p.x;
        p.sprite.y = p.y - p.z;
        p.sprite.rotation += p.vr * dt;
        // 3D paper flutter illusion
        const flutter = Math.cos(p.life * 18) * p.scale;
        p.sprite.scale.set(flutter, p.scale);
      } else {
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.sprite.x = p.x;
        p.sprite.y = p.y;
        p.sprite.scale.set(p.scale * (p.life / p.maxLife));
      }

      p.sprite.alpha = Math.min(1, (p.life / p.maxLife) * 1.4);
    }
  }

  renderFloorAndTendrils(dt) {
    const fg = this.floorFXGraphics;
    fg.clear();

    // 1. Draw Active Arena Boundary Ring
    if (this.currentArenaRadius < ARENA_RADIUS - 2) {
      fg.circle(ARENA_CENTER_X, ARENA_CENTER_Y, this.currentArenaRadius);
      fg.stroke({ width: 6, color: PALETTE.CIRCLE_CHASSIS, alpha: 0.75 });
    }

    // 2. Update & Draw Expanding AoE / Thumbtack Pop Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += r.speed * dt;
      const progress = r.radius / r.maxRadius;
      if (progress >= 1) {
        this.rings.splice(i, 1);
        continue;
      }
      fg.circle(r.x, r.y, r.radius);
      fg.stroke({
        width: r.lineWidth * (1 - progress * 0.6),
        color: r.color,
        alpha: r.alpha * (1 - progress),
      });
    }

    // 3. Draw Leech Maw Bioluminescent Purple Siphon Tendrils (GDD 5.1)
    const tg = this.tendrilGraphics;
    tg.clear();
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (!u.alive || !u.leechTarget || !u.leechTarget.alive) continue;
      const target = u.leechTarget;

      const midX = (u.x + target.x) * 0.5 + Math.sin(this.elapsedTime * 16 + i) * 18;
      const midY = (u.y + target.y) * 0.5 + Math.cos(this.elapsedTime * 16 + i) * 18;

      // Outer dark cartoon outline
      tg.moveTo(u.x, u.y);
      tg.quadraticCurveTo(midX, midY, target.x, target.y);
      tg.stroke({ width: 10, color: PALETTE.OUTLINE_STROKE, cap: 'round' });

      // Inner bioluminescent purple fleshy tendril (#9B5DE5)
      tg.moveTo(u.x, u.y);
      tg.quadraticCurveTo(midX, midY, target.x, target.y);
      tg.stroke({ width: 5.5, color: PALETTE.SUPPLY_PARASITE, cap: 'round' });

      // Travelling siphon pulse glob moving from victim to host
      const siphonT = 1 - ((this.elapsedTime * 2.4) % 1);
      evalQuadraticBezier(u.x, u.y, midX, midY, target.x, target.y, siphonT, this.bezierTemp);
      tg.circle(this.bezierTemp.x, this.bezierTemp.y, 6.5);
      tg.fill({ color: PALETTE.VENOM_ACID });
      tg.stroke({ width: 2.5, color: PALETTE.OUTLINE_STROKE });
    }

    // 4. Draw Plasma Siphon Linear Laser Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      if (b.life <= 0) {
        this.beams.splice(i, 1);
        continue;
      }
      const alpha = b.life / b.maxLife;
      // Outer bright cyan aura
      fg.moveTo(b.x1, b.y1);
      fg.lineTo(b.x2, b.y2);
      fg.stroke({ width: 9, color: 0x48CAE4, alpha: alpha * 0.8, cap: 'round' });
      // Inner hot white laser core
      fg.moveTo(b.x1, b.y1);
      fg.lineTo(b.x2, b.y2);
      fg.stroke({ width: 3.5, color: 0xFFFFFF, alpha, cap: 'round' });
    }
  }

  exit() {
    this.units.forEach((u) => u.destroy());
    this.crates.forEach((c) => c.root.destroy({ children: true }));
    if (this.popupManager) {
      this.popupManager.destroy();
      this.popupManager = null;
    }
    if (this.specimenCard) {
      this.specimenCard.destroy();
      this.specimenCard = null;
    }
    if (this.victoryModal) {
      this.victoryModal.destroy();
      this.victoryModal = null;
    }
    if (this.slotMachine) {
      this.slotMachine.destroy();
      this.slotMachine = null;
    }
    if (this.titleBanner) {
      this.titleBanner.destroy({ children: true });
      this.titleBanner = null;
      this.titleBannerStatusText = null;
    }
    this.units = [];
    this.crates = [];
  }
}
