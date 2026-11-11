/**
 * @file SvgAssetRegistry.js
 * Pure SVG Vector Asset Library for BioPaper Arena.
 * Contains modular, high-DPI scalable SVG vector definitions for Chassis, Mutations (Lvl 1 & 2),
 * Supply Drops, Projectiles, Arena Floor, and UI Icons.
 */

export const SVG_PALETTE = {
  OUTLINE: '#1A1D20',
  PAPER_WHITE: '#FFFFFF',
  PARCHMENT: '#F4ECD8',
  PARCHMENT_RING: '#DFD3B8',
  SLATE_BACKDROP: '#2B2D42',
  CORAL_RED: '#FF6B6B',
  CYAN_BLUE: '#4D96FF',
  PASTEL_EMERALD: '#6BCB77',
  AMETHYST: '#9B5DE5',
  SKY_CYAN: '#00BBF9',
  VENOM_ACID: '#00F5D4',
  GOLD_CROWN: '#FFD166',
  CRATE_CARDBOARD: '#E0A96D',
  PARACHUTE_RED: '#FF4D6D',
  PARACHUTE_WHITE: '#FFF8F0',
};

// -------------------------------------------------------------
// 1. CHASSIS SVG DEFINITIONS
// -------------------------------------------------------------

export function getCircleChassisSvg(fill = '#FFFFFF') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <radialGradient id="circlePaperGrad" cx="35%" cy="32%" r="68%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.85"/>
        <stop offset="70%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="#2D3142" stop-opacity="0.25"/>
      </radialGradient>
      <filter id="chassisShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="4" stdDeviation="3.5" flood-color="#0F1219" flood-opacity="0.32"/>
      </filter>
    </defs>
    <!-- Paper Cardstock Circle -->
    <circle cx="80" cy="80" r="54" fill="url(#circlePaperGrad)" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="5" filter="url(#chassisShadow)"/>
    <!-- Concentric Porous Rim Stitching -->
    <circle cx="80" cy="80" r="44" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-dasharray="6,5" stroke-opacity="0.45"/>
    <!-- Dorsal Mount Pad Behind Forward Eyes -->
    <circle cx="66" cy="80" r="19" fill="#0F1219" fill-opacity="0.1" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-dasharray="4,4" stroke-opacity="0.3"/>
    <!-- Subtle Paper Pores -->
    <circle cx="52" cy="58" r="3.0" fill="${SVG_PALETTE.OUTLINE}" fill-opacity="0.14"/>
    <circle cx="54" cy="102" r="2.8" fill="${SVG_PALETTE.OUTLINE}" fill-opacity="0.14"/>
    <circle cx="88" cy="54" r="2.8" fill="${SVG_PALETTE.OUTLINE}" fill-opacity="0.14"/>
    <circle cx="88" cy="106" r="2.5" fill="${SVG_PALETTE.OUTLINE}" fill-opacity="0.14"/>
  </svg>`;
}

export function getTriangleChassisSvg(fill = '#FFFFFF') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="triGrad" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="#1A1D20" stop-opacity="0.2"/>
      </linearGradient>
      <filter id="triShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="4" stdDeviation="3.5" flood-color="#0F1219" flood-opacity="0.32"/>
      </filter>
    </defs>
    <!-- Sharp Piercing Paper Arrow -->
    <path d="M 132 80 L 36 28 L 52 80 L 36 132 Z" fill="url(#triGrad)" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="5" stroke-linejoin="round" filter="url(#triShadow)"/>
    <!-- Embossed Fold Lines -->
    <path d="M 52 80 L 132 80" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-opacity="0.45"/>
    <path d="M 36 28 L 52 80 L 36 132" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2" stroke-opacity="0.25"/>
    <!-- Dorsal Saddle Pad Behind Eyes -->
    <circle cx="64" cy="80" r="14" fill="#0F1219" fill-opacity="0.1" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.6" stroke-dasharray="3,3" stroke-opacity="0.3"/>
    <!-- Nose Tip Pierce Reinforcement (+25% Pierce Bonus) -->
    <path d="M 132 80 L 104 69 L 104 91 Z" fill="#FFF8F0" fill-opacity="0.45" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`;
}

export function getRectangleChassisSvg(fill = '#FFFFFF') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 160" width="180" height="160">
    <defs>
      <linearGradient id="rectGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
        <stop offset="50%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="#1A1D20" stop-opacity="0.3"/>
      </linearGradient>
      <filter id="rectShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#0F1219" flood-opacity="0.35"/>
      </filter>
    </defs>
    <!-- Heavy Rounded Cardboard Slab -->
    <rect x="22" y="24" width="136" height="112" rx="26" ry="26" fill="url(#rectGrad)" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="5" filter="url(#rectShadow)"/>
    <!-- Corrugated Cardboard Texture Stripes -->
    <line x1="44" y1="36" x2="44" y2="124" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2" stroke-opacity="0.18" stroke-dasharray="8,6"/>
    <line x1="68" y1="36" x2="68" y2="124" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2" stroke-opacity="0.18" stroke-dasharray="8,6"/>
    <line x1="92" y1="36" x2="92" y2="124" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2" stroke-opacity="0.18" stroke-dasharray="8,6"/>
    <line x1="116" y1="36" x2="116" y2="124" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2" stroke-opacity="0.18" stroke-dasharray="8,6"/>
    <!-- Dorsal Mount Pad Behind Forward Eyes -->
    <circle cx="74" cy="80" r="20" fill="#0F1219" fill-opacity="0.1" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-dasharray="4,4" stroke-opacity="0.3"/>
    <!-- Cardstock Corner Rivet Grommets -->
    <circle cx="42" cy="44" r="4.5" fill="#DFD3B8" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2"/>
    <circle cx="42" cy="116" r="4.5" fill="#DFD3B8" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2"/>
    <circle cx="138" cy="44" r="4.5" fill="#DFD3B8" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2"/>
    <circle cx="138" cy="116" r="4.5" fill="#DFD3B8" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2"/>
  </svg>`;
}

export function getPentagonChassisSvg(fill = '#FFFFFF') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <radialGradient id="pentaGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
        <stop offset="60%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="#1A1D20" stop-opacity="0.25"/>
      </radialGradient>
      <filter id="pentaShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="4" stdDeviation="3.5" flood-color="#0F1219" flood-opacity="0.32"/>
      </filter>
    </defs>
    <!-- Regular 5-Vertex Paper Pentagon: Nose at +X (angle 0) -->
    <polygon points="135,80 84,24 28,45 28,115 84,136" fill="url(#pentaGrad)" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="5" stroke-linejoin="round" filter="url(#pentaShadow)"/>
    <!-- Facet Origami Crease Lines -->
    <line x1="68" y1="80" x2="135" y2="80" stroke="#FFFFFF" stroke-width="2.5" stroke-opacity="0.5"/>
    <line x1="68" y1="80" x2="84" y2="24" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.4"/>
    <line x1="68" y1="80" x2="28" y2="45" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-opacity="0.2"/>
    <line x1="68" y1="80" x2="28" y2="115" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-opacity="0.2"/>
    <line x1="68" y1="80" x2="84" y2="136" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-opacity="0.2"/>
    <!-- Dorsal Crystal Socket Ring Behind Forward Eyes -->
    <circle cx="68" cy="80" r="18" fill="#FFFFFF" fill-opacity="0.25" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-dasharray="4,4" stroke-opacity="0.35"/>
  </svg>`;
}

