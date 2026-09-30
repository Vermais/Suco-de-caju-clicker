/* Carga por ritmo, independente do saldo e do número de cliques recompensados. */
(function(root) {
  'use strict';
  const DURATION = 20000, COOLDOWN = 20000, RATE = 5, PER_CLICK = 1.5;
  const finite = n => Number.isFinite(n) && n >= 0 ? n : 0;
  function normalize(raw, now = Date.now()) {
    const until = Math.min(now + DURATION, finite(raw?.until));
    const readyAt = Math.min(now + DURATION + COOLDOWN, Math.max(until ? until + COOLDOWN : 0, finite(raw?.readyAt)));
    return {charge: until > now || readyAt > now ? 0 : Math.min(99.99, finite(raw?.charge)), until, readyAt};
  }
  function view(state, now = Date.now()) {
    const active = state.until > now;
    const cooling = !active && state.readyAt > now;
    return {active, cooling, multiplier: active ? 2 : 1,
      percent: active ? Math.min(100, (state.until - now) / DURATION * 100) : cooling ? 0 : state.charge,
      seconds: Math.max(0, Math.ceil(((active ? state.until : state.readyAt) - now) / 1000))};
  }
  function create() {
    let last = null, tokens = 0, owner = null;
    function reset() { last = null; tokens = 0; owner = null; }
    function click(state, monotonicNow, now = Date.now()) {
      if (owner !== state) { reset(); owner = state; }
      const elapsed = last === null ? 0 : Math.max(0, monotonicNow - last) / 1000;
      last = monotonicNow;
      if (state.readyAt > now || state.until > now) { tokens = 0; return false; }
      tokens = Math.min(PER_CLICK, tokens + elapsed * RATE);
      state.charge = Math.min(100, state.charge + tokens);
      tokens = 0;
      if (state.charge < 100 - 1e-8) return false;
      state.charge = 0;
      state.until = now + DURATION;
      state.readyAt = state.until + COOLDOWN;
      return true;
    }
    return {click, reset};
  }
  const api = {create, normalize, view, DURATION, COOLDOWN};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuAura = api;
})(typeof window !== 'undefined' ? window : globalThis);
