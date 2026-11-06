// 劇情對話框：play(scriptId) → Promise。左邊丁噹熊＋大不溜，右邊熊朋友；說話的人亮起來。
import { STORY } from '../data/story.js';
import { bearSVG, dogSVG } from '../art/chars.js';
import { friendSVG } from '../art/collections.js';
import { FRIENDS, PERFUMES } from '../data/items.js';
import { save } from '../save.js';
import audio from '../audio.js';
import { svgImg, safe } from './uikit.js';

const BEAR_EXPR = ['normal', 'happy', 'squint', 'worried', 'pout', 'surprised', 'wink'];
const DOG_EXPR = ['smug', 'happy', 'bark', 'lick', 'sneeze', 'sad'];
const NAMES = { bear: '丁噹熊', dog: '大不溜', ...Object.fromEntries(FRIENDS.map(f => [f.id, f.name])) };

function bearExpr(e) {
  if (BEAR_EXPR.includes(e)) return e;
  if (/sad|cry|worr|sorry/.test(e || '')) return 'worried';
  if (/angry|pout|hmph/.test(e || '')) return 'pout';
  if (/wow|surpris|shock/.test(e || '')) return 'surprised';
  return e ? 'happy' : 'normal';
}
function dogExpr(e) {
  if (DOG_EXPR.includes(e)) return e;
  if (/sad|cry|sorry/.test(e || '')) return 'sad';
  if (/happy|joy|smile/.test(e || '')) return 'happy';
  return 'smug';
}
const friendExpr = e => (e === 'normal' || /sad|worr|think|shy/.test(e || '') ? 'normal' : 'happy');
const curPerfume = () => PERFUMES.find(p => p.id === save.perfume())?.color || '#FF9EB5';

let playing = null;

export default {
  /** 播一段劇情；沒有這段就直接結束。播完自動 markSeen */
  play(scriptId) {
    const lines = (STORY && STORY[scriptId]) || null;
    if (!lines || !lines.length) return Promise.resolve();
    if (playing) return playing;
    playing = new Promise(resolve => {
      const ov = document.createElement('div');
      ov.className = 'u-dlg';
      ov.innerHTML = `
        <button class="u-dlg-skip">跳過 ››</button>
        <div class="u-dlg-stage">
          <div class="u-dlg-left"><div class="u-dlg-dog"></div><div class="u-dlg-bear"></div></div>
          <div class="u-dlg-right"><div class="u-dlg-friend"></div></div>
        </div>
        <div class="u-dlg-box card">
          <div class="u-dlg-name"></div>
          <p class="u-dlg-text"></p>
          <span class="u-dlg-next">▼</span>
        </div>`;
      document.body.appendChild(ov);
      const $ = s => ov.querySelector(s);
      const outfit = save.equipped();
      let i = -1, typing = 0, full = '', shown = 0, friendId = null, done = false;

      // 這段劇情有出場的朋友（右邊固定顯示最近一位）
      const firstFriend = lines.find(l => l.who && l.who !== 'bear' && l.who !== 'dog')?.who || null;
      friendId = firstFriend;

      function setPortraits(line) {
        const who = line.who;
        const bE = who === 'bear' ? bearExpr(line.expr) : 'normal';
        const dE = who === 'dog' ? dogExpr(line.expr) : 'smug';
        $('.u-dlg-bear').innerHTML = safe(() => svgImg(bearSVG({ expr: bE, outfit, perfumeColor: curPerfume() }), '', '丁噹熊'));
        $('.u-dlg-dog').innerHTML = safe(() => svgImg(dogSVG({ expr: dE, outfit }), '', '大不溜'));
        if (who !== 'bear' && who !== 'dog' && NAMES[who]) friendId = who;
        const fr = $('.u-dlg-friend');
        if (friendId) {
          const fE = who === friendId ? friendExpr(line.expr) : 'normal';
          fr.innerHTML = safe(() => svgImg(friendSVG(friendId, { expr: fE }), '', NAMES[friendId]));
          fr.parentElement.classList.add('has');
        } else {
          fr.innerHTML = '';
          fr.parentElement.classList.remove('has');
        }
        $('.u-dlg-bear').classList.toggle('talk', who === 'bear');
        $('.u-dlg-dog').classList.toggle('talk', who === 'dog');
        $('.u-dlg-friend').classList.toggle('talk', who === friendId && who !== 'bear' && who !== 'dog');
        const box = $('.u-dlg-box');
        box.classList.toggle('right', who !== 'bear' && who !== 'dog');
        box.dataset.who = who;
        $('.u-dlg-name').textContent = NAMES[who] || '';
      }

      function type() {
        clearInterval(typing);
        const p = $('.u-dlg-text');
        shown = 0;
        p.textContent = '';
        typing = setInterval(() => {
          shown += 1;
          p.textContent = full.slice(0, shown);
          if (shown >= full.length) { clearInterval(typing); typing = 0; }
        }, 34);
      }

      function next() {
        if (done) return;
        if (typing) { clearInterval(typing); typing = 0; $('.u-dlg-text').textContent = full; return; }
        i += 1;
        if (i >= lines.length) { finish(); return; }
        const line = lines[i];
        full = String(line.text || '');
        setPortraits(line);
        if (line.who === 'dog') audio.sfx('bark'); else if (i > 0) audio.sfx('page');
        type();
      }

      function finish() {
        if (done) return;
        done = true;
        clearInterval(typing);
        safe(() => save.markSeen(scriptId));
        ov.classList.add('out');
        setTimeout(() => { ov.remove(); playing = null; resolve(); }, 260);
      }

      ov.addEventListener('click', e => {
        if (e.target.closest('.u-dlg-skip')) { audio.sfx('tap'); finish(); return; }
        next();
      });
      next();
    });
    return playing;
  },
  get playing() { return !!playing; },
};

