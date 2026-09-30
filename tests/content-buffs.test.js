const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../dist/game-core.js');

test('novos buffs permanentes têm efeitos condicionais, limites e persistência',()=>{
 const base=C.normalize({owned:C.BUILDINGS.map((_,i)=>i<10?100:0),juice:1e9,prestige:1000});
 for(const id of ['apprentices','industry','quality']){
   const upgraded=C.normalize(id==='apprentices' ? {...base,owned:[100,100,100]} : base);
   const previous=C.production(upgraded);
   assert.equal(C.buyPermanent(upgraded,id),true);
   assert.ok(C.production(upgraded)>previous);
   assert.equal(C.normalize(upgraded).permanentUpgrades[id],1);
   upgraded.juice=C.prestigeCost(upgraded); C.rebirth(upgraded);
   assert.equal(upgraded.permanentUpgrades[id],1);
 }
 const clicked=C.normalize(base);C.buyPermanent(clicked,'precision');
 assert.ok(Math.abs(C.clickPower(clicked)/C.clickPower(base)-1.05)<1e-9);
 const noDiversity=C.normalize({owned:[10],permanentUpgrades:{quality:3}});
 assert.equal(C.production(noDiversity),C.production(C.normalize({owned:[10]})));
 const huge=C.normalize({owned:[100000],permanentUpgrades:{industry:3}});
 assert.ok(Math.abs(C.production(huge)/C.production(C.normalize({owned:[100000]}))-1.6)<1e-9);
});
test('mudas são entregues só ao renascer, e contratos mantêm teto de saldo',()=>{
 const state=C.normalize({juice:1e9,prestige:100,owned:[20]});
 const before=[...state.owned];C.buyPermanent(state,'seedlings');
 assert.deepEqual(state.owned,before);
 state.juice=C.prestigeCost(state); C.rebirth(state);assert.equal(state.owned[2],2);assert.equal(state.owned[3],1);
 const reward=C.normalize({juice:1e8,owned:[10],permanentUpgrades:{contracts:3}});
 const normal=C.normalize({...reward,permanentUpgrades:{}});
 assert.ok(C.missionReward(reward)>C.missionReward(normal));
 reward.juice=100;assert.ok(C.missionReward(reward)<=2);
});
test('conteúdo novo usa IDs únicos e antigos saves não ganham compras automaticamente',()=>{
 assert.equal(C.MISSIONS.length,22);assert.equal(C.UPGRADES.length,400);assert.equal(C.ACHIEVEMENTS.length,138);
 for(const list of [C.MISSIONS,C.UPGRADES,C.ACHIEVEMENTS,C.PERMANENT_UPGRADES]) assert.equal(new Set(list.map(x=>x.id)).size,list.length);
 const old=C.normalize({juice:123,permanentUpgrades:{production:2},upgrades:['recipe-0']});
 assert.equal(old.juice,123);assert.equal(old.permanentUpgrades.production,2);assert.equal(old.permanentUpgrades.seedlings,0);
 const max=C.normalize({permanentUpgrades:{industry:99,seedlings:99}});
 assert.equal(max.permanentUpgrades.industry,3);assert.equal(max.permanentUpgrades.seedlings,3);
});
