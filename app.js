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
window.addEventListener('resize', () => { measure(); tick(); }, { passive: true });

// настройки из CSS custom properties
function cssVarPx(name, fallback = 0) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
let TEXT_MOVE_UP = cssVarPx('--text-move-up', 120);
let TEXT_START   = cssVarPx('--text-start', 80);
let SCRIM_MAX    = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scrim-max')) || 0.55;

// если меняли переменные динамически — можно перевычислить при ресайзе
window.addEventListener('resize', () => {
  TEXT_MOVE_UP = cssVarPx('--text-move-up', 120);
  TEXT_START   = cssVarPx('--text-start', 80);
  SCRIM_MAX    = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scrim-max')) || 0.55;
}, { passive: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// скролл
let ticking = false;
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
window.addEventListener('scroll', onScroll, { passive: true });

function tick() {
  const viewH = window.innerHeight;
  const y = window.scrollY;

  rects.forEach(({ top, height }, i) => {
    const progress = clamp((y - top) / (height - viewH)); // 0 → 1 внутри панели

    // 1) Фон — статичен
    images[i].style.transform = 'none';

    // 2) Затемнение (scrim) — нарастает
    const scrimOpacity = SCRIM_MAX * progress;
    scrims[i].style.opacity = scrimOpacity.toFixed(3);

    // 3) Текст движется СИЛЬНЕЕ и проявляется быстрее
    //    Старт: +TEXT_START px снизу; Финал: уходит вверх на TEXT_MOVE_UP * 0.33
    const ty = TEXT_START - progress * (TEXT_START + TEXT_MOVE_UP * 0.33);
    const op = clamp(progress * 1.25, 0, 1); // чуть быстрее проявление
    copies[i].style.transform = `translateY(${ty}px)`;
    copies[i].style.opacity = op.toFixed(3);

    if (reduceMotion) {
      // при снижении движения — фиксируем более мягкое затемнение, движение минимальное
      scrims[i].style.opacity = Math.min(SCRIM_MAX, 0.35).toFixed(2);
      copies[i].style.transform = 'translateY(0)';
      copies[i].style.opacity = 1;
    }
  });

  ticking = false;
}

// первичный проход
tick();
document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(tick); });
