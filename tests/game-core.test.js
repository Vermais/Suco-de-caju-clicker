const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../dist/game-core.js');

test('compras em lote somam o preço individual e não excedem o saldo', () => {
  const b = C.BUILDINGS[0];
  const ten = C.batchCost(b, 0, 10);
  const manual = Array.from({ length: 10 }, (_, i) => C.price(b, i)).reduce((a, n) => a + n, 0);
  assert.equal(ten, manual);
  assert.equal(C.affordableCount(b, 0, ten), 10);
  assert.equal(C.affordableCount(b, 0, ten - 1), 9);
  assert.equal(C.affordableCount(b, 0, 0), 0);
});

test('melhorias e castanhas aumentam a produção prevista', () => {
  const state = C.newState();
  state.owned[0] = 10;
  assert.equal(C.production(state), 1);
  state.upgrades.push('click1');
  assert.equal(C.production(state), 2);
  state.prestige = 2;
  state.prestigeEarned = 2;
  assert.equal(C.production(state), 2.04);
  assert.ok(Math.abs(C.production(state, true) - 14.28) < 1e-10);
});

test('renascimento preserva histórico, castanhas e conquistas e zera a safra', () => {
  const state = C.newState();
  state.allTime = 8e9;
  state.runProduced = 8e9;
  state.juice = 8e9;
  state.owned[2] = 5;
  state.upgrades.push('click1');
  state.achievements.push('juice-1');
  assert.equal(C.prestigePending(state), 10);
  assert.equal(C.rebirth(state), 10);
  assert.equal(state.prestige, 10);
  assert.equal(state.juice, 0);
  assert.equal(state.owned[2], 0);
  assert.deepEqual(state.upgrades, []);
  assert.equal(state.allTime, 8e9);
  assert.deepEqual(state.achievements, ['juice-1']);
  assert.equal(C.prestigePending(state), 0);
});

test('salvamento anterior é migrado sem perder saldo nem construções', () => {
  const state = C.normalize({ juice: 500, lifetime: 1000, owned: [2, 1], upgrades: [0], savedAt: 123 });
  assert.equal(state.juice, 500);
  assert.equal(state.allTime, 1000);
  assert.equal(state.owned[0], 2);
  assert.equal(state.owned[1], 1);
  assert.deepEqual(state.upgrades, ['click1']);
});

test('novas melhorias liberam por progresso e bônus distintos afetam clique e produção', () => {
  const state = C.newState();
  state.owned[1] = 5;
  assert.equal(C.upgradeUnlocked(C.UPGRADES.find(u => u.id === 'b1-5'), state), true);
  state.upgrades.push('b1-5');
  assert.equal(C.production(state), 10);
  assert.equal(C.production(state, 2), 20);
  assert.equal(C.clickPower(state, 5), 5);
  assert.equal(new Set(C.UPGRADES.map(u => u.id)).size, C.UPGRADES.length);
  assert.equal(new Set(C.ACHIEVEMENTS.map(a => a.id)).size, C.ACHIEVEMENTS.length);
});

test('eventos têm recompensas distintas e mantêm seus dados no salvamento', () => {
  const state = C.newState();
  assert.equal(C.eventReward(state, 'rain').gain, 13);
  assert.equal(C.eventReward(state, 'golden', true).gain, 13);
  assert.equal(C.eventReward(state, 'rush').boost.click, 5);
  assert.equal(C.eventReward(state, 'festival').boost.duration, 45000);
  state.eventStats.total = 2;
  state.eventStats.rain = 2;
  state.pendingEvent = { id: 'festival', until: Date.now() + 10000 };
  state.activeBoost = { id: 'rush', production: 2, click: 5, until: Date.now() + 20000 };
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.pendingEvent.id, 'festival');
  assert.equal(restored.activeBoost.click, 5);
  assert.equal(restored.eventStats.rain, 2);
  restored.allTime = 1e9;
  restored.juice = 1e9;
  restored.runProduced = 1e9;
  C.rebirth(restored);
  assert.equal(restored.pendingEvent, null);
  assert.equal(restored.activeBoost, null);
  assert.equal(restored.eventStats.total, 2);
});

