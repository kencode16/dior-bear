// D 介面共用小工具：SVG 轉圖片、頂部列、星星數、可愛提示、彈窗、確認框、解鎖卡片。
import { GAME_NAME } from '../config.js';
import { bearSVG } from '../art/chars.js';

export const INK = '#5A3A2E';

/** HTML 跳脫 */
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** SVG 字串 → data URL（每張圖獨立，漸層 id 不會互相打架） */
export function svgURL(s) {
  let t = String(s || '');
  if (t && !/xmlns=/.test(t)) t = t.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(t);
}
export const svgImg = (s, cls = '', alt = '') => `<img class="${cls}" src="${svgURL(s)}" alt="${esc(alt)}" draggable="false">`;

/** 安全呼叫（依賴模組還是佔位版或出錯時不要讓整個畫面掛掉） */
export function safe(fn, fallback = '') {
  try { const v = fn(); return v == null ? fallback : v; } catch (e) { console.warn('[ui] 依賴呼叫失敗', e); return fallback; }
}

export const STAR_PATH = 'M12 2.4l2.83 5.9 6.47.8-4.76 4.45 1.2 6.4L12 16.8l-5.74 3.15 1.2-6.4L2.7 9.1l6.47-.8z';
export const starIcon = (cls = 'u-star') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR_PATH}" fill="#FFC94D" stroke="#D99A2B" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
export const starRow = (n, max = 3, cls = 'u-stars') =>
  `<span class="${cls}">${Array.from({ length: max }, (_, i) => `<svg viewBox="0 0 24 24" class="${i < n ? 'on' : 'off'}"><path d="${STAR_PATH}"/></svg>`).join('')}</span>`;

/** 標題徽章（金圈裡的小熊頭；取自風格試作的 logo） */
export function logoSVG() {
  let dots = '';
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; dots += `<circle cx="${(22 + Math.cos(a) * 19.4).toFixed(2)}" cy="${(22 + Math.sin(a) * 19.4).toFixed(2)}" r=".95" fill="#FFF6D8"/>`; }
  return `<svg viewBox="0 0 44 44" aria-hidden="true"><defs><radialGradient id="u-logo-gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FBE3A0"/><stop offset=".6" stop-color="#E7B95A"/><stop offset="1" stop-color="#C98F1F"/></radialGradient></defs>` +
    `<circle cx="22" cy="22" r="21.5" fill="url(#u-logo-gold)" stroke="#C98F1F" stroke-width="1"/>${dots}` +
    `<circle cx="22" cy="22" r="17.4" fill="#FFE4EB" stroke="#fff" stroke-width="1.4"/>` +
    `<circle cx="13.8" cy="15.4" r="5" fill="#FFF1DE" stroke="#D6A985" stroke-width="1.8"/><circle cx="13.8" cy="15.4" r="2.5" fill="#FFC4D0"/>` +
    `<circle cx="30.2" cy="15.4" r="5" fill="#FFF1DE" stroke="#D6A985" stroke-width="1.8"/><circle cx="30.2" cy="15.4" r="2.5" fill="#FFC4D0"/>` +
    `<ellipse cx="22" cy="24.4" rx="11.6" ry="9.8" fill="#FFF1DE" stroke="#D6A985" stroke-width="1.8"/>` +
    `<circle cx="17.8" cy="23.4" r="1.45" fill="${INK}"/><circle cx="26.2" cy="23.4" r="1.45" fill="${INK}"/>` +
    `<circle cx="18.3" cy="22.8" r=".5" fill="#fff"/><circle cx="26.7" cy="22.8" r=".5" fill="#fff"/>` +
    `<ellipse cx="15.2" cy="27" rx="2.1" ry="1.25" fill="#FF97AC" opacity=".6"/><ellipse cx="28.8" cy="27" rx="2.1" ry="1.25" fill="#FF97AC" opacity=".6"/>` +
    `<ellipse cx="22" cy="27.4" rx="3.8" ry="2.7" fill="#FFFAF3"/><ellipse cx="22" cy="26.4" rx="1.5" ry="1.05" fill="#7A4A38"/>` +
    `<path d="M22 14.8 C19 12.2 16.6 13.2 17.1 15.3 C17.6 17.3 20 16.9 22 14.8 Z M22 14.8 C25 12.2 27.4 13.2 26.9 15.3 C26.4 17.3 24 16.9 22 14.8 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="1"/>` +
    `<circle cx="22" cy="14.8" r="1.15" fill="#F6CF66"/></svg>`;
}

