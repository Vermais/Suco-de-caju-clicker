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
  state.upgrades.push('b0-10');
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
  state.owned[0] = 5;
  assert.equal(C.upgradeUnlocked(C.UPGRADES.find(u => u.id === 'b0-5'), state), true);
  state.upgrades.push('b0-5');
  assert.equal(C.production(state), 1);
  assert.equal(C.production(state, 2), 2);
  assert.equal(C.clickPower(state, 5), 5);
  assert.equal(new Set(C.UPGRADES.map(u => u.id)).size, C.UPGRADES.length);
  assert.equal(new Set(C.ACHIEVEMENTS.map(a => a.id)).size, C.ACHIEVEMENTS.length);
});

test('eventos têm recompensas distintas e mantêm seus dados no salvamento', () => {
  const state = C.newState();
  assert.equal(C.eventReward(state, 'rain').gain, 100);
  assert.equal(C.eventReward(state, 'golden', true).gain, 77);
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
  assert.equal(state.owned.length, 18);
  assert.equal(state.owned[13], 0);
  assert.equal(state.eventStats.meteor, 0);
  assert.ok(C.eventReward(state, 'meteor').gain >= 150);
  assert.equal(C.eventReward(state, 'harvest').boost.production, 4);
});

test('produção gasta conta para renascimento e nenhum nível pode ser recebido duas vezes', () => {
  const state = C.newState();
  state.runProduced = 999999999;
  assert.equal(C.rebirth(state), false);
  state.runProduced = 1e9;
  state.juice = 10; // O resto foi investido em máquinas.
  assert.equal(C.rebirth(state), 5);
  assert.equal(C.rebirth(state), false);
  assert.equal(C.prestigeCost(state), 728e6);
  state.runProduced = 728e6 - 1;
  assert.equal(C.prestigePending(state), 0);
  state.runProduced++;
  assert.equal(C.rebirth(state), 1);
  assert.equal(state.prestigeEarned, 6);
  assert.equal(C.prestigeCost(state), 1016e6);
  assert.equal(C.rebirth(C.normalize(JSON.parse(JSON.stringify(state)))), false);
});

test('primeiras cinco castanhas compram um pacote útil e os efeitos persistem', () => {
  const state = C.newState();
  state.runProduced = 1e9;
  C.rebirth(state);
  for (const id of ['production', 'starter', 'click', 'offline']) assert.equal(C.buyPermanent(state, id), true);
  assert.equal(state.prestige, 0);
  assert.equal(state.prestigeEarned, 5);
  state.owned[0] = 10;
  assert.equal(C.production(state), 1.05 * 1.5);
  assert.equal(C.clickPower(state), 2);
  assert.equal(C.offlineRate(state), .5);
  assert.equal(C.permanentCost(state, C.PERMANENT_UPGRADES[0]), 2);
  const threshold = C.prestigeCost(state);
  state.runProduced = threshold;
  C.rebirth(state);
  assert.equal(state.juice, 10000);
  assert.equal(state.runProduced, 0);
  assert.equal(C.prestigePending(state), 0); // Kit não cria castanhas grátis.
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.permanentUpgrades.production, 1);
  assert.equal(restored.prestigeEarned, 6);
  assert.equal(C.buyPermanent(C.newState(), 'production'), false);
});

test('curva cúbica é exata nas fronteiras e sobras continuam entre safras', () => {
  const state = C.newState();
  for (const [produced, expected] of [[999999999,0],[1e9,5],[1728e6-1,5],[1728e6,6],[8e9,10],[27e9,15]]) {
    state.runProduced = produced;
    assert.equal(C.prestigePending(state), expected);
  }
  state.runProduced = 1.5e9;
  assert.equal(C.rebirth(state), 5);
  assert.equal(C.prestigeCost(state), 228e6);
  C.buyPermanent(state, 'production');
  assert.equal(C.prestigeCost(state), 228e6);
  state.runProduced = 228e6;
  assert.equal(C.rebirth(state), 1);
});

test('migração de castanhas antigas preserva progresso e não reaplica a base', () => {
  const old = { prestige: 3, prestigeEarned: 20, runProduced: 100e6, juice: 42, permanentUpgrades: { production: 3 }, owned: [5] };
  const state = C.normalize(old);
  assert.equal(state.prestigeBase, 64e9);
  assert.equal(state.prestige, 3);
  assert.equal(state.prestigeEarned, 20);
  assert.equal(state.juice, 42);
  assert.equal(state.owned[0], 5);
  assert.equal(C.prestigeCost(state) - state.runProduced, 9.988e9);
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.prestigeBase, state.prestigeBase);
  restored.runProduced = C.prestigeCost(restored);
  assert.equal(C.rebirth(restored), 1);
  assert.equal(C.prestigePending(C.normalize(JSON.parse(JSON.stringify(restored)))), 0);
});

test('novos buffs afetam produção, clique, eventos, coleta e horas ausentes', () => {
  const state = C.normalize({ prestige: 100, owned: [1000, 100], achievements: ['juice-1', 'juice-10'] });
  const before = C.production(state);
  assert.equal(C.buyPermanent(state, 'synergy'), true);
  assert.equal(C.production(state), before * 1.04);
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
  const state = C.normalize({ prestige: 5, runProduced: 2e9 });
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
  assert.equal(C.BUILDINGS.length, 18);
  assert.equal(C.PERMANENT_UPGRADES.length, 12);
  assert.equal(new Set(C.PERMANENT_UPGRADES.map(u => u.id)).size, 12);
  for (let i = 1; i < C.BUILDINGS.length; i++) {
    assert.ok(C.BUILDINGS[i].base > C.BUILDINGS[i-1].base);
    assert.ok(C.BUILDINGS[i].cps > C.BUILDINGS[i-1].cps);
  }
  const state = C.newState();
  state.owned[14] = 15;
  state.owned[13] = 100;
  const before = C.production(state);
  const u = C.UPGRADES.find(u => u.id === 'synergy-14');
  assert.equal(C.upgradeUnlocked(u, state), true);
  state.upgrades.push(u.id);
  assert.equal(C.production(state) - before, 15 * C.BUILDINGS[14].cps);
  assert.ok(C.UPGRADES.find(u => u.id === 'b17-500'));
  state.runProduced = 2e6;
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
  assert.equal(tier.cost, b.base * 50000);
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
