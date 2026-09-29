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
    ['Dimensão do caju', '🌌', 14000000000000, 65000000],
    ['Pomar quântico', '⚛️', 200000000000000, 410000000],
    ['Multiverso do caju', '🌀', 3000000000000000, 2700000000],
    ['Motor temporal', '⏳', 45000000000000000, 18000000000],
    ['Forja de estrelas', '🌠', 700000000000000000, 120000000000],
    ['Galáxia engarrafada', '🌌', 11000000000000000000, 800000000000],
    ['Fonte primordial', '💫', 180000000000000000000, 5400000000000]
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
    { id: 'global8', name: 'Universo do caju', icon: '🌌', description: 'Toda a produção automática 2×.', cost: 3000000000000000000, unlock: 1500000000000000000, global: 2 },
    { id: 'global9', name: 'Rede de pomares', icon: '🕸️', description: 'Toda a produção automática +75%.', cost: 30000000000000, unlock: 15000000000000, global: 1.75 },
    { id: 'global10', name: 'Receita multidimensional', icon: '🌀', description: 'Toda a produção automática 2×.', cost: 60000000000000000, unlock: 30000000000000000, global: 2 },
    { id: 'click9', name: 'Mãos do multiverso', icon: '🙌', description: 'Cliques produzem 3×.', cost: 20000000000000000, unlock: 10000000000000000, click: 3 }
  );
  const BUILDING_TIERS = [
    [5, 8, 'primeiros passos'], [10, 15, 'prática'], [25, 90, 'especialização'],
    [50, 500, 'excelência'], [75, 2500, 'engenharia'], [100, 10000, 'maestria'],
    [150, 2000000, 'automação avançada'], [200, 1000000000, 'lenda'],
    [300, 1e15, 'transcendência'], [400, 1e21, 'eternidade'], [500, 1e27, 'origem']
  ];
  BUILDINGS.forEach(b => BUILDING_TIERS.forEach(([count, factor, title]) => {
    UPGRADES.push({ id: `b${b.id}-${count}`, name: `${b.name}: ${title}`, icon: b.icon,
      description: `Produção de ${b.name.toLowerCase()} 2×.`, cost: Math.ceil(b.base * factor),
      building: b.id, count, buildingMult: 2 });
  }));
  UPGRADES.push(
    ...[[2e7, 1.3, 'Controle de qualidade'], [2e9, 1.5, 'Logística inteligente'],
      [2e12, 1.5, 'Rede estelar'], [2e16, 1.5, 'Safra temporal'],
      [2e19, 2, 'Energia primordial'], [2e22, 2, 'Horizonte infinito']].map(([cost, global, name], i) =>
      ({ id: `expansion-global-${i}`, name, icon: '📈', description: `Produção automática ×${global.toLocaleString('pt-BR')}.`, cost, unlock: cost / 2, global })),
    ...[[2e6, .005, 'Gole produtivo'], [2e8, .005, 'Prensa sincronizada'], [2e11, .01, 'Fluxo industrial'],
      [2e14, .01, 'Pulso cósmico'], [2e18, .02, 'Toque temporal']].map(([cost, clickCps, name], i) =>
      ({ id: `expansion-click-${i}`, name, icon: '👆', description: `Cada clique recebe mais ${clickCps * 100}% da produção por segundo.`, cost, unlock: cost / 2, clickCps }))
  );
  BUILDINGS.slice(1).forEach(b => UPGRADES.push({ id: `synergy-${b.id}`, name: `${b.name}: cadeia integrada`, icon: '🤝',
    description: `Cada ${BUILDINGS[b.id - 1].name.toLowerCase()} aumenta a produção de ${b.name.toLowerCase()} em 1%.`,
    cost: b.base * 100, building: b.id, count: 15, synergy: b.id - 1 }));

  const ACHIEVEMENTS = [
    ...[1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 1000000000000, 1000000000000000].map((at, i) => ({ id: `juice-${at}`, icon: ['🥤','🍊','🍹','🧃','🍶','🛒','🚛','🌊','🏙️','🏰','🌌','✨'][i], name: ['Primeiro gole','Dez copos','Uma jarra','Barril cheio','Vila do caju','Rio de caju','Mar de suco','Oceano de suco','Continente dourado','Lenda do caju','Além das estrelas','Caju cósmico'][i], kind: 'run', at })),
    ...[1e6, 1e9, 1e12, 1e15, 1e18].map((at, i) => ({ id: `history-${at}`, icon: ['📈','🏆','👑','🪐','♾️'][i], name: ['Um milhão na história','Bilionário do caju','Trilhão histórico','Império eterno','História infinita'][i], kind: 'allTime', at })),
    ...[1, 5, 10, 50, 100, 250, 500, 1000, 2500, 5000].map((at, i) => ({ id: `buildings-${at}`, icon: ['🔧','🧱','🧰','🏗️','🏭','🚀','👑','🌆','🌌','🌀'][i], name: ['Começando','Primeira equipe','Dez ajudantes','Linha de produção','Cem unidades','Grande empresa','Império completo','Metrópole do caju','Civilização do caju','Pomares infinitos'][i], kind: 'buildings', at })),
    ...[1, 10, 25, 50, 100, 500, 1000, 10000].map((at, i) => ({ id: `clicks-${at}`, icon: ['👆','👏','💪','⚡','🔥','🥊','🏅','🌠'][i], name: ['Um clique','Mãos à obra','Ritmo de produção','Dedicação total','Cem apertos','Mão incansável','Mil toques','Dez mil apertos'][i], kind: 'clicks', at })),
    { id: 'first-rebirth', icon: '🌰', name: 'Nova safra', kind: 'rebirths', at: 1 },
    ...[2, 5, 10, 25, 50].map((at, i) => ({ id: at === 10 ? 'ten-rebirths' : `rebirths-${at}`, icon: '🌰', name: ['Segunda safra','Cinco vidas','Eterno retorno','Ciclo lendário','Safra sem fim'][i], kind: 'rebirths', at })),
    ...[1, 10, 100, 1000].map((at, i) => ({ id: `nuts-${at}`, icon: '🌰', name: ['Primeira castanha','Punhado de castanhas','Saco de castanhas','Reino das castanhas'][i], kind: 'prestige', at })),
    ...[1, 5, 25, 100, 250].map((at, i) => ({ id: `events-${at}`, icon: '🎉', name: ['Primeiro evento','Caçador de eventos','Calendário cheio','Lenda dos eventos','Calendário lendário'][i], kind: 'events', at })),
    { id: 'golden-event', icon: '🌟', name: 'Brilho dourado', kind: 'event', event: 'golden', at: 1 },
    { id: 'rain-event', icon: '🌧️', name: 'Depois da chuva', kind: 'event', event: 'rain', at: 1 },
    { id: 'rush-event', icon: '📦', name: 'Pedido entregue', kind: 'event', event: 'rush', at: 1 },
    { id: 'festival-event', icon: '🎊', name: 'Festa no pomar', kind: 'event', event: 'festival', at: 1 },
    { id: 'meteor-event', icon: '☄️', name: 'Caju do espaço', kind: 'event', event: 'meteor', at: 1 },
    { id: 'harvest-event', icon: '🌾', name: 'Colheita extraordinária', kind: 'event', event: 'harvest', at: 1 }
  ];
  const EVENTS = [
    { id: 'golden', icon: '🌟', name: 'Caju dourado', lifetime: 12000 },
    { id: 'rain', icon: '🌧️', name: 'Chuva de cajus', lifetime: 15000 },
    { id: 'rush', icon: '📦', name: 'Hora do pedido', lifetime: 15000 },
    { id: 'festival', icon: '🎊', name: 'Festival do caju', lifetime: 18000 },
    { id: 'meteor', icon: '☄️', name: 'Caju meteoro', lifetime: 13000 },
    { id: 'harvest', icon: '🌾', name: 'Grande colheita', lifetime: 17000 }
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
  // Produção acumulada, mesmo depois de gastar. Cinco níveis por bilhão inicial.
  const prestigeThreshold = level => level <= 0 ? 0 : Math.max(1e9, 1e9 * level ** 3 / 125);
  const prestigePotential = produced => produced < 1e9 ? 0 : Math.floor(5 * Math.cbrt(produced / 1e9));
  const prestigeProgress = state => (state.prestigeBase ?? prestigeThreshold(earnedNuts(state))) + state.runProduced;
  function prestigeCost(state, count = 1) {
    return Math.max(0, prestigeThreshold(earnedNuts(state) + count) - (state.prestigeBase ?? prestigeThreshold(earnedNuts(state))));
  }
  function prestigePending(state) {
    let low = 0;
    const total = prestigeProgress(state);
    let high = Math.min(Number.MAX_SAFE_INTEGER, prestigePotential(total) + 1);
    while (low < high) {
      const mid = low + Math.ceil((high - low) / 2);
      if (prestigeThreshold(earnedNuts(state) + mid) <= total) low = mid;
      else high = mid - 1;
    }
    return low;
  }
  const PERMANENT_UPGRADES = [
    { id: 'production', name: 'Raízes eternas', icon: '🌳', description: 'Produção automática ×1,5 por nível.', cost: 1, growth: 2, max: 10 },
    { id: 'click', name: 'Mãos da nova safra', icon: '🙌', description: 'Primeiro nível dobra os cliques; próximos níveis multiplicam por 1,5.', cost: 2, growth: 2, max: 10 },
    { id: 'starter', name: 'Kit de recomeço', icon: '🧺', description: 'Comece com 10.000 copos no nível 1; o kit quintuplica por nível.', cost: 1, growth: 2, max: 5 },
    { id: 'offline', name: 'Turno noturno', icon: '🌙', description: '+10 pontos percentuais de produção ausente por nível, até 100%.', cost: 1, growth: 2, max: 6 },
    { id: 'events', name: 'Calendário de ouro', icon: '🎉', description: 'Prêmios de eventos +25% e duração dos bônus +15% por nível.', cost: 2, growth: 2, max: 5 },
    { id: 'crew', name: 'Equipe veterana', icon: '👷', description: 'Por nível, comece com 10 espremedores e 2 barracas; um cajueiro a cada 3 níveis.', cost: 2, growth: 2, max: 5 },
    { id: 'synergy', name: 'Cooperativa eterna', icon: '🤝', description: '+2% de produção por tipo de produtor ativo, por nível.', cost: 3, growth: 2, max: 5 },
    { id: 'milk', name: 'Memórias da safra', icon: '🏅', description: 'Bônus de produção das conquistas +20% por nível.', cost: 2, growth: 2, max: 5 },
    { id: 'clickCps', name: 'Pulso industrial', icon: '⚙️', description: 'Cada clique recebe mais 0,5% da produção por segundo por nível.', cost: 3, growth: 2, max: 5 },
    { id: 'frequency', name: 'Estação de festas', icon: '🎊', description: 'Frequência de eventos +12% por nível; o intervalo entre eles diminui.', cost: 3, growth: 2, max: 5 },
    { id: 'window', name: 'Olhar atento', icon: '👀', description: '+20% de tempo para coletar eventos por nível.', cost: 1, growth: 2, max: 5 },
    { id: 'offlineTime', name: 'Reserva da madrugada', icon: '🌌', description: '+4 horas de produção ausente por nível, até 24 horas.', cost: 2, growth: 2, max: 5 }
  ];
  const permanentLevel = (state, id) => state.permanentUpgrades?.[id] || 0;
  const permanentCost = (state, u) => u.cost * u.growth ** permanentLevel(state, u.id);
  const earnedNuts = state => state.prestigeEarned ?? state.prestige;
  const legacyBonus = state => 1 + earnedNuts(state) * .01 + state.achievements.length * .005 * (1 + permanentLevel(state, 'milk') * .2);
  const offlineRate = state => Math.min(1, .4 + permanentLevel(state, 'offline') * .1);
  const offlineLimit = state => (4 + 4 * permanentLevel(state, 'offlineTime')) * 3600;
  const eventDelay = (state, random = Math.random()) => (65000 + random * 55000) / (1 + .12 * permanentLevel(state, 'frequency'));
  const eventLifetime = (state, event) => event.lifetime * (1 + .2 * permanentLevel(state, 'window'));
  const starterJuice = state => permanentLevel(state, 'starter') ? 10000 * 5 ** (permanentLevel(state, 'starter') - 1) : 0;
  const starterBuildings = state => BUILDINGS.map((_, i) => {
    const level = permanentLevel(state, 'crew');
    return i === 0 ? level * 10 : i === 1 ? level * 2 : i === 2 ? Math.floor(level / 3) : 0;
  });
  function buyPermanent(state, id) {
    const u = PERMANENT_UPGRADES.find(item => item.id === id);
    if (!u || permanentLevel(state, id) >= u.max || state.prestige < permanentCost(state, u)) return false;
    state.prestige -= permanentCost(state, u);
    state.permanentUpgrades[id] = permanentLevel(state, id) + 1;
    return true;
  }
  const upgradeUnlocked = (u, state) => u.building === undefined ? state.runProduced >= u.unlock : state.owned[u.building] >= u.count;
  const boostMultiplier = timed => timed === true ? 7 : Number.isFinite(timed) && timed > 0 ? timed : 1;
  function production(state, timed = false) {
    let cps = BUILDINGS.reduce((sum, b) => {
      const power = UPGRADES.reduce((m, u) => m * (u.building === b.id && state.upgrades.includes(u.id) ? u.buildingMult || 1 : 1), 1);
      const synergy = UPGRADES.find(u => u.building === b.id && u.synergy !== undefined && state.upgrades.includes(u.id));
      return sum + state.owned[b.id] * b.cps * power * (synergy ? 1 + state.owned[synergy.synergy] * .01 : 1);
    }, 0);
    cps *= UPGRADES.reduce((m, u) => m * (u.global && state.upgrades.includes(u.id) ? u.global : 1), 1);
    cps *= legacyBonus(state) * 1.5 ** permanentLevel(state, 'production');
    cps *= 1 + state.owned.filter(count => count > 0).length * .02 * permanentLevel(state, 'synergy');
    return cps * boostMultiplier(timed);
  }
  function clickPower(state, timed = false) {
    const base = UPGRADES.reduce((m, u) => m * (u.click && state.upgrades.includes(u.id) ? u.click : 1), 1);
    const permanent = legacyBonus(state);
    const clickLevel = permanentLevel(state, 'click');
    const clickBuff = clickLevel ? 2 * 1.5 ** (clickLevel - 1) : 1;
    const fraction = .01 + .005 * permanentLevel(state, 'clickCps') + UPGRADES.reduce((sum, u) => sum + (state.upgrades.includes(u.id) ? u.clickCps || 0 : 0), 0);
    return Math.max(1, Math.floor((base + production(state, false) / permanent * fraction) * permanent * clickBuff * boostMultiplier(timed)));
  }
  function baseEventReward(state, id, lucky = false) {
    if (id === 'golden') return lucky
      ? { gain: Math.max(production(state) * 120, clickPower(state) * 77, 77), message: 'Caju dourado: prêmio instantâneo!' }
      : { boost: { id, production: 7, click: 7, duration: 25000 }, message: 'Safra dourada: produção e clique 7× por 25 segundos!' };
    if (id === 'rain') return { gain: Math.max(production(state) * 75, clickPower(state) * 40, 100), message: 'Chuva de cajus: copos extras!' };
    if (id === 'rush') return { boost: { id, production: 2, click: 5, duration: 35000 }, message: 'Hora do pedido: produção 2× e clique 5× por 35 segundos!' };
    if (id === 'festival') return { boost: { id, production: 3, click: 3, duration: 45000 }, message: 'Festival do caju: produção e clique 3× por 45 segundos!' };
    if (id === 'meteor') return { gain: Math.max(production(state) * 180, clickPower(state) * 80, 150), message: 'Caju meteoro: copos do espaço!' };
    if (id === 'harvest') return { boost: { id, production: 4, click: 2, duration: 35000 }, message: 'Grande colheita: produção 4× e clique 2× por 35 segundos!' };
    return null;
  }
  function eventReward(state, id, lucky = false) {
    const reward = baseEventReward(state, id, lucky);
    const level = permanentLevel(state, 'events');
    if (reward?.gain) reward.gain *= 1 + level * .25;
    if (reward?.boost) {
      reward.boost.duration *= 1 + level * .15;
      reward.message = reward.message.replace(/por \d+ segundos/, `por ${reward.boost.duration / 1000} segundos`);
    }
    return reward;
  }
  function newState() {
    return { juice: 0, allTime: 0, runProduced: 0, prestigeBase: 0, owned: BUILDINGS.map(() => 0), upgrades: [], achievements: [], prestige: 0, prestigeEarned: 0, permanentUpgrades: {}, rebirths: 0, clicks: 0, skin: 'cup',
      eventStats: { total: 0, golden: 0, rain: 0, rush: 0, festival: 0, meteor: 0, harvest: 0 }, pendingEvent: null, activeBoost: null, nextEventAt: Date.now() + 65000, savedAt: Date.now() };
  }
  function normalize(raw) {
    const base = newState();
    if (!raw || typeof raw !== 'object') return base;
    const safe = n => Number.isFinite(n) && n >= 0 ? n : 0;
    const oldUpgrades = ['click1','click2','global1','click3','global2','click5'];
    const mapped = (Array.isArray(raw.upgrades) ? raw.upgrades : []).map(u => typeof u === 'number' ? oldUpgrades[u] : u);
    const allTime = safe(raw.allTime ?? raw.lifetime);
    const earned = Math.max(Math.floor(safe(raw.prestigeEarned ?? raw.prestige)), Math.floor(safe(raw.prestige)));
    const stats = Object.fromEntries(Object.keys(base.eventStats).map(id => [id, Math.floor(safe(raw.eventStats?.[id]))]));
    const pending = EVENTS.find(e => e.id === raw.pendingEvent?.id) && safe(raw.pendingEvent?.until) > Date.now() ? { id: raw.pendingEvent.id, until: raw.pendingEvent.until } : null;
    const boost = EVENTS.find(e => e.id === raw.activeBoost?.id) && safe(raw.activeBoost?.until) > Date.now()
      ? { id: raw.activeBoost.id, until: raw.activeBoost.until, production: Math.min(7, Math.max(1, safe(raw.activeBoost.production))), click: Math.min(7, Math.max(1, safe(raw.activeBoost.click))) } : null;
    return { ...base, juice: safe(raw.juice), allTime, runProduced: safe(raw.runProduced ?? raw.lifetime),
      prestigeBase: raw.prestigeBase === undefined ? prestigeThreshold(earned) : safe(raw.prestigeBase),
      owned: BUILDINGS.map((_, i) => Math.max(0, Math.floor(safe(raw.owned?.[i])))),
      upgrades: [...new Set(mapped)].filter(id => UPGRADES.some(u => u.id === id)),
      achievements: [...new Set(Array.isArray(raw.achievements) ? raw.achievements : [])].filter(id => ACHIEVEMENTS.some(a => a.id === id)),
      prestige: Math.floor(safe(raw.prestige)), rebirths: Math.floor(safe(raw.rebirths)), clicks: Math.floor(safe(raw.clicks)), skin: raw.skin === 'pedro67' ? 'pedro67' : 'cup',
      prestigeEarned: Math.max(Math.floor(safe(raw.prestigeEarned ?? raw.prestige)), Math.floor(safe(raw.prestige))),
      permanentUpgrades: Object.fromEntries(PERMANENT_UPGRADES.map(u => [u.id, Math.min(u.max, Math.floor(safe(raw.permanentUpgrades?.[u.id])))])),
      eventStats: stats, pendingEvent: pending, activeBoost: boost,
      nextEventAt: pending ? safe(raw.nextEventAt) || base.nextEventAt : Math.max(safe(raw.nextEventAt), raw.pendingEvent ? Date.now() + 45000 : 0) || base.nextEventAt,
      savedAt: safe(raw.savedAt) || Date.now() };
  }
  function rebirth(state) {
    const pending = prestigePending(state);
    if (!pending) return false;
    state.prestigeBase = prestigeProgress(state);
    state.prestige += pending;
    state.prestigeEarned = (state.prestigeEarned ?? state.prestige - pending) + pending;
    state.rebirths++;
    state.juice = starterJuice(state);
    state.runProduced = 0;
    state.owned = starterBuildings(state);
    state.upgrades = [];
    state.clicks = 0;
    state.pendingEvent = null;
    state.activeBoost = null;
    state.nextEventAt = Date.now() + eventDelay(state, 0);
    return pending;
  }
  const api = { BUILDINGS, UPGRADES, ACHIEVEMENTS, EVENTS, PERMANENT_UPGRADES, permanentLevel, permanentCost, buyPermanent, earnedNuts, offlineRate, offlineLimit, eventDelay, eventLifetime, starterJuice, starterBuildings, price, batchCost, affordableCount, prestigePotential, prestigeProgress, prestigePending, prestigeCost, upgradeUnlocked, production, clickPower, eventReward, newState, normalize, rebirth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