test('partidas com a antiga proteção carregam sem o bloqueio', () => {
  const state = C.normalize({ juice: 42, clickDefense: { cooldownUntil: Date.now() + 30000 } });
  assert.equal(state.juice, 42);
  assert.equal(state.clickDefense, undefined);
});

test('skin escolhida sobrevive ao salvamento e ao renascimento', () => {
  const state = C.normalize({ ...C.newState(), skin: 'pedro67', allTime: 1e9, juice: 1e9, runProduced: 1e9 });
  assert.equal(state.skin, 'pedro67');
  C.rebirth(state);
  assert.equal(state.skin, 'pedro67');
  assert.equal(C.normalize({ skin: 'desconhecida' }).skin, 'cup');
});

test('novos prédios e eventos são incluídos em partidas antigas', () => {
  const state = C.normalize({ owned: Array(12).fill(1), eventStats: { total: 3, golden: 3 } });
  assert.equal(state.owned.length, 22);
  assert.equal(state.owned[13], 0);
  assert.equal(state.eventStats.meteor, 0);
  assert.ok(C.eventReward(state, 'meteor').gain >= 13);
  assert.equal(C.eventReward(state, 'harvest').boost.production, 4);
});

test('saldo atual determina castanhas, e produção histórica não permite renascer', () => {
  const state = C.newState();
  state.allTime = 1e30;
  state.runProduced = 1e25;
  state.prestigeBase = 1e30;
  state.juice = 10;
  assert.equal(C.prestigePending(state), 0);
  assert.equal(C.rebirth(state), false);
  state.juice = 1e9;
  assert.equal(C.prestigePending(state), 5);
  state.juice -= 1; // Uma compra tira o saldo do primeiro patamar.
  assert.equal(C.prestigePending(state), 0);
  state.juice += 1;
  assert.equal(C.rebirth(state), 5);
  assert.equal(state.juice, 0);
  assert.equal(C.rebirth(state), false);
  assert.equal(C.prestigeCost(state), 728e6);
  state.juice = 728e6 - 1;
  assert.equal(C.prestigePending(state), 0);
  state.juice++;
  assert.equal(C.rebirth(state), 1);
  assert.equal(state.prestigeEarned, 6);
  assert.equal(C.prestigeCost(state), 1016e6);
  assert.equal(C.rebirth(C.normalize(JSON.parse(JSON.stringify(state)))), false);
});

test('primeiras cinco castanhas compram um pacote útil e os efeitos persistem', () => {
  const state = C.newState();
  state.juice = 1e9;
  C.rebirth(state);
  for (const id of ['production', 'starter', 'click', 'offline']) assert.equal(C.buyPermanent(state, id), true);
  assert.equal(state.prestige, 0);
  assert.equal(state.prestigeEarned, 5);
  state.owned[0] = 10;
  assert.equal(C.production(state), 1.05 * 1.1);
  assert.equal(C.clickPower(state), 1.1);
  assert.equal(C.offlineRate(state), .5);
  assert.equal(C.permanentCost(state, C.PERMANENT_UPGRADES[0]), 2);
  state.juice = C.prestigeCost(state);
  C.rebirth(state);
  assert.equal(state.juice, 10000);
  assert.equal(state.runProduced, 0);
  assert.equal(C.prestigePending(state), 0);
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.permanentUpgrades.production, 1);
  assert.equal(restored.prestigeEarned, 6);
  assert.equal(C.buyPermanent(C.newState(), 'production'), false);
});

test('curva cúbica usa saldo exato, compras reduzem recompensa e rebirth consome sobras', () => {
  const state = C.newState();
  for (const [balance, expected] of [[999999999,0],[1e9,5],[1728e6-1,5],[1728e6,6],[8e9,10],[27e9,15]]) {
    state.juice = balance;
    assert.equal(C.prestigePending(state), expected);
  }
  state.juice = 8e9;
  state.juice -= 7e9;
  assert.equal(C.prestigePending(state), 5);
  state.juice = 1.5e9;
  assert.equal(C.rebirth(state), 5);
  assert.equal(state.juice, 0);
  assert.equal(C.prestigeCost(state), 728e6);
  C.buyPermanent(state, 'production');
  assert.equal(C.prestigeCost(state), 728e6);
  state.juice = 228e6;
  assert.equal(C.prestigePending(state), 0); // Os 500 milhões de sobra não carregam.
  state.juice = 728e6;
  assert.equal(C.rebirth(state), 1);
});

