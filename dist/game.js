(() => {
  'use strict';
  const C = window.CajuCore;
  const S = window.CajuStickers;
  const $ = id => document.getElementById(id);
  const saveKey = 'suco-de-caju-clicker-v2';
  const gameVersion = '2026-09-30-8';
  const oldKey = 'suco-de-caju-clicker-v1';
  const cloud = window.CajuCloud;
  const userSaveKey = id => 'suco-de-caju-clicker-user-' + id;
  const pendingRewardKey = id => 'suco-de-caju-clicker-pending-rebirth-' + id;
  const format = window.CajuNumbers.format;
  const precise = window.CajuNumbers.formatFraction;
  const FX = window.CajuEffects;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(saveKey) || localStorage.getItem(oldKey)); } catch (_) {}
  let state = C.normalize(raw);
  let stickerOwned = {};
  let stickerUser = null;
  let stickerRequest = 0;
  let stickerLoading = false;
  let stickerBuff = null;
  let buffReceivedAt = 0;
  let buffUser = null;
  let buffRequest = 0;
  let buffBusy = false;
  const buffNow = () => stickerBuff ? stickerBuff.serverNow + performance.now() - buffReceivedAt : Date.now();
  const skinMultiplier = () => cloud.user?.id === stickerUser && buffUser === cloud.user?.id
    ? S.buffMultiplier(stickerBuff, state.skin, stickerOwned, buffNow()) : 1;
  const productionMultiplier = () => (currentBoost()?.production || 1) * skinMultiplier();
  const remainingTime = ms => { const seconds = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); };
  async function syncStickerBuff(cardId = null) {
    if (cardId === null && buffBusy) return false;
    const userId = cloud.user?.id;
    if (!userId) return false;
    const requestId = ++buffRequest;
    if (cardId !== null) buffBusy = true;
    renderBuff();
    try {
      const result = await cloud.stickerBuff(cardId);
      if (requestId !== buffRequest || cloud.user?.id !== userId) return false;
      stickerBuff = result; buffReceivedAt = performance.now(); buffUser = userId;
      if (cardId !== null) toast('Buff de figurinha ativado por 10 minutos!');
      return true;
    } catch (error) {
      if (cardId !== null) toast(error.message);
      return false;
    } finally {
      if (requestId === buffRequest) { buffBusy = false; renderBuff(); }
    }
  }
  function renderBuff() {
    const button = $('activateStickerBuff');
    const status = $('stickerBuffStatus');
    const card = S.cardForSkin(state.skin);
    const eligible = cloud.user?.id === stickerUser && card && S.hasOwned(stickerOwned, card.id);
    const now = buffNow();
    button.disabled = !eligible || buffBusy || buffUser !== cloud.user?.id || stickerBuff?.readyAt > now;
    button.textContent = eligible ? `Ativar buff ${String(card.multiplier).replace('.', ',')}× · ${card.rarityName}` : 'Ativar buff da figurinha';
    if (buffBusy) status.textContent = 'Ativando no servidor…';
    else if (stickerBuff?.until > now && buffUser === cloud.user?.id) {
      status.textContent = stickerBuff.owned === false ? 'Figurinha fora da coleção: bônus indisponível. O cooldown continua.' : skinMultiplier() > 1
        ? `Produção ${String(skinMultiplier()).replace('.', ',')}× · termina em ${remainingTime(stickerBuff.until - now)}`
        : `Buff pausado: equipe a figurinha #${stickerBuff.cardId}. Tempo restante: ${remainingTime(stickerBuff.until - now)}.`;
    } else if (stickerBuff?.readyAt > now && buffUser === cloud.user?.id) status.textContent = `Próximo buff em ${remainingTime(stickerBuff.readyAt - now)}. A espera é compartilhada por todas as skins.`;
    else if (!eligible) status.textContent = 'Equipe uma figurinha da sua coleção para usar seu buff.';
    else if (buffUser !== cloud.user?.id) status.textContent = 'Conferindo disponibilidade do buff…';
    else status.textContent = '10 min de efeito + 30 min de cooldown. Bônus de produção combina com eventos; não aumenta o clique básico.';
  }
  function renderStickerGrid() {
    const grid = $('stickerGrid');
    grid.replaceChildren();
    const query = $('stickerSearch').value.trim().toLocaleLowerCase('pt-BR');
    const cards = S.ownedCards(stickerOwned);
    $('stickerDialogStatus').textContent = stickerLoading ? 'Conferindo sua coleção…' : `${cards.length} figurinhas disponíveis · escolha uma para clicar.`;
    for (const card of cards.filter(c => (c.name + ' ' + c.id).toLocaleLowerCase('pt-BR').includes(query))) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'sticker-option';
      button.classList.toggle('selected', state.skin === 'sticker:' + card.id);
      button.setAttribute('aria-pressed', String(state.skin === 'sticker:' + card.id));
      const image = document.createElement('img'); image.src = card.image; image.alt = ''; image.loading = 'lazy'; image.draggable = false;
      const label = document.createElement('span'); label.textContent = `#${card.id} · ${card.name} · ${card.rarityName} · ${String(card.multiplier).replace('.', ',')}×`;
      button.append(image, label);
      button.addEventListener('click', async () => {
        button.disabled = true;
        const userId = cloud.user?.id;
        if (!await refreshStickers() || userId !== cloud.user?.id || !S.hasOwned(stickerOwned, card.id)) {
          toast('Não foi possível confirmar que esta figurinha está na sua conta.'); return;
        }
        state.skin = 'sticker:' + card.id;
        $('stickerDialog').close(); render(); save();
        toast('Skin equipada: ' + card.name);
      });
      grid.append(button);
    }
    if (!cards.length && !stickerLoading) $('stickerDialogStatus').textContent = 'Você ainda não tem figurinhas. Abra pacotes no álbum para desbloquear skins.';
  }
  async function refreshStickers() {
    const userId = cloud.user?.id;
    if (!userId) return false;
    const requestId = ++stickerRequest;
    stickerLoading = true;
    $('stickerStatus').textContent = 'Conferindo suas figurinhas no álbum…';
    if ($('stickerDialog').open) renderStickerGrid();
    try {
      const owned = await cloud.ownedStickers();
      if (requestId !== stickerRequest || cloud.user?.id !== userId) return false;
      stickerOwned = owned; stickerUser = userId; stickerLoading = false;
      const selected = S.cardForSkin(state.skin);
      if (selected && !S.hasOwned(owned, selected.id)) {
        state.skin = 'cup'; save(); toast('Esta figurinha não está mais na sua coleção. Skin do copo equipada.');
      }
      $('stickerStatus').textContent = `${S.ownedCards(owned).length} figurinhas da sua conta disponíveis como skin.`;
      render(); if ($('stickerDialog').open) renderStickerGrid();
      syncStickerBuff();
      return true;
    } catch (_) {
      if (requestId === stickerRequest) {
        stickerLoading = false;
        $('stickerStatus').textContent = 'Não foi possível atualizar a coleção. Tente novamente em Minhas figurinhas.';
        if ($('stickerDialog').open) $('stickerDialogStatus').textContent = 'Falha ao conferir a coleção. Clique em Atualizar coleção para tentar novamente.';
      }
      return false;
    }
  }
  let buyMode = '1';
  const pedroMotion = window.CajuHandMotion.create();
  let clickUiDirty = false;
  let lastClickUi = -Infinity;
  function renderHands(now = performance.now()) {
    const motion = pedroMotion.view(now);
    const button = $('juiceButton');
    if (state.skin === 'pedro67' && !motion.moving) {
      const source = motion.left ? './pedro-67-left.webp' : './pedro-67-right.webp';
      if ($('skinImage').getAttribute('src') !== source) $('skinImage').setAttribute('src', source);
    }
    button.classList.toggle('pedro-moving', state.skin === 'pedro67' && motion.moving);
    button.dataset.pedroStart = motion.initialLeft ? '6' : '7';
    button.dataset.pedroPose = state.skin === 'pedro67' ? (motion.left ? '6' : '7') : '';
    return motion;
  }
  let lastFrame = performance.now();
  let lastUi = 0;
  let lastUpgradeSignature = null;
  let toastTimer;
  let rankingSort = 'rebirths';
  let rankingRequest = 0;
  let updatePending = false;
  let checkingVersion = false;
  const buildingButtons = [];
  const buildingList = $('buildingList');
  const upgradeList = $('upgradeList');
  const achievementList = $('achievementList');
  const permanentButtons = [];
  const eventButton = $('eventButton');
  const currentBoost = (now = Date.now()) => state.activeBoost?.until > now ? state.activeBoost : null;
  const nextEventDelay = () => C.eventDelay(state);

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
    const elapsed = Math.min(C.offlineLimit(state), Math.max(0, (Date.now() - state.savedAt) / 1000));
    const offline = Math.floor(C.production(state) * elapsed * C.offlineRate(state));
    if (offline) { earn(offline); toast('Enquanto você esteve fora: +' + format(offline) + ' copos'); save(); }
  }
  cloud.init({
    authorized({ user, state: remote, newAccount, mode }) {
      if (stickerUser !== user.id) { stickerRequest++; stickerOwned = {}; stickerUser = null; buffRequest++; stickerBuff = null; buffUser = null; buffBusy = false; }
      if (remote && !remote.rebirths) localStorage.removeItem(pendingRewardKey(user.id));
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
      refreshStickers();
      if (!$('leaderboardPanel').hidden) loadRanking();
    },
    skinChanged(skin, savedSkin) {
      if (state.skin !== savedSkin) return;
      state.skin = S.normalizeSkin(skin); render(); save();
    },
    signedOut() {
      stickerRequest++; stickerOwned = {}; stickerUser = null; stickerLoading = false;
      buffRequest++; stickerBuff = null; buffUser = null; buffBusy = false;
      $('stickerDialog').close();
      $('stickerStatus').textContent = 'Entre com a conta do álbum para usar suas figurinhas.';
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
    const cps = C.production(state);
    let changed = false;
    for (const a of C.ACHIEVEMENTS) {
      const value = C.progressValue(state, a, cps);
      if (value >= a.at && !state.achievements.includes(a.id)) {
        state.achievements.push(a.id);
        changed = true;
      }
    }
    if (changed) { renderAchievements(); FX.celebrate(document.querySelector('.play')); toast('Nova conquista desbloqueada!'); save(); }
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
      FX.animate(button, [{ transform: 'scale(.97)' }, { transform: 'scale(1.015)', borderColor: '#ffe2a1' }, { transform: 'scale(1)' }]);
      FX.animate($('cps'), [{ color: '#fff6c9', transform: 'scale(1.1)' }, { transform: 'scale(1)' }]);
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
        FX.animate($('upgradeList'), [{ opacity: .6, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }]);
        toast(u.name + ' comprada!');
        render(true); save();
      });
      upgradeList.append(button);
    });
  }
  const missionCards = C.MISSIONS.map(m => {
    const card = document.createElement('article');
    card.className = 'mission-card';
    card.innerHTML = `<strong>${m.name}</strong><p>${m.description}</p><progress max="${m.at}" value="0" aria-label="${m.name}"></progress><div class="mission-meta"></div><button class="primary" type="button">Resgatar recompensa</button>`;
    card.querySelector('button').addEventListener('click', () => {
      const gain = C.claimMission(state, m.id);
      if (!gain) return;
      checkAchievements(); render(true); save();
      FX.celebrate(document.querySelector('.play'));
      toast('Desafio concluído! +' + format(gain) + ' copos');
    });
    $('missionList').append(card);
    return card;
  });
  function renderMissions() {
    if ($('missionsPanel').hidden) return;
    $('missionCount').textContent = `${state.claimedMissions.length} de ${C.MISSIONS.length} resgatados nesta safra`;
    const cps = C.production(state);
    const reward = C.missionReward(state, cps);
    C.MISSIONS.forEach((m, i) => {
      const card = missionCards[i];
      const value = C.progressValue(state, m, cps);
      const claimed = state.claimedMissions.includes(m.id);
      card.querySelector('progress').value = Math.min(m.at, value);
      card.querySelector('.mission-meta').textContent = `${format(Math.min(m.at, value))} / ${format(m.at)} · +${format(reward)} copos`;
      const button = card.querySelector('button');
      button.disabled = claimed || value < m.at;
      button.textContent = claimed ? 'Resgatado nesta safra' : 'Resgatar recompensa';
      card.classList.toggle('completed', claimed);
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
  C.PERMANENT_UPGRADES.forEach(u => {
    const button = document.createElement('button');
    button.className = 'upgrade';
    button.innerHTML = `<span class="upgrade-icon" aria-hidden="true">${u.icon}</span><span class="upgrade-main"><strong>${u.name}</strong><small>${u.description}</small><small class="permanent-level"></small></span><span class="upgrade-price"></span>`;
    button.addEventListener('click', () => {
      if (!C.buyPermanent(state, u.id)) return;
      FX.animate(button, [{ backgroundColor: '#795322', transform: 'scale(1.02)' }, { transform: 'scale(1)' }], 500);
      toast(u.name + ': buff permanente comprado!');
      render(); save();
    });
    $('permanentList').append(button);
    permanentButtons.push(button);
  });
  function render(force = false) {
    const selectedSticker = S.cardForSkin(state.skin);
    const sticker = cloud.user?.id === stickerUser && selectedSticker && S.hasOwned(stickerOwned, selectedSticker.id) ? selectedSticker : null;
    const pedroSkin = state.skin === 'pedro67';
    const handMotion = renderHands();
    $('openStickers').disabled = !cloud.user;
    $('openStickers').classList.toggle('selected', !!sticker);
    const skinImage = $('skinImage');
    const skinSource = sticker ? sticker.image : pedroSkin ? (handMotion.left ? './pedro-67-left.webp' : './pedro-67-right.webp') : './caju.webp';
    if (skinImage.getAttribute('src') !== skinSource) skinImage.setAttribute('src', skinSource);
    $('juiceButton').classList.toggle('pedro-skin', pedroSkin);
    $('juiceButton').classList.toggle('sticker-skin', !!sticker);
    $('juiceButton').setAttribute('aria-label', sticker ? sticker.name + ': preparar suco de caju' : pedroSkin ? 'Pedro Victor fazendo 6 7: preparar suco de caju' : 'Preparar suco de caju');
    document.querySelectorAll('[data-skin]').forEach(button => {
      const selected = button.dataset.skin === state.skin;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderBuff();
    $('juiceCount').textContent = format(state.juice);
    const boost = currentBoost();
    $('cps').textContent = precise(C.production(state, productionMultiplier()));
    $('clickValue').textContent = format(C.clickPower(state, boost?.click || 1, productionMultiplier()));
    $('runTotal').textContent = format(state.runProduced);
    $('allTime').textContent = format(state.allTime);
    $('ownedTotal').textContent = format(state.owned.reduce((a,b) => a+b,0)) + ' unidades';
    C.BUILDINGS.forEach((b, i) => {
      const button = buildingButtons[i];
      const amount = quantityFor(b);
      const cost = amount ? C.batchCost(b, state.owned[i], amount) : C.price(b, state.owned[i]);
      button.disabled = !amount || state.juice + 1e-8 < cost;
      button.classList.toggle('locked', !state.owned[i] && state.runProduced < b.base / 2);
      button.querySelector('.cost').textContent = amount ? format(cost) : '—';
      button.querySelector('.owned').textContent = `${format(state.owned[i])} • +${format(buyMode === 'max' ? amount : Number(buyMode))}`;
      button.title = `${b.name}: ${precise(b.cps)} copos/s por unidade. ${format(amount)} por ${precise(cost)} copos.`;
    });
    renderUpgrades();
    renderMissions();
    const pending = C.prestigePending(state);
    $('prestigeTotal').textContent = format(state.prestige);
    $('prestigeBonus').textContent = '+' + format(C.earnedNuts(state)) + '%';
    $('prestigePending').textContent = format(pending);
    $('nextPrestige').textContent = format(Math.max(0, C.prestigeCost(state, pending + 1) - state.juice));
    $('rebirthCount').textContent = format(state.rebirths);
    $('rebirthButton').disabled = pending < 1;
    $('rebirthButton').textContent = pending ? `Renascer e ganhar ${format(pending)} 🌰` : 'Renascer (ainda sem castanhas)';
    C.PERMANENT_UPGRADES.forEach((u, i) => {
      const level = C.permanentLevel(state, u.id);
      const maxed = level >= u.max;
      permanentButtons[i].disabled = maxed || state.prestige < C.permanentCost(state, u);
      permanentButtons[i].querySelector('.permanent-level').textContent = `Nível ${level}/${u.max}`;
      permanentButtons[i].querySelector('.upgrade-price').textContent = maxed ? 'MÁX' : format(C.permanentCost(state, u)) + ' 🌰';
    });
    const seconds = boost ? Math.ceil((boost.until - Date.now()) / 1000) : 0;
    const label = C.EVENTS.find(e => e.id === boost?.id)?.name || 'Bônus da safra';
    $('bonusStatus').textContent = boost ? `${label}: produção ${boost.production}× e clique ${boost.click}× por ${seconds}s` : sticker ? 'Clique na figurinha para preparar suco' : pedroSkin ? 'Clique no Pedro Victor para preparar suco' : 'Clique no copo para preparar suco';
    $('bonusStatus').classList.toggle('active', !!boost);
    const pendingEvent = state.pendingEvent && state.pendingEvent.until > Date.now() ? C.EVENTS.find(e => e.id === state.pendingEvent.id) : null;
    eventButton.hidden = !pendingEvent;
    if (pendingEvent) {
      eventButton.dataset.kind = pendingEvent.id;
      $('eventIcon').textContent = pendingEvent.icon;
      $('eventLabel').textContent = pendingEvent.name.toUpperCase();
      eventButton.setAttribute('aria-label', `Coletar ${pendingEvent.name}`);
    }
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
    if (area.querySelectorAll('.float').length >= 16) area.querySelector('.float').remove();
    area.append(element);
    setTimeout(() => element.remove(), 850);
  }
  $('juiceButton').addEventListener('click', event => {
    const now = performance.now();
    if (state.skin === 'pedro67') { pedroMotion.click(now); renderHands(now); }
    const boost = currentBoost();
    const gain = C.clickPower(state, boost?.click || 1, productionMultiplier());
    earn(gain); state.clicks++; state.handmade += gain;
    // Só a apresentação é agrupada; saldo e contadores recebem TODOS os cliques.
    clickUiDirty = true;
    if (now - lastClickUi >= 50) {
      lastClickUi = now;
      floatText('+' + format(gain), event);
      if (state.skin !== 'pedro67') FX.click($('juiceButton'), $('juiceArea'), event);
      else FX.burst($('juiceArea'), event);
      checkAchievements(); render(); clickUiDirty = false;
    }
  });
  document.querySelectorAll('[data-skin]').forEach(button => button.addEventListener('click', () => {
    state.skin = button.dataset.skin;
    pedroMotion.reset();
    FX.animate($('juiceButton'), [{ opacity: .2, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }], 450);
    render(); save();
  }));
  $('openStickers').addEventListener('click', () => {
    if (!cloud.user) return;
    $('stickerSearch').value = ''; $('stickerDialog').showModal();
    renderStickerGrid(); refreshStickers();
  });
  $('activateStickerBuff').addEventListener('click', async () => {
    const card = S.cardForSkin(state.skin);
    if (!card || buffBusy || !cloud.user) return;
    await syncStickerBuff(card.id); render();
  });
  $('closeStickers').addEventListener('click', () => $('stickerDialog').close());
  $('refreshStickers').addEventListener('click', refreshStickers);
  $('stickerSearch').addEventListener('input', renderStickerGrid);
  setInterval(() => { if (!document.hidden && cloud.user) refreshStickers(); }, 45000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && cloud.user) refreshStickers(); });
  eventButton.addEventListener('click', event => {
    const pending = state.pendingEvent;
    if (!pending || pending.until <= Date.now()) return;
    state.pendingEvent = null;
    state.nextEventAt = Date.now() + nextEventDelay();
    const reward = C.eventReward(state, pending.id, Math.random() < C.GOLDEN_LUCKY_CHANCE);
    if (!reward) return;
    FX.burst($('juiceArea'), event, 18, true);
    FX.animate($('juiceCount'), [{ transform: 'scale(1.12)', color: '#ffd46c' }, { transform: 'scale(1)' }], 450);
    if (reward.gain) { earn(reward.gain); floatText('+' + format(reward.gain), event); }
    if (reward.boost) state.activeBoost = { id: reward.boost.id, production: reward.boost.production, click: reward.boost.click, until: Date.now() + reward.boost.duration };
    state.eventStats.total++;
    state.eventStats[pending.id]++;
    checkAchievements();
    toast(reward.gain ? `${reward.message} +${format(reward.gain)} copos` : reward.message);
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
      secondary.textContent = rankingSort === 'rebirths' ? format(Number(row.caju_total)) + ' copos' : format(Number(row.rebirth_count)) + ' renasc.';
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
    for (const tab of ['Upgrades','Achievements','Missions','Prestige','Leaderboard']) {
      const active = tab === name;
      $('tab' + tab).classList.toggle('active', active);
      $('tab' + tab).setAttribute('aria-selected', String(active));
      $(tab.toLowerCase() + 'Panel').hidden = !active;
    }
    FX.animate($(name.toLowerCase() + 'Panel'), [{ opacity: .4, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], 220);
    if (name === 'Leaderboard') loadRanking();
    if (name === 'Missions') renderMissions();
  }
  ['Upgrades','Achievements','Missions','Prestige','Leaderboard'].forEach(name => $('tab' + name).addEventListener('click', () => setTab(name)));
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
    FX.celebrate(document.querySelector('.play'));
    FX.animate($('prestigeTotal'), [{ transform: 'scale(1.3)', color: '#fff2ad' }, { transform: 'scale(1)' }], 650);
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
    renderHands(now);
    if (!document.hidden) {
      earn(C.production(state, productionMultiplier()) * dt);
      if (state.activeBoost && state.activeBoost.until <= current) { state.activeBoost = null; save(); }
      if (state.pendingEvent && state.pendingEvent.until <= current) {
        state.pendingEvent = null;
        state.nextEventAt = current + nextEventDelay();
        save();
      }
      if (!state.pendingEvent && current >= state.nextEventAt) {
        const selected = C.selectEvent();
        state.pendingEvent = { id: selected.id, until: current + C.eventLifetime(state, selected) };
        save();
      }
      if (clickUiDirty && now - lastClickUi >= 50) { lastClickUi = now; checkAchievements(); render(); clickUiDirty = false; }
      if (now - lastUi > 250) { lastUi = now; checkAchievements(); render(); }
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else {
      const gap = Math.min(C.offlineLimit(state), Math.max(0, (Date.now() - state.savedAt) / 1000));
      const gain = Math.floor(C.production(state) * gap * C.offlineRate(state));
      if (gain) { earn(gain); toast('Produção ausente: +' + format(gain)); }
      state.savedAt = Date.now();
      lastFrame = performance.now();
      checkAchievements(); render(); save(); checkForUpdate();
    }
  });
  async function checkForUpdate() {
    if (updatePending || checkingVersion || document.hidden) return;
    checkingVersion = true;
    try {
      const response = await fetch('./version.json?check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return;
      const latest = await response.json();
      if (typeof latest.version !== 'string' || latest.version === gameVersion || document.querySelector('dialog[open]')) return;
      updatePending = true;
      if (!save() || (cloud.user && !(await cloud.flush()))) {
        updatePending = false;
        $('saveStatus').textContent = 'Atualização pendente: salve a partida para continuar';
        return;
      }
      window.location.reload();
    } catch (_) { updatePending = false; }
    finally { checkingVersion = false; }
  }
  window.addEventListener('beforeunload', save);
  setInterval(() => { if (!document.hidden) save(); }, 5000);
  setInterval(checkForUpdate, 45000);
  setTimeout(checkForUpdate, 12000);
  renderAchievements(); checkAchievements(); render(); requestAnimationFrame(frame);
})();
