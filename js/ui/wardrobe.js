// 換裝：丁噹熊／大不溜分頁、部位分頁、物件格。點沒買的東西可以先試穿，再決定要不要買。
import { itemIconSVG } from '../art/chars.js';
import { mountDuo } from './charactersView.js';
import { topBar, janitor, svgImg, safe, esc, starIcon, ICONS, perfumeColor, bearSay } from './uikit.js';

let j = null, bar = null, duo = null;

const REQUIRED = ['ribbon', 'collar'];   // 不能脫的部位
const LINES_EQUIP = ['好看嗎？', '這件好可愛♡', '大不溜，你覺得呢？', '今天就穿這樣出門！'];
const LINES_DOG = ['大不溜帥翻了！', '超適合你的啦～', '大不溜：哼，還不錯。'];

export default {
  async mount(root, params, app) {
    j = janitor();
    app.audio.playMusic('home');
    const { BEAR_SLOTS, DOG_SLOTS, BEAR_ITEMS, DOG_ITEMS } = app.items;
    const s = app.save;
    let who = params.who === 'dog' ? 'dog' : 'bear';
    let slot = who === 'bear' ? BEAR_SLOTS[0].id : DOG_SLOTS[0].id;
    let trying = null;

    root.classList.add('u-screen', 'u-wardrobe');
    bar = topBar(app, { title: '換裝' });
    root.appendChild(bar.el);
    const body = document.createElement('div');
    body.className = 'u-shop';
    body.innerHTML = `
      <div class="u-shop-preview card u-enter" style="--d:0"><div class="u-wd-duo"></div></div>
      <div class="u-shop-panel u-enter" style="--d:1">
        <div class="u-seg" role="tablist">
          <button class="u-seg-btn" data-who="bear">丁噹熊</button>
          <button class="u-seg-btn" data-who="dog">大不溜</button>
        </div>
        <div class="u-chips" role="tablist"></div>
        <div class="u-grid"></div>
      </div>
      <div class="u-buybar" hidden></div>`;
    root.appendChild(body);
    const $ = sel => body.querySelector(sel);

    duo = safe(() => mountDuo($('.u-wd-duo'), { size: 'preview', app, interactive: true }), null);
    safe(() => duo?.setPerfume(perfumeColor(app)));

    const slots = () => (who === 'bear' ? BEAR_SLOTS : DOG_SLOTS);
    const list = () => (who === 'bear' ? BEAR_ITEMS : DOG_ITEMS).filter(i => i.slot === slot);

    function outfitNow() {
      const eq = s.equipped();
      if (trying) { const it = [...BEAR_ITEMS, ...DOG_ITEMS].find(i => i.id === trying); if (it) eq[it.slot] = it.id; }
      return eq;
    }
    function refreshDuo() { safe(() => duo?.setOutfit(outfitNow())); }

    function render() {
      body.querySelectorAll('.u-seg-btn').forEach(b => b.classList.toggle('on', b.dataset.who === who));
      $('.u-chips').innerHTML = slots().map(sl => {
        const anyBuy = (who === 'bear' ? BEAR_ITEMS : DOG_ITEMS).some(i => i.slot === sl.id && s.canBuy(i.id));
        return `<button class="u-chip${sl.id === slot ? ' on' : ''}" data-slot="${sl.id}">${esc(sl.name)}${anyBuy ? '<i class="u-dot on"></i>' : ''}</button>`;
      }).join('');
      const eq = s.equipped();
      let html = '';
      if (!REQUIRED.includes(slot)) {
        const on = !eq[slot];
        html += `<button class="u-item${on ? ' wearing' : ''}" data-none="1"><span class="u-item-art">${ICONS.none}</span><span class="u-item-name">不戴</span>` +
          `<span class="u-item-tag">${on ? '目前' : ''}</span></button>`;
      }
      const maxCh = s.maxChapter();
      for (const it of list()) {
        const owned = s.isOwned(it.id);
        const wearing = eq[it.slot] === it.id;
        const locked = !owned && it.chapter > maxCh;
        const cls = ['u-item', wearing ? 'wearing' : '', owned ? 'owned' : '', locked ? 'locked' : '', trying === it.id ? 'trying' : '', !owned && !locked && s.canBuy(it.id) ? 'canbuy' : ''].filter(Boolean).join(' ');
        const tag = wearing ? `<span class="u-item-tag ok">${ICONS.check}穿著中</span>`
          : owned ? '<span class="u-item-tag">已擁有</span>'
          : locked ? `<span class="u-item-tag lock">${ICONS.lock}第 ${it.chapter} 章</span>`
          : `<span class="u-item-tag price">${starIcon('u-star sm')}${it.price}</span>`;
        html += `<button class="${cls}" data-id="${it.id}"><span class="u-item-art">${safe(() => svgImg(itemIconSVG(it.id), '', it.name))}</span>` +
          `<span class="u-item-name">${esc(it.name)}</span>${tag}</button>`;
      }
      $('.u-grid').innerHTML = html;
      renderBuybar();
    }

    function renderBuybar() {
      const bb = $('.u-buybar');
      if (!trying) { bb.hidden = true; bb.innerHTML = ''; return; }
      const it = [...BEAR_ITEMS, ...DOG_ITEMS].find(i => i.id === trying);
      const enough = s.starsAvailable() >= it.price;
      bb.hidden = false;
      bb.innerHTML = `<div class="u-buybar-in card"><span class="u-buybar-txt">試穿中：<b>${esc(it.name)}</b></span>` +
        `<button class="btn ghost u-buybar-no" data-act="cancel">不要</button>` +
        `<button class="btn ${enough ? 'honey' : 'ghost dim'}" data-act="buy">${starIcon('u-star sm')}${it.price} 買下來</button></div>`;
    }

    function sayLine(arr) { safe(() => duo?.say(arr[Math.floor(Math.random() * arr.length)])); }

    function clickItem(btn) {
      if (btn.dataset.none) {
        trying = null;
        if (s.equip(slot, null)) { app.audio.sfx('equip'); sayLine(who === 'bear' ? ['清爽一點也不錯～'] : ['大不溜：這樣比較自在。']); }
        render(); refreshDuo();
        return;
      }
      const id = btn.dataset.id;
      const it = list().find(i => i.id === id);
      if (!it) return;
      if (s.isOwned(id)) {
        trying = null;
        const eq = s.equipped();
        if (eq[it.slot] === id) {
          if (REQUIRED.includes(it.slot)) { app.audio.sfx('tap'); safe(() => duo?.say('這個已經戴著囉～')); }
          else { s.equip(it.slot, null); app.audio.sfx('equip'); }
        } else {
          s.equip(it.slot, id);
          app.audio.sfx('equip');
          safe(() => duo?.react('special'));
          sayLine(who === 'bear' ? LINES_EQUIP : LINES_DOG);
        }
        render(); refreshDuo();
        return;
      }
      if (it.chapter > s.maxChapter()) {
        app.audio.sfx('tap');
        bearSay(app, `「${it.name}」要到第 ${it.chapter} 章才會開賣喔～`);
        return;
      }
      app.audio.sfx('select');
      trying = trying === id ? null : id;
      render(); refreshDuo();
      if (trying) sayLine(['試穿看看～', '好像不錯耶！', '鏡子鏡子…']);
    }

    function buy() {
      const it = [...BEAR_ITEMS, ...DOG_ITEMS].find(i => i.id === trying);
      if (!it) return;
      if (s.buy(it.id)) {
        s.equip(it.slot, it.id);
        app.audio.sfx('buy');
        safe(() => duo?.react('win'));
        safe(() => duo?.say(who === 'bear' ? '買到了！好喜歡♡' : '大不溜：汪！（很滿意）'));
        trying = null;
        render(); refreshDuo();
      } else {
        app.audio.sfx('tap');
        safe(() => duo?.react('lowMoves'));
        const lack = it.price - s.starsAvailable();
        safe(() => duo?.say(`星星還不夠喔～還差 ${lack} 顆，再去冒險吧！`));
        bearSay(app, `星星還不夠喔～還差 ${lack} 顆！`);
      }
    }

    j.on(body, 'click', e => {
      const seg = e.target.closest('.u-seg-btn');
      if (seg) {
        if (seg.dataset.who !== who) { who = seg.dataset.who; slot = slots()[0].id; trying = null; app.audio.sfx('page'); render(); refreshDuo(); }
        return;
      }
      const chip = e.target.closest('.u-chip');
      if (chip) { if (chip.dataset.slot !== slot) { slot = chip.dataset.slot; trying = null; app.audio.sfx('page'); render(); refreshDuo(); } return; }
      const item = e.target.closest('.u-item');
      if (item) { clickItem(item); return; }
      const act = e.target.closest('[data-act]');
      if (act) {
        if (act.dataset.act === 'cancel') { app.audio.sfx('tap'); trying = null; render(); refreshDuo(); }
        else buy();
      }
    });

    render();
    refreshDuo();
  },
  unmount() {
    j?.clean(); j = null;
    safe(() => duo?.destroy()); duo = null;
    bar?.destroy(); bar = null;
    document.querySelector('.u-say')?.remove();
  },
};
