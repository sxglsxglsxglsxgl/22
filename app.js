// Безопасный vh для iOS
function setVH() {
  const vh = window.innerHeight * 0.01;
  const value = `${vh}px`;
  const root = document.documentElement;
  root.style.setProperty('--vh', value);
  root.style.setProperty('--safe-vh', value);
}
setVH();
window.addEventListener('resize', setVH, { passive: true });

// Клампер
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

// Кэш DOM
const panels = Array.from(document.querySelectorAll('.panel'));
const images = panels.map(p => p.querySelector('.bg'));
const copies = panels.map(p => p.querySelector('.copy'));

// Предрасчёт позиций (обновлять на ресайз)
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
window.addEventListener('resize', () => {
  measure();
  tick();
}, { passive: true });

// Анимация на скролл
let ticking = false;
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(tick);
  }
}
window.addEventListener('scroll', onScroll, { passive: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tick() {
  const viewH = window.innerHeight;
  const y = window.scrollY;

  rects.forEach(({ top, height }, i) => {
    // Прогресс для секции: 0..1 в пределах "длины" панели
    const progress = clamp((y - top) / (height - viewH));

    if (!reduceMotion) {
      // Параллакс фона: лёгкое смещение вверх и небольшой зум
      const parallaxY = -20 * progress; // px
      const scale = 1.08 + 0.04 * progress;
      images[i].style.transform = `translateY(${parallaxY}px) scale(${scale})`;

      // Текст «въезжает» снизу и проявляется
      const ty = 30 * (1 - progress); // от 30px к 0
      const op = 0.2 + 0.8 * progress;
      copies[i].style.transform = `translateY(${ty}px)`;
      copies[i].style.opacity = op.toFixed(3);
    } else {
      images[i].style.transform = 'none';
      copies[i].style.transform = 'none';
      copies[i].style.opacity = '1';
    }
  });

  ticking = false;
}

// Первичный рендер
tick();

// Защита от «рывков» при быстрой прокрутке вверх-вниз
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) requestAnimationFrame(tick);
});
