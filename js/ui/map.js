// 冒險地圖：四章彎彎小路、40 個蜂蜜點。進關前播章頭劇情；過完章節大關回來播章末劇情並發解鎖卡。
import { chapterTheme, tileSVG } from '../art/tiles.js';
import { friendSVG, perfumeBottleSVG, stickerSVG } from '../art/collections.js';
import { itemIconSVG } from '../art/chars.js';
import { STORY } from '../data/story.js';
import { topBar, janitor, svgImg, safe, esc, starRow, starIcon, bearHead, bearSay, showCards, ICONS } from './uikit.js';
import tod from '../timeOfDay.js';

let j = null, bar = null, sky = null, offTod = null;

// 地圖最上方天空卡的問候
const SKY_HELLO = {
  morning: ['早安！', '今天也香香的出發吧～'],
  day: ['午安～', '陽光暖暖的，冒險好舒服'],
  dusk: ['黃昏了～', '晚霞好漂亮，再玩一關吧'],
  night: ['晚安～', '夜晚的冒險也很有趣喔'],
};
// 每章段落的時段色調層（CSS 依 html[data-tod] 切換，淡入淡出）
const TOD_TINT = `<div class="u-ch-tod" aria-hidden="true"><i class="t-morning"></i><i class="t-day"></i><i class="t-dusk"></i><i class="t-night"></i><i class="t-stars"></i></div>`;

const BANNER_H = 150;   // 章節標題卡高度（px）
const STEP = 92;        // 關卡點的垂直間距（px）
const TOP_PAD = 40, BOTTOM_PAD = 56;

const nodeX = (ch, i) => 50 + 30 * Math.sin(i * 0.92 + ch * 1.7);   // 百分比
const nodeY = i => BANNER_H + TOP_PAD + i * STEP;
const sectionH = n => BANNER_H + TOP_PAD + (n - 1) * STEP + BOTTOM_PAD;