/** 丁噹熊頭像（從 bearSVG 裁出頭部） */
export function bearHead(app, expr = 'happy', cls = '') {
  const s = safe(() => bearSVG({ expr, outfit: app?.save?.equipped?.() || {}, perfumeColor: perfumeColor(app) }), '');
  return `<span class="u-bearhead ${cls}">${s ? svgImg(s) : ''}</span>`;
}

export function perfumeColor(app) {
  const id = app?.save?.perfume?.();
  return app?.items?.PERFUMES?.find(p => p.id === id)?.color || '#FF9EB5';
}

/** 星星數膠囊，會跟著存檔自動更新 */
export function starPill(app) {
  const el = document.createElement('div');
  el.className = 'u-starpill';
  const draw = () => { el.innerHTML = `${starIcon()}<b>${app.save.starsAvailable()}</b>`; };
  draw();
  const off = app.save.onChange(draw);
  return { el, destroy: off };
}

/** 頂部列：返回鈕＋標題＋星星數 */
export function topBar(app, { title = '', back = 'home', backLabel = '首頁', onBack } = {}) {
  const el = document.createElement('header');
  el.className = 'u-topbar';
  el.innerHTML = `<button class="u-back" aria-label="返回${esc(backLabel)}"><svg viewBox="0 0 24 24"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${esc(backLabel)}</span></button>` +
    `<h1 class="u-title">${esc(title)}</h1>`;
  const sp = starPill(app);
  el.appendChild(sp.el);
  el.querySelector('.u-back').addEventListener('click', () => {
    app.audio.sfx('tap');
    if (onBack) onBack(); else app.go(back);
  });
  return { el, destroy: sp.destroy };
}

/** 丁噹熊從下方冒出來說一句話（可愛提示） */
let sayTimer = 0;
export function bearSay(app, text, ms = 2300) {
  document.querySelector('.u-say')?.remove();
  const el = document.createElement('div');
  el.className = 'u-say';
  el.innerHTML = `${bearHead(app, 'happy')}<span class="u-say-text">${esc(text)}</span>`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, ms);
}

/** 彈窗。回傳 { el, box, close, closed(Promise) } */
export function modal({ html = '', cls = '', closable = true, onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'u-modal';
  el.innerHTML = `<div class="u-modal-box card ${cls}" role="dialog">${closable ? '<button class="u-modal-x" aria-label="關閉">×</button>' : ''}${html}</div>`;
  document.body.appendChild(el);
  const box = el.querySelector('.u-modal-box');
  let resolve;
  const closed = new Promise(r => { resolve = r; });
  let done = false;
  const close = (v) => {
    if (done) return; done = true;
    el.classList.add('out');
    setTimeout(() => el.remove(), 200);
    onClose?.(v);
    resolve(v);
  };
  if (closable) {
    el.querySelector('.u-modal-x').addEventListener('click', () => close());
    el.addEventListener('click', e => { if (e.target === el) close(); });
  }
  return { el, box, close, closed };
}

/** 確認框 → Promise<boolean> */
export function confirmBox(app, { title = '', text = '', ok = '確定', cancel = '取消', danger = false } = {}) {
  const m = modal({
    cls: 'u-confirm',
    html: `${bearHead(app, danger ? 'worried' : 'normal', 'big')}<h3>${esc(title)}</h3><p>${esc(text)}</p>` +
      `<div class="u-row"><button class="btn ghost" data-v="0">${esc(cancel)}</button><button class="btn ${danger ? '' : 'mint'}" data-v="1">${esc(ok)}</button></div>`,
  });
  m.box.addEventListener('click', e => {
    const b = e.target.closest('[data-v]');
    if (b) { app.audio.sfx('tap'); m.close(b.dataset.v === '1'); }
  });
  return m.closed.then(v => !!v);
}

/** 依序跳出解鎖卡片：[{ art: svg字串, tag:'新香水', title, text }] */
export async function showCards(app, cards) {
  for (const c of cards) {
    const m = modal({
      cls: 'u-unlock',
      closable: false,
      html: `<div class="u-unlock-tag">${esc(c.tag || '解鎖')}</div><div class="u-unlock-art">${c.art ? svgImg(c.art) : bearHead(app, 'happy', 'big')}</div>` +
        `<h3>${esc(c.title)}</h3>${c.text ? `<p>${esc(c.text)}</p>` : ''}<button class="btn" data-ok>好～</button>`,
    });
    app.audio.sfx(c.sfx || 'star', { n: 3 });
    m.box.querySelector('[data-ok]').addEventListener('click', () => { app.audio.sfx('tap'); m.close(true); });
    await m.closed;
  }
}

/** 標題膠囊（首頁用） */
export function titlePill() {
  return `<div class="u-titlepill"><span class="u-logo">${logoSVG()}</span><h1>${esc(GAME_NAME)}<span class="u-spark">✦</span></h1></div>`;
}

/** 簡單的事件／計時器收集器，unmount 時一次清掉 */
export function janitor() {
  const fns = [];
  return {
    add(fn) { fns.push(fn); return fn; },
    timeout(fn, ms) { const t = setTimeout(fn, ms); fns.push(() => clearTimeout(t)); return t; },
    interval(fn, ms) { const t = setInterval(fn, ms); fns.push(() => clearInterval(t)); return t; },
    on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); fns.push(() => target.removeEventListener(ev, fn, opt)); },
    clean() { while (fns.length) { try { fns.pop()(); } catch (e) { console.warn(e); } } },
  };
}

