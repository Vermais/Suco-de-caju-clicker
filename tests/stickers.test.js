const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../dist/stickers.js');
const C = require('../dist/game-core.js');

test('catálogo usa os mesmos 111 IDs e arquivos do álbum', () => {
  assert.equal(S.cards.length, 111);
  assert.equal(S.cardForSkin('sticker:3').name, 'Pedro Víctor 67');
  assert.match(S.cardForSkin('sticker:1').image, /\/001.jpg$/);
  assert.match(S.cardForSkin('sticker:111').image, /\/111.png$/);
});
test('somente cópias positivas inteiras da coleção liberam skins', () => {
  const owned = {1: 1, 2: 0, 3: -1, 4: '1', 5: 2, 6: 0.5, 111: 1, 112: 2};
  assert.deepEqual(S.ownedCards(owned).map(c => c.id), [1, 5, 111]);
  assert.deepEqual(S.ownedCards(null), []);
});
test('skin persistida preserva progresso sem alterar poder ou produção', () => {
  const base = C.normalize({juice: 1234, owned: [12], skin: 'cup'});
  const selected = C.normalize({...base, skin: 'sticker:111'});
  assert.equal(selected.skin, 'sticker:111');
  assert.equal(selected.juice, 1234);
  assert.equal(C.production(selected), C.production(base));
  assert.equal(C.clickPower(selected), C.clickPower(base));
  for (const value of ['sticker:0','sticker:112','sticker:01','sticker:-1','sticker:1.5','https://evil.test/a',null,{}]) {
    assert.equal(C.normalize({...base, skin: value}).skin, 'cup');
  }
});
test('figurinha permanece equipada depois do renascimento', () => {
  const state = C.normalize({juice:1e9,skin:'sticker:3'});
  assert.equal(C.rebirth(state),5);
  assert.equal(state.skin,'sticker:3');
});

test('raridades seguem o álbum e supersecreta tem teto de 2×', () => {
  assert.equal(S.cardForSkin('sticker:111').rarity,'supersecret');
  assert.equal(S.cardForSkin('sticker:111').multiplier,2);
  const levels=Object.values(S.rarities).map(r=>r[1]);
  assert.deepEqual(levels,[1.05,1.1,1.2,1.35,1.5,1.75,1.9,2]);
  assert.ok(S.cards.every(c=>c.multiplier>=1.05 && c.multiplier<=2));
});
test('buff exige skin equipada e posse e termina no instante correto', () => {
  const buff={cardId:111,until:10000,readyAt:1810000,owned:true};
  assert.equal(S.buffMultiplier(buff,'sticker:111',{111:1},9999),2);
  assert.equal(S.buffMultiplier(buff,'sticker:111',{111:1},10000),1);
  assert.equal(S.buffMultiplier(buff,'sticker:3',{3:1,111:1},100),1);
  assert.equal(S.buffMultiplier(buff,'cup',{111:1},100),1);
  assert.equal(S.buffMultiplier(buff,'sticker:111',{111:0},100),1);
  assert.equal(S.buffMultiplier({...buff,owned:false},'sticker:111',{111:1},100),1);
  assert.equal(S.buffMultiplier({...buff,multiplier:1000},'sticker:111',{111:1},100),2);
});
