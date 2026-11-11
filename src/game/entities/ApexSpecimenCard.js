/**
 * @file ApexSpecimenCard.js
 * Diegetic Cut-Out Papercraft Information Card displayed below the Arena.
 * Tracks and features the single leading specimen currently holding the most mutations.
 * Displays live avatar, health bar, specimen config description, and equipped mutation dossiers with 3-5 word descriptions.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import {
  DESIGN_WIDTH,
  PALETTE,
  CHASSIS_SPECS,
  INNATE_MUTATIONS,
  SUPPLY_MUTAGENS,
} from '../core/Constants.js';
import { clamp, fastSin, fastCos } from '../core/MathLUT.js';

export class ApexSpecimenCard {
  /**
   * @param {Container} parentContainer 
   */
  constructor(parentContainer) {
    this.root = new Container();
    // Position below the arena in 1080x1920 layout
    this.root.x = DESIGN_WIDTH * 0.5;
    this.root.y = 1570;
    parentContainer.addChild(this.root);

    this.cardWidth = 980;
    this.cardHeight = 540;
    this.currentLeaderId = null;
    this.lastMutationHash = '';
    this.animTime = 0;
    this.bumpScale = 1.0;
    this.avatarEyes = [];

    this.initCardBase();
    this.initLeaderInfo();
  }

  initCardBase() {
    const halfW = this.cardWidth * 0.5;
    const halfH = this.cardHeight * 0.5;

    // 1. Layered Drop Shadow (GDD 2.1: 2.5D layer depth)
    this.shadowGraphic = new Graphics();
    this.shadowGraphic.roundRect(-halfW + 6, -halfH + 8, this.cardWidth, this.cardHeight, 26);
    this.shadowGraphic.fill({ color: 0x0F1219, alpha: 0.45 });
    this.root.addChild(this.shadowGraphic);

    // 2. Cardboard Parchment Base Card
    this.cardBg = new Graphics();
    this.cardBg.roundRect(-halfW, -halfH, this.cardWidth, this.cardHeight, 26);
    this.cardBg.fill({ color: 0xF6EFE0 });
    this.cardBg.stroke({ width: 5, color: PALETTE.OUTLINE_STROKE });
    this.root.addChild(this.cardBg);

    // Subtle paper blueprint ring accent inside card
    const innerRim = new Graphics();
    innerRim.roundRect(-halfW + 12, -halfH + 12, this.cardWidth - 24, this.cardHeight - 24, 18);
    innerRim.stroke({ width: 2, color: 0xDFD3B8, alpha: 0.7 });
    this.root.addChild(innerRim);

    // Decorative brass eyelet thumbtacks at corners
    const pinCoords = [
      [-halfW + 28, -halfH + 28],
      [halfW - 28, -halfH + 28],
      [-halfW + 28, halfH - 28],
      [halfW - 28, halfH - 28],
    ];
    pinCoords.forEach(([px, py]) => {
      const pin = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
      pin.anchor.set(0.5);
      pin.x = px;
      pin.y = py;
      pin.scale.set(0.65);
      this.root.addChild(pin);
    });
  }

  initLeaderInfo() {
    // --- TOP HEADER ---
    this.headerBadgeBg = new Graphics();
    this.headerBadgeBg.roundRect(-240, -250, 480, 36, 12);
    this.headerBadgeBg.fill({ color: PALETTE.GOLD_CROWN });
    this.headerBadgeBg.stroke({ width: 3.5, color: PALETTE.OUTLINE_STROKE });
    this.root.addChild(this.headerBadgeBg);

    this.badgeText = new Text({
      text: '★ APEX MUTANT · MOST MUTATIONS ★',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 19,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 1.2,
      },
    });
    this.badgeText.anchor.set(0.5);
    this.badgeText.y = -232;
    this.root.addChild(this.badgeText);

    // Specimen Title & Slot
    this.titleText = new Text({
      text: 'SPECIMEN #1 [CIRCLE]',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 32,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
      },
    });
    this.titleText.anchor.set(0, 0.5);
    this.titleText.x = -440;
    this.titleText.y = -188;
    this.root.addChild(this.titleText);

    // Specimen 3-5 Word Description
    this.specimenDescText = new Text({
      text: '“Aggressive brawler with pincer”',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 19,
        fontWeight: '600',
        fontStyle: 'italic',
        fill: 0x4A4E69,
      },
    });
    this.specimenDescText.anchor.set(0, 0.5);
    this.specimenDescText.x = -440;
    this.specimenDescText.y = -154;
    this.root.addChild(this.specimenDescText);

    // Leader Rank Tag (e.g. ★ 4 GENES)
    this.geneScoreBadge = new Text({
      text: '4 GENES',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 22,
        fontWeight: '700',
        fill: 0x9B5DE5,
      },
    });
    this.geneScoreBadge.anchor.set(1, 0.5);
    this.geneScoreBadge.x = 440;
    this.geneScoreBadge.y = -188;
    this.root.addChild(this.geneScoreBadge);

    // Horizontal Divider
    const divider = new Graphics();
    divider.moveTo(-440, -132);
    divider.lineTo(440, -132);
    divider.stroke({ width: 3, color: 0xDFD3B8 });
    this.root.addChild(divider);

    // --- LEFT COLUMN: LIVE AVATAR & VITALS ---
    this.avatarContainer = new Container();
    this.avatarContainer.x = -320;
    this.avatarContainer.y = 30;
    this.root.addChild(this.avatarContainer);

    // Avatar card frame
    const avatarFrame = new Graphics();
    avatarFrame.roundRect(-100, -120, 200, 200, 20);
    avatarFrame.fill({ color: 0xEDE2CE });
    avatarFrame.stroke({ width: 3.5, color: PALETTE.OUTLINE_STROKE });
    this.avatarContainer.addChild(avatarFrame);

    // Unified animated avatar root (perimeter organs -> chassis -> dorsal organs -> forward eyes)
    this.avatarUnitRoot = new Container();
    this.avatarUnitRoot.y = -20;
    this.avatarContainer.addChild(this.avatarUnitRoot);

    this.avatarMutationContainer = new Container();
    this.avatarUnitRoot.addChild(this.avatarMutationContainer);

    this.avatarChassisSprite = new Sprite();
    this.avatarChassisSprite.anchor.set(0.5);
    this.avatarUnitRoot.addChild(this.avatarChassisSprite);

    this.avatarDorsalContainer = new Container();
    this.avatarUnitRoot.addChild(this.avatarDorsalContainer);

    this.avatarEyeContainer = new Container();
    this.avatarUnitRoot.addChild(this.avatarEyeContainer);

    // Health Bar underneath avatar
    this.hpBarBg = new Graphics();
    this.hpBarBg.roundRect(-100, 100, 200, 24, 8);
    this.hpBarBg.fill({ color: 0x2B2D42 });
    this.hpBarBg.stroke({ width: 2.5, color: PALETTE.OUTLINE_STROKE });
    this.avatarContainer.addChild(this.hpBarBg);

    this.hpBarFill = new Graphics();
    this.avatarContainer.addChild(this.hpBarFill);

    this.hpText = new Text({
      text: 'HP 480 / 480',
      style: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 15,
        fontWeight: '700',
        fill: 0xFFFDF9,
      },
    });
    this.hpText.anchor.set(0.5);
    this.hpText.x = 0;
    this.hpText.y = 112;
    this.avatarContainer.addChild(this.hpText);

    // Stats Tag row
    this.statsText = new Text({
      text: 'SPD: 260 · KILLS: 0',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 16,
        fontWeight: '700',
        fill: 0x383B54,
      },
    });
    this.statsText.anchor.set(0.5);
    this.statsText.y = 150;
    this.avatarContainer.addChild(this.statsText);

    // --- RIGHT COLUMN: MUTATIONS LIST (DOSSIER) ---
    this.mutationsListContainer = new Container();
    this.mutationsListContainer.x = -170;
    this.mutationsListContainer.y = -118;
    this.root.addChild(this.mutationsListContainer);

    this.dossierHeaderText = new Text({
      text: 'GRAFTED MUTATION DOSSIER',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 18,
        fontWeight: '700',
        fill: 0x2B2D42,
        letterSpacing: 1,
      },
    });
    this.dossierHeaderText.x = 0;
    this.dossierHeaderText.y = 0;
    this.mutationsListContainer.addChild(this.dossierHeaderText);

    this.mutationRowsContainer = new Container();
    this.mutationRowsContainer.y = 26;
    this.mutationsListContainer.addChild(this.mutationRowsContainer);
  }

  /**
   * Updates the card to display the clicked/inspected specimen (for 3 seconds)
   * or the leading specimen with the most mutations.
   * @param {number} dt 
   * @param {Array<OrganismUnit>} units 
   * @param {OrganismUnit|null} championUnit 
   * @param {OrganismUnit|null} inspectedUnit 
   */
  update(dt, units, championUnit = null, inspectedUnit = null) {
    this.animTime += dt;

    const isInspecting = Boolean(inspectedUnit && inspectedUnit.alive);

    // 1. Determine displayed specimen: clicked specimen (if active) -> champion -> highest mutation score
    let leader = isInspecting
      ? inspectedUnit
      : championUnit && championUnit.alive
      ? championUnit
      : null;

    if (!leader) {
      let maxScore = -1;
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        if (!u.alive && !championUnit) continue;
        const score = u.getTotalMutationScore() * 100 + u.hp * 0.01;
        if (score > maxScore) {
          maxScore = score;
          leader = u;
        }
      }
    }

    if (!leader) return;

    if (this.badgeText) {
      this.badgeText.text = isInspecting
        ? '★ INSPECTING SELECTED SPECIMEN ★'
        : '★ APEX MUTANT · MOST MUTATIONS ★';
    }

    // Elastic bounce settling when a new specimen is selected or emerges
    if (this.bumpScale > 1.0) {
      this.bumpScale = Math.max(1.0, this.bumpScale - dt * 1.5);
      this.root.scale.set(this.bumpScale);
    }

    // 2. Check if displayed specimen or its mutations changed
    const mutationHash = this.getUnitMutationHash(leader);
    const isNewLeader = leader.id !== this.currentLeaderId;
    if (isNewLeader || mutationHash !== this.lastMutationHash) {
      this.currentLeaderId = leader.id;
      this.lastMutationHash = mutationHash;
      this.bumpScale = 1.04;
      this.root.scale.set(this.bumpScale);
      this.rebuildLeaderDossier(leader);
    }

    // 3. Smooth frame-by-frame updates (HP, rotation, squash)
    this.updateLiveStats(leader, dt);
  }

  getUnitMutationHash(unit) {
    const innatePart = unit.sockets
      .filter((s) => s.mutationId)
      .map((s) => `${s.mutationId}:L${s.level}:G${s.graftOrder || 0}`)
      .join('|');
    const virusPart = Array.from(unit.virusTraits).join(',');
    return `${unit.id}:${unit.kills}:${innatePart}:${virusPart}`;
  }

  rebuildLeaderDossier(unit) {
    const chassisName = (unit.chassisSpec.name || 'Organism').toUpperCase();
    this.titleText.text = `SPECIMEN #${unit.slotIndex + 1} [${chassisName}]`;
    this.specimenDescText.text = `“${unit.desc || 'Evolving papercraft gladiator'}”`;

    const totalMutations = unit.getTotalMutationScore();
    this.geneScoreBadge.text = `★ ${totalMutations} GENES`;

    // Update Avatar Body
    const bodyTex = CentralRegistry.getTexture(`CHASSIS_BODY_${unit.chassisType}`);
    if (bodyTex) {
      this.avatarChassisSprite.texture = bodyTex;
      this.avatarChassisSprite.tint = unit.color;
      this.avatarChassisSprite.scale.set(1.0);
    }

    // Update Avatar Organs (Perimeter vs Dorsal - renders all active mutations on the specimen)
    this.avatarMutationContainer.removeChildren();
    this.avatarDorsalContainer.removeChildren();
    for (let i = 0; i < unit.sockets.length; i++) {
      const skt = unit.sockets[i];
      if (!skt.mutationId) continue;
      const texKey = skt.category === 'PARASITE'
        ? skt.mutationId
        : `${skt.mutationId}_LVL${skt.level}`;
      const tex = CentralRegistry.getTexture(texKey);
      if (tex) {
        const spr = new Sprite(tex);
        if (skt.isDorsal) {
          spr.anchor.set(0.5, 0.5);
          spr.x = skt.x ?? -9;
          spr.y = skt.y ?? 0;
          spr.scale.set(skt.level === 2 ? 0.96 : 0.86);
          this.avatarDorsalContainer.addChild(spr);
        } else {
          spr.anchor.set(0.18, 0.5);
          spr.x = fastCos(skt.angle) * (skt.dist * 0.94);
          spr.y = fastSin(skt.angle) * (skt.dist * 0.94);
          spr.rotation = skt.angle;
          spr.scale.set(skt.level === 2 ? 0.94 : 0.85);
          this.avatarMutationContainer.addChild(spr);
        }
      }
    }

    // Update Forward-Offset Expressive Eyes on Avatar
    this.avatarEyeContainer.removeChildren();
    this.avatarEyes = [];
    const eyeOffsets = unit.chassisSpec.eyeOffsets || [
      { x: 11, y: -9 },
      { x: 11, y: 9 },
    ];
    for (let i = 0; i < eyeOffsets.length; i++) {
      const eo = eyeOffsets[i];
      const sclera = new Sprite(CentralRegistry.getTexture('EYE_SCLERA'));
      sclera.anchor.set(0.5);
      sclera.x = eo.x;
      sclera.y = eo.y;
      this.avatarEyeContainer.addChild(sclera);

      const pupil = new Sprite(CentralRegistry.getTexture('EYE_PUPIL'));
      pupil.anchor.set(0.5);
      pupil.x = eo.x + 0.8;
      pupil.y = eo.y;
      this.avatarEyeContainer.addChild(pupil);
      this.avatarEyes.push({ sclera, pupil, baseX: eo.x, baseY: eo.y });
    }

    // Rebuild Mutation Rows
    this.mutationRowsContainer.removeChildren();

    // Collect all active innate mutations + virus/parasite drops ordered chronologically
    const mutationItems = unit.getAllActiveMutations ? unit.getAllActiveMutations() : [];

    if (mutationItems.length === 0) {
      if (this.dossierHeaderText) {
        this.dossierHeaderText.text = 'GRAFTED MUTATION DOSSIER (0 ACTIVE)';
      }
      const emptyText = new Text({
        text: 'Awaiting first genetic graft in arena...',
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 16,
          fontWeight: '600',
          fill: 0x7D8597,
        },
      });
      emptyText.y = 20;
      this.mutationRowsContainer.addChild(emptyText);
      return;
    }

    // Only the Specimen Info Card view is capped at 5 rows (showing the 5 newest mutations),
    // while all mutations on the specimen remain 100% active in combat!
    const displayItems =
      mutationItems.length > 5 ? mutationItems.slice(-5).reverse() : mutationItems.slice().reverse();
    if (this.dossierHeaderText) {
      this.dossierHeaderText.text =
        mutationItems.length > 5
          ? `GRAFTED MUTATIONS (${mutationItems.length} ACTIVE · NEWEST 5 SHOWN)`
          : `GRAFTED MUTATION DOSSIER (${mutationItems.length} ACTIVE)`;
    }

    // Render max 5 mutation rows with zero overflow inside the card
    const rowHeight = 54;
    for (let i = 0; i < displayItems.length; i++) {
      const m = displayItems[i];
      const row = new Container();
      row.y = i * rowHeight;

      // Card row background plate
      const bg = new Graphics();
      bg.roundRect(0, 0, 590, 46, 10);
      bg.fill({ color: 0xFFFDF7 });
      bg.stroke({ width: 2.5, color: PALETTE.OUTLINE_STROKE });
      row.addChild(bg);

      // Color Pip
      const pip = new Graphics();
      pip.circle(18, 23, 7);
      pip.fill({ color: m.color });
      pip.stroke({ width: 2, color: PALETTE.OUTLINE_STROKE });
      row.addChild(pip);

      // Mutation Title + Level tag
      const title = new Text({
        text: `${m.name} ${m.level > 1 ? '[LVL 2]' : ''}`,
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: 17,
          fontWeight: '700',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      title.anchor.set(0, 0.5);
      title.x = 36;
      title.y = 15;
      row.addChild(title);

      // 3-5 Word Short Description
      const desc = new Text({
        text: `“${m.desc}”`,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13,
          fontWeight: '600',
          fontStyle: 'italic',
          fill: 0x5C677D,
        },
      });
      desc.anchor.set(0, 0.5);
      desc.x = 36;
      desc.y = 32;
      row.addChild(desc);

      // Category Tag Badge
      const typeBadge = new Graphics();
      typeBadge.roundRect(475, 9, 100, 28, 8);
      typeBadge.fill({ color: m.color, alpha: 0.22 });
      typeBadge.stroke({ width: 1.5, color: m.color });
      row.addChild(typeBadge);

      const typeLabel = new Text({
        text: m.type,
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          fontWeight: '700',
          fill: 0x1A1D20,
        },
      });
      typeLabel.anchor.set(0.5);
      typeLabel.x = 525;
      typeLabel.y = 23;
      row.addChild(typeLabel);

      this.mutationRowsContainer.addChild(row);
    }
  }

  updateLiveStats(unit, dt) {
    // 1. Health Bar
    const hpRatio = clamp(unit.hp / unit.maxHp, 0, 1);
    this.hpBarFill.clear();
    if (hpRatio > 0) {
      const barColor = hpRatio > 0.5 ? 0x57CC99 : hpRatio > 0.25 ? 0xFFB703 : 0xEF476F;
      this.hpBarFill.roundRect(-98, 102, 196 * hpRatio, 20, 6);
      this.hpBarFill.fill({ color: barColor });
    }
    this.hpText.text = `HP ${Math.round(unit.hp)} / ${unit.maxHp}`;

    // 2. Speed and Kills
    const spd = Math.round(unit.getEffectiveSpeed ? unit.getEffectiveSpeed() : unit.baseSpeed);
    this.statsText.text = `SPD: ${spd} · KILLS: ${unit.kills}`;

    // 3. Sine-Wave Squishy Scale, Rotational Wiggle, & Live Pupil Tracking
    const squishWave = fastSin(this.animTime * 5.2);
    const squishY = 1.0 + squishWave * 0.065;
    const stretchX = 1.0 - squishWave * 0.05;
    const wiggle = fastSin(this.animTime * 3.8) * 0.1;

    this.avatarUnitRoot.rotation = wiggle;
    this.avatarUnitRoot.scale.set(stretchX, squishY);

    let px = Number.isFinite(unit.pupilOffsetX) ? unit.pupilOffsetX : fastCos(this.animTime * 2.5) * 1.6;
    let py = Number.isFinite(unit.pupilOffsetY) ? unit.pupilOffsetY : fastSin(this.animTime * 2.5) * 1.6;
    const pMag = Math.hypot(px, py);
    if (pMag > 1.9) {
      px = (px / pMag) * 1.9;
      py = (py / pMag) * 1.9;
    }
    for (let i = 0; i < this.avatarEyes.length; i++) {
      const eye = this.avatarEyes[i];
      eye.pupil.x = eye.baseX + px;
      eye.pupil.y = eye.baseY + py;
    }
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}
