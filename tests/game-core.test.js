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
  assert.equal(C.production(state), 2.4);
  assert.equal(C.production(state, true), 16.8);
});

test('renascimento preserva histórico, castanhas e conquistas e zera a safra', () => {
  const state = C.newState();
  state.allTime = 4e9;
  state.runProduced = 4e9;
  state.juice = 10000;
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
  C.rebirth(restored);
  assert.equal(restored.pendingEvent, null);
  assert.equal(restored.activeBoost, null);
  assert.equal(restored.eventStats.total, 2);
});

test('autoclicker não consegue registrar mais de dez cliques por segundo', () => {
  const allow = C.createClickLimiter();
  const accepted = Array.from({ length: 1000 }, (_, i) => allow(i));
  assert.equal(accepted.filter(Boolean).length, 10);
  assert.equal(allow(1000), true);
  assert.equal(allow(1001), true);
});

test('skin escolhida sobrevive ao salvamento e ao renascimento', () => {
  const state = C.normalize({ ...C.newState(), skin: 'pedro67', allTime: 1e9 });
  assert.equal(state.skin, 'pedro67');
  C.rebirth(state);
  assert.equal(state.skin, 'pedro67');
  assert.equal(C.normalize({ skin: 'desconhecida' }).skin, 'cup');
});
