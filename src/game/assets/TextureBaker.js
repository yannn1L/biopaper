/**
 * @file TextureBaker.js
 * High-DPI Pure SVG Vector Asset Baker for BioPaper Arena.
 * Rasterizes all modular SVG vector definitions into crisp high-resolution Pixi Textures.
 */

import { Texture, CanvasSource } from 'pixi.js';
import { CentralRegistry } from '../core/CentralRegistry.js';
import * as SvgLib from './SvgAssetRegistry.js';
import {
  CHASSIS_TYPES,
  MUTATION_IDS,
  SUPPLY_MUTAGEN_IDS,
} from '../core/Constants.js';

/**
 * Converts an SVG vector template string into a crisp, high-DPI Pixi.js Texture.
 * Properly wraps in CanvasSource with resolution so Pixi treats width and height
 * in logical game units instead of multiplied canvas pixels.
 * @param {string} svgString 
 * @param {number} width - Logical width in game units
 * @param {number} height - Logical height in game units
 * @param {number} resolution - Default 2 for retina crispness
 * @returns {Promise<Texture>}
 */
export async function rasterizeSvg(svgString, width = 74, height = 74, resolution = 2) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * resolution);
    canvas.height = Math.round(height * resolution);
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const encoded = encodeURIComponent(svgString);
    img.src = `data:image/svg+xml;charset=utf-8,${encoded}`;

    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const source = new CanvasSource({ resource: canvas, resolution });
      const texture = new Texture({ source });
      resolve(texture);
    };

    img.onerror = () => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const source = new CanvasSource({ resource: canvas, resolution });
      resolve(new Texture({ source }));
    };
  });
}

