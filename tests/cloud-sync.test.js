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

test('coleção usa apenas conta atual e correção de skin mantém o saldo', async () => {
  const storage = new Map();
  let requestedCollection = '';
  let pendingCollection;
  let delay = false;
  let correction;
  const context = {
    localStorage: { getItem:k=>storage.get(k)||null, setItem:(k,v)=>storage.set(k,v), removeItem:k=>storage.delete(k) },
    setTimeout:()=>1, clearTimeout:()=>{},
    fetch: async (url, options={}) => {
      const response = data=>({ok:true,status:200,json:async()=>data});
      if(url.includes('/auth/v1/token')) return response({access_token:'test',refresh_token:'refresh'});
      if(url.endsWith('/auth/v1/user')) return response({id:'current-user'});
      if(url.includes('/rest/v1/clicker_progress?')) return response([{state:{juice:300},revision:1}]);
      if(url.includes('/rest/v1/album_progress?')) {
        requestedCollection=url;
        if(delay) await new Promise(resolve=>{pendingCollection=resolve;});
        return response([{owned:{3:1,5:0}}]);
      }
      if(url.endsWith('/rest/v1/rpc/get_clicker_sticker_buff')) return response({cardId:3,until:1000,readyAt:2000,serverNow:500,owned:true});
      if(url.endsWith('/rest/v1/rpc/activate_clicker_sticker_buff')) {
        assert.equal(JSON.parse(options.body).p_card_id,3);
        return response({cardId:3,until:600500,readyAt:2400500,serverNow:500,owned:true});
      }
      if(url.endsWith('/rest/v1/rpc/save_clicker_progress')) {
        const payload=JSON.parse(options.body);
        assert.equal(payload.p_state.juice,300);
        return response({revision:2,skin:'cup'});
      }
      throw Error(url);
    }
  };
  context.window={addEventListener:()=>{}};context.window.parent=context.window;
  vm.runInNewContext(fs.readFileSync(require.resolve('../dist/cloud.js'),'utf8'),context);
  const cloud=context.window.CajuCloud;
  cloud.init({skinChanged:(skin,savedSkin)=>{correction=[skin,savedSkin];}});
  await assert.rejects(cloud.ownedStickers(),/Entre/);
  await cloud.login('test@example.com','test-password');
  assert.equal((await cloud.ownedStickers())[3],1);
  assert.match(requestedCollection,/user_id=eq.current-user&select=owned&limit=1$/);
  assert.equal((await cloud.stickerBuff()).cardId,3);
  assert.equal((await cloud.stickerBuff(3)).readyAt,2400500);
  cloud.queueSave({juice:300,skin:'sticker:5'});
  assert.equal(await cloud.flush(),true);
  assert.deepEqual(correction,['cup','sticker:5']);
  delay=true;
  const stale=cloud.ownedStickers();
  cloud.logout();pendingCollection();
  await assert.rejects(stale,/conta mudou/);
});
