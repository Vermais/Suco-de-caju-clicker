const test = require('node:test');
const assert = require('node:assert/strict');
const {matches, newlyVisible} = require('../dist/sixty-seven.js');
test('67 é reconhecido em qualquer número exibido e com unidades', () => {
  for (const text of ['67','567','867 bi','167','670','67,1','67.25','1.067','−67','67%','67s','Por clique 67','67 mi','67,00 copos','+67','Preço: 67 • 67 unidades']) {
    assert.ok(matches(text).length > 0, text);
  }
  const text = 'Preço: 67 • 67 unidades';
  assert.deepEqual(matches(text).map(m=>text.slice(m.start,m.end)), ['67','67']);
});
test('somente dígitos juntos dentro de números disparam o efeito', () => {
  for(const text of ['6,7','6.7','nome67','abc167','2026-09-30']) assert.equal(matches(text).length,0,text);
});
test('o mesmo 67 não reinicia o popup, mas voltar de 68 para 67 dispara', () => {
  assert.deepEqual(newlyVisible(new Set(['0:0']),['0:0']),[]);
  assert.deepEqual(newlyVisible(new Set(),['0:0']),['0:0']);
  assert.deepEqual(newlyVisible(new Set(['0:0']),['0:0','0:1']),['0:1']);
});
