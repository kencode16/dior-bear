// 《DIOR熊漂》三消引擎（A 引擎子代理擁有）。純邏輯、不碰 DOM，Node 與瀏覽器都能跑。
// 合約見專案根目錄 架構.md「A 引擎」。同一個 seed 結果完全一樣（自帶 mulberry32 RNG）。
//
// ─── 用法 ───────────────────────────────────────────────────────────────
//   import { createGame } from './js/engine/engine.js';
//   const g = createGame(levelDef, { seed: 123 });
//   const { ok, steps } = g.trySwap({r:3,c:2}, {r:3,c:3});
//
// ─── createGame 額外選項 ─────────────────────────────────────────────────
//   seed    : 整數（預設 1）
//   events  : false → 不產生 steps 事件（steps 永遠是 []），給模擬器加速用
//   board   : 測試用固定盤面，字串陣列（h 行、每行 w 字元），每格一個字元：
//               '0'–'5'  普通物件，數字是 g.items 的索引（0 = 本關第 1 種物件）
//               'H' 橫掃熊掌 pawH   'V' 直掃熊掌 pawV   'B' 蜂巢炸彈 bomb   'P' 香水瓶 perfume
//               'Y' 熊寶寶
//               '.' 隨機普通物件（只避開和左邊、上面形成 3 連）
//               '#' 'x' 'g' ' ' 不放 tile（洞、木箱、禮物盒格本來就不放；一般格放這些字元會留空，會在第一次掉落時補滿）
//             有 board 時不會自動放 level.babies.start 的熊寶寶，也不保證開局有步可走（由測試自己決定）。
//   items   : 直接指定本關物件 id 陣列（預設 CHAPTERS[level.chapter-1].items 前 level.colors 種）
//
// ─── 額外（合約外）方便除錯的方法 ─────────────────────────────────────────
//   g.toStrings()  → 目前盤面轉成上面 board 格式的字串陣列（洞、木箱、禮物盒為 '#'、'x'、'g'，空格為 ' '）
//   g.paintStrings() → v1.2 塗色層字串陣列（'#' 洞、'1' 已上色、'0' 未上色）
//   g.babiesHome   → 已回家的熊寶寶數
//   g.painted / g.paintNeed → v1.2 已上色格數／非洞格子數；g.giftLeft → 還沒打開的禮物盒個數
//
// ─── 規則細節（架構.md 沒寫死、這裡補充決定的部分）──────────────────────────
//   1. trySwap 不合法時：兩格相鄰、都有 tile、都沒被 lock 鎖住 → steps = [[swap],[swapBack]]；
//      其他情況（不相鄰、出界、洞、木箱、空格、被鎖、遊戲已結束）→ steps = []。都不扣步數。
//   2. 被 lock（毛線團／蜂蜜）鎖住的 tile 固定在原地：不會掉落，也會擋住上方 tile 往下掉
//      （它下方的空格靠斜向滑落補位）。解鎖後才會正常掉落。
//   3. 洞（hole）不擋掉落：tile 會直接穿過洞落到下面的格子。
//   4. 斜向滑落：垂直補位做完後，仍空著的格子從左上、再右上的可移動 tile 斜滑下來，
//      重複「垂直→斜向」直到穩定。fall 事件中每個 tile 只給最終 from→to（直線）。
//   5. 新物件 fromRow：同一欄這一輪補進 n 個，最下面那個從 -1 開始、往上依序 -2、-3…
//   6. 配對中的 locked tile 只解鎖、不消失（不算收集）；配對組旁邊（上下左右）的木箱 −1 層、
//      lock 解除。同一波中同一個木箱最多 −1 層。
//   7. 特殊道具被範圍打到：當下從盤面移除（clear 事件裡帶 special），在「下一階段」於原位置發動。
//      同一階段中，同一格最多被處理一次（木箱也只 −1 層）。熊寶寶完全不受特殊道具影響。
//   8. 範圍打到 locked tile：只解鎖，tile 留著。打到木箱：−1 層。打到雪：該格 tile 被消除時才融化。
//   9. 特殊道具＋普通物件交換：特殊道具移到對方格子後發動（香水則噴掉對方的物件種類）；
//      特殊道具＋熊寶寶交換也合法，香水此時噴「數量最多的那種」。
//  10. 「數量最多的那種 item」：盤面普通 tile 計數，同數取 g.items 中較前面的。
//  11. 組合技位置在 b（玩家拖到的那一格）。熊掌＋熊掌＝b 的整列＋整行；熊掌＋炸彈＝b 周圍 3 列＋3 行；
//      炸彈＋炸彈＝b 周圍 5×5；香水＋熊掌／炸彈＝最多那種 item 的未鎖 tile 全部變成熊掌（方向隨機）
//      ／炸彈（transform 事件，算作收集該 item），下一階段連同原本的熊掌／炸彈（在 b）一起發動；
//      該 item 被鎖住的 tile 只解鎖。香水＋香水＝全盤每一格都被打到一次。
//  12. 特殊道具位置：玩家交換的兩格中，拖到的那格（b）優先、其次 a；不在組內時，
//      5 連取該直線中間格、L/T 取交叉格、4 連取「中間偏下／偏右」格（第 2 格，從 0 算）。
//      若選到的格子是 locked（tile 沒消失），改選組內另一個被消除的格子；都沒有就不生成。
//  13. 計分：消除 tile 每個 20×倍率（倍率 = 1 + 0.5×(波數−1)，第 1 波是玩家動作造成的那一波）；
//      生成特殊道具 +60；障礙每少一層（含 lock 解除）+20；熊寶寶回家 +500。
//  14. clear 類目標（snow/crate/yarn/honey）：done = 已清掉的數量、need = done + 盤面剩餘，
//      所以 need − done 永遠等於「還剩多少」。蜂蜜擴散會讓 need 變大。
//  15. 熊寶寶：落到出口欄「最下面一個非洞格」就回家。要補新寶寶時，下一輪補位的第一個新物件改成寶寶。
//      盤面同時最多 babies.onBoard 隻（預設 1），總共 babies.total 隻（含 start）。
//  16. 慶祝時間：先把盤面上現有的特殊道具逐一發動，再把剩餘步數逐一變成隨機位置的熊掌
//      （方向隨機）並發動；熊掌範圍 cause 為 'celebrate'。慶祝時間不擴散蜂蜜、不洗牌。
//  17. 每一步結束順序：勝利判定 → 蜂蜜擴散 → 失敗判定（步數 0）→ 無步可走就洗牌。
//  18. 洗牌只動「沒有 lock 的普通 tile」，保持 tile id（moves 每項另外附 item 方便畫面）。
//  19. collect 目標的 done 會封頂在 need。
//
// ─── v1.2 新規則（2026-11-14）────────────────────────────────────────────
//  20. 舊關卡不變：沒有 paint（或全部是 0）、沒有 gift 的關卡完全不會走到新邏輯（painted＝0、giftLeft＝0），
//      行為、分數與亂數序列和 v1.1 一模一樣（tests/engine/test_baseline.mjs 用 v1.1 記下的 1000 局比對）。
//  21. 蠟筆塗色 paint：關卡圖層 paint: ['0010…']（'1' 開局就上色；洞上的 '1' 忽略）。g.cell().paint 為 0|1。
//      只有「tile 被消除」的格子會上色：木箱、禮物盒、被鎖住而只解鎖的 tile、熊寶寶、本來就空著的格子都不上色。
//      顏色不擴散、不消失，塗色完全不耗亂數。
//      a. 配對：一組（相交的橫直連線合併成一組，L/T/十字算一組）消除前，組內任一格已上色（含組內被鎖住的格子）
//         → 組內所有被消除的格子上色。同一波的不同組各自判斷。
//      b. 特殊道具：發動當下所在格已上色 → 這次發動範圍內被消除的格子都上色。同一階段有多個道具一起發動時，
//         被消除的格子只要在任一個「上色道具」的範圍內就上色（和處理順序無關）。
//         被波及的道具在下一階段於原位發動，那時它的格子通常已被塗上，所以顏色會沿著連鎖傳下去。
//         熊掌／香水和普通物件交換時，用「移過去之後」的格子判斷。
//      c. 組合技：兩個道具的格子任一已上色 → 兩格都上色，組合效果全部算上色（香水＋熊掌／炸彈變身出來的
//         每一個熊掌／炸彈也都算；沒上色時則各自依所在格判斷）。
//      d. 慶祝時間同規則（盤面道具與步數變的熊掌，所在格已上色才塗）。
//      e. 事件 {type:'paint', cells:[{r,c}]}：這一階段新上色的格子，緊接在造成它的 clear 之後（同一階段）。
//         每格 +20（不乘連鎖倍率），算進該 clear 的 scoreGain。
//      f. 目標 {type:'paint'}：need＝非洞格子總數（含木箱、禮物盒格；關卡寫的 need 忽略），done＝已上色格數。
//         開局一格都沒上色的關卡永遠塗不起來（關卡要至少放一格 '1'）。
//  22. 驚喜禮物盒 gift：關卡圖層 gift: ['0120…']（0–2 層；和木箱同一格時以木箱為準、gift 忽略；洞上忽略）。
//      g.cell().gift 為 0–2；>0 時這格沒有 tile、不能交換、像木箱一樣擋掉落（正下方靠斜向補位）、
//      不參與洗牌、不會被蜂蜜擴散，格子上的 lock 開局就清掉；雪可以壓在禮物盒底下（打開後格子的 tile 被消除時才融）。
//      a. 受傷同木箱：上下左右相鄰有配對（每一波最多 −1）、或在特殊道具範圍內（每一階段最多 −1）。
//         每少一層 {type:'obstacle', r, c, kind:'gift', left} ＋20。
//      b. 歸 0 就打開：同一階段原地生成特殊道具，這時才抽亂數 _ri(10)：0–2 pawH、3–5 pawV、6–8 bomb、9 perfume
//         （= 3:3:3:1）。事件 {type:'create', tile, r, c, from:'gift'}，打開 +60（加上最後一層的 +20）。
//         同一階段事件順序：clear → paint → create（配對做出的）→ obstacle → create（from:'gift'）。
//      c. 生成的道具不會自動發動；在「同一串」特殊道具連鎖裡也不會被後面的道具波及（不會一跑出來就被炸掉），
//         連鎖結束後照常掉落，之後被點、被交換、或下一步被波及才發動。慶祝時間會把它當成盤面道具發動。
//      d. 目標 {type:'clear', target:'gift'}：need＝禮物盒個數（不是層數），打開一個 done +1。
//      e. 熊寶寶出口格若是禮物盒，要先打開寶寶才回得了家。
//
// ─── 給關卡設計（E）的提醒 ───────────────────────────────────────────────
//   * 被毛線／蜂蜜鎖住的 tile 會擋住上方掉落；整排都被鎖（或蜂蜜擴散成一排）時，下方會暫時有空格補不到，
//     直到解鎖。蜂蜜最好放在下半部、成小塊，旁邊留可以斜滑補位的格子。
//   * 木箱正下方的格子只能靠左上／右上斜滑補位：不要讓木箱左右兩邊同時是洞或木箱。
//   * 熊寶寶出口是該欄最下面的非洞格；出口欄最下面若是木箱，要先打掉木箱寶寶才回得了家。
//   * 禮物盒和木箱一樣會擋掉落：不要讓禮物盒左右兩邊同時是洞、木箱或禮物盒；放在最上面一列時，正下方只能斜向補。
//   * 塗色關要至少有一格開局就上色（paint '1'），不然永遠塗不起來；洞不算格子，木箱／禮物盒格要先打掉才塗得到。
//   * 模擬器請用 createGame(level, { seed, events:false })：不產生事件，速度快約一倍。
//     參考：8×8 六色貪婪一局 25 步約 7ms；加雪／木箱／蜂蜜／毛線約 25ms（Node v24，M 系列 Mac）。

