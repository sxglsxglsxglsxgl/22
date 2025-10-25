// стабильные vh
function setVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setVH();
window.addEventListener('resize', setVH, { passive: true });

// утилиты
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// DOM
const panels = Array.from(document.querySelectorAll('.panel'));
const images = panels.map(p => p.querySelector('.bg'));
const scrims = panels.map(p => p.querySelector('.scrim'));
const copies = panels.map(p => p.querySelector('.copy'));

let rects = [];
function measure() {
  rects = panels.map(p => {
    const r = p.getBoundingClientRect();
    const top = window.scrollY + r.top;
    const height = p.offsetHeight;
    return { top, height };
  });
}
measure();

// настройки из CSS custom properties
let SCRIM_MAX;
let IMAGE_SHIFT_FACTOR;
let IMAGE_BASE_SCALE;
let IMAGE_SCALE_RANGE;
let TEXT_ENTER_FACTOR;
let TEXT_EXIT_FACTOR;
function readMotionVars() {
  const styles = getComputedStyle(document.documentElement);
  SCRIM_MAX = parseFloat(styles.getPropertyValue('--scrim-max')) || 0.55;
  IMAGE_SHIFT_FACTOR = parseFloat(styles.getPropertyValue('--image-shift-factor')) || 0.18;
  IMAGE_BASE_SCALE = parseFloat(styles.getPropertyValue('--image-base-scale')) || 1.08;
  IMAGE_SCALE_RANGE = parseFloat(styles.getPropertyValue('--image-scale-range')) || 0.04;
  TEXT_ENTER_FACTOR = parseFloat(styles.getPropertyValue('--text-enter-factor')) || 0.65;
  TEXT_EXIT_FACTOR = parseFloat(styles.getPropertyValue('--text-exit-factor')) || 0.55;
}
readMotionVars();

function onResize() {
  measure();
  readMotionVars();
  tick();
}
window.addEventListener('resize', onResize, { passive: true });

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = reduceMotionQuery.matches;
const updateReduceMotion = event => {
  reduceMotion = event.matches;
  tick();
};
if (typeof reduceMotionQuery.addEventListener === 'function') {
  reduceMotionQuery.addEventListener('change', updateReduceMotion);
} else if (typeof reduceMotionQuery.addListener === 'function') {
  reduceMotionQuery.addListener(updateReduceMotion);
}

// скролл
let ticking = false;
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

function tick() {
  const viewH = window.innerHeight;
  const y = window.scrollY;

  rects.forEach(({ top, height }, i) => {
    const progress = clamp((y - top) / (height - viewH)); // 0 → 1 внутри панели

    if (reduceMotion) {
      scrims[i].style.opacity = Math.min(SCRIM_MAX, 0.35).toFixed(2);
      images[i].style.transform = 'none';
      copies[i].style.transform = 'translateY(0)';
      copies[i].style.opacity = 1;
      return;
    }

    const imageTravel = viewH * IMAGE_SHIFT_FACTOR;
    const parallax = (0.5 - progress) * imageTravel * 2;
    const centerWeight = 1 - Math.abs(0.5 - progress) * 2;
    const scale = IMAGE_BASE_SCALE + IMAGE_SCALE_RANGE * Math.max(0, centerWeight);
    images[i].style.transform = `translateY(${parallax}px) scale(${scale})`;

    const scrimOpacity = SCRIM_MAX * progress;
    scrims[i].style.opacity = scrimOpacity.toFixed(3);

    const start = viewH * TEXT_ENTER_FACTOR;
    const end = -viewH * TEXT_EXIT_FACTOR;
    const textTravel = start + (end - start) * progress;
    const copyOffset = textTravel + parallax * 0.25; // текст следует за фото, сохраняя параллакс
    copies[i].style.transform = `translateY(${copyOffset}px)`;
    copies[i].style.opacity = 1;
  });

  ticking = false;
}

// первичный проход
tick();
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(tick); });