export function getTubeChassisSvg(fill = '#FFFFFF') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140" width="180" height="140">
    <defs>
      <linearGradient id="tubeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="${fill}"/>
        <stop offset="100%" stop-color="#1A1D20" stop-opacity="0.25"/>
      </linearGradient>
      <filter id="tubeShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="3" dy="4" stdDeviation="3.5" flood-color="#0F1219" flood-opacity="0.32"/>
      </filter>
    </defs>
    <!-- Elongated Capsule Tube -->
    <rect x="22" y="32" width="136" height="76" rx="38" ry="38" fill="url(#tubeGrad)" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="5" filter="url(#tubeShadow)"/>
    <!-- Segment Rib Bands -->
    <line x1="58" y1="34" x2="58" y2="106" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2.5" stroke-opacity="0.25"/>
    <line x1="88" y1="34" x2="88" y2="106" stroke="#FFFFFF" stroke-width="2" stroke-opacity="0.5"/>
    <line x1="118" y1="34" x2="118" y2="106" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2.5" stroke-opacity="0.25"/>
    <!-- Dorsal Spine Socket Ring Behind Eyes -->
    <circle cx="76" cy="70" r="16" fill="#0F1219" fill-opacity="0.1" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="1.8" stroke-dasharray="4,4" stroke-opacity="0.3"/>
    <!-- Front Cockpit Dome -->
    <path d="M 120 44 C 145 50, 145 90, 120 96 Z" fill="#FFFFFF" fill-opacity="0.4" stroke="${SVG_PALETTE.OUTLINE}" stroke-width="2"/>
  </svg>`;
}

export function getChassisShadowSvg(type) {
  const shapes = {
    CIRCLE: '<circle cx="80" cy="80" r="56" fill="#0F1219" fill-opacity="0.35"/>',
    TRIANGLE: '<path d="M 134 80 L 34 26 L 50 80 L 34 134 Z" fill="#0F1219" fill-opacity="0.35"/>',
    RECTANGLE: '<rect x="20" y="22" width="140" height="116" rx="28" ry="28" fill="#0F1219" fill-opacity="0.35"/>',
    PENTAGON: '<polygon points="137,80 85,22 26,44 26,116 85,138" fill="#0F1219" fill-opacity="0.35"/>',
    TUBE: '<rect x="20" y="30" width="140" height="80" rx="40" ry="40" fill="#0F1219" fill-opacity="0.35"/>',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 160" width="180" height="160">
    <filter id="blurShadow"><feGaussianBlur stdDeviation="5"/></filter>
    <g filter="url(#blurShadow)">${shapes[type] || shapes.CIRCLE}</g>
  </svg>`;
}