import { CHAPTERS } from '../config.js';

const SP = [null, 'pawH', 'pawV', 'bomb', 'perfume'];
const SP_CODE = { pawH: 1, pawV: 2, bomb: 3, perfume: 4 };
const PAW_H = 1, PAW_V = 2, BOMB = 3, PERF = 4;
const LOCK = [null, 'yarn', 'honey'];
const CAUSE = [null, 'paw', 'paw', 'bomb', 'perfume'];
// 虛擬發動類型（組合技、慶祝）
const A_CROSS = 10, A_CROSS3 = 11, A_BOMB5 = 12, A_ALL = 13;

export function createGame(level, opts = {}) {
  return new Game(level, opts);
}

class Game {
  constructor(level, opts) {
    if (opts === CLONE) return;
    const h = level.layout.length, w = level.layout[0].length;
    const N = w * h;
    this.level = level;
    this.w = w; this.h = h; this.N = N;
    this.items = opts.items || CHAPTERS[(level.chapter || 1) - 1].items.slice(0, level.colors || 6).map(i => i.id);
    this.K = this.items.length;
    this.ev = opts.events !== false;
    let s = (opts.seed == null ? 1 : opts.seed) | 0;
    this.rs = (s ^ 0x5bd1e995) | 0;

    this.hole = new Uint8Array(N);
    this.snow = new Uint8Array(N);
    this.crate = new Uint8Array(N);
    this.lock = new Uint8Array(N);
    this.paint = new Uint8Array(N);   // v1.2 蠟筆塗色 0|1
    this.gift = new Uint8Array(N);    // v1.2 驚喜禮物盒 0–2
    this.tId = new Int32Array(N);
    this.tItem = new Int8Array(N).fill(-1);
    this.tSpec = new Uint8Array(N);
    this.tBaby = new Uint8Array(N);
    this.mark = new Int32Array(N);
    this.stamp = 0;
    this.nextId = 1;

    for (let r = 0; r < h; r++) {
      const row = level.layout[r];
      for (let c = 0; c < w; c++) {
        const i = r * w + c;
        if (row[c] === '#') { this.hole[i] = 1; continue; }
        if (level.snow) this.snow[i] = +level.snow[r][c] || 0;
        if (level.crate) this.crate[i] = +level.crate[r][c] || 0;
        if (level.lock) { const ch = level.lock[r][c]; this.lock[i] = ch === 'y' ? 1 : ch === 'h' ? 2 : 0; }
        if (level.paint) this.paint[i] = (level.paint[r] || '')[c] === '1' ? 1 : 0;
        if (level.gift && !this.crate[i]) this.gift[i] = Math.min(2, +(level.gift[r] || '')[c] || 0);
      }
    }
    for (let i = 0; i < N; i++) if (this.hole[i] || this.crate[i] || this.gift[i]) this.lock[i] = 0;
    // v1.2 塗色：need＝非洞格子數；painted＝已上色格數（painted 為 0 的關卡永遠不會跑塗色邏輯）
    this.paintNeed = 0; this.painted = 0;
    for (let i = 0; i < N; i++) { if (this.hole[i]) this.paint[i] = 0; else this.paintNeed++; this.painted += this.paint[i]; }
    this.pmark = this.painted ? new Int32Array(N) : null;
    this.pstamp = 0;
    this._pc = null;
    // v1.2 禮物盒：giftLeft＝還沒打開的個數；giftFresh 記「這一串特殊道具發動中剛打開生成的道具」（不被同一串波及）
    this.giftLeft = 0;
    for (let i = 0; i < N; i++) if (this.gift[i]) this.giftLeft++;
    this.giftFresh = this.giftLeft ? new Int32Array(N) : null;
    this.chain = 0;

    // 出口：每欄最下面一個非洞格
    this.exitRow = new Int16Array(w).fill(-1);
    for (let c = 0; c < w; c++) for (let r = h - 1; r >= 0; r--) if (!this.hole[r * w + c]) { this.exitRow[c] = r; break; }
    this.isExit = new Uint8Array(w);
    const B = level.babies;
    this.babyTotal = B ? (B.total || 0) : 0;
    this.babyMax = B ? (B.onBoard || 1) : 0;
    this.babySpawned = 0;
    this.babyCount = 0;
    this.babiesHome = 0;
    if (this.babyTotal) for (const c of (level.exits || Array.from({ length: w }, (_, k) => k))) if (c >= 0 && c < w) this.isExit[c] = 1;

    this.movesLeft = level.moves;
    this.score = 0;
    this.status = 'playing';
    this.combo = 0;
    this.collected = new Int32Array(this.K);
    this.removed = { snow: 0, crate: 0, yarn: 0, honey: 0, gift: 0 };

    // 目標
    this.goalDefs = (level.goals || []).map(g => {
      const d = { type: g.type, item: g.item, target: g.target, need: g.need || 0, idx: -1 };
      if (g.type === 'collect') {
        d.idx = this.items.indexOf(g.item);
        if (d.idx < 0) throw new Error(`關卡 ${level.id} 的收集目標 ${g.item} 不在本關物件 ${this.items.join(',')} 之中（調整 colors）`);
      }
      if (g.type === 'baby' && !d.need) d.need = this.babyTotal;
      if (g.type === 'paint') d.need = this.paintNeed;
      return d;
    });

    // 盤面
    if (opts.board) this._loadBoard(opts.board);
    else {
      for (let tries = 0; tries < 200; tries++) {
        this._generate();
        if (this._hasMove()) break;
      }
    }
    this.goals = this._goalsSnapshot();
  }

