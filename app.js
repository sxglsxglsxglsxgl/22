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
let TEXT_RANGE_FACTOR;
function readMotionVars() {
  const styles = getComputedStyle(document.documentElement);
  SCRIM_MAX = parseFloat(styles.getPropertyValue('--scrim-max')) || 0.5;
  IMAGE_SHIFT_FACTOR = parseFloat(styles.getPropertyValue('--image-shift-factor')) || 0.12;
  IMAGE_BASE_SCALE = parseFloat(styles.getPropertyValue('--image-base-scale')) || 1.14;
  IMAGE_SCALE_RANGE = parseFloat(styles.getPropertyValue('--image-scale-range')) || 0.03;
  TEXT_RANGE_FACTOR = parseFloat(styles.getPropertyValue('--text-range-factor')) || 1.3;
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
      scrims[i].style.opacity = Math.min(SCRIM_MAX, 0.3).toFixed(2);
      images[i].style.transform = 'none';
      copies[i].style.transform = 'translate3d(0, -50%, 0)';
      copies[i].style.opacity = 1;
      return;
    }

    const imageTravel = viewH * IMAGE_SHIFT_FACTOR;
    const parallax = -imageTravel * progress;
    const scale = IMAGE_BASE_SCALE + IMAGE_SCALE_RANGE * progress;
    images[i].style.transform = `translateY(${parallax}px) scale(${scale})`;

    const scrimOpacity = SCRIM_MAX * progress;
    scrims[i].style.opacity = scrimOpacity.toFixed(3);

    const textRange = viewH * TEXT_RANGE_FACTOR;
    const parallaxCenter = parallax + imageTravel * 0.5;
    const copyOffset = textRange * (0.5 - progress) + parallaxCenter;
    copies[i].style.transform = `translate3d(0, ${copyOffset}px, 0)`;
    copies[i].style.opacity = 1;
  });

  ticking = false;
}

// первичный проход
tick();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) requestAnimationFrame(tick);
});
