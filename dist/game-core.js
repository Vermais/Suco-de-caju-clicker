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
    { id: 'click6', name: 'Prensa turbo', icon: '⚙️', description: 'Cliques produzem 2×.', cost: 100000000, unlock: 50000000, click: 2 },
    { id: 'click7', name: 'Toque de mestre', icon: '🤏', description: 'Cliques produzem 3×.', cost: 50000000000, unlock: 25000000000, click: 3 },
    { id: 'click8', name: 'Lenda do pomar', icon: '🌠', description: 'Cliques produzem 3×.', cost: 500000000000000, unlock: 250000000000000, click: 3 },
    { id: 'global1', name: 'Colheita cuidadosa', icon: '🧺', description: 'Toda a produção automática +25%.', cost: 5000, unlock: 2500, global: 1.25 },
    { id: 'global2', name: 'Distribuição rápida', icon: '⚡', description: 'Toda a produção automática +50%.', cost: 1000000, unlock: 500000, global: 1.5 },
    { id: 'global3', name: 'Safra especial', icon: '🌟', description: 'Toda a produção automática 2×.', cost: 100000000, unlock: 50000000, global: 2 },
    { id: 'global4', name: 'Caju infinito', icon: '♾️', description: 'Toda a produção automática 2×.', cost: 10000000000, unlock: 5000000000, global: 2 }
  ];
  UPGRADES.push(
    { id: 'global5', name: 'Cooperativa do caju', icon: '🤝', description: 'Toda a produção automática +30%.', cost: 120000, unlock: 60000, global: 1.3 },
    { id: 'global6', name: 'Ferrovias da safra', icon: '🚂', description: 'Toda a produção automática +60%.', cost: 120000000000, unlock: 60000000000, global: 1.6 },
    { id: 'global7', name: 'Comércio interplanetário', icon: '🪐', description: 'Toda a produção automática 2×.', cost: 200000000000000, unlock: 100000000000000, global: 2 },
    { id: 'global8', name: 'Universo do caju', icon: '🌌', description: 'Toda a produção automática 2×.', cost: 3000000000000000000, unlock: 1500000000000000000, global: 2 }
  );
  const BUILDING_TIERS = [
    [5, 8, 'primeiros passos'], [10, 15, 'prática'], [25, 90, 'especialização'],
    [50, 500, 'excelência'], [100, 250000, 'maestria'], [200, 100000000000, 'lenda']
  ];
  BUILDINGS.forEach(b => BUILDING_TIERS.forEach(([count, factor, title]) => {
    UPGRADES.push({ id: `b${b.id}-${count}`, name: `${b.name}: ${title}`, icon: b.icon,
      description: `Produção de ${b.name.toLowerCase()} 2×.`, cost: Math.ceil(b.base * factor),
      building: b.id, count, buildingMult: 2 });
  }));

  const ACHIEVEMENTS = [
    ...[1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 1000000000000, 1000000000000000].map((at, i) => ({ id: `juice-${at}`, icon: ['🥤','🍊','🍹','🧃','🍶','🛒','🚛','🌊','🏙️','🏰','🌌','✨'][i], name: ['Primeiro gole','Dez copos','Uma jarra','Barril cheio','Vila do caju','Rio de caju','Mar de suco','Oceano de suco','Continente dourado','Lenda do caju','Além das estrelas','Caju cósmico'][i], kind: 'run', at })),
    ...[1e6, 1e9, 1e12, 1e15, 1e18].map((at, i) => ({ id: `history-${at}`, icon: ['📈','🏆','👑','🪐','♾️'][i], name: ['Um milhão na história','Bilionário do caju','Trilhão histórico','Império eterno','História infinita'][i], kind: 'allTime', at })),
    ...[1, 5, 10, 50, 100, 250, 500, 1000, 2500].map((at, i) => ({ id: `buildings-${at}`, icon: ['🔧','🧱','🧰','🏗️','🏭','🚀','👑','🌆','🌌'][i], name: ['Começando','Primeira equipe','Dez ajudantes','Linha de produção','Cem unidades','Grande empresa','Império completo','Metrópole do caju','Civilização do caju'][i], kind: 'buildings', at })),
    ...[1, 10, 25, 50, 100, 500, 1000, 10000].map((at, i) => ({ id: `clicks-${at}`, icon: ['👆','👏','💪','⚡','🔥','🥊','🏅','🌠'][i], name: ['Um clique','Mãos à obra','Ritmo de produção','Dedicação total','Cem apertos','Mão incansável','Mil toques','Dez mil apertos'][i], kind: 'clicks', at })),
    { id: 'first-rebirth', icon: '🌰', name: 'Nova safra', kind: 'rebirths', at: 1 },
    ...[2, 5, 10, 25, 50].map((at, i) => ({ id: at === 10 ? 'ten-rebirths' : `rebirths-${at}`, icon: '🌰', name: ['Segunda safra','Cinco vidas','Eterno retorno','Ciclo lendário','Safra sem fim'][i], kind: 'rebirths', at })),
    ...[1, 10, 100, 1000].map((at, i) => ({ id: `nuts-${at}`, icon: '🌰', name: ['Primeira castanha','Punhado de castanhas','Saco de castanhas','Reino das castanhas'][i], kind: 'prestige', at })),
    ...[1, 5, 25, 100].map((at, i) => ({ id: `events-${at}`, icon: '🎉', name: ['Primeiro evento','Caçador de eventos','Calendário cheio','Lenda dos eventos'][i], kind: 'events', at })),
    { id: 'golden-event', icon: '🌟', name: 'Brilho dourado', kind: 'event', event: 'golden', at: 1 },
    { id: 'rain-event', icon: '🌧️', name: 'Depois da chuva', kind: 'event', event: 'rain', at: 1 },
    { id: 'rush-event', icon: '📦', name: 'Pedido entregue', kind: 'event', event: 'rush', at: 1 },
    { id: 'festival-event', icon: '🎊', name: 'Festa no pomar', kind: 'event', event: 'festival', at: 1 }
  ];
  const EVENTS = [
    { id: 'golden', icon: '🌟', name: 'Caju dourado', lifetime: 12000 },
    { id: 'rain', icon: '🌧️', name: 'Chuva de cajus', lifetime: 15000 },
    { id: 'rush', icon: '📦', name: 'Hora do pedido', lifetime: 15000 },
    { id: 'festival', icon: '🎊', name: 'Festival do caju', lifetime: 18000 }
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
  const boostMultiplier = timed => timed === true ? 7 : Number.isFinite(timed) && timed > 0 ? timed : 1;
  function createClickLimiter(limit = 10, interval = 1000, minGap = 90) {
    const recent = [];
    let lastAccepted = -Infinity;
    return now => {
      while (recent.length && now - recent[0] >= interval) recent.shift();
      if (now - lastAccepted < minGap || recent.length >= limit) return false;
      recent.push(now);
      lastAccepted = now;
      return true;
    };
  }
  function production(state, timed = false) {
    let cps = BUILDINGS.reduce((sum, b) => {
      const power = UPGRADES.reduce((m, u) => m * (u.building === b.id && state.upgrades.includes(u.id) ? u.buildingMult : 1), 1);
      return sum + state.owned[b.id] * b.cps * power;
    }, 0);
    cps *= UPGRADES.reduce((m, u) => m * (u.global && state.upgrades.includes(u.id) ? u.global : 1), 1);
    cps *= 1 + state.prestige * 0.1 + state.achievements.length * 0.005;
    return cps * boostMultiplier(timed);
  }
  function clickPower(state, timed = false) {
    const base = UPGRADES.reduce((m, u) => m * (u.click && state.upgrades.includes(u.id) ? u.click : 1), 1);
    const permanent = 1 + state.prestige * 0.1 + state.achievements.length * 0.005;
    return Math.max(1, Math.floor((base + production(state, false) / permanent * 0.01) * permanent * boostMultiplier(timed)));
  }
  function eventReward(state, id, lucky = false) {
    if (id === 'golden') return lucky
      ? { gain: Math.max(production(state) * 120, clickPower(state) * 77, 77), message: 'Caju dourado: prêmio instantâneo!' }
      : { boost: { id, production: 7, click: 7, duration: 25000 }, message: 'Safra dourada: produção e clique 7× por 25 segundos!' };
    if (id === 'rain') return { gain: Math.max(production(state) * 75, clickPower(state) * 40, 100), message: 'Chuva de cajus: copos extras!' };
    if (id === 'rush') return { boost: { id, production: 2, click: 5, duration: 35000 }, message: 'Hora do pedido: produção 2× e clique 5× por 35 segundos!' };
    if (id === 'festival') return { boost: { id, production: 3, click: 3, duration: 45000 }, message: 'Festival do caju: produção e clique 3× por 45 segundos!' };
    return null;
  }
  function newState() {
    return { juice: 0, allTime: 0, runProduced: 0, owned: BUILDINGS.map(() => 0), upgrades: [], achievements: [], prestige: 0, rebirths: 0, clicks: 0, skin: 'cup',
      eventStats: { total: 0, golden: 0, rain: 0, rush: 0, festival: 0 }, pendingEvent: null, activeBoost: null, nextEventAt: Date.now() + 65000, savedAt: Date.now() };
  }
  function normalize(raw) {
    const base = newState();
    if (!raw || typeof raw !== 'object') return base;
    const safe = n => Number.isFinite(n) && n >= 0 ? n : 0;
    const oldUpgrades = ['click1','click2','global1','click3','global2','click5'];
    const mapped = (Array.isArray(raw.upgrades) ? raw.upgrades : []).map(u => typeof u === 'number' ? oldUpgrades[u] : u);
    const allTime = safe(raw.allTime ?? raw.lifetime);
    const stats = Object.fromEntries(Object.keys(base.eventStats).map(id => [id, Math.floor(safe(raw.eventStats?.[id]))]));
    const pending = EVENTS.find(e => e.id === raw.pendingEvent?.id) && safe(raw.pendingEvent?.until) > Date.now() ? { id: raw.pendingEvent.id, until: raw.pendingEvent.until } : null;
    const boost = EVENTS.find(e => e.id === raw.activeBoost?.id) && safe(raw.activeBoost?.until) > Date.now()
      ? { id: raw.activeBoost.id, until: raw.activeBoost.until, production: Math.min(7, Math.max(1, safe(raw.activeBoost.production))), click: Math.min(7, Math.max(1, safe(raw.activeBoost.click))) } : null;
    return { ...base, juice: safe(raw.juice), allTime, runProduced: safe(raw.runProduced ?? raw.lifetime),
      owned: BUILDINGS.map((_, i) => Math.max(0, Math.floor(safe(raw.owned?.[i])))),
      upgrades: [...new Set(mapped)].filter(id => UPGRADES.some(u => u.id === id)),
      achievements: [...new Set(Array.isArray(raw.achievements) ? raw.achievements : [])].filter(id => ACHIEVEMENTS.some(a => a.id === id)),
      prestige: Math.floor(safe(raw.prestige)), rebirths: Math.floor(safe(raw.rebirths)), clicks: Math.floor(safe(raw.clicks)), skin: raw.skin === 'pedro67' ? 'pedro67' : 'cup',
      eventStats: stats, pendingEvent: pending, activeBoost: boost,
      nextEventAt: pending ? safe(raw.nextEventAt) || base.nextEventAt : Math.max(safe(raw.nextEventAt), raw.pendingEvent ? Date.now() + 45000 : 0) || base.nextEventAt,
      savedAt: safe(raw.savedAt) || Date.now() };
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
    state.pendingEvent = null;
    state.activeBoost = null;
    state.nextEventAt = Date.now() + 65000;
    return pending;
  }
  const api = { BUILDINGS, UPGRADES, ACHIEVEMENTS, EVENTS, price, batchCost, affordableCount, prestigePotential, prestigePending, upgradeUnlocked, production, clickPower, eventReward, createClickLimiter, newState, normalize, rebirth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
