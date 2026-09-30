const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../dist/game-core.js');
const F = require('../dist/fast-economy.js');
const A = require('../dist/aura.js');
const H = require('../dist/hand-motion.js');
test('20 mil cliques de 1ms contam todos os ganhos sem recalcular economia a cada clique', () => {
  let clickCalls=0, productionCalls=0;
  const engine=F.create({clickPower:(...args)=>{clickCalls++;return C.clickPower(...args);},production:(...args)=>{productionCalls++;return C.production(...args);}});
  const state=C.newState(), motion=H.create(), aura=A.create();
  const power=C.clickPower(state);
  let total=0;
  for(let ms=0;ms<20000;ms++) {
    motion.click(ms);aura.click(state.aura,ms,100000+ms);
    total+=engine.click(state,1,1,1);
    if(ms%16===0) engine.cps(state,1);
  }
  assert.equal(total,power*20000);
  assert.equal(clickCalls,1);
  assert.equal(productionCalls,1);
  assert.equal(motion.view(20000).moving,true);
});
test('economia acompanha compra, troca de conta e mudança/expiração de buff sem duplicar aura', () => {
  const state=C.newState(), engine=F.create(C);
  state.juice=1e9;
  engine.cps(state);engine.click(state);
  assert.ok(C.buyBuilding(state,C.BUILDINGS[0],100));engine.invalidate();
  assert.equal(engine.cps(state,2),C.production(state,2));
  assert.equal(engine.click(state,5,7,2),C.clickPower(state,5,7)*2);
  assert.equal(engine.click(state,1,1,1),C.clickPower(state,1,1));
  assert.equal(engine.click(C.newState()),1);
});
test('Atacado do caju exige lote único de 100+, valida saldo e persiste', () => {
  const state=C.newState(), goal=C.ACHIEVEMENTS.find(a=>a.id==='bulk-100');
  assert.equal(C.buyBuilding(state,C.BUILDINGS[0],100),false);
  assert.equal(C.progressValue(state,goal),0);
  state.juice=1e9;
  assert.ok(C.buyBuilding(state,C.BUILDINGS[0],50));
  assert.ok(C.buyBuilding(state,C.BUILDINGS[0],50));
  assert.equal(C.progressValue(state,goal),50);
  state.juice=1e15;
  assert.ok(C.buyBuilding(state,C.BUILDINGS[0],100));
  assert.equal(C.progressValue(state,goal),100);
  state.achievements.push(goal.id);
  const loaded=C.normalize(JSON.parse(JSON.stringify(state)));
  assert.ok(loaded.achievements.includes(goal.id));
  assert.equal(loaded.maxBatchPurchase,100);
  assert.ok(C.rebirth(loaded));
  assert.equal(C.progressValue(loaded,goal),100);
  assert.ok(loaded.achievements.includes(goal.id));
});