test('salvamentos antigos mantêm castanhas e buffs, sem recuperar progresso histórico', () => {
  const old = { prestige: 3, prestigeEarned: 20, prestigeBase: 1e30, allTime: 1e30, runProduced: 1e25, juice: 42, permanentUpgrades: { production: 3 }, owned: [5] };
  const state = C.normalize(old);
  assert.equal(state.prestigeBase, undefined);
  assert.equal(state.prestige, 3);
  assert.equal(state.prestigeEarned, 20);
  assert.equal(state.juice, 42);
  assert.equal(state.owned[0], 5);
  assert.equal(state.permanentUpgrades.production, 3);
  assert.equal(C.prestigePending(state), 0);
  assert.equal(C.prestigeCost(state), 10.088e9);
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  restored.juice = C.prestigeCost(restored);
  assert.equal(C.rebirth(restored), 1);
  assert.equal(C.prestigePending(C.normalize(JSON.parse(JSON.stringify(restored)))), 0);
});

test('novos buffs afetam produção, clique, eventos, coleta e horas ausentes', () => {
  const state = C.normalize({ prestige: 100, owned: [1000, 100], achievements: ['juice-1', 'juice-10'] });
  const before = C.production(state);
  assert.equal(C.buyPermanent(state, 'synergy'), true);
  assert.equal(C.production(state), before * 1.01);
  state.upgrades.push('aroma-0');
  const synergy = C.production(state);
  assert.equal(C.buyPermanent(state, 'milk'), true);
  assert.ok(C.production(state) > synergy);
  const click = C.clickPower(state);
  assert.equal(C.buyPermanent(state, 'clickCps'), true);
  assert.ok(C.clickPower(state) > click);
  const reward = C.eventReward(state, 'rain').gain;
  assert.equal(C.buyPermanent(state, 'events'), true);
  assert.equal(C.eventReward(state, 'rain').gain, reward * 1.25);
  assert.ok(Math.abs(C.eventReward(state, 'harvest').boost.duration - 40250) < 1e-8);
  const delay = C.eventDelay(state, 0);
  assert.equal(C.buyPermanent(state, 'frequency'), true);
  assert.equal(C.eventDelay(state, 0), delay / 1.12);
  const event = C.EVENTS[0];
  assert.equal(C.buyPermanent(state, 'window'), true);
  assert.equal(C.eventLifetime(state, event), event.lifetime * 1.2);
  assert.equal(C.buyPermanent(state, 'offlineTime'), true);
  assert.equal(C.offlineLimit(state), 8 * 3600);
  state.permanentUpgrades.offlineTime = 5;
  assert.equal(C.offlineLimit(state), 24 * 3600);
  for (const u of C.PERMANENT_UPGRADES) {
    state.permanentUpgrades[u.id] = u.max;
    assert.equal(C.buyPermanent(state, u.id), false);
  }
});

test('equipe inicial é entregue após rebirth e persiste sem produção gratuita', () => {
  const state = C.normalize({ prestige: 5, runProduced: 2e9, juice: 2e9 });
  assert.equal(C.buyPermanent(state, 'crew'), true);
  assert.equal(state.owned[0], 0);
  assert.ok(C.rebirth(state) > 0);
  assert.equal(state.owned[0], 10);
  assert.equal(state.owned[1], 2);
  assert.ok(C.production(state) > 0);
  assert.equal(state.runProduced, 0);
  assert.equal(C.prestigePending(state), 0);
  assert.equal(C.normalize(JSON.parse(JSON.stringify(state))).permanentUpgrades.crew, 1);
});

