// 丁噹熊＋大不溜的 DOM 元件（B2 擁有）。首頁、關卡、換裝預覽、劇情都用這個。
//
// const duo = mountDuo(container, { size: 'game' | 'home' | 'preview' | 'small', app, interactive = true, labels = false });
//   duo.el                     元件根節點（.ch-duo）
//   duo.react(kind)            'idle'|'combo'|'special'|'lowMoves'|'win'|'lose'|'shuffle'|'licked'（額外：'yawn' 打哈欠）
//   duo.say(text, ms = 2200)   丁噹熊的對話泡泡（.ch-say，可用 CSS 改位置）
//   duo.setOutfit(equipped)    傳 save.equipped()：{ head, ribbon, clothes, hand, dogHead, collar }
//   duo.setPerfume(color)      香水瓶與香霧顏色
//   duo.destroy()              清掉 timer、動畫、粒子並移除元素
//   （額外）duo.bear / duo.dog 兩個按鈕元素；duo.spray() 讓熊噴一下；duo.bark() 讓狗叫一下
//
// 大小（CSS 變數 --bw 熊寬、--dw 狗寬，見 css/chars.css）：
//   game    手機 熊 100 / 狗 70；寬螢幕（≥900px）熊 190 / 狗 120
//   home    手機 熊 150 / 狗 104；寬螢幕 熊 200 / 狗 136
//   preview 手機 熊 160 / 狗 120（並排不重疊）；寬螢幕 熊 220 / 狗 165
//   small   熊 64 / 狗 46
// 粒子（香霧、愛心、彩紙）畫在 document.body 上的固定圖層 .ch-fxlayer，不會被容器裁掉。
//
// 時段（js/timeOfDay.js）：晚上（night）丁噹熊每 15–30 秒打一次哈欠；大不溜大部分時間趴著睡（data-expr="sleep"），
//   每 15–25 秒醒來伸懶腰、舔丁噹熊一下再睡回去；晚上點牠會先嚇醒（？！）再叫，約 8 秒後睡回去；
//   關卡反應（combo、special、win、lose、licked）會把牠吵醒一起演，演完再睡。時段中途改變會即時切換。
//   size 'preview'（換裝預覽）不睡，才看得清楚造型。
// 點大不溜約 1/3 機率報今天日期（「汪！今天是 11 月 7 日 星期六」，兩行、約 3 秒，泡泡會自動避開畫面邊緣）。
import { bearSVG, dogSVG, mix } from '../art/chars.js';
import { heartPath, sparkle } from '../art/common.js';
import tod from '../timeOfDay.js';

const TAP_LINES = ['噴一下香香～', '叮噹～我是丁噹熊！', '香香的，心情也變好了～', '今天也要漂漂亮亮♡', '大不溜，不要偷噴我的香水！'];
const LICK_LINES = ['嘻嘻，好癢～', '大不溜，不要一直舔我啦～', '你也想噴香水嗎？'];
const YAWN_LINES = ['呼啊～好睏喔～', '再玩一下下就去睡～', '星星出來了耶～'];
const WEEK = '日一二三四五六';
/** 「汪！今天是\n11 月 7 日 星期六」 */
export function dateLine(d = new Date()) { return `汪！今天是\n${d.getMonth() + 1} 月 ${d.getDate()} 日 星期${WEEK[d.getDay()]}`; }

let fxLayer = null;
function layer() {
  if (!fxLayer || !fxLayer.isConnected) {
    fxLayer = document.createElement('div');
    fxLayer.className = 'ch-fxlayer';
    document.body.appendChild(fxLayer);
  }
  return fxLayer;
}
const partSVG = (shape, fill, stroke) => shape === 'heart'
  ? `<svg viewBox="0 0 24 24"><path d="${heartPath(12, 12.6, 8.4)}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/></svg>`
  : shape === 'star'
    ? `<svg viewBox="0 0 24 24"><path d="${sparkle(12, 12, 11)}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/></svg>`
    : `<svg viewBox="0 0 24 24"><rect x="5" y="8" width="14" height="8" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/></svg>`;
function rgba(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}

