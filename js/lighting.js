/* =====================================================================
   Lighting-state system — four-step cycle on the lamp:
   day → dusk → night → dusk → day. Dusk appears twice (evening and
   morning) but shares one visual theme; we track position in CYCLE.
   ===================================================================== */
const LIGHTING_KEY = 'bloomroom-lighting';
const INDEX_KEY = 'bloomroom-lighting-index';
const CYCLE = [
  { theme: 'day',   label: 'Dim the lights to a calm dusk' },
  { theme: 'dusk',  label: 'Turn on the lamp for night mode' },
  { theme: 'night', label: 'Dim the lights back to a calm dusk' },
  { theme: 'dusk',  label: 'Brighten the room to daytime' },
];

const lampBtn = document.getElementById('lampBtn');

function themeToIndex(theme) {
  if (theme === 'day') return 0;
  if (theme === 'night') return 2;
  return 1; // dusk: default to evening position (after day)
}

function currentIndex() {
  try {
    const stored = localStorage.getItem(INDEX_KEY);
    if (stored !== null) {
      const i = parseInt(stored, 10);
      if (i >= 0 && i < CYCLE.length) return i;
    }
  } catch (e) {}
  const t = document.documentElement.dataset.theme;
  return ['day', 'dusk', 'night'].includes(t) ? themeToIndex(t) : 1;
}

function setLightingIndex(i) {
  const { theme } = CYCLE[i];
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(LIGHTING_KEY, theme);
    localStorage.setItem(INDEX_KEY, String(i));
  } catch (e) {}
  syncLampA11y(i);
}

function syncLampA11y(i) {
  // Label describes what the *next* press does — the effect, not
  // "toggle theme".
  lampBtn.setAttribute('aria-label', CYCLE[i].label);
}

lampBtn.addEventListener('click', () => {
  setLightingIndex((currentIndex() + 1) % CYCLE.length);
});

// Migrate legacy theme-only storage to a cycle index.
try {
  if (localStorage.getItem(INDEX_KEY) === null) {
    localStorage.setItem(INDEX_KEY, String(currentIndex()));
  }
} catch (e) {}
syncLampA11y(currentIndex());

/* =====================================================================
   Dust motes — spawned only inside the mote zone (the main beam's
   footprint), so every mote lives inside the light.
   ===================================================================== */
const moteZone = document.getElementById('moteZone');

function spawnMotes(count) {
  for (let i = 0; i < count; i++) {
    const mote = document.createElement('div');
    mote.className = 'mote';
    const size = 2 + Math.random() * 2.5;
    const x = 4 + Math.random() * 92;             // % across the beam
    const y = Math.random() * 80;                 // % along the beam
    const dx = (Math.random() - 0.5) * 30;        // gentle sideways waft
    const dy = 60 + Math.random() * 120;          // drift along the beam
    const duration = 10 + Math.random() * 14;
    mote.style.width = size + 'px';
    mote.style.height = size + 'px';
    mote.style.left = x + '%';
    mote.style.top = y + '%';
    mote.style.setProperty('--dx', dx + 'px');
    mote.style.setProperty('--dy', dy + 'px');
    mote.style.animationDuration = duration + 's';
    mote.style.animationDelay = (Math.random() * -duration) + 's';
    moteZone.appendChild(mote);
  }
}
spawnMotes(72);

/* =====================================================================
   Night motes — warm specks near the lamp and fairy lights. Sits in its
   own layer (not inside screen-blended .night-glow) so the particles
   stay visible against the dark room.
   ===================================================================== */
const nightMoteZone = document.getElementById('nightMoteZone');

const NIGHT_MOTE_CLUSTERS = [
  { count: 18, left: 68, top: 28, width: 22, height: 32, drift: 'lamp' },   /* desk lamp */
  { count: 20, left: 6,  top: 2,  width: 48, height: 16, drift: 'fairy' }, /* fairy string */
  { count: 6,  left: 86, top: 0,  width: 10, height: 10, drift: 'fairy' }, /* string end */
];

function nightMoteDrift(cluster) {
  if (cluster.drift === 'fairy') {
  /* along the top string — drift down/sideways so motes don't exit upward */
    return {
      dx: (Math.random() - 0.5) * 22,
      dy: 10 + Math.random() * 28,
    };
  }
  /* lamp cone — lazy upward float in the warm pool */
  return {
    dx: (Math.random() - 0.5) * 24,
    dy: -(8 + Math.random() * 22),
  };
}

function spawnNightMotes() {
  if (!nightMoteZone) return;
  NIGHT_MOTE_CLUSTERS.forEach((cluster) => {
    for (let i = 0; i < cluster.count; i++) {
      const mote = document.createElement('div');
      mote.className = 'mote mote-night';
      const size = 2.5 + Math.random() * 3;
      const x = cluster.left + Math.random() * cluster.width;
      const y = cluster.top + Math.random() * cluster.height;
      const { dx, dy } = nightMoteDrift(cluster);
      const duration = 10 + Math.random() * 14;
      mote.style.width = size + 'px';
      mote.style.height = size + 'px';
      mote.style.left = x + '%';
      mote.style.top = y + '%';
      mote.style.setProperty('--dx', dx + 'px');
      mote.style.setProperty('--dy', dy + 'px');
      mote.style.animationDuration = duration + 's';
      mote.style.animationDelay = (Math.random() * -duration) + 's';
      nightMoteZone.appendChild(mote);
    }
  });
}
spawnNightMotes();

/* Pause/resume, doubling as a reduced-motion stand-in. */
const scene = document.getElementById('scene');
const toggleBtn = document.getElementById('toggleBtn');
let paused = false;
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    paused = !paused;
    scene.classList.toggle('no-motion', paused);
    toggleBtn.textContent = paused ? 'Resume ambient motion' : 'Pause ambient motion';
  });
}

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  scene.classList.add('no-motion');
  if (toggleBtn) toggleBtn.textContent = 'Resume ambient motion';
  paused = true;
}