test('novos produtores têm custos e produção crescentes, melhorias e sinergias reais', () => {
  assert.equal(C.BUILDINGS.length, 22);
  assert.equal(C.PERMANENT_UPGRADES.length, 15);
  assert.equal(new Set(C.PERMANENT_UPGRADES.map(u => u.id)).size, 15);
  for (let i = 1; i < C.BUILDINGS.length; i++) {
    assert.ok(C.BUILDINGS[i].base > C.BUILDINGS[i-1].base);
    assert.ok(C.BUILDINGS[i].cps > C.BUILDINGS[i-1].cps);
  }
  const state = C.newState();
  state.owned[14] = 15;
  state.owned[13] = 100;
  const before = C.production(state);
  state.runProduced = 1e15;
  const u = C.UPGRADES.find(u => u.id === 'synergy-14');
  assert.equal(C.upgradeUnlocked(u, state), true);
  state.upgrades.push(u.id);
  assert.equal(C.production(state) - before, 15 * C.BUILDINGS[14].cps);
  assert.ok(C.UPGRADES.find(u => u.id === 'b17-500'));
  state.handmade = 1e9;
  state.runProduced = 1e18;
  const click = C.UPGRADES.find(u => u.id === 'expansion-click-0');
  assert.equal(C.upgradeUnlocked(click, state), true);
  const power = C.clickPower(state);
  state.upgrades.push(click.id);
  assert.ok(C.clickPower(state) > power);
});


test('economia usa 15% por produtor, dobro por melhoria e aroma proporcional às conquistas', () => {
  const b = C.BUILDINGS[2];
  assert.equal(C.price(b, 1), Math.ceil(b.base * 1.15));
  for (const u of C.UPGRADES.filter(u => u.click)) assert.equal(u.click, 2);
  for (const u of C.UPGRADES.filter(u => u.global)) assert.ok(u.global <= 1.25 && u.global > 1);
  const tier = C.UPGRADES.find(u => u.id === 'b2-100');
  assert.equal(tier.cost, b.base * 5e6);
  const state = C.newState();
  state.owned[2] = 100;
  const before = C.production(state);
  state.upgrades.push(tier.id);
  assert.equal(C.production(state), before * 2);
  const aroma = C.UPGRADES.find(u => u.id === 'aroma-0');
  state.runProduced = 9e6;
  assert.equal(C.upgradeUnlocked(aroma, state), false);
  state.achievements = C.ACHIEVEMENTS.slice(0,10).map(a=>a.id);
  assert.equal(C.upgradeUnlocked(aroma, state), true);
  const noAroma = C.production(state);
  state.upgrades.push(aroma.id);
  assert.ok(Math.abs(C.production(state) / noAroma - 1.04) < 1e-10);
});


test('contagem funciona para castanhas antigas mesmo com saldo menor que um bilhão', () => {
  const state = C.normalize({ prestige: 1, juice: 208e6 });
  assert.equal(C.prestigePending(state), 2);
  state.juice = 208e6 - 1;
  assert.equal(C.prestigePending(state), 1);
});

test('clique começa em 1 e só ganha fração de CpS após comprar a melhoria', () => {
  const state = C.newState();
  state.owned[7] = 100;
  assert.equal(C.clickPower(state), 1);
  const u = C.UPGRADES.find(u => u.id === 'click4');
  state.runProduced = 1e9;
  assert.equal(C.upgradeUnlocked(u, state), false);
  state.handmade = 1000;
  assert.equal(C.upgradeUnlocked(u, state), true);
  state.upgrades.push(u.id);
  assert.equal(C.clickPower(state), 1 + C.production(state) * .01);
  assert.ok(Math.abs(C.clickPower(state, 1, 7) - (1 + C.production(state) * .07)) < 1e-8);
  state.upgrades.push('click5');
  assert.equal(C.clickPower(state), 1 + C.production(state) * .02);
});

test('eventos respeitam banco e tempo de produção, sem premiar poder do autoclick', () => {
  const state = C.newState();
  state.owned[1] = 100;
  state.juice = 1000;
  assert.equal(C.eventReward(state, 'golden', true).gain, 163);
  state.juice = 1e9;
  assert.equal(C.eventReward(state, 'golden', true).gain, 90013);
  const reward = C.eventReward(state, 'golden', true).gain;
  state.permanentUpgrades.click = 10;
  assert.equal(C.eventReward(state, 'golden', true).gain, reward);
  assert.equal(C.eventDelay(state, 0), 300000);
  assert.equal(C.eventDelay(state, 1), 900000);
  assert.equal(C.eventReward(state, 'golden').boost.duration, 77000);
  assert.equal(C.eventReward(state, 'golden').boost.click, 1);
});

