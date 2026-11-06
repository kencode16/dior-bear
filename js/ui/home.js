// 首頁：丁噹熊的樹洞小屋＋主選單。
import { mountHouse } from './house.js';
import { perfumeBottleSVG } from '../art/collections.js';
import { titlePill, starPill, ICONS, janitor, esc, bearSay, svgImg, safe, starIcon } from './uikit.js';

let j = null, house = null, stars = null;

const MENU = [
  { go: 'wardrobe', name: '換裝',   icon: 'wardrobe' },
  { go: 'decorate', name: '布置',   icon: 'decorate' },
  { go: 'perfume',  name: '香水櫃', icon: 'perfume' },
  { go: 'stickers', name: '圖鑑',   icon: 'stickers' },
  { go: 'settings', name: '設定',   icon: 'settings' },
];

/** 有沒有可以買的東西（給按鈕紅點） */
function badges(app) {
  const { BEAR_ITEMS, DOG_ITEMS, FURNITURE, PERFUMES, STICKERS } = app.items;
  const s = app.save;
  return {
    wardrobe: [...BEAR_ITEMS, ...DOG_ITEMS].some(i => s.canBuy(i.id)),
    decorate: FURNITURE.some(i => s.canBuy(i.id)),
    perfume: PERFUMES.some(p => s.perfumeUnlocked(p) && !p.unlock.start && !s.seen('pfv_' + p.id)),
    stickers: STICKERS.some(st => s.stickerUnlocked(st) && !s.seen('stv_' + st.id)),
  };
}

const GREETINGS = ['今天也要香香的出門喔～', '大不溜，不要偷舔我的蜂蜜！', '噴一下香水，心情變好了♡', '一起去冒險吧！', '叮噹～歡迎回家！'];

export default {
  async mount(root, params, app) {
    j = janitor();
    app.audio.playMusic('home');
    const lv = app.save.unlockedLevel();
    const allDone = app.save.isCleared(app.config.TOTAL_LEVELS);
    const curP = app.items.PERFUMES.find(p => p.id === app.save.perfume()) || app.items.PERFUMES[0];
    const ch = app.save.maxChapter();
    const chName = app.config.CHAPTERS[ch - 1]?.name || '';
    root.classList.add('u-screen', 'u-home');
    root.innerHTML = `
      <div class="u-home-top u-enter" style="--d:0">${titlePill()}<div class="u-home-stars"></div></div>
      <div class="u-home-main">
        <div class="u-home-scene u-enter" style="--d:1"></div>
        <div class="u-home-side">
          <button class="btn u-start u-enter" style="--d:2" data-go="map">
            ${ICONS.map}<span><b>${allDone ? '冒險地圖' : '開始冒險'}</b><small>${allDone ? '全部完成了！' : `第 ${lv} 關`}</small></span>
          </button>
          <nav class="u-menu u-enter" style="--d:3">
            ${MENU.map(m => `<button class="u-menu-btn" data-go="${m.go}"><span class="u-menu-ic">${ICONS[m.icon]}</span><span class="u-menu-name">${esc(m.name)}</span><i class="u-dot" data-badge="${m.go}"></i></button>`).join('')}
          </nav>
          <button class="u-today card u-enter" style="--d:4" data-go="perfume">
            <span class="u-today-bottle">${safe(() => svgImg(perfumeBottleSVG(curP.id), '', curP.name))}</span>
            <span class="u-today-txt"><small>今天噴的香水</small><b>${esc(curP.name)}</b></span>
            <span class="u-today-ch"><small>第 ${ch} 章・${esc(chName)}</small><b>${starIcon('u-star sm')} ${app.save.chapterStars(ch)}/30</b></span>
          </button>
        </div>
      </div>`;
    stars = starPill(app);
    root.querySelector('.u-home-stars').appendChild(stars.el);

    house = mountHouse(root.querySelector('.u-home-scene'), app, {
      duo: true, interactive: true, friends: true,
      onVanityTap: () => { app.audio.sfx('tap'); app.go('perfume'); },
    });

    const b = badges(app);
    root.querySelectorAll('[data-badge]').forEach(d => d.classList.toggle('on', !!b[d.dataset.badge]));

    j.on(root, 'click', e => {
      const btn = e.target.closest('[data-go]');
      if (!btn) return;
      app.audio.sfx('tap');
      app.go(btn.dataset.go);
    });

    // 第一次進遊戲：播序章
    if (!app.save.seen('prologue')) {
      j.timeout(async () => {
        await app.dialog.play('prologue');
        if (root.isConnected) bearSay(app, '按「開始冒險」出發吧！');
      }, 500);
    } else {
      j.timeout(() => house?.duo?.say?.(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]), 900);
    }
  },
  unmount() {
    j?.clean(); j = null;
    house?.destroy(); house = null;
    stars?.destroy(); stars = null;
    document.querySelector('.u-say')?.remove();
  },
};
