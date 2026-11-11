/**
 * @file VictoryPopupModal.js
 * Simple, tactile papercraft Win Popup displayed 2.0 seconds after match end.
 * Showcases the winning specimen's final evolved shape (chassis, color, grafted perimeter
 * & dorsal mutations, forward eyes, sine-wave squish/wiggle) alongside detailed winning
 * stats and mutation loadout with zero overflow and no extra loading bars.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PALETTE,
  INNATE_MUTATIONS,
  SUPPLY_MUTAGENS,
  SUPPLY_MUTAGEN_IDS,
} from '../core/Constants.js';
import { fastSin, fastCos } from '../core/MathLUT.js';

export class VictoryPopupModal {
  /**
   * @param {Container} parentContainer
   */
  constructor(parentContainer) {
    this.root = new Container();
    this.root.visible = false;
    parentContainer.addChild(this.root);

    // Full-screen translucent dimmer
    this.dimmer = new Graphics();
    this.dimmer.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.dimmer.fill({ color: 0x0F1219, alpha: 0.62 });
    this.root.addChild(this.dimmer);

    // Centered Popup Card Container
    this.cardContainer = new Container();
    this.cardContainer.x = DESIGN_WIDTH * 0.5;
    this.cardContainer.y = DESIGN_HEIGHT * 0.5;
    this.root.addChild(this.cardContainer);

    this.cardWidth = 880;
    this.cardHeight = 860;
    this.animTime = 0;
    this.popScale = 0.5;
    this.specimenPreviewRoot = null;
    this.previewEyes = [];
  }

  /**
   * Builds and displays the Win Popup for the surviving champion specimen.
   * @param {OrganismUnit} unit
   * @param {number} matchDuration
   */
  show(unit, matchDuration = 0) {
    this.cardContainer.removeChildren();
    this.previewEyes = [];
    this.animTime = 0;
    this.popScale = 0.65;
    this.root.visible = true;
    this.root.alpha = 1;
    this.cardContainer.scale.set(this.popScale);

    const halfW = this.cardWidth * 0.5; // 440
    const halfH = this.cardHeight * 0.5; // 430

    // 1. Layered Papercraft Drop Shadow
    const shadow = new Graphics();
    shadow.roundRect(-halfW + 10, -halfH + 12, this.cardWidth, this.cardHeight, 30);
    shadow.fill({ color: 0x0A0C10, alpha: 0.55 });
    this.cardContainer.addChild(shadow);

    // 2. Cardboard Parchment Main Card
    const cardBg = new Graphics();
    cardBg.roundRect(-halfW, -halfH, this.cardWidth, this.cardHeight, 30);
    cardBg.fill({ color: 0xF6EFE0 });
    cardBg.stroke({ width: 6, color: PALETTE.OUTLINE_STROKE });
    this.cardContainer.addChild(cardBg);

    // Inner blueprint border accent
    const innerRim = new Graphics();
    innerRim.roundRect(-halfW + 14, -halfH + 14, this.cardWidth - 28, this.cardHeight - 28, 22);
    innerRim.stroke({ width: 2.5, color: 0xDFD3B8 });
    this.cardContainer.addChild(innerRim);

    // Brass Corner Grommet Pins
    const pinPositions = [
      [-halfW + 32, -halfH + 32],
      [halfW - 32, -halfH + 32],
      [-halfW + 32, halfH - 32],
      [halfW - 32, halfH - 32],
    ];
    pinPositions.forEach(([px, py]) => {
      const pin = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
      pin.anchor.set(0.5);
      pin.x = px;
      pin.y = py;
      pin.scale.set(0.72);
      this.cardContainer.addChild(pin);
    });

    // 3. Top Gold Victory Ribbon Header
    const ribbon = new Graphics();
    ribbon.roundRect(-240, -halfH - 24, 480, 48, 14);
    ribbon.fill({ color: PALETTE.GOLD_CROWN });
    ribbon.stroke({ width: 4.5, color: PALETTE.OUTLINE_STROKE });
    this.cardContainer.addChild(ribbon);

    const ribbonText = new Text({
      text: '★ VICTORY · APEX CHAMPION ★',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 22,
        fontWeight: '800',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 1.4,
      },
    });
    ribbonText.anchor.set(0.5);
    ribbonText.y = -halfH;
    this.cardContainer.addChild(ribbonText);

    // Fallback if all units were eliminated simultaneously
    if (!unit) {
      const drawText = new Text({
        text: 'MUTUAL ELIMINATION DRAW',
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: 36,
          fontWeight: '800',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      drawText.anchor.set(0.5);
      drawText.y = 0;
      this.cardContainer.addChild(drawText);
      return;
    }

    // 4. Winner Specimen Title & Short Description
    const chassisName = (unit.chassisSpec?.name || 'Organism').toUpperCase();
    const titleText = new Text({
      text: `SPECIMEN #${unit.slotIndex + 1} [${chassisName}]`,
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 34,
        fontWeight: '800',
        fill: PALETTE.OUTLINE_STROKE,
      },
    });
    titleText.anchor.set(0.5);
    titleText.y = -368;
    this.cardContainer.addChild(titleText);

    const descText = new Text({
      text: `“${unit.desc || 'Supreme evolved arena survivor'}”`,
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 19,
        fontWeight: '700',
        fontStyle: 'italic',
        fill: 0x4A4E69,
      },
    });
    descText.anchor.set(0.5);
    descText.y = -332;
    this.cardContainer.addChild(descText);

    // 5. TOP ROW:
    // Left Showcase Box: 230x230 centered at (-270, -180) -> spans X: [-385, -155], Y: [-295, -65]
    // Right Stats Panel: spans X: [-130, +385], Y: [-295, -65] (25px clean horizontal gap, zero overlap)
    this.buildSpecimenEndShapeShowcase(unit, -270, -180);
    this.buildWinningStatsPanel(unit, matchDuration);

    // Clean Horizontal Divider
    const divider = new Graphics();
    divider.moveTo(-385, -42);
    divider.lineTo(385, -42);
    divider.stroke({ width: 3, color: 0xDFD3B8 });
    this.cardContainer.addChild(divider);

    // 6. BOTTOM SECTION: Detailed Winning Mutations & Viruses List (spans Y: -22 to +390)
    this.buildMutationsDossier(unit, -385, -22);
  }

  /**
   * Builds the live animated showcase of the specimen's final evolved shape.
   * Box: 230x230 centered at (-270, -180), spanning X: [-385, -155], Y: [-295, -65]
   */
  buildSpecimenEndShapeShowcase(unit, centerX, centerY) {
    const boxSize = 230;
    const halfBox = boxSize * 0.5; // 115

    const frame = new Graphics();
    frame.roundRect(centerX - halfBox, centerY - halfBox, boxSize, boxSize, 22);
    frame.fill({ color: 0xEDE2CE });
    frame.stroke({ width: 4, color: PALETTE.OUTLINE_STROKE });
    this.cardContainer.addChild(frame);

    // Subtle concentric target rings inside pedestal
    const rings = new Graphics();
    rings.circle(centerX, centerY - 10, 76);
    rings.stroke({ width: 2, color: 0xDFD3B8 });
    rings.circle(centerX, centerY - 10, 46);
    rings.stroke({ width: 1.5, color: 0xDFD3B8 });
    this.cardContainer.addChild(rings);

    // Pedestal Caption
    const caption = new Text({
      text: 'FINAL EVOLVED FORM',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 13,
        fontWeight: '700',
        fill: 0x4A4E69,
        letterSpacing: 0.8,
      },
    });
    caption.anchor.set(0.5);
    caption.x = centerX;
    caption.y = centerY + halfBox - 20;
    this.cardContainer.addChild(caption);

    // Specimen Root Container
    this.specimenPreviewRoot = new Container();
    this.specimenPreviewRoot.x = centerX;
    this.specimenPreviewRoot.y = centerY - 10;
    const baseScale = unit.hasGigantism ? 1.12 : 1.02;
    this.specimenPreviewBaseScale = baseScale;
    this.specimenPreviewRoot.scale.set(baseScale);
    this.cardContainer.addChild(this.specimenPreviewRoot);

    // A. Spiky Carapace Corona Ring (if infected with Spiky Carapace virus)
    if (unit.virusTraits && unit.virusTraits.has(SUPPLY_MUTAGEN_IDS.SPIKY_CARAPACE)) {
      const spiky = new Sprite(CentralRegistry.getTexture('VIRUS_SPIKY_RING'));
      spiky.anchor.set(0.5);
      this.specimenPreviewRoot.addChild(spiky);
    }

    // B. Perimeter Sockets Container (underneath chassis rim)
    const perimeterContainer = new Container();
    this.specimenPreviewRoot.addChild(perimeterContainer);

    // C. Chassis Body Sprite
    const bodySpr = new Sprite(CentralRegistry.getTexture(`CHASSIS_BODY_${unit.chassisType}`));
    bodySpr.anchor.set(0.5);
    bodySpr.tint = unit.color;
    this.specimenPreviewRoot.addChild(bodySpr);

    // D. Dorsal Top-Mounted Organs Container
    const dorsalContainer = new Container();
    this.specimenPreviewRoot.addChild(dorsalContainer);

    // Populate all grafted mutations from the winning unit's sockets
    for (let i = 0; i < unit.sockets.length; i++) {
      const skt = unit.sockets[i];
      if (!skt.mutationId) continue;
      const texKey =
        skt.category === 'PARASITE' ? skt.mutationId : `${skt.mutationId}_LVL${skt.level}`;
      const tex = CentralRegistry.getTexture(texKey);
      if (!tex) continue;

      const spr = new Sprite(tex);
      if (skt.isDorsal) {
        spr.anchor.set(0.5, 0.5);
        spr.x = skt.x ?? -9;
        spr.y = skt.y ?? 0;
        spr.scale.set(skt.level === 2 ? 1.04 : 0.94);
        dorsalContainer.addChild(spr);
      } else {
        spr.anchor.set(0.18, 0.5);
        spr.x = fastCos(skt.angle) * skt.dist;
        spr.y = fastSin(skt.angle) * skt.dist;
        spr.rotation = skt.angle;
        spr.scale.set(skt.level === 2 ? 1.04 : 0.94);
        perimeterContainer.addChild(spr);
      }
    }

    // E. Forward-Offset Expressive Eyes (Sclera + Pupil)
    const eyeOffsets = unit.chassisSpec?.eyeOffsets || [
      { x: 14, y: -9, r: 7 },
      { x: 14, y: 9, r: 7 },
    ];
    for (let i = 0; i < eyeOffsets.length; i++) {
      const eo = eyeOffsets[i];
      const eyeWrap = new Container();
      eyeWrap.x = eo.x;
      eyeWrap.y = eo.y;
      const scaleRatio = (eo.r || 7.5) / 7.5;
      eyeWrap.scale.set(scaleRatio);

      const sclera = new Sprite(CentralRegistry.getTexture('EYE_SCLERA'));
      sclera.anchor.set(0.5);
      eyeWrap.addChild(sclera);

      const pupil = new Sprite(CentralRegistry.getTexture('EYE_PUPIL'));
      pupil.anchor.set(0.5);
      pupil.x = 1.0;
      pupil.y = 0;
      eyeWrap.addChild(pupil);

      this.specimenPreviewRoot.addChild(eyeWrap);
      this.previewEyes.push({ pupil });
    }
  }

  /**
   * Builds the 2x2 Winning Stats Grid + Survival Time bar on the top-right.
   * Strictly bounded within X: [-130, +385] and Y: [-295, -65] with zero overlap.
   */
  buildWinningStatsPanel(unit, matchDuration) {
    const colLeftX = -6;    // boxW = 248 -> spans [-130, +118]
    const colRightX = 261;  // boxW = 248 -> spans [+137, +385]
    const rowTopY = -259;   // boxH = 72  -> spans [-295, -223]
    const rowBotY = -175;   // boxH = 72  -> spans [-211, -139]

    const stats = [
      {
        label: 'FINAL VITALITY',
        value: `${Math.max(1, Math.round(unit.hp))} / ${unit.maxHp} HP`,
        color: 0x57CC99,
        x: colLeftX,
        y: rowTopY,
      },
      {
        label: 'ELIMINATIONS',
        value: `${unit.kills} KILLS`,
        color: 0xFF6B6B,
        x: colRightX,
        y: rowTopY,
      },
      {
        label: 'TOTAL MUTATIONS',
        value: `${unit.getTotalMutationScore()} GENES`,
        color: 0x9B5DE5,
        x: colLeftX,
        y: rowBotY,
      },
      {
        label: 'TOP SPEED',
        value: `${Math.round(unit.getEffectiveSpeed ? unit.getEffectiveSpeed() : unit.baseSpeed)} SPD`,
        color: 0x4D96FF,
        x: colRightX,
        y: rowBotY,
      },
    ];

    const boxW = 248;
    const boxH = 72;

    stats.forEach((st) => {
      const card = new Graphics();
      card.roundRect(st.x - boxW * 0.5, st.y - boxH * 0.5, boxW, boxH, 14);
      card.fill({ color: 0xFFFDF7 });
      card.stroke({ width: 3, color: PALETTE.OUTLINE_STROKE });
      this.cardContainer.addChild(card);

      // Left color accent bar
      const accent = new Graphics();
      accent.roundRect(st.x - boxW * 0.5 + 6, st.y - boxH * 0.5 + 8, 8, boxH - 16, 4);
      accent.fill({ color: st.color });
      this.cardContainer.addChild(accent);

      const lbl = new Text({
        text: st.label,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          fontWeight: '800',
          fill: 0x5C677D,
          letterSpacing: 0.7,
        },
      });
      lbl.anchor.set(0, 0.5);
      lbl.x = st.x - boxW * 0.5 + 22;
      lbl.y = st.y - 13;
      this.cardContainer.addChild(lbl);

      const val = new Text({
        text: st.value,
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: 22,
          fontWeight: '800',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      val.anchor.set(0, 0.5);
      val.x = st.x - boxW * 0.5 + 22;
      val.y = st.y + 12;
      this.cardContainer.addChild(val);
    });

    // Survival Time & Socket Summary Bar (spans X: [-130, +385], Y: [-123, -65])
    const summaryW = 515;
    const summaryH = 58;
    const summaryCenterX = 127.5;
    const summaryCenterY = -94;

    const summaryBg = new Graphics();
    summaryBg.roundRect(
      summaryCenterX - summaryW * 0.5,
      summaryCenterY - summaryH * 0.5,
      summaryW,
      summaryH,
      14
    );
    summaryBg.fill({ color: 0xEDE2CE });
    summaryBg.stroke({ width: 3, color: PALETTE.OUTLINE_STROKE });
    this.cardContainer.addChild(summaryBg);

    const activeMutCount = unit.getAllActiveMutations
      ? unit.getAllActiveMutations().length
      : unit.sockets.filter((s) => s.mutationId).length + (unit.virusTraits ? unit.virusTraits.size : 0);
    const summaryText = new Text({
      text: `SURVIVAL TIME: ${matchDuration.toFixed(1)}S  ·  ACTIVE MUTATIONS: ${activeMutCount}`,
      style: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 16,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
      },
    });
    summaryText.anchor.set(0.5);
    summaryText.x = summaryCenterX;
    summaryText.y = summaryCenterY;
    this.cardContainer.addChild(summaryText);
  }

  /**
   * Builds the Winning Specimen's complete Mutation & Virus Dossier list showing ALL active mutations.
   * Dynamically adapts between 1-column (1-5 mutations), 2-column (6-12 mutations), and 3-column (13+ mutations)
   * layouts so every mutation fits inside the Win Popup card with zero overflow.
   */
  buildMutationsDossier(unit, startX, startY) {
    let items = [];
    if (unit.getAllActiveMutations) {
      items = unit.getAllActiveMutations().slice().reverse();
    } else {
      for (let i = 0; i < unit.sockets.length; i++) {
        const skt = unit.sockets[i];
        if (!skt.mutationId) continue;
        const spec = INNATE_MUTATIONS[skt.mutationId] || SUPPLY_MUTAGENS[skt.mutationId];
        if (spec) {
          items.push({
            name: spec.name,
            level: skt.level,
            desc: spec.desc || 'Grafted combat organ',
            color: spec.color || 0xFF8A5B,
            type: (spec.mutationType || 'GENE').toUpperCase(),
            texKey:
              skt.category === 'PARASITE' ? skt.mutationId : `${skt.mutationId}_LVL${skt.level}`,
          });
        }
      }
      if (unit.virusTraits) {
        unit.virusTraits.forEach((vid) => {
          const spec = SUPPLY_MUTAGENS[vid];
          if (spec) {
            items.push({
              name: spec.name,
              level: 1,
              desc: spec.desc || 'Supply drop pathogen',
              color: spec.color || PALETTE.SUPPLY_PARASITE,
              type: 'VIRUS',
              texKey: vid,
            });
          }
        });
      }
    }

    const displayItems = items; // Show ALL mutations on the Win Popup!
    const headerTitle = `CHAMPION MUTATION LOADOUT (${displayItems.length} TOTAL)`;

    const header = new Text({
      text: headerTitle,
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 19,
        fontWeight: '800',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 1,
      },
    });
    header.x = startX;
    header.y = startY;
    this.cardContainer.addChild(header);

    if (displayItems.length === 0) return;

    const totalW = 770;
    const availH = 382; // Y: startY + 30 (-22 + 30 = +8) down to +390 (inside card bottom +416)
    const count = displayItems.length;

    const cols = count <= 5 ? 1 : count <= 12 ? 2 : 3;
    const colGap = cols === 1 ? 0 : cols === 2 ? 14 : 10;
    const colW = Math.floor((totalW - (cols - 1) * colGap) / cols);
    const numRows = Math.ceil(count / cols);
    const rowGap = numRows <= 5 ? 10 : 7;
    const maxRowH = cols === 1 ? 66 : cols === 2 ? 58 : 48;
    const rowH = Math.min(maxRowH, Math.floor((availH - (numRows - 1) * rowGap) / numRows));

    for (let i = 0; i < count; i++) {
      const m = displayItems[i];
      const colIdx = i % cols;
      const rowIdx = Math.floor(i / cols);

      const card = new Container();
      card.x = startX + colIdx * (colW + colGap);
      card.y = startY + 32 + rowIdx * (rowH + rowGap);

      const bg = new Graphics();
      bg.roundRect(0, 0, colW, rowH, 12);
      bg.fill({ color: 0xFFFDF7 });
      bg.stroke({ width: cols === 1 ? 3 : 2.5, color: PALETTE.OUTLINE_STROKE });
      card.addChild(bg);

      // Miniature Organ Icon Frame
      const iconBoxSize = Math.max(30, rowH - 14);
      const iconX = 8;
      const iconY = Math.floor((rowH - iconBoxSize) * 0.5);

      const iconBg = new Graphics();
      iconBg.roundRect(iconX, iconY, iconBoxSize, iconBoxSize, 8);
      iconBg.fill({ color: m.color, alpha: 0.22 });
      iconBg.stroke({ width: 1.8, color: m.color });
      card.addChild(iconBg);

      const tex = CentralRegistry.getTexture(m.texKey);
      if (tex) {
        const iconSpr = new Sprite(tex);
        iconSpr.anchor.set(0.5);
        iconSpr.x = iconX + iconBoxSize * 0.5;
        iconSpr.y = iconY + iconBoxSize * 0.5;
        iconSpr.scale.set((iconBoxSize / 50) * 0.68);
        card.addChild(iconSpr);
      }

      const textStartX = iconX + iconBoxSize + 12;
      const badgeW = cols === 1 ? 110 : cols === 2 ? 78 : 58;
      const badgeH = cols === 1 ? 30 : 24;
      const badgeX = colW - badgeW - 10;
      const badgeY = (rowH - badgeH) * 0.5;

      // Mutation Name + Level
      const nameFontSize = cols === 1 ? 19 : cols === 2 ? 15 : 13;
      const nameText = new Text({
        text: `${m.name} ${m.level > 1 ? '[LVL 2]' : ''}`,
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: nameFontSize,
          fontWeight: '700',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      nameText.anchor.set(0, 0.5);
      nameText.x = textStartX;
      nameText.y = Math.floor(rowH * 0.34);
      card.addChild(nameText);

      // 3-5 Word Short Description
      const descFontSize = cols === 1 ? 14 : cols === 2 ? 12 : 10.5;
      const desc = new Text({
        text: `“${m.desc}”`,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: descFontSize,
          fontWeight: '600',
          fontStyle: 'italic',
          fill: 0x5C677D,
        },
      });
      desc.anchor.set(0, 0.5);
      desc.x = textStartX;
      desc.y = Math.floor(rowH * 0.71);
      card.addChild(desc);

      // Right-Aligned Category Badge
      const badge = new Graphics();
      badge.roundRect(badgeX, badgeY, badgeW, badgeH, 7);
      badge.fill({ color: m.color, alpha: 0.24 });
      badge.stroke({ width: 1.5, color: m.color });
      card.addChild(badge);

      const badgeTxt = new Text({
        text: m.type,
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: cols === 1 ? 12 : cols === 2 ? 10.5 : 9.5,
          fontWeight: '700',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      badgeTxt.anchor.set(0.5);
      badgeTxt.x = badgeX + badgeW * 0.5;
      badgeTxt.y = badgeY + badgeH * 0.5;
      card.addChild(badgeTxt);

      this.cardContainer.addChild(card);
    }
  }

  /**
   * Animates the Win Popup card and specimen sine-wave squish/wiggle.
   * @param {number} dt
   */
  update(dt) {
    if (!this.root.visible) return;
    this.animTime += dt;

    // Smooth elastic pop-in scale
    if (this.popScale < 1.0) {
      this.popScale = Math.min(1.0, this.popScale + dt * 3.2);
      const backOut = 1 + Math.sin((this.popScale - 1) * Math.PI) * 0.06;
      this.cardContainer.scale.set(this.popScale * backOut);
    }

    // Animate Specimen Final Shape with sine-wave squish, stretch, rotational wiggle, and eye gaze
    if (this.specimenPreviewRoot) {
      const base = this.specimenPreviewBaseScale || 1.02;
      const wave = fastSin(this.animTime * 5.0);
      const squishY = base * (1.0 + wave * 0.068);
      const stretchX = base * (1.0 - wave * 0.052);
      const wiggle = fastSin(this.animTime * 3.6) * 0.12;

      this.specimenPreviewRoot.scale.set(stretchX, squishY);
      this.specimenPreviewRoot.rotation = wiggle;

      const lookX = fastCos(this.animTime * 2.4) * 1.6;
      const lookY = fastSin(this.animTime * 2.4) * 1.6;
      for (let i = 0; i < this.previewEyes.length; i++) {
        const eye = this.previewEyes[i];
        eye.pupil.x = lookX;
        eye.pupil.y = lookY;
      }
    }
  }

  hide() {
    this.root.visible = false;
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}
