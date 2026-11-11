/**
 * @file CombatPopupManager.js
 * Arcade-juicy combat popup engine for damage numbers, critical strikes,
 * status alerts, and elimination/fusion callouts with bouncy comic-book physics.
 */

import { Container, Text } from 'pixi.js';
import { ObjectPool } from '../core/ObjectPool.js';
import { PALETTE } from '../core/Constants.js';

export class CombatPopupManager {
  /**
   * @param {Container} parentLayer - The container in SimulationScene where popups render
   */
  constructor(parentLayer) {
    this.container = new Container();
    parentLayer.addChild(this.container);

    this.pool = new ObjectPool(
      () => {
        const text = new Text({
          text: '',
          style: {
            fontFamily: 'Fredoka, Plus Jakarta Sans, sans-serif',
            fontSize: 22,
            fontWeight: '700',
            fill: 0xFFFDF9,
            stroke: { width: 5, color: 0x1A1D20, join: 'round' },
            dropShadow: {
              alpha: 0.4,
              angle: Math.PI / 4,
              blur: 3,
              color: 0x0F1219,
              distance: 3,
            },
            letterSpacing: 1,
          },
        });
        text.anchor.set(0.5);
        text.visible = false;
        this.container.addChild(text);

        return {
          text,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          gravity: 380,
          scale: 1,
          targetScale: 1,
          life: 0,
          maxLife: 0.75,
          isCallout: false,
        };
      },
      (item) => {
        item.text.visible = false;
      },
      64
    );
  }

  /**
   * Spawns a floating bouncy damage number with comic arc
   */
  spawnDamage(x, y, amount, isCrit = false, isReflectOrDot = false) {
    const item = this.pool.acquire();
    const txt = item.text;

    // Formatting & Stying
    if (isCrit) {
      txt.text = `CRIT! -${amount}`;
      txt.style.fontSize = 28;
      txt.style.fill = PALETTE.GOLD_CROWN;
      txt.style.stroke = { width: 6, color: 0x800F2F, join: 'round' };
      item.scale = 1.65;
      item.targetScale = 1.05;
      item.maxLife = 0.88;
      item.vy = -210;
    } else if (isReflectOrDot) {
      txt.text = `-${amount}`;
      txt.style.fontSize = 18;
      txt.style.fill = PALETTE.VENOM_ACID;
      txt.style.stroke = { width: 4.5, color: 0x1A1D20, join: 'round' };
      item.scale = 1.25;
      item.targetScale = 0.95;
      item.maxLife = 0.65;
      item.vy = -140;
    } else {
      txt.text = `-${amount}`;
      txt.style.fontSize = 22;
      txt.style.fill = 0xFFFDF9;
      txt.style.stroke = { width: 5, color: 0x1A1D20, join: 'round' };
      item.scale = 1.45;
      item.targetScale = 1.0;
      item.maxLife = 0.72;
      item.vy = -180;
    }

    // Parabolic Arc Physics
    const jitterX = (Math.random() - 0.5) * 24;
    item.x = x + jitterX;
    item.y = y - 18;
    item.vx = (Math.random() - 0.5) * 85;
    item.gravity = 380;
    item.life = item.maxLife;
    item.isCallout = false;

    txt.x = item.x;
    txt.y = item.y;
    txt.scale.set(item.scale);
    txt.alpha = 1.0;
    txt.visible = true;
  }

  /**
   * Spawns status alerts: STUN!, SLOW -50%, POISON!, +25 HP
   */
  spawnStatus(x, y, message, color = 0x00F5D4) {
    const item = this.pool.acquire();
    const txt = item.text;

    txt.text = message;
    txt.style.fontSize = 20;
    txt.style.fill = color;
    txt.style.stroke = { width: 5, color: 0x1A1D20, join: 'round' };

    item.x = x + (Math.random() - 0.5) * 20;
    item.y = y - 28;
    item.vx = (Math.random() - 0.5) * 50;
    item.vy = -150;
    item.gravity = 240;
    item.scale = 1.35;
    item.targetScale = 1.0;
    item.maxLife = 0.78;
    item.life = item.maxLife;
    item.isCallout = false;

    txt.x = item.x;
    txt.y = item.y;
    txt.scale.set(item.scale);
    txt.alpha = 1.0;
    txt.visible = true;
  }

  /**
   * Spawns major event banner callouts: GENE THEFT!, MUTATION FUSED!, APEX SLAYER!
   */
  spawnCallout(x, y, message, color = PALETTE.GOLD_CROWN) {
    const item = this.pool.acquire();
    const txt = item.text;

    txt.text = message;
    txt.style.fontSize = 26;
    txt.style.fill = color;
    txt.style.stroke = { width: 6, color: 0x1A1D20, join: 'round' };

    item.x = x;
    item.y = y - 42;
    item.vx = 0;
    item.vy = -120;
    item.gravity = 140;
    item.scale = 1.8;
    item.targetScale = 1.15;
    item.maxLife = 1.15;
    item.life = item.maxLife;
    item.isCallout = true;

    txt.x = item.x;
    txt.y = item.y;
    txt.scale.set(item.scale);
    txt.alpha = 1.0;
    txt.visible = true;
  }

  update(dt) {
    const active = this.pool.activeList;
    for (let i = active.length - 1; i >= 0; i--) {
      const p = active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pool.release(p);
        continue;
      }

      // Parabolic Arc Physics
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Springy Comic-Book Scale Settle
      p.scale += (p.targetScale - p.scale) * Math.min(1, dt * 16);

      // Fade in last 40% of lifetime
      const fadeProgress = p.life / (p.maxLife * 0.45);
      const alpha = Math.min(1, Math.max(0, fadeProgress));

      p.text.x = p.x;
      p.text.y = p.y;
      p.text.scale.set(p.scale);
      p.text.alpha = alpha;
    }
  }

  clear() {
    this.pool.releaseAll();
  }

  destroy() {
    this.clear();
    this.container.destroy({ children: true });
  }
}