  // ───────── RNG ─────────
  _rand() {
    let t = (this.rs = (this.rs + 0x6D2B79F5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  _ri(n) { return (this._rand() * n) | 0; }

  // ───────── 盤面建立 ─────────
  _playable(i) { return !this.hole[i] && !this.crate[i] && !this.gift[i]; }
  _wouldMatch(i, it) {
    const w = this.w, r = (i / w) | 0, c = i - r * w;
    if (c >= 2 && this._isItem(i - 1, it) && this._isItem(i - 2, it)) return true;
    if (r >= 2 && this._isItem(i - w, it) && this._isItem(i - 2 * w, it)) return true;
    return false;
  }
  _isItem(i, it) { return this.tId[i] > 0 && this.tSpec[i] === 0 && !this.tBaby[i] && this.tItem[i] === it; }
  _randomItemNoMatch(i) {
    const cand = [];
    for (let k = 0; k < this.K; k++) if (!this._wouldMatch(i, k)) cand.push(k);
    return cand.length ? cand[this._ri(cand.length)] : this._ri(this.K);
  }
  _put(i, item, spec, baby) {
    this.tId[i] = this.nextId++;
    this.tItem[i] = item; this.tSpec[i] = spec; this.tBaby[i] = baby ? 1 : 0;
    if (baby) this.babyCount++;
  }
  _empty(i) {
    if (this.tBaby[i]) this.babyCount--;
    this.tId[i] = 0; this.tItem[i] = -1; this.tSpec[i] = 0; this.tBaby[i] = 0;
  }
  _generate() {
    const N = this.N;
    this.babyCount = 0; this.babySpawned = 0;
    for (let i = 0; i < N; i++) {
      this.tId[i] = 0; this.tItem[i] = -1; this.tSpec[i] = 0; this.tBaby[i] = 0;
      if (!this._playable(i)) continue;
      this._put(i, this._randomItemNoMatch(i), 0, false);
    }
    const B = this.level.babies;
    if (B && B.start) for (const [r, c] of B.start) {
      if (this.babySpawned >= this.babyTotal) break;
      const i = r * this.w + c;
      if (r < 0 || r >= this.h || c < 0 || c >= this.w || !this._playable(i)) continue;
      this.tItem[i] = -1; this.tSpec[i] = 0; this.tBaby[i] = 1; this.babyCount++; this.lock[i] = 0;
      this.babySpawned++;
    }
  }
  _loadBoard(board) {
    const w = this.w;
    for (let r = 0; r < this.h; r++) for (let c = 0; c < w; c++) {
      const i = r * w + c, ch = (board[r] || '')[c] || ' ';
      if (!this._playable(i)) continue;
      if (ch >= '0' && ch <= '9') this._put(i, Math.min(+ch, this.K - 1), 0, false);
      else if (ch === 'H' || ch === 'V' || ch === 'B' || ch === 'P') this._put(i, -1, { H: PAW_H, V: PAW_V, B: BOMB, P: PERF }[ch], false);
      else if (ch === 'Y') { this._put(i, -1, 0, true); this.babySpawned++; this.lock[i] = 0; }
      else if (ch === '.') this._put(i, this._randomItemNoMatch(i), 0, false);
    }
  }

  // ───────── 唯讀查詢 ─────────
  cell(r, c) {
    const i = r * this.w + c;
    return {
      hole: !!this.hole[i], snow: this.snow[i], crate: this.crate[i], lock: LOCK[this.lock[i]],
      tile: this.tId[i] ? this._tileObj(i) : null,
      paint: this.paint[i], gift: this.gift[i],
    };
  }
  _tileObj(i) {
    return { id: this.tId[i], item: this.tItem[i] >= 0 ? this.items[this.tItem[i]] : null, special: SP[this.tSpec[i]], baby: !!this.tBaby[i] };
  }
  _rc(i) { const r = (i / this.w) | 0; return { r, c: i - r * this.w }; }
  _idx(p) {
    if (!p || p.r < 0 || p.c < 0 || p.r >= this.h || p.c >= this.w) return -1;
    return p.r * this.w + p.c;
  }
  toStrings() {
    const out = [];
    for (let r = 0; r < this.h; r++) {
      let s = '';
      for (let c = 0; c < this.w; c++) {
        const i = r * this.w + c;
        if (this.hole[i]) s += '#';
        else if (this.crate[i]) s += 'x';
        else if (this.gift[i]) s += 'g';
        else if (!this.tId[i]) s += ' ';
        else if (this.tBaby[i]) s += 'Y';
        else if (this.tSpec[i]) s += ' HVBP'[this.tSpec[i]];
        else s += this.tItem[i];
      }
      out.push(s);
    }
    return out;
  }
  /** 塗色層：'#' 洞、'1' 已上色、'0' 未上色 */
  paintStrings() {
    const out = [];
    for (let r = 0; r < this.h; r++) {
      let s = '';
      for (let c = 0; c < this.w; c++) { const i = r * this.w + c; s += this.hole[i] ? '#' : this.paint[i] ? '1' : '0'; }
      out.push(s);
    }
    return out;
  }

  // ───────── 目標 ─────────
  _remaining(target) {
    let n = 0;
    const N = this.N;
    if (target === 'snow') for (let i = 0; i < N; i++) n += this.snow[i];
    else if (target === 'crate') for (let i = 0; i < N; i++) n += this.crate[i];
    else if (target === 'yarn') for (let i = 0; i < N; i++) n += this.lock[i] === 1 ? 1 : 0;
    else if (target === 'honey') for (let i = 0; i < N; i++) n += this.lock[i] === 2 ? 1 : 0;
    else if (target === 'gift') n = this.giftLeft;
    return n;
  }
  _goalsSnapshot() {
    return this.goalDefs.map(d => {
      if (d.type === 'collect') return { type: 'collect', item: d.item, need: d.need, done: Math.min(d.need, this.collected[d.idx]) };
      if (d.type === 'clear') {
        const done = this.removed[d.target] || 0;
        return { type: 'clear', target: d.target, need: done + this._remaining(d.target), done };
      }
      if (d.type === 'baby') return { type: 'baby', need: d.need, done: Math.min(d.need, this.babiesHome) };
      if (d.type === 'paint') return { type: 'paint', need: this.paintNeed, done: this.painted };
      return { type: d.type, need: d.need || 0, done: 0 };
    });
  }
  _goalsDone() {
    for (const d of this.goalDefs) {
      if (d.type === 'collect' && this.collected[d.idx] < d.need) return false;
      if (d.type === 'clear' && this._remaining(d.target) > 0) return false;
      if (d.type === 'baby' && this.babiesHome < d.need) return false;
      if (d.type === 'paint' && this.painted < this.paintNeed) return false;
    }
    return true;
  }

  // ───────── 事件 ─────────
  _begin() { this.steps = []; this._cur = null; this.honeyCleared = 0; this._goalSig = this._goalKey(); this._lastScore = this.score; }
  _ph() { if (this.ev) { this._cur = []; this.steps.push(this._cur); } }
  _e(ev) { if (this.ev) { if (!this._cur) this._ph(); this._cur.push(ev); } }
  _goalKey() {
    let s = '';
    for (const d of this.goalDefs) {
      if (d.type === 'collect') s += Math.min(d.need, this.collected[d.idx]) + ',';
      else if (d.type === 'clear') s += (this.removed[d.target] || 0) + ':' + this._remaining(d.target) + ',';
      else if (d.type === 'baby') s += this.babiesHome + ',';
      else if (d.type === 'paint') s += this.painted + ',';
    }
    return s;
  }
  _flushInfo() {
    if (!this.ev) return;
    const k = this._goalKey();
    if (k !== this._goalSig) { this._goalSig = k; this.goals = this._goalsSnapshot(); this._e({ type: 'goals', goals: this.goals.map(g => ({ ...g })) }); }
    if (this.score !== this._lastScore) { this._lastScore = this.score; this._e({ type: 'score', score: this.score }); }
  }
  _finish() {
    this.goals = this._goalsSnapshot();
    const steps = this.ev ? this.steps.filter(p => p.length) : [];
    this.steps = null; this._cur = null;
    return steps;
  }

  // ───────── 合法性 ─────────
  _swappable(i) { return i >= 0 && this.tId[i] > 0 && this.lock[i] === 0; }
  _isNormal(i) { return this.tId[i] > 0 && this.tSpec[i] === 0 && !this.tBaby[i]; }
  _lineAt(i) {
    // i 處的普通 tile 是否在 3 連之中
    if (!this._isNormal(i)) return false;
    const w = this.w, it = this.tItem[i], r = (i / w) | 0, c = i - r * w;
    let n = 1;
    for (let k = c - 1; k >= 0 && this._isItem(r * w + k, it); k--) n++;
    for (let k = c + 1; k < w && this._isItem(r * w + k, it); k++) n++;
    if (n >= 3) return true;
    n = 1;
    for (let k = r - 1; k >= 0 && this._isItem(k * w + c, it); k--) n++;
    for (let k = r + 1; k < this.h && this._isItem(k * w + c, it); k++) n++;
    return n >= 3;
  }
  _swapRaw(i, j) {
    let t;
    t = this.tId[i]; this.tId[i] = this.tId[j]; this.tId[j] = t;
    t = this.tItem[i]; this.tItem[i] = this.tItem[j]; this.tItem[j] = t;
    t = this.tSpec[i]; this.tSpec[i] = this.tSpec[j]; this.tSpec[j] = t;
    t = this.tBaby[i]; this.tBaby[i] = this.tBaby[j]; this.tBaby[j] = t;
  }
  _swapValid(i, j) {
    if (!this._swappable(i) || !this._swappable(j)) return false;
    if (this.tSpec[i] || this.tSpec[j]) return true;
    if (this.tBaby[i] && this.tBaby[j]) return false;
    this._swapRaw(i, j);
    const ok = this._lineAt(i) || this._lineAt(j);
    this._swapRaw(i, j);
    return ok;
  }
  _hasMove() {
    const w = this.w, h = this.h;
    for (let i = 0; i < this.N; i++) {
      if (!this._swappable(i)) continue;
      if (this.tSpec[i]) return true;
      const c = i % w;
      if (c + 1 < w && this._swapValid(i, i + 1)) return true;
      if (i + w < w * h && this._swapValid(i, i + w)) return true;
    }
    return false;
  }
  listMoves() {
    const out = [], w = this.w;
    if (this.status !== 'playing') return out;
    for (let i = 0; i < this.N; i++) {
      if (!this._swappable(i)) continue;
      const p = this._rc(i);
      if (this.tSpec[i]) out.push({ kind: 'tap', p });
      if (p.c + 1 < w && this._swapValid(i, i + 1)) out.push({ kind: 'swap', a: p, b: { r: p.r, c: p.c + 1 } });
      if (p.r + 1 < this.h && this._swapValid(i, i + w)) out.push({ kind: 'swap', a: p, b: { r: p.r + 1, c: p.c } });
    }
    return out;
  }
  findHint() {
    if (this.status !== 'playing') return null;
    let best = null, bestS = -1;
    const w = this.w;
    const evalSwap = (i, j) => {
      if (!this._swapValid(i, j)) return;
      let s;
      if (this.tSpec[i] && this.tSpec[j]) s = 100;
      else if (this.tSpec[i] || this.tSpec[j]) s = 50;
      else {
        this._swapRaw(i, j);
        s = Math.max(this._shapeScore(i), this._shapeScore(j));
        this._swapRaw(i, j);
      }
      if (s > bestS) { bestS = s; best = { a: this._rc(i), b: this._rc(j) }; }
    };
    for (let i = 0; i < this.N; i++) {
      const c = i % w;
      if (c + 1 < w) evalSwap(i, i + 1);
      if (i + w < this.N) evalSwap(i, i + w);
    }
    return best;
  }
  _shapeScore(i) {
    if (!this._isNormal(i)) return 0;
    const w = this.w, it = this.tItem[i], r = (i / w) | 0, c = i - r * w;
    let hN = 1, vN = 1;
    for (let k = c - 1; k >= 0 && this._isItem(r * w + k, it); k--) hN++;
    for (let k = c + 1; k < w && this._isItem(r * w + k, it); k++) hN++;
    for (let k = r - 1; k >= 0 && this._isItem(k * w + c, it); k--) vN++;
    for (let k = r + 1; k < this.h && this._isItem(k * w + c, it); k++) vN++;
    const m = Math.max(hN, vN);
    if (m >= 5) return 40;
    if (hN >= 3 && vN >= 3) return 30;
    if (m === 4) return 20;
    if (m === 3) return 3;
    return 0;
  }

  // ───────── 動作 ─────────
  trySwap(a, b) {
    const i = this._idx(a), j = this._idx(b);
    if (this.status !== 'playing' || i < 0 || j < 0) return { ok: false, steps: [] };
    const adj = Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
    if (!adj || !this._swappable(i) || !this._swappable(j)) return { ok: false, steps: [] };
    const A = { r: a.r, c: a.c }, Bp = { r: b.r, c: b.c };
    const si = this.tSpec[i], sj = this.tSpec[j];
    if (!si && !sj) {
      if (this.tBaby[i] && this.tBaby[j]) return { ok: false, steps: this.ev ? [[{ type: 'swap', a: A, b: Bp }], [{ type: 'swapBack', a: A, b: Bp }]] : [] };
      this._swapRaw(i, j);
      if (!this._lineAt(i) && !this._lineAt(j)) {
        this._swapRaw(i, j);
        return { ok: false, steps: this.ev ? [[{ type: 'swap', a: A, b: Bp }], [{ type: 'swapBack', a: A, b: Bp }]] : [] };
      }
      this._begin();
      this._e({ type: 'swap', a: A, b: Bp });
      this.movesLeft--;
      this._resolve(null, [j, i]);
      return { ok: true, steps: this._finish() };
    }
    this._begin();
    this._e({ type: 'swap', a: A, b: Bp });
    this._swapRaw(i, j);
    this.movesLeft--;
    // 交換後：原 i 的東西在 j、原 j 的東西在 i
    if (si && sj) this._combo(j, i, si, sj);
    else {
      const spPos = si ? j : i, otherPos = si ? i : j, sp = si || sj;
      let item = -1;
      if (sp === PERF && this._isNormal(otherPos)) item = this.tItem[otherPos];
      this._resolve([{ i: spPos, t: sp, item, own: true }], null);
    }
    return { ok: true, steps: this._finish() };
  }

  tapSpecial(p) {
    const i = this._idx(p);
    if (this.status !== 'playing' || i < 0 || !this._swappable(i) || !this.tSpec[i]) return { ok: false, steps: [] };
    this._begin();
    this.movesLeft--;
    this._resolve([{ i, t: this.tSpec[i], item: -1, own: true }], null);
    return { ok: true, steps: this._finish() };
  }

  starsFor(score) {
    if (this.status !== 'won') return 0;
    const st = this.level.stars || [Infinity, Infinity];
    return 1 + (score >= st[0] ? 1 : 0) + (score >= st[1] ? 1 : 0);
  }

  clone() {
    const g = new Game(null, CLONE);
    for (const k of Object.keys(this)) {
      const v = this[k];
      if (ArrayBuffer.isView(v)) g[k] = v.slice();
      else g[k] = v;
    }
    g.removed = { ...this.removed };
    g.goals = this.goals.map(x => ({ ...x }));
    g.steps = null; g._cur = null; g._pc = null;
    return g;
  }

  celebrate() {
    if (this.status !== 'won') return [];
    this._begin();
    // 1) 盤面現有的特殊道具逐一發動
    for (let guard = 0; guard < 200; guard++) {
      let found = -1;
      for (let i = 0; i < this.N; i++) if (this.tId[i] && this.tSpec[i] && !this.lock[i]) { found = i; break; }
      if (found < 0) break;
      this._ph();
      this._resolve([{ i: found, t: this.tSpec[found], item: -1, own: true }], null, true);
    }
    // 2) 剩餘步數變熊掌
    while (this.movesLeft > 0) {
      const cand = [];
      for (let i = 0; i < this.N; i++) if (this._isNormal(i) && !this.lock[i]) cand.push(i);
      if (!cand.length) break;
      this.movesLeft--;
      const i = cand[this._ri(cand.length)];
      const t = this._rand() < 0.5 ? PAW_H : PAW_V;
      this._ph();
      if (this.ev) {
        const { r, c } = this._rc(i);
        this._e({ type: 'transform', tiles: [{ id: this.tId[i], r, c, special: SP[t] }] });
      }
      this.tItem[i] = -1; this.tSpec[i] = t;
      this._ph();
      this._resolve([{ i, t, item: -1, own: true, cause: 'celebrate' }], null, true);
    }
    this.movesLeft = 0;
    this._ph();
    this._e({ type: 'end', status: 'won' });
    return this._finish();
  }

  // ───────── 核心結算 ─────────
  // acts：一開始要發動的特殊道具（玩家點／交換）；prefer：玩家交換的兩格（第 1 波生成特殊道具的優先位置）
  _resolve(acts, prefer, celebrating = false) {
    let wave = 0;
    if (acts && acts.length) {
      wave = 1;
      this._activate(acts, 1);
      this._settle();
    }
    for (let guard = 0; guard < 100; guard++) {
      const groups = this._findGroups();
      if (!groups.length) break;
      wave++;
      this._clearMatches(groups, wave === 1 ? prefer : null, 1 + 0.5 * (wave - 1));
      this._settle();
    }
    this.combo = wave;
    if (celebrating) return;
    this._postMove();
  }

  _postMove() {
    this._ph();
    if (this._goalsDone()) {
      this.status = 'won';
      this._flushInfo();
      this._e({ type: 'end', status: 'won' });
      return;
    }
    // 蜂蜜擴散
    if (this.honeyCleared === 0) {
      let hasHoney = false;
      for (let i = 0; i < this.N; i++) if (this.lock[i] === 2) { hasHoney = true; break; }
      if (hasHoney) {
        const cand = [], w = this.w;
        for (let i = 0; i < this.N; i++) {
          if (!this._isNormal(i) || this.lock[i]) continue;
          const r = (i / w) | 0, c = i - r * w;
          if ((c > 0 && this.lock[i - 1] === 2) || (c < w - 1 && this.lock[i + 1] === 2) ||
              (r > 0 && this.lock[i - w] === 2) || (r < this.h - 1 && this.lock[i + w] === 2)) cand.push(i);
        }
        if (cand.length) {
          const i = cand[this._ri(cand.length)];
          this.lock[i] = 2;
          if (this.ev) this._e({ type: 'honeySpread', ...this._rc(i) });
        }
      }
    }
    this._flushInfo();
    if (this.movesLeft <= 0) {
      this.status = 'lost';
      this._e({ type: 'end', status: 'lost' });
      return;
    }
    if (!this._hasMove()) this._shuffle();
  }

  _shuffle() {
    const pos = [];
    for (let i = 0; i < this.N; i++) if (this._isNormal(i) && !this.lock[i]) pos.push(i);
    if (pos.length < 2) return;
    const ids = pos.map(i => this.tId[i]), its = pos.map(i => this.tItem[i]);
    const order = pos.map((_, k) => k);
    let ok = false;
    for (let t = 0; t < 300 && !ok; t++) {
      for (let k = order.length - 1; k > 0; k--) { const m = this._ri(k + 1); const x = order[k]; order[k] = order[m]; order[m] = x; }
      for (let k = 0; k < pos.length; k++) { this.tId[pos[k]] = ids[order[k]]; this.tItem[pos[k]] = its[order[k]]; }
      ok = !this._anyMatch() && this._hasMove();
    }
    if (!ok) {
      // 退而求其次：重新給物件種類（保留 id）
      for (let t = 0; t < 300 && !ok; t++) {
        for (const i of pos) this.tItem[i] = -1;
        for (const i of pos) this.tItem[i] = this._randomItemNoMatch(i);
        ok = !this._anyMatch() && this._hasMove();
      }
    }
    if (this.ev) {
      this._ph();
      this._e({ type: 'shuffle', moves: pos.map(i => ({ id: this.tId[i], to: this._rc(i), item: this.items[this.tItem[i]] })) });
    }
  }
  _anyMatch() {
    for (let i = 0; i < this.N; i++) if (this._lineAt(i)) return true;
    return false;
  }

  // 找出所有配對組（相交的連線合併成一組）
  _findGroups() {
    const w = this.w, h = this.h, runs = [];
    for (let r = 0; r < h; r++) {
      let c = 0;
      while (c < w) {
        const i = r * w + c;
        if (!this._isNormal(i)) { c++; continue; }
        const it = this.tItem[i];
        let e = c + 1;
        while (e < w && this._isItem(r * w + e, it)) e++;
        if (e - c >= 3) { const cells = []; for (let k = c; k < e; k++) cells.push(r * w + k); runs.push({ cells, dir: 'h' }); }
        c = e;
      }
    }
    for (let c = 0; c < w; c++) {
      let r = 0;
      while (r < h) {
        const i = r * w + c;
        if (!this._isNormal(i)) { r++; continue; }
        const it = this.tItem[i];
        let e = r + 1;
        while (e < h && this._isItem(e * w + c, it)) e++;
        if (e - r >= 3) { const cells = []; for (let k = r; k < e; k++) cells.push(k * w + c); runs.push({ cells, dir: 'v' }); }
        r = e;
      }
    }
    if (!runs.length) return runs;
    // 合併共用格子的連線
    const parent = runs.map((_, k) => k);
    const find = x => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
    const owner = new Map();
    runs.forEach((run, k) => {
      for (const i of run.cells) {
        if (owner.has(i)) { const a = find(owner.get(i)), b = find(k); if (a !== b) parent[a] = b; }
        else owner.set(i, k);
      }
    });
    const gm = new Map();
    runs.forEach((run, k) => {
      const root = find(k);
      if (!gm.has(root)) gm.set(root, { runs: [], cells: new Set() });
      const g = gm.get(root);
      g.runs.push(run);
      for (const i of run.cells) g.cells.add(i);
    });
    return [...gm.values()];
  }

  _clearMatches(groups, prefer, mult) {
    const ev = this.ev, w = this.w;
    this._ph();
    if (ev) this._e({ type: 'match', groups: groups.map(g => [...g.cells].map(i => this._rc(i))) });
    const st = ++this.stamp;
    const clearSet = new Set();
    const creates = [];
    const cleared = [];
    const obst = [];
    const toPaint = this.painted > 0 ? [] : null;   // v1.2 塗色
    let opened = null;                               // v1.2 這一波打開的禮物盒
    for (const g of groups) {
      const gClear = [];
      let gPaint = false;
      for (const i of g.cells) {
        if (toPaint !== null && this.paint[i]) gPaint = true;   // 消除前組內任一格已上色（含被鎖的格子）
        if (this.lock[i]) this._unlock(i, obst);
        else { clearSet.add(i); gClear.push(i); }
      }
      if (gPaint) for (const i of gClear) toPaint.push(i);       // 只有 tile 被消除的格子上色
      // 相鄰的木箱與 lock
      for (const i of g.cells) {
        const r = (i / w) | 0, c = i - r * w;
        const nb = [];
        if (c > 0) nb.push(i - 1); if (c < w - 1) nb.push(i + 1);
        if (r > 0) nb.push(i - w); if (r < this.h - 1) nb.push(i + w);
        for (const k of nb) {
          if (g.cells.has(k) || this.hole[k]) continue;
          if (this.crate[k] && this.mark[k] !== st) { this.mark[k] = st; this._hitCrate(k, obst); }
          else if (this.gift[k]) { if (this.mark[k] !== st) { this.mark[k] = st; this._hitGift(k, obst, opened || (opened = [])); } }
          else if (this.lock[k] && this.tId[k]) this._unlock(k, obst);
        }
      }
      // 特殊道具
      let maxLen = 0, maxRun = null, hasH = false, hasV = false;
      for (const run of g.runs) {
        if (run.cells.length > maxLen) { maxLen = run.cells.length; maxRun = run; }
        if (run.dir === 'h') hasH = true; else hasV = true;
      }
      let kind = 0, pos = -1;
      if (maxLen >= 5) { kind = PERF; pos = maxRun.cells[maxLen >> 1]; }
      else if (hasH && hasV) {
        kind = BOMB;
        const hs = new Set(); for (const run of g.runs) if (run.dir === 'h') for (const i of run.cells) hs.add(i);
        for (const run of g.runs) if (run.dir === 'v') for (const i of run.cells) if (hs.has(i) && pos < 0) pos = i;
      } else if (maxLen === 4) { kind = maxRun.dir === 'h' ? PAW_H : PAW_V; pos = maxRun.cells[2]; }
      if (kind) {
        if (prefer) { if (g.cells.has(prefer[0])) pos = prefer[0]; else if (g.cells.has(prefer[1])) pos = prefer[1]; }
        if (!gClear.includes(pos)) pos = gClear.length ? gClear[gClear.length >> 1] : -1;
        if (pos >= 0) creates.push({ pos, kind });
      }
    }
    // 消除
    for (const i of clearSet) this._clearTile(i, 'match', cleared, obst);
    let gain = cleared.length * 20 * mult;
    const createEv = [];
    for (const cr of creates) {
      this._put(cr.pos, -1, cr.kind, false);
      gain += 60;
      if (ev) createEv.push({ type: 'create', tile: this._tileObj(cr.pos), ...this._rc(cr.pos) });
    }
    gain += obst.length * 20;
    let painted = null, giftEv = null;
    if (toPaint !== null && toPaint.length) { painted = this._paintCells(toPaint, -1); gain += painted.length * 20; }
    if (opened !== null) { giftEv = this._openGifts(opened, 0); gain += opened.length * 60; }
    this.score += Math.round(gain);
    if (ev) {
      this._e({ type: 'clear', tiles: cleared, wave: Math.round((mult - 1) * 2) + 1, scoreGain: Math.round(gain) });
      if (painted !== null && painted.length) this._e({ type: 'paint', cells: painted.map(i => this._rc(i)) });
      for (const e of createEv) this._e(e);
      for (const o of obst) this._e(o);
      if (giftEv !== null) for (const e of giftEv) this._e(e);
    }
    this._flushInfo();
  }

  // v1.2 塗色：list 中（tile 已被消除的）格子上色；pst>=0 時只塗 pmark===pst 的格子。回傳新上色的格子
  _paintCells(list, pst) {
    const out = [];
    for (const i of list) {
      if (this.paint[i] || (pst >= 0 && this.pmark[i] !== pst)) continue;
      this.paint[i] = 1; this.painted++; out.push(i);
    }
    return out;
  }
  // v1.2 禮物盒少一層；歸 0 時記到 opened（打開與生成道具由 _openGifts 處理）
  _hitGift(i, obst, opened) {
    this.gift[i]--;
    obst.push(this.ev ? { type: 'obstacle', ...this._rc(i), kind: 'gift', left: this.gift[i] } : 1);
    if (!this.gift[i]) { this.giftLeft--; this.removed.gift++; opened.push(i); }
  }
  // v1.2 打開禮物盒：原地生成特殊道具（pawH 3 : pawV 3 : bomb 3 : perfume 1，這裡才抽亂數）。chain>0 時這一串發動中不會被波及
  _openGifts(opened, chain) {
    const evs = this.ev ? [] : null;
    for (const i of opened) {
      const x = this._ri(10);
      const kind = x < 3 ? PAW_H : x < 6 ? PAW_V : x < 9 ? BOMB : PERF;
      this._put(i, -1, kind, false);
      if (chain) this.giftFresh[i] = chain;
      if (evs !== null) evs.push({ type: 'create', tile: this._tileObj(i), ...this._rc(i), from: 'gift' });
    }
    return evs;
  }

  // 消除 i 的 tile（普通或已被觸發的特殊道具）並處理雪、收集
  _clearTile(i, cause, cleared, obst) {
    if (!this.tId[i]) return;
    if (this._pc !== null) this._pc.push(i);
    if (this.ev) { const { r, c } = this._rc(i); cleared.push({ id: this.tId[i], r, c, item: this.tItem[i] >= 0 ? this.items[this.tItem[i]] : null, special: SP[this.tSpec[i]], cause }); }
    else cleared.push(i);
    if (this.tItem[i] >= 0 && !this.tSpec[i]) this.collected[this.tItem[i]]++;
    this._empty(i);
    if (this.snow[i]) {
      this.snow[i]--; this.removed.snow++;
      obst.push(this.ev ? { type: 'obstacle', ...this._rc(i), kind: 'snow', left: this.snow[i] } : 1);
    }
  }
  _hitCrate(i, obst) {
    this.crate[i]--; this.removed.crate++;
    obst.push(this.ev ? { type: 'obstacle', ...this._rc(i), kind: 'crate', left: this.crate[i] } : 1);
  }
  _unlock(i, obst) {
    const k = this.lock[i];
    if (!k) return;
    this.lock[i] = 0;
    if (k === 2) { this.removed.honey++; this.honeyCleared++; } else this.removed.yarn++;
    obst.push(this.ev ? { type: 'obstacle', ...this._rc(i), kind: LOCK[k], left: 0 } : 1);
  }

  _mostCommon() {
    const cnt = new Int32Array(this.K);
    for (let i = 0; i < this.N; i++) if (this._isNormal(i)) cnt[this.tItem[i]]++;
    let best = -1, bc = 0;
    for (let k = 0; k < this.K; k++) if (cnt[k] > bc) { bc = cnt[k]; best = k; }
    return best;
  }

  _area(a) {
    const w = this.w, h = this.h, { r, c } = this._rc(a.i), out = [];
    const add = (rr, cc) => { if (rr >= 0 && rr < h && cc >= 0 && cc < w) { const k = rr * w + cc; if (!this.hole[k] && k !== a.i) out.push(k); } };
    switch (a.t) {
      case PAW_H: for (let k = 0; k < w; k++) add(r, k); break;
      case PAW_V: for (let k = 0; k < h; k++) add(k, c); break;
      case BOMB: for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc); break;
      case PERF: {
        let it = a.item;
        if (it == null || it < 0) it = this._mostCommon();
        a.item = it;
        if (it >= 0) for (let k = 0; k < this.N; k++) if (this._isItem(k, it)) out.push(k);
        break;
      }
      case A_CROSS: for (let k = 0; k < w; k++) add(r, k); for (let k = 0; k < h; k++) if (k !== r) add(k, c); break;
      case A_CROSS3: {
        const s = new Set();
        for (let d = -1; d <= 1; d++) { for (let k = 0; k < w; k++) if (r + d >= 0 && r + d < h) s.add((r + d) * w + k); for (let k = 0; k < h; k++) if (c + d >= 0 && c + d < w) s.add(k * w + c + d); }
        for (const k of s) if (!this.hole[k] && k !== a.i) out.push(k);
        break;
      }
      case A_BOMB5: for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) add(r + dr, c + dc); break;
      case A_ALL: for (let k = 0; k < this.N; k++) if (!this.hole[k] && k !== a.i) out.push(k); break;
    }
    return out;
  }

  // 依「世代」發動特殊道具：每一代一個階段，被波及的特殊道具在下一代發動
  _activate(acts, mult) {
    const ev = this.ev;
    const chain = ++this.chain;
    const painting = this.painted > 0;
    let gen = acts;
    for (let guard = 0; gen.length && guard < 60; guard++) {
      this._ph();
      const st = ++this.stamp;
      const next = [], cleared = [], obst = [];
      let opened = null, pst = -1;
      if (painting) { this._pc = []; pst = ++this.pstamp; }
      // 先移除這一代自己的 tile（玩家發動的）
      for (const a of gen) {
        if (a.own && this.tId[a.i]) {
          this.mark[a.i] = st;
          this._clearTile(a.i, a.cause || CAUSE[a.t] || 'combo', cleared, obst);
        }
      }
      for (const a of gen) {
        const area = this._area(a);
        const cause = a.cause || CAUSE[a.t] || 'combo';
        // 塗色：道具所在格（發動當下）已上色，或組合技帶 paint 旗標 → 範圍內被消除的格子都上色
        if (painting && (a.paint || this.paint[a.i])) { this.pmark[a.i] = pst; for (const k of area) this.pmark[k] = pst; }
        if (ev) {
          const { r, c } = this._rc(a.i);
          if (a.t <= PERF) {
            const e = { type: 'activate', special: SP[a.t], r, c, area: area.map(k => this._rc(k)) };
            if (a.t === PAW_H) e.dir = 'h'; else if (a.t === PAW_V) e.dir = 'v';
            if (a.t === PERF && a.item >= 0) e.item = this.items[a.item];
            this._e(e);
          }
        }
        for (const k of area) {
          if (this.mark[k] === st) continue;
          this.mark[k] = st;
          if (this.crate[k]) { this._hitCrate(k, obst); continue; }
          if (this.gift[k]) { this._hitGift(k, obst, opened || (opened = [])); continue; }
          if (!this.tId[k] || this.tBaby[k]) continue;
          if (this.giftFresh !== null && this.giftFresh[k] === chain) continue;   // 剛從禮物盒跑出來的道具
          if (this.lock[k]) { this._unlock(k, obst); continue; }
          if (this.tSpec[k]) {
            const t = this.tSpec[k];
            next.push({ i: k, t, item: -1 });
            this._clearTile(k, cause, cleared, obst);
            continue;
          }
          this._clearTile(k, cause, cleared, obst);
        }
      }
      let painted = null, giftEv = null, extra = 0;
      if (painting) { painted = this._paintCells(this._pc, pst); this._pc = null; extra += painted.length * 20; }
      if (opened !== null) { giftEv = this._openGifts(opened, chain); extra += opened.length * 60; }
      const gain = Math.round(cleared.length * 20 * mult + obst.length * 20) + extra;
      this.score += gain;
      if (ev) {
        this._e({ type: 'clear', tiles: cleared, wave: Math.round((mult - 1) * 2) + 1, scoreGain: gain });
        if (painted !== null && painted.length) this._e({ type: 'paint', cells: painted.map(i => this._rc(i)) });
        for (const o of obst) this._e(o);
        if (giftEv !== null) for (const e of giftEv) this._e(e);
      }
      this._flushInfo();
      gen = next;
    }
  }

  // 兩個特殊道具交換。pos＝組合位置 b；other＝a；ta 是原本在 a 的（現在在 b），tb 是原本在 b 的（現在在 a）
  _combo(pos, other, ta, tb) {
    const ev = this.ev;
    const isPaw = t => t === PAW_H || t === PAW_V;
    const { r, c } = this._rc(pos);
    let kind;
    if (isPaw(ta) && isPaw(tb)) kind = 'pawPaw';
    else if ((isPaw(ta) && tb === BOMB) || (ta === BOMB && isPaw(tb))) kind = 'pawBomb';
    else if (ta === BOMB && tb === BOMB) kind = 'bombBomb';
    else if (ta === PERF && tb === PERF) kind = 'perfumePerfume';
    else if (ta === PERF || tb === PERF) kind = (isPaw(ta) || isPaw(tb)) ? 'perfumePaw' : 'perfumeBomb';
    this._ph();
    if (ev) this._e({ type: 'combo', kind, r, c });
    // 塗色：兩個道具任一個在上色格 → 整個組合技都算上色
    const cp = this.painted > 0 && !!(this.paint[pos] || this.paint[other]);
    const paintBoth = () => (cp ? this._paintCells([other, pos], -1) : null);
    // 兩個特殊道具都先消耗掉
    const cleared = [], obst = [];
    this._clearTile(other, 'combo', cleared, obst);
    if (kind === 'perfumePaw' || kind === 'perfumeBomb') {
      const partner = ta === PERF ? tb : ta; // 熊掌或炸彈
      this._clearTile(pos, 'combo', cleared, obst);
      const pc = paintBoth();
      const it = this._mostCommon();
      const tf = [], acts = [{ i: pos, t: partner, item: -1, own: false, paint: cp }];
      if (it >= 0) {
        if (ev) this._e({ type: 'activate', special: 'perfume', r, c, area: [], item: this.items[it] });
        for (let k = 0; k < this.N; k++) {
          if (!this._isItem(k, it)) continue;
          if (this.lock[k]) { this._unlock(k, obst); continue; }
          const t = partner === BOMB ? BOMB : (this._rand() < 0.5 ? PAW_H : PAW_V);
          this.collected[it]++;
          this.tItem[k] = -1; this.tSpec[k] = t;
          if (ev) tf.push({ id: this.tId[k], ...this._rc(k), special: SP[t] });
          acts.push({ i: k, t, item: -1, own: true, cause: 'combo', paint: cp });
        }
      }
      // perfume 的 area 給畫面：被變身的格子
      if (ev && it >= 0 && this._cur) {
        const act = this._cur.find(e => e.type === 'activate' && e.special === 'perfume');
        if (act) act.area = tf.map(t => ({ r: t.r, c: t.c }));
      }
      const gain = Math.round(obst.length * 20) + (pc ? pc.length * 20 : 0);
      this.score += gain;
      if (ev) {
        this._e({ type: 'clear', tiles: cleared, wave: 1, scoreGain: gain });
        if (pc && pc.length) this._e({ type: 'paint', cells: pc.map(i => this._rc(i)) });
        if (tf.length) this._e({ type: 'transform', tiles: tf });
        for (const o of obst) this._e(o);
      }
      this._flushInfo();
      // 原本的熊掌／炸彈在 b 發動（tile 已消耗，own:false），變身的一起發動
      this._resolve(acts, null);
      return;
    }
    this._clearTile(pos, 'combo', cleared, obst);
    const pc = paintBoth();
    const gain = Math.round(obst.length * 20) + (pc ? pc.length * 20 : 0);
    this.score += gain;
    if (ev) {
      this._e({ type: 'clear', tiles: cleared, wave: 1, scoreGain: gain });
      if (pc && pc.length) this._e({ type: 'paint', cells: pc.map(i => this._rc(i)) });
      for (const o of obst) this._e(o);
    }
    const t = kind === 'pawPaw' ? A_CROSS : kind === 'pawBomb' ? A_CROSS3 : kind === 'bombBomb' ? A_BOMB5 : A_ALL;
    this._resolve([{ i: pos, t, item: -1, own: false, cause: 'combo', paint: cp }], null);
  }

  // 掉落＋熊寶寶回家，直到穩定
  _settle() {
    for (let guard = 0; guard < 50; guard++) {
      this._gravity();
      if (!this._babiesHome()) break;
    }
  }
  _babiesHome() {
    if (!this.babyTotal) return false;
    let any = false;
    for (let c = 0; c < this.w; c++) {
      if (!this.isExit[c] || this.exitRow[c] < 0) continue;
      const i = this.exitRow[c] * this.w + c;
      if (this.tId[i] && this.tBaby[i]) {
        if (!any) this._ph();
        any = true;
        const id = this.tId[i];
        this._empty(i);
        this.babiesHome++;
        this.score += 500;
        if (this.ev) this._e({ type: 'babyHome', id, ...this._rc(i) });
      }
    }
    if (any) this._flushInfo();
    return any;
  }

  _gravity() {
    const w = this.w, h = this.h, ev = this.ev;
    const moved = ev ? new Map() : null;   // id → { from, to }
    const spawned = ev ? new Map() : null; // id → { fromRow, to }
    const spawnCount = new Int32Array(w);
    let any = false;
    const move = (k, i) => {
      if (ev) {
        const id = this.tId[k];
        if (spawned.has(id)) spawned.get(id).to = i;
        else if (moved.has(id)) moved.get(id).to = i;
        else moved.set(id, { from: k, to: i });
      }
      this.tId[i] = this.tId[k]; this.tItem[i] = this.tItem[k]; this.tSpec[i] = this.tSpec[k]; this.tBaby[i] = this.tBaby[k];
      this.tId[k] = 0; this.tItem[k] = -1; this.tSpec[k] = 0; this.tBaby[k] = 0;
    };
    const spawn = (i, c) => {
      const wantBaby = this.babySpawned < this.babyTotal && this.babyCount < this.babyMax;
      if (wantBaby) { this._put(i, -1, 0, true); this.babySpawned++; }
      else this._put(i, this._ri(this.K), 0, false);
      spawnCount[c]++;
      if (ev) spawned.set(this.tId[i], { fromRow: -spawnCount[c], to: i });
    };
    for (let guard = 0; guard < this.N * 4; guard++) {
      let changed = false;
      // 垂直
      for (let c = 0; c < w; c++) {
        for (let r = h - 1; r >= 0; r--) {
          const i = r * w + c;
          if (this.tId[i] || this.hole[i] || this.crate[i] || this.gift[i]) continue;
          let found = -1, blocked = false;
          for (let r2 = r - 1; r2 >= 0; r2--) {
            const k = r2 * w + c;
            if (this.hole[k]) continue;
            if (this.crate[k] || this.gift[k] || (this.tId[k] && this.lock[k])) { blocked = true; break; }
            if (this.tId[k]) { found = k; break; }
          }
          if (found >= 0) { move(found, i); changed = true; }
          else if (!blocked) { spawn(i, c); changed = true; }
        }
      }
      if (changed) { any = true; continue; }
      // 斜向（由下往上，找一個就回到垂直）
      let diag = false;
      for (let r = h - 1; r >= 1 && !diag; r--) {
        for (let c = 0; c < w && !diag; c++) {
          const i = r * w + c;
          if (this.tId[i] || this.hole[i] || this.crate[i] || this.gift[i]) continue;
          for (const dc of [-1, 1]) {
            const cc = c + dc;
            if (cc < 0 || cc >= w) continue;
            const k = (r - 1) * w + cc;
            if (this.hole[k] || this.crate[k] || !this.tId[k] || this.lock[k]) continue;
            move(k, i); diag = true; break;
          }
        }
      }
      if (!diag) break;
      any = true;
    }
    if (any && ev) {
      this._ph();
      const moves = [], spawns = [];
      for (const [id, m] of moved) if (m.from !== m.to) moves.push({ id, from: this._rc(m.from), to: this._rc(m.to) });
      for (const [id, s] of spawned) spawns.push({ tile: this._tileObj(s.to), to: this._rc(s.to), fromRow: s.fromRow });
      this._e({ type: 'fall', moves, spawns });
    }
    return any;
  }
}

const CLONE = Symbol('clone');
