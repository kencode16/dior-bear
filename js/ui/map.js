// 冒險地圖：六章彎彎小路、60 個蜂蜜點。進關前播章頭劇情；過完章節大關回來播章末劇情並發解鎖卡。
// v1.2：普通／困難切換（普通版第 40 關過關後出現）。困難模式整張地圖換成金色／玫瑰金色調，
//       節點顯示困難星星、照順序解鎖（save.canPlayHard），每章標題旁顯示「困難 n/10」和該章的金色限定。
import { chapterTheme, tileSVG } from '../art/tiles.js';
import { friendSVG, perfumeBottleSVG, stickerSVG, furnitureSVG } from '../art/collections.js';
import { itemIconSVG } from '../art/chars.js';
import { STORY } from '../data/story.js';
import { topBar, janitor, svgImg, safe, esc, starRow, starIcon, bearHead, bearSay, showCards, ICONS } from './uikit.js';
import tod from '../timeOfDay.js';

let j = null, bar = null, sky = null, offTod = null;
let mode = 'normal';
let gen = 0;   // 每次 mount +1；離開地圖後，還在跑的提示流程就停下來

// 地圖最上方天空卡的問候
const SKY_HELLO = {
  morning: ['早安！', '今天也香香的出發吧～'],
  day: ['午安～', '陽光暖暖的，冒險好舒服'],
  dusk: ['黃昏了～', '晚霞好漂亮，再玩一關吧'],
  night: ['晚安～', '夜晚的冒險也很有趣喔'],
};
// 每章段落的時段色調層（CSS 依 html[data-tod] 切換，淡入淡出）
const TOD_TINT = `<div class="u-ch-tod" aria-hidden="true"><i class="t-morning"></i><i class="t-day"></i><i class="t-dusk"></i><i class="t-night"></i><i class="t-stars"></i></div>`;
// 困難模式的金色／玫瑰金色調層
const GOLD_TINT = `<div class="u-ch-gold" aria-hidden="true"></div>`;
// 普通版過完這幾關（第一次）要播的結局
const FINALES = { 40: 'finale', 60: 'finale2' };


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

// ---------- 困難模式小工具 ----------
/** 第 ch 章的金色限定（HARD_REWARDS） */
export function rewardOfChapter(app, ch) {
  return (app.items.HARD_REWARDS || []).find(r => (r.reward?.hardChapter || r.unlock?.hardChapter) === ch) || null;
}
/** 金色限定的圖：香水 perfumeBottleSVG、家具 furnitureSVG、換裝 itemIconSVG */
export function rewardArt(app, it) {
  if (!it) return '';
  const { FURNITURE = [], PERFUMES = [] } = app.items;
  if (PERFUMES.some(p => p.id === it.id)) return safe(() => perfumeBottleSVG(it.id));
  if (FURNITURE.some(f => f.id === it.id)) return safe(() => furnitureSVG(it.id));
  return safe(() => itemIconSVG(it.id));
}
const chapterRange = (ch, N) => Array.from({ length: N }, (_, i) => (ch - 1) * N + i + 1);
const hardDoneIn = (app, ch) => chapterRange(ch, app.config.LEVELS_PER_CHAPTER).filter(id => app.save.isHardCleared(id)).length;
const hardDoneAll = app => { let n = 0; for (let i = 1; i <= app.config.TOTAL_LEVELS; i++) if (app.save.isHardCleared(i)) n++; return n; };
/** 目前模式下的「目前關卡」 */
const curLevel = app => (mode === 'hard' ? app.save.unlockedHardLevel() : app.save.unlockedLevel());

/** 一個關卡點在目前模式下的狀態 */
function nodeState(app, id, cur) {
  const s = app.save;
  if (mode === 'hard') {
    const st = s.hardStars(id);
    const cleared = st > 0;
    const playable = s.canPlayHard(id);
    return { st, cleared, locked: !cleared && !playable, isCur: id === cur && !cleared && playable };
  }
  const st = s.levelStars(id);
  return { st, cleared: st > 0, locked: id > cur && !s.isCleared(id), isCur: id === cur && !s.isCleared(id) };
}

function chapterLock(app, ch) {
  const s = app.save, N = app.config.LEVELS_PER_CHAPTER;
  if (mode !== 'hard') return ch > s.maxChapter() ? `完成第 ${ch - 1} 章<br>就能來這裡喔～` : '';
  const first = (ch - 1) * N + 1;
  if (s.isHardCleared(first) || s.canPlayHard(first)) return '';
  return !s.isCleared(first) ? `先通過普通版第 ${first} 關<br>就能挑戰這裡喔～` : `完成困難版第 ${ch - 1} 章<br>就能來這裡喔～`;
}

