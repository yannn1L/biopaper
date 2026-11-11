# BioPaper Arena: Full Mutation Audio Synthesizer & 4-Reel Specimen Slot Machine

This update upgrades the procedural Web Audio synthesizer with distinct sound effects for all 19 mutations, parasites, and arena events, and replaces the Editor Scene's Auto-Redeploy toggle with an **Auto Random Pick** switch that launches an addictive 4-reel papercraft Slot Machine draft at the start of battle.

## User Review & Critical Decisions

> [!IMPORTANT]
> All core design choices have been confirmed from your answers:

- **Confirmed Decision 1 (4-Specimen Slot Machine Match)**: When **Auto Random Pick** is enabled in the Editor Scene, starting a match locks the battle to a 4-specimen showdown drafted live by the slot machine.
- **Confirmed Decision 2 (4 Complete Specimen Reels)**: The slot machine displays 4 side-by-side vertical reels, where each reel spins through and locks in a complete random specimen card (Chassis + Unique Color + Innate Mutation + AI Strategy) with staggered stops.
- **Confirmed Decision 3 (Comprehensive Procedural SFX Suite)**: The Web Audio synthesizer will include unique sound effects for all 16 innate mutations and 3 parasites, slot machine reel ticks, staggered lock-in clacks, jackpot fanfare, parachute deployment whoosh, Level 2 fusion chime, hit impacts, and arena boundary bounce / shrinking ring alerts.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Editor Toggle Replacement**: Replaces the bottom-left `AUTO-REDEPLOY: ON/OFF` button in the Editor Scene with `AUTO PICK: ON/OFF` (`autoPickRandomSpecimens`).
  2. **Addictive 4-Reel Slot Machine Intro**: When `AUTO PICK: ON` is active and the player clicks **DEPLOY DROP ▶**, the Simulation Scene opens with a centered, tactile papercraft **4-Reel Specimen Slot Machine** overlay. All 4 reels spin rapidly with ratcheting mechanical clicks and decelerate one by one (`Reel 1 -> Reel 2 -> Reel 3 -> Reel 4`), snapping each drafted specimen into focus with a heavy lock-in clack, squash-and-stretch bounce, and a 4-note jackpot chord before dropping the 4 drafted specimens into the arena by parachute.
  3. **Complete Procedural Audio Overhaul**: Every weapon strike, projectile launch, dorsal aura pulse, parasite drain, Level 2 gene fusion, parachute descent, wall bounce, and ring shrink alert gets its own tailored Web Audio synthesizer voice with polyphony throttling so 60 FPS performance is preserved.
- **Target Audience / Persona**: Players and spectators who want juicy, tactile audio-visual feedback and a high-anticipation "random draft" casino-style roll before each 4-specimen battle.
- **Key Value**: Transforms silent or repetitive combat actions into distinct sonic signatures while turning match start into an exciting, replayable slot-machine reveal.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Toggling Auto Pick in the Lab**: In the Editor Scene footer, clicking the left toggle button switches between `AUTO PICK: OFF` (slate paper) and `AUTO PICK: ON` (neon toxic green `#00F5D4` with a tactile pop sound).
  2. **4-Reel Slot Machine Roll on Match Start**:
     - When `AUTO PICK: ON` is active and **DEPLOY DROP ▶** is pressed, the arena opens with the **Genetic Slot Machine** card centered over the arena board (`940 × 620` parchment frame with brass corner grommets and a gold header banner `"★ GENETIC SLOT MACHINE · 4-SPECIMEN DRAFT ★"`).
     - Four vertical reel windows (`200 × 360` each) rapidly cycle through candidate specimen cards (showing the live chassis silhouette, unique color, forward eyes, anatomical mutation organ, chassis name, and mutation label).
     - Reels decelerate and lock in sequentially at `1.0s`, `1.45s`, `1.90s`, and `2.35s`. Each lock-in triggers a resonant mechanical clack, gold border highlight, and elastic card bounce.
     - Once all 4 reels lock in, a celebratory jackpot fanfare plays, the drafted 4-specimen squad holds briefly (`0.75s`) so the viewer can admire the matchups, and the slot machine smoothly scales out as the 4 drafted specimens parachute into the arena.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactile Cut-Out Papercraft & Blueprint Diorama.
  - *Color Palette & Mood*: Dominant slate paper backdrop (`#2B2D42`) and warm blueprint parchment (`#F4ECD8` / `#F6EFE0`), structural ink outlines (`#1A1D20`, `4px–5px`), and high-intent accents in Gold Crown (`#FFD166`), Toxic Green (`#00F5D4`), and Coral Crimson (`#FF6B6B`).
  - *Typography & Hierarchy*: `Fredoka` (700/800) for bold display headers and reel titles, `Plus Jakarta Sans` (600/700) for mutation descriptions and strategy labels, and `JetBrains Mono` (700) for tabular reel indices (`#1`–`#4`) and stats.
