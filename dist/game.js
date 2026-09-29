(() => {
  'use strict';
  const C = window.CajuCore;
  const $ = id => document.getElementById(id);
  const saveKey = 'suco-de-caju-clicker-v2';
  const oldKey = 'suco-de-caju-clicker-v1';
  const cloud = window.CajuCloud;
  const userSaveKey = id => 'suco-de-caju-clicker-user-' + id;
  const pendingRewardKey = id => 'suco-de-caju-clicker-pending-rebirth-' + id;
  const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
  const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 2 });
  const format = value => !Number.isFinite(value) ? '∞' : value < 1000 ? Math.floor(value).toLocaleString('pt-BR') : compact.format(value);
  const precise = value => !Number.isFinite(value) ? '∞' : number.format(value);
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(saveKey) || localStorage.getItem(oldKey)); } catch (_) {}
  let state = C.normalize(raw);
  let buyMode = '1';
  let goldenUntil = 0;
  let frenzyUntil = 0;
  let nextGolden = Date.now() + 55000 + Math.random() * 40000;
  let lastFrame = performance.now();
  let lastUi = 0;
  let lastUpgradeSignature = null;
  let toastTimer;
  let rankingSort = 'rebirths';
  let rankingRequest = 0;
  const buildingButtons = [];
  const buildingList = $('buildingList');
  const upgradeList = $('upgradeList');
  const achievementList = $('achievementList');
  const golden = $('golden');

  function save() {
    state.savedAt = Date.now();
    let localSaved = false;
    try { localStorage.setItem(cloud.user ? userSaveKey(cloud.user.id) : saveKey, JSON.stringify(state)); localSaved = true; }
    catch (_) { $('saveStatus').textContent = 'Sem espaço para salvar neste navegador'; }
    if (cloud.user) cloud.queueSave(state);
    else if (localSaved) $('saveStatus').textContent = 'Progresso local';
    return localSaved;
  }
  function toast(message) {
    const box = $('toast');
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('show'), 2700);
  }
  $('saveButton').addEventListener('click', async () => {
    const button = $('saveButton');
    button.disabled = true;
    button.textContent = 'Salvando…';
    try {
      const localSaved = save();
      if (cloud.user) {
        const synced = await cloud.flush();
        toast(synced ? 'Jogo salvo na sua conta!' : localSaved ? 'Salvo neste navegador. Sincronização pendente.' : 'Não foi possível salvar a partida.');
      } else {
        toast(localSaved ? 'Jogo salvo neste navegador! Entre para sincronizar.' : 'Não foi possível salvar neste navegador.');
      }
    } finally {
      button.disabled = false;
      button.textContent = 'Salvar jogo';
    }
  });
  function setAlbumStatus(message, connected = false) {
    const status = $('albumRewardStatus');
    status.textContent = message;
    status.style.color = connected ? '#8de1a8' : '';
  }
  async function claimAlbumRebirth(rebirthCount) {
    if (!cloud.user) throw new Error('Entre com sua conta do álbum para receber 10 🧃.');
    const payload = await cloud.claimRebirth(rebirthCount);
    localStorage.removeItem(pendingRewardKey(cloud.user.id));
    setAlbumStatus(`Conectado ao álbum · último renascimento: +${payload.reward || 0} 🧃`, true);
    return payload;
  }
  async function syncPendingAlbumReward() {
    if (!cloud.user) return null;
    const pending = Number(localStorage.getItem(pendingRewardKey(cloud.user.id)) || 0);
    if (!pending) return null;
    return claimAlbumRebirth(pending);
  }
  function addOfflineProgress() {
    const elapsed = Math.min(4 * 3600, Math.max(0, (Date.now() - state.savedAt) / 1000));
    const offline = Math.floor(C.production(state) * elapsed * .4);
    if (offline) { earn(offline); toast('Enquanto você esteve fora: +' + format(offline) + ' copos'); save(); }
  }
  cloud.init({
    authorized({ user, state: remote, newAccount, mode }) {
      let cache = null;
      try { cache = JSON.parse(localStorage.getItem(userSaveKey(user.id))); } catch (_) {}
      // Uma partida já presente no banco sempre prevalece sobre o cache local.
      let guest = null;
      if (newAccount && mode === 'direct') {
        try { guest = JSON.parse(localStorage.getItem(saveKey)); } catch (_) {}
      }
      state = C.normalize(remote || cache || guest);
      addOfflineProgress();
      lastUpgradeSignature = null;
      renderAchievements(); checkAchievements(); render(true); save();
      $('accountButton').textContent = mode === 'embedded' ? user.email || 'Conta do álbum' : (user.email || 'Minha conta') + ' · Sair';
      $('accountButton').disabled = mode === 'embedded';
      setAlbumStatus('Conectado ao Álbum Pedro Victor · cada renascimento vale +10 🧃', true);
      syncPendingAlbumReward().catch(error => setAlbumStatus(error.message));
      if (!$('leaderboardPanel').hidden) loadRanking();
    },
    signedOut() {
      let guest = null;
      try { guest = JSON.parse(localStorage.getItem(saveKey)); } catch (_) {}
      state = C.normalize(guest);
      lastUpgradeSignature = null;
      renderAchievements(); render(true);
      $('accountButton').textContent = 'Entrar com a conta do álbum';
      $('accountButton').disabled = false;
      setAlbumStatus('Entre com a conta do álbum para receber recompensas.');
      rankingRequest++;
      $('rankingList').replaceChildren();
      $('rankingStatus').textContent = 'Entre com a conta do álbum para ver o ranking.';
    },
    status(message) { $('saveStatus').textContent = message; }
  });
  const accountDialog = $('accountDialog');
  $('accountButton').addEventListener('click', () => {
    if (cloud.user) { cloud.logout(); return; }
    $('accountError').textContent = '';
    accountDialog.showModal();
  });
  $('cancelAccount').addEventListener('click', () => accountDialog.close());
  $('accountForm').addEventListener('submit', async event => {
    event.preventDefault();
    $('submitAccount').disabled = true;
    $('accountError').textContent = '';
    try {
      await cloud.login($('accountEmail').value.trim(), $('accountPassword').value);
      $('accountPassword').value = '';
      accountDialog.close();
    } catch (error) { $('accountError').textContent = error.message; }
    finally { $('submitAccount').disabled = false; }
  });
  function earn(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    state.juice += amount;
    state.runProduced += amount;
    state.allTime += amount;
  }
  function quantityFor(b) {
    return buyMode === 'max' ? C.affordableCount(b, state.owned[b.id], state.juice) : Number(buyMode);
  }
  function checkAchievements() {
    const count = state.owned.reduce((a, b) => a + b, 0);
    let changed = false;
    for (const a of C.ACHIEVEMENTS) {
      const value = a.kind === 'run' ? state.runProduced : a.kind === 'buildings' ? count : a.kind === 'clicks' ? state.clicks : state.rebirths;
      if (value >= a.at && !state.achievements.includes(a.id)) {
        state.achievements.push(a.id);
        changed = true;
      }
    }
    if (changed) { renderAchievements(); toast('Nova conquista desbloqueada!'); save(); }
  }
  C.BUILDINGS.forEach(b => {
    const button = document.createElement('button');
    button.className = 'building';
    button.innerHTML = `<span class="building-icon" aria-hidden="true">${b.icon}</span><span class="building-main"><strong>${b.name}</strong><small>+${precise(b.cps)} copos/s cada</small></span><span class="building-side"><b class="cost"></b><small class="owned"></small></span>`;
    button.addEventListener('click', () => {
      const amount = quantityFor(b);
      if (amount < 1) return;
      const cost = C.batchCost(b, state.owned[b.id], amount);
      if (state.juice + 1e-8 < cost) return;
      state.juice = Math.max(0, state.juice - cost);
      state.owned[b.id] += amount;
      checkAchievements(); render(true); save();
    });
    buildingList.append(button);
    buildingButtons.push(button);
  });
  document.querySelectorAll('[data-buy]').forEach(button => {
    button.addEventListener('click', () => {
      buyMode = button.dataset.buy;
      document.querySelectorAll('[data-buy]').forEach(b => {
        const selected = b === button;
        b.classList.toggle('selected', selected);
        b.setAttribute('aria-pressed', String(selected));
      });
      render();
    });
  });

  function renderUpgrades() {
    const available = C.UPGRADES.filter(u => !state.upgrades.includes(u.id) && C.upgradeUnlocked(u, state)).sort((a,b) => a.cost - b.cost);
    const signature = available.map(u => u.id).join(',');
    if (signature === lastUpgradeSignature) {
      [...upgradeList.querySelectorAll('button[data-id]')].forEach(button => {
        const u = C.UPGRADES.find(item => item.id === button.dataset.id);
        button.disabled = state.juice < u.cost;
      });
      return;
    }
    lastUpgradeSignature = signature;
    upgradeList.replaceChildren();
    $('availableCount').textContent = available.length || '';
    if (!available.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Continue produzindo para liberar mais melhorias.';
      upgradeList.append(empty);
      return;
    }
    available.forEach(u => {
      const button = document.createElement('button');
      button.className = 'upgrade';
      button.dataset.id = u.id;
      button.disabled = state.juice < u.cost;
      button.innerHTML = `<span class="upgrade-icon" aria-hidden="true">${u.icon}</span><span class="upgrade-main"><strong>${u.name}</strong><small>${u.description}</small></span><span class="upgrade-price">${format(u.cost)}</span>`;
      button.addEventListener('click', () => {
        if (state.upgrades.includes(u.id) || state.juice < u.cost || !C.upgradeUnlocked(u, state)) return;
        state.juice -= u.cost;
        state.upgrades.push(u.id);
        toast(u.name + ' comprada!');
        render(true); save();
      });
      upgradeList.append(button);
    });
  }
  function renderAchievements() {
    achievementList.replaceChildren();
    $('achievementCount').textContent = `${state.achievements.length} de ${C.ACHIEVEMENTS.length} desbloqueadas`;
    C.ACHIEVEMENTS.forEach(a => {
      const unlocked = state.achievements.includes(a.id);
      const item = document.createElement('div');
      item.className = 'achievement' + (unlocked ? '' : ' locked');
      item.title = unlocked ? a.name : 'Ainda não desbloqueada';
      item.innerHTML = `<span aria-hidden="true">${unlocked ? a.icon : '🔒'}</span><b>${unlocked ? a.name : '???'}</b>`;
      achievementList.append(item);
    });
  }
  function render(force = false) {
    $('juiceCount').textContent = format(state.juice);
    $('cps').textContent = precise(C.production(state, Date.now() < frenzyUntil));
    $('clickValue').textContent = format(C.clickPower(state, Date.now() < frenzyUntil));
    $('runTotal').textContent = format(state.runProduced);
    $('allTime').textContent = format(state.allTime);
    $('ownedTotal').textContent = state.owned.reduce((a,b) => a+b,0) + ' unidades';
    C.BUILDINGS.forEach((b, i) => {
      const button = buildingButtons[i];
      const amount = quantityFor(b);
      const cost = amount ? C.batchCost(b, state.owned[i], amount) : C.price(b, state.owned[i]);
      button.disabled = !amount || state.juice + 1e-8 < cost;
      button.classList.toggle('locked', !state.owned[i] && state.runProduced < b.base / 2);
      button.querySelector('.cost').textContent = amount ? format(cost) : '—';
      button.querySelector('.owned').textContent = `${state.owned[i]} • ${buyMode === 'max' ? '+' + amount : '+' + buyMode}`;
      button.title = `${b.name}: ${precise(b.cps)} copos/s por unidade. ${amount} por ${precise(cost)} copos.`;
    });
    renderUpgrades();
    const pending = C.prestigePending(state);
    $('prestigeTotal').textContent = format(state.prestige);
    $('prestigeBonus').textContent = '+' + format(state.prestige * 10) + '%';
    $('prestigePending').textContent = format(pending);
    $('nextPrestige').textContent = format((C.prestigePotential(state.allTime) + 1) ** 2 * 1e9);
    $('rebirthCount').textContent = state.rebirths;
    $('rebirthButton').disabled = pending < 1;
    $('rebirthButton').textContent = pending ? `Renascer e ganhar ${format(pending)} 🌰` : 'Renascer (ainda sem castanhas)';
    const seconds = Math.ceil((frenzyUntil - Date.now()) / 1000);
    $('bonusStatus').textContent = seconds > 0 ? `Safra dourada: produção e clique 7× por ${seconds}s` : 'Clique no copo para preparar suco';
    $('bonusStatus').classList.toggle('active', seconds > 0);
  }
  function floatText(text, event) {
    const area = $('juiceArea');
    const box = area.getBoundingClientRect();
    const element = document.createElement('span');
    element.className = 'float';
    element.textContent = text;
    const x = event?.clientX ? event.clientX - box.left : box.width / 2;
    const y = event?.clientY ? event.clientY - box.top : box.height / 2;
    element.style.left = Math.max(8, Math.min(box.width - 85, x)) + 'px';
    element.style.top = Math.max(15, Math.min(box.height - 35, y)) + 'px';
    area.append(element);
    setTimeout(() => element.remove(), 850);
  }
  $('juiceButton').addEventListener('click', event => {
    const gain = C.clickPower(state, Date.now() < frenzyUntil);
    earn(gain); state.clicks++;
    floatText('+' + format(gain), event);
    checkAchievements(); render();
  });
  golden.addEventListener('click', event => {
    if (golden.hidden || Date.now() > goldenUntil) return;
    golden.hidden = true;
    goldenUntil = 0;
    nextGolden = Date.now() + 65000 + Math.random() * 55000;
    if (Math.random() < 0.55) {
      frenzyUntil = Date.now() + 25000;
      toast('Safra dourada: 7× por 25 segundos!');
    } else {
      const reward = Math.max(C.production(state) * 120, C.clickPower(state) * 77, 77);
      earn(reward);
      floatText('+' + format(reward), event);
      toast('Caju dourado: +' + format(reward) + ' copos!');
      checkAchievements();
    }
    render(); save();
  });
  function showRanking(rows) {
    const list = $('rankingList');
    list.replaceChildren();
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = 'Ainda não há partidas salvas no ranking.';
      list.append(empty);
      return;
    }
    for (const row of rows) {
      const item = document.createElement('div');
      item.className = 'rank-entry' + (row.is_me ? ' is-me' : '');
      const place = document.createElement('span');
      place.className = 'rank-place';
      place.textContent = Number(row.place) <= 3 ? ['🥇','🥈','🥉'][Number(row.place) - 1] : '#' + row.place;
      const player = document.createElement('div');
      player.className = 'rank-player';
      const name = document.createElement('strong');
      name.textContent = (row.player_name || 'Jogador') + (row.is_me ? ' · Você' : '');
      const handle = document.createElement('small');
      handle.textContent = row.player_handle ? '@' + row.player_handle : 'Jogador do álbum';
      player.append(name, handle);
      const score = document.createElement('div');
      score.className = 'rank-score';
      const main = document.createElement('b');
      main.textContent = rankingSort === 'rebirths' ? precise(Number(row.rebirth_count)) + ' 🌰' : format(Number(row.caju_total)) + ' 🧃';
      const secondary = document.createElement('small');
      secondary.textContent = rankingSort === 'rebirths' ? format(Number(row.caju_total)) + ' copos' : row.rebirth_count + ' renasc.';
      score.append(main, secondary);
      item.append(place, player, score);
      list.append(item);
    }
  }
  async function loadRanking() {
    const requestId = ++rankingRequest;
    if (!cloud.user) {
      $('rankingList').replaceChildren();
      $('rankingStatus').textContent = 'Entre com a conta do álbum para ver o ranking.';
      return;
    }
    $('refreshRanking').disabled = true;
    $('rankingStatus').textContent = 'Atualizando ranking…';
    const userId = cloud.user.id;
    const sort = rankingSort;
    try {
      save();
      const synced = await cloud.flush();
      const rows = await cloud.leaderboard(sort);
      if (requestId !== rankingRequest || cloud.user?.id !== userId) return;
      showRanking(Array.isArray(rows) ? rows : []);
      $('rankingStatus').textContent = synced ? 'Atualizado com sua partida salva.' : 'Seu progresso local ainda não foi sincronizado.';
    } catch (error) {
      if (requestId === rankingRequest) $('rankingStatus').textContent = 'Não foi possível carregar o ranking: ' + error.message;
    } finally {
      if (requestId === rankingRequest) $('refreshRanking').disabled = false;
    }
  }
  document.querySelectorAll('[data-rank]').forEach(button => button.addEventListener('click', () => {
    rankingSort = button.dataset.rank;
    document.querySelectorAll('[data-rank]').forEach(option => {
      const selected = option === button;
      option.classList.toggle('selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    loadRanking();
  }));
  $('refreshRanking').addEventListener('click', loadRanking);
  function setTab(name) {
    for (const tab of ['Upgrades','Achievements','Prestige','Leaderboard']) {
      const active = tab === name;
      $('tab' + tab).classList.toggle('active', active);
      $('tab' + tab).setAttribute('aria-selected', String(active));
      $(tab.toLowerCase() + 'Panel').hidden = !active;
    }
    if (name === 'Leaderboard') loadRanking();
  }
  ['Upgrades','Achievements','Prestige','Leaderboard'].forEach(name => $('tab' + name).addEventListener('click', () => setTab(name)));
  const dialog = $('rebirthDialog');
  $('rebirthButton').addEventListener('click', () => {
    if (!C.prestigePending(state)) return;
    $('dialogPending').textContent = format(C.prestigePending(state));
    dialog.showModal();
  });
  $('cancelRebirth').addEventListener('click', () => dialog.close());
  $('confirmRebirth').addEventListener('click', async () => {
    const gain = C.rebirth(state);
    dialog.close();
    if (!gain) return;
    frenzyUntil = 0; golden.hidden = true; goldenUntil = 0;
    nextGolden = Date.now() + 60000;
    checkAchievements(); lastUpgradeSignature = '';
    renderAchievements(); render(true); save();
    if (cloud.user) localStorage.setItem(pendingRewardKey(cloud.user.id), String(state.rebirths));
    try {
      const reward = await claimAlbumRebirth(state.rebirths);
      toast('Nova safra! +' + format(gain) + ' castanhas · +' + reward.reward + ' 🧃 no álbum');
    } catch (error) {
      toast('Nova safra! +' + format(gain) + ' castanhas. ' + error.message);
    }
  });

  addOfflineProgress();
  function frame(now) {
    const current = Date.now();
    const dt = Math.min(.25, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    if (!document.hidden) {
      earn(C.production(state, current < frenzyUntil) * dt);
      if (current >= nextGolden && !goldenUntil) { goldenUntil = current + 12000; golden.hidden = false; }
      if (goldenUntil && current > goldenUntil) { goldenUntil = 0; golden.hidden = true; nextGolden = current + 65000 + Math.random() * 55000; }
      if (now - lastUi > 250) { lastUi = now; checkAchievements(); render(); }
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else {
      const gap = Math.min(4 * 3600, Math.max(0, (Date.now() - state.savedAt) / 1000));
      const gain = Math.floor(C.production(state) * gap * .4);
      if (gain) { earn(gain); toast('Produção ausente: +' + format(gain)); }
      state.savedAt = Date.now();
      lastFrame = performance.now();
      checkAchievements(); render(); save();
    }
  });
  window.addEventListener('beforeunload', save);
  setInterval(() => { if (!document.hidden) save(); }, 5000);
  renderAchievements(); checkAchievements(); render(); requestAnimationFrame(frame);
})();