function buildChapter(app, ch, cur) {
  const { LEVELS_PER_CHAPTER: N, CHAPTERS } = app.config;
  const C = CHAPTERS[ch - 1];
  const s = app.save;
  const hard = mode === 'hard';
  const theme = safe(() => chapterTheme(ch), { bg: 'var(--cream)', accent: 'var(--pink)' });
  const lockMsg = chapterLock(app, ch);
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
    const { st, cleared, locked: isLocked, isCur } = nodeState(app, id, cur);
    const boss = i === N - 1;
    const lv = safe(() => app.levelById(id), null);
    const cls = ['u-node', cleared ? 'cleared' : '', isCur ? 'cur' : '', isLocked ? 'locked' : '', boss ? 'boss' : '', lv ? '' : 'soon'].filter(Boolean).join(' ');
    nodes += `<button class="${cls}" data-id="${id}" style="left:${nodeX(ch, i).toFixed(2)}%;top:${nodeY(i)}px" aria-label="${hard ? '困難版' : ''}第 ${id} 關${lv?.name ? ' ' + esc(lv.name) : ''}">` +
      (isCur ? `<span class="u-node-bear ${i > 0 && nodeX(ch, i - 1) > nodeX(ch, i) ? 'l' : 'r'}">${bearHead(app, 'happy')}</span>` : '') +
      `<span class="u-node-drop">${isLocked ? `<span class="u-node-lock">${ICONS.lock}</span>` : `<b>${id}</b>`}</span>` +
      (boss ? '<span class="u-node-crown">♛</span>' : '') +
      (st ? starRow(st, 3, 'u-stars u-node-stars') : '') +
      (!lv && !isLocked ? '<span class="u-node-soon">準備中</span>' : '') +
      `</button>`;
  }

  // 兩側的物件小裝飾
  let deco = '';
  for (let i = 1; i < N; i += 2) {
    const x = nodeX(ch, i) > 50 ? 9 + (i % 3) * 3 : 83 - (i % 3) * 3;
    const item = C.items[(i * 5) % C.items.length].id;
    deco += `<span class="u-map-deco" style="left:${x}%;top:${nodeY(i) - 30}px;--rot:${(i % 2 ? -1 : 1) * (8 + i)}deg">${safe(() => svgImg(tileSVG(item)))}</span>`;
  }

  const chStars = hard ? s.hardChapterStars(ch) : s.chapterStars(ch);
  let hardBadge = '', chip = '';
  if (hard) {
    const done = hardDoneIn(app, ch);
    const rw = rewardOfChapter(app, ch);
    const got = rw && s.rewardEarned(rw);
    hardBadge = `<span class="u-ch-hard${done >= N ? ' done' : ''}">✦ 困難 ${done}/${N}</span>`;
    chip = rw ? `<span class="u-ch-goldchip${got ? ' got' : ''}" title="困難模式第 ${ch} 章 ${N} 關全破的金色限定">` +
      `<span class="u-ch-goldic">${safe(() => svgImg(rewardArt(app, rw), '', rw.name))}</span>${esc(rw.name)}${got ? ICONS.check : ICONS.goldLock}</span>` : '';
  } else if (perfume) {
    chip = `<span class="u-ch-perf">${safe(() => svgImg(perfumeBottleSVG(perfume.id), s.isCleared(ch * N) ? '' : 'sil'))}${esc(perfume.name)}</span>`;
  }

  return `
  <section class="u-ch${lockMsg ? ' locked' : ''}" data-ch="${ch}" style="height:${H}px;background:${theme.bg};--accent:${theme.accent || 'var(--pink)'}">
    ${TOD_TINT}${hard ? GOLD_TINT : ''}
    <svg class="u-path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${smoothPath(pts)}" class="u-path-under"/>
      <path d="${smoothPath(pts)}" class="u-path-line"/>
    </svg>
    ${deco}
    <div class="u-ch-banner card">
      <div class="u-ch-text">
        <div class="u-ch-no">第 ${ch} 章<span class="u-ch-theme">${esc(C.theme)}</span>${hardBadge}</div>
        <h2>${esc(C.name)}</h2>
        <div class="u-ch-meta">${starIcon('u-star sm')}<b>${chStars}</b>/${N * 3}${chip}</div>
      </div>
      ${friend ? `<div class="u-ch-friend${met ? '' : ' unmet'}">${safe(() => svgImg(friendSVG(friend.id, { expr: met ? 'happy' : 'normal' }), '', friend.name))}<span>${met ? esc(friend.name) : '？'}</span></div>` : ''}
    </div>
    ${nodes}
    ${lockMsg ? `<div class="u-ch-lockmsg">${lockMsg}</div>` : ''}
  </section>`;
}

