// 香水櫃：梳妝台上 6 瓶香水。點開看小卡，選「今天噴這瓶」。
import { perfumeBottleSVG } from '../art/collections.js';
import { PERFUME_CARDS } from '../data/story.js';
import { mountDuo } from './charactersView.js';
import { topBar, janitor, svgImg, safe, esc, modal, perfumeColor } from './uikit.js';

let j = null, bar = null, duo = null;

function unlockHint(app, p) {
  if (p.unlock.start) return '一開始就有';
  if (p.id === 'p5') return '完成全部冒險後調出';
  const lv = p.unlock.level;
  return `第 ${Math.ceil(lv / app.config.LEVELS_PER_CHAPTER)} 章調出（通過第 ${lv} 關）`;
}

export default {
  async mount(root, params, app) {
    j = janitor();
    app.audio.playMusic('home');
    const { PERFUMES } = app.items;
    const s = app.save;
    root.classList.add('u-screen', 'u-perfume');
    bar = topBar(app, { title: '香水櫃' });
    root.appendChild(bar.el);
    const body = document.createElement('div');
    body.className = 'u-pf';
    body.innerHTML = `
      <div class="u-pf-today card u-enter" style="--d:0">
        <div class="u-pf-duo"></div>
        <div class="u-pf-today-txt"><small>今天噴的是</small><b class="u-pf-cur"></b><span>點丁噹熊，噴一下看看～</span></div>
      </div>
      <div class="u-vanity u-enter" style="--d:1">
        <div class="u-vanity-mirror"><span class="u-vanity-title">丁噹熊的梳妝台</span></div>
        <div class="u-vanity-shelf" data-row="0"></div>
        <div class="u-vanity-shelf" data-row="1"></div>
        <div class="u-vanity-legs"><i></i><i></i></div>
      </div>`;
    root.appendChild(body);
    const $ = sel => body.querySelector(sel);

    duo = safe(() => mountDuo($('.u-pf-duo'), { size: 'small', app, interactive: true }), null);
    safe(() => { duo?.setOutfit(s.equipped()); duo?.setPerfume(perfumeColor(app)); });

    function render() {
      const cur = s.perfume();
      $('.u-pf-cur').textContent = PERFUMES.find(p => p.id === cur)?.name || '';
      const rows = [PERFUMES.slice(0, 3), PERFUMES.slice(3, 6)];
      rows.forEach((row, ri) => {
        $(`.u-vanity-shelf[data-row="${ri}"]`).innerHTML = row.map(p => {
          const un = s.perfumeUnlocked(p);
          const isNew = un && !p.unlock.start && !s.seen('pfv_' + p.id);
          return `<button class="u-bottle${un ? '' : ' locked'}${p.id === cur ? ' cur' : ''}" data-id="${p.id}" style="--pc:${p.color}">` +
            `${p.id === cur ? '<span class="u-bottle-crown">今天</span>' : ''}${isNew ? '<span class="u-new">NEW</span>' : ''}` +
            `<span class="u-bottle-art">${safe(() => svgImg(perfumeBottleSVG(p.id), un ? '' : 'sil', p.name))}</span>` +
            `<span class="u-bottle-name">${un ? esc(p.name) : '？？？'}</span></button>`;
        }).join('');
      });
    }

    function openCard(p) {
      const un = s.perfumeUnlocked(p);
      const card = PERFUME_CARDS?.[p.id] || {};
      const cur = s.perfume() === p.id;
      if (un) s.markSeen('pfv_' + p.id);
      const notes = un && (card.top || card.mid || card.base)
        ? `<dl class="u-notes">${card.top ? `<dt>前調</dt><dd>${esc(card.top)}</dd>` : ''}${card.mid ? `<dt>中調</dt><dd>${esc(card.mid)}</dd>` : ''}${card.base ? `<dt>後調</dt><dd>${esc(card.base)}</dd>` : ''}</dl>` : '';
      const m = modal({
        cls: 'u-pfcard',
        html: `<div class="u-pfcard-art" style="--pc:${p.color}">${safe(() => svgImg(perfumeBottleSVG(p.id), un ? '' : 'sil'))}</div>` +
          `<h3>${un ? esc(p.name) : '還沒調出來的香水'}</h3>` +
          (un ? notes + (card.line ? `<p class="u-pf-line">丁噹熊：「${esc(card.line)}」</p>` : '')
            : `<p>${esc(unlockHint(app, p))}，就會出現在梳妝台上喔～</p>`) +
          (un ? `<button class="btn ${cur ? 'ghost' : ''}" data-use ${cur ? 'disabled' : ''}>${cur ? '今天正在噴這瓶' : '今天噴這瓶'}</button>` : `<button class="btn ghost" data-close>好～</button>`),
      });
      m.box.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) { app.audio.sfx('tap'); m.close(); }
        if (e.target.closest('[data-use]') && !cur) {
          s.setPerfume(p.id);
          app.audio.sfx('spray');
          safe(() => duo?.setPerfume(p.color));
          safe(() => duo?.say(`今天噴「${p.name}」～香香的♡`));
          m.close();
          render();
        }
      });
      m.closed.then(() => render());
    }

    j.on(body, 'click', e => {
      const b = e.target.closest('.u-bottle');
      if (!b) return;
      app.audio.sfx('tap');
      openCard(PERFUMES.find(p => p.id === b.dataset.id));
    });
    render();
  },
  unmount() {
    j?.clean(); j = null;
    safe(() => duo?.destroy()); duo = null;
    bar?.destroy(); bar = null;
    document.querySelector('.u-modal')?.remove();
  },
};
