// 關卡畫面（C 擁有）：畫面名稱 'level'，params { levelId, hard?, seed? }（board、levelDef 只給測試用）。
// 美術、劇情模組用命名空間 import：別人新的 export 還沒加好時不會讓整個遊戲載入失敗。
import * as tiles from '../art/tiles.js';
import * as chars from '../art/chars.js';
import { mountDuo } from '../ui/charactersView.js';
import * as story from '../data/story.js';
import { BoardView, paintArt, giftArt } from './boardView.js';

const { tileSVG, babySVG, snowSVG, crateSVG, lockSVG } = tiles;
const chapterTheme = ch => { try { return (tiles.chapterTheme && tiles.chapterTheme(ch)) || {}; } catch (e) { console.error(e); return {}; } };
const bearSVG = opts => { try { return chars.bearSVG ? chars.bearSVG(opts) : ''; } catch (e) { console.error(e); return ''; } };

const DEFAULT_TIPS = {
  swap: '手指往旁邊滑，讓 3 個一樣的東西排成一排就能消掉喔！',
  special: '4 個一排會變熊掌、排成 L 或 T 會變蜂巢炸彈、5 個一排會變香水瓶！點一下就能發動。',
  combo: '把兩個特殊道具換在一起，會發動超強的組合技！',
  snow: '在雪塊上面消除，就能把雪融化。',
  crate: '在木箱旁邊消除，就能把木箱打開。',
  yarn: '被毛線纏住的東西不能移動，在旁邊消除就能解開。',
  honey: '蜂蜜黏黏會擴散！每一步都要記得清掉一點蜂蜜。',
  baby: '把熊寶寶送到最下面的小門，帶寶寶回家！',
  paint: '消除的那一串只要碰到有蠟筆顏色的格子，整串都會塗上顏色！把整個棋盤塗滿就過關。',
  gift: '在禮物盒旁邊消除、或用道具打它，就能拆開；打開會跳出一個特殊道具喔！',
};
const CHEERS = ['好香～好厲害！', '叮噹～太棒了！', '大不溜也在拍手！', '香香的連鎖！', '再來一次！'];
const TARGET_NAME = { snow: '雪塊', crate: '木箱', yarn: '毛線團', honey: '蜂蜜', gift: '禮物盒' };
const HARD_CHEERS = ['困難模式也難不倒我們！', '金色的星星在等我們～', '專心！一步一步來～'];

const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

let S = null;   // 目前這一局的狀態（unmount 時清掉）