export function mountDuo(container, { size = 'game', app = null, interactive = true, labels = false } = {}) {
  let dead = false;
  const timers = new Set();
  const anims = new Set();
  const parts = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!dead) fn(); }, ms); timers.add(id); return id; };
  const sfx = (name, opts) => { try { app?.audio?.sfx?.(name, opts); } catch (e) { /* 佔位音效或沒有 app */ } };
  const anim = (elm, kf, opt) => {
    if (!elm || dead || !elm.animate) return null;
    const a = elm.animate(kf, opt);
    anims.add(a);
    a.finished.catch(() => {}).finally(() => anims.delete(a));
    return a;
  };

  const el = document.createElement('div');
  el.className = `ch-duo ch-size-${size}${interactive ? '' : ' ch-static'}`;
  el.innerHTML =
    `<div class="ch-pet">` +
      `<div class="ch-woof" aria-hidden="true">汪汪！</div>` +
      `<button type="button" class="ch-dog" aria-label="大不溜"><div class="ch-dog-hop"><div class="ch-dog-inner"></div></div></button>` +
      (labels ? `<div class="ch-name ch-name-dog">大不溜</div>` : '') +
    `</div>` +
    `<div class="ch-bearcol">` +
      `<div class="ch-say" aria-live="polite"><span></span></div>` +
      `<button type="button" class="ch-bear" aria-label="丁噹熊"><div class="ch-bear-hop"><div class="ch-bear-inner"></div></div></button>` +
      (labels ? `<div class="ch-name ch-name-bear">丁噹熊</div>` : '') +
    `</div>`;
  container.appendChild(el);

  const pet = el.querySelector('.ch-pet');
  const dogBtn = el.querySelector('.ch-dog'), dogHop = el.querySelector('.ch-dog-hop'), dogInner = el.querySelector('.ch-dog-inner');
  const bearBtn = el.querySelector('.ch-bear'), bearHop = el.querySelector('.ch-bear-hop'), bearInner = el.querySelector('.ch-bear-inner');
  const sayEl = el.querySelector('.ch-say'), sayText = sayEl.querySelector('span');
  const woof = el.querySelector('.ch-woof');

  let bearOutfit = {}, dogOutfit = {}, perfumeColor = '#FF9EB5';
  const sleepy = size !== 'preview';
  let night = sleepy && tod.current() === 'night';
  let awakeUntil = 0, sleepTimer = 0;
  let bearExpr = 'normal', dogExpr = night ? 'sleep' : 'smug';
  if (night) el.classList.add('ch-sleeping');
  let bearSvg = null, dogSvg = null;
  let bearTimer = 0, dogTimer = 0, sayTimer = 0;
  let dogBusy = false;

  function renderBear() {
    bearInner.innerHTML = bearSVG({ expr: bearExpr, outfit: bearOutfit, perfumeColor, live: true });
    bearSvg = bearInner.firstElementChild;
  }
  function renderDog() {
    dogInner.innerHTML = dogSVG({ expr: dogExpr, outfit: dogOutfit, live: true });
    dogSvg = dogInner.firstElementChild;
  }
  renderBear();
  renderDog();

  /** 換表情；ms 之後回到預設表情 */
  function setBear(e, ms) {
    bearExpr = e; if (bearSvg) bearSvg.dataset.expr = e;
    clearTimeout(bearTimer); timers.delete(bearTimer);
    if (ms) bearTimer = later(() => setBear('normal'), ms);
  }
  /** 大不溜沒事時的表情：晚上（而且沒被吵醒）是睡覺，其他時候是痞痞拽拽 */
  const restDog = () => (night && Date.now() >= awakeUntil ? 'sleep' : 'smug');
  function setDog(e, ms) {
    const wasSleep = dogExpr === 'sleep', isSleep = e === 'sleep';
    dogExpr = e; if (dogSvg) dogSvg.dataset.expr = e;
    el.classList.toggle('ch-sleeping', isSleep);
    if (wasSleep !== isSleep) poseBump(isSleep);
    clearTimeout(dogTimer); timers.delete(dogTimer);
    if (ms) dogTimer = later(() => setDog(restDog()), ms);
  }
  /** 趴下／站起來時身體壓一下，遮住換姿勢的瞬間 */
  function poseBump(lying) {
    anim(dogHop, lying
      ? [{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,.88)', offset: .45 }, { transform: 'scale(1,1)' }]
      : [{ transform: 'scale(1.06,.9)' }, { transform: 'scale(.96,1.06)', offset: .55 }, { transform: 'scale(1,1)' }], { duration: 380, easing: 'ease-out' });
  }
  /** 晚上把大不溜叫醒 ms 毫秒，之後自己睡回去 */
  function wake(ms = 8000) {
    if (!night) return;
    awakeUntil = Math.max(awakeUntil, Date.now() + ms);
    if (dogExpr === 'sleep') setDog('smug');
    scheduleSleep();
  }
  function scheduleSleep() {
    clearTimeout(sleepTimer); timers.delete(sleepTimer);
    if (!night) return;
    sleepTimer = later(maybeSleep, Math.max(200, awakeUntil - Date.now() + 60));
  }
  function maybeSleep() {
    if (!night || dead) return;
    if (Date.now() < awakeUntil) { scheduleSleep(); return; }
    if (dogExpr === 'sleep') return;
    if (dogBusy || dogExpr !== 'smug') { clearTimeout(sleepTimer); timers.delete(sleepTimer); sleepTimer = later(maybeSleep, 900); return; }
    setDog('sleep');
  }
  function restartClass(node, cls, ms) {
    if (!node) return;
    node.classList.remove(cls); void node.getBoundingClientRect(); node.classList.add(cls);
    later(() => node.classList.remove(cls), ms);
  }
  const unit = () => (bearBtn.getBoundingClientRect().width || 100) / 236;

  // ---------------- 粒子 ----------------
  function addPart(cls, html, size, x, y) {
    const p = document.createElement('div');
    p.className = cls;
    if (html) p.innerHTML = html;
    p.style.width = p.style.height = size + 'px';
    p.style.marginLeft = p.style.marginTop = (-size / 2) + 'px';
    p.style.transform = `translate(${x}px,${y}px) scale(.2)`;
    layer().appendChild(p);
    parts.add(p);
    return p;
  }
  function fly(p, kf, opt) {
    const a = p.animate(kf, opt);
    a.finished.catch(() => {}).finally(() => { p.remove(); parts.delete(p); });
  }
  function sprayMist(x, y, u, dirX = 1) {
    const c1 = rgba(perfumeColor, .85), c2 = rgba(mix(perfumeColor, '#ffffff', .3), .55), c3 = rgba(mix(perfumeColor, '#ffffff', .5), 0);
    for (let i = 0; i < 14; i++) {
      const s = (20 + Math.random() * 22) * u * 1.6;
      const m = addPart('ch-mist', '', s, x, y);
      m.style.background = `radial-gradient(circle, ${c1} 0%, ${c2} 38%, ${c3} 70%)`;
      const dx = (35 + Math.random() * 95) * u * dirX, dy = -(10 + Math.random() * 75) * u;
      fly(m, [{ transform: `translate(${x}px,${y}px) scale(.2)`, opacity: .95 }, { transform: `translate(${x + dx * .6}px,${y + dy * .6}px) scale(1.1)`, opacity: .8, offset: .4 }, { transform: `translate(${x + dx}px,${y + dy - 14 * u}px) scale(1.8)`, opacity: 0 }],
        { duration: 1000 + Math.random() * 700, delay: i * 22, easing: 'cubic-bezier(.15,.75,.35,1)', fill: 'backwards' });
    }
    for (let i = 0; i < 8; i++) {
      const shape = i % 2 ? 'heart' : 'star';
      const s = (11 + Math.random() * 9) * u * 1.6;
      const p = addPart('ch-pt', partSVG(shape, shape === 'heart' ? mix(perfumeColor, '#FF6F92', .35) : '#FFF6C2', shape === 'heart' ? '#fff' : '#E3BF72'), s, x, y);
      const dx = (30 + Math.random() * 100) * u * dirX, dy = -(25 + Math.random() * 90) * u, sway = (Math.random() * 2 - 1) * 18 * u;
      fly(p, [{ transform: `translate(${x}px,${y}px) scale(.2) rotate(0)`, opacity: 1 }, { transform: `translate(${x + dx * .5 + sway}px,${y + dy * .5}px) scale(1.1) rotate(20deg)`, opacity: 1, offset: .45 }, { transform: `translate(${x + dx - sway}px,${y + dy}px) scale(.7) rotate(-15deg)`, opacity: 0 }],
        { duration: 1200 + Math.random() * 600, delay: 80 + i * 45, easing: 'ease-out', fill: 'backwards' });
    }
  }
  function floatHeart(x, y, s) {
    const p = addPart('ch-pt', partSVG('heart', '#FF8FB0', '#fff'), s, x, y);
    fly(p, [{ transform: `translate(${x}px,${y}px) scale(.2)`, opacity: 0 }, { transform: `translate(${x}px,${y - s * .4}px) scale(1.25)`, opacity: 1, offset: .25 }, { transform: `translate(${x + s * .2}px,${y - s * .9}px) scale(1)`, opacity: 1, offset: .6 }, { transform: `translate(${x - s * .1}px,${y - s * 1.8}px) scale(.85)`, opacity: 0 }],
      { duration: 1300, easing: 'ease-out' });
  }
  function burst(x, y, u, n = 10, kinds = ['star', 'heart']) {
    for (let i = 0; i < n; i++) {
      const shape = kinds[i % kinds.length];
      const s = (10 + Math.random() * 8) * u * 1.6;
      const fill = shape === 'heart' ? '#FF8FB0' : shape === 'star' ? '#FFF6C2' : ['#FFB0C4', '#A8E6B8', '#C9B8F5', '#FFD36E', '#8CCBEA'][i % 5];
      const p = addPart('ch-pt', partSVG(shape, fill, shape === 'heart' ? '#fff' : shape === 'star' ? '#E3BF72' : 'rgba(0,0,0,.08)'), s, x, y);
      const a = Math.random() * Math.PI * 2, r = (50 + Math.random() * 70) * u * 1.6;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r * .7 - 30 * u;
      fly(p, [{ transform: `translate(${x}px,${y}px) scale(.3) rotate(0)`, opacity: 1 }, { transform: `translate(${x + dx}px,${y + dy}px) scale(1) rotate(${(Math.random() * 2 - 1) * 200}deg)`, opacity: 1, offset: .55 }, { transform: `translate(${x + dx * 1.1}px,${y + dy + 40 * u}px) scale(.8) rotate(${(Math.random() * 2 - 1) * 300}deg)`, opacity: 0 }],
        { duration: 1100 + Math.random() * 600, delay: i * 25, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'backwards' });
    }
  }
  const bearPoint = (fx, fy) => { const r = bearBtn.getBoundingClientRect(); return [r.left + r.width * fx, r.top + r.height * fy]; };

  // ---------------- 熊的動作 ----------------
  function hopBear(h = 14) {
    const u = unit();
    anim(bearHop, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(2px) scale(1.06,.94)', offset: .18 }, { transform: `translateY(-${h * u * 2.36}px) scale(.96,1.05)`, offset: .5 }, { transform: 'translateY(0) scale(1.04,.96)', offset: .82 }, { transform: 'translateY(0) scale(1,1)' }], { duration: 560, easing: 'ease-out' });
  }
  function ringBell() { restartClass(bearSvg?.querySelector('.ch-bell'), 'ch-ring', 950); }
  function spray(dirX = 1, withSneeze = true) {
    const arm = bearSvg?.querySelector('.ch-arm-hold');
    restartClass(arm, 'ch-spray', 820);
    later(() => {
      const n = bearSvg?.querySelector('.ch-nozzle');
      if (!n) return;
      const r = n.getBoundingClientRect();
      sprayMist(r.left + r.width / 2, r.top + r.height / 2, unit(), dirX);
      sfx('spray');
    }, 200);
    if (withSneeze) later(dogSneeze, 750);
  }
  function bearLicked() {
    setBear('squint', 1400);
    const r = bearBtn.getBoundingClientRect();
    floatHeart(r.left + r.width * .2, r.top + r.height * .42, Math.max(18, r.width * .16));
    anim(bearBtn, [{ transform: 'rotate(0)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(1deg)' }, { transform: 'rotate(0)' }], { duration: 700, easing: 'ease-out' });
    sfx('lick');
    if (size !== 'small' && Math.random() < .5) say(LICK_LINES[Math.random() * LICK_LINES.length | 0], 1800);
  }

  function bearYawn() {
    setBear('yawn', 2000);
    anim(bearHop, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(-1.5%) scale(.98,1.04)', offset: .4 }, { transform: 'translateY(-1%) scale(.99,1.03)', offset: .7 }, { transform: 'translateY(0) scale(1,1)' }], { duration: 2000, easing: 'ease-in-out' });
    if (size !== 'small' && Math.random() < .35) {
      const lines = dogExpr === 'sleep' ? [...YAWN_LINES, '大不溜都睡著了耶～'] : YAWN_LINES;
      later(() => say(lines[Math.random() * lines.length | 0], 2000), 1200);
    }
  }

  // ---------------- 狗的動作 ----------------
  function dogHopAnim(h = .16) {
    anim(dogHop, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(0) scale(1.1,.88)', offset: .18 }, { transform: `translateY(-${h * 100}%) scale(.94,1.07)`, offset: .5 }, { transform: 'translateY(0) scale(1.07,.93)', offset: .8 }, { transform: 'translateY(0) scale(1,1)' }], { duration: 520, easing: 'ease-out' });
  }
  function dogLick() {
    if (dogBusy || dead) return;
    dogBusy = true;
    const w = dogBtn.getBoundingClientRect().width || 70, dx = w * .2, dy = -w * .1;
    const a = anim(dogBtn, [
      { transform: 'translate(0,0) rotate(0)' },
      { transform: `translate(${dx}px,${dy}px) rotate(-9deg)`, offset: .25 },
      { transform: `translate(${dx * 1.15}px,${dy * 1.25}px) rotate(-12deg)`, offset: .42 },
      { transform: `translate(${dx}px,${dy}px) rotate(-8deg)`, offset: .58 },
      { transform: `translate(${dx * 1.15}px,${dy * 1.25}px) rotate(-12deg)`, offset: .72 },
      { transform: 'translate(0,0) rotate(0)' }], { duration: 1600, easing: 'ease-in-out' });
    later(() => { setDog('lick', 850); dogSvg?.classList.add('ch-licking'); bearLicked(); }, 400);
    later(() => dogSvg?.classList.remove('ch-licking'), 1250);
    if (a) a.finished.catch(() => {}).finally(() => { dogBusy = false; }); else dogBusy = false;
  }
  /** 晚上：醒來伸個懶腰，再去舔丁噹熊，之後睡回去 */
  function nightLick() {
    if (dogBusy || dead) return;
    wake(4200);
    anim(dogHop, [{ transform: 'scale(1,1)' }, { transform: 'translateX(4%) scale(1.16,.86)', offset: .45 }, { transform: 'scale(.96,1.05)', offset: .75 }, { transform: 'scale(1,1)' }], { duration: 900, easing: 'ease-in-out' });
    later(dogLick, 950);
  }
  function dogSneeze() {
    setDog('sneeze', 750);
    sfx('sneeze');
    anim(dogHop, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(-3%,2%) rotate(-6deg) scale(1.05,.95)', offset: .3 }, { transform: 'translate(4%,-3%) rotate(5deg) scale(.96,1.05)', offset: .55 }, { transform: 'translate(0,0) rotate(0)' }], { duration: 600, easing: 'ease-out' });
  }
  /** 狗頭上的泡泡；會自動左右（上下）挪，避免超出畫面 */
  function showWoof(text, dur = 1150, isDate = false) {
    woof.textContent = text;
    woof.classList.toggle('ch-date', !!isDate);
    woof.getAnimations?.().forEach(a => { try { a.cancel(); } catch (e) { /* 已結束 */ } });
    let dx = 0, dy = 0;
    const w = woof.offsetWidth, h = woof.offsetHeight;
    const pr = pet.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth, m = 12;
    if (w && pr.width) {
      const left = pr.left + pr.width / 2 - w / 2;
      if (left < m) dx = m - left; else if (left + w > vw - m) dx = vw - m - (left + w);
      const top = woof.getBoundingClientRect().top;
      if (top < m) dy = m - top;
    }
    woof.style.setProperty('--woof-ax', `${Math.max(14, Math.min(w - 14, w / 2 - dx))}px`);
    const tx = y => `translate(calc(-50% + ${dx}px),${y + dy}px)`;
    const hold = isDate ? .9 : .75;
    anim(woof, [{ opacity: 0, transform: `${tx(8)} scale(.5)` }, { opacity: 1, transform: `${tx(-4)} scale(1.12)`, offset: isDate ? .07 : .18 }, { opacity: 1, transform: `${tx(-6)} scale(1)`, offset: hold }, { opacity: 0, transform: `${tx(-16)} scale(1)` }], { duration: dur, easing: 'ease-out' });
  }
  /** 汪汪叫；withDate 為 true 時泡泡改成報今天日期 */
  function bark(withDate = false) {
    sfx('bark');
    setDog('bark', 900);
    if (withDate) {
      // 報日期時先收起丁噹熊的對話泡泡，兩個泡泡才不會疊在一起（主代理 v1.1 加）
      clearTimeout(sayTimer); timers.delete(sayTimer);
      sayEl.classList.remove('ch-show');
      showWoof(dateLine(), 3000, true);
    } else showWoof('汪汪！');
    if (!dogBusy) anim(dogHop, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.16,.84)', offset: .2 }, { transform: 'scale(.92,1.1)', offset: .45 }, { transform: 'scale(1.05,.96)', offset: .7 }, { transform: 'scale(1,1)' }], { duration: 480, easing: 'ease-out' });
  }
  /** 晚上睡著時被點：嚇一跳醒來 */
  function startle() {
    setDog('smug');
    showWoof('？！', 420);
    anim(dogHop, [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(-14%) scale(.94,1.08)', offset: .35 }, { transform: 'translateY(0) scale(1.06,.94)', offset: .75 }, { transform: 'translateY(0) scale(1,1)' }], { duration: 400, easing: 'ease-out' });
  }
  /** 打斷正在進行的舔舔／跳跳，讓重要反應（過關、失敗）一定播得出來 */
  function interruptDog() {
    [dogBtn, dogHop, pet].forEach(n => n.getAnimations?.().forEach(a => { try { a.cancel(); } catch (e) { /* 已結束 */ } }));
    dogSvg?.classList.remove('ch-licking');
    dogBusy = false;
  }
  function dogCircle() {
    // 繞到丁噹熊後面再從前面跑回來
    interruptDog();
    dogBusy = true;
    const bw = bearBtn.getBoundingClientRect().width || 100;
    const dw = dogBtn.getBoundingClientRect().width || 70;
    const far = bw * .95 + dw * .3;
    anim(pet, [{ zIndex: 2 }, { zIndex: 0, offset: .08 }, { zIndex: 0, offset: .5 }, { zIndex: 3, offset: .52 }, { zIndex: 2 }], { duration: 2000, easing: 'linear' });
    const a = anim(dogBtn, [
      { transform: 'translate(0,0) scale(1,1)' },
      { transform: `translate(${far * .5}px,${-dw * .18}px) scale(.86,.86)`, offset: .25 },
      { transform: `translate(${far}px,${-dw * .1}px) scale(.82,.82)`, offset: .48 },
      { transform: `translate(${far}px,${dw * .02}px) scale(-1,1)`, offset: .54 },
      { transform: `translate(${far * .5}px,${dw * .08}px) scale(-1.06,1.06)`, offset: .76 },
      { transform: 'translate(0,0) scale(-1,1)', offset: .94 },
      { transform: 'translate(0,0) scale(1,1)' }], { duration: 2000, easing: 'ease-in-out' });
    if (a) a.finished.catch(() => {}).finally(() => { dogBusy = false; }); else dogBusy = false;
  }

  // ---------------- 對話泡泡 ----------------
  function say(text, ms = 2200) {
    if (dead) return;
    sayText.textContent = text;
    sayEl.classList.add('ch-show');
    anim(sayText, [{ transform: 'scale(.6)', opacity: .3 }, { transform: 'scale(1.06)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'ease-out' });
    clearTimeout(sayTimer); timers.delete(sayTimer);
    sayTimer = later(() => sayEl.classList.remove('ch-show'), ms);
  }

  // ---------------- 反應 ----------------
  let rid = 0;
  function react(kind) {
    if (dead) return;
    const u = unit();
    const my = ++rid;
    // 反應裡延遲執行的動作：如果之後又來了新的反應，就不再執行（避免舊表情蓋掉新表情）
    const then = (fn, ms) => later(() => { if (my === rid) fn(); }, ms);
    // 晚上：會用到大不溜的反應先把牠吵醒，演完自己睡回去
    if (night && kind !== 'licked') {
      const wakeMs = { combo: 3000, special: 2600, win: 5000, lose: 4200 }[kind];
      if (wakeMs) wake(wakeMs);
    }
    switch (kind) {
      case 'idle':
        setBear('normal'); setDog(restDog());
        break;
      case 'combo': {
        setBear('happy', 1300); hopBear(16);
        const [x, y] = bearPoint(.3, .3);
        floatHeart(x, y, Math.max(18, 22 * u * 2.36 * .7));
        then(() => { const [x2, y2] = bearPoint(.62, .26); floatHeart(x2, y2, Math.max(16, 18 * u * 2.36 * .7)); }, 220);
        then(() => { setDog('happy', 1000); dogHopAnim(.2); }, 120);
        break;
      }
      case 'special': {
        setBear('surprised', 0);
        then(() => setBear('happy', 1200), 260);
        restartClass(bearSvg?.querySelector('.ch-arm-l'), 'ch-clap', 900);
        const [x, y] = bearPoint(.5, .55);
        burst(x, y, u, 8, ['star']);
        dogHopAnim(.18);
        break;
      }
      case 'lowMoves':
        setBear('worried', 2600);
        anim(bearBtn, [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }], { duration: 500, easing: 'ease-in-out' });
        break;
      case 'win': {
        setBear('happy', 3600);
        anim(bearHop, [{ transform: 'scale(1,1)' }, { transform: 'scale(-1,1)', offset: .25 }, { transform: 'scale(1,1)', offset: .5 }, { transform: 'scale(-1,1)', offset: .75 }, { transform: 'scale(1,1)' }], { duration: 1100, easing: 'ease-in-out' });
        spray(1, false);
        then(() => spray(-1, false), 700);
        then(() => { spray(1, false); }, 1400);
        then(() => { const [x, y] = bearPoint(.5, .25); burst(x, y, u, 16, ['confetti', 'star', 'heart', 'confetti']); sfx('bell'); ringBell(); }, 300);
        then(() => { setDog('happy', 2400); dogCircle(); }, 200);
        break;
      }
      case 'lose':
        setBear('pout', 1500);
        then(() => { setBear('wink', 1400); say('沒關係，再試一次！', 2200); hopBear(8); }, 1500);
        setDog('sad', 2200);
        interruptDog();
        {
          dogBusy = true;
          const w = dogBtn.getBoundingClientRect().width || 70;
          const a = anim(dogBtn, [
            { transform: 'translate(0,0) scale(1,1)' },
            { transform: `translate(${w * .05}px,${w * .12}px) scale(1.08,.8)`, offset: .2 },
            { transform: `translate(${w * .2}px,${w * .1}px) scale(1.08,.82) rotate(-6deg)`, offset: .45 },
            { transform: `translate(${w * .16}px,${w * .1}px) scale(1.08,.82) rotate(-2deg)`, offset: .6 },
            { transform: `translate(${w * .2}px,${w * .1}px) scale(1.08,.82) rotate(-6deg)`, offset: .75 },
            { transform: 'translate(0,0) scale(1,1)' }], { duration: 2200, easing: 'ease-in-out' });
          if (a) a.finished.catch(() => {}).finally(() => { dogBusy = false; }); else dogBusy = false;
        }
        break;
      case 'shuffle':
        say('洗一洗～', 1500);
        setBear('wink', 900);
        anim(bearHop, [{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(-4deg)' }, { transform: 'rotate(0)' }], { duration: 600, easing: 'ease-in-out' });
        break;
      case 'licked':
        if (night && dogExpr === 'sleep') nightLick(); else { if (night) wake(3000); dogLick(); }
        break;
      case 'yawn':   // （額外）讓丁噹熊打個哈欠，任何時段都可以用
        bearYawn();
        break;
      default:
        break;
    }
  }

  // ---------------- 點擊 ----------------
  let tapIdx = 0;
  function onBear(e) {
    e.preventDefault();
    sfx('bell'); ringBell(); hopBear(10); spray(1, true);
    if (size !== 'small') { tapIdx = (tapIdx + 1) % TAP_LINES.length; say(TAP_LINES[tapIdx], 1800); }
  }
  function onDog(e) {
    e.preventDefault();
    const withDate = Math.random() < 1 / 3;
    if (night && dogExpr === 'sleep') {
      wake(8000);
      startle();
      later(() => bark(withDate), 430);
    } else {
      if (night) wake(8000);
      bark(withDate);
    }
  }
  if (interactive) {
    bearBtn.addEventListener('click', onBear);
    dogBtn.addEventListener('click', onDog);
  } else {
    bearBtn.tabIndex = -1; dogBtn.tabIndex = -1;
  }

  // ---------------- 待機循環 ----------------
  const alive = () => !dead && el.isConnected && !document.hidden;
  (function lickLoop() {
    later(() => {
      if (alive()) { if (night && dogExpr === 'sleep') nightLick(); else dogLick(); }
      lickLoop();
    }, night ? 15000 + Math.random() * 10000 : 6000 + Math.random() * 4000);
  })();
  (function hopLoop() { later(() => { if (alive() && !dogBusy && dogExpr !== 'sleep') dogHopAnim(); hopLoop(); }, 3500 + Math.random() * 3000); })();
  (function yawnLoop() { later(() => { if (alive() && night && bearExpr === 'normal') bearYawn(); yawnLoop(); }, 15000 + Math.random() * 15000); })();

  // 時段改變（例如玩到一半變晚上）：即時切換
  const offTod = sleepy ? tod.onChange(p => {
    const n = p === 'night';
    if (n === night || dead) return;
    night = n;
    awakeUntil = 0;
    if (night) maybeSleep();
    else {
      clearTimeout(sleepTimer); timers.delete(sleepTimer);
      if (dogExpr === 'sleep') setDog('smug');
      if (bearExpr === 'yawn') setBear('normal');
    }
  }) : () => {};
  (function bellLoop() { later(() => { if (alive()) ringBell(); bellLoop(); }, 12000 + Math.random() * 10000); })();

  return {
    el, bear: bearBtn, dog: dogBtn,
    react, say,
    spray: () => spray(1, true),
    bark: (withDate = false) => bark(withDate),
    setOutfit(eq = {}) {
      bearOutfit = { head: eq.head, ribbon: eq.ribbon, clothes: eq.clothes, hand: eq.hand };
      dogOutfit = { dogHead: eq.dogHead, collar: eq.collar };
      renderBear(); renderDog();
    },
    setPerfume(color) {
      if (typeof color === 'string' && /^#[0-9a-f]{3,6}$/i.test(color)) { perfumeColor = color; renderBear(); }
    },
    destroy() {
      if (dead) return;
      dead = true;
      try { offTod(); } catch (e) { /* 已取消 */ }
      timers.forEach(clearTimeout); timers.clear();
      anims.forEach(a => { try { a.cancel(); } catch (e) { /* 已結束 */ } }); anims.clear();
      parts.forEach(p => p.remove()); parts.clear();
      bearBtn.removeEventListener('click', onBear);
      dogBtn.removeEventListener('click', onDog);
      el.remove();
    },
  };
}