/** 地圖最下面的結尾文字（依進度） */
function endText(app) {
  const s = app.save, { TOTAL_LEVELS, HARD_UNLOCK_LEVEL = 40 } = app.config;
  if (mode === 'hard') {
    const n = hardDoneAll(app);
    if (n >= TOTAL_LEVELS) return '困難模式全部完成！黃金丁噹香調好了✦';
    return `困難模式 ${n}/${TOTAL_LEVELS} 關・每章全破送一件金色限定✦`;
  }
  if (s.isCleared(TOTAL_LEVELS)) return '全部冒險完成！食衣住行育樂都玩遍了♡';
  if (s.isCleared(HARD_UNLOCK_LEVEL)) return '食衣住行完成！接著去上學、逛遊樂園吧～';
  return '走完食衣住行，就能調出丁噹熊的招牌香水喔～';
}

function lockReason(app, id) {
  const s = app.save, N = app.config.LEVELS_PER_CHAPTER;
  const ch = Math.ceil(id / N);
  if (mode === 'hard') {
    const hc = s.unlockedHardLevel();
    if (!s.isCleared(id) && (id <= hc || !s.isCleared(hc))) return `要先通過普通版第 ${Math.min(id, s.unlockedLevel())} 關，才能挑戰困難版喔～`;
    return `先通過困難版第 ${hc} 關才能玩這關喔～`;
  }
  return ch > s.maxChapter() ? `要先完成第 ${ch - 1} 章喔～` : `先通過第 ${s.unlockedLevel()} 關才能玩這關喔～`;
}

async function afterReturn(app, params, claimed, alive) {
  const s = app.save;
  const { FRIENDS, PERFUMES, STICKERS, BEAR_ITEMS, FURNITURE } = app.items;
  const { LEVELS_PER_CHAPTER: N, TOTAL_LEVELS } = app.config;
  const cards = [];
  const jc = Number(params.justCleared) || 0;
  const hard = !!params.hard;

  // 困難版回來：剛好完成該章困難版 → 金色限定（recordHard 已經發到存檔，這裡只提示）
  const gold = new Set(claimed || []);
  if (hard && jc && params.firstClear) {
    const ch = Math.ceil(jc / N);
    const rw = rewardOfChapter(app, ch);
    if (rw && s.hardChapterCleared(ch)) gold.add(rw.id);
  }
  if (gold.size) {
    const names = [...gold].map(id => app.items.itemById?.(id)?.name || PERFUMES.find(p => p.id === id)?.name).filter(Boolean);
    if (names.length) { app.audio.sfx('reward'); app.toast(`拿到金色限定：${names.join('、')}！`, 3600); }
  }

  if (!hard && jc && params.firstClear && jc % N === 0) {
    const ch = jc / N;
    await app.dialog.play(`ch${ch}_outro`);
    if (!alive()) return;
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
      const it = BEAR_ITEMS.find(i => i.chapter === ch && !i.reward) || FURNITURE.find(i => i.chapter === ch && !i.reward);
      cards.push({ tag: '商店新品', art: it ? (FURNITURE.includes(it) ? safe(() => furnitureSVG(it.id)) : safe(() => itemIconSVG(it.id))) : '', title: `第 ${ch} 章的新衣服和家具上架了！`, text: '去換裝和布置看看吧～' });
      s.markSeen('shop_ch' + ch);
    }
  }
  if (cards.length) await showCards(app, cards);
  if (!alive()) return;
  if (!hard && params.firstClear && FINALES[jc]) await app.dialog.play(FINALES[jc]);
  if (!alive()) return;

  // 困難模式開放的提示（剛過第 40 關，或舊存檔第一次進 v1.2 的地圖）
  if (s.hardUnlocked() && !s.seen('hard_open')) {
    s.markSeen('hard_open');
    await showCards(app, [{
      tag: '新模式', art: rewardArt(app, rewardOfChapter(app, 1)),
      title: '困難模式開放了！', text: '按地圖上方的「困難」切換：多一種顏色、步數更少，每章 10 關全破送一件金色限定✦', sfx: 'bell',
    }]);
    if (!alive()) return;
  }
  // 困難 60 關全破（第一次）
  if (hard && params.firstClear && hardDoneAll(app) >= TOTAL_LEVELS && !s.seen('hard_outro')) await app.dialog.play('hard_outro');
}

