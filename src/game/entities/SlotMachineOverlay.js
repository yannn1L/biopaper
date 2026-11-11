/**
 * @file SlotMachineOverlay.js
 * Tactile Papercraft 4-Reel Specimen Slot Machine Draft Overlay.
 * Appears at the start of SimulationScene when Auto Random Pick is enabled,
 * rapidly spinning 4 reels of complete specimen cards and locking them in sequentially
 * with ratcheting ticks, lock clacks, and a jackpot fanfare before parachute deployment.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PALETTE,
  UNIT_PALETTE,
  CHASSIS_TYPES,
  CHASSIS_SPECS,
  MUTATION_IDS,
  INNATE_MUTATIONS,
  selectBestSocketForMutation,
} from '../core/Constants.js';
import { fastSin, fastCos } from '../core/MathLUT.js';
import { SoundFX } from '../audio/SoundFX.js';

const ALL_CHASSIS = Object.values(CHASSIS_TYPES);
const ALL_MUTATIONS = Object.values(MUTATION_IDS);

export class SlotMachineOverlay {
  /**
   * @param {Container} parentContainer
   */
  constructor(parentContainer) {
    this.root = new Container();
    this.root.visible = false;
    parentContainer.addChild(this.root);

    // Translucent dark slate backdrop dimmer
    this.dimmer = new Graphics();
    this.dimmer.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.dimmer.fill({ color: 0x0F1219, alpha: 0.65 });
    this.root.addChild(this.dimmer);

    // Main Slot Machine Cabinet Container
    this.cabinet = new Container();
    this.cabinet.x = DESIGN_WIDTH * 0.5;
    this.cabinet.y = DESIGN_HEIGHT * 0.5 - 40;
    this.root.addChild(this.cabinet);

    this.cabinetW = 980;
    this.cabinetH = 620;
    this.reels = [];
    this.finalConfigs = [];
    this.elapsed = 0;
    this.active = false;
    this.jackpotPlayed = false;
    this.onCompleteCallback = null;
  }

  /**
   * Starts the 4-reel slot machine roll with the 4 target specimen configs.
   * @param {Array<Object>} targetConfigs Array of 4 finalized specimen configs
   * @param {Function} onComplete Called when all 4 reels lock in and finish celebrating
   */
  startRoll(targetConfigs, onComplete) {
    const oldChildren = this.cabinet.removeChildren();
    oldChildren.forEach((child) => child.destroy({ children: true }));
    this.reels = [];
    this.finalConfigs = targetConfigs.slice(0, 4);
    this.elapsed = 0;
    this.active = true;
    this.jackpotPlayed = false;
    this.onCompleteCallback = onComplete;

    this.root.visible = true;
    this.root.alpha = 1.0;
    this.cabinet.scale.set(0.75);

    const halfW = this.cabinetW * 0.5; // 490
    const halfH = this.cabinetH * 0.5; // 310

    // 1. Cabinet Drop Shadow
    const shadow = new Graphics();
    shadow.roundRect(-halfW + 10, -halfH + 12, this.cabinetW, this.cabinetH, 30);
    shadow.fill({ color: 0x090B0E, alpha: 0.55 });
    this.cabinet.addChild(shadow);

    // 2. Parchment Cardboard Machine Body
    const bg = new Graphics();
    bg.roundRect(-halfW, -halfH, this.cabinetW, this.cabinetH, 30);
    bg.fill({ color: 0xF6EFE0 });
    bg.stroke({ width: 6, color: PALETTE.OUTLINE_STROKE });
    this.cabinet.addChild(bg);

    // Inner Blueprint Border
    const innerRim = new Graphics();
    innerRim.roundRect(-halfW + 14, -halfH + 14, this.cabinetW - 28, this.cabinetH - 28, 22);
    innerRim.stroke({ width: 2.5, color: 0xDFD3B8 });
    this.cabinet.addChild(innerRim);

    // Corner Grommets
    const corners = [
      [-halfW + 32, -halfH + 32],
      [halfW - 32, -halfH + 32],
      [-halfW + 32, halfH - 32],
      [halfW - 32, halfH - 32],
    ];
    corners.forEach(([cx, cy]) => {
      const pin = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
      pin.anchor.set(0.5);
      pin.x = cx;
      pin.y = cy;
      pin.scale.set(0.72);
      this.cabinet.addChild(pin);
    });

    // 3. Top Gold Marquee Header Banner
    const marquee = new Graphics();
    marquee.roundRect(-290, -halfH - 24, 580, 52, 16);
    marquee.fill({ color: PALETTE.GOLD_CROWN });
    marquee.stroke({ width: 4.5, color: PALETTE.OUTLINE_STROKE });
    this.cabinet.addChild(marquee);

    const marqueeText = new Text({
      text: '★ GENETIC SLOT MACHINE · 4-SPECIMEN DRAFT ★',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 21,
        fontWeight: '800',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 1.2,
      },
    });
    marqueeText.anchor.set(0.5);
    marqueeText.y = -halfH + 2;
    this.cabinet.addChild(marqueeText);

    // Subtitle Status
    this.statusText = new Text({
      text: 'ROLLING RANDOM SPECIMENS & MUTATIONS...',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 18,
        fontWeight: '800',
        fill: 0x4A4E69,
        letterSpacing: 1.2,
      },
    });
    this.statusText.anchor.set(0.5);
    this.statusText.y = -halfH + 54;
    this.cabinet.addChild(this.statusText);

    // 4. Build the 4 Vertical Reel Windows
    const reelW = 212;
    const reelH = 420;
    const gap = 18;
    const startX = -((4 - 1) * (reelW + gap)) * 0.5;
    const reelY = 24;

    for (let i = 0; i < 4; i++) {
      const rx = startX + i * (reelW + gap);
      const reelWrap = new Container();
      reelWrap.x = rx;
      reelWrap.y = reelY;
      this.cabinet.addChild(reelWrap);

      // Recessed Reel Window Background
      const winBg = new Graphics();
      this.drawReelWindowBg(winBg, reelW, reelH, false);
      reelWrap.addChild(winBg);

      // Clipped Scrolling Area inside the Reel Window
      const maskGraphic = new Graphics();
      maskGraphic.roundRect(-reelW * 0.5 + 5, -reelH * 0.5 + 5, reelW - 10, reelH - 10, 15);
      maskGraphic.fill({ color: 0xFFFFFF });
      reelWrap.addChild(maskGraphic);

      const stripContainer = new Container();
      stripContainer.mask = maskGraphic;
      reelWrap.addChild(stripContainer);

      // Active Card Container inside the reel window
      const cardNode = new Container();
      stripContainer.addChild(cardNode);

      // Outer Frame Border (Stroke-only so it never covers the specimen card!)
      const frameBorder = new Graphics();
      this.drawReelFrameBorder(frameBorder, reelW, reelH, false);
      reelWrap.addChild(frameBorder);

      // Top Slot Number Tag (#1 .. #4)
      const slotBadge = new Graphics();
      this.drawSlotBadge(slotBadge, false);
      reelWrap.addChild(slotBadge);

      const slotNum = new Text({
        text: `SLOT #${i + 1}`,
        style: {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          fontWeight: '800',
          fill: 0xFFFDF9,
        },
      });
      slotNum.anchor.set(0.5);
      slotNum.y = -reelH * 0.5;
      reelWrap.addChild(slotNum);

      // Staggered stop times: Reel 0 @ 0.95s, Reel 1 @ 1.40s, Reel 2 @ 1.85s, Reel 3 @ 2.30s
      const lockTime = 0.95 + i * 0.45;
      const initialRandomCfg = this.generateRandomPreviewConfig(i);
      const cardParts = this.createReelCardNodes(cardNode, reelW, reelH);

      const reelObj = {
        index: i,
        reelWrap,
        winBg,
        cardNode,
        frameBorder,
        slotBadge,
        slotNum,
        reelW,
        reelH,
        lockTime,
        locked: false,
        stepTimer: 0,
        stepInterval: 0.065,
        scrollOffsetY: 0,
        bounceScale: 1.0,
        currentCfg: initialRandomCfg,
        finalCfg: this.finalConfigs[i],
        cardParts,
      };

      this.updateReelCardVisuals(reelObj, initialRandomCfg, false);
      this.reels.push(reelObj);
    }
  }

  drawReelWindowBg(g, w, h, isLocked) {
    g.clear();
    g.roundRect(-w * 0.5, -h * 0.5, w, h, 20);
    g.fill({ color: isLocked ? 0xFFF8E7 : 0xEDE2CE });
  }

  drawReelFrameBorder(g, w, h, isLocked) {
    g.clear();
    // Strictly stroke-only border so the specimen card inside is never occluded
    if (isLocked) {
      g.roundRect(-w * 0.5, -h * 0.5, w, h, 20);
      g.stroke({ width: 7, color: PALETTE.OUTLINE_STROKE });

      g.roundRect(-w * 0.5 + 3.5, -h * 0.5 + 3.5, w - 7, h - 7, 17);
      g.stroke({ width: 4.5, color: PALETTE.GOLD_CROWN });
    } else {
      g.roundRect(-w * 0.5, -h * 0.5, w, h, 20);
      g.stroke({ width: 4.5, color: PALETTE.OUTLINE_STROKE });
    }
  }

  drawSlotBadge(g, isLocked) {
    g.clear();
    g.roundRect(-48, -210 - 16, 96, 32, 10);
    g.fill({ color: isLocked ? PALETTE.GOLD_CROWN : 0x2B2D42 });
    g.stroke({ width: 3, color: PALETTE.OUTLINE_STROKE });
  }

  generateRandomPreviewConfig(seedIdx = 0) {
    const chassisType = ALL_CHASSIS[Math.floor(Math.random() * ALL_CHASSIS.length)];
    const innateMutationId = ALL_MUTATIONS[Math.floor(Math.random() * ALL_MUTATIONS.length)];
    const color =
      UNIT_PALETTE[(Math.floor(Math.random() * UNIT_PALETTE.length) + seedIdx) % UNIT_PALETTE.length];
    return { chassisType, innateMutationId, color };
  }

  /**
   * Builds reusable child nodes inside `cardNode` once per reel so spinning and locking
   * never allocate or leak textures or cover the card.
   */
  createReelCardNodes(cardNode, reelW, reelH) {
    const plate = new Graphics();
    cardNode.addChild(plate);

    // Specimen Miniature Container
    const unitRoot = new Container();
    unitRoot.y = -52;
    unitRoot.scale.set(1.06);
    cardNode.addChild(unitRoot);

    const underOrganLayer = new Container();
    const bodyLayer = new Container();
    const dorsalOrganLayer = new Container();
    const eyeLayer = new Container();
    unitRoot.addChild(underOrganLayer);
    unitRoot.addChild(bodyLayer);
    unitRoot.addChild(dorsalOrganLayer);
    unitRoot.addChild(eyeLayer);

    const bodySpr = new Sprite(CentralRegistry.getTexture(`CHASSIS_BODY_${CHASSIS_TYPES.CIRCLE}`));
    bodySpr.anchor.set(0.5);
    bodyLayer.addChild(bodySpr);

    const organSpr = new Sprite(CentralRegistry.getTexture(`${MUTATION_IDS.BIO_PINCER}_LVL1`));
    underOrganLayer.addChild(organSpr);

    // Pre-create up to 2 Expressive Eye nodes
    const eyeNodes = [];
    for (let i = 0; i < 2; i++) {
      const eyeWrap = new Container();
      const sclera = new Sprite(CentralRegistry.getTexture('EYE_SCLERA'));
      sclera.anchor.set(0.5);
      eyeWrap.addChild(sclera);

      const pupil = new Sprite(CentralRegistry.getTexture('EYE_PUPIL'));
      pupil.anchor.set(0.5);
      pupil.x = 1.0;
      pupil.y = 0;
      eyeWrap.addChild(pupil);

      eyeLayer.addChild(eyeWrap);
      eyeNodes.push({ eyeWrap, pupil });
    }

    // Chassis Name Title
    const chassisTitle = new Text({
      text: 'CIRCLE',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 21,
        fontWeight: '800',
        fill: PALETTE.OUTLINE_STROKE,
        align: 'center',
      },
    });
    chassisTitle.anchor.set(0.5);
    chassisTitle.y = 56;
    cardNode.addChild(chassisTitle);

    // Mutation Type Label
    const typeText = new Text({
      text: 'MELEE ORGAN',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 12,
        fontWeight: '800',
        fill: 0x5C677D,
        letterSpacing: 0.8,
        align: 'center',
      },
    });
    typeText.anchor.set(0.5);
    typeText.y = 84;
    cardNode.addChild(typeText);

    // Mutation Name
    const mutName = new Text({
      text: 'Bio-Pincer',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 17,
        fontWeight: '700',
        fill: 0x9B5DE5,
        align: 'center',
      },
    });
    mutName.anchor.set(0.5);
    mutName.y = 110;
    cardNode.addChild(mutName);

    // Short 3-5 word quote
    const descLabel = new Text({
      text: '“Fast front melee snap”',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
        fill: 0x4A4E69,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: reelW - 36,
      },
    });
    descLabel.anchor.set(0.5);
    descLabel.y = 142;
    cardNode.addChild(descLabel);

    // Bottom Locked Status Pill inside card
    const lockedPill = new Graphics();
    lockedPill.roundRect(-64, 164, 128, 24, 8);
    lockedPill.fill({ color: PALETTE.GOLD_CROWN });
    lockedPill.stroke({ width: 2.5, color: PALETTE.OUTLINE_STROKE });
    lockedPill.visible = false;
    cardNode.addChild(lockedPill);

    const lockedPillText = new Text({
      text: '★ LOCKED IN ★',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 12,
        fontWeight: '800',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 0.6,
      },
    });
    lockedPillText.anchor.set(0.5);
    lockedPillText.y = 176;
    lockedPillText.visible = false;
    cardNode.addChild(lockedPillText);

    return {
      plate,
      unitRoot,
      underOrganLayer,
      dorsalOrganLayer,
      bodySpr,
      organSpr,
      eyeNodes,
      chassisTitle,
      typeText,
      mutName,
      descLabel,
      lockedPill,
      lockedPillText,
    };
  }

  /**
   * Updates the existing card nodes in-place for the current or locked specimen configuration.
   */
  updateReelCardVisuals(reel, cfg, isLocked) {
    const { reelW, reelH, cardParts } = reel;
    const {
      plate,
      underOrganLayer,
      dorsalOrganLayer,
      bodySpr,
      organSpr,
      eyeNodes,
      chassisTitle,
      typeText,
      mutName,
      descLabel,
      lockedPill,
      lockedPillText,
    } = cardParts;

    // 1. Redraw inner card plate behind the specimen and text
    plate.clear();
    plate.roundRect(-reelW * 0.5 + 12, -reelH * 0.5 + 22, reelW - 24, reelH - 44, 16);
    plate.fill({ color: isLocked ? 0xFFFDF7 : 0xFAF5E8 });
    plate.stroke({
      width: isLocked ? 3.5 : 2.5,
      color: isLocked ? PALETTE.GOLD_CROWN : PALETTE.OUTLINE_STROKE,
    });

    const chassisSpec = CHASSIS_SPECS[cfg.chassisType] || CHASSIS_SPECS[CHASSIS_TYPES.CIRCLE];
    const mutSpec =
      INNATE_MUTATIONS[cfg.innateMutationId] || INNATE_MUTATIONS[MUTATION_IDS.BIO_PINCER];

    // 2. Update Chassis Body Sprite
    bodySpr.texture = CentralRegistry.getTexture(`CHASSIS_BODY_${cfg.chassisType}`);
    bodySpr.tint = cfg.color !== undefined ? cfg.color : chassisSpec.color;

    // 3. Update Anatomical Organ Placement
    const bestSocket =
      selectBestSocketForMutation(
        chassisSpec.sockets.map((s) => ({ ...s, mutationId: null })),
        mutSpec
      ) || chassisSpec.sockets[0];

    organSpr.texture = CentralRegistry.getTexture(`${cfg.innateMutationId}_LVL1`);
    if (organSpr.parent) {
      organSpr.parent.removeChild(organSpr);
    }

    if (bestSocket.isDorsal || mutSpec.isDorsalVisual) {
      organSpr.anchor.set(0.5, 0.5);
      organSpr.x = bestSocket.x ?? -9;
      organSpr.y = bestSocket.y ?? 0;
      organSpr.rotation = 0;
      dorsalOrganLayer.addChild(organSpr);
    } else {
      organSpr.anchor.set(0.18, 0.5);
      organSpr.x = fastCos(bestSocket.angle) * bestSocket.dist;
      organSpr.y = fastSin(bestSocket.angle) * bestSocket.dist;
      organSpr.rotation = bestSocket.angle;
      underOrganLayer.addChild(organSpr);
    }

    // 4. Update Forward-Offset Expressive Eyes
    const eyeOffsets = chassisSpec.eyeOffsets || [
      { x: 14, y: -9, r: 7 },
      { x: 14, y: 9, r: 7 },
    ];
    for (let i = 0; i < eyeNodes.length; i++) {
      const node = eyeNodes[i];
      const eo = eyeOffsets[i];
      if (eo) {
        node.eyeWrap.visible = true;
        node.eyeWrap.x = eo.x;
        node.eyeWrap.y = eo.y;
        const scaleRatio = (eo.r || 7.5) / 7.5;
        node.eyeWrap.scale.set(scaleRatio);
        node.pupil.x = 1.0;
        node.pupil.y = 0;
      } else {
        node.eyeWrap.visible = false;
      }
    }

    // 5. Update Typography Labels
    chassisTitle.text = chassisSpec.name.toUpperCase();
    typeText.text = `${(mutSpec.mutationType || 'GENE').toUpperCase()} ORGAN`;
    mutName.text = mutSpec.name;
    descLabel.text = `“${mutSpec.desc || 'Combat mutation'}”`;

    lockedPill.visible = isLocked;
    lockedPillText.visible = isLocked;
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;

    // 1. Cabinet Pop-In Entrance
    if (this.elapsed < 0.25) {
      const t = Math.min(1, this.elapsed / 0.25);
      const scale = 0.75 + t * 0.25 + Math.sin(t * Math.PI) * 0.05;
      this.cabinet.scale.set(scale);
    } else if (this.elapsed < 2.85) {
      this.cabinet.scale.set(1.0);
    }

    // 2. Update Each of the 4 Reels
    let allLocked = true;
    for (let i = 0; i < this.reels.length; i++) {
      const reel = this.reels[i];

      if (!reel.locked) {
        allLocked = false;
        const timeRemaining = reel.lockTime - this.elapsed;

        if (timeRemaining <= 0) {
          // Lock this reel into its finalized drafted specimen!
          reel.locked = true;
          reel.currentCfg = reel.finalCfg;
          reel.scrollOffsetY = 0;
          reel.cardNode.y = 0;
          reel.bounceScale = 1.15;

          // Update window bg, stroke-only gold border, slot badge, and specimen card visuals
          this.drawReelWindowBg(reel.winBg, reel.reelW, reel.reelH, true);
          this.drawReelFrameBorder(reel.frameBorder, reel.reelW, reel.reelH, true);
          this.drawSlotBadge(reel.slotBadge, true);
          reel.slotNum.text = `★ #${i + 1} ★`;
          reel.slotNum.style.fill = PALETTE.OUTLINE_STROKE;

          this.updateReelCardVisuals(reel, reel.finalCfg, true);
          SoundFX.playSlotReelLock(i);
        } else {
          // Spin reel vertically and cycle random specimen cards
          const speedFactor = Math.max(0.28, Math.min(1.0, timeRemaining / 0.8));
          const currentInterval = 0.055 / speedFactor;
          reel.stepTimer += dt;

          // Smooth vertical scrolling illusion within window
          const progress = reel.stepTimer / currentInterval;
          reel.cardNode.y = (progress - 0.5) * 90;
          reel.cardNode.scale.set(0.96, 1.05);

          if (reel.stepTimer >= currentInterval) {
            reel.stepTimer = 0;
            reel.currentCfg = this.generateRandomPreviewConfig(i);
            this.updateReelCardVisuals(reel, reel.currentCfg, false);
            SoundFX.playSlotTick(0.85 + i * 0.1 + (1 - speedFactor) * 0.35);
          }
        }
      } else {
        // Locked-in state: settle elastic bounce + animate specimen with sine-wave squish & wiggle
        if (reel.bounceScale > 1.0) {
          reel.bounceScale = Math.max(1.0, reel.bounceScale - dt * 2.4);
        }
        reel.cardNode.y = 0;
        reel.cardNode.scale.set(reel.bounceScale);

        if (reel.cardParts && reel.cardParts.unitRoot) {
          const phase = this.elapsed * 5.5 + i * 0.9;
          const wave = fastSin(phase);
          const squishY = 1.06 * (1.0 + wave * 0.07);
          const stretchX = 1.06 * (1.0 - wave * 0.05);
          const wiggle = fastSin(this.elapsed * 4.0 + i) * 0.14;
          reel.cardParts.unitRoot.scale.set(stretchX, squishY);
          reel.cardParts.unitRoot.rotation = wiggle;

          const lookX = fastCos(this.elapsed * 2.6 + i) * 1.6;
          const lookY = fastSin(this.elapsed * 2.6 + i) * 1.6;
          for (let eIdx = 0; eIdx < reel.cardParts.eyeNodes.length; eIdx++) {
            const eye = reel.cardParts.eyeNodes[eIdx];
            eye.pupil.x = lookX;
            eye.pupil.y = lookY;
          }
        }
      }
    }

    // 3. When all 4 reels have locked in, trigger Jackpot Fanfare and hold briefly before deploy
    if (allLocked && !this.jackpotPlayed) {
      this.jackpotPlayed = true;
      if (this.statusText) {
        this.statusText.text = '★ 4 SPECIMENS LOCKED IN! DEPLOYING TO ARENA... ★';
        this.statusText.style.fill = PALETTE.OUTLINE_STROKE;
      }
      SoundFX.playSlotJackpotFanfare();
    }

    // 4. Exit transition at 3.15s -> deploy parachute drop!
    if (this.elapsed >= 2.95) {
      const fadeProgress = Math.min(1, (this.elapsed - 2.95) / 0.22);
      this.root.alpha = 1 - fadeProgress;
      this.cabinet.scale.set(1.0 + fadeProgress * 0.08);
      if (fadeProgress >= 1) {
        this.active = false;
        this.root.visible = false;
        if (this.onCompleteCallback) {
          const cb = this.onCompleteCallback;
          this.onCompleteCallback = null;
          cb();
        }
      }
    }
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}
