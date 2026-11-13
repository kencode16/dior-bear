// 香水櫃：梳妝台上 9 瓶香水（三層架子，每層 3 瓶；黃金丁噹香在最下層、金色底座）。點開看小卡，選「今天噴這瓶」。
import { perfumeBottleSVG } from '../art/collections.js';
import { PERFUME_CARDS } from '../data/story.js';
import { mountDuo } from './charactersView.js';
import { topBar, janitor, svgImg, safe, esc, modal, perfumeColor } from './uikit.js';

let j = null, bar = null, duo = null;

function unlockHint(app, p) {
  const u = p.unlock || {};
  if (u.start) return '一開始就有';
  if (u.hardChapter) return '困難模式全部完成後調出';
  if (p.id === 'p4' || p.id === 'p5') return '完成食衣住行冒險後調出';
  const lv = u.level;
  if (!lv) return '繼續冒險就會調出來';
  return `第 ${Math.ceil(lv / app.config.LEVELS_PER_CHAPTER)} 章調出（通過第 ${lv} 關）`;
}
const SHELF = 3;   // 每層幾瓶

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
        <div class="u-vanity-shelves"></div>
        <div class="u-vanity-legs"><i></i><i></i></div>
      </div>`;
    root.appendChild(body);
    const $ = sel => body.querySelector(sel);

    duo = safe(() => mountDuo($('.u-pf-duo'), { size: 'small', app, interactive: true }), null);
    safe(() => { duo?.setOutfit(s.equipped()); duo?.setPerfume(perfumeColor(app)); });

    function render() {
      const cur = s.perfume();
      $('.u-pf-cur').textContent = PERFUMES.find(p => p.id === cur)?.name || '';
      const rows = [];
      for (let i = 0; i < PERFUMES.length; i += SHELF) rows.push(PERFUMES.slice(i, i + SHELF));
      $('.u-vanity-shelves').innerHTML = rows.map((row, ri) => `<div class="u-vanity-shelf" data-row="${ri}">` + row.map(p => {
        const un = s.perfumeUnlocked(p);
        const isNew = un && !p.unlock.start && !s.seen('pfv_' + p.id);
        const gold = !!p.unlock.hardChapter;
        return `<button class="u-bottle${un ? '' : ' locked'}${p.id === cur ? ' cur' : ''}${gold ? ' gold' : ''}" data-id="${p.id}" style="--pc:${p.color}">` +
          `${p.id === cur ? '<span class="u-bottle-crown">今天</span>' : ''}${isNew ? '<span class="u-new">NEW</span>' : ''}` +
          `<span class="u-bottle-art">${safe(() => svgImg(perfumeBottleSVG(p.id), un ? '' : 'sil', p.name))}</span>` +
          `<span class="u-bottle-name">${un ? esc(p.name) : (gold ? '✦ 金色限定' : '？？？')}</span></button>`;
      }).join('') + `</div>`).join('');
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
