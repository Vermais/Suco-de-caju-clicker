/* Os limites abaixo se aplicam somente à decoração, nunca ao ganho de cliques. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new WeakMap();
  let lastClickEffect = -Infinity;
  let particles = 0;
  function animate(target, frames, duration = 350) {
    if (!target || reduced.matches || !target.animate) return;
    running.get(target)?.cancel();
    const animation = target.animate(frames, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
    running.set(target, animation);
  }
  function burst(area, event, count = 8, wide = false) {
    if (!area || reduced.matches) return;
    const box = area.getBoundingClientRect();
    const x = event?.clientX ? event.clientX - box.left : box.width / 2;
    const y = event?.clientY ? event.clientY - box.top : box.height / 2;
    for (let i = 0; i < count && particles < 36; i++) {
      const dot = document.createElement('i');
      const angle = Math.random() * Math.PI * 2;
      const distance = (wide ? 90 : 30) + Math.random() * (wide ? 150 : 55);
      dot.className = 'juice-particle' + (wide ? ' confetti' : '');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.left = Math.max(5, Math.min(box.width - 5, x)) + 'px';
      dot.style.top = Math.max(5, Math.min(box.height - 5, y)) + 'px';
      dot.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      dot.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      dot.style.setProperty('--turn', Math.random() * 360 + 'deg');
      dot.style.background = ['#ffcf68', '#ff9d35', '#fff0b5', '#96cd72'][i % 4];
      area.append(dot);
      particles++;
      setTimeout(() => { dot.remove(); particles--; }, 900);
    }
  }
  function click(target, area, event) {
    if (performance.now() - lastClickEffect < 80) return;
    lastClickEffect = performance.now();
    animate(target, [{ transform: 'scale(.92) rotate(-2deg)' }, { transform: 'scale(1.04) rotate(1deg)' }, { transform: 'scale(1)' }], 280);
    burst(area, event);
  }
  function celebrate(area) {
    animate(area, [{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }], 800);
    burst(area, null, 28, true);
  }
  window.CajuEffects = { animate, burst, click, celebrate };
})();