export function getChassisFlashSvg(type) {
  const shapes = {
    CIRCLE: '<circle cx="80" cy="80" r="56" fill="#FFFFFF"/>',
    TRIANGLE: '<path d="M 134 80 L 34 26 L 50 80 L 34 134 Z" fill="#FFFFFF"/>',
    RECTANGLE: '<rect x="20" y="22" width="140" height="116" rx="28" ry="28" fill="#FFFFFF"/>',
    PENTAGON: '<polygon points="137,80 85,22 26,44 26,116 85,138" fill="#FFFFFF"/>',
    TUBE: '<rect x="20" y="30" width="140" height="80" rx="40" ry="40" fill="#FFFFFF"/>',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 160" width="180" height="160">${shapes[type] || shapes.CIRCLE}</svg>`;
}

// -------------------------------------------------------------
// 2. INNATE MUTATIONS (16 UNIQUE WEAPONS / ORGANS)
// -------------------------------------------------------------

export function getMutationSvg(mutationId, level = 1) {
  const isL2 = level >= 2;
  const gold = SVG_PALETTE.GOLD_CROWN;
  const outline = SVG_PALETTE.OUTLINE;

  switch (mutationId) {
    case 'BIO_PINCER':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100" width="140" height="100">
        <defs>
          <filter id="pincerShad"><feDropShadow dx="2" dy="3" stdDeviation="2.5" flood-color="#0F1219" flood-opacity="0.3"/></filter>
        </defs>
        <!-- Upper Scissor Jaw -->
        <path d="M 20 50 C 45 42, 75 15, 122 28 C 95 38, 70 48, 20 50 Z" fill="${isL2 ? gold : '#FF8A5B'}" stroke="${outline}" stroke-width="${isL2 ? 4.5 : 3.5}" stroke-linejoin="round" filter="url(#pincerShad)"/>
        <!-- Lower Scissor Jaw -->
        <path d="M 20 50 C 45 58, 75 85, 122 72 C 95 62, 70 52, 20 50 Z" fill="${isL2 ? gold : '#FF8A5B'}" stroke="${outline}" stroke-width="${isL2 ? 4.5 : 3.5}" stroke-linejoin="round" filter="url(#pincerShad)"/>
        <!-- Jaw Serrations -->
        <polygon points="65,37 72,43 60,42" fill="${outline}"/>
        <polygon points="85,34 91,40 80,39" fill="${outline}"/>
        <polygon points="65,63 72,57 60,58" fill="${outline}"/>
        <polygon points="85,66 91,60 80,61" fill="${outline}"/>
        <!-- Base Socket Pivot Grommet -->
        <circle cx="20" cy="50" r="10" fill="#E2D9C5" stroke="${outline}" stroke-width="3"/>
        <circle cx="20" cy="50" r="4" fill="${outline}"/>
        ${isL2 ? `<circle cx="20" cy="50" r="2.5" fill="${gold}"/>` : ''}
      </svg>`;

    case 'ACID_SPITTER':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 100" width="140" height="100">
        <!-- Ribbed Bellows Tube Nozzle -->
        <path d="M 20 38 Q 65 32 105 36 L 105 64 Q 65 68 20 62 Z" fill="${isL2 ? gold : '#00F5D4'}" stroke="${outline}" stroke-width="3.5"/>
        <line x1="42" y1="36" x2="42" y2="64" stroke="${outline}" stroke-width="2.5"/>
        <line x1="68" y1="34" x2="68" y2="66" stroke="${outline}" stroke-width="2.5"/>
        <line x1="92" y1="35" x2="92" y2="65" stroke="${outline}" stroke-width="2.5"/>
        <!-- Bulbous Bell Nozzle -->
        <ellipse cx="106" cy="50" rx="9" ry="17" fill="#00BBF9" stroke="${outline}" stroke-width="3.5"/>
        <ellipse cx="108" cy="50" rx="4.5" ry="10" fill="${outline}"/>
        <!-- Toxic Acid Droplet -->
        <circle cx="122" cy="50" r="7" fill="#00F5D4" stroke="${outline}" stroke-width="2"/>
        <circle cx="124" cy="48" r="2" fill="#FFFFFF"/>
        <!-- Base Grommet -->
        <circle cx="20" cy="50" r="9" fill="#E2D9C5" stroke="${outline}" stroke-width="3"/>
      </svg>`;

    case 'VENOM_GLAND':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Toxic Spore Rosette Sac -->
        <circle cx="60" cy="60" r="34" fill="#DFD3B8" stroke="${outline}" stroke-width="3.5"/>
        <path d="M 60 22 C 82 22, 98 38, 98 60 C 98 82, 82 98, 60 98 C 38 98, 22 82, 22 60 C 22 38, 38 22, 60 22 Z" fill="${isL2 ? gold : '#06D6A0'}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <!-- Cluster of Dorsal Spore Pustules -->
        <circle cx="60" cy="60" r="13" fill="#00F5D4" stroke="${outline}" stroke-width="2.8"/>
        <circle cx="63" cy="57" r="4" fill="#FFFFFF"/>
        <circle cx="40" cy="46" r="7.5" fill="#00F5D4" stroke="${outline}" stroke-width="2.2"/>
        <circle cx="80" cy="46" r="7.5" fill="#00F5D4" stroke="${outline}" stroke-width="2.2"/>
        <circle cx="42" cy="76" r="7" fill="#00F5D4" stroke="${outline}" stroke-width="2.2"/>
        <circle cx="78" cy="76" r="7" fill="#00F5D4" stroke="${outline}" stroke-width="2.2"/>
      </svg>`;

    case 'CILIA_FLAGELLA':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90" width="140" height="90">
        <!-- Waving Paper Flagella Tail Fin -->
        <path d="M 15 45 Q 50 15 85 45 T 132 45 C 105 65, 60 75, 15 45 Z" fill="${isL2 ? gold : '#FFD166'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M 20 45 Q 60 25 100 45" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        ${isL2 ? `<path d="M 15 35 Q 50 5 95 30 L 70 42 Z" fill="#FFB703" stroke="${outline}" stroke-width="2.5"/>` : ''}
        <!-- Streamlines -->
        <line x1="8" y1="30" x2="28" y2="30" stroke="${outline}" stroke-width="2" stroke-linecap="round"/>
        <line x1="4" y1="60" x2="26" y2="60" stroke="${outline}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

    case 'MANTIS_SCYTHE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 110" width="150" height="110">
        <!-- Folding Scythe Arm Bracket -->
        <path d="M 18 65 L 45 42 L 68 55" stroke="${outline}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <!-- Long Serrated Sickle Blade -->
        <path d="M 68 55 C 80 20, 115 12, 142 22 C 118 42, 92 68, 68 55 Z" fill="${isL2 ? gold : '#52B788'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Serrated Razor Teeth -->
        <polygon points="92,30 98,38 90,36" fill="${outline}"/>
        <polygon points="110,26 116,34 108,32" fill="${outline}"/>
        <polygon points="128,24 133,32 125,29" fill="${outline}"/>
        <!-- Critical Razor Edge Line -->
        <path d="M 72 52 C 90 26, 120 18, 140 22" stroke="#FFFFFF" stroke-width="2" fill="none"/>
      </svg>`;

    case 'SPIRAL_DRILL':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90" width="140" height="90">
        <!-- Conical Auger Body -->
        <path d="M 20 28 L 128 45 L 20 62 Z" fill="${isL2 ? gold : '#F77F00'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Helical Spiral Grooves -->
        <path d="M 38 29 Q 55 45 38 61" stroke="${outline}" stroke-width="3.5" fill="none"/>
        <path d="M 64 33 Q 80 45 64 57" stroke="${outline}" stroke-width="3.5" fill="none"/>
        <path d="M 90 38 Q 102 45 90 52" stroke="${outline}" stroke-width="3.5" fill="none"/>
        <!-- High-Speed Drill Tip -->
        <polygon points="128,45 116,40 116,50" fill="#FFFFFF" stroke="${outline}" stroke-width="2"/>
        <circle cx="20" cy="45" r="9" fill="#E2D9C5" stroke="${outline}" stroke-width="3"/>
      </svg>`;

    case 'BONE_SPEAR':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <!-- Elongated Ivory Bone Spear Lance -->
        <path d="M 15 40 L 115 40" stroke="#B8A88A" stroke-width="7" stroke-linecap="round"/>
        <path d="M 15 40 L 115 40" stroke="#E9D8A6" stroke-width="4" stroke-linecap="round"/>
        <!-- Barbed Spearhead Lance Tip -->
        <path d="M 110 26 L 152 40 L 110 54 L 120 40 Z" fill="${isL2 ? gold : '#FFFDF9'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <line x1="120" y1="40" x2="150" y2="40" stroke="${outline}" stroke-width="2"/>
        <!-- Binding Wraps -->
        <rect x="52" y="35" width="14" height="10" rx="2" fill="#D62828" stroke="${outline}" stroke-width="1.5"/>
        <rect x="78" y="35" width="14" height="10" rx="2" fill="#D62828" stroke="${outline}" stroke-width="1.5"/>
      </svg>`;

    case 'QUILL_VOLLEY':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90" width="140" height="90">
        <!-- 3 Fanned Sharp Feather Quills -->
        <g transform="rotate(-15 20 45)">
          <path d="M 20 45 C 55 35, 95 38, 126 40 C 95 48, 55 48, 20 45 Z" fill="${isL2 ? gold : '#EE9B00'}" stroke="${outline}" stroke-width="2.5"/>
          <line x1="20" y1="45" x2="124" y2="40" stroke="#FFFFFF" stroke-width="1.5"/>
        </g>
        <g transform="rotate(0 20 45)">
          <path d="M 20 45 C 55 35, 95 38, 134 45 C 95 52, 55 55, 20 45 Z" fill="${isL2 ? gold : '#EE9B00'}" stroke="${outline}" stroke-width="3"/>
          <line x1="20" y1="45" x2="132" y2="45" stroke="#FFFFFF" stroke-width="1.8"/>
        </g>
        <g transform="rotate(15 20 45)">
          <path d="M 20 45 C 55 42, 95 42, 126 50 C 95 52, 55 55, 20 45 Z" fill="${isL2 ? gold : '#EE9B00'}" stroke="${outline}" stroke-width="2.5"/>
          <line x1="20" y1="45" x2="124" y2="50" stroke="#FFFFFF" stroke-width="1.5"/>
        </g>
      </svg>`;

    case 'PLASMA_SIPHON':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90" width="140" height="90">
        <!-- High-Energy Plasma Siphon Nozzle -->
        <path d="M 18 32 L 85 36 L 95 24 L 115 24 L 105 45 L 115 66 L 95 66 L 85 54 L 18 58 Z" fill="${isL2 ? gold : '#48CAE4'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Glowing Core Coil -->
        <rect x="36" y="39" width="36" height="12" rx="3" fill="#FFFFFF" stroke="${outline}" stroke-width="2"/>
        <line x1="45" y1="39" x2="45" y2="51" stroke="#0077B6" stroke-width="2"/>
        <line x1="55" y1="39" x2="55" y2="51" stroke="#0077B6" stroke-width="2"/>
        <line x1="65" y1="39" x2="65" y2="51" stroke="#0077B6" stroke-width="2"/>
        <!-- Beam Focus Rings -->
        <ellipse cx="118" cy="45" rx="5" ry="14" fill="#90E0EF" stroke="${outline}" stroke-width="2.5"/>
      </svg>`;

    case 'SPORE_HOMER':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Seeking Spore Launcher Pod -->
        <path d="M 30 60 C 20 30, 80 18, 96 48 C 112 78, 70 105, 42 90 C 26 80, 26 70, 30 60 Z" fill="${isL2 ? gold : '#9B5DE5'}" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <!-- Seeking Tracker Eye -->
        <circle cx="70" cy="55" r="14" fill="#FFFDF9" stroke="${outline}" stroke-width="3"/>
        <circle cx="74" cy="55" r="6" fill="#D62828"/>
        <circle cx="76" cy="53" r="2.5" fill="#FFFFFF"/>
        <!-- Organic Antennae -->
        <path d="M 88 40 Q 106 20 114 26" stroke="${outline}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <circle cx="114" cy="26" r="4.5" fill="#00F5D4" stroke="${outline}" stroke-width="2"/>
      </svg>`;

    case 'HORNET_NEST':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Hexagonal Paper Wasp Comb -->
        <polygon points="60,20 95,40 95,80 60,100 25,80 25,40" fill="${isL2 ? gold : '#FFB703'}" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <!-- Comb Cells -->
        <polygon points="60,38 75,47 75,65 60,74 45,65 45,47" fill="#FB8500" stroke="${outline}" stroke-width="2.5"/>
        <circle cx="60" cy="56" r="5" fill="${outline}"/>
        <!-- Mini Paper Hornet Stinger -->
        <path d="M 88 78 L 108 88 L 94 96 Z" fill="#023047" stroke="${outline}" stroke-width="2"/>
      </svg>`;

    case 'SHOCK_PULSAR':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Tesla Coil Dome -->
        <circle cx="60" cy="60" r="36" fill="#023E8A" fill-opacity="0.35" stroke="${isL2 ? gold : '#00F5D4'}" stroke-width="5"/>
        <circle cx="60" cy="60" r="36" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-dasharray="7,5"/>
        <circle cx="60" cy="60" r="22" fill="#023E8A" stroke="${outline}" stroke-width="3.5"/>
        <circle cx="60" cy="60" r="11" fill="${isL2 ? gold : '#00F5D4'}" stroke="#FFFFFF" stroke-width="2.5"/>
        <!-- Radial Electric Arcs -->
        <path d="M 60 16 L 66 32 L 56 36 L 60 48" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 104 60 L 88 66 L 84 56 L 72 60" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 60 104 L 54 88 L 64 84 L 60 72" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 16 60 L 32 54 L 36 64 L 48 60" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
      </svg>`;

    case 'FROST_AURA':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Origami Cryo Rosette -->
        <circle cx="60" cy="60" r="34" fill="#CAF0F8" fill-opacity="0.55" stroke="${outline}" stroke-width="3.5"/>
        <g stroke="${isL2 ? gold : '#48CAE4'}" stroke-width="5" stroke-linecap="round">
          <line x1="60" y1="16" x2="60" y2="104"/>
          <line x1="16" y1="60" x2="104" y2="60"/>
          <line x1="28" y1="28" x2="92" y2="92"/>
          <line x1="28" y1="92" x2="92" y2="28"/>
        </g>
        <polygon points="60,36 74,46 74,74 60,84 46,74 46,46" fill="#90E0EF" stroke="${outline}" stroke-width="3"/>
        <circle cx="60" cy="60" r="9" fill="#FFFFFF" stroke="${outline}" stroke-width="2.5"/>
      </svg>`;

    case 'CHITIN_CARAPACE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Layered Chitin Beetle Armor Plates -->
        <path d="M 28 60 C 28 30, 92 30, 92 60 C 92 90, 28 90, 28 60 Z" fill="${isL2 ? gold : '#6C757D'}" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round"/>
        <path d="M 38 60 C 38 40, 82 40, 82 60 C 82 80, 38 80, 38 60 Z" fill="#495057" stroke="${outline}" stroke-width="3"/>
        <line x1="60" y1="34" x2="60" y2="86" stroke="#ADB5BD" stroke-width="3"/>
        <!-- Reinforced Spikes -->
        <polygon points="28,45 14,40 25,55" fill="${outline}"/>
        <polygon points="28,75 14,80 25,65" fill="${outline}"/>
        <polygon points="92,45 106,40 95,55" fill="${outline}"/>
        <polygon points="92,75 106,80 95,65" fill="${outline}"/>
      </svg>`;

    case 'SPRING_TENDON':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 90" width="130" height="90">
        <!-- Coiled Steel Spring Leaf Tendon -->
        <path d="M 16 45 C 32 20, 48 70, 64 45 C 80 20, 96 70, 112 45" stroke="${isL2 ? gold : '#FF758F'}" stroke-width="7" stroke-linecap="round" fill="none"/>
        <path d="M 16 45 C 32 20, 48 70, 64 45 C 80 20, 96 70, 112 45" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none"/>
        <!-- Mounting Bracket Foot -->
        <rect x="108" y="32" width="14" height="26" rx="4" fill="#C9184A" stroke="${outline}" stroke-width="3"/>
        <circle cx="16" cy="45" r="8" fill="#E2D9C5" stroke="${outline}" stroke-width="3"/>
      </svg>`;

    case 'REGEN_BLADDER':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Restorative Vascular Sac -->
        <circle cx="60" cy="60" r="34" fill="#DFD3B8" stroke="${outline}" stroke-width="3.5"/>
        <circle cx="60" cy="60" r="28" fill="${isL2 ? gold : '#57CC99'}" stroke="${outline}" stroke-width="4"/>
        <!-- Medical Aid Vitality Cross -->
        <rect x="53" y="42" width="14" height="36" rx="4" fill="#FFFFFF" stroke="${outline}" stroke-width="2.5"/>
        <rect x="42" y="53" width="36" height="14" rx="4" fill="#FFFFFF" stroke="${outline}" stroke-width="2.5"/>
        <circle cx="44" cy="44" r="3.5" fill="#80ED99"/>
        <circle cx="76" cy="44" r="3.5" fill="#80ED99"/>
      </svg>`;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="30" fill="${gold}" stroke="${outline}" stroke-width="4"/>
      </svg>`;
  }
}

// -------------------------------------------------------------
// 3. SUPPLY DROPS, VIRUS & PARASITES SVG
// -------------------------------------------------------------

export function getSupplyMutagenSvg(mutagenId) {
  const outline = SVG_PALETTE.OUTLINE;

  switch (mutagenId) {
    case 'GIGANTISM_VIRUS':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <defs><filter id="gigShad"><feDropShadow dx="3" dy="4" stdDeviation="3" flood-color="#0F1219" flood-opacity="0.35"/></filter></defs>
        <!-- Spiky Virus Capsid Core -->
        <polygon points="65,16 88,40 114,40 104,65 118,90 92,94 80,118 65,102 45,116 38,92 12,86 24,65 14,40 40,40" fill="#FF595E" stroke="${outline}" stroke-width="4" stroke-linejoin="round" filter="url(#gigShad)"/>
        <circle cx="65" cy="65" r="22" fill="#800F2F" stroke="${outline}" stroke-width="3"/>
        <text x="65" y="73" font-family="Fredoka, sans-serif" font-size="24" font-weight="700" fill="#FFFFFF" text-anchor="middle">G</text>
      </svg>`;

    case 'HYPER_SPEED_MUTAGEN':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <!-- Streamlined Lightning Speed Capsule -->
        <polygon points="75,15 35,70 65,70 50,115 100,55 70,55" fill="#FFCA3A" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round"/>
        <line x1="20" y1="40" x2="45" y2="40" stroke="#FF595E" stroke-width="3.5" stroke-linecap="round"/>
        <line x1="12" y1="70" x2="32" y2="70" stroke="#FF595E" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`;

    case 'SPIKY_CARAPACE':
    case 'VIRUS_SPIKY_RING':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
        <!-- Rotating Outer Ring of Thorn Spikes -->
        <path d="M 80 18 L 88 38 L 105 24 L 102 45 L 124 38 L 114 58 L 138 58 L 122 74 L 144 80 L 122 86 L 138 102 L 114 102 L 124 122 L 102 115 L 105 136 L 88 122 L 80 142 L 72 122 L 55 136 L 58 115 L 36 122 L 46 102 L 22 102 L 38 86 L 16 80 L 38 74 L 22 58 L 46 58 L 36 38 L 58 45 L 55 24 L 72 38 Z" fill="#FB5607" stroke="${outline}" stroke-width="3.5" stroke-linejoin="round"/>
        <circle cx="80" cy="80" r="42" fill="none" stroke="${outline}" stroke-width="3.5" stroke-dasharray="6,4"/>
      </svg>`;

    case 'LEECH_MAW':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Bioluminescent Lamprey Maw -->
        <circle cx="60" cy="60" r="36" fill="#9B5DE5" stroke="${outline}" stroke-width="4.5"/>
        <circle cx="60" cy="60" r="24" fill="#5A189A" stroke="${outline}" stroke-width="3"/>
        <circle cx="60" cy="60" r="12" fill="#1A1D20"/>
        <!-- Ring of Inward Curved Needles -->
        <polygon points="60,26 64,36 56,36" fill="#FFFFFF"/>
        <polygon points="60,94 64,84 56,84" fill="#FFFFFF"/>
        <polygon points="26,60 36,64 36,56" fill="#FFFFFF"/>
        <polygon points="94,60 84,64 84,56" fill="#FFFFFF"/>
        <polygon points="36,36 45,42 40,47" fill="#FFFFFF"/>
        <polygon points="84,84 75,78 80,73" fill="#FFFFFF"/>
        <polygon points="36,84 45,78 40,73" fill="#FFFFFF"/>
        <polygon points="84,36 75,42 80,47" fill="#FFFFFF"/>
      </svg>`;

    case 'BOMBARDIER_SAC':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Volatile Round Chemical Bomb Sac -->
        <circle cx="56" cy="64" r="38" fill="#D90429" stroke="${outline}" stroke-width="4.5"/>
        <circle cx="44" cy="52" r="10" fill="#FFFFFF" fill-opacity="0.35"/>
        <!-- Bomb Neck & Smoking Spark Fuse -->
        <rect x="74" y="32" width="16" height="16" rx="3" fill="#3D348B" stroke="${outline}" stroke-width="3" transform="rotate(35 82 40)"/>
        <path d="M 90 28 Q 106 18 108 8" stroke="${outline}" stroke-width="3.5" fill="none"/>
        <polygon points="108,8 116,0 120,10 110,14" fill="#FFD166" stroke="${outline}" stroke-width="1.5"/>
      </svg>`;

    case 'SHADOW_CHAMELEON':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Stealth Chameleon Turret Eye -->
        <circle cx="60" cy="60" r="35" fill="#7209B7" stroke="${outline}" stroke-width="4.5"/>
        <circle cx="60" cy="60" r="22" fill="#3A0CA3" stroke="${outline}" stroke-width="3"/>
        <!-- Slit Reptilian Pupil -->
        <ellipse cx="64" cy="60" rx="14" ry="5" fill="#4CC9F0" stroke="${outline}" stroke-width="2.2"/>
        <circle cx="68" cy="58" r="2.8" fill="#FFFFFF"/>
      </svg>`;

    case 'BERSERKER_STRAIN':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <!-- Crimson Rage Spiked Bio-Capsid -->
        <polygon points="65,12 82,36 112,26 98,54 122,68 96,82 108,110 78,98 65,120 52,98 22,110 34,82 8,68 32,54 18,26 48,36" fill="#EF476F" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="65" cy="65" r="22" fill="#590D22" stroke="${outline}" stroke-width="3"/>
        <path d="M 52 58 L 62 66 M 78 58 L 68 66" stroke="#FFD166" stroke-width="3.5" stroke-linecap="round"/>
        <polygon points="56,74 65,82 74,74" fill="#FFFFFF"/>
      </svg>`;

    case 'MITOSIS_STRAIN':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <!-- Dividing Twin Cellular Mitosis Pods -->
        <path d="M 42 36 C 60 36, 70 46, 88 36 C 110 36, 114 94, 88 94 C 70 84, 60 94, 42 94 C 16 94, 20 36, 42 36 Z" fill="#06D6A0" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round"/>
        <circle cx="44" cy="65" r="14" fill="#073B4C" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="86" cy="65" r="14" fill="#073B4C" stroke="#FFFFFF" stroke-width="2.5"/>
        <line x1="58" y1="65" x2="72" y2="65" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="3,3"/>
      </svg>`;

    case 'FERRO_CHITIN_STRAIN':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <!-- Hexagonal Ferro-Magnetic Alloy Shield Capsid -->
        <polygon points="65,16 110,40 110,90 65,114 20,90 20,40" fill="#4EA8DE" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round"/>
        <polygon points="65,32 94,48 94,82 65,98 36,82 36,48" fill="#1D3557" stroke="#FFFFFF" stroke-width="2.5"/>
        <circle cx="65" cy="65" r="10" fill="#A8DADC" stroke="${outline}" stroke-width="2.5"/>
      </svg>`;

    case 'NEURO_OVERCLOCK_VIRUS':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <!-- Hyper-Synapse Golden Overclock Star -->
        <circle cx="65" cy="65" r="34" fill="#FFD166" stroke="${outline}" stroke-width="4.5"/>
        <g stroke="${outline}" stroke-width="4" stroke-linecap="round">
          <line x1="65" y1="12" x2="65" y2="30"/>
          <line x1="65" y1="100" x2="65" y2="118"/>
          <line x1="12" y1="65" x2="30" y2="65"/>
          <line x1="100" y1="65" x2="118" y2="65"/>
        </g>
        <polygon points="70,40 50,67 66,67 58,92 82,62 66,62" fill="#FB5607" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>
      </svg>`;

    case 'TOXIC_SPORE_STRAIN':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 130" width="130" height="130">
        <!-- Bio-Hazard Radioactive Spore Ring -->
        <circle cx="65" cy="65" r="38" fill="#70E000" stroke="${outline}" stroke-width="4.5"/>
        <circle cx="65" cy="44" r="12" fill="#1A1D20"/>
        <circle cx="47" cy="76" r="12" fill="#1A1D20"/>
        <circle cx="83" cy="76" r="12" fill="#1A1D20"/>
        <circle cx="65" cy="65" r="9" fill="#CCFF33" stroke="${outline}" stroke-width="3"/>
      </svg>`;

    case 'TESLA_BARNACLE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <!-- Dorsal Top-Mounted Electric Barnacle Symbiont -->
        <polygon points="60,18 96,38 102,78 72,102 48,102 18,78 24,38" fill="#5A189A" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round"/>
        <circle cx="60" cy="62" r="22" fill="#00BBF9" stroke="${outline}" stroke-width="3.5"/>
        <circle cx="60" cy="62" r="10" fill="#FFFFFF" stroke="${outline}" stroke-width="2.5"/>
        <path d="M 60 20 L 54 36 L 66 40" stroke="#FFD166" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 24 72 L 40 66 L 36 78" stroke="#FFD166" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M 96 72 L 80 66 L 84 78" stroke="#FFD166" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>`;

    case 'REAPER_TENDRIL':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 105" width="150" height="105">
        <!-- Front-Mounted Predatory Symbiont Scythe Blade -->
        <path d="M 18 56 C 45 34, 85 12, 138 24 C 118 46, 98 62, 62 66 C 42 68, 28 64, 18 56 Z" fill="#F15BB5" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M 62 46 C 86 28, 112 24, 134 26" stroke="#00F5D4" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <!-- Symbiont Eye Node at Base -->
        <circle cx="34" cy="54" r="11" fill="#7209B7" stroke="${outline}" stroke-width="3"/>
        <circle cx="36" cy="54" r="4.5" fill="#FFD166"/>
      </svg>`;

    case 'SPORE_CANNON_POD':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 135 100" width="135" height="100">
        <!-- Flank-Mounted Symbiotic Twin Fungal Mortar Pod -->
        <path d="M 18 30 Q 65 18 106 32 L 106 68 Q 65 82 18 70 Z" fill="#7209B7" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="52" cy="50" r="12" fill="#80ED99" stroke="${outline}" stroke-width="2.5"/>
        <circle cx="80" cy="50" r="10" fill="#80ED99" stroke="${outline}" stroke-width="2.5"/>
        <ellipse cx="108" cy="39" rx="7" ry="10" fill="#80ED99" stroke="${outline}" stroke-width="3"/>
        <ellipse cx="108" cy="61" rx="7" ry="10" fill="#80ED99" stroke="${outline}" stroke-width="3"/>
      </svg>`;

    case 'ABYSSAL_JAW':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 105" width="145" height="105">
        <!-- Front-Mounted Deep-Sea Angler Maw + Bioluminescent Lure -->
        <path d="M 18 52 C 46 22, 92 18, 128 36 L 94 50 L 128 68 C 92 86, 46 82, 18 52 Z" fill="#5A189A" stroke="${outline}" stroke-width="4" stroke-linejoin="round"/>
        <!-- Jagged Fang Teeth -->
        <polygon points="82,32 88,43 76,40" fill="#FFFDF9" stroke="${outline}" stroke-width="1.5"/>
        <polygon points="104,34 108,45 96,42" fill="#FFFDF9" stroke="${outline}" stroke-width="1.5"/>
        <polygon points="82,72 88,61 76,64" fill="#FFFDF9" stroke="${outline}" stroke-width="1.5"/>
        <polygon points="104,70 108,59 96,62" fill="#FFFDF9" stroke="${outline}" stroke-width="1.5"/>
        <!-- Glowing Angler Lure -->
        <path d="M 38 34 Q 72 6 116 14" stroke="${outline}" stroke-width="3" fill="none"/>
        <circle cx="120" cy="15" r="7.5" fill="#00F5D4" stroke="${outline}" stroke-width="2.5"/>
      </svg>`;

    case 'CRYO_SPINE_SYMBIONT':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 96" width="140" height="96">
        <!-- Flank-Mounted Glacial Ice-Quill Symbiont -->
        <polygon points="16,48 44,24 98,32 132,26 108,48 132,70 98,64 44,72" fill="#90E0EF" stroke="${outline}" stroke-width="3.8" stroke-linejoin="round"/>
        <polygon points="32,48 64,36 120,48 64,60" fill="#00B4D8" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="34" cy="48" r="8" fill="#7209B7" stroke="${outline}" stroke-width="2.5"/>
      </svg>`;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="30" fill="#9B5DE5"/></svg>`;
  }
}

// -------------------------------------------------------------
// 4. PROJECTILES, CRATES, EYES & PARACHUTES
// -------------------------------------------------------------

export function getProjectilesAndPropsSvg(key) {
  const outline = SVG_PALETTE.OUTLINE;

  switch (key) {
    case 'EYE_SCLERA':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
        <circle cx="18" cy="18" r="14" fill="#FFFDF9" stroke="${outline}" stroke-width="4.5"/>
      </svg>`;

    case 'EYE_PUPIL':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="8.5" fill="${outline}"/>
        <circle cx="15" cy="9" r="3.2" fill="#FFFFFF"/>
      </svg>`;

    case 'PROJ_ACID_GLOB':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
        <path d="M 30 10 C 45 10, 52 25, 48 40 C 44 55, 16 55, 12 40 C 8 25, 15 10, 30 10 Z" fill="#00F5D4" stroke="${outline}" stroke-width="3"/>
        <circle cx="24" cy="24" r="4.5" fill="#FFFFFF"/>
      </svg>`;

    case 'PROJ_BOMB_SAC':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" width="70" height="70">
        <circle cx="35" cy="40" r="22" fill="#D90429" stroke="${outline}" stroke-width="3.5"/>
        <rect x="42" y="18" width="10" height="10" rx="2" fill="#1A1D20" transform="rotate(30 47 23)"/>
        <path d="M 50 16 Q 60 10 64 4" stroke="#FFD166" stroke-width="2.5" fill="none"/>
      </svg>`;

    case 'PROJ_QUILL':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 30" width="80" height="30">
        <path d="M 4 15 L 68 8 L 78 15 L 68 22 Z" fill="#EE9B00" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="8" y1="15" x2="76" y2="15" stroke="#FFFFFF" stroke-width="2"/>
        <polygon points="12,10 24,15 12,20" fill="#AE2012"/>
      </svg>`;

    case 'PROJ_HOMING_SPORE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
        <circle cx="30" cy="30" r="18" fill="#9B5DE5" stroke="${outline}" stroke-width="3"/>
        <circle cx="30" cy="30" r="8" fill="#FF5400" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="32" cy="28" r="3" fill="#FFFFFF"/>
        <!-- Trail Tendrils -->
        <path d="M 14 30 Q 6 36 2 40" stroke="#9B5DE5" stroke-width="3" fill="none"/>
        <path d="M 14 26 Q 6 20 2 16" stroke="#9B5DE5" stroke-width="3" fill="none"/>
      </svg>`;

    case 'PROJ_HORNET':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
        <!-- Origami Wasp Wings -->
        <ellipse cx="24" cy="18" rx="14" ry="7" transform="rotate(-30 24 18)" fill="#E0AAFF" fill-opacity="0.8" stroke="${outline}" stroke-width="1.8"/>
        <ellipse cx="24" cy="42" rx="14" ry="7" transform="rotate(30 24 42)" fill="#E0AAFF" fill-opacity="0.8" stroke="${outline}" stroke-width="1.8"/>
        <!-- Striped Abdomen -->
        <ellipse cx="34" cy="30" rx="16" ry="10" fill="#FFB703" stroke="${outline}" stroke-width="2.5"/>
        <line x1="28" y1="21" x2="28" y2="39" stroke="${outline}" stroke-width="2.5"/>
        <line x1="36" y1="20" x2="36" y2="40" stroke="${outline}" stroke-width="2.5"/>
        <!-- Needle Stinger -->
        <polygon points="50,30 58,28 58,32" fill="${outline}"/>
      </svg>`;

    case 'SUPPLY_CRATE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <!-- Isometric Cardboard Crate -->
        <rect x="14" y="14" width="72" height="72" rx="10" fill="#E0A96D" stroke="${outline}" stroke-width="4.5"/>
        <!-- Wood Paneling Cross Bracing -->
        <line x1="18" y1="18" x2="82" y2="82" stroke="#7F5539" stroke-width="3.5"/>
        <line x1="82" y1="18" x2="18" y2="82" stroke="#7F5539" stroke-width="3.5"/>
        <rect x="22" y="22" width="56" height="56" rx="6" fill="none" stroke="${outline}" stroke-width="3"/>
        <!-- Stencil Star -->
        <polygon points="50,34 54,44 65,44 56,52 60,62 50,56 40,62 44,52 35,44 46,44" fill="#FFD166" stroke="${outline}" stroke-width="1.5"/>
      </svg>`;

    case 'SUPPLY_PARACHUTE':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 140" width="180" height="140">
        <!-- Alternating Red and White Parachute Dome -->
        <path d="M 15 80 C 15 15, 165 15, 165 80 C 145 74, 125 76, 105 80 C 85 76, 65 74, 45 80 C 35 78, 25 78, 15 80 Z" fill="#FF4D6D" stroke="${outline}" stroke-width="4.5" stroke-linejoin="round"/>
        <!-- Canopy Stripes -->
        <path d="M 55 24 C 65 50, 65 74, 55 78" stroke="${outline}" stroke-width="3.5" fill="none"/>
        <path d="M 90 16 C 90 48, 90 74, 90 80" stroke="#FFFFFF" stroke-width="4" fill="none"/>
        <path d="M 125 24 C 115 50, 115 74, 125 78" stroke="${outline}" stroke-width="3.5" fill="none"/>
        <!-- Suspension Shroud Lines -->
        <line x1="18" y1="80" x2="90" y2="135" stroke="${outline}" stroke-width="2.5"/>
        <line x1="55" y1="78" x2="90" y2="135" stroke="${outline}" stroke-width="2.5"/>
        <line x1="90" y1="80" x2="90" y2="135" stroke="${outline}" stroke-width="2.5"/>
        <line x1="125" y1="78" x2="90" y2="135" stroke="${outline}" stroke-width="2.5"/>
        <line x1="162" y1="80" x2="90" y2="135" stroke="${outline}" stroke-width="2.5"/>
      </svg>`;

    case 'SOCKET_GROMMET':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="16" fill="#DFD3B8" stroke="${outline}" stroke-width="3"/>
        <circle cx="20" cy="20" r="8" fill="#1A1D20"/>
        <circle cx="20" cy="20" r="4" fill="#0F1219"/>
      </svg>`;

    case 'PAPER_CONFETTI':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="30" height="30">
        <polygon points="6,4 26,8 22,26 4,20" fill="#FFFFFF" stroke="${outline}" stroke-width="2" stroke-linejoin="round"/>
      </svg>`;

    case 'PAPER_DUST':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="9" fill="#FFF8F0" fill-opacity="0.8"/>
      </svg>`;

    case 'ARENA_FLOOR_BOARD':
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <defs>
          <radialGradient id="arenaParchment" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FCF8ED"/>
            <stop offset="70%" stop-color="#F4ECD8"/>
            <stop offset="95%" stop-color="#E5D9BE"/>
            <stop offset="100%" stop-color="#B08968"/>
          </radialGradient>
        </defs>
        <!-- Wooden Outer Circular Frame -->
        <circle cx="512" cy="512" r="500" fill="#7F5539" stroke="${outline}" stroke-width="12"/>
        <circle cx="512" cy="512" r="482" fill="#B08968" stroke="${outline}" stroke-width="6"/>
        <!-- Parchment Arena Battleground -->
        <circle cx="512" cy="512" r="475" fill="url(#arenaParchment)" stroke="${outline}" stroke-width="8"/>
        <!-- Concentric Engraved Millimeter Blueprint Rings -->
        <circle cx="512" cy="512" r="390" fill="none" stroke="#DFD3B8" stroke-width="5" stroke-dasharray="14,10"/>
        <circle cx="512" cy="512" r="300" fill="none" stroke="#DFD3B8" stroke-width="4"/>
        <circle cx="512" cy="512" r="215" fill="none" stroke="#DFD3B8" stroke-width="5" stroke-dasharray="10,8"/>
        <circle cx="512" cy="512" r="110" fill="none" stroke="#DFD3B8" stroke-width="3"/>
        <!-- Blueprint Compass Tick Marks -->
        <line x1="512" y1="37" x2="512" y2="987" stroke="#DFD3B8" stroke-width="2.5" stroke-dasharray="8,12" stroke-opacity="0.6"/>
        <line x1="37" y1="512" x2="987" y2="512" stroke="#DFD3B8" stroke-width="2.5" stroke-dasharray="8,12" stroke-opacity="0.6"/>
        <!-- Center Origin Rosette -->
        <circle cx="512" cy="512" r="14" fill="#DFD3B8" stroke="${outline}" stroke-width="3"/>
        <circle cx="512" cy="512" r="5" fill="${outline}"/>
      </svg>`;

    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="15" fill="#FFFFFF"/></svg>`;
  }
}