test('buffs permanentes de clique e produção crescem de forma aditiva', () => {
  const state = C.newState();
  state.owned[7] = 10;
  const cps = C.production(state);
  state.permanentUpgrades.production = 10;
  state.permanentUpgrades.click = 10;
  assert.equal(C.production(state), cps * 2);
  assert.equal(C.clickPower(state), 2);
  state.achievements = C.ACHIEVEMENTS.map(a => a.id);
  assert.equal(C.production(state), cps * 2); // Conquistas precisam da linha Aroma.
});

test('patamares normais têm custos de referência e extras antigos não duplicam bônus', () => {
  for (const [count, factor] of [[1,10],[5,50],[25,500],[50,5e4],[100,5e6],[150,5e8]]) {
    const upgrade = C.UPGRADES.find(u => u.id === `b2-${count}`);
    assert.equal(upgrade.cost, 1100 * factor);
  }
  const state = C.normalize({ owned: [10,25], upgrades: ['b0-1','b0-5','b0-10','b1-10','b1-25','b1-75','b1-100'] });
  assert.deepEqual(state.upgrades, ['click1','click2','click3','b1-25','b1-100']);
  assert.equal(C.clickPower(state), 8);
  assert.equal(C.production(state), 108);
});

test('perfil de um bilhão tem investimentos limitados e não carrega prestígio inflado', () => {
  const { balancedProfile } = require('../scripts/balanced-profile.js');
  const state = balancedProfile();
  assert.equal(state.juice, 1e9);
  assert.ok(state.allTime <= 1.25e9);
  assert.equal(state.rebirths, 0);
  assert.equal(C.earnedNuts(state), 0);
  assert.deepEqual(state.permanentUpgrades, {});
  assert.ok(state.owned.slice(8).every(n => n === 0));
  assert.ok(state.upgrades.every(id => C.upgradeUnlocked(C.UPGRADES.find(u => u.id === id), state)));
  assert.ok(C.production(state) > 1e4 && C.production(state) < 1e6);
  assert.equal(C.prestigePending(state), 5);
  assert.equal(C.production(C.normalize(JSON.parse(JSON.stringify(state)))), C.production(state));
});

test('expansão preserva partidas antigas e inclui produtores, eventos e desafios', () => {
  const old = { juice: 12345, owned: Array(18).fill(5), prestige: 3, prestigeEarned: 9, upgrades: ['click4'], achievements: ['juice-1'], permanentUpgrades: { production: 2 } };
  const state = C.normalize(old);
  assert.equal(state.juice, old.juice);
  assert.deepEqual(state.owned.slice(0,18), old.owned);
  assert.deepEqual(state.owned.slice(18), [0,0,0,0]);
  assert.equal(state.permanentUpgrades.production, 2);
  assert.equal(state.permanentUpgrades.recipes, 0);
  assert.equal(state.eventStats.aurora, 0);
  assert.deepEqual(state.claimedMissions, []);
  assert.equal(state.missionsCompleted, 0);
  assert.equal(state.prestigeEarned, 9);
  for (let id = 18; id < 22; id++) {
    assert.ok(C.UPGRADES.find(u => u.id === `b${id}-600`));
    assert.ok(C.UPGRADES.find(u => u.id === `synergy-${id}`));
  }
});

