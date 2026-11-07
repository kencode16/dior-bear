// 啟動與畫面切換（主代理擁有）。
// 每個畫面模組 default export { mount(root, params, app), unmount() }；mount 可以是 async。
import * as config from './config.js';
import * as items from './data/items.js';
import { LEVELS } from './data/levels.js';
import { save } from './save.js';
import audio from './audio.js';
import dialog from './ui/dialog.js';
import tod from './timeOfDay.js';

import home from './ui/home.js';
import map from './ui/map.js';
import wardrobe from './ui/wardrobe.js';
import decorate from './ui/decorate.js';
import perfume from './ui/perfume.js';
import stickers from './ui/stickers.js';
import settings from './ui/settings.js';
import level from './game/gameScreen.js';

const SCREENS = { home, map, wardrobe, decorate, perfume, stickers, settings, level };

const root = document.getElementById('app');
let current = null;
let toastTimer = 0;

export const app = {
  config, items, levels: LEVELS, save, audio, dialog, tod,
  screen: null,
  /** 切換畫面：name 為 SCREENS 的鍵，params 會原封不動傳給 mount */
  async go(name, params = {}) {
    const next = SCREENS[name];
    if (!next) { console.error('沒有這個畫面', name); return; }
    try { current?.unmount?.(); } catch (e) { console.error(e); }
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = `screen screen-${name}`;
    root.appendChild(el);
    current = next;
    app.screen = name;
    window.scrollTo(0, 0);
    await next.mount(el, params, app);
  },
  /** 頂部小提示 */
  toast(msg, ms = 1800) {
    document.querySelector('.toast')?.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), ms);
  },
  levelById: id => LEVELS.find(l => l.id === id),
};

// iOS 要在使用者第一次觸控時解鎖聲音
const unlock = () => { audio.unlock(); };
window.addEventListener('pointerdown', unlock, { capture: true });
window.addEventListener('touchend', unlock, { capture: true });

// 設定同步到音效模組
audio.setSfx(save.settings().sfx);
audio.setMusic(save.settings().music);

// 時段：<html data-tod>、整頁底下的天空層（各畫面自己的背景上另外疊天空層，見 timeOfDay.js）
tod.start();
tod.mountSky(document.body, { fixed: true });

// 開發用：網址加 ?screen=level&level=3 可以直接開某個畫面
const q = new URLSearchParams(location.search);
const startScreen = q.get('screen') || 'home';
const startParams = q.get('level') ? { levelId: Number(q.get('level')) } : {};
app.go(startScreen, startParams);

// PWA：網路優先的 service worker（開發時不會卡舊檔）
if ('serviceWorker' in navigator && !q.has('nosw')) {
  navigator.serviceWorker.register('./sw.js').catch(e => console.warn('sw 註冊失敗', e));
}

window.app = app; // 方便測試腳本操作