function goalIcon(goal) {
  try {
    if (goal.type === 'collect') return tileSVG(goal.item);
    if (goal.type === 'baby') return babySVG();
    if (goal.type === 'paint') return paintIcon();
    if (goal.type === 'clear') {
      if (goal.target === 'snow') return snowSVG(1);
      if (goal.target === 'crate') return crateSVG(1);
      if (goal.target === 'gift') return giftArt(1);
      if (goal.target === 'yarn' || goal.target === 'honey') return lockSVG(goal.target);
    }
  } catch (e) { console.error('目標圖示失敗', goal, e); }
  return '';
}
/** 塗色目標的小圖示：塗色底＋一枝蠟筆 */
function paintIcon() {
  const inner = paintArt().replace(/^[\s\S]*?<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g transform="translate(6 10) scale(.8)">${inner}</g>` +
    `<g transform="rotate(-38 70 40)"><rect x="58" y="6" width="22" height="58" rx="5" fill="#FF8FB0" stroke="#5A3A2E" stroke-width="4"/>` +
    `<rect x="58" y="20" width="22" height="9" fill="#FFF4C2" stroke="#5A3A2E" stroke-width="3"/>` +
    `<path d="M58 64 L69 86 L80 64 Z" fill="#FFD6E2" stroke="#5A3A2E" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M65 78 L69 86 L73 78 Z" fill="#E8668C"/></g></svg>`;
}
function goalName(goal, app) {
  if (goal.type === 'collect') return (app.config.ITEM_NAME && app.config.ITEM_NAME[goal.item]) || goal.item;
  if (goal.type === 'baby') return '熊寶寶';
  if (goal.type === 'paint') return '塗色格子';
  return TARGET_NAME[goal.target] || goal.target || '目標';
}
/** 教學卡上的小圖示（障礙類教學才有） */
function tipIcon(key) {
  if (key === 'paint') return paintIcon();
  if (key === 'gift') return giftArt(2);
  if (['snow', 'crate', 'yarn', 'honey', 'baby'].includes(key)) return goalIcon(key === 'baby' ? { type: 'baby' } : { type: 'clear', target: key });
  return '';
}
function remaining(goal) { return Math.max(0, (goal.need | 0) - (goal.done | 0)); }

export default {
  async mount(root, params, app) {
    const hard = !!params.hard;
    const pickLevel = (id, h) => { try { return app.levelById(id, { hard: h }); } catch (e) { console.error(e); return null; } };
    let level = params.levelDef || pickLevel(Number(params.levelId), hard) || pickLevel(1, hard) || app.levels[0];   // levelDef 只給測試用
    if (!level) { app.go('map'); return; }
    if (hard && !level.isHard && app.config.hardLevelDef && !params.levelDef) level = app.config.hardLevelDef(level);
    const ch = level.chapter || app.config.chapterOfLevel(level.id);
    const chapter = app.config.chapterById(ch) || app.config.CHAPTERS[0];
    const theme = chapterTheme(ch) || {};
    const perfume = app.items.PERFUMES.find(p => p.id === app.save.perfume()) || app.items.PERFUMES[0];
    const st = S = { app, level, root, hard, ch, timers: [], lowWarned: false, ended: false, destroyed: false };

    root.classList.add('g-screen');
    root.classList.toggle('g-hardmode', hard);
    if (theme.bg) root.style.setProperty('--g-bg', theme.bg);   // 用 ::before 鋪滿整個視窗（電腦版兩側也一致）
    root.style.setProperty('--g-frame', theme.boardFrame || '#FFDCE6');
    root.style.setProperty('--g-accent', theme.accent || '#FF9EB5');

    root.innerHTML = `
      <div class="g-top">
        <button class="g-pause" aria-label="暫停"><i></i><i></i></button>
        <div class="g-level">${hard ? '<i class="g-hard">困難</i>' : ''}<span class="g-lv-no">第 ${level.id} 關</span><span class="g-lv-name">${esc(level.name || chapter.name)}</span></div>
        <div class="g-score">
          <div class="g-stars"><b class="g-st s1">★</b><b class="g-st s2">★</b><b class="g-st s3">★</b></div>
          <div class="g-bar"><i class="g-fill"></i><em class="g-mk m2"></em><em class="g-mk m3"></em></div>
          <span class="g-score-num">0</span>
        </div>
      </div>
      <div class="g-stage">
        <div class="g-duo"></div>
        <div class="g-panel">
          <div class="g-moves"><span>步數</span><b>${level.moves}</b></div>
          <div class="g-goals"></div>
        </div>
        <div class="g-board-area">
          <div class="g-frame"><div class="g-board"></div></div>
          <div class="g-banner" hidden><span>熊熊慶祝時間！</span><button class="btn ghost g-skip">跳過</button></div>
        </div>
      </div>
      <div class="g-overlay" hidden></div>`;
    const $ = sel => root.querySelector(sel);
    st.el = {
      moves: $('.g-moves b'), movesBox: $('.g-moves'), goals: $('.g-goals'), scoreNum: $('.g-score-num'),
      fill: $('.g-fill'), m2: $('.m2'), m3: $('.m3'), stars: [...root.querySelectorAll('.g-st')],
      overlay: $('.g-overlay'), banner: $('.g-banner'), board: $('.g-board'),
    };
    if (theme.frameBg) $('.g-frame').style.background = theme.frameBg;
    if (theme.boardBg) st.el.board.style.background = theme.boardBg;

    // 時段天空（主代理加）：疊在章節背景（::before）上、遊戲內容下；棋盤本身不變色
    try { if (app.tod) st.sky = app.tod.mountSky(root, { fixed: true }); } catch (e) { console.error('天空層載入失敗', e); }

    // 角色
    try { st.duo = mountDuo($('.g-duo'), { size: 'game', app }); } catch (e) { console.error('角色載入失敗', e); }
    try { st.duo && st.duo.setOutfit && st.duo.setOutfit(app.save.equipped()); } catch (e) { console.error(e); }
    try { st.duo && st.duo.setPerfume && st.duo.setPerfume(perfume.color); } catch (e) { console.error(e); }

    // 引擎（動態載入：引擎檔有問題時不會拖垮整個遊戲）
    let createGame;
    try { ({ createGame } = await import('../engine/engine.js')); }
    catch (e) {
      console.error('引擎載入失敗', e);
      st.el.overlay.hidden = false;
      st.el.overlay.innerHTML = `<div class="g-card"><h2>關卡還在準備中</h2><p>引擎載入失敗，請稍後再試。</p><button class="btn" data-act="map">回地圖</button></div>`;
      st.el.overlay.onclick = ev => { if (ev.target.closest('[data-act="map"]')) app.go('map'); };
      return;
    }
    if (st.destroyed) return;
    const seed = params.seed != null ? Number(params.seed) : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    st.g = createGame(level, params.board ? { seed, board: params.board } : { seed });   // board 只給測試用
    st.seed = seed;

    // 目標卡
    st.goalEls = (st.g.goals || []).map(goal => {
      const d = document.createElement('div');
      d.className = 'g-goal g-goal-' + (goal.type === 'clear' ? goal.target : goal.type);
      d.innerHTML = `<span class="g-goal-icon">${goalIcon(goal)}</span><span class="g-goal-txt"><small>${esc(goalName(goal, app))}</small><b>${remaining(goal)}</b></span><i class="g-check">✓</i>`;
      st.el.goals.appendChild(d);
      return d;
    });
    const stars = level.stars || [st.g.need3 || 3000, 6000];
    st.max = Math.max(1, stars[1] * 1.12);
    st.el.m2.style.left = (stars[0] / st.max * 100) + '%';
    st.el.m3.style.left = (stars[1] / st.max * 100) + '%';

    // 棋盤
    st.board = new BoardView(st.el.board, {
      theme, perfumeColor: perfume.color,
      hooks: {
        onEvent: ev => onEvent(st, ev),
        onAction: (kind, res) => { if (res && res.ok) updateMoves(st); },
        onSettled: res => onSettled(st, res),
        onSelect: () => app.audio.sfx('select'),
        onDenied: () => app.audio.sfx('tap'),
      },
    });
    st.board.attach(st.g, level.exits || []);
    updateHud(st);

    // 按鈕
    $('.g-pause').addEventListener('click', () => showPause(st));
    $('.g-skip').addEventListener('click', () => { if (st.board) { st.board.instant = true; st.board.fx.lowPower = true; st.board.fx.clear(); } });

    playLevelMusic(st);
    window.__game = makeDebug(st);
    await Promise.race([st.board.preload(), sleep(1500)]);
    if (st.destroyed) return;
    showIntro(st);
  },

  unmount() {
    if (!S) return;
    S.destroyed = true;
    S.timers.forEach(t => clearTimeout(t));
    try { S.board && S.board.destroy(); } catch (e) { console.error(e); }
    try { S.duo && S.duo.destroy(); } catch (e) { console.error(e); }
    try { S.sky && S.sky.destroy(); } catch (e) { console.error(e); }
    if (window.__game && window.__game._st === S) delete window.__game;
    S = null;
  },
};

// ---------------- HUD ----------------
function updateMoves(st) {
  const n = st.g.movesLeft;
  st.el.moves.textContent = n;
  st.el.movesBox.classList.toggle('low', n <= 5);
  bump(st.el.movesBox);
  if (n <= 5 && n > 0 && !st.lowWarned && st.g.status === 'playing') {
    st.lowWarned = true;
    react(st, 'lowMoves');
    say(st, '只剩 ' + n + ' 步了，加油！');
  }
}
function updateGoals(st, goals) {
  (goals || st.g.goals || []).forEach((goal, i) => {
    const d = st.goalEls[i];
    if (!d) return;
    const b = d.querySelector('b');
    const v = String(remaining(goal));
    if (b.textContent !== v) { b.textContent = v; bump(d); }
    d.classList.toggle('done', remaining(goal) === 0);
  });
}
function updateScore(st, score) {
  st.el.scoreNum.textContent = score.toLocaleString('en-US');
  st.el.fill.style.width = Math.min(100, score / st.max * 100) + '%';
  const s = st.level.stars || [Infinity, Infinity];
  st.el.stars[1].classList.toggle('on', score >= s[0]);
  st.el.stars[2].classList.toggle('on', score >= s[1]);
}
function updateHud(st) {
  st.el.moves.textContent = st.g.movesLeft;
  updateGoals(st);
  updateScore(st, st.g.score | 0);
}
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

function react(st, kind) { try { st.duo && st.duo.react(kind); } catch (e) { console.error(e); } }
function say(st, text, ms) { try { st.duo && st.duo.say && st.duo.say(text, ms); } catch (e) { console.error(e); } }
function sfx(st, name, opts) {
  try {
    const a = st.app.audio;
    if (Array.isArray(a.SFX_NAMES) && !a.SFX_NAMES.includes(name)) return;   // F 還沒加的音效安靜略過
    a.sfx(name, opts);
  } catch (e) { console.error(e); }
}
function playLevelMusic(st) {
  try { st.app.audio.playMusic && st.app.audio.playMusic('level', { chapter: st.ch }); } catch (e) { console.error(e); }
}

// ---------------- 事件 → 聲音、表情、HUD ----------------
function onEvent(st, ev) {
  if (st.board && st.board.instant && ev.type !== 'goals' && ev.type !== 'score' && ev.type !== 'end') {
    if (ev.type === 'clear' && Math.random() < .25) sfx(st, 'pop', { wave: 1 });
    return;
  }
  switch (ev.type) {
    case 'swap': sfx(st, 'swap'); break;
    case 'swapBack': sfx(st, 'swapBack'); break;
    case 'clear':
      st.lastWave = ev.wave || 1;
      sfx(st, 'pop', { wave: ev.wave || 1 });
      if ((ev.wave || 1) >= 3 && !st.cheered) { st.cheered = true; react(st, 'combo'); say(st, CHEERS[(Math.random() * CHEERS.length) | 0]); }
      break;
    case 'create': sfx(st, 'create'); if (!st.celebrating) react(st, 'special'); break;
    case 'activate':
      sfx(st, ev.special === 'bomb' ? 'bomb' : ev.special === 'perfume' ? 'perfume' : 'paw');
      if (ev.special === 'perfume' && !st.celebrating) react(st, 'special');
      break;
    case 'combo': sfx(st, 'combo'); react(st, 'combo'); break;
    case 'obstacle':
      if (ev.kind === 'snow') sfx(st, 'snow');
      else if (ev.kind === 'crate') sfx(st, 'crate');
      else if (ev.kind === 'gift') {
        sfx(st, 'gift', { left: ev.left | 0, open: !ev.left });
        if (!ev.left && !st.celebrating && !st.giftSaid) { st.giftSaid = true; react(st, 'special'); say(st, '禮物打開了！是什麼呢？'); }
      }
      else if ((ev.kind === 'yarn' || ev.kind === 'honey') && !ev.left) sfx(st, 'unlock');
      break;
    case 'paint': {
      const now = performance.now();
      if (!st.paintT || now - st.paintT > 120) { st.paintT = now; sfx(st, 'paint', { wave: st.lastWave || 1, n: (ev.cells || []).length }); }
      break;
    }
    case 'honeySpread': sfx(st, 'honeySpread'); break;
    case 'babyHome': sfx(st, 'baby'); say(st, '寶寶回家囉～'); break;
    case 'shuffle': sfx(st, 'shuffle'); react(st, 'shuffle'); say(st, '洗一洗～'); break;
    case 'goals': updateGoals(st, ev.goals); break;
    case 'score': updateScore(st, ev.score | 0); break;
    case 'transform': break;
  }
}

async function onSettled(st, res) {
  st.cheered = false;
  st.giftSaid = false;
  updateHud(st);
  if (st.ended || !st.g) return;
  if (st.g.status === 'won') { st.ended = true; await winFlow(st); }
  else if (st.g.status === 'lost') { st.ended = true; await loseFlow(st); }
}

// ---------------- 關卡前 ----------------
function showIntro(st) {
  const { app, level, g } = st;
  const ov = st.el.overlay;
  const tipKey = st.hard ? null : level.tutorial;
  const tips = story.LEVEL_TIPS || {};
  const tip = tipKey ? (tips[tipKey] || DEFAULT_TIPS[tipKey] || '') : '';
  const tIcon = tip ? tipIcon(tipKey) : '';
  const ch = app.config.chapterById(level.chapter || app.config.chapterOfLevel(level.id)) || {};
  const goals = (g.goals || []).map(goal => `<div class="g-ig"><span class="g-goal-icon">${goalIcon(goal)}</span><b>× ${remaining(goal)}</b><small>${esc(goalName(goal, app))}</small></div>`).join('');
  ov.hidden = false;
  ov.className = 'g-overlay intro';
  ov.innerHTML = `
    <div class="g-card g-intro${st.hard ? ' hard' : ''}">
      ${st.hard ? '<i class="g-hard big">困難</i>' : ''}
      <div class="g-chip">第 ${ch.id || ''} 章・${esc(ch.name || '')}</div>
      <h2>第 ${level.id} 關</h2>
      <p class="g-sub">${esc(level.name || '')}</p>
      <div class="g-intro-goals">${goals}</div>
      <p class="g-intro-moves">步數 <b>${g.movesLeft}</b></p>
      ${st.hard ? '<p class="g-hard-note">步數更少、顏色更多，過關可以拿困難星星！</p>' : ''}
      ${tip ? `<div class="g-tip"><span class="g-tip-bear">${bearSVG({ expr: 'happy' })}</span><p>${esc(tip)}</p>${tIcon ? `<span class="g-tip-icon">${tIcon}</span>` : ''}</div>` : ''}
      <button class="btn g-go" data-act="start">開始！</button>
    </div>`;
  ov.onclick = async ev => {
    const b = ev.target.closest('[data-act="start"]');
    if (!b) return;
    ov.onclick = null;
    sfx(st, 'page');
    ov.classList.add('out');
    st.timers.push(setTimeout(() => { ov.hidden = true; ov.classList.remove('out'); }, 260));
    await st.board.introDrop();
    if (st.destroyed) return;
    st.board.busy = false;
    st.board.inputEnabled = true;
    st.board._poke();
    say(st, st.hard ? HARD_CHEERS[(Math.random() * HARD_CHEERS.length) | 0] : (level.id === 1 ? '一起來做早餐吧！' : '一起收集吧！'));
  };
}

// ---------------- 暫停 ----------------
function showPause(st) {
  if (!st.g || st.ended) return;
  const { app } = st;
  const set = app.save.settings();
  const ov = st.el.overlay;
  const wasEnabled = st.board.inputEnabled;
  st.board.inputEnabled = false;
  ov.hidden = false;
  ov.className = 'g-overlay pause';
  ov.innerHTML = `
    <div class="g-card g-pausecard">
      <h2>休息一下</h2>
      <div class="g-toggles">
        <button class="g-tg ${set.sfx ? 'on' : ''}" data-act="sfx">音效 <i>${set.sfx ? '開' : '關'}</i></button>
        <button class="g-tg ${set.music ? 'on' : ''}" data-act="music">音樂 <i>${set.music ? '開' : '關'}</i></button>
      </div>
      <button class="btn" data-act="resume">繼續玩</button>
      <button class="btn mint" data-act="retry">重新開始</button>
      <button class="btn ghost" data-act="map">回地圖</button>
    </div>`;
  ov.onclick = ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'sfx' || act === 'music') {
      const v = !app.save.settings()[act];
      app.save.setSetting(act, v);
      if (act === 'sfx') app.audio.setSfx(v); else { app.audio.setMusic(v); if (v) playLevelMusic(st); }
      b.classList.toggle('on', v); b.querySelector('i').textContent = v ? '開' : '關';
      sfx(st, 'tap');
      return;
    }
    sfx(st, 'tap');
    if (act === 'resume') { ov.hidden = true; ov.onclick = null; st.board.inputEnabled = wasEnabled; st.board._poke(); }
    else if (act === 'retry') retry(st);
    else if (act === 'map') app.go('map');
  };
}

