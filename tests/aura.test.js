const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../dist/aura.js');
const C = require('../dist/game-core.js');
function fill(gap) {
  const state = A.normalize(null, 100000), clock = A.create();
  for (let t = 0; t <= 60000; t += gap) {
    if (clock.click(state, t, 100000 + t)) return {t, state, clock};
  }
  throw Error('não completou');
}
test('aura a 1 ms demora pelo menos 20s e cliques manuais completam em 22–34s', () => {
  assert.equal(fill(1).t, 20000);
  assert.ok(fill(1000 / 3).t >= 22000 && fill(1000 / 3).t <= 23000);
  assert.ok(fill(500).t >= 33000 && fill(500).t <= 34000);
});
test('boost expira em 20s, não acumula durante boost/recarga e volta a carregar', () => {
  const {state, clock, t} = fill(1);
  const start = 100000 + t;
  assert.equal(A.view(state, start).multiplier, 2);
  for (let elapsed = 1; elapsed < 40000; elapsed++) {
    assert.equal(clock.click(state, t + elapsed, start + elapsed), false);
    assert.equal(state.charge, 0);
  }
  assert.equal(A.view(state, start + 20000).multiplier, 1);
  assert.equal(A.view(state, start + 20000).cooling, true);
  assert.equal(A.view(state, start + 40000).cooling, false);
  clock.click(state, t + 40000, start + 40000);
  assert.ok(state.charge > 0 && state.charge <= 1.5);
});
test('pausas e troca de conta não armazenam carga para rajadas', () => {
  const clock = A.create(), state = A.normalize(null, 0);
  clock.click(state, 0, 0);
  clock.click(state, 3600000, 3600000);
  assert.equal(state.charge, 1.5);
  const other = A.normalize(null, 3600000);
  clock.click(other, 3600001, 3600001);
  assert.equal(other.charge, 0);
});
test('save preserva carga e prazos sem renovar buff; rebirth limpa aura', () => {
  const state = C.newState();
  state.aura.charge = 47;
  assert.equal(C.normalize(JSON.parse(JSON.stringify(state))).aura.charge, 47);
  const now = Date.now();
  state.aura = {charge:0, until:now + 10000, readyAt:now + 30000};
  const loaded = C.normalize(JSON.parse(JSON.stringify(state)));
  assert.equal(loaded.aura.until, state.aura.until);
  assert.equal(loaded.aura.readyAt, state.aura.readyAt);
  assert.equal(A.view(loaded.aura, now + 11000).multiplier, 1);
  assert.equal(A.view(loaded.aura, now + 31000).percent, 0);
  loaded.juice = 1e9;
  assert.ok(C.rebirth(loaded));
  assert.equal(loaded.aura.charge, 0);
  assert.equal(loaded.aura.until, 0);
});
test('aura dobra clique inteiro uma vez inclusive melhorias de CpS', () => {
  const state = C.newState();
  state.owned[0] = 100;
  state.permanentUpgrades.clickCps = 3;
  const before = C.clickPower(state, 5, 7);
  const factor = A.view({until:1000, readyAt:21000, charge:0}, 0).multiplier;
  assert.equal(C.clickPower(state, 5, 7) * factor, before * 2);
  assert.equal(C.production(state, 7 * factor), C.production(state, 7) * 2);
});
