// 樹洞小屋場景（首頁與布置共用）：背景＋家具＋梳妝台香水＋丁噹熊與大不溜＋窗外來玩的朋友。
// 時段（js/timeOfDay.js）：窗外天空、窗光、室內光線跟著變；晚上擺了燈就會亮；晚上朋友不來探頭（大家都睡了）。
import { houseBgSVG, houseLightSVG, furnitureSVG, perfumeBottleSVG, friendSVG } from '../art/collections.js';
import tod from '../timeOfDay.js';
import { mountDuo } from './charactersView.js';
import { svgImg, safe, perfumeColor, esc } from './uikit.js';

// 疊放順序（後面的蓋在前面上）。角色在 20。
const Z = { wall: 2, curtain: 3, lamp: 4, bed: 5, rug: 6, plant: 7, table: 8 };
// 朋友在窗外打招呼的話（每次隨機挑一句；沒列到的朋友用通用句）
const FRIEND_HI = {
  snowball: ['雪球：丁噹熊～一起去抓鮭魚！'],
  sesame: ['芝麻：新衣服做好了，快來試穿！'],
  cocoa: ['可可：熱可可泡好囉～'],
  bobo: ['波波：笑一個！喀嚓～'],
  heitang: ['黑糖：丁噹熊，今天要來上課嗎？', '黑糖：老師帶了新的繪本喔～'],
  maple: ['小楓：遊樂園的音樂響起來囉～！', '小楓：一起去坐旋轉木馬吧！'],
};
const SHELF_ONE_ROW = 5;   // 梳妝台香水超過這個數量就排成前後兩排

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
  el.innerHTML = `<div class="u-house-bg"></div>` +
    `<div class="u-house-window" style="${rectStyle(WINDOW, V)}"></div>` +
    `<div class="u-house-furn"></div>` +
    `<div class="u-house-shelf" style="${rectStyle(VANITY_SHELF, V)}"></div>` +
    (o.onVanityTap ? `<button class="u-house-vanity" style="${rectStyle(VANITY, V)}" aria-label="梳妝台：打開香水櫃"></button>` : '') +
    `<div class="u-house-light" aria-hidden="true"></div>` +
    `<div class="u-house-duo" style="${rectStyle(DUO_SPOT, V)}"></div>`;
  container.appendChild(el);
  const bgLayer = el.querySelector('.u-house-bg');
  const lightLayer = el.querySelector('.u-house-light');

  // ---- 時段：背景與光線淡入淡出 ----
  let period = null, lightKey = '';
  const FADE = 1600;
  // 注意：混合模式（multiply／screen）的節點和它的祖先不能形成獨立疊放圖層（opacity<1、z-index、filter…），
  // 否則混合只在空白背景上算、會變成不透明色塊。所以淡入淡出直接做在混合節點本身。
  function fadeIn(layer, nodes, instant) {
    const old = [...layer.children];
    old.forEach(n => n.classList.remove('on'));
    nodes.forEach(node => {
      node.classList.add('u-fade');
      if (instant) node.classList.add('on');
      layer.appendChild(node);
    });
    if (!instant) { layer.getBoundingClientRect(); nodes.forEach(n => n.classList.add('on')); }
    timers.push(setTimeout(() => old.forEach(n => n.remove()), instant ? 0 : FADE + 100));
  }
  function setBg(p, instant) {
    const d = document.createElement('div');
    d.className = 'u-house-bgimg';
    d.innerHTML = safe(() => svgImg(houseBgSVG({ tod: p }), '', '樹洞小屋'));
    fadeIn(bgLayer, [d], instant);
  }
  function setLight(p, lamp, instant) {
    const key = `${p}|${p === 'night' ? lamp || '' : ''}`;
    if (key === lightKey) return;
    lightKey = key;
    const L = safe(() => houseLightSVG(p, { lamp }), { shade: '', glow: '' });
    const nodes = [];
    for (const [k, svgStr] of [['shade', L.shade], ['glow', L.glow]]) {
      if (!svgStr) continue;
      const d = document.createElement('div');
      d.className = `u-light-${k}`;
      d.dataset.tod = p;
      d.innerHTML = svgStr;
      nodes.push(d);
    }
    fadeIn(lightLayer, nodes, instant);
  }
  const currentLamp = () => {
    const placed = app.save.house();
    if (o.preview) placed[o.preview.slot] = o.preview.id || undefined;
    return placed.lamp || null;
  };
  function applyTod(p, instant) {
    if (p !== period) { period = p; setBg(p, instant); }
    el.dataset.tod = p;
    setLight(p, currentLamp(), instant);
  }
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
    if (period) setLight(period, currentLamp(), false);
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
    const list = PERFUMES.filter(p => unlocked.includes(p.id));
    const bottle = p => `<span class="u-house-bottle${p.id === cur ? ' cur' : ''}">${safe(() => svgImg(perfumeBottleSVG(p.id), '', p.name))}</span>`;
    const two = list.length > SHELF_ONE_ROW;
    shelf.classList.toggle('two', two);
    if (two) {
      // 後排（玻璃層板上）＋前排
      const k = Math.ceil(list.length / 2);
      shelf.innerHTML = `<div class="u-house-row back">${list.slice(0, k).map(bottle).join('')}</div><div class="u-house-row">${list.slice(k).map(bottle).join('')}</div>`;
    } else {
      shelf.innerHTML = list.map(bottle).join('');
    }
  }
  el.querySelector('.u-house-vanity')?.addEventListener('click', e => { e.stopPropagation(); o.onVanityTap?.(); });
  furnLayer.addEventListener('click', e => {
    const n = e.target.closest('.u-slot');
    if (n && o.onSlotTap) o.onSlotTap(n.dataset.slot);
  });

  // 窗外朋友：已認識的朋友偶爾從窗戶探頭打招呼
  function friendVisit() {
    if (tod.current() === 'night') return;   // 晚上大家都睡了
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
    const lines = [`${f.name}：丁噹熊～出來玩！`, ...(FRIEND_HI[f.id] || [])];
    hi.textContent = lines[Math.floor(Math.random() * lines.length)];
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

  applyTod(tod.current(), true);
  drawFurniture();
  scheduleFriend(true);
  const offTod = tod.onChange(p => {
    applyTod(p, false);
    if (p === 'night') el.querySelectorAll('.u-friend-peek,.u-friend-hi').forEach(n => n.classList.add('out'));
  });

  return {
    el,
    get duo() { return duo; },
    update(next = {}) { o = { ...o, ...next }; drawFurniture(); },
    destroy() { offTod(); timers.forEach(clearTimeout); safe(() => duo?.destroy()); duo = null; el.remove(); },
  };
}
