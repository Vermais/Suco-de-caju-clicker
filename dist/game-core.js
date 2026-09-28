/* Regras puras do jogo, compartilhadas pelo navegador e pelos testes. */
(function (root) {
  const BUILDINGS = [
    ['Espremedor', '✋', 15, 0.1],
    ['Barraca', '⛺', 100, 1],
    ['Cajueiro', '🌳', 1100, 8],
    ['Cozinha', '🍹', 12000, 47],
    ['Fazenda', '🚜', 130000, 260],
    ['Fábrica', '🏭', 1400000, 1400],
    ['Caravana', '🚚', 20000000, 7800],
    ['Laboratório', '🧪', 330000000, 44000],
    ['Usina solar', '☀️', 5100000000, 260000],
    ['Cidade do caju', '🏙️', 75000000000, 1600000],
    ['Estação orbital', '🛸', 1000000000000, 10000000],
    ['Dimensão do caju', '🌌', 14000000000000, 65000000]
  ].map(([name, icon, base, cps], id) => ({ id, name, icon, base, cps }));

  const UPGRADES = [
    { id: 'click1', name: 'Copo resistente', icon: '🥛', description: 'Cliques produzem 2×.', cost: 100, unlock: 50, click: 2 },
    { id: 'click2', name: 'Caju escolhido', icon: '🍊', description: 'Cliques produzem 2×.', cost: 1000, unlock: 500, click: 2 },
    { id: 'click3', name: 'Receita da casa', icon: '📜', description: 'Cliques produzem 3×.', cost: 15000, unlock: 7500, click: 3 },
    { id: 'click4', name: 'Prensa dourada', icon: '✨', description: 'Cliques produzem 3×.', cost: 250000, unlock: 125000, click: 3 },
    { id: 'click5', name: 'Mestre do suco', icon: '🏆', description: 'Cliques produzem 5×.', cost: 10000000, unlock: 5000000, click: 5 },
    { id: 'global1', name: 'Colheita cuidadosa', icon: '🧺', description: 'Toda a produção automática +25%.', cost: 5000, unlock: 2500, global: 1.25 },
    { id: 'global2', name: 'Distribuição rápida', icon: '⚡', description: 'Toda a produção automática +50%.', cost: 1000000, unlock: 500000, global: 1.5 },
    { id: 'global3', name: 'Safra especial', icon: '🌟', description: 'Toda a produção automática 2×.', cost: 100000000, unlock: 50000000, global: 2 },
    { id: 'global4', name: 'Caju infinito', icon: '♾️', description: 'Toda a produção automática 2×.', cost: 10000000000, unlock: 5000000000, global: 2 }
  ];
  BUILDINGS.forEach(b => [10, 25, 50].forEach((count, tier) => {
    UPGRADES.push({ id: `b${b.id}-${count}`, name: `${b.name}: ${['prática', 'especialização', 'excelência'][tier]}`, icon: b.icon,
      description: `Produção de ${b.name.toLowerCase()} 2×.`, cost: Math.ceil(b.base * [15, 90, 500][tier]),
      building: b.id, count, buildingMult: 2 });
  }));

  const ACHIEVEMENTS = [
    ...[1, 100, 1000, 100000, 10000000, 1000000000, 1000000000000].map((at, i) => ({ id: `juice-${at}`, icon: ['🥤','🍹','🧃','🛒','🌊','🏰','🌌'][i], name: ['Primeiro gole','Uma jarra','Barril cheio','Rio de caju','Oceano de suco','Lenda do caju','Além das estrelas'][i], kind: 'run', at })),
    ...[1, 10, 50, 100, 250, 500].map((at, i) => ({ id: `buildings-${at}`, icon: ['🔧','🧰','🏗️','🏭','🚀','👑'][i], name: ['Começando','Dez ajudantes','Linha de produção','Cem unidades','Grande empresa','Império completo'][i], kind: 'buildings', at })),
    ...[1, 10, 25, 50].map((at, i) => ({ id: `clicks-${at}`, icon: ['👆','👏','💪','⚡'][i], name: ['Um clique','Mãos à obra','Ritmo de produção','Dedicação total'][i], kind: 'clicks', at })),
    { id: 'first-rebirth', icon: '🌰', name: 'Nova safra', kind: 'rebirths', at: 1 },
    { id: 'ten-rebirths', icon: '🌰', name: 'Eterno retorno', kind: 'rebirths', at: 10 }
  ];

  const price = (building, owned) => Math.ceil(building.base * Math.pow(1.15, owned));
  function batchCost(building, owned, count) {
    if (!Number.isInteger(count) || count < 0 || count > 10000) return Infinity;
    let total = 0;
    for (let i = 0; i < count; i++) total += price(building, owned + i);
    return total;
  }
  function affordableCount(building, owned, balance, limit = 10000) {
    let low = 0, high = Math.min(limit, 10000);
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if (batchCost(building, owned, mid) <= balance) low = mid;
      else high = mid - 1;
    }
    return low;
  }
  const prestigePotential = allTime => Math.floor(Math.sqrt(Math.max(0, allTime) / 1e9));
  const prestigePending = state => Math.max(0, prestigePotential(state.allTime) - state.prestige);
  const upgradeUnlocked = (u, state) => u.building === undefined ? state.runProduced >= u.unlock : state.owned[u.building] >= u.count;
  function production(state, timed = false) {
    let cps = BUILDINGS.reduce((sum, b) => {
      const power = UPGRADES.reduce((m, u) => m * (u.building === b.id && state.upgrades.includes(u.id) ? u.buildingMult : 1), 1);
      return sum + state.owned[b.id] * b.cps * power;
    }, 0);
    cps *= UPGRADES.reduce((m, u) => m * (u.global && state.upgrades.includes(u.id) ? u.global : 1), 1);
    cps *= 1 + state.prestige * 0.1 + state.achievements.length * 0.005;
    return cps * (timed ? 7 : 1);
  }
  function clickPower(state, timed = false) {
    const base = UPGRADES.reduce((m, u) => m * (u.click && state.upgrades.includes(u.id) ? u.click : 1), 1);
    const permanent = 1 + state.prestige * 0.1 + state.achievements.length * 0.005;
    return Math.max(1, Math.floor((base + production(state, false) / permanent * 0.01) * permanent * (timed ? 7 : 1)));
  }
  function newState() {
    return { juice: 0, allTime: 0, runProduced: 0, owned: BUILDINGS.map(() => 0), upgrades: [], achievements: [], prestige: 0, rebirths: 0, clicks: 0, savedAt: Date.now() };
  }
  function normalize(raw) {
    const base = newState();
    if (!raw || typeof raw !== 'object') return base;
    const safe = n => Number.isFinite(n) && n >= 0 ? n : 0;
    const oldUpgrades = ['click1','click2','global1','click3','global2','click5'];
    const mapped = (Array.isArray(raw.upgrades) ? raw.upgrades : []).map(u => typeof u === 'number' ? oldUpgrades[u] : u);
    const allTime = safe(raw.allTime ?? raw.lifetime);
    return { ...base, juice: safe(raw.juice), allTime, runProduced: safe(raw.runProduced ?? raw.lifetime),
      owned: BUILDINGS.map((_, i) => Math.max(0, Math.floor(safe(raw.owned?.[i])))),
      upgrades: [...new Set(mapped)].filter(id => UPGRADES.some(u => u.id === id)),
      achievements: [...new Set(Array.isArray(raw.achievements) ? raw.achievements : [])].filter(id => ACHIEVEMENTS.some(a => a.id === id)),
      prestige: Math.floor(safe(raw.prestige)), rebirths: Math.floor(safe(raw.rebirths)), clicks: Math.floor(safe(raw.clicks)), savedAt: safe(raw.savedAt) || Date.now() };
  }
  function rebirth(state) {
    const pending = prestigePending(state);
    if (!pending) return false;
    state.prestige += pending;
    state.rebirths++;
    state.juice = 0;
    state.runProduced = 0;
    state.owned = BUILDINGS.map(() => 0);
    state.upgrades = [];
    state.clicks = 0;
    return pending;
  }
  const api = { BUILDINGS, UPGRADES, ACHIEVEMENTS, price, batchCost, affordableCount, prestigePotential, prestigePending, upgradeUnlocked, production, clickPower, newState, normalize, rebirth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