export class TextureBaker {
  /**
   * Bakes all SVG Vector assets in parallel batches and registers them in CentralRegistry.
   * Sizes are strictly calibrated to match game physics, socket distances, and arena bounds.
   * @param {Function} onProgress - Callback (ratio, label)
   */
  static async bakeAllSvgTextures(onProgress = () => {}) {
    // 1. Chassis Bodies, Shadows, and Hit Flashes (calibrated to ~72-88px to match radius 35-42)
    onProgress(0.12, 'Baking SVG Vector Chassis & Fiber Shadows...');
    const chassisSpecs = [
      { type: CHASSIS_TYPES.CIRCLE, w: 106, h: 106 },
      { type: CHASSIS_TYPES.TRIANGLE, w: 108, h: 108 },
      { type: CHASSIS_TYPES.RECTANGLE, w: 110, h: 98 },
      { type: CHASSIS_TYPES.PENTAGON, w: 110, h: 110 },
      { type: CHASSIS_TYPES.TUBE, w: 112, h: 90 },
    ];

    for (const c of chassisSpecs) {
      const cType = c.type;
      let bodySvg = '';

      if (cType === CHASSIS_TYPES.CIRCLE) {
        bodySvg = SvgLib.getCircleChassisSvg('#FFFFFF');
      } else if (cType === CHASSIS_TYPES.TRIANGLE) {
        bodySvg = SvgLib.getTriangleChassisSvg('#FFFFFF');
      } else if (cType === CHASSIS_TYPES.RECTANGLE) {
        bodySvg = SvgLib.getRectangleChassisSvg('#FFFFFF');
      } else if (cType === CHASSIS_TYPES.PENTAGON) {
        bodySvg = SvgLib.getPentagonChassisSvg('#FFFFFF');
      } else if (cType === CHASSIS_TYPES.TUBE) {
        bodySvg = SvgLib.getTubeChassisSvg('#FFFFFF');
      }

      const bodyTex = await rasterizeSvg(bodySvg, c.w, c.h, 2);
      CentralRegistry.registerTexture(`CHASSIS_BODY_${cType}`, bodyTex);

      const shadowSvg = SvgLib.getChassisShadowSvg(cType);
      const shadowTex = await rasterizeSvg(shadowSvg, c.w + 14, c.h + 14, 2);
      CentralRegistry.registerTexture(`CHASSIS_SHADOW_${cType}`, shadowTex);

      const flashSvg = SvgLib.getChassisFlashSvg(cType);
      const flashTex = await rasterizeSvg(flashSvg, c.w, c.h, 2);
      CentralRegistry.registerTexture(`CHASSIS_FLASH_${cType}`, flashTex);
    }

    // 2. All 16 Innate Mutations (Dorsal organs ~46x46px, Directional weapons ~58x42px)
    onProgress(0.40, 'Baking 16 SVG Innate & Fused Weapons...');
    const dorsalMutations = new Set([
      MUTATION_IDS.VENOM_GLAND,
      MUTATION_IDS.SHOCK_PULSAR,
      MUTATION_IDS.FROST_AURA,
      MUTATION_IDS.REGEN_BLADDER,
    ]);
    const allMutations = Object.values(MUTATION_IDS);
    for (const mid of allMutations) {
      const isDorsal = dorsalMutations.has(mid);
      const w1 = isDorsal ? 44 : 58;
      const h1 = isDorsal ? 44 : 42;
      const svgL1 = SvgLib.getMutationSvg(mid, 1);
      const texL1 = await rasterizeSvg(svgL1, w1, h1, 2);
      CentralRegistry.registerTexture(`${mid}_LVL1`, texL1);

      const w2 = isDorsal ? 52 : 70;
      const h2 = isDorsal ? 52 : 50;
      const svgL2 = SvgLib.getMutationSvg(mid, 2);
      const texL2 = await rasterizeSvg(svgL2, w2, h2, 2);
      CentralRegistry.registerTexture(`${mid}_LVL2`, texL2);
    }

    // 3. Dynamic Supply Drops, Viruses, & Symbionts
    onProgress(0.68, 'Baking SVG Supply Viruses & Parasites...');
    const supplyDimensions = {
      [SUPPLY_MUTAGEN_IDS.GIGANTISM_VIRUS]: { w: 58, h: 58 },
      [SUPPLY_MUTAGEN_IDS.HYPER_SPEED_MUTAGEN]: { w: 54, h: 54 },
      [SUPPLY_MUTAGEN_IDS.SPIKY_CARAPACE]: { w: 60, h: 60 },
      [SUPPLY_MUTAGEN_IDS.BERSERKER_STRAIN]: { w: 56, h: 56 },
      [SUPPLY_MUTAGEN_IDS.MITOSIS_STRAIN]: { w: 56, h: 56 },
      [SUPPLY_MUTAGEN_IDS.FERRO_CHITIN_STRAIN]: { w: 56, h: 56 },
      [SUPPLY_MUTAGEN_IDS.NEURO_OVERCLOCK_VIRUS]: { w: 56, h: 56 },
      [SUPPLY_MUTAGEN_IDS.TOXIC_SPORE_STRAIN]: { w: 56, h: 56 },
      [SUPPLY_MUTAGEN_IDS.LEECH_MAW]: { w: 44, h: 44 },
      [SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC]: { w: 52, h: 42 },
      [SUPPLY_MUTAGEN_IDS.SHADOW_CHAMELEON]: { w: 42, h: 42 },
      [SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE]: { w: 46, h: 46 },
      [SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL]: { w: 60, h: 42 },
      [SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD]: { w: 54, h: 42 },
      [SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW]: { w: 58, h: 44 },
      [SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT]: { w: 56, h: 40 },
    };

    const allSupply = Object.values(SUPPLY_MUTAGEN_IDS);
    for (const sid of allSupply) {
      const svg = SvgLib.getSupplyMutagenSvg(sid);
      const dim = supplyDimensions[sid] || { w: 52, h: 52 };
      const tex = await rasterizeSvg(svg, dim.w, dim.h, 2);
      CentralRegistry.registerTexture(sid, tex);
    }

    // Auxiliary spiky carapace corona underlay ring (neatly surrounds ~74px chassis)
    const spikyRingSvg = SvgLib.getSupplyMutagenSvg('VIRUS_SPIKY_RING');
    const spikyRingTex = await rasterizeSvg(spikyRingSvg, 96, 96, 2);
    CentralRegistry.registerTexture('VIRUS_SPIKY_RING', spikyRingTex);

    // 4. Projectiles, Crates, Parachutes, Eyes, & Props (strictly proportional to units)
    onProgress(0.85, 'Baking SVG Projectiles, Eyes & Supply Drops...');
    const props = [
      { key: 'EYE_SCLERA', w: 16, h: 16 },
      { key: 'EYE_PUPIL', w: 9, h: 9 },
      { key: 'PROJ_ACID_GLOB', w: 24, h: 24 },
      { key: 'PROJ_BOMB_SAC', w: 30, h: 30 },
      { key: 'PROJ_QUILL', w: 38, h: 16 },
      { key: 'PROJ_HOMING_SPORE', w: 24, h: 24 },
      { key: 'PROJ_HORNET', w: 24, h: 24 },
      { key: 'SUPPLY_CRATE', w: 48, h: 48 },
      { key: 'SUPPLY_PARACHUTE', w: 84, h: 64 },
      { key: 'SOCKET_GROMMET', w: 20, h: 20 },
      { key: 'PAPER_CONFETTI', w: 16, h: 16 },
      { key: 'PAPER_DUST', w: 14, h: 14 },
    ];

    for (const p of props) {
      const svg = SvgLib.getProjectilesAndPropsSvg(p.key);
      const tex = await rasterizeSvg(svg, p.w, p.h, 2);
      CentralRegistry.registerTexture(p.key, tex);
    }

    // 5. Arena Floorboard Parchment Blueprint (exactly 1024x1024 for ARENA_RADIUS = 475)
    onProgress(0.96, 'Baking SVG Blueprint Arena Board...');
    const floorSvg = SvgLib.getProjectilesAndPropsSvg('ARENA_FLOOR_BOARD');
    const floorTex = await rasterizeSvg(floorSvg, 1024, 1024, 1.5);
    CentralRegistry.registerTexture('ARENA_FLOOR_BOARD', floorTex);

    onProgress(1.0, 'Papercraft Vector Diorama Ready!');
  }
}
