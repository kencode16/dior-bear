// 時段（主代理擁有）：依玩家手機的時間分四段，畫面背景跟著變。
//   早上 morning 6:00–11:00、下午 day 11:00–16:00、黃昏 dusk 16:00–19:00、晚上 night 19:00–6:00
// 用法：
//   import tod from './timeOfDay.js';
//   tod.current()          → 'morning' | 'day' | 'dusk' | 'night'
//   tod.onChange(fn)       → 時段改變時呼叫 fn(period)，回傳取消訂閱的函式（unmount 時要呼叫）
//   tod.mountSky(container, { fixed })  → 在 container 裡放一層會自動換時段、淡入淡出的天空（漸層＋太陽／月亮／星星）
//                                         回傳 { el, destroy }。fixed:true 鋪滿視窗（z-index -1）。
// <html data-tod="night"> 會隨時段更新，CSS 可以用 html[data-tod=night] .xxx 做變化。
// 測試用：網址加 ?tod=night，或 tod.setOverride('dusk')（傳 null 取消）。玩家看不到這個選項。
import { skyLayerHTML } from './art/sky.js';

export const PERIODS = ['morning', 'day', 'dusk', 'night'];
export const PERIOD_NAMES = { morning: '早上', day: '下午', dusk: '黃昏', night: '晚上' };

export function periodAt(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'day';
  if (h >= 16 && h < 19) return 'dusk';
  return 'night';
}

let override = null;
try {
  const q = new URLSearchParams(location.search).get('tod');
  if (PERIODS.includes(q)) override = q;
} catch (e) { /* 非瀏覽器環境 */ }

let cur = null;
let timer = 0;
const subs = new Set();

function current() { return override || periodAt(); }

function tick() {
  const p = current();
  if (p === cur) return;
  cur = p;
  if (typeof document !== 'undefined') document.documentElement.dataset.tod = p;
  subs.forEach(fn => { try { fn(p); } catch (e) { console.error(e); } });
}

function onChange(fn) { subs.add(fn); return () => subs.delete(fn); }

function setOverride(p) { override = PERIODS.includes(p) ? p : null; tick(); }

/** 一層會自動跟著時段變的天空 */
function mountSky(container, { fixed = false } = {}) {
  const el = document.createElement('div');
  el.className = 'tod-sky' + (fixed ? ' fixed' : '');
  el.setAttribute('aria-hidden', 'true');
  const layers = {};
  const show = p => {
    if (!layers[p]) {
      const l = document.createElement('div');
      l.className = 'tod-layer';
      l.dataset.period = p;
      l.innerHTML = skyLayerHTML(p);
      el.appendChild(l);
      layers[p] = l;
      l.getBoundingClientRect(); // 讓淡入的 transition 生效
    }
    for (const [k, l] of Object.entries(layers)) l.classList.toggle('on', k === p);
  };
  show(current());
  const off = onChange(show);
  if (fixed) container.prepend(el); else container.appendChild(el);
  return { el, destroy() { off(); el.remove(); } };
}

function start() {
  tick();
  clearInterval(timer);
  timer = setInterval(tick, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  window.addEventListener('focus', tick);
}

const tod = { PERIODS, PERIOD_NAMES, periodAt, current, onChange, setOverride, mountSky, start };
export default tod;