/** UI 小圖示（按鈕用的線條圖示，不是角色美術） */
export const ICONS = {
  wardrobe: `<svg viewBox="0 0 48 48"><path d="M24 12a4 4 0 1 1 4 4c-2 0-4 1.3-4 3.5v1.2M24 20.6 8.5 31.4c-1.6 1.1-.8 3.6 1.1 3.6h28.8c1.9 0 2.7-2.5 1.1-3.6L24 20.6Z" fill="#FFE4EB" stroke="#E8668C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  decorate: `<svg viewBox="0 0 48 48"><path d="M9 26v-6a5 5 0 0 1 5-5h20a5 5 0 0 1 5 5v6" fill="#E3F6E8" stroke="#4FA06A" stroke-width="3" stroke-linejoin="round"/><rect x="6" y="24" width="36" height="11" rx="5" fill="#A8E6B8" stroke="#4FA06A" stroke-width="3"/><path d="M11 35v4M37 35v4" stroke="#4FA06A" stroke-width="3" stroke-linecap="round"/></svg>`,
  perfume: `<svg viewBox="0 0 48 48"><rect x="20" y="7" width="8" height="7" rx="2" fill="#F6CF66" stroke="#C98F1F" stroke-width="2.4"/><path d="M16 17h16l3 6v12a6 6 0 0 1-6 6H19a6 6 0 0 1-6-6V23z" fill="#FFB6C8" stroke="#E8668C" stroke-width="3" stroke-linejoin="round"/><ellipse cx="20" cy="27" rx="2.4" ry="4" fill="#fff" opacity=".7"/><path d="M33 9c3 0 5 2 5 4" fill="none" stroke="#E8668C" stroke-width="2.4" stroke-linecap="round"/><circle cx="38.5" cy="15.5" r="2.6" fill="#FF9EB5"/></svg>`,
  stickers: `<svg viewBox="0 0 48 48"><rect x="8" y="8" width="32" height="34" rx="6" fill="#EFE9FF" stroke="#8A72D6" stroke-width="3"/><path d="M8 16h32" stroke="#8A72D6" stroke-width="3"/><path d="M24 36c-6-3.6-8.6-6.6-8.6-9.6a4.3 4.3 0 0 1 8.6-1 4.3 4.3 0 0 1 8.6 1c0 3-2.6 6-8.6 9.6Z" fill="#FF9EB5" stroke="#E8668C" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
  settings: `<svg viewBox="0 0 48 48"><path d="M24 7l3.4 3.6 4.9-.9 1 4.9 4.5 2.2-1.9 4.6 1.9 4.6-4.5 2.2-1 4.9-4.9-.9L24 36l-3.4-3.6-4.9.9-1-4.9-4.5-2.2 1.9-4.6-1.9-4.6 4.5-2.2 1-4.9 4.9.9z" transform="translate(0 2.5)" fill="#FFF2CC" stroke="#D99A2B" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="24" r="5.5" fill="#fff" stroke="#D99A2B" stroke-width="3"/></svg>`,
  map: `<svg viewBox="0 0 48 48"><path d="M7 13l10-4 14 5 10-4v25l-10 4-14-5-10 4z" fill="#FFF2CC" stroke="#D99A2B" stroke-width="3" stroke-linejoin="round"/><path d="M17 9v25M31 14v25" stroke="#D99A2B" stroke-width="2.4"/><path d="M12 28c4-6 9 2 13-4s7-3 10-6" fill="none" stroke="#E8668C" stroke-width="2.4" stroke-dasharray="2 3" stroke-linecap="round"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="3" fill="#CDBBAA"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#CDBBAA" stroke-width="2.6"/><circle cx="12" cy="15.3" r="1.6" fill="#fff"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#7DD39A"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  none: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="15" fill="none" stroke="#D6A985" stroke-width="3.5" stroke-dasharray="5 5"/><path d="M17 17l14 14" stroke="#D6A985" stroke-width="3.5" stroke-linecap="round"/></svg>`,
};