test('desafios exigem objetivo, pagam uma vez e contabilizam saldo e histórico', () => {
  const state = C.newState();
  assert.equal(C.claimMission(state,'first-machine'), false);
  assert.equal(C.claimMission(state,'inexistente'), false);
  state.owned[0] = 1; state.juice = 1000;
  const before = state.juice;
  const reward = C.claimMission(state,'first-machine');
  assert.equal(reward, 20);
  assert.equal(state.juice, before + reward);
  assert.equal(state.runProduced, reward);
  assert.equal(state.allTime, reward);
  assert.equal(state.missionsCompleted, 1);
  assert.equal(C.claimMission(state,'first-machine'), false);
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(C.claimMission(restored,'first-machine'), false);
  assert.equal(restored.missionsCompleted, 1);
  restored.juice = 1e9;
  C.rebirth(restored);
  assert.deepEqual(restored.claimedMissions, []);
  assert.equal(restored.missionsCompleted, 1);
  restored.owned[0] = 1;
  assert.equal(C.claimMission(restored,'first-machine'), 1);
});

test('recompensas de desafio respeitam um minuto, 2% do saldo e ignoram bônus temporário', () => {
  const state = C.newState();
  state.owned[1] = 100;
  state.juice = 1e9;
  assert.equal(C.missionReward(state), 6000);
  state.juice = 100;
  assert.equal(C.missionReward(state), 2);
  state.activeBoost = { id:'golden', production:7, until:Date.now()+10000 };
  assert.equal(C.missionReward(state), 2);
  state.juice = 0;
  assert.equal(C.missionReward(state), 1);
  const corrupt = C.normalize({ claimedMissions:['team','team','fake'], missionsCompleted:-2 });
  assert.deepEqual(corrupt.claimedMissions,['team']);
  assert.equal(corrupt.missionsCompleted,1);
});

test('metas e conquistas medem produtor individual, diversidade, cliques e receitas', () => {
  const state = C.newState();
  state.owned[2] = 25; state.owned[1] = 1; state.handmade = 1234;
  state.upgrades = ['click1','click2'];
  assert.equal(C.progressValue(state,{kind:'producer',building:2}),25);
  assert.equal(C.progressValue(state,{kind:'diversity'}),2);
  assert.equal(C.progressValue(state,{kind:'handmade'}),1234);
  assert.equal(C.progressValue(state,{kind:'upgrades'}),2);
  assert.equal(C.progressValue(state,{kind:'cps'}),C.production(state));
  assert.ok(C.ACHIEVEMENTS.find(a=>a.id==='producer-21-100'));
});

test('todos os eventos novos podem aparecer e seus prêmios persistem', () => {
  const ids = new Set(Array.from({length:1000},(_,i)=>C.selectEvent(i/1000).id));
  assert.equal(ids.size,C.EVENTS.length);
  const state=C.newState(); state.owned[1]=100; state.juice=1000;
  assert.equal(C.eventReward(state,'merchant').gain,113);
  assert.equal(C.eventReward(state,'aurora').boost.production,2);
  assert.equal(C.eventReward(state,'breeze').boost.click,3);
  state.eventStats.breeze=1;
  state.pendingEvent={id:'merchant',until:Date.now()+10000};
  state.activeBoost={id:'aurora',production:2,click:1,until:Date.now()+10000};
  const restored=C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.pendingEvent.id,'merchant');
  assert.equal(restored.activeBoost.id,'aurora');
  assert.equal(restored.eventStats.breeze,1);
});

test('novos buffs permanentes dão bônus condicionais e persistem após rebirth', () => {
  const state=C.newState(); state.prestige=100; state.prestigeEarned=100;
  state.owned[2]=20; state.upgrades=['global1','global2','click1','click2','click3'];
  const before=C.production(state);
  assert.equal(C.buyPermanent(state,'recipes'),true);
  assert.ok(Math.abs(C.production(state)/before-1.01)<1e-10);
  const recipes=C.production(state);
  assert.equal(C.buyPermanent(state,'orchard'),true);
  assert.ok(Math.abs(C.production(state)/recipes-1.02)<1e-10);
  state.juice=1e12;
  const gain=C.eventReward(state,'merchant').gain;
  assert.equal(C.buyPermanent(state,'reserve'),true);
  assert.ok(Math.abs(C.eventReward(state,'merchant').gain/gain-1.05)<1e-10);
  state.juice=C.prestigeCost(state);
  assert.equal(C.rebirth(state),1);
  const restored=C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.permanentUpgrades.recipes,1);
  assert.equal(restored.permanentUpgrades.orchard,1);
  assert.equal(restored.permanentUpgrades.reserve,1);
});