// ---------------- 過關 ----------------
async function winFlow(st) {
  const { app, level, g, board } = st;
  board.inputEnabled = false;
  board.sel = null;
  sfx(st, 'win');
  react(st, 'win');
  say(st, '過關了！噴一下香香慶祝～');
  await sleep(700);
  if (st.destroyed) return;
  if (g.movesLeft > 0 && g.celebrate) {
    st.celebrating = true;
    st.el.banner.hidden = false;
    board.timeScale = 1.9;
    let steps = [];
    try { steps = g.celebrate() || []; } catch (e) { console.error(e); }
    await board.play(steps);
    st.celebrating = false;
    board.timeScale = 1; board.instant = false; board.fx.lowPower = false;
    st.el.banner.hidden = true;
    updateHud(st);
    if (st.destroyed) return;
    await sleep(350);
  }
  if (st.destroyed) return;
  const score = g.score | 0;
  const stars = Math.max(1, g.starsFor ? g.starsFor(score) : 1);
  let rec = {};
  try {
    if (st.hard && app.save.recordHard) rec = app.save.recordHard(level.id, stars, score) || {};
    else rec = app.save.recordLevel(level.id, stars, score) || {};
  } catch (e) { console.error('存檔失敗', e); }
  st.result = { stars, score, hard: st.hard, ...rec };
  // 金色限定的圖（家具、香水在 collections.js；用動態載入，對方檔案有問題也不會拖垮結算）
  let rewardsHtml = '';
  if (Array.isArray(rec.rewards) && rec.rewards.length) {
    try { rewardsHtml = await rewardCards(app, rec.rewards); } catch (e) { console.error('金色限定圖示失敗', e); }
    if (st.destroyed) return;
  }
  showResult(st, stars, score, rec, rewardsHtml);
}

