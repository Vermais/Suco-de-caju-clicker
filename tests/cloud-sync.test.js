const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('reset remoto invalida cache antigo e próximos saves usam a nova revisão', async () => {
  let row = { state: { juice: 500, rebirths: 3 }, revision: 5 };
  let loaded;
  const storage = new Map();
  const context = {
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    setTimeout: () => 1, clearTimeout: () => {},
    fetch: async (url, options = {}) => {
      const response = (data, status = 200) => ({ ok: status === 200, status, json: async () => data });
      if (url.includes('/auth/v1/token')) return response({ access_token: 'test-token', refresh_token: 'test-refresh', expires_in: 3600 });
      if (url.endsWith('/auth/v1/user')) return response({ id: 'test-user', email: 'test@example.com' });
      if (url.includes('/rest/v1/clicker_progress?')) return response([JSON.parse(JSON.stringify(row))]);
      if (url.endsWith('/rest/v1/rpc/save_clicker_progress')) {
        const body = JSON.parse(options.body);
        if (body.p_expected_revision !== row.revision) return response({ code: '40001', message: 'revision conflict' }, 409);
        row = { state: body.p_state, revision: row.revision + 1 };
        return response({ revision: row.revision });
      }
      throw Error('unexpected request ' + url);
    }
  };
  context.window = { addEventListener: () => {} };
  context.window.parent = context.window;
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/cloud.js'), 'utf8'), context);
  const cloud = context.window.CajuCloud;
  cloud.init({ authorized: ({ state }) => { loaded = state; } });
  await cloud.login('test@example.com', 'test-password');
  assert.equal(loaded.juice, 500);
  cloud.queueSave({ juice: 999, rebirths: 3 });
  row = { state: { juice: 0, rebirths: 0 }, revision: 6 };
  assert.equal(await cloud.flush(), false);
  assert.equal(loaded.juice, 0);
  assert.equal(row.state.juice, 0);
  cloud.queueSave(loaded);
  assert.equal(await cloud.flush(), true);
  assert.equal(row.revision, 7);
  assert.equal(row.state.juice, 0);
});
