/* Reutiliza cálculos econômicos entre alterações, sem descartar cliques. */
(function(root) {
  function create(core) {
    let owner, production, clickValue, clickFactor, productionFactor;
    function invalidate() { owner = null; production = undefined; clickValue = undefined; }
    function use(state) { if (owner !== state) { invalidate(); owner = state; } }
    function cps(state, factor = 1) {
      use(state);
      if (production === undefined) production = core.production(state);
      return production * factor;
    }
    function click(state, factor = 1, cpsFactor = 1, aura = 1) {
      use(state);
      if (clickValue === undefined || factor !== clickFactor || cpsFactor !== productionFactor) {
        clickFactor = factor; productionFactor = cpsFactor;
        clickValue = core.clickPower(state, factor, cpsFactor);
      }
      return clickValue * aura;
    }
    return {invalidate, cps, click};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
  else root.CajuFastEconomy = {create};
})(typeof window !== 'undefined' ? window : globalThis);