export default {
  async mount(root, params, app) {
    j = janitor();
    const my = ++gen;
    app.audio.playMusic('map');
    const s = app.save;
    const { LEVELS_PER_CHAPTER: N, CHAPTERS } = app.config;
    // 已達成但還沒發的金色限定（例如匯入存檔）先發掉
    const claimed = safe(() => s.claimRewards?.(), []) || [];
    const canHard = !!safe(() => s.hardUnlocked(), false);
    mode = canHard && (params.hard || s.settings().mapMode === 'hard') ? 'hard' : 'normal';

    root.classList.add('u-screen', 'u-map');
    bar = topBar(app, { title: '冒險地圖' });
    root.appendChild(bar.el);
    if (canHard) {
      const t = bar.el.querySelector('.u-title');
      const sw = document.createElement('div');
      sw.className = 'u-mode';
      sw.setAttribute('role', 'tablist');
      sw.setAttribute('aria-label', '地圖模式');
      sw.innerHTML = `<span class="u-mode-in"><button class="u-mode-btn" data-mode="normal" role="tab">普通</button>` +
        `<button class="u-mode-btn" data-mode="hard" role="tab">✦ 困難<i class="u-dot"></i></button></span>`;
      t.replaceWith(sw);
    }

    const wrap = document.createElement('div');
    wrap.className = 'u-map-wrap';
    wrap.innerHTML = `<div class="u-map-sky"><div class="u-map-hello"><b></b><span></span></div><div class="u-map-hardtag"></div></div><div class="u-map-body"></div>`;
    root.appendChild(wrap);
    const skyCard = wrap.querySelector('.u-map-sky');
    const body = wrap.querySelector('.u-map-body');
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

    function render() {
      const cur = curLevel(app);
      root.classList.toggle('hard', mode === 'hard');
      body.innerHTML = CHAPTERS.map(C => buildChapter(app, C.id, cur)).join('') + `<div class="u-map-end">${esc(endText(app))}</div>`;
      skyCard.querySelector('.u-map-hardtag').innerHTML = mode === 'hard' ? `<span>✦ 困難模式</span><b>${hardDoneAll(app)}/${app.config.TOTAL_LEVELS}</b>` : '';
      bar.el.querySelectorAll('.u-mode-btn').forEach(b => {
        const on = b.dataset.mode === mode;
        b.classList.toggle('on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      bar.el.querySelector('.u-mode-btn[data-mode="hard"] .u-dot')?.classList.toggle('on', !s.seen('mapmode_hard'));
    }
    // 捲到目前的關卡（或剛通過的那關）
    function focus(id, smooth) {
      const target = body.querySelector(`.u-node[data-id="${id}"]`) || body.querySelector('.u-node.cur');
      if (!target) return;
      const r = target.getBoundingClientRect();
      window.scrollTo({ top: Math.max(0, r.top + window.scrollY - window.innerHeight * 0.55), behavior: smooth ? 'smooth' : 'auto' });
    }
    render();
    focus(Number(params.justCleared) || curLevel(app), false);

    async function setMode(m) {
      if (m === mode || (m === 'hard' && !s.hardUnlocked())) return;
      mode = m;
      s.setSetting('mapMode', m);
      app.audio.sfx(m === 'hard' ? 'bell' : 'page');
      document.querySelector('.u-say')?.remove();
      render();
      focus(curLevel(app), false);
      if (m === 'hard') {
        if (!s.seen('mapmode_hard')) { s.markSeen('mapmode_hard'); render(); }
        if (!s.seen('hard_intro')) await app.dialog.play('hard_intro');
        if (app.screen === 'map' && mode === 'hard') bearSay(app, '困難模式：多一種顏色、步數更少！加油✦');
      }
    }
    j.on(bar.el, 'click', e => {
      const b = e.target.closest('.u-mode-btn');
      if (b) setMode(b.dataset.mode);
    });

    j.on(wrap, 'click', async e => {
      const n = e.target.closest('.u-node');
      if (!n) return;
      const id = Number(n.dataset.id);
      const ch = Math.ceil(id / N);
      const hard = mode === 'hard';
      if (n.classList.contains('locked')) {
        app.audio.sfx('tap');
        bearSay(app, lockReason(app, id));
        return;
      }
      if (!safe(() => app.levelById(id, hard ? { hard: true } : {}), null)) { app.audio.sfx('tap'); bearSay(app, '這一關還在準備中～'); return; }
      app.audio.sfx('select');
      n.classList.add('go');
      if (!hard && (id - 1) % N === 0 && STORY && STORY[`ch${ch}_intro`] && !s.seen(`ch${ch}_intro`)) {
        await app.dialog.play(`ch${ch}_intro`);
      }
      if (app.screen === 'map') app.go('level', hard ? { levelId: id, hard: true } : { levelId: id });
    });

    j.timeout(() => afterReturn(app, params, claimed, () => gen === my && app.screen === 'map').catch(err => console.warn('[ui] 地圖提示失敗', err)), 350);
  },
  unmount() {
    gen++;
    // 還開著的解鎖卡是這張地圖的，一起收掉
    document.querySelectorAll('.u-modal').forEach(m => { if (m.querySelector('.u-unlock')) m.remove(); });
    offTod?.(); offTod = null;
    sky?.destroy(); sky = null;
    j?.clean(); j = null;
    bar?.destroy(); bar = null;
    document.querySelector('.u-say')?.remove();
  },
};
