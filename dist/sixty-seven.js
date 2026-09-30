/* Easter egg global: acompanha números visíveis, sem alterar o conteúdo do jogo. */
(function(root) {
  'use strict';
  function matches(text) {
    return [...String(text).matchAll(/(?<![\p{L}\d.,−-])67(?:[.,]0+)?(?![\d.,])/gu)]
      .map(match => ({start:match.index, end:match.index + match[0].length}));
  }
  function newlyVisible(previous, current) {
    return current.filter(key => !previous.has(key));
  }
  function start() {
    const seen = new WeakMap(), pending = new Set(), popups = new Set();
    let scheduled = false;
    const skip = element => !element || element.closest('script,style,noscript,textarea,[data-pedro-67-effect]');
    function position(popup) {
      let box = popup.range ? popup.range.getBoundingClientRect() : popup.anchor.getBoundingClientRect();
      if (!box.width && !box.height) box = popup.anchor.getBoundingClientRect();
      if (!box.width && !box.height) return;
      popup.element.style.left = Math.max(54, Math.min(innerWidth - 54, box.left + box.width / 2)) + 'px';
      popup.element.style.top = Math.max(4, box.top - 106) + 'px';
    }
    function show(anchor, range) {
      const element = document.createElement('span');
      element.className = 'number-67-pedro';
      element.dataset.pedro67Effect = '';
      element.setAttribute('aria-hidden', 'true');
      for (const side of ['left', 'right']) {
        const img = document.createElement('img');
        img.src = './pedro-67-' + side + '.webp';
        img.alt = ''; img.draggable = false;
        img.className = 'number-67-' + side;
        element.append(img);
      }
      const popup = {element, anchor, range};
      (anchor.closest('dialog[open]') || document.body).append(element);
      popups.add(popup); position(popup);
      setTimeout(() => { element.remove(); popups.delete(popup); }, 3000);
    }
    function inspect(element) {
      if (skip(element) || !element.isConnected) return;
      const hits = [];
      if (element.matches('input')) {
        for (const [i] of matches(element.value).entries()) hits.push({key:'input:' + i, range:null});
      } else {
        [...element.childNodes].forEach((node, index) => {
          if (node.nodeType !== 3) return;
          matches(node.textContent).forEach((match, i) => {
            const range = document.createRange();
            range.setStart(node, match.start); range.setEnd(node, match.end);
            hits.push({key:index + ':' + i, range});
          });
        });
      }
      const visible = hits.filter(hit => {
        const box = hit.range ? hit.range.getBoundingClientRect() : element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      const old = seen.get(element) || new Set();
      const fresh = new Set(newlyVisible(old, visible.map(hit => hit.key)));
      for (const hit of visible) if (fresh.has(hit.key)) show(element, hit.range);
      seen.set(element, new Set(visible.map(hit => hit.key)));
    }
    function flush() { scheduled = false; for (const element of pending) inspect(element); pending.clear(); }
    function queue(element) {
      if (skip(element)) return;
      pending.add(element);
      if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
    }
    function scan(node) {
      if (node.nodeType === 3) { queue(node.parentElement); return; }
      if (node.nodeType !== 1 || skip(node)) return;
      queue(node);
      for (const child of node.querySelectorAll('*')) queue(child);
    }
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') queue(record.target.parentElement);
        else { queue(record.target); for (const node of record.addedNodes) scan(node); }
      }
    }).observe(document.body, {subtree:true, childList:true, characterData:true});
    document.addEventListener('input', event => queue(event.target));
    function reposition() { for (const popup of popups) position(popup); }
    let visibilityTimer;
    function viewportChanged() {
      reposition(); clearTimeout(visibilityTimer);
      visibilityTimer = setTimeout(() => scan(document.body), 100);
    }
    window.addEventListener('scroll', viewportChanged, true);
    window.addEventListener('resize', viewportChanged);
    // Abas e diálogos podem revelar números sem modificar os nós de texto.
    document.addEventListener('click', event => {
      if (event.target.closest('#juiceButton')) return;
      clearTimeout(visibilityTimer);
      visibilityTimer = setTimeout(() => scan(document.body), 0);
    });
    scan(document.body);
  }
  const api = {matches, newlyVisible, start};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuSixtySeven = api;
})(typeof window !== 'undefined' ? window : globalThis);
