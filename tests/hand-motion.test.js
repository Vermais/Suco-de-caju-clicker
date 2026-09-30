const test = require('node:test');
const assert = require('node:assert/strict');
const {create} = require('../dist/hand-motion.js');

test('cliques espaçados alternam imediatamente as mãos', () => {
  const motion = create();
  assert.equal(motion.click(0).left, true);
  assert.equal(motion.click(500).left, false);
  assert.equal(motion.click(1000).left, true);
  assert.equal(motion.view(1200).moving, false);
});
test('cliques de 1ms mantêm movimento visível mesmo com pares entre frames', () => {
  const motion = create();
  const seen = new Set();
  let start;
  for (let t = 0; t < 1000; t++) {
    const frame = motion.click(t);
    if (t === 2) start = frame.initialLeft;
    if (t > 2) assert.equal(frame.initialLeft, start, 'não reinicia o ciclo a cada clique');
    if (t % 16 === 0 && t > 10) { seen.add(frame.left); assert.equal(frame.moving, true); }
  }
  assert.equal(seen.size, 2);
  assert.equal(motion.view(1100).moving, true);
  assert.equal(motion.view(1240).moving, false);
});
test('parar, retomar ou trocar de skin libera o relógio visual corretamente', () => {
  const motion = create();
  motion.click(0); motion.click(1);
  motion.view(300);
  const previous = motion.view(500).left;
  assert.equal(motion.click(501).left, !previous);
  motion.reset();
  assert.equal(motion.view(502).left, false);
  assert.equal(motion.view(502).moving, false);
});

test('ritmo da rajada fica estável e os números usam a mesma fase das mãos', () => {
  for (const gap of [1, 40, 120]) {
    const motion = create();
    motion.click(0);
    const start = motion.click(gap);
    assert.equal(start.cycleMs, gap === 1 ? 360 : 420);
    assert.equal(motion.view(gap + start.cycleMs / 2).left, !start.initialLeft);
    for (let t = gap + 1; t < gap + 800; t += gap) {
      const phase = motion.click(t);
      assert.equal(phase.cycleMs, start.cycleMs);
      assert.equal(phase.initialLeft, start.initialLeft);
    }
  }
});