- **Interactive Feedback & Motion**:
  - Compositor-friendly scale, rotation, and vertical reel translation driven by precomputed sine waves (`fastSin`/`fastCos`).
  - Each reel card squishes vertically during high-speed spin and snaps with a `1.18×` elastic overshoot when locking into place.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural Web Audio Synthesis with Voice Limiter**
  - *Chosen Approach*: Synthesize all 19 mutation sounds, slot machine cues, and arena FX using Web Audio API oscillators, noise buffers, and biquad filters, guarded by per-sound cooldown timestamps (`18ms–45ms` debounce).
  - *Why*: Guarantees zero external audio network requests, instant playback latency, and prevents audio clipping or frame drops when multiple organisms fire simultaneously.
  - *Alternatives Considered*: Loading external `.mp3`/`.wav` files, which adds asset loading wait times and memory overhead.
- **Decision 2: In-Scene Slot Machine Draft Overlay Prior to Parachute Drop**
  - *Chosen Approach*: Run the 4-reel slot machine as a dedicated pre-drop phase (`isSlotRolling`) inside the Simulation Scene before spawning/dropping the 4 drafted `OrganismUnit` instances.
  - *Why*: Lets the arena board serve as the dramatic background for the slot machine and transitions seamlessly into the parachute deployment without an extra scene reload.
  - *Alternatives Considered*: Running the slot machine inside the Editor Scene, which would clutter the workbench UI before scene transition.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             BioPaperEngine                               │
│  • State: unitCount (4..16), autoPickRandomSpecimens (boolean)           │
│  • Draft Helper: rollFourRandomSpecimens() -> 4 unique-color configs     │
└───────────────────┬──────────────────────────────────┬───────────────────┘
                    │                                  │
                    ▼                                  ▼
┌───────────────────────────────────────┐  ┌───────────────────────────────┐
│              EditorScene              │  │        SimulationScene        │
│  • Footer Toggle: AUTO PICK: ON / OFF │  │  • Phase 1 (if Auto Pick ON): │
│  • Deploy CTA -> switches to Arena    │  │    SlotMachineOverlay (4 Reel)│
└───────────────────────────────────────┘  │  • Phase 2: Parachute Drop &  │
                                           │    60 FPS Arena Combat        │
                                           └───────────────┬───────────────┘
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       SoundFX Procedural Synthesizer                     │
│  • 16 Innate Mutation Voices (Melee, Ranged, Homing, Effect, Utils)      │
│  • 3 Supply Parasite Voices (Leech Siphon, Bombardier Lob, Stealth)      │
│  • Slot Machine Voices (Reel Tick, Reel Lock Clack, Jackpot Fanfare)     │
│  • Arena & Lifecycle Voices (Parachute Whoosh, Lvl 2 Fusion, Hit, Wall,  │
│    Shrinking Ring Alert, Victory Chord)                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Distinct Sound Signatures Across All 19 Mutations & Arena Events**:
  - **Melee (`Bio-Pincer`, `Mantis Scythe`, `Spiral Drill`, `Bone Spear`)**: Crunchy sawtooth jaw snap, metallic high-Q slash swoosh, rapid modulated drill buzz, and deep resonant spear impale thud.
  - **Ranged (`Acid Spitter`, `Quill Volley`, `Plasma Siphon`)**: Liquid resonant filter squelch, crisp multi-spike noise burst, and sci-fi frequency-modulated laser beam hum.
  - **Homing (`Spore Homer`, `Hornet Nest`)**: Warbling organic spore launch blip and buzzing dual-detuned sawtooth wasp swarm.
  - **Effect (`Venom Gland`, `Shock Pulsar`, `Frost Aura`)**: Bubbling toxic hiss, high-voltage electric crackle zap, and crystalline high-harmonic ice shimmer chime.
  - **Utils (`Cilia Flagella`, `Chitin Carapace`, `Spring Tendon`, `Regen Bladder`)**: Rapid whip flutter dash, dull armored impact thud, boing pitch-bend spring leap, and warm ascending harmonic heal pulse.
  - **Supply Parasites & Viruses (`Leech Maw`, `Bombardier Sac`, `Shadow Chameleon`, `Level 2 Fusion`)**: Eerie sub-harmonic drain pulse, mortar tube thump + explosion boom, airy band-pass stealth shimmer, and bright arpeggiated fusion fanfare.
  - **Slot Machine & Arena Events**: Crisp woodblock reel ticks pitched up as reels slow down, heavy mechanical lock clack per reel, 4-chord jackpot fanfare, parachute canopy whoosh, rubbery wall bounce, and pulsing ring-shrink warning beep.
