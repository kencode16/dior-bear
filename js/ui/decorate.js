// 布置小屋：選位置 → 選家具（可先試擺）→ 買／擺／收起來。
import { furnitureSVG } from '../art/collections.js';
import { mountHouse } from './house.js';
import { topBar, janitor, svgImg, safe, esc, starIcon, ICONS, bearSay } from './uikit.js';

let j = null, bar = null, house = null;

export default {
  async mount(root, params, app) {
    j = janitor();
    app.audio.playMusic('home');
    const { HOUSE_SLOTS, FURNITURE } = app.items;
    const s = app.save;
    let slot = params.slot || HOUSE_SLOTS.find(h => h.id === 'rug')?.id || HOUSE_SLOTS[0].id;
    let trying = null;

    root.classList.add('u-screen', 'u-decorate');
    bar = topBar(app, { title: '布置小屋' });
    root.appendChild(bar.el);
    const body = document.createElement('div');
    body.className = 'u-shop';
    body.innerHTML = `
      <div class="u-shop-preview u-house-preview u-enter" style="--d:0"></div>
      <div class="u-shop-panel u-enter" style="--d:1">
        <div class="u-chips u-chips-wrap" role="tablist"></div>
        <div class="u-grid"></div>
      </div>
      <div class="u-buybar" hidden></div>`;
    root.appendChild(body);
    const $ = sel => body.querySelector(sel);

    house = mountHouse($('.u-house-preview'), app, {
      duo: true, interactive: false, highlight: slot,
      onSlotTap: id => { if (id !== slot) { slot = id; trying = null; app.audio.sfx('page'); render(); } },
    });

    function render() {
      house.update({ highlight: slot, preview: trying ? { slot, id: trying } : null });
      $('.u-chips').innerHTML = HOUSE_SLOTS.map(h => {
        const anyBuy = FURNITURE.some(f => f.slot === h.id && s.canBuy(f.id));
        return `<button class="u-chip${h.id === slot ? ' on' : ''}" data-slot="${h.id}">${esc(h.name)}${anyBuy ? '<i class="u-dot on"></i>' : ''}</button>`;
      }).join('');
      const placed = s.house()[slot];
      const maxCh = s.maxChapter();
      let html = `<button class="u-item${!placed ? ' wearing' : ''}" data-none="1"><span class="u-item-art">${ICONS.none}</span><span class="u-item-name">收起來</span><span class="u-item-tag">${!placed ? '目前' : ''}</span></button>`;
      for (const it of FURNITURE.filter(f => f.slot === slot)) {
        const owned = s.isOwned(it.id);
        const here = placed === it.id;
        const locked = !owned && it.chapter > maxCh;
        const cls = ['u-item', 'furn', here ? 'wearing' : '', owned ? 'owned' : '', locked ? 'locked' : '', trying === it.id ? 'trying' : '', !owned && !locked && s.canBuy(it.id) ? 'canbuy' : ''].filter(Boolean).join(' ');
        const tag = here ? `<span class="u-item-tag ok">${ICONS.check}擺著</span>`
          : owned ? '<span class="u-item-tag">已擁有</span>'
          : locked ? `<span class="u-item-tag lock">${ICONS.lock}第 ${it.chapter} 章</span>`
          : `<span class="u-item-tag price">${starIcon('u-star sm')}${it.price}</span>`;
        html += `<button class="${cls}" data-id="${it.id}"><span class="u-item-art">${safe(() => svgImg(furnitureSVG(it.id), '', it.name))}</span>` +
          `<span class="u-item-name">${esc(it.name)}</span>${tag}</button>`;
      }
      $('.u-grid').innerHTML = html;
      const bb = $('.u-buybar');
      if (!trying) { bb.hidden = true; bb.innerHTML = ''; }
      else {
        const it = FURNITURE.find(f => f.id === trying);
        const enough = s.starsAvailable() >= it.price;
        bb.hidden = false;
        bb.innerHTML = `<div class="u-buybar-in card"><span class="u-buybar-txt">試擺：<b>${esc(it.name)}</b></span>` +
          `<button class="btn ghost u-buybar-no" data-act="cancel">不要</button>` +
          `<button class="btn ${enough ? 'honey' : 'ghost dim'}" data-act="buy">${starIcon('u-star sm')}${it.price} 買下來</button></div>`;
      }
    }

    function clickItem(btn) {
      if (btn.dataset.none) {
        trying = null;
        if (s.house()[slot]) { s.place(slot, null); app.audio.sfx('equip'); }
        render();
        return;
      }
      const it = FURNITURE.find(f => f.id === btn.dataset.id);
      if (!it) return;
      if (s.isOwned(it.id)) {
        trying = null;
        if (s.house()[slot] !== it.id) { s.place(slot, it.id); app.audio.sfx('equip'); safe(() => house.duo?.say('擺好了！好溫馨～')); }
        render();
        return;
      }
      if (it.chapter > s.maxChapter()) { app.audio.sfx('tap'); bearSay(app, `「${it.name}」要到第 ${it.chapter} 章才會開賣喔～`); return; }
      app.audio.sfx('select');
      trying = trying === it.id ? null : it.id;
      render();
    }

    function buy() {
      const it = FURNITURE.find(f => f.id === trying);
      if (!it) return;
      if (s.buy(it.id)) {
        s.place(it.slot, it.id);
        app.audio.sfx('buy');
        safe(() => house.duo?.react('win'));
        safe(() => house.duo?.say('新家具！小屋變得更可愛了♡'));
        trying = null;
        render();
      } else {
        app.audio.sfx('tap');
        const lack = it.price - s.starsAvailable();
        bearSay(app, `星星還不夠喔～還差 ${lack} 顆，再去冒險吧！`);
      }
    }

    j.on(body, 'click', e => {
      const chip = e.target.closest('.u-chip');
      if (chip) { if (chip.dataset.slot !== slot) { slot = chip.dataset.slot; trying = null; app.audio.sfx('page'); render(); } return; }
      const item = e.target.closest('.u-item');
      if (item) { clickItem(item); return; }
      const act = e.target.closest('[data-act]');
      if (act) { if (act.dataset.act === 'cancel') { app.audio.sfx('tap'); trying = null; render(); } else buy(); }
    });

    render();
  },
  unmount() {
    j?.clean(); j = null;
    house?.destroy(); house = null;
    bar?.destroy(); bar = null;
    document.querySelector('.u-say')?.remove();
  },
};
