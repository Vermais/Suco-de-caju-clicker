/* Autenticação e progresso compartilhados com o Álbum Pedro Victor. */
(() => {
  'use strict';
  const URL = 'https://umayamlvxcdccmkpghmg.supabase.co';
  const KEY = 'sb_publishable_R5rN_XnQ7u_B-bv900ZY1g_K6V_wIIl';
  const ALBUM = 'https://album-pedro-victor.vercel.app';
  const STORAGE = 'caju-album-session-v1';
  const listeners = { authorized: () => {}, status: () => {}, signedOut: () => {}, skinChanged: () => {} };
  let session = null;
  let revision = 0;
  let queued = null;
  let inFlight = null;
  let timer = null;
  let conflict = false;
  let loadedUser = null;

  function status(message) { listeners.status(message); }
  async function request(path, options = {}, retry = true) {
    if (!session?.accessToken) throw new Error('Entre com sua conta do álbum.');
    const response = await fetch(URL + path, {
      ...options,
      headers: { apikey: KEY, Authorization: 'Bearer ' + session.accessToken,
        'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    if (response.status === 401 && retry) {
      if (session.mode === 'direct' && session.refreshToken) {
        await refresh();
        return request(path, options, false);
      }
      requestAlbumToken();
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || data?.error_description || data?.error || 'Falha na conexão com o Supabase.');
      error.code = data?.code || String(response.status);
      throw error;
    }
    return data;
  }
  async function refresh() {
    if (!session?.refreshToken) throw new Error('Sessão expirada. Entre novamente.');
    const response = await fetch(URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refreshToken })
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error('Sessão expirada. Entre novamente.');
    session.accessToken = data.access_token;
    session.refreshToken = data.refresh_token;
    session.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    localStorage.setItem(STORAGE, JSON.stringify(session));
  }
  async function authorize(token, mode, credentials = {}) {
    const previousUser = loadedUser;
    session = { mode, accessToken: token, refreshToken: credentials.refreshToken || null,
      expiresAt: credentials.expiresAt || 0, user: null };
    const user = await request('/auth/v1/user');
    if (!user?.id) throw new Error('Não foi possível confirmar sua conta do álbum.');
    if (previousUser === user.id) {
      session.user = { id: user.id, email: user.email };
      if (mode === 'direct') localStorage.setItem(STORAGE, JSON.stringify(session));
      status('Conta do álbum conectada');
      return;
    }
    if (previousUser !== user.id) { queued = null; revision = 0; conflict = false; }
    const rows = await request('/rest/v1/clicker_progress?user_id=eq.' + encodeURIComponent(user.id) + '&select=state,revision&limit=1');
    const row = rows?.[0] || null;
    session.user = { id: user.id, email: user.email };
    if (mode === 'direct') localStorage.setItem(STORAGE, JSON.stringify(session));
    revision = Number(row?.revision || 0);
    loadedUser = user.id;
    listeners.authorized({ user: session.user, state: row?.state || null, newAccount: !row, mode });
    status('Conta do álbum conectada');
  }
  async function login(email, password) {
    const response = await fetch(URL + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error(data?.error_description || data?.msg || 'E-mail ou senha incorretos.');
    await authorize(data.access_token, 'direct', {
      refreshToken: data.refresh_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    });
  }
  function requestAlbumToken() {
    if (window.parent !== window) window.parent.postMessage({ type: 'clicker-ready' }, ALBUM);
  }
  function queueSave(state) {
    if (!session?.user || conflict) return;
    queued = JSON.parse(JSON.stringify(state));
    status('Sincronizando partida…');
    clearTimeout(timer);
    timer = setTimeout(flush, 1800);
  }
  async function flush() {
    if (inFlight) await inFlight;
    if (!session?.user || conflict) return false;
    if (!queued) return true;
    const snapshot = queued;
    const userId = session.user.id;
    queued = null;
    inFlight = (async () => { try {
      const result = await request('/rest/v1/rpc/save_clicker_progress', {
        method: 'POST', body: JSON.stringify({ p_state: snapshot, p_expected_revision: revision })
      });
      if (session?.user?.id === userId) {
        revision = Number(result.revision);
        if (typeof result.skin === 'string' && result.skin !== snapshot.skin) {
          if (queued?.skin === snapshot.skin) queued.skin = result.skin;
          listeners.skinChanged(result.skin, snapshot.skin);
        }
        status('Salvo na sua conta');
        return true;
      }
      return false;
    } catch (error) {
      if (session?.user?.id !== userId) return false;
      if (error.code === '40001') {
        conflict = true;
        queued = null;
        try {
          const rows = await request('/rest/v1/clicker_progress?user_id=eq.' + encodeURIComponent(userId) + '&select=state,revision&limit=1');
          if (session?.user?.id !== userId) return false;
          const row = rows?.[0];
          if (!row) throw new Error('Partida não encontrada');
          revision = Number(row.revision);
          conflict = false;
          listeners.authorized({ user: session.user, state: row.state, newAccount: false, mode: session.mode });
          status('Partida atualizada com o salvamento da sua conta');
        } catch (_) {
          status('Partida alterada. Recarregue para receber o salvamento mais recente.');
        }
      } else {
        queued = queued || snapshot;
        status('Sem conexão com o banco. Progresso salvo neste navegador.');
      }
      return false;
    } finally {
      inFlight = null;
      if (queued && !conflict) { clearTimeout(timer); timer = setTimeout(flush, 8000); }
    } })();
    return inFlight;
  }
  async function claimRebirth(count) {
    if (!session?.user) return null;
    await flush();
    if (queued || conflict) throw new Error('Salve a partida antes de receber a recompensa.');
    const result = await request('/rest/v1/rpc/claim_clicker_rebirth', {
      method: 'POST', body: JSON.stringify({ p_rebirth_count: count })
    });
    if (window.parent !== window) window.parent.postMessage({ type: 'clicker-reward', coins: result.coins }, ALBUM);
    return result;
  }
  async function leaderboard(sort) {
    if (!session?.user) throw new Error('Entre com sua conta do álbum para ver o ranking.');
    return request('/rest/v1/rpc/get_clicker_leaderboard', {
      method: 'POST', body: JSON.stringify({ p_sort: sort })
    });
  }
  async function ownedStickers() {
    const userId = session?.user?.id;
    if (!userId) throw new Error('Entre com sua conta do álbum.');
    const rows = await request('/rest/v1/album_progress?user_id=eq.' + encodeURIComponent(userId) + '&select=owned&limit=1');
    if (session?.user?.id !== userId) throw new Error('A conta mudou. Abra suas figurinhas novamente.');
    const owned = rows?.[0]?.owned;
    return owned && typeof owned === 'object' && !Array.isArray(owned) ? owned : {};
  }
  function logout() {
    session = null; revision = 0; queued = null; conflict = false; loadedUser = null;
    clearTimeout(timer);
    localStorage.removeItem(STORAGE);
    listeners.signedOut();
    status('Progresso local');
  }
  function init(callbacks) {
    Object.assign(listeners, callbacks);
    window.addEventListener('message', event => {
      if (event.origin !== ALBUM || event.source !== window.parent || event.data?.type !== 'album-auth') return;
      if (!event.data.accessToken) { logout(); return; }
      authorize(event.data.accessToken, 'embedded').catch(error => status(error.message));
    });
    if (window.parent !== window) requestAlbumToken();
    else {
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE));
        if (stored?.accessToken && stored?.refreshToken) {
          session = stored;
          (async () => {
            if (Date.now() > (stored.expiresAt || 0) - 60000) await refresh();
            await authorize(session.accessToken, 'direct', { refreshToken: session.refreshToken, expiresAt: session.expiresAt });
          })().catch(error => { logout(); status(error.message); });
        }
      } catch (_) { localStorage.removeItem(STORAGE); }
    }
  }
  window.CajuCloud = { init, login, logout, queueSave, flush, claimRebirth, leaderboard, ownedStickers,
    get user() { return session?.user || null; }, get mode() { return session?.mode || 'guest'; } };
})();
