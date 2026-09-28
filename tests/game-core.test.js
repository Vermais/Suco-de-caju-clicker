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
