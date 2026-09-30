/* Relógio visual separado dos ganhos: pares de cliques rápidos não congelam a pose. */
(function(root) {
  'use strict';
  function create() {
    const step = 120;
    let left = false, initialLeft = false, moving = false;
    let lastClick = -Infinity, startedAt = 0, until = 0;
    function view(now) {
      if (moving) {
        left = initialLeft !== (Math.floor((Math.min(now, until) - startedAt) / step) % 2 === 1);
        if (now >= until) moving = false;
      }
      return {left, moving, initialLeft};
    }
    function click(now) {
      view(now);
      if (now - lastClick < step) {
        if (!moving) { left = !left; initialLeft = left; startedAt = now; moving = true; }
        until = now + 240;
      } else if (!moving) left = !left;
      lastClick = now;
      return view(now);
    }
    function reset() { left = false; initialLeft = false; moving = false; lastClick = -Infinity; startedAt = 0; until = 0; }
    return {click, view, reset};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
  else root.CajuHandMotion = {create};
})(typeof window !== 'undefined' ? window : globalThis);
