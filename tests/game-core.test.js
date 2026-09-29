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
  assert.equal(C.production(state), 2.4);
  assert.equal(C.production(state, true), 16.8);
});

test('renascimento preserva histórico, castanhas e conquistas e zera a safra', () => {
  const state = C.newState();
  state.allTime = 4e9;
  state.runProduced = 4e9;
  state.juice = 4e6;
  state.owned[2] = 5;
  state.upgrades.push('click1');
  state.achievements.push('juice-1');
  assert.equal(C.prestigePending(state), 2);
  assert.equal(C.rebirth(state), 2);
  assert.equal(state.prestige, 2);
  assert.equal(state.juice, 0);
  assert.equal(state.owned[2], 0);
  assert.deepEqual(state.upgrades, []);
  assert.equal(state.allTime, 4e9);
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
  restored.juice = 1e6;
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
  const state = C.normalize({ ...C.newState(), skin: 'pedro67', allTime: 1e9, juice: 1e6 });
  assert.equal(state.skin, 'pedro67');
  C.rebirth(state);
  assert.equal(state.skin, 'pedro67');
  assert.equal(C.normalize({ skin: 'desconhecida' }).skin, 'cup');
});

test('novos prédios e eventos são incluídos em partidas antigas', () => {
  const state = C.normalize({ owned: Array(12).fill(1), eventStats: { total: 3, golden: 3 } });
  assert.equal(state.owned.length, 14);
  assert.equal(state.owned[13], 0);
  assert.equal(state.eventStats.meteor, 0);
  assert.ok(C.eventReward(state, 'meteor').gain >= 150);
  assert.equal(C.eventReward(state, 'harvest').boost.production, 4);
});

 test('castanhas dependem do saldo e novas safras rendem novas castanhas', () => {
  const state = C.newState();
  state.allTime = 1e15;
  state.juice = 999999;
  assert.equal(C.rebirth(state), false);
  state.juice = 100e6;
  assert.equal(C.rebirth(state), 10);
  state.juice = 4e6;
  assert.equal(C.rebirth(state), 2);
  assert.equal(state.prestige, 12);
  assert.equal(state.prestigeEarned, 12);
});

test('compras permanentes aplicam bônus, persistem e não apagam o bônus conquistado', () => {
  const state = C.normalize({ prestige: 20, owned: [10], juice: 4e6 });
  const before = C.production(state);
  assert.equal(C.buyPermanent(state, 'production'), true);
  assert.equal(state.prestige, 19);
  assert.equal(C.production(state), before * 1.5);
  const click = C.clickPower(state);
  assert.equal(C.buyPermanent(state, 'click'), true);
  assert.ok(C.clickPower(state) >= click * 2);
  assert.equal(C.buyPermanent(state, 'starter'), true);
  assert.equal(C.buyPermanent(state, 'offline'), true);
  assert.equal(C.buyPermanent(state, 'events'), true);
  assert.equal(C.offlineRate(state), .5);
  assert.equal(C.eventReward(state, 'rain').gain, Math.max(C.production(state) * 75, C.clickPower(state) * 40, 100) * 1.25);
  assert.equal(C.eventReward(state, 'harvest').boost.duration, 40250);
  C.rebirth(state);
  assert.equal(state.juice, 1000);
  assert.equal(state.runProduced, 0);
  assert.equal(C.prestigePending(state), 0);
  const restored = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.permanentUpgrades.production, 1);
  assert.equal(restored.prestigeEarned, 22);
  assert.equal(C.buyPermanent(C.newState(), 'production'), false);
});
