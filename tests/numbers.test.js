const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../dist/numbers.js');

test('abrevia a partir de mil e continua depois do trilhão', () => {
  for (const [value, expected] of [[0,'0'],[999,'999'],[1000,'1 mil'],[1250,'1,25 mil'],[1e6,'1 mi'],[1e9,'1 bi'],[1e12,'1 tri'],[1e15,'1 quadri'],[1e18,'1 quinti'],[1e21,'1 sexti'],[1e33,'1 deci'],[1e63,'1 viginti']]) {
    assert.equal(N.format(value), expected);
    assert.equal(N.formatFraction(value), expected);
  }
});

test('produção pequena mantém casas decimais e números grandes não viram listas de dígitos', () => {
  assert.equal(N.formatFraction(.1), '0,1');
  assert.equal(N.formatFraction(12.34), '12,34');
  assert.equal(N.formatFraction(5.4e12), '5,4 tri');
  assert.equal(N.formatFraction(1.1e15), '1,1 quadri');
  assert.equal(N.format(42.99), '42');
  assert.equal(N.format(-1250), '−1,25 mil');
});

test('arredondamento promove a unidade, evitando 1.000 milhões', () => {
  assert.equal(N.format(999999998), '1 bi');
  assert.equal(N.format(999999), '1 mi');
  assert.equal(N.format(999900), '999,9 mil');
  assert.equal(N.format(999994.99), '999,99 mil');
});

test('notação continua em valores extremos sem limitar o saldo real', () => {
  assert.equal(N.format(1e66), '1e+66');
  assert.equal(N.format(1.25e100), '1,25e+100');
  assert.equal(N.format(Number.MAX_VALUE), '1,8e+308');
  assert.equal(N.format(NaN), '0');
  assert.equal(N.format(Infinity), '∞');
});
