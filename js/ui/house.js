// 樹洞小屋場景（首頁與布置共用）：背景＋家具＋梳妝台香水＋丁噹熊與大不溜＋窗外來玩的朋友。
import { houseBgSVG, furnitureSVG, perfumeBottleSVG, friendSVG } from '../art/collections.js';
import { mountDuo } from './charactersView.js';
import { svgImg, safe, perfumeColor, esc } from './uikit.js';

// 疊放順序（後面的蓋在前面上）。角色在 20。
const Z = { wall: 2, curtain: 3, lamp: 4, bed: 5, rug: 6, plant: 7, table: 8 };

const pct = (v, total) => `${(v / total * 100).toFixed(3)}%`;
const rectStyle = (r, V) => `left:${pct(r.x, V.w)};top:${pct(r.y, V.h)};width:${pct(r.w, V.w)};height:${pct(r.h, V.h)}`;

/**
 * 畫小屋。opts：
 *  preview: { slot, id }   試擺（id 為 null 表示預覽收起來）
 *  highlight: slotId       高亮某個位置
 *  duo: true/false         要不要放角色
 *  interactive             角色可不可以點
 *  friends: true/false     窗外偶爾出現已認識的朋友
 *  onSlotTap(slotId)       點家具位置
 *  onVanityTap()           點梳妝台（首頁用來開香水櫃）
 * 回傳 { el, duo, update(opts), destroy() }
 */
export function mountHouse(container, app, opts = {}) {
  const { HOUSE_VIEWBOX: V, HOUSE_SLOTS, VANITY, VANITY_SHELF, WINDOW, DUO_SPOT, PERFUMES, FRIENDS } = app.items;
  let o = { duo: true, interactive: true, friends: false, ...opts };
  const timers = [];

  const el = document.createElement('div');
  el.className = 'u-house';
  el.style.aspectRatio = `${V.w} / ${V.h}`;
  el.innerHTML = `<div class="u-house-bg">${safe(() => svgImg(houseBgSVG(), '', '樹洞小屋'))}</div>` +
    `<div class="u-house-window" style="${rectStyle(WINDOW, V)}"></div>` +
    `<div class="u-house-furn"></div>` +
    `<div class="u-house-shelf" style="${rectStyle(VANITY_SHELF, V)}"></div>` +
    (o.onVanityTap ? `<button class="u-house-vanity" style="${rectStyle(VANITY, V)}" aria-label="梳妝台：打開香水櫃"></button>` : '') +
    `<div class="u-house-duo" style="${rectStyle(DUO_SPOT, V)}"></div>`;
  container.appendChild(el);
  const furnLayer = el.querySelector('.u-house-furn');
  const shelf = el.querySelector('.u-house-shelf');

  let duo = null;
  if (o.duo) {
    duo = safe(() => mountDuo(el.querySelector('.u-house-duo'), { size: 'home', app, interactive: o.interactive }), null);
    if (duo) {
      safe(() => duo.setOutfit(app.save.equipped()));
      safe(() => duo.setPerfume(perfumeColor(app)));
    }
  }

  function drawFurniture() {
    const placed = app.save.house();
    if (o.preview) placed[o.preview.slot] = o.preview.id || undefined;
    furnLayer.innerHTML = HOUSE_SLOTS.map(s => {
      const id = placed[s.id];
      const cls = `u-slot${o.highlight === s.id ? ' hi' : ''}${o.preview?.slot === s.id ? ' preview' : ''}${o.onSlotTap ? ' tappable' : ''}`;
      return `<div class="${cls}" data-slot="${s.id}" style="${rectStyle(s, V)};z-index:${Z[s.id] || 5}">` +
        (id ? safe(() => svgImg(furnitureSVG(id), 'u-furn', s.name)) : (o.highlight === s.id ? `<span class="u-slot-empty">${esc(s.name)}</span>` : '')) +
        `</div>`;
    }).join('');
    const unlocked = app.save.perfumesUnlocked();
    const cur = app.save.perfume();
    shelf.innerHTML = PERFUMES.filter(p => unlocked.includes(p.id))
      .map(p => `<span class="u-house-bottle${p.id === cur ? ' cur' : ''}">${safe(() => svgImg(perfumeBottleSVG(p.id), '', p.name))}</span>`).join('');
  }
  el.querySelector('.u-house-vanity')?.addEventListener('click', e => { e.stopPropagation(); o.onVanityTap?.(); });
  furnLayer.addEventListener('click', e => {
    const n = e.target.closest('.u-slot');
    if (n && o.onSlotTap) o.onSlotTap(n.dataset.slot);
  });

  // 窗外朋友：已認識的朋友偶爾從窗戶探頭打招呼
  function friendVisit() {
    const met = FRIENDS.filter(f => app.save.isCleared(f.chapter * 10));
    if (!met.length || !el.isConnected) return;
    const f = met[Math.floor(Math.random() * met.length)];
    const win = el.querySelector('.u-house-window');
    if (!win || win.querySelector('.u-friend-peek')) return;
    const peek = document.createElement('div');
    peek.className = 'u-friend-peek';
    peek.innerHTML = safe(() => svgImg(friendSVG(f.id, { expr: 'happy' }), '', f.name));
    const hi = document.createElement('div');
    hi.className = 'u-friend-hi';
    hi.textContent = `${f.name}：丁噹熊～出來玩！`;
    win.appendChild(peek);
    el.appendChild(hi);
    peek.addEventListener('click', e => { e.stopPropagation(); app.audio.sfx('tap'); safe(() => duo?.say(`${f.name}來找我們玩了！`)); });
    timers.push(setTimeout(() => { peek.classList.add('out'); hi.classList.add('out'); }, 4200));
    timers.push(setTimeout(() => { peek.remove(); hi.remove(); }, 4800));
  }
  function scheduleFriend(first) {
    if (!o.friends) return;
    timers.push(setTimeout(() => { friendVisit(); scheduleFriend(false); }, first ? 2600 : 12000 + Math.random() * 9000));
  }

  drawFurniture();
  scheduleFriend(true);

  return {
    el,
    get duo() { return duo; },
    update(next = {}) { o = { ...o, ...next }; drawFurniture(); },
    destroy() { timers.forEach(clearTimeout); safe(() => duo?.destroy()); duo = null; el.remove(); },
  };
}
