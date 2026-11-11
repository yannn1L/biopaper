/**
 * @file EditorScene.js
 * Section 7.1: Scene 2 - Genetic Assembly & Parachute Drop Editor Scene.
 * Allows configuring 4 to 16 organisms, customizing Chassis, Innate Mutation,
 * Target & Motion AI Strategies, and launching the 100% UI-Free Simulation Scene.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PALETTE,
  UNIT_PALETTE,
  CHASSIS_TYPES,
  CHASSIS_SPECS,
  MUTATION_IDS,
  INNATE_MUTATIONS,
  TARGET_STRATEGY_IDS,
  MOTION_STRATEGY_IDS,
  getSpecimenConfigDesc,
  selectBestSocketForMutation,
} from '../core/Constants.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import { SoundFX } from '../audio/SoundFX.js';
import { fastSin, fastCos } from '../core/MathLUT.js';

const CHASSIS_ORDER = [
  CHASSIS_TYPES.CIRCLE,
  CHASSIS_TYPES.TRIANGLE,
  CHASSIS_TYPES.RECTANGLE,
  CHASSIS_TYPES.PENTAGON,
  CHASSIS_TYPES.TUBE,
];

const MUTATION_ORDER = [
  MUTATION_IDS.BIO_PINCER,
  MUTATION_IDS.ACID_SPITTER,
  MUTATION_IDS.VENOM_GLAND,
  MUTATION_IDS.CILIA_FLAGELLA,
  MUTATION_IDS.MANTIS_SCYTHE,
  MUTATION_IDS.SPIRAL_DRILL,
  MUTATION_IDS.BONE_SPEAR,
  MUTATION_IDS.QUILL_VOLLEY,
  MUTATION_IDS.PLASMA_SIPHON,
  MUTATION_IDS.SPORE_HOMER,
  MUTATION_IDS.HORNET_NEST,
  MUTATION_IDS.SHOCK_PULSAR,
  MUTATION_IDS.FROST_AURA,
  MUTATION_IDS.CHITIN_CARAPACE,
  MUTATION_IDS.SPRING_TENDON,
  MUTATION_IDS.REGEN_BLADDER,
];

const TARGET_ORDER = [
  TARGET_STRATEGY_IDS.TACTICAL_OPPORTUNIST,
  TARGET_STRATEGY_IDS.THREAT_AVOIDANCE,
  TARGET_STRATEGY_IDS.NEAREST,
  TARGET_STRATEGY_IDS.LOWEST_HP,
  TARGET_STRATEGY_IDS.APEX_PREDATOR,
];

const MOTION_ORDER = [
  MOTION_STRATEGY_IDS.HIT_AND_RUN,
  MOTION_STRATEGY_IDS.STALKER_FLANK,
  MOTION_STRATEGY_IDS.KITING_STRAFE,
  MOTION_STRATEGY_IDS.DIRECT_CHARGE,
  MOTION_STRATEGY_IDS.FLEE_WHEN_LOW,
];

const SHORT_TARGET_LABELS = {
  [TARGET_STRATEGY_IDS.TACTICAL_OPPORTUNIST]: 'Tactical Matchup',
  [TARGET_STRATEGY_IDS.THREAT_AVOIDANCE]: 'Safe Skirmish',
  [TARGET_STRATEGY_IDS.NEAREST]: 'Nearest Spread',
  [TARGET_STRATEGY_IDS.LOWEST_HP]: 'Lowest HP Hunt',
  [TARGET_STRATEGY_IDS.APEX_PREDATOR]: 'Apex Threat',
};

const SHORT_MOTION_LABELS = {
  [MOTION_STRATEGY_IDS.HIT_AND_RUN]: 'Hit & Disengage',
  [MOTION_STRATEGY_IDS.STALKER_FLANK]: 'Flank & Stalk',
  [MOTION_STRATEGY_IDS.KITING_STRAFE]: 'Orbit & Kite',
  [MOTION_STRATEGY_IDS.DIRECT_CHARGE]: 'Tactical Weave',
  [MOTION_STRATEGY_IDS.FLEE_WHEN_LOW]: 'Flee & Loot',
};

export class EditorScene {
  constructor(engine) {
    this.engine = engine;
    this.container = new Container();
    this.selectedSlotIndex = 0;
    this.animTime = 0;
    this.slotCards = [];
  }

  enter() {
    this.container.removeChildren();
    this.slotCards = [];

    // Ensure cursor is visible in Editor Scene
    if (this.engine.app?.canvas) {
      this.engine.app.canvas.style.cursor = 'default';
    }

    // 1. Dark Slate Paper Backdrop
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    bg.fill({ color: PALETTE.ARENA_BACKDROP });
    this.container.addChild(bg);

    // Subtle decorative arena blueprint watermark disc in background
    const bgDisc = new Sprite(CentralRegistry.getTexture('ARENA_FLOOR_BOARD'));
    bgDisc.anchor.set(0.5);
    bgDisc.x = DESIGN_WIDTH * 0.5;
    bgDisc.y = DESIGN_HEIGHT * 0.5;
    bgDisc.alpha = 0.08;
    bgDisc.scale.set(1.05);
    this.container.addChild(bgDisc);

    // 2. Top Header Banner Card (Papercraft Cutout)
    this.buildHeader();

    // 3. Unit Count & Roster Toolbar (4 to 16 organisms)
    this.buildCountBar();

    // 4. Roster Grid (Interactive Organism Cards)
    this.gridContainer = new Container();
    this.container.addChild(this.gridContainer);
    this.rebuildRosterGrid();

    // 5. Selected Organism Genetic Workbench Panel
    this.workbenchContainer = new Container();
    this.container.addChild(this.workbenchContainer);
    this.rebuildWorkbench();

    // 6. Bottom Deploy Drop CTA Button
    this.buildDeployFooter();
  }

  buildHeader() {
    const header = new Container();
    header.x = DESIGN_WIDTH * 0.5;
    header.y = 112;

    const shadow = new Graphics();
    shadow.roundRect(-484, -68, 980, 142, 24);
    shadow.fill({ color: 0x0F1219, alpha: 0.45 });
    header.addChild(shadow);

    const card = new Graphics();
    card.roundRect(-490, -76, 980, 142, 24);
    card.fill({ color: PALETTE.ARENA_FLOOR });
    card.stroke({ width: 5, color: PALETTE.OUTLINE_STROKE });
    header.addChild(card);

    const title = new Text({
      text: 'BIOPAPER ARENA',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 54,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 1.5,
      },
    });
    title.anchor.set(0.5, 0.5);
    title.y = -24;
    header.addChild(title);

    const subtitle = new Text({
      text: 'GENETIC AUTO-BATTLER · PAPERCRAFT MUTATION LAB (9:16 SHORTS)',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 21,
        fontWeight: '700',
        fill: 0x4A4E69,
        letterSpacing: 1,
      },
    });
    subtitle.anchor.set(0.5, 0.5);
    subtitle.y = 30;
    header.addChild(subtitle);

    // Decorative SVG Papercraft Thumbtack Pins
    const pinL = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
    pinL.anchor.set(0.5);
    pinL.x = -455;
    pinL.y = -45;
    header.addChild(pinL);

    const pinR = new Sprite(CentralRegistry.getTexture('SOCKET_GROMMET'));
    pinR.anchor.set(0.5);
    pinR.x = 455;
    pinR.y = -45;
    header.addChild(pinR);

    this.container.addChild(header);
  }

  buildCountBar() {
    const bar = new Container();
    bar.x = DESIGN_WIDTH * 0.5;
    bar.y = 250;

    const bg = new Graphics();
    bg.roundRect(-490, -44, 980, 88, 20);
    bg.fill({ color: 0x383B54 });
    bg.stroke({ width: 4, color: PALETTE.OUTLINE_STROKE });
    bar.addChild(bg);

    const label = new Text({
      text: 'ORGANISM SQUAD (4–16):',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 26,
        fontWeight: '700',
        fill: 0xFFF8F0,
      },
    });
    label.anchor.set(0, 0.5);
    label.x = -456;
    bar.addChild(label);

    // Minus Button
    const minusBtn = this.createPaperButton('-', 64, 56, PALETTE.CIRCLE_CHASSIS, () => {
      SoundFX.unlock();
      SoundFX.playThumbtackPop();
      this.engine.setUnitCount(this.engine.unitCount - 1);
      if (this.selectedSlotIndex >= this.engine.unitCount) {
        this.selectedSlotIndex = this.engine.unitCount - 1;
      }
      this.countValueText.text = `${this.engine.unitCount}`;
      this.rebuildRosterGrid();
      this.rebuildWorkbench();
    });
    minusBtn.x = -80;
    bar.addChild(minusBtn);

    this.countValueText = new Text({
      text: `${this.engine.unitCount}`,
      style: {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 36,
        fontWeight: '700',
        fill: PALETTE.GOLD_CROWN,
      },
    });
    this.countValueText.anchor.set(0.5);
    this.countValueText.x = 0;
    bar.addChild(this.countValueText);

    // Plus Button
    const plusBtn = this.createPaperButton('+', 64, 56, PALETTE.RECTANGLE_CHASSIS, () => {
      SoundFX.unlock();
      SoundFX.playThumbtackPop();
      this.engine.setUnitCount(this.engine.unitCount + 1);
      this.countValueText.text = `${this.engine.unitCount}`;
      this.rebuildRosterGrid();
      this.rebuildWorkbench();
    });
    plusBtn.x = 80;
    bar.addChild(plusBtn);

    // Shuffle Genetics Button
    const shuffleBtn = this.createPaperButton('SHUFFLE GENES', 260, 56, PALETTE.TRIANGLE_CHASSIS, () => {
      SoundFX.unlock();
      SoundFX.playPaperTearConfetti();
      this.engine.randomizeRoster();
      this.rebuildRosterGrid();
      this.rebuildWorkbench();
    });
    shuffleBtn.x = 325;
    bar.addChild(shuffleBtn);

    this.container.addChild(bar);
  }

  rebuildRosterGrid() {
    this.gridContainer.removeChildren();
    this.slotCards = [];

    const count = this.engine.unitCount;
    const cols = 4;
    const cardW = 228;
    const cardH = 185;
    const gapX = 22;
    const gapY = 18;
    const startX = DESIGN_WIDTH * 0.5 - ((cols - 1) * (cardW + gapX)) * 0.5;
    const startY = 415;

    for (let i = 0; i < count; i++) {
      const cfg = this.engine.rosterConfigs[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = startX + col * (cardW + gapX);
      const cy = startY + row * (cardH + gapY);

      const isSelected = i === this.selectedSlotIndex;
      const card = new Container();
      card.x = cx;
      card.y = cy;
      card.eventMode = 'static';
      card.cursor = 'pointer';

      const shadow = new Graphics();
      shadow.roundRect(-cardW * 0.5 + 5, -cardH * 0.5 + 6, cardW, cardH, 20);
      shadow.fill({ color: 0x0F1219, alpha: 0.4 });
      card.addChild(shadow);

      const bg = new Graphics();
      bg.roundRect(-cardW * 0.5, -cardH * 0.5, cardW, cardH, 20);
      bg.fill({ color: isSelected ? 0xFFFDF7 : PALETTE.ARENA_FLOOR });
      bg.stroke({
        width: isSelected ? 6 : 4,
        color: isSelected ? PALETTE.GOLD_CROWN : PALETTE.OUTLINE_STROKE,
      });
      card.addChild(bg);

      // Slot number tag
      const numText = new Text({
        text: `#${i + 1}`,
        style: {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 20,
          fontWeight: '700',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      numText.x = -cardW * 0.5 + 16;
      numText.y = -cardH * 0.5 + 12;
      card.addChild(numText);

      // Live organism preview miniature with anatomical socket placement & forward eyes
      const previewRoot = new Container();
      previewRoot.y = -12;
      previewRoot.scale.set(0.88);

      const chassisSpec = CHASSIS_SPECS[cfg.chassisType];
      const mutSpec = INNATE_MUTATIONS[cfg.innateMutationId];
      const bestSocket = selectBestSocketForMutation(
        chassisSpec.sockets.map((s) => ({ ...s, mutationId: null })),
        mutSpec
      ) || chassisSpec.sockets[0];

      const bodySpr = new Sprite(CentralRegistry.getTexture(`CHASSIS_BODY_${cfg.chassisType}`));
      bodySpr.anchor.set(0.5);
      bodySpr.tint = cfg.color !== undefined ? cfg.color : 0xFFFFFF;

      const organSpr = new Sprite(CentralRegistry.getTexture(`${cfg.innateMutationId}_LVL1`));
      if (bestSocket.isDorsal || mutSpec.isDorsalVisual) {
        // Chassis first, then top-mounted dorsal organ
        previewRoot.addChild(bodySpr);
        organSpr.anchor.set(0.5, 0.5);
        organSpr.x = bestSocket.x ?? -9;
        organSpr.y = bestSocket.y ?? 0;
        previewRoot.addChild(organSpr);
      } else {
        // Perimeter organ under chassis lip, then chassis on top
        organSpr.anchor.set(0.18, 0.5);
        organSpr.x = fastCos(bestSocket.angle) * bestSocket.dist;
        organSpr.y = fastSin(bestSocket.angle) * bestSocket.dist;
        organSpr.rotation = bestSocket.angle;
        previewRoot.addChild(organSpr);
        previewRoot.addChild(bodySpr);
      }

      // Forward-offset expressive eyes on top of chassis
      const eyes = [];
      const eyeOffsets = chassisSpec.eyeOffsets || [
        { x: 11, y: -9 },
        { x: 11, y: 9 },
      ];
      for (let eIdx = 0; eIdx < eyeOffsets.length; eIdx++) {
        const eo = eyeOffsets[eIdx];
        const sclera = new Sprite(CentralRegistry.getTexture('EYE_SCLERA'));
        sclera.anchor.set(0.5);
        sclera.x = eo.x;
        sclera.y = eo.y;
        previewRoot.addChild(sclera);

        const pupil = new Sprite(CentralRegistry.getTexture('EYE_PUPIL'));
        pupil.anchor.set(0.5);
        pupil.x = eo.x + 1.0;
        pupil.y = eo.y;
        previewRoot.addChild(pupil);
        eyes.push({ pupil, baseX: eo.x, baseY: eo.y });
      }

      card.addChild(previewRoot);

      // Mutation & Strategy label
      const mutLabel = new Text({
        text: `[${(mutSpec.mutationType || 'GENE').toUpperCase()}] ${mutSpec.name}`,
        style: {
          fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
          fontSize: 18,
          fontWeight: '700',
          fill: PALETTE.OUTLINE_STROKE,
        },
      });
      mutLabel.anchor.set(0.5);
      mutLabel.y = 48;
      card.addChild(mutLabel);

      const stratLabel = new Text({
        text: SHORT_MOTION_LABELS[cfg.motionStrategyId],
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 16,
          fontWeight: '600',
          fill: 0x4A4E69,
        },
      });
      stratLabel.anchor.set(0.5);
      stratLabel.y = 72;
      card.addChild(stratLabel);

      card.on('pointerdown', () => {
        SoundFX.unlock();
        SoundFX.playThumbtackPop();
        this.selectedSlotIndex = i;
        this.rebuildRosterGrid();
        this.rebuildWorkbench();
      });

      this.gridContainer.addChild(card);
      this.slotCards.push({ card, previewRoot, organSpr, bestSocket, eyes });
    }
  }

  rebuildWorkbench() {
    this.workbenchContainer.removeChildren();
    const cfg = this.engine.rosterConfigs[this.selectedSlotIndex];
    if (!cfg) return;

    const panel = new Container();
    panel.x = DESIGN_WIDTH * 0.5;
    panel.y = 1365;

    const shadow = new Graphics();
    shadow.roundRect(-484, -184, 980, 376, 26);
    shadow.fill({ color: 0x0F1219, alpha: 0.45 });
    panel.addChild(shadow);

    const bg = new Graphics();
    bg.roundRect(-490, -190, 980, 376, 26);
    bg.fill({ color: PALETTE.ARENA_FLOOR });
    bg.stroke({ width: 5, color: PALETTE.OUTLINE_STROKE });
    panel.addChild(bg);

    const chassisSpec = CHASSIS_SPECS[cfg.chassisType];
    const unitColor = cfg.color !== undefined ? cfg.color : chassisSpec.color;

    const headerText = new Text({
      text: `SPECIMEN #${this.selectedSlotIndex + 1} WORKBENCH · HP ${chassisSpec.baseHp} · SPD ${chassisSpec.speed} · ${chassisSpec.socketCount} SKTS`,
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 23,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
      },
    });
    headerText.anchor.set(0.5);
    headerText.y = -152;
    panel.addChild(headerText);

    if (!cfg.desc) {
      cfg.desc = getSpecimenConfigDesc(cfg.chassisType, cfg.innateMutationId);
    }
    const descText = new Text({
      text: `“${cfg.desc}”`,
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 17,
        fontWeight: '600',
        fontStyle: 'italic',
        fill: 0x5C677D,
      },
    });
    descText.anchor.set(0.5);
    descText.y = -122;
    panel.addChild(descText);

    // 5 Customizer Rows: Chassis, Organism Color, Innate Gene, Target Strategy, Motion Strategy
    const rows = [
      {
        title: 'CHASSIS BODY:',
        value: chassisSpec.name,
        color: unitColor,
        y: -82,
        onCycle: () => {
          const idx = (CHASSIS_ORDER.indexOf(cfg.chassisType) + 1) % CHASSIS_ORDER.length;
          cfg.chassisType = CHASSIS_ORDER[idx];
          cfg.desc = getSpecimenConfigDesc(cfg.chassisType, cfg.innateMutationId);
        },
      },
      {
        title: 'UNIT COLOR:',
        value: `COLOR #${(UNIT_PALETTE.indexOf(cfg.color) >= 0 ? UNIT_PALETTE.indexOf(cfg.color) : 0) + 1}`,
        color: unitColor,
        y: -26,
        onCycle: () => {
          const currentIdx = UNIT_PALETTE.indexOf(cfg.color);
          const nextIdx = (currentIdx + 1) % UNIT_PALETTE.length;
          cfg.color = UNIT_PALETTE[nextIdx];
        },
      },
      {
        title: 'INNATE ORGAN:',
        value: `[${(INNATE_MUTATIONS[cfg.innateMutationId].mutationType || 'GENE').toUpperCase()}] ${INNATE_MUTATIONS[cfg.innateMutationId].name}`,
        color:
          INNATE_MUTATIONS[cfg.innateMutationId].mutationType === 'melee'
            ? 0xFF595E
            : INNATE_MUTATIONS[cfg.innateMutationId].mutationType === 'ranged'
            ? 0x48CAE4
            : INNATE_MUTATIONS[cfg.innateMutationId].mutationType === 'homing'
            ? 0x9B5DE5
            : INNATE_MUTATIONS[cfg.innateMutationId].mutationType === 'effect'
            ? 0x00F5D4
            : 0xFFD166,
        y: 30,
        onCycle: () => {
          const idx = (MUTATION_ORDER.indexOf(cfg.innateMutationId) + 1) % MUTATION_ORDER.length;
          cfg.innateMutationId = MUTATION_ORDER[idx];
          cfg.desc = getSpecimenConfigDesc(cfg.chassisType, cfg.innateMutationId);
        },
      },
      {
        title: 'TARGET BRAIN:',
        value: SHORT_TARGET_LABELS[cfg.targetStrategyId],
        color: PALETTE.GOLD_CROWN,
        y: 86,
        onCycle: () => {
          const idx = (TARGET_ORDER.indexOf(cfg.targetStrategyId) + 1) % TARGET_ORDER.length;
          cfg.targetStrategyId = TARGET_ORDER[idx];
        },
      },
      {
        title: 'MOTION BRAIN:',
        value: SHORT_MOTION_LABELS[cfg.motionStrategyId],
        color: 0xB8C0FF,
        y: 140,
        onCycle: () => {
          const idx = (MOTION_ORDER.indexOf(cfg.motionStrategyId) + 1) % MOTION_ORDER.length;
          cfg.motionStrategyId = MOTION_ORDER[idx];
        },
      },
    ];

    rows.forEach((r) => {
      const lbl = new Text({
        text: r.title,
        style: {
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 21,
          fontWeight: '700',
          fill: 0x383B54,
        },
      });
      lbl.anchor.set(0, 0.5);
      lbl.x = -440;
      lbl.y = r.y;
      panel.addChild(lbl);

      const cycleBtn = this.createPaperButton(`◀   ${r.value}   ▶`, 530, 48, r.color, () => {
        SoundFX.unlock();
        SoundFX.playThumbtackPop();
        r.onCycle();
        this.rebuildRosterGrid();
        this.rebuildWorkbench();
      }, 21);
      cycleBtn.x = 165;
      cycleBtn.y = r.y;
      panel.addChild(cycleBtn);
    });

    this.workbenchContainer.addChild(panel);
  }

  buildDeployFooter() {
    const footer = new Container();
    footer.x = DESIGN_WIDTH * 0.5;
    footer.y = 1715;

    // Auto Random Pick Specimen Toggle Button (Left) - replaces old Auto-Deploy switch
    this.autoPickBtn = this.createPaperButton(
      this.getAutoPickLabel(),
      350,
      115,
      this.engine.autoPickRandomSpecimens ? PALETTE.VENOM_ACID : 0xADB5BD,
      () => {
        SoundFX.unlock();
        SoundFX.playThumbtackPop();
        this.engine.autoPickRandomSpecimens = !this.engine.autoPickRandomSpecimens;
        if (this.engine.autoPickRandomSpecimens) {
          this.engine.setUnitCount(4);
          if (this.selectedSlotIndex >= 4) {
            this.selectedSlotIndex = 0;
          }
          if (this.countValueText) {
            this.countValueText.text = `${this.engine.unitCount}`;
          }
          this.rebuildRosterGrid();
          this.rebuildWorkbench();
        }
        this.container.removeChild(footer);
        this.buildDeployFooter();
      }
    );
    this.autoPickBtn.x = -305;
    footer.addChild(this.autoPickBtn);

    // Primary DEPLOY PARACHUTE DROP CTA Button (Right)
    const deployBtn = this.createPaperButton(
      'DEPLOY DROP ▶',
      590,
      115,
      PALETTE.RECTANGLE_CHASSIS,
      () => {
        SoundFX.unlock();
        SoundFX.playThumbtackPop();
        this.engine.switchToSimulationScene();
      },
      34
    );
    deployBtn.x = 195;

    // SVG Parachute Vector Icon
    const chuteIcon = new Sprite(CentralRegistry.getTexture('SUPPLY_PARACHUTE'));
    chuteIcon.anchor.set(0.5);
    chuteIcon.scale.set(0.38);
    chuteIcon.x = -205;
    chuteIcon.y = -6;
    deployBtn.addChild(chuteIcon);

    footer.addChild(deployBtn);

    // Note on Slot Machine / Arena Mode
    const note = new Text({
      text: this.engine.autoPickRandomSpecimens
        ? 'AUTO PICK ACTIVE: 4-REEL SLOT MACHINE ROLLS 4 RANDOM SPECIMENS AT MATCH START'
        : 'CLICK SPECIMENS IN ARENA TO INSPECT · SUPPLY DROPS EVERY 5.0S · WIN POPUP ON VICTORY',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 18,
        fontWeight: '700',
        fill: this.engine.autoPickRandomSpecimens ? PALETTE.GOLD_CROWN : 0xA8B2D1,
        letterSpacing: 0.6,
      },
    });
    note.anchor.set(0.5);
    note.y = 105;
    footer.addChild(note);

    this.container.addChild(footer);
  }

  getAutoPickLabel() {
    return this.engine.autoPickRandomSpecimens ? 'AUTO PICK: ON' : 'AUTO PICK: OFF';
  }

  createPaperButton(textStr, width, height, fillColor, onClick, fontSize = 24) {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    const shadow = new Graphics();
    shadow.roundRect(-width * 0.5 + 4, -height * 0.5 + 5, width, height, 16);
    shadow.fill({ color: 0x0F1219, alpha: 0.45 });
    btn.addChild(shadow);

    const bg = new Graphics();
    bg.roundRect(-width * 0.5, -height * 0.5, width, height, 16);
    bg.fill({ color: fillColor });
    bg.stroke({ width: 4, color: PALETTE.OUTLINE_STROKE });
    btn.addChild(bg);

    const txt = new Text({
      text: textStr,
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
      },
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.on('pointerover', () => {
      btn.scale.set(1.03);
    });
    btn.on('pointerout', () => {
      btn.scale.set(1.0);
    });
    btn.on('pointerdown', () => {
      btn.scale.set(0.95);
      onClick();
    });
    btn.on('pointerup', () => {
      btn.scale.set(1.03);
    });

    return btn;
  }

  update(dt) {
    this.animTime += dt;
    for (let i = 0; i < this.slotCards.length; i++) {
      const item = this.slotCards[i];
      const phase = this.animTime * 4.2 + i * 0.85;
      const waveY = fastSin(phase);
      const squishY = 0.88 * (1.0 + waveY * 0.065);
      const stretchX = 0.88 * (1.0 - waveY * 0.05);
      const wiggle = fastSin(this.animTime * 2.8 + i * 0.7) * 0.14;

      item.previewRoot.rotation = wiggle;
      item.previewRoot.scale.set(stretchX, squishY);

      if (item.organSpr && item.bestSocket) {
        const organPulse = 1.0 + fastSin(phase * 1.4) * 0.08;
        item.organSpr.scale.set(organPulse, 2.0 - organPulse);
      }

      if (item.eyes) {
        const lookX = fastCos(this.animTime * 2.2 + i) * 1.6;
        const lookY = fastSin(this.animTime * 2.2 + i) * 1.6;
        for (let eIdx = 0; eIdx < item.eyes.length; eIdx++) {
          const eye = item.eyes[eIdx];
          eye.pupil.x = eye.baseX + lookX;
          eye.pupil.y = eye.baseY + lookY;
        }
      }
    }
  }

  exit() {}
}