/** 金色限定小卡：換裝用 itemIconSVG、家具用 furnitureSVG、香水用 perfumeBottleSVG；名稱從 app.items 查 */
async function rewardCards(app, ids) {
  let col = {};
  try { col = await import('../art/collections.js'); } catch (e) { console.error('collections.js 載入失敗', e); }
  const I = app.items;
  const isIn = (list, id) => Array.isArray(list) && list.some(x => x.id === id);
  const cards = ids.map(id => {
    const it = (I.itemById && I.itemById(id)) || (I.PERFUMES || []).find(p => p.id === id) || { id, name: id };
    let svg = '', kind = '';
    try {
      if (isIn(I.PERFUMES, id)) { kind = '香水'; svg = col.perfumeBottleSVG ? col.perfumeBottleSVG(id) : ''; }
      else if (isIn(I.FURNITURE, id)) { kind = '家具'; svg = col.furnitureSVG ? col.furnitureSVG(id) : ''; }
      else { kind = isIn(I.DOG_ITEMS, id) ? '大不溜造型' : '換裝'; svg = chars.itemIconSVG ? chars.itemIconSVG(id) : ''; }
    } catch (e) { console.error('金色限定圖示失敗', id, e); }
    if (!svg) svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 8 L61 38 L93 38 L67 57 L77 89 L50 70 L23 89 L33 57 L7 38 L39 38 Z" fill="#F7C548" stroke="#B9861C" stroke-width="4" stroke-linejoin="round"/></svg>';
    return `<div class="g-rw"><span class="g-rw-icon">${svg}</span><b>${esc(it.name || id)}</b><small>${kind}</small></div>`;
  }).join('');
  return `<div class="g-reward"><p class="g-rw-title">拿到金色限定！</p><div class="g-rw-list">${cards}</div></div>`;
}

