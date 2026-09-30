/* Regras puras do jogo, compartilhadas pelo navegador e pelos testes. */
(function (root) {
  const stickers = typeof module !== 'undefined' && module.exports ? require('./stickers.js') : root.CajuStickers;
  const aura = typeof module !== 'undefined' && module.exports ? require('./aura.js') : root.CajuAura;
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
    ['Pomar quântico', '⚛️', 170000000000000, 430000000],
    ['Multiverso do caju', '🌀', 2100000000000000, 2900000000],
    ['Motor temporal', '⏳', 26000000000000000, 21000000000],
    ['Forja de estrelas', '🌠', 310000000000000000, 150000000000],
    ['Galáxia engarrafada', '🌌', 71000000000000000000, 1100000000000],
    ['Fonte primordial', '💫', 1.2e22, 8300000000000],
    ['Conselho dos cajus', '🏛️', 1.9e24, 6.4e13],
    ['Sonho engarrafado', '💭', 5.4e26, 5.1e14],
    ['Oceano de realidades', '🌊', 1e29, 4e15],
    ['Cajueiro do infinito', '🌳', 2e31, 3.3e16]
  ].map(([name, icon, base, cps], id) => ({ id, name, icon, base, cps }));

  const UPGRADES = [
    { id: 'click1', name: 'Copo resistente', icon: '🥛', description: 'Cliques produzem 2×.', cost: 100, unlock: 50, click: 2 },
    { id: 'click2', name: 'Caju escolhido', icon: '🍊', description: 'Cliques produzem 2×.', cost: 1000, unlock: 500, click: 2 },
    { id: 'click3', name: 'Receita da casa', icon: '📜', description: 'Cliques produzem 2×.', cost: 15000, unlock: 7500, click: 2 },
    { id: 'click4', name: 'Prensa dourada', icon: '✨', description: 'Cliques produzem 2×.', cost: 250000, unlock: 125000, click: 2 },
    { id: 'click5', name: 'Mestre do suco', icon: '🏆', description: 'Cliques produzem 2×.', cost: 10000000, unlock: 5000000, click: 2 },
    { id: 'click6', name: 'Prensa turbo', icon: '⚙️', description: 'Cliques produzem 2×.', cost: 100000000, unlock: 50000000, click: 2 },
    { id: 'click7', name: 'Toque de mestre', icon: '🤏', description: 'Cliques produzem 2×.', cost: 50000000000, unlock: 25000000000, click: 2 },
    { id: 'click8', name: 'Lenda do pomar', icon: '🌠', description: 'Cliques produzem 2×.', cost: 500000000000000, unlock: 250000000000000, click: 2 },
    { id: 'global1', name: 'Colheita cuidadosa', icon: '🧺', description: 'Toda a produção automática +5%.', cost: 5000, unlock: 2500, global: 1.05 },
    { id: 'global2', name: 'Distribuição rápida', icon: '⚡', description: 'Toda a produção automática +10%.', cost: 1000000, unlock: 500000, global: 1.1 },
    { id: 'global3', name: 'Safra especial', icon: '🌟', description: 'Toda a produção automática +15%.', cost: 100000000, unlock: 50000000, global: 1.15 },
    { id: 'global4', name: 'Caju infinito', icon: '♾️', description: 'Toda a produção automática +20%.', cost: 10000000000, unlock: 5000000000, global: 1.2 }
  ];
  UPGRADES.push(
    { id: 'global5', name: 'Cooperativa do caju', icon: '🤝', description: 'Toda a produção automática +5%.', cost: 120000, unlock: 60000, global: 1.05 },
    { id: 'global6', name: 'Ferrovias da safra', icon: '🚂', description: 'Toda a produção automática +10%.', cost: 120000000000, unlock: 60000000000, global: 1.1 },
    { id: 'global7', name: 'Comércio interplanetário', icon: '🪐', description: 'Toda a produção automática +15%.', cost: 200000000000000, unlock: 100000000000000, global: 1.15 },
    { id: 'global8', name: 'Universo do caju', icon: '🌌', description: 'Toda a produção automática +25%.', cost: 3000000000000000000, unlock: 1500000000000000000, global: 1.25 },
    { id: 'global9', name: 'Rede de pomares', icon: '🕸️', description: 'Toda a produção automática +10%.', cost: 30000000000000, unlock: 15000000000000, global: 1.1 },
    { id: 'global10', name: 'Receita multidimensional', icon: '🌀', description: 'Toda a produção automática +20%.', cost: 60000000000000000, unlock: 30000000000000000, global: 1.2 },
    { id: 'click9', name: 'Mãos do multiverso', icon: '🙌', description: 'Cliques produzem 2×.', cost: 20000000000000000, unlock: 10000000000000000, click: 2 }
  );
  // Patamares e preços do Cookie Clicker; IDs estáveis nas demais construções.
  const BUILDING_TIERS = [
    [1, 10, 'primeiro equipamento'], [5, 50, 'primeiros passos'], [25, 500, 'especialização'],
    [50, 5e4, 'excelência'], [100, 5e6, 'maestria'], [150, 5e8, 'automação avançada'],
    [200, 5e11, 'lenda'], [250, 5e14, 'evolução'], [300, 5e17, 'transcendência'],
    [350, 5e20, 'horizonte'], [400, 5e24, 'eternidade'], [450, 5e28, 'infinito'],
    [500, 5e32, 'origem'], [550, 5e36, 'nova dimensão'], [600, 5e40, 'última fronteira']
  ];
  BUILDINGS.slice(1).forEach(b => BUILDING_TIERS.forEach(([count, factor, title]) => {
    UPGRADES.push({ id: `b${b.id}-${count}`, name: `${b.name}: ${title}`, icon: b.icon,
      description: `Produção de ${b.name.toLowerCase()} 2×.`, cost: Math.ceil(b.base * factor),
      building: b.id, count, buildingMult: 2 });
  }));
  const FINGER_TIERS = [[25, 1e5, .1], [50, 1e7, 5], [100, 1e8, 10], [150, 1e9, 20],
    [200, 1e10, 20], [250, 1e13, 20], [300, 1e16, 20], [350, 1e19, 20],
    [400, 1e22, 20], [450, 1e25, 20], [500, 1e28, 20], [550, 1e31, 20], [600, 1e34, 20]];
  FINGER_TIERS.forEach(([count, cost, power], i) => UPGRADES.push({
    id: `b0-${count}`, name: `Espremedor: equipe ${count}`, icon: '✋', building: 0, count, cost,
    description: i ? `Bônus da equipe integrada ×${power}.` : 'Cada outro produtor acrescenta 0,1 copo ao clique e a cada espremedor.',
    ...(i ? { fingerMult: power } : { fingerBase: power })
  }));
  UPGRADES.push(
    ...[[2e7, 1.1, 'Controle de qualidade'], [2e9, 1.1, 'Logística inteligente'],
      [2e12, 1.15, 'Rede estelar'], [2e16, 1.15, 'Safra temporal'],
      [2e19, 1.2, 'Energia primordial'], [2e22, 1.25, 'Horizonte infinito']].map(([cost, global, name], i) =>
      ({ id: `expansion-global-${i}`, name, icon: '📈', description: `Produção automática ×${global.toLocaleString('pt-BR')}.`, cost, unlock: cost / 2, global })),
    ...[[2e6, .005, 'Gole produtivo'], [2e8, .005, 'Prensa sincronizada'], [2e11, .01, 'Fluxo industrial'],
      [2e14, .01, 'Pulso cósmico'], [2e18, .02, 'Toque temporal']].map(([cost, clickCps, name], i) =>
      ({ id: `expansion-click-${i}`, name, icon: '👆', description: `Cada clique recebe mais ${clickCps * 100}% da produção por segundo.`, cost, unlock: cost / 2, clickCps }))
  );
  UPGRADES.push(...[[9e6, .1, 10], [9e9, .125, 20], [9e12, .15, 30], [9e15, .175, 40], [9e18, .2, 50]].map(([cost, milk, achievementCount], i) => ({
    id: `aroma-${i}`, name: ['Aroma da safra', 'Aroma refinado', 'Essência do pomar', 'Essência estelar', 'Essência eterna'][i], icon: '🍃',
    description: `Produção aumenta com as conquistas: fator de aroma ${milk.toLocaleString('pt-BR')}.`, cost, unlock: cost / 2, milk, achievementCount
  })));
  BUILDINGS.slice(1).forEach(b => UPGRADES.push({ id: `synergy-${b.id}`, name: `${b.name}: cadeia integrada`, icon: '🤝',
    description: `Cada ${BUILDINGS[b.id - 1].name.toLowerCase()} aumenta a produção de ${b.name.toLowerCase()} em 1%.`,
    cost: b.base * 100, building: b.id, count: 15, synergy: b.id - 1 }));

  UPGRADES.filter(u => u.global).forEach(u => {
    u.global = 1 + Math.min(.05, (u.global - 1) / 5);
    u.description = `Toda a produção automática +${Math.round((u.global - 1) * 100)}%.`;
  });
  const clickBasics = [100, 500, 10000];
  UPGRADES.filter(u => /^click[123]$/.test(u.id)).forEach((u, i) => {
    u.cost = clickBasics[i]; u.building = 0; u.count = i === 2 ? 10 : 1;
    u.description = 'Cliques e produção base dos espremedores 2×.';
  });
  const clickAdvanced = UPGRADES.filter(u => /^click[4-9]$/.test(u.id));
  clickAdvanced.forEach((u, i) => {
    delete u.click; u.clickCps = .01; u.cost = 50000 * 100 ** i;
    u.unlock = 0; u.handmade = 1000 * 10 ** i;
    u.description = 'Cada clique recebe mais 1% da produção por segundo.';
  });
  UPGRADES.filter(u => u.id.startsWith('expansion-click')).forEach((u, i) => {
    u.cost = 5e16 * 100 ** i; u.clickCps = .01; u.handmade = 1e9 * 10 ** i; u.unlock = 0;
    u.description = 'Cada clique recebe mais 1% da produção por segundo.';
  });
  UPGRADES.filter(u => u.synergy !== undefined).forEach(u => {
    u.cost = (BUILDINGS[u.synergy].base * 10 + BUILDINGS[u.building].base) * 200000;
    u.unlock = 1e15; u.partnerCount = 15;
  });

  UPGRADES.push(...[[500, .01, 'Caju geladinho'], [5e4, .01, 'Receita da feira'],
    [5e6, .02, 'Polpa selecionada'], [5e9, .02, 'Sabor do sertão'], [5e12, .03, 'Reserva do pomar'],
    [5e15, .03, 'Néctar das estrelas'], [5e18, .04, 'Safra de outra dimensão'], [5e24, .05, 'Receita dos sonhos']]
    .map(([cost, bonus, name], i) => ({ id: `recipe-${i}`, name, icon: '🧃', cost, unlock: cost / 2,
      global: 1 + bonus, description: `Produção automática +${Math.round(bonus * 100)}%.` })));

  UPGRADES.push(...[1e7,1e10,1e13,1e16,1e19,1e22,1e25,1e28].map((cost,i) => ({id:`collection-recipe-${i}`,name:['Caju cristalino','Néctar dourado','Garrafa celeste','Polpa astral','Reserva temporal','Sabor primordial','Brinde universal','Última receita'][i],icon:'🍶',cost,unlock:cost/2,global:1.02,description:'Produção automática +2%.'})));
  const MISSIONS = [
    { id: 'first-machine', name: 'Abra sua barraca', description: 'Tenha seu primeiro produtor.', kind: 'buildings', at: 1 },
    { id: 'team', name: 'Equipe de respeito', description: 'Tenha 25 produtores.', kind: 'buildings', at: 25 },
    { id: 'company', name: 'Empresa do caju', description: 'Tenha 100 produtores.', kind: 'buildings', at: 100 },
    { id: 'mix', name: 'Pomar diverso', description: 'Tenha 3 tipos de produtores.', kind: 'diversity', at: 3 },
    { id: 'network', name: 'Rede da safra', description: 'Tenha 6 tipos de produtores.', kind: 'diversity', at: 6 },
    { id: 'empire', name: 'Império diverso', description: 'Tenha 10 tipos de produtores.', kind: 'diversity', at: 10 },
    { id: 'handmade', name: 'Feito com as mãos', description: 'Produza mil copos em cliques nesta safra.', kind: 'handmade', at: 1000 },
    { id: 'recipes', name: 'Livro de receitas', description: 'Compre 5 melhorias comuns.', kind: 'upgrades', at: 5 },
    { id: 'specialist', name: 'Especialista da safra', description: 'Compre 20 melhorias comuns.', kind: 'upgrades', at: 20 },
    { id: 'flow', name: 'Fluxo constante', description: 'Alcance 100 copos/s sem eventos.', kind: 'cps', at: 100 },
    { id: 'river', name: 'Rio de suco', description: 'Alcance 10 mil copos/s sem eventos.', kind: 'cps', at: 1e4 },
    { id: 'ocean', name: 'Oceano automático', description: 'Alcance 1 milhão de copos/s sem eventos.', kind: 'cps', at: 1e6 },
    ...[250, 500, 1000, 2500].map((at, i) => ({ id: `expansion-team-${at}`, name: ['Cooperativa da safra','Cidade produtiva','Mil ajudantes','Confederação do caju'][i], description: `Tenha ${at} produtores nesta safra.`, kind: 'buildings', at })),
    ...[50, 100, 200].map((at, i) => ({ id: `expansion-recipes-${at}`, name: ['Chef da safra','Receitas centenárias','Enciclopédia do sabor'][i], description: `Compre ${at} melhorias comuns nesta safra.`, kind: 'upgrades', at })),
    ...[1e8, 1e10, 1e12].map((at, i) => ({ id: `expansion-flow-${at}`, name: ['Rio estelar','Mar galáctico','Fonte infinita'][i], description: 'Alcance ' + ['100 milhões','10 bilhões','1 trilhão'][i] + ' copos/s sem bônus temporários.', kind: 'cps', at }))
  ];
  const ACHIEVEMENTS = [
    {id:'bulk-100',icon:'📦',name:'Atacado do caju',description:'Compre 100 ou mais unidades de um produtor em uma única compra.',kind:'batch',at:100},
    ...[12, 18, 22].map((at, i) => ({id:`collection-diversity-${at}`,icon:'🌈',name:['Doze sabores','Pomar universal','Todos os sabores'][i],kind:'diversity',at})),
    ...[50, 100, 200].map((at, i) => ({id:`collection-missions-${at}`,icon:'📜',name:['Contratante veterano','Cem contratos','Mestre dos contratos'][i],kind:'missions',at})),
    ...[1e21, 1e24, 1e30].map((at, i) => ({id:`collection-history-${at}`,icon:'🌠',name:['Memória estelar','Memória universal','Memória infinita'][i],kind:'allTime',at})),
    ...[200, 300, 400].map((at, i) => ({id:`collection-upgrades-${at}`,icon:'📚',name:['Duzentas receitas','Biblioteca do universo','Todas as páginas'][i],kind:'upgrades',at})),
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
  ACHIEVEMENTS.push(
    ...BUILDINGS.flatMap(b => [25, 100].map(at => ({ id: `producer-${b.id}-${at}`, icon: b.icon,
      name: `${at} ${b.name.toLowerCase()}`, kind: 'producer', building: b.id, at }))),
    ...[1e18, 1e21, 1e24, 1e27, 1e30].map((at, i) => ({ id: `juice-${at}`, icon: '🌌',
      name: ['Safra galáctica', 'Suco sem fronteiras', 'Sonhos de caju', 'Além da realidade', 'Infinito em um copo'][i], kind: 'run', at })),
    ...[1e5, 1e7, 1e9, 1e12].map((at, i) => ({ id: `handmade-${at}`, icon: '👆', name: ['Artesão do suco', 'Prensa humana', 'Mãos bilionárias', 'Artesão das estrelas'][i], kind: 'handmade', at })),
    ...[5, 20, 50, 100].map(at => ({ id: `upgrades-${at}`, icon: '📚', name: `${at} receitas dominadas`, kind: 'upgrades', at })),
    ...[100, 1e4, 1e6, 1e9].map(at => ({ id: `cps-${at}`, icon: '⚙️', name: `Produção ${at.toLocaleString('pt-BR')}/s`, kind: 'cps', at })),
    ...[3, 6, 12].map(at => ({ id: `diversity-${at}`, icon: '🧺', name: `${at} caminhos do caju`, kind: 'diversity', at })),
    ...[1, 12, 50].map(at => ({ id: `missions-${at}`, icon: '📋', name: `${at} desafios cumpridos`, kind: 'missions', at })),
    ...[['merchant', 'Negócio da feira'], ['aurora', 'Luzes no pomar'], ['breeze', 'Vento a favor']].map(([event, name]) =>
      ({ id: `${event}-event`, icon: '🎉', name, kind: 'event', event, at: 1 }))
  );
  const EVENTS = [
    { id: 'golden', icon: '🌟', name: 'Caju dourado', lifetime: 12000 },
    { id: 'rain', icon: '🌧️', name: 'Chuva de cajus', lifetime: 15000 },
    { id: 'rush', icon: '📦', name: 'Hora do pedido', lifetime: 15000 },
    { id: 'festival', icon: '🎊', name: 'Festival do caju', lifetime: 18000 },
    { id: 'meteor', icon: '☄️', name: 'Caju meteoro', lifetime: 13000 },
    { id: 'harvest', icon: '🌾', name: 'Grande colheita', lifetime: 17000 },
    { id: 'merchant', icon: '🛍️', name: 'Feira do caju', lifetime: 16000 },
    { id: 'aurora', icon: '🌈', name: 'Aurora do pomar', lifetime: 16000 },
    { id: 'breeze', icon: '🍃', name: 'Brisa da safra', lifetime: 18000 }
  ];

  const GOLDEN_LUCKY_CHANCE = .3;
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
  // Castanhas usam somente o saldo atual. O total já conquistado encarece novos níveis.
  const prestigePotential = balance => Math.floor(5 * Math.cbrt(Math.max(0, balance) / 1e9));
  function prestigeCost(state, count = 1) {
    const earned = earnedNuts(state);
    const cost = 8e6 * count * (3 * earned ** 2 + 3 * earned * count + count ** 2);
    return earned === 0 ? Math.max(1e9, cost) : cost;
  }
  function prestigePending(state) {
    let low = 0;
    let high = Math.min(Number.MAX_SAFE_INTEGER, prestigePotential(state.juice) + 1);
    while (low < high) {
      const mid = low + Math.ceil((high - low) / 2);
      if (prestigeCost(state, mid) <= state.juice) low = mid;
      else high = mid - 1;
    }
    return low;
  }
  const PERMANENT_UPGRADES = [
    { id: 'production', name: 'Raízes eternas', icon: '🌳', description: 'Produção automática +10% por nível (até +100%).', cost: 1, growth: 2, max: 10 },
    { id: 'click', name: 'Mãos da nova safra', icon: '🙌', description: 'Cliques +10% por nível (até +100%).', cost: 2, growth: 2, max: 10 },
    { id: 'starter', name: 'Kit de recomeço', icon: '🧺', description: 'Comece com 10.000 copos no nível 1; o kit dobra por nível.', cost: 1, growth: 2, max: 5 },
    { id: 'offline', name: 'Turno noturno', icon: '🌙', description: '+10 pontos percentuais de produção ausente por nível, até 100%.', cost: 1, growth: 2, max: 6 },
    { id: 'events', name: 'Calendário de ouro', icon: '🎉', description: 'Prêmios de eventos +25% e duração dos bônus +15% por nível.', cost: 2, growth: 2, max: 5 },
    { id: 'crew', name: 'Equipe veterana', icon: '👷', description: 'Por nível, comece com 10 espremedores e 2 barracas; um cajueiro a cada 3 níveis.', cost: 2, growth: 2, max: 5 },
    { id: 'synergy', name: 'Cooperativa eterna', icon: '🤝', description: '+0,5% de produção por tipo de produtor ativo, por nível.', cost: 3, growth: 2, max: 5 },
    { id: 'milk', name: 'Memórias da safra', icon: '🏅', description: 'Bônus de produção das conquistas +20% por nível.', cost: 2, growth: 2, max: 5 },
    { id: 'clickCps', name: 'Pulso industrial', icon: '⚙️', description: 'Cada clique recebe mais 0,1% da produção por segundo por nível.', cost: 3, growth: 2, max: 5 },
    { id: 'frequency', name: 'Estação de festas', icon: '🎊', description: 'Frequência de eventos +12% por nível; o intervalo entre eles diminui.', cost: 3, growth: 2, max: 5 },
    { id: 'window', name: 'Olhar atento', icon: '👀', description: '+20% de tempo para coletar eventos por nível.', cost: 1, growth: 2, max: 5 },
    { id: 'offlineTime', name: 'Reserva da madrugada', icon: '🌌', description: '+4 horas de produção ausente por nível, até 24 horas.', cost: 2, growth: 2, max: 5 },
    { id: 'recipes', name: 'Biblioteca ancestral', icon: '📚', description: '+1% de produção por 5 melhorias comuns, por nível.', cost: 8, growth: 3, max: 3 },
    { id: 'orchard', name: 'Raízes do sertão', icon: '🌵', description: '+1% de produção por 10 cajueiros, por nível.', cost: 12, growth: 3, max: 3 },
    { id: 'reserve', name: 'Reserva de eventos', icon: '🛍️', description: 'Prêmios instantâneos de eventos +5% por nível.', cost: 6, growth: 3, max: 3 },
    { id: 'apprentices', name: 'Escola de espremedores', icon: '🎓', description: 'Os 3 primeiros tipos de produtores rendem +10% por nível.', cost: 4, growth: 3, max: 3 },
    { id: 'industry', name: 'Engenharia ancestral', icon: '🏭', description: '+2% de produção por 100 produtores, por nível; limite de +20% por nível.', cost: 10, growth: 3, max: 3 },
    { id: 'precision', name: 'Toque de mestre', icon: '🖐️', description: 'Cliques +5% por nível, adicional a Mãos da nova safra.', cost: 4, growth: 3, max: 3 },
    { id: 'quality', name: 'Selo da safra', icon: '🏵️', description: '+5% de produção por nível ao possuir 10 tipos de produtores.', cost: 8, growth: 3, max: 3 },
    { id: 'contracts', name: 'Contratos eternos', icon: '📜', description: 'Prêmios de desafios usam +10% de tempo de produção por nível; continuam limitados a 2% do saldo.', cost: 6, growth: 3, max: 3 },
    { id: 'seedlings', name: 'Mudas da próxima vida', icon: '🌱', description: 'Comece cada safra com mais 2 cajueiros e 1 cozinha por nível.', cost: 8, growth: 3, max: 3 }
  ];
  const permanentLevel = (state, id) => state.permanentUpgrades?.[id] || 0;
  const permanentCost = (state, u) => u.cost * u.growth ** permanentLevel(state, u.id);
  const earnedNuts = state => state.prestigeEarned ?? state.prestige;
  const legacyBonus = state => 1 + earnedNuts(state) * .01;
  const offlineRate = state => Math.min(1, .4 + permanentLevel(state, 'offline') * .1);
  const offlineLimit = state => (4 + 4 * permanentLevel(state, 'offlineTime')) * 3600;
  const eventDelay = (state, random = Math.random()) => (90000 + random * 90000) / (1 + .12 * permanentLevel(state, 'frequency'));
  const eventLifetime = (state, event) => event.lifetime * (1 + .2 * permanentLevel(state, 'window'));
  const starterJuice = state => permanentLevel(state, 'starter') ? 10000 * 2 ** (permanentLevel(state, 'starter') - 1) : 0;
  const starterBuildings = state => BUILDINGS.map((_, i) => {
    const level = permanentLevel(state, 'crew');
    return i === 0 ? level * 10 : i === 1 ? level * 2 : i === 2 ? Math.floor(level / 3) + 2 * permanentLevel(state, 'seedlings') : i === 3 ? permanentLevel(state, 'seedlings') : 0;
  });
  function buyPermanent(state, id) {
    const u = PERMANENT_UPGRADES.find(item => item.id === id);
    if (!u || permanentLevel(state, id) >= u.max || state.prestige < permanentCost(state, u)) return false;
    state.prestige -= permanentCost(state, u);
    state.permanentUpgrades[id] = permanentLevel(state, id) + 1;
    return true;
  }
  function upgradeUnlocked(u, state) {
    return (u.building === undefined || state.owned[u.building] >= u.count)
      && state.runProduced >= (u.unlock || 0)
      && (state.handmade || 0) >= (u.handmade || 0)
      && state.achievements.length >= (u.achievementCount || 0)
      && (u.synergy === undefined || state.owned[u.synergy] >= u.partnerCount);
  }
  const boostMultiplier = timed => timed === true ? 7 : Number.isFinite(timed) && timed > 0 ? timed : 1;
  const basicClickMultiplier = state => UPGRADES.reduce((m, u) => m * (u.click && state.upgrades.includes(u.id) ? u.click : 1), 1);
  function fingerBonus(state) {
    const base = UPGRADES.find(u => u.fingerBase && state.upgrades.includes(u.id));
    if (!base) return 0;
    const multiplier = UPGRADES.reduce((m, u) => m * (u.fingerMult && state.upgrades.includes(u.id) ? u.fingerMult : 1), 1);
    return base.fingerBase * multiplier * state.owned.slice(1).reduce((sum, n) => sum + n, 0);
  }
  function production(state, timed = false) {
    const bought = new Set(state.upgrades);
    let cps = BUILDINGS.reduce((sum, b) => {
      const power = UPGRADES.reduce((m, u) => m * (u.building === b.id && bought.has(u.id) ? u.buildingMult || 1 : 1), 1);
      const synergy = UPGRADES.find(u => u.building === b.id && u.synergy !== undefined && bought.has(u.id));
      const unit = b.id === 0 ? b.cps * basicClickMultiplier(state) + fingerBonus(state) : b.cps * power;
      return sum + state.owned[b.id] * unit * (b.id < 3 ? 1 + .1 * permanentLevel(state, 'apprentices') : 1) * (synergy ? 1 + state.owned[synergy.synergy] * .01 : 1);
    }, 0);
    cps *= UPGRADES.reduce((m, u) => m * (u.global && bought.has(u.id) ? u.global : 1), 1);
    const aroma = state.achievements.length * .04 * (1 + permanentLevel(state, 'milk') * .2);
    cps *= UPGRADES.reduce((m, u) => m * (u.milk && bought.has(u.id) ? 1 + aroma * u.milk : 1), 1);
    cps *= legacyBonus(state) * (1 + .1 * permanentLevel(state, 'production'));
    cps *= 1 + state.owned.filter(count => count > 0).length * .005 * permanentLevel(state, 'synergy');
    cps *= 1 + Math.floor(state.upgrades.length / 5) * .01 * permanentLevel(state, 'recipes');
    cps *= 1 + Math.floor(state.owned[2] / 10) * .01 * permanentLevel(state, 'orchard');
    cps *= 1 + Math.min(10, Math.floor(state.owned.reduce((a,b) => a + b, 0) / 100)) * .02 * permanentLevel(state, 'industry');
    cps *= 1 + (state.owned.filter(n => n > 0).length >= 10 ? .05 * permanentLevel(state, 'quality') : 0);
    return cps * boostMultiplier(timed);
  }
  function clickPower(state, timed = false, productionTimed = false) {
    const fraction = .001 * permanentLevel(state, 'clickCps') + UPGRADES.reduce((sum, u) => sum + (state.upgrades.includes(u.id) ? u.clickCps || 0 : 0), 0);
    return (basicClickMultiplier(state) + fingerBonus(state) + production(state, productionTimed) * fraction)
      * (1 + .1 * permanentLevel(state, 'click')) * (1 + .05 * permanentLevel(state, 'precision')) * boostMultiplier(timed);
  }
  function baseEventReward(state, id, lucky = false) {
    if (id === 'golden') return lucky
      ? { gain: Math.min(state.juice * .15, production(state) * 900) + 13, message: 'Caju dourado: prêmio instantâneo!' }
      : { boost: { id, production: 7, click: 1, duration: 77000 }, message: 'Safra dourada: produção 7× por 77 segundos!' };
    if (id === 'rain') return { gain: Math.min(state.juice * .05, production(state) * 60) + 13, message: 'Chuva de cajus: copos extras!' };
    if (id === 'rush') return { boost: { id, production: 2, click: 5, duration: 35000 }, message: 'Hora do pedido: produção 2× e clique 5× por 35 segundos!' };
    if (id === 'festival') return { boost: { id, production: 3, click: 3, duration: 45000 }, message: 'Festival do caju: produção e clique 3× por 45 segundos!' };
    if (id === 'meteor') return { gain: Math.min(state.juice * .1, production(state) * 120) + 13, message: 'Caju meteoro: copos do espaço!' };
    if (id === 'harvest') return { boost: { id, production: 4, click: 2, duration: 35000 }, message: 'Grande colheita: produção 4× e clique 2× por 35 segundos!' };
    if (id === 'merchant') return { gain: Math.min(state.juice * .1, production(state) * 180) + 13, message: 'Feira do caju: pedido especial entregue!' };
    if (id === 'aurora') return { boost: { id, production: 2, click: 1, duration: 60000 }, message: 'Aurora do pomar: produção 2× por 60 segundos!' };
    if (id === 'breeze') return { boost: { id, production: 1, click: 3, duration: 40000 }, message: 'Brisa da safra: clique 3× por 40 segundos!' };
    return null;
  }
  function eventReward(state, id, lucky = false) {
    const reward = baseEventReward(state, id, lucky);
    const level = permanentLevel(state, 'events');
    if (reward?.gain) reward.gain *= (1 + level * .25) * (1 + .05 * permanentLevel(state, 'reserve'));
    if (reward?.boost) {
      reward.boost.duration *= 1 + level * .15;
      reward.message = reward.message.replace(/por \d+ segundos/, `por ${reward.boost.duration / 1000} segundos`);
    }
    return reward;
  }
  function buyBuilding(state, building, count) {
    if (!Number.isSafeInteger(count) || count < 1 || BUILDINGS[building?.id] !== building) return false;
    const cost = batchCost(building, state.owned[building.id], count);
    if (!Number.isFinite(cost) || state.juice + 1e-8 < cost) return false;
    state.juice = Math.max(0, state.juice - cost);
    state.owned[building.id] += count;
    state.maxBatchPurchase = Math.max(state.maxBatchPurchase || 0, count);
    return true;
  }
  function newState() {
    return { juice: 0, allTime: 0, runProduced: 0, owned: BUILDINGS.map(() => 0), upgrades: [], achievements: [], prestige: 0, prestigeEarned: 0, permanentUpgrades: {}, rebirths: 0, clicks: 0, maxBatchPurchase: 0, skin: 'cup',
      eventStats: Object.fromEntries(['total', ...EVENTS.map(e => e.id)].map(id => [id, 0])), claimedMissions: [], missionsCompleted: 0, pendingEvent: null, activeBoost: null, aura: aura.normalize(null), handmade: 0, nextEventAt: Date.now() + 90000, savedAt: Date.now() };
  }
  function normalize(raw) {
    const base = newState();
    if (!raw || typeof raw !== 'object') return base;
    const safe = n => Number.isFinite(n) && n >= 0 ? n : 0;
    const oldUpgrades = ['click1','click2','global1','click3','global2','click5'];
    const mapped = (Array.isArray(raw.upgrades) ? raw.upgrades : []).map(u => {
      let id = typeof u === 'number' ? oldUpgrades[u] : u;
      const oldCursor = { 'b0-1': 'click1', 'b0-5': 'click2', 'b0-10': 'click3' };
      if (oldCursor[id]) return oldCursor[id];
      // Patamares extras antigos não duplicam mais os bônus do mesmo estágio.
      if (/^b\d+-(10|75)$/.test(id)) id = id.replace(/-(10|75)$/, (_, count) => count === '10' ? '-25' : '-100');
      return id;
    });
    const allTime = safe(raw.allTime ?? raw.lifetime);
    const earned = Math.max(Math.floor(safe(raw.prestigeEarned ?? raw.prestige)), Math.floor(safe(raw.prestige)));
    const stats = Object.fromEntries(Object.keys(base.eventStats).map(id => [id, Math.floor(safe(raw.eventStats?.[id]))]));
    const pending = EVENTS.find(e => e.id === raw.pendingEvent?.id) && safe(raw.pendingEvent?.until) > Date.now() ? { id: raw.pendingEvent.id, until: raw.pendingEvent.until } : null;
    const maxEventAt = Date.now() + 180000 / (1 + .12 * Math.min(5, Math.floor(safe(raw.permanentUpgrades?.frequency))));
    const boost = EVENTS.find(e => e.id === raw.activeBoost?.id) && safe(raw.activeBoost?.until) > Date.now()
      ? { id: raw.activeBoost.id, until: raw.activeBoost.until, production: Math.min(7, Math.max(1, safe(raw.activeBoost.production))), click: Math.min(7, Math.max(1, safe(raw.activeBoost.click))) } : null;
    return { ...base, juice: safe(raw.juice), allTime, runProduced: safe(raw.runProduced ?? raw.lifetime),
      owned: BUILDINGS.map((_, i) => Math.max(0, Math.floor(safe(raw.owned?.[i])))),
      upgrades: [...new Set(mapped)].filter(id => UPGRADES.some(u => u.id === id)),
      achievements: [...new Set(Array.isArray(raw.achievements) ? raw.achievements : [])].filter(id => ACHIEVEMENTS.some(a => a.id === id)),
      prestige: Math.floor(safe(raw.prestige)), rebirths: Math.floor(safe(raw.rebirths)), clicks: Math.floor(safe(raw.clicks)), skin: stickers.normalizeSkin(raw.skin),
      prestigeEarned: earned, maxBatchPurchase: Math.floor(safe(raw.maxBatchPurchase)), handmade: safe(raw.handmade),
      permanentUpgrades: Object.fromEntries(PERMANENT_UPGRADES.map(u => [u.id, Math.min(u.max, Math.floor(safe(raw.permanentUpgrades?.[u.id])))])),
      claimedMissions: [...new Set(Array.isArray(raw.claimedMissions) ? raw.claimedMissions : [])].filter(id => MISSIONS.some(m => m.id === id)),
      missionsCompleted: Math.max(Math.floor(safe(raw.missionsCompleted)), new Set((Array.isArray(raw.claimedMissions) ? raw.claimedMissions : []).filter(id => MISSIONS.some(m => m.id === id))).size),
      eventStats: stats, pendingEvent: pending, activeBoost: boost, aura: aura.normalize(raw.aura),
      nextEventAt: pending ? safe(raw.nextEventAt) || base.nextEventAt : Math.min(maxEventAt, Math.max(safe(raw.nextEventAt), raw.pendingEvent ? Date.now() + 45000 : 0) || base.nextEventAt),
      savedAt: safe(raw.savedAt) || Date.now() };
  }
  function rebirth(state) {
    const pending = prestigePending(state);
    if (!pending) return false;
    delete state.prestigeBase;
    state.prestige += pending;
    state.prestigeEarned = (state.prestigeEarned ?? state.prestige - pending) + pending;
    state.rebirths++;
    state.juice = starterJuice(state);
    state.runProduced = 0;
    state.owned = starterBuildings(state);
    state.upgrades = [];
    state.clicks = 0;
    state.handmade = 0;
    state.claimedMissions = [];
    state.pendingEvent = null;
    state.activeBoost = null;
    state.aura = aura.normalize(null);
    state.nextEventAt = Date.now() + eventDelay(state, 0);
    return pending;
  }
  function progressValue(state, goal, cps) {
    if (goal.kind === 'batch') return state.maxBatchPurchase || 0;
    if (goal.kind === 'run') return state.runProduced;
    if (goal.kind === 'allTime') return state.allTime;
    if (goal.kind === 'buildings') return state.owned.reduce((sum, n) => sum + n, 0);
    if (goal.kind === 'producer') return state.owned[goal.building] || 0;
    if (goal.kind === 'diversity') return state.owned.filter(n => n > 0).length;
    if (goal.kind === 'upgrades') return state.upgrades.length;
    if (goal.kind === 'handmade') return state.handmade || 0;
    if (goal.kind === 'cps') return cps ?? production(state);
    if (goal.kind === 'missions') return state.missionsCompleted || 0;
    if (goal.kind === 'prestige') return earnedNuts(state);
    if (goal.kind === 'events') return state.eventStats.total;
    if (goal.kind === 'event') return state.eventStats[goal.event] || 0;
    if (goal.kind === 'clicks') return state.clicks;
    return goal.kind === 'rebirths' ? state.rebirths : 0;
  }
  const missionReward = (state, cps = production(state)) => Math.max(1, Math.floor(Math.min(state.juice * .02, Math.max(1, cps) * 60 * (1 + .1 * permanentLevel(state, 'contracts')))));
  function claimMission(state, id) {
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission || state.claimedMissions.includes(id) || progressValue(state, mission) < mission.at) return false;
    const gain = missionReward(state);
    state.claimedMissions.push(id);
    state.missionsCompleted++;
    state.juice += gain; state.runProduced += gain; state.allTime += gain;
    return gain;
  }
  function selectEvent(random = Math.random()) {
    const weights = [.4, .08, .1, .08, .05, .07, .04, .1, .08];
    let accumulated = 0;
    for (let i = 0; i < EVENTS.length; i++) {
      accumulated += weights[i];
      if (random < accumulated) return EVENTS[i];
    }
    return EVENTS[EVENTS.length - 1];
  }
  const api = { buyBuilding, GOLDEN_LUCKY_CHANCE, MISSIONS, progressValue, missionReward, claimMission, selectEvent, BUILDINGS, UPGRADES, ACHIEVEMENTS, EVENTS, PERMANENT_UPGRADES, permanentLevel, permanentCost, buyPermanent, earnedNuts, offlineRate, offlineLimit, eventDelay, eventLifetime, starterJuice, starterBuildings, price, batchCost, affordableCount, prestigePotential, prestigePending, prestigeCost, upgradeUnlocked, production, clickPower, eventReward, newState, normalize, rebirth };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
