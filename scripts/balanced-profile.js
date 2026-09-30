/* Gera um perfil de referência para revisão administrativa; não acessa o banco. */
const C = require('../dist/game-core.js');
function achievements(state) {
  state.achievements = C.ACHIEVEMENTS.filter(a => {
    return C.progressValue(state, a) >= a.at;
  }).map(a => a.id);
}
function balancedProfile(balance = 1e9, investment = 250e6) {
  const state = C.newState();
  state.juice = investment;
  state.runProduced = balance + investment;
  state.allTime = state.runProduced;
  state.handmade = Math.min(1e5, balance / 10);
  state.clicks = Math.min(1000, Math.floor(state.handmade));
  for (const id of ['click4', 'click5']) {
    const u = C.UPGRADES.find(u => u.id === id);
    if (C.upgradeUnlocked(u, state) && u.cost <= state.juice / 10) {
      state.upgrades.push(id); state.juice -= u.cost;
    }
  }
  achievements(state);
  for (let step = 0; step < 10000; step++) {
    const current = C.production(state);
    let best = null;
    for (const b of C.BUILDINGS) {
      const cost = C.price(b, state.owned[b.id]);
      if (cost > state.juice) continue;
      state.owned[b.id]++;
      const gain = C.production(state) - current;
      state.owned[b.id]--;
      if (gain > 0 && (!best || gain / cost > best.score)) best = { b, cost, score: gain / cost };
    }
    for (const u of C.UPGRADES) {
      if (state.upgrades.includes(u.id) || !C.upgradeUnlocked(u, state) || u.cost > state.juice) continue;
      state.upgrades.push(u.id);
      const gain = C.production(state) - current;
      state.upgrades.pop();
      if (gain > 0 && (!best || gain / u.cost > best.score)) best = { u, cost: u.cost, score: gain / u.cost };
    }
    if (!best) break;
    state.juice -= best.cost;
    if (best.b) state.owned[best.b.id]++;
    else state.upgrades.push(best.u.id);
    achievements(state);
  }
  // O saldo solicitado é separado do orçamento já investido em máquinas e melhorias.
  state.allTime = state.runProduced = balance + investment - state.juice;
  state.juice = balance;
  state.savedAt = Date.now();
  achievements(state);
  return state;
}
if (require.main === module) console.log(JSON.stringify(balancedProfile(), null, 2));
module.exports = { balancedProfile };