function retry(st) {
  const p = { levelId: st.level.id };
  if (st.hard) p.hard = true;
  st.app.go('level', p);
}

function showResult(st, stars, score, rec, rewardsHtml = '') {
  const { app, level } = st;
  const ov = st.el.overlay;
  const total = Math.min(app.config.TOTAL_LEVELS || Infinity, app.levels.length);
  const next = level.id + 1;
  const nextExists = level.id < total && !!app.levelById(next);
  const chapterEnd = level.id % app.config.LEVELS_PER_CHAPTER === 0;
  // 普通版：章末不給下一關（回地圖播章末劇情）；困難版：沒有劇情，只看 canPlayHard
  let hasNext;
  if (st.hard) { hasNext = nextExists; try { hasNext = hasNext && !!(app.save.canPlayHard && app.save.canPlayHard(next)); } catch (e) { hasNext = false; } }
  else hasNext = nextExists && !chapterEnd;
  const bestTxt = rec.newBest ? '<span class="g-best">新紀錄！</span>' : '';
  const earned = rec.newStars > 0 ? `<p class="g-earn">獲得 <b>${rec.newStars}</b> 顆星星 <span>★</span></p>` : `<p class="g-earn dim">這關的星星都拿過了</p>`;
  ov.hidden = false;
  ov.className = 'g-overlay result';
  ov.innerHTML = `
    <div class="g-card g-win${st.hard ? ' hard' : ''}">
      <div class="g-ribbon">${st.hard ? '困難過關！' : '過關！'}</div>
      <div class="g-bigstars">${[1, 2, 3].map(i => `<span class="g-bs" data-i="${i}">★</span>`).join('')}</div>
      <p class="g-final">分數 <b>${score.toLocaleString('en-US')}</b>${bestTxt}</p>
      ${earned}
      ${rewardsHtml}
      <div class="g-btns">
        ${hasNext ? '<button class="btn" data-act="next">下一關</button>' : ''}
        <button class="btn ${hasNext ? 'ghost' : ''}" data-act="map">回地圖</button>
      </div>
    </div>`;
  const bs = ov.querySelectorAll('.g-bs');
  for (let i = 0; i < stars; i++) {
    st.timers.push(setTimeout(() => { bs[i].classList.add('on'); sfx(st, 'star', { n: i + 1 }); }, 350 + i * 420));
  }
  if (rewardsHtml) {
    const rw = ov.querySelector('.g-reward');
    st.timers.push(setTimeout(() => { if (rw) rw.classList.add('show'); sfx(st, 'reward'); }, 450 + stars * 420));
  }
  ov.onclick = ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    sfx(st, 'tap');
    if (b.dataset.act === 'next') app.go('level', st.hard ? { levelId: next, hard: true } : { levelId: next });
    else if (st.hard) app.go('map', { justCleared: level.id, firstClear: !!rec.firstClear, hard: true });
    else app.go('map', { justCleared: level.id, firstClear: !!rec.firstClear });
  };
}

