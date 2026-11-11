/**
 * @file SoundFX.js
 * Comprehensive Procedural Web Audio API Synthesizer for BioPaper Arena.
 * Provides distinct, throttled audio voices for all 16 innate mutations,
 * 3 supply parasites, slot machine reel mechanics, parachute deployment,
 * Level 2 fusion chimes, hit impacts, and arena boundary events with zero external asset latency.
 */

import { MUTATION_IDS, SUPPLY_MUTAGEN_IDS } from '../core/Constants.js';

class SoundFXManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastPlayed = new Map();
    this.noiseBuffer = null;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.noiseBuffer) {
      this.createSharedNoiseBuffer();
    }
  }

  createSharedNoiseBuffer() {
    if (!this.ctx) return;
    const length = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  /**
   * Prevents audio clipping and preserves 60fps when multiple organisms fire simultaneously.
   */
  canPlay(key, cooldownMs = 35) {
    if (!this.enabled) return false;
    if (!this.ctx) {
      this.unlock();
    }
    if (!this.ctx || this.ctx.state !== 'running') return false;
    const nowMs = performance.now();
    const prev = this.lastPlayed.get(key) || 0;
    if (nowMs - prev < cooldownMs) return false;
    this.lastPlayed.set(key, nowMs);
    return true;
  }

  // ============================================================================
  // UI, PARACHUTE, FUSION, HIT & ARENA LIFECYCLE SFX
  // ============================================================================

  playThumbtackPop() {
    if (!this.canPlay('THUMBTACK', 25)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.065);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  playParachuteWhoosh() {
    if (!this.canPlay('PARACHUTE_WHOOSH', 120)) return;
    if (!this.noiseBuffer) this.createSharedNoiseBuffer();
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(680, now);
    filter.frequency.exponentialRampToValueAtTime(240, now + 0.24);
    filter.Q.setValueAtTime(2.4, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.27);
  }

  playHitImpact(isCrit = false) {
    if (!this.canPlay(isCrit ? 'CRIT_HIT' : 'HIT_IMPACT', 40)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isCrit ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 320 : 185, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + (isCrit ? 0.09 : 0.055));
    gain.gain.setValueAtTime(isCrit ? 0.14 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isCrit ? 0.095 : 0.06));
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + (isCrit ? 0.1 : 0.065));
  }

  playWallBounce() {
    if (!this.canPlay('WALL_BOUNCE', 65)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.045);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.09);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playRingShrinkAlert() {
    if (!this.canPlay('RING_SHRINK', 400)) return;
    const now = this.ctx.currentTime;
    const freqs = [440, 554.37];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + idx * 0.09);
      gain.gain.setValueAtTime(0.09, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.13);
    });
  }

  playFusionChime() {
    if (!this.canPlay('FUSION_CHIME', 90)) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.11, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.23);
    });
  }

  playPaperTearConfetti() {
    if (!this.canPlay('PAPER_TEAR', 40)) return;
    if (!this.noiseBuffer) this.createSharedNoiseBuffer();
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1450, now);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  playVictoryChord() {
    if (!this.canPlay('VICTORY_CHORD', 200)) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.1, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.46);
    });
  }

  // ============================================================================
  // SLOT MACHINE SFX (REEL TICK, LOCK-IN CLACK, JACKPOT FANFARE)
  // ============================================================================

  playSlotTick(pitchFactor = 1.0) {
    if (!this.canPlay('SLOT_TICK', 22)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const baseFreq = 540 * Math.max(0.7, Math.min(1.5, pitchFactor));
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, now + 0.025);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playSlotReelLock(reelIndex = 0) {
    if (!this.canPlay(`SLOT_LOCK_${reelIndex}`, 40)) return;
    const now = this.ctx.currentTime;
    const rootFreq = 330 * Math.pow(1.122, reelIndex); // Ascending lock pitch per reel

    // Mechanical thunk + harmonic bell lock
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(160, now);
    osc1.frequency.exponentialRampToValueAtTime(65, now + 0.055);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(rootFreq, now);
    osc2.frequency.exponentialRampToValueAtTime(rootFreq * 1.5, now + 0.11);

    gain.gain.setValueAtTime(0.17, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.06);
    osc2.stop(now + 0.14);
  }

  playSlotJackpotFanfare() {
    if (!this.canPlay('SLOT_JACKPOT', 200)) return;
    const now = this.ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const t = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.37);
    });
  }

  // ============================================================================
  // ALL 16 INNATE MUTATIONS & 3 PARASITE WEAPON SFX
  // ============================================================================

  /**
   * Plays the tailored procedural sound effect for any mutation or supply mutagen ID.
   */
  playMutationSFX(mutationId) {
    switch (mutationId) {
      case MUTATION_IDS.BIO_PINCER:
        this.playPincerSnap();
        break;
      case MUTATION_IDS.MANTIS_SCYTHE:
        this.playMantisScytheSlash();
        break;
      case MUTATION_IDS.SPIRAL_DRILL:
        this.playSpiralDrillBuzz();
        break;
      case MUTATION_IDS.BONE_SPEAR:
        this.playBoneSpearThrust();
        break;
      case MUTATION_IDS.ACID_SPITTER:
        this.playAcidSquelch();
        break;
      case MUTATION_IDS.QUILL_VOLLEY:
        this.playQuillVolleyShot();
        break;
      case MUTATION_IDS.PLASMA_SIPHON:
        this.playPlasmaSiphonBeam();
        break;
      case MUTATION_IDS.SPORE_HOMER:
        this.playSporeHomerLaunch();
        break;
      case MUTATION_IDS.HORNET_NEST:
        this.playHornetSwarmBuzz();
        break;
      case MUTATION_IDS.VENOM_GLAND:
        this.playVenomCloudHiss();
        break;
      case MUTATION_IDS.SHOCK_PULSAR:
        this.playShockPulsarZap();
        break;
      case MUTATION_IDS.FROST_AURA:
        this.playFrostAuraChime();
        break;
      case MUTATION_IDS.CILIA_FLAGELLA:
        this.playCiliaFlagellaDash();
        break;
      case MUTATION_IDS.CHITIN_CARAPACE:
        this.playChitinArmorClack();
        break;
      case MUTATION_IDS.SPRING_TENDON:
        this.playSpringTendonBoing();
        break;
      case MUTATION_IDS.REGEN_BLADDER:
        this.playRegenBladderPulse();
        break;
      case SUPPLY_MUTAGEN_IDS.LEECH_MAW:
        this.playLeechMawSiphon();
        break;
      case SUPPLY_MUTAGEN_IDS.BOMBARDIER_SAC:
        this.playBombardierLaunch();
        break;
      case SUPPLY_MUTAGEN_IDS.SHADOW_CHAMELEON:
        this.playShadowChameleonCloak();
        break;
      case SUPPLY_MUTAGEN_IDS.BERSERKER_STRAIN:
        this.playBerserkerRoar();
        break;
      case SUPPLY_MUTAGEN_IDS.MITOSIS_STRAIN:
        this.playRegenBladderPulse();
        break;
      case SUPPLY_MUTAGEN_IDS.FERRO_CHITIN_STRAIN:
        this.playChitinArmorClack();
        break;
      case SUPPLY_MUTAGEN_IDS.NEURO_OVERCLOCK_VIRUS:
        this.playCiliaFlagellaDash();
        break;
      case SUPPLY_MUTAGEN_IDS.TOXIC_SPORE_STRAIN:
        this.playVenomCloudHiss();
        break;
      case SUPPLY_MUTAGEN_IDS.TESLA_BARNACLE:
        this.playTeslaBarnacleZap();
        break;
      case SUPPLY_MUTAGEN_IDS.REAPER_TENDRIL:
        this.playMantisScytheSlash();
        break;
      case SUPPLY_MUTAGEN_IDS.SPORE_CANNON_POD:
        this.playSporeHomerLaunch();
        break;
      case SUPPLY_MUTAGEN_IDS.ABYSSAL_JAW:
        this.playAbyssalJawSnap();
        break;
      case SUPPLY_MUTAGEN_IDS.CRYO_SPINE_SYMBIONT:
        this.playFrostAuraChime();
        break;
      default:
        this.playThumbtackPop();
        break;
    }
  }

  // 1. BIO-PINCER: Crunchy chitin jaw snap
  playPincerSnap() {
    if (!this.canPlay('BIO_PINCER', 40)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.055);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.065);
  }

  // 2. MANTIS SCYTHE: Sharp high-velocity blade slash swoosh
  playMantisScytheSlash() {
    if (!this.canPlay('MANTIS_SCYTHE', 45)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(980, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.085);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  // 3. SPIRAL DRILL: High-RPM rotary bore buzz
  playSpiralDrillBuzz() {
    if (!this.canPlay('SPIRAL_DRILL', 50)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.linearRampToValueAtTime(240, now + 0.03);
    osc.frequency.linearRampToValueAtTime(150, now + 0.065);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  // 4. BONE SPEAR: Heavy resonant impale thrust
  playBoneSpearThrust() {
    if (!this.canPlay('BONE_SPEAR', 50)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.095);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.105);
  }

  // 5. ACID SPITTER: Liquid organic glob squelch
  playAcidSquelch() {
    if (!this.canPlay('ACID_SPITTER', 45)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(560, now);
    osc.frequency.exponentialRampToValueAtTime(155, now + 0.085);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  // 6. QUILL VOLLEY: Crisp multi-needle dart snap
  playQuillVolleyShot() {
    if (!this.canPlay('QUILL_VOLLEY', 50)) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.022;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(760 + i * 140, t);
      osc.frequency.exponentialRampToValueAtTime(240, t + 0.042);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    }
  }

  // 7. PLASMA SIPHON: Sci-fi harmonic energy beam hum
  playPlasmaSiphonBeam() {
    if (!this.canPlay('PLASMA_SIPHON', 55)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.12);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.135);
  }

  // 8. SPORE HOMER: Warbling seeker pod launch blip
  playSporeHomerLaunch() {
    if (!this.canPlay('SPORE_HOMER', 55)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(410, now + 0.11);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.115);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 9. HORNET NEST: Buzzing paper wasp swarm launch
  playHornetSwarmBuzz() {
    if (!this.canPlay('HORNET_NEST', 55)) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(285, now);
    osc2.frequency.setValueAtTime(298, now); // Detuned wasp wing beat
    osc1.frequency.linearRampToValueAtTime(390, now + 0.09);
    osc2.frequency.linearRampToValueAtTime(408, now + 0.09);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.1);
    osc2.stop(now + 0.1);
  }

  // 10. VENOM GLAND: Pressurized toxic aerosol hiss + bubble
  playVenomCloudHiss() {
    if (!this.canPlay('VENOM_GLAND', 70)) return;
    if (!this.noiseBuffer) this.createSharedNoiseBuffer();
    if (!this.noiseBuffer) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.18);
  }

  // 11. SHOCK PULSAR: High-voltage electric discharge zap
  playShockPulsarZap() {
    if (!this.canPlay('SHOCK_PULSAR', 65)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1120, now);
    osc.frequency.setValueAtTime(480, now + 0.03);
    osc.frequency.setValueAtTime(920, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.13);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.145);
  }

  // 12. FROST AURA: Crystalline glacial shimmer chime
  playFrostAuraChime() {
    if (!this.canPlay('FROST_AURA', 70)) return;
    const now = this.ctx.currentTime;
    const freqs = [1046.5, 1318.5];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.035;
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.14);
      gain.gain.setValueAtTime(0.085, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  // 13. CILIA FLAGELLA: Rapid whip-tail propulsion flutter
  playCiliaFlagellaDash() {
    if (!this.canPlay('CILIA_FLAGELLA', 60)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.075);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  // 14. CHITIN CARAPACE: Heavy armored shell deflection clack
  playChitinArmorClack() {
    if (!this.canPlay('CHITIN_CARAPACE', 65)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.05);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 15. SPRING TENDON: Elastic tendon recoil boing
  playSpringTendonBoing() {
    if (!this.canPlay('SPRING_TENDON', 65)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.11);
    osc.frequency.exponentialRampToValueAtTime(610, now + 0.16);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.175);
  }

  // 16. REGEN BLADDER: Warm organic cellular heal pulse
  playRegenBladderPulse() {
    if (!this.canPlay('REGEN_BLADDER', 450)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392.0, now);
    osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.11);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.125);
  }

  // 17. LEECH MAW (PARASITE): Eerie sub-harmonic siphon pulse
  playLeechMawSiphon() {
    if (!this.canPlay('LEECH_MAW', 260)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.11);
    gain.gain.setValueAtTime(0.075, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.125);
  }

  // 18. BOMBARDIER SAC (PARASITE): Hollow mortar launch thump
  playBombardierLaunch() {
    if (!this.canPlay('BOMBARDIER_LAUNCH', 65)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.11);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.125);
  }

  // 19. SHADOW CHAMELEON (PARASITE): Airy stealth cloak shimmer
  playShadowChameleonCloak() {
    if (!this.canPlay('SHADOW_CHAMELEON', 90)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(290, now + 0.14);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.155);
  }

  playBombExplosion() {
    if (!this.canPlay('BOMB_EXPLOSION', 55)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.24);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  // 20. BERSERKER STRAIN (VIRUS): Aggressive low-mid rage growl chord
  playBerserkerRoar() {
    if (!this.canPlay('BERSERKER_ROAR', 90)) return;
    const now = this.ctx.currentTime;
    [130.8, 196.0].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.14);
      gain.gain.setValueAtTime(0.085, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    });
  }

  // 21. TESLA BARNACLE (PARASITE): Crisp chain-lightning arc crackle
  playTeslaBarnacleZap() {
    if (!this.canPlay('TESLA_BARNACLE', 55)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1320, now);
    osc.frequency.setValueAtTime(640, now + 0.025);
    osc.frequency.setValueAtTime(1180, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.11);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.115);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 22. ABYSSAL JAW (PARASITE): Deep sub-aquatic angler crunch + suction pull
  playAbyssalJawSnap() {
    if (!this.canPlay('ABYSSAL_JAW', 55)) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.11);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.125);
  }
}

export const SoundFX = new SoundFXManager();
