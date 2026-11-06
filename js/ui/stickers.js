// 熊熊朋友圖鑑：16 張貼紙，依朋友分組；點開看大圖和說明，鎖住的顯示解鎖條件。
import { stickerSVG, lockedStickerSVG, friendSVG } from '../art/collections.js';
import { STICKER_CAPTIONS } from '../data/story.js';
import { topBar, janitor, svgImg, safe, esc, modal } from './uikit.js';

let j = null, bar = null;

function hint(app, st) {
  const u = st.unlock;
  if (u.level) return `第一次通過第 ${u.level} 關`;
  if (u.chapterStars) {
    const have = app.save.chapterStars(u.chapterStars.ch);
    return `第 ${u.chapterStars.ch} 章累積 ${u.chapterStars.min} 顆星（目前 ${have} 顆）`;
  }
  return '繼續冒險就會知道～';
}

export default {
  async mount(root, params, app) {
    j = janitor();
    app.audio.playMusic('home');
    const { STICKERS, FRIENDS } = app.items;
    const s = app.save;
    root.classList.add('u-screen', 'u-stickers');
    bar = topBar(app, { title: '熊熊圖鑑' });
    root.appendChild(bar.el);
    const body = document.createElement('div');
    body.className = 'u-st';
    root.appendChild(body);

    function render() {
      const got = s.stickersUnlocked();
      const groups = [
        ...FRIENDS.map(f => ({ key: f.id, title: `${f.species}・${f.name}`, sub: f.like, met: s.isCleared(f.chapter * 10), friend: f, list: STICKERS.filter(st => st.friend === f.id) })),
        { key: 'bear', title: '丁噹熊和大不溜', sub: '每章全部拿到 3 星的特別照', met: true, list: STICKERS.filter(st => st.kind === 'bear') },
      ];
      body.innerHTML = `
        <div class="u-st-progress card u-enter" style="--d:0">
          <span>已收集 <b>${got.length}</b> / ${STICKERS.length} 張</span>
          <div class="u-bar"><i style="width:${(got.length / STICKERS.length * 100).toFixed(1)}%"></i></div>
        </div>` +
        groups.map((g, gi) => `
        <section class="u-st-group card u-enter" style="--d:${gi + 1}">
          <header>
            ${g.friend ? `<span class="u-st-face${g.met ? '' : ' unmet'}">${safe(() => svgImg(friendSVG(g.friend.id, { expr: 'happy' })))}</span>` : ''}
            <div><h3>${g.met ? esc(g.title) : '？？？'}</h3><small>${g.met ? esc(g.sub) : `第 ${g.friend?.chapter} 章會認識的朋友`}</small></div>
          </header>
          <div class="u-st-grid${g.list.length > 3 ? ' four' : ''}">
            ${g.list.map(st => {
              const un = got.includes(st.id);
              const isNew = un && !s.seen('stv_' + st.id);
              return `<button class="u-sticker${un ? '' : ' locked'}" data-id="${st.id}">${isNew ? '<span class="u-new">NEW</span>' : ''}` +
                `<span class="u-sticker-art">${safe(() => svgImg(un ? stickerSVG(st.id) : lockedStickerSVG(), '', un ? st.name : '還沒解鎖'))}</span>` +
                `<span class="u-sticker-name">${un ? esc(st.name) : '？？？'}</span></button>`;
            }).join('')}
          </div>
        </section>`).join('');
    }

    j.on(body, 'click', e => {
      const b = e.target.closest('.u-sticker');
      if (!b) return;
      const st = STICKERS.find(x => x.id === b.dataset.id);
      const un = s.stickerUnlocked(st);
      app.audio.sfx(un ? 'page' : 'tap');
      if (un) s.markSeen('stv_' + st.id);
      const m = modal({
        cls: 'u-stcard',
        html: `<div class="u-stcard-art">${safe(() => svgImg(un ? stickerSVG(st.id) : lockedStickerSVG()))}</div>` +
          `<h3>${un ? esc(st.name) : '還沒解鎖的貼紙'}</h3>` +
          `<p>${un ? esc(STICKER_CAPTIONS?.[st.id] || '和丁噹熊一起的珍貴回憶♡') : esc(hint(app, st)) + '，就能拿到這張貼紙喔～'}</p>` +
          `<button class="btn ghost" data-close>好～</button>`,
      });
      m.box.querySelector('[data-close]').addEventListener('click', () => { app.audio.sfx('tap'); m.close(); });
      m.closed.then(render);
    });
    render();
  },
  unmount() {
    j?.clean(); j = null;
    bar?.destroy(); bar = null;
    document.querySelector('.u-modal')?.remove();
  },
};
