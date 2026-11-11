/**
 * @file BioPaperEngine.js
 * Master Pixi.js v8 Engine managing the 1080x1920 (9:16 Portrait Lock) canvas
 * and the 3-Scene Pipeline: LoadingScene -> EditorScene -> SimulationScene.
 */

import { Application } from 'pixi.js';
import {
  DESIGN_WIDTH,
  DESIGN_HEIGHT,
  PALETTE,
  UNIT_PALETTE,
  CHASSIS_TYPES,
  MUTATION_IDS,
  TARGET_STRATEGY_IDS,
  MOTION_STRATEGY_IDS,
  getSpecimenConfigDesc,
} from './core/Constants.js';
import { clamp } from './core/MathLUT.js';
import { LoadingScene } from './scenes/LoadingScene.js';
import { EditorScene } from './scenes/EditorScene.js';
import { SimulationScene } from './scenes/SimulationScene.js';

const ALL_CHASSIS = Object.values(CHASSIS_TYPES);
const ALL_MUTATIONS = Object.values(MUTATION_IDS);
const ALL_TARGETS = Object.values(TARGET_STRATEGY_IDS);
const ALL_MOTIONS = Object.values(MOTION_STRATEGY_IDS);

export class BioPaperEngine {
  constructor(mountElement) {
    this.mountElement = mountElement;
    this.app = null;
    this.currentScene = null;
    this.loadingScene = null;
    this.editorScene = null;
    this.simulationScene = null;

    // Default to 10 organisms (configurable 4..16 per GDD 1.1)
    this.unitCount = 10;
    this.autoLoopSpectator = false;
    this.autoPickRandomSpecimens = false;
    this.rosterConfigs = [];
    this.initRosterConfigs();

    this.boundResize = () => this.handleResize();
    this.boundKeyDown = (e) => {
      // Allow Escape key to return to Editor Scene during spectator recording if needed
      if (e.key === 'Escape' && this.currentScene === this.simulationScene) {
        this.switchToEditorScene();
      }
    };
  }

  initRosterConfigs() {
    this.rosterConfigs = [];
    for (let i = 0; i < 16; i++) {
      const chassis = ALL_CHASSIS[i % ALL_CHASSIS.length];
      const mutation = ALL_MUTATIONS[i % ALL_MUTATIONS.length];
      this.rosterConfigs.push({
        chassisType: chassis,
        innateMutationId: mutation,
        targetStrategyId: ALL_TARGETS[i % ALL_TARGETS.length],
        motionStrategyId: ALL_MOTIONS[i % ALL_MOTIONS.length],
        color: UNIT_PALETTE[i % UNIT_PALETTE.length], // Guaranteed distinct color for each unit
        desc: getSpecimenConfigDesc(chassis, mutation),
      });
    }
  }

  randomizeRoster() {
    // Generate a shuffled copy of UNIT_PALETTE so every single unit gets a unique color
    const shuffledColors = [...UNIT_PALETTE].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 16; i++) {
      const chassis = ALL_CHASSIS[Math.floor(Math.random() * ALL_CHASSIS.length)];
      const mutation = ALL_MUTATIONS[Math.floor(Math.random() * ALL_MUTATIONS.length)];
      this.rosterConfigs[i] = {
        chassisType: chassis,
        innateMutationId: mutation,
        targetStrategyId: ALL_TARGETS[Math.floor(Math.random() * ALL_TARGETS.length)],
        motionStrategyId: ALL_MOTIONS[Math.floor(Math.random() * ALL_MOTIONS.length)],
        color: shuffledColors[i % shuffledColors.length], // Each unit has a different color
        desc: getSpecimenConfigDesc(chassis, mutation),
      };
    }
  }

  /**
   * Rolls 4 fresh random specimens with guaranteed distinct colors and locks unitCount to 4
   * for the 4-reel Slot Machine Draft.
   */
  rollFourRandomSpecimens() {
    this.unitCount = 4;
    const shuffledColors = [...UNIT_PALETTE].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 4; i++) {
      const chassis = ALL_CHASSIS[Math.floor(Math.random() * ALL_CHASSIS.length)];
      const mutation = ALL_MUTATIONS[Math.floor(Math.random() * ALL_MUTATIONS.length)];
      this.rosterConfigs[i] = {
        chassisType: chassis,
        innateMutationId: mutation,
        targetStrategyId: ALL_TARGETS[Math.floor(Math.random() * ALL_TARGETS.length)],
        motionStrategyId: ALL_MOTIONS[Math.floor(Math.random() * ALL_MOTIONS.length)],
        color: shuffledColors[i],
        desc: getSpecimenConfigDesc(chassis, mutation),
      };
    }
    return this.rosterConfigs.slice(0, 4);
  }

  setUnitCount(count) {
    this.unitCount = clamp(count, 4, 16);
  }

  async start() {
    const app = new Application();
    await app.init({
      width: DESIGN_WIDTH,
      height: DESIGN_HEIGHT,
      backgroundColor: PALETTE.ARENA_BACKDROP,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    this.app = app;
    this.mountElement.innerHTML = '';
    this.mountElement.appendChild(app.canvas);

    this.handleResize();
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('keydown', this.boundKeyDown);

    this.loadingScene = new LoadingScene(this);
    this.editorScene = new EditorScene(this);
    this.simulationScene = new SimulationScene(this);

    this.setScene(this.loadingScene);

    app.ticker.add((ticker) => {
      const dt = ticker.deltaMS / 1000;
      if (this.currentScene) {
        this.currentScene.update(dt);
      }
    });
  }

  setScene(nextScene) {
    if (this.currentScene) {
      this.currentScene.exit();
      this.app.stage.removeChild(this.currentScene.container);
    }
    this.currentScene = nextScene;
    this.app.stage.addChild(this.currentScene.container);
    this.currentScene.enter();
  }

  switchToEditorScene() {
    this.setScene(this.editorScene);
  }

  switchToSimulationScene() {
    this.setScene(this.simulationScene);
  }

  handleResize() {
    if (!this.app || !this.app.canvas) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const targetAspect = DESIGN_WIDTH / DESIGN_HEIGHT; // 9:16 = 0.5625
    const windowAspect = vw / vh;

    let displayW;
    let displayH;
    if (windowAspect > targetAspect) {
      displayH = vh;
      displayW = Math.round(vh * targetAspect);
    } else {
      displayW = vw;
      displayH = Math.round(vw / targetAspect);
    }

    const canvas = this.app.canvas;
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;
    canvas.style.display = 'block';
    canvas.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.65)';
  }

  destroy() {
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('keydown', this.boundKeyDown);
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