// ---------------- 失敗 ----------------
async function loseFlow(st) {
  const { app } = st;
  st.board.inputEnabled = false;
  sfx(st, 'lose');
  react(st, 'lose');
  await sleep(900);
  if (st.destroyed) return;
  const ov = st.el.overlay;
  ov.hidden = false;
  ov.className = 'g-overlay lose';
  ov.innerHTML = `
    <div class="g-card g-losecard">
      <span class="g-pout">${bearSVG({ expr: 'pout' })}</span>
      <h2>步數用完了～</h2>
      <p class="g-sub">差一點點！丁噹熊說：「再試一次！」</p>
      <div class="g-btns">
        <button class="btn" data-act="retry">再試一次</button>
        <button class="btn ghost" data-act="map">回地圖</button>
      </div>
    </div>`;
  ov.onclick = ev => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    sfx(st, 'tap');
    if (b.dataset.act === 'retry') retry(st);
    else app.go('map');
  };
}

// ---------------- 測試用 ----------------
function makeDebug(st) {
  return {
    _st: st,
    get g() { return st.g; },
    get hard() { return st.hard; },
    get result() { return st.result || null; },
    get board() { return st.board; },
    fps: () => st.board ? st.board.fps : 0,
    perf: () => st.board ? st.board.perfStats() : null,
    fpsLog: () => st.board ? st.board.fpsLog.slice() : [],
    start() { const b = st.el.overlay.querySelector('[data-act="start"]'); if (b) b.click(); },
    /** 自動走 n 步（每步用提示的交換，沒有就點特殊道具）；回傳實際走的步數 */
    async autoPlay(n = 1, gap = 60) {
      let done = 0;
      for (let i = 0; i < n; i++) {
        while (st.board && st.board.busy) await sleep(20);
        if (!st.g || st.g.status !== 'playing' || st.destroyed) break;
        const h = st.g.findHint();
        if (h) await st.board.doSwap(h.a, h.b);
        else {
          const mv = (st.g.listMoves() || []).find(m => m.kind === 'tap');
          if (!mv) break;
          await st.board.doTap(mv.p);
        }
        done++;
        await sleep(gap);
      }
      return done;
    },
    /** 一路玩到結束（測試結算） */
    async playToEnd(maxMoves = 80) {
      for (let i = 0; i < maxMoves; i++) {
        if (!st.g || st.g.status !== 'playing') break;
        await this.autoPlay(1, 0);
      }
      return st.g && st.g.status;
    },
    setInstant(v) { if (st.board) { st.board.instant = !!v; st.board.fx.lowPower = !!v; } },
  };
}
