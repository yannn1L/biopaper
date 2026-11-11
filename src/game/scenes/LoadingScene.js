/**
 * @file LoadingScene.js
 * Section 7.1A: Scene 1 - Pre-computes Math LUTs, registers catalog definitions,
 * and bakes procedural papercraft textures into RenderTextures across frames.
 */

import { Container, Graphics, Text } from 'pixi.js';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PALETTE,
  CHASSIS_SPECS,
  INNATE_MUTATIONS,
  SUPPLY_MUTAGENS,
} from '../core/Constants.js';
import { initMathLUT } from '../core/MathLUT.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import { registerAllStrategies } from '../ai/Strategies.js';
import { TextureBaker } from '../assets/TextureBaker.js';

export class LoadingScene {
  constructor(engine) {
    this.engine = engine;
    this.container = new Container();

    // Backdrop
    const bg = new Graphics();
    bg.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    bg.fill({ color: PALETTE.ARENA_BACKDROP });
    this.container.addChild(bg);

    // Cardstock Loading Card
    const card = new Graphics();
    card.roundRect(DESIGN_WIDTH * 0.5 - 380, DESIGN_HEIGHT * 0.5 - 190, 760, 380, 28);
    card.fill({ color: PALETTE.ARENA_FLOOR });
    card.stroke({ width: 6, color: PALETTE.OUTLINE_STROKE });
    this.container.addChild(card);

    this.titleText = new Text({
      text: 'BIOPAPER ARENA',
      style: {
        fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
        fontSize: 58,
        fontWeight: '700',
        fill: PALETTE.OUTLINE_STROKE,
        letterSpacing: 2,
      },
    });
    this.titleText.anchor.set(0.5);
    this.titleText.x = DESIGN_WIDTH * 0.5;
    this.titleText.y = DESIGN_HEIGHT * 0.5 - 85;
    this.container.addChild(this.titleText);

    this.statusText = new Text({
      text: 'Initializing Math LUT & Baking Papercraft Atlas...',
      style: {
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 26,
        fontWeight: '600',
        fill: 0x4A4E69,
      },
    });
    this.statusText.anchor.set(0.5);
    this.statusText.x = DESIGN_WIDTH * 0.5;
    this.statusText.y = DESIGN_HEIGHT * 0.5 - 15;
    this.container.addChild(this.statusText);

    // Progress Bar Track
    const barTrack = new Graphics();
    barTrack.roundRect(DESIGN_WIDTH * 0.5 - 300, DESIGN_HEIGHT * 0.5 + 45, 600, 38, 19);
    barTrack.fill({ color: 0xDFD3B8 });
    barTrack.stroke({ width: 4, color: PALETTE.OUTLINE_STROKE });
    this.container.addChild(barTrack);

    this.barFill = new Graphics();
    this.container.addChild(this.barFill);

    this.tasks = [];
    this.currentTaskIndex = 0;
    this.finishDelay = 0.25;
    this.isLoaded = false;
  }

  async enter() {
    this.isLoaded = false;
    this.finishDelay = 0.25;

    // 1. Precompute sinLUT and cosLUT
    initMathLUT();

    // 2. Populate Central Registry
    Object.values(CHASSIS_SPECS).forEach((spec) => CentralRegistry.registerChassis(spec.id, spec));
    Object.values(INNATE_MUTATIONS).forEach((spec) => CentralRegistry.registerInnateMutation(spec.id, spec));
    Object.values(SUPPLY_MUTAGENS).forEach((spec) => CentralRegistry.registerSupplyMutagen(spec.id, spec));
    registerAllStrategies();

    // 3. Rasterize Pure SVG Vector Assets at High-DPI
    this.drawProgress(0.05);
    this.statusText.text = 'Rasterizing SVG Vector Assets (High-DPI)...';

    try {
      await TextureBaker.bakeAllSvgTextures((ratio, label) => {
        this.drawProgress(ratio);
        this.statusText.text = label;
      });
    } catch (err) {
      console.warn('SVG Baking fallback note:', err);
    }

    this.isLoaded = true;
    this.drawProgress(1);
    this.statusText.text = 'Papercraft Vector Diorama Ready!';
  }

  drawProgress(ratio) {
    this.barFill.clear();
    const w = Math.max(24, 592 * Math.min(1, Math.max(0, ratio)));
    this.barFill.roundRect(DESIGN_WIDTH * 0.5 - 296, DESIGN_HEIGHT * 0.5 + 49, w, 30, 15);
    this.barFill.fill({ color: PALETTE.RECTANGLE_CHASSIS });
  }

  update(dt) {
    if (!this.isLoaded) return;
    this.finishDelay -= dt;
    if (this.finishDelay <= 0) {
      this.engine.switchToEditorScene();
    }
  }

  exit() {}
}