/** Catmull-Rom → 三次貝茲，畫平滑小路 */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)} ${c1[1].toFixed(1)} ${c2[0].toFixed(2)} ${c2[1].toFixed(1)} ${p2[0].toFixed(2)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function buildChapter(app, ch, cur) {
  const { LEVELS_PER_CHAPTER: N, CHAPTERS } = app.config;
  const C = CHAPTERS[ch - 1];
  const s = app.save;
  const theme = safe(() => chapterTheme(ch), { bg: 'var(--cream)', accent: 'var(--pink)' });
  const locked = ch > s.maxChapter();
  const friend = app.items.FRIENDS.find(f => f.id === C.friend);
  const perfume = app.items.PERFUMES.find(p => p.id === C.perfume);
  const met = s.isCleared(ch * N);
  const H = sectionH(N);

  const pts = [];
  pts.push([nodeX(ch, 0), BANNER_H - 6]);
  for (let i = 0; i < N; i++) pts.push([nodeX(ch, i), nodeY(i)]);
  pts.push([nodeX(ch, N - 1) * .5 + 25, H]);

  let nodes = '';
  for (let i = 0; i < N; i++) {
    const id = (ch - 1) * N + i + 1;
    const st = s.levelStars(id);
    const isLocked = id > cur && !s.isCleared(id);
    const isCur = id === cur && !s.isCleared(id);
    const boss = i === N - 1;
    const lv = app.levelById(id);
    const cls = ['u-node', st ? 'cleared' : '', isCur ? 'cur' : '', isLocked ? 'locked' : '', boss ? 'boss' : ''].filter(Boolean).join(' ');
    nodes += `<button class="${cls}" data-id="${id}" style="left:${nodeX(ch, i).toFixed(2)}%;top:${nodeY(i)}px" aria-label="第 ${id} 關${lv?.name ? ' ' + esc(lv.name) : ''}">` +
      (isCur ? `<span class="u-node-bear ${i > 0 && nodeX(ch, i - 1) > nodeX(ch, i) ? 'l' : 'r'}">${bearHead(app, 'happy')}</span>` : '') +
      `<span class="u-node-drop">${isLocked ? `<span class="u-node-lock">${ICONS.lock}</span>` : `<b>${id}</b>`}</span>` +
      (boss ? '<span class="u-node-crown">♛</span>' : '') +
      (st ? starRow(st, 3, 'u-stars u-node-stars') : '') +
      `</button>`;
  }

  // 兩側的物件小裝飾
  let deco = '';
  for (let i = 1; i < N; i += 2) {
    const x = nodeX(ch, i) > 50 ? 9 + (i % 3) * 3 : 83 - (i % 3) * 3;
    const item = C.items[(i * 5) % C.items.length].id;
    deco += `<span class="u-map-deco" style="left:${x}%;top:${nodeY(i) - 30}px;--rot:${(i % 2 ? -1 : 1) * (8 + i)}deg">${safe(() => svgImg(tileSVG(item)))}</span>`;
  }

  const chStars = s.chapterStars(ch);
  return `
  <section class="u-ch${locked ? ' locked' : ''}" data-ch="${ch}" style="height:${H}px;background:${theme.bg};--accent:${theme.accent || 'var(--pink)'}">
    ${TOD_TINT}
    <svg class="u-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${smoothPath(pts)}" class="u-path-under"/>
      <path d="${smoothPath(pts)}" class="u-path-line"/>
    </svg>
    ${deco}
    <div class="u-ch-banner card">
      <div class="u-ch-text">
        <div class="u-ch-no">第 ${ch} 章<span class="u-ch-theme">${esc(C.theme)}</span></div>
        <h2>${esc(C.name)}</h2>
        <div class="u-ch-meta">${starIcon('u-star sm')}<b>${chStars}</b>/30
          <span class="u-ch-perf">${safe(() => svgImg(perfumeBottleSVG(perfume.id), s.isCleared(ch * N) ? '' : 'sil'))}${esc(perfume.name)}</span></div>
      </div>
      <div class="u-ch-friend${met ? '' : ' unmet'}">${safe(() => svgImg(friendSVG(friend.id, { expr: met ? 'happy' : 'normal' }), '', friend.name))}<span>${met ? esc(friend.name) : '？'}</span></div>
    </div>
    ${nodes}
    ${locked ? `<div class="u-ch-lockmsg">完成第 ${ch - 1} 章<br>就能來這裡喔～</div>` : ''}
  </section>`;
}

async function afterReturn(app, params) {
  const s = app.save;
  const { FRIENDS, PERFUMES, STICKERS, BEAR_ITEMS, FURNITURE } = app.items;
  const N = app.config.LEVELS_PER_CHAPTER;
  const cards = [];
  const jc = Number(params.justCleared) || 0;
  if (jc && params.firstClear && jc % N === 0) {
    const ch = jc / N;
    await app.dialog.play(`ch${ch}_outro`);
    for (const p of PERFUMES.filter(p => p.unlock.level === jc)) {
      cards.push({ tag: '新香水', art: safe(() => perfumeBottleSVG(p.id)), title: `調好了「${p.name}」！`, text: '放在小屋的梳妝台上囉～到香水櫃選今天要噴哪一瓶吧', sfx: 'spray' });
    }
    const f = FRIENDS.find(f => f.chapter === ch);
    if (f) cards.push({ tag: '新朋友', art: safe(() => friendSVG(f.id, { expr: 'happy' })), title: `${f.species}「${f.name}」成為好朋友了！`, text: f.like });
  }
  // 新貼紙
  for (const st of STICKERS) {
    if (s.stickerUnlocked(st) && !s.seen('stk_' + st.id)) {
      cards.push({ tag: '新貼紙', art: safe(() => stickerSVG(st.id)), title: st.name, text: '貼進圖鑑了！' });
      s.markSeen('stk_' + st.id);
    }
  }
  // 商店新品（新章節）
  for (let ch = 2; ch <= s.maxChapter(); ch++) {
    if (!s.seen('shop_ch' + ch)) {
      const it = BEAR_ITEMS.find(i => i.chapter === ch) || FURNITURE.find(i => i.chapter === ch);
      cards.push({ tag: '商店新品', art: it ? safe(() => itemIconSVG(it.id)) : '', title: `第 ${ch} 章的新衣服和家具上架了！`, text: '去換裝和布置看看吧～' });
      s.markSeen('shop_ch' + ch);
    }
  }
  if (cards.length) await showCards(app, cards);
  if (jc === app.config.TOTAL_LEVELS && params.firstClear) await app.dialog.play('finale');
}

export default {
  async mount(root, params, app) {
    j = janitor();
    app.audio.playMusic('map');
    root.classList.add('u-screen', 'u-map');
    bar = topBar(app, { title: '冒險地圖' });
    root.appendChild(bar.el);
    const { TOTAL_LEVELS, LEVELS_PER_CHAPTER: N, CHAPTERS } = app.config;
    const cur = app.save.unlockedLevel();
    const wrap = document.createElement('div');
    wrap.className = 'u-map-wrap';
    wrap.innerHTML = `<div class="u-map-sky"><div class="u-map-hello"><b></b><span></span></div></div>` + CHAPTERS.map(C => buildChapter(app, C.id, cur)).join('') +
      `<div class="u-map-end">${app.save.isCleared(TOTAL_LEVELS) ? '全部冒險完成！丁噹熊的招牌香水完成了♡' : '更多冒險，敬請期待～'}</div>`;
    root.appendChild(wrap);
    const skyCard = wrap.querySelector('.u-map-sky');
    sky = safe(() => tod.mountSky(skyCard), null);
    if (sky) skyCard.prepend(sky.el);
    const hello = p => {
      const [a, b] = SKY_HELLO[p] || SKY_HELLO.day;
      skyCard.dataset.tod = p;
      skyCard.querySelector('b').textContent = a;
      skyCard.querySelector('span').textContent = b;
    };
    hello(tod.current());
    offTod = tod.onChange(hello);

    // 捲到目前的關卡（或剛通過的那關）
    const focusId = Number(params.justCleared) || cur;
    const target = wrap.querySelector(`.u-node[data-id="${focusId}"]`) || wrap.querySelector('.u-node.cur');
    if (target) {
      const r = target.getBoundingClientRect();
      window.scrollTo(0, Math.max(0, r.top + window.scrollY - window.innerHeight * 0.55));
    }

    j.on(wrap, 'click', async e => {
      const n = e.target.closest('.u-node');
      if (!n) return;
      const id = Number(n.dataset.id);
      const ch = Math.ceil(id / N);
      if (n.classList.contains('locked')) {
        app.audio.sfx('tap');
        bearSay(app, ch > app.save.maxChapter() ? `要先完成第 ${ch - 1} 章喔～` : `先通過第 ${cur} 關才能玩這關喔～`);
        return;
      }
      if (!app.levelById(id)) { app.audio.sfx('tap'); bearSay(app, '這一關還在準備中～'); return; }
      app.audio.sfx('select');
      n.classList.add('go');
      if ((id - 1) % N === 0 && STORY && STORY[`ch${ch}_intro`] && !app.save.seen(`ch${ch}_intro`)) {
        await app.dialog.play(`ch${ch}_intro`);
      }
      if (app.screen === 'map') app.go('level', { levelId: id });
    });

    j.timeout(() => afterReturn(app, params), 350);
  },
  unmount() {
    offTod?.(); offTod = null;
    sky?.destroy(); sky = null;
    j?.clean(); j = null;
    bar?.destroy(); bar = null;
    document.querySelector('.u-say')?.remove();
  },
};
