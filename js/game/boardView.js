// 棋盤畫面（C 擁有）：canvas 繪製、操作、依引擎 steps 播放動畫。
// 座標：sprite 的 x、y 以「格」為單位（x＝欄、y＝列，可為小數），畫的時候才換成像素。
import { tileSVG, specialSVG, babySVG, snowSVG, crateSVG, lockSVG, exitSVG, ITEM_COLORS } from '../art/tiles.js';
import { sprite, whenReady } from './sprites.js';
import { FX, roundRect } from './fx.js';

const DPR_MAX = 2.5;
const TILE_SCALE = 0.9;       // tile 圖佔格子的比例
const PAD = 6;                // 棋盤內距（CSS px）

const ease = {
  linear: t => t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inQuad: t => t * t,
  inOutQuad: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outCubic: t => 1 - Math.pow(1 - t, 3),
};

// 選取光暈（只產生一次）
let glowCanvas = null;
function glowSprite() {
  if (glowCanvas) return glowCanvas;
  glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 96;
  const x = glowCanvas.getContext('2d');
  const g = x.createRadialGradient(48, 48, 0, 48, 48, 48);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(.42, 'rgba(255,255,255,.85)');
  g.addColorStop(.7, 'rgba(255,214,120,.5)');
  g.addColorStop(1, 'rgba(255,214,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 96, 96);
  return glowCanvas;
}

export class BoardView {
  /**
   * @param {HTMLElement} host  放 canvas 的容器（寬度由 CSS 決定）
   * @param {object} opts { theme, perfumeColor, hooks:{ onEvent(ev), onAction(kind,res), onSettled(res), onSelect(), onDenied() } }
   */
  constructor(host, opts) {
    this.host = host;
    this.theme = opts.theme;
    this.perfumeColor = opts.perfumeColor || '#FF9EB5';
    this.hooks = opts.hooks || {};
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'g-canvas';
    host.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.fx = new FX();
    this.sprites = new Map();
    this.tweens = [];
    this.grid = [];
    this.cells = [];
    this.busy = true;           // 開始前不能操作
    this.inputEnabled = false;
    this.timeScale = 1;
    this.instant = false;
    this.sel = null;
    this.hint = null;
    this.lastInput = performance.now();
    this.shakeT = 0; this.shakeMag = 0;
    this.frames = 0; this.fpsT0 = performance.now(); this.fps = 0; this.fpsLog = [];
    this.destroyed = false;
    this.cell = 40; this.dpr = 1;
    this._bindInput();
    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(host);
    this._last = performance.now();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  // ---------------- 狀態同步 ----------------
  attach(g, exits = []) {
    this.g = g;
    this.w = g.w; this.h = g.h;
    this.exits = new Set(exits);
    this.sprites.clear();
    this.grid = new Array(this.w * this.h).fill(null);
    this.cells = [];
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
      const k = g.cell(r, c);
      this.cells.push({ hole: !!k.hole, snow: k.snow | 0, crate: k.crate | 0, lock: k.lock || null, lockS: 1, crateHit: 0, snowHit: 0 });
      if (k.tile) this._addSprite(k.tile, r, c);
    }
    // 出口：每個出口欄最下面一個可用格
    this.exitCells = [];
    for (const c of this.exits) {
      for (let r = this.h - 1; r >= 0; r--) if (!this.cells[r * this.w + c].hole) { this.exitCells.push({ r, c }); break; }
    }
    this.resize(true);
  }

  _addSprite(t, r, c) {
    const s = { id: t.id, item: t.item, special: t.special, baby: !!t.baby, x: c, y: r, s: 1, sx: 1, sy: 1, a: 1, rot: 0, wig: 0, pop: 0 };
    this.sprites.set(t.id, s);
    this.grid[r * this.w + c] = t.id;
    return s;
  }
  _at(r, c) { const id = this.grid[r * this.w + c]; return id == null ? null : this.sprites.get(id); }

  /** 動畫播完後，和引擎真實狀態對齊（防止任何不同步） */
  reconcile() {
    const g = this.g, seen = new Set();
    const fx = { added: 0, moved: 0, removed: 0, changed: 0, samples: [] };
    this.grid.fill(null);
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) {
      const k = g.cell(r, c), m = this.cells[r * this.w + c];
      m.snow = k.snow | 0; m.crate = k.crate | 0;
      if ((k.lock || null) !== m.lock) { m.lock = k.lock || null; m.lockS = 1; }
      if (!k.tile) continue;
      seen.add(k.tile.id);
      let s = this.sprites.get(k.tile.id);
      if (!s) { s = this._addSprite(k.tile, r, c); fx.added++; if (fx.samples.length < 6) fx.samples.push(`+${k.tile.id}@${r},${c}`); }
      else {
        if (Math.abs(s.x - c) > .02 || Math.abs(s.y - r) > .02) { fx.moved++; if (fx.samples.length < 6) fx.samples.push(`~${s.id}:${s.y},${s.x}->${r},${c}`); }
        if (s.special !== k.tile.special || s.item !== k.tile.item) fx.changed++;
        s.x = c; s.y = r; s.special = k.tile.special; s.item = k.tile.item; s.baby = !!k.tile.baby;
        s.s = 1; s.sx = 1; s.sy = 1; s.a = 1; s.rot = 0;
        this.grid[r * this.w + c] = s.id;
      }
    }
    for (const id of [...this.sprites.keys()]) if (!seen.has(id)) { this.sprites.delete(id); fx.removed++; if (fx.samples.length < 6) fx.samples.push(`-${id}`); }
    const n = fx.added + fx.moved + fx.removed + fx.changed;
    this.lastFix = fx;
    this.totalFixes = (this.totalFixes || 0) + n;
    if (n) console.warn(`棋盤畫面與引擎對齊：修正 ${n} 處 ${JSON.stringify(fx)}`);
    return n;
  }

  // ---------------- 尺寸 ----------------
  resize(force) {
    if (!this.g || this.destroyed) return;
    const cw = this.host.clientWidth;
    if (!cw) return;
    const cell = Math.floor((cw - PAD * 2) / this.w);
    const dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1);
    if (!force && cell === this.cell && dpr === this.dpr && this.canvas.width) return;
    this.cell = cell; this.dpr = dpr;
    this.bottomExtra = this.exitCells.length ? Math.round(cell * 0.3) : 0;
    this.offX = Math.floor((cw - (cell * this.w + PAD * 2)) / 2);
    this.W = cw;
    this.H = PAD * 2 + cell * this.h + this.bottomExtra;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this._prerenderBg();
    this.preload();
  }

  /** 產生本關所有會用到的點陣圖；回傳 Promise */
  preload() {
    const px = Math.round(this.cell * this.dpr * TILE_SCALE), full = Math.round(this.cell * this.dpr);
    const list = [];
    for (const it of this.g.items) list.push(sprite('t:' + it, () => tileSVG(it), px));
    for (const sp of ['pawH', 'pawV', 'bomb']) list.push(sprite('s:' + sp, () => specialSVG(sp, {}), px));
    list.push(sprite('s:perfume:' + this.perfumeColor, () => specialSVG('perfume', { perfumeColor: this.perfumeColor }), px));
    list.push(sprite('baby', () => babySVG(), px));
    for (const n of [1, 2]) list.push(sprite('snow:' + n, () => snowSVG(n), full));
    for (const n of [1, 2, 3]) list.push(sprite('crate:' + n, () => crateSVG(n), Math.round(full * .96)));
    for (const k of ['yarn', 'honey']) list.push(sprite('lock:' + k, () => lockSVG(k), full));
    if (this.exitCells.length) list.push(sprite('exit', () => exitSVG(), full, Math.round(full * .4)));
    const p = whenReady(list);
    p.then(() => this._prerenderBg());
    return p;
  }

  _tileImg(s) {
    const px = Math.round(this.cell * this.dpr * TILE_SCALE);
    if (s.baby) return sprite('baby', babySVG, px);
    if (s.special === 'perfume') return sprite('s:perfume:' + this.perfumeColor, () => specialSVG('perfume', { perfumeColor: this.perfumeColor }), px);
    if (s.special) return sprite('s:' + s.special, () => specialSVG(s.special, {}), px);
    return sprite('t:' + s.item, () => tileSVG(s.item), px);
  }

  _prerenderBg() {
    if (!this.cell) return;
    const dpr = this.dpr, cell = this.cell;
    const c = this.bg || (this.bg = document.createElement('canvas'));
    c.width = this.canvas.width; c.height = this.canvas.height;
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, this.W, this.H);
    const th = this.theme || {};
    for (let r = 0; r < this.h; r++) for (let col = 0; col < this.w; col++) {
      if (this.cells[r * this.w + col].hole) continue;
      const px = this.offX + PAD + col * cell, py = PAD + r * cell;
      x.fillStyle = (r + col) % 2 ? (th.cellB || '#FCEBD9') : (th.cellA || '#FFF7EC');
      roundRect(x, px + 1.5, py + 1.5, cell - 3, cell - 3, cell * .26);
      x.fill();
    }
    // 出口小門畫在最下面格子的下緣
    const ex = sprite('exit', () => exitSVG(), Math.round(cell * dpr), Math.round(cell * dpr * .4));
    if (ex.ready) for (const e of this.exitCells) {
      x.drawImage(ex.canvas, this.offX + PAD + e.c * cell, PAD + (e.r + 1) * cell - cell * .12, cell, cell * .4);
    }
  }

  // ---------------- 主迴圈 ----------------
  _loop(now) {
    if (this.destroyed) return;
    const dt = Math.min(50, now - this._last);
    this._last = now;
    this.frames++;
    if (now - this.fpsT0 >= 1000) {
      this.fps = Math.round(this.frames * 1000 / (now - this.fpsT0));
      this.fpsLog.push(this.fps); if (this.fpsLog.length > 60) this.fpsLog.shift();
      this.frames = 0; this.fpsT0 = now;
    }
    const w0 = performance.now();
    this._update(dt, now);
    this._draw(now);
    const work = performance.now() - w0;
    const pf = this._perf || (this._perf = { n: 0, sum: 0, max: 0, busyN: 0, busySum: 0, busyMax: 0 });
    pf.n++; pf.sum += work; if (work > pf.max) pf.max = work;
    if (this.tweens.length || this.fx.count) { pf.busyN++; pf.busySum += work; if (work > pf.busyMax) pf.busyMax = work; }
    this._raf = requestAnimationFrame(this._loop);
  }

  _update(dt, now) {
    const sdt = dt * this.timeScale;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tw = this.tweens[i];
      if (tw.delay > 0) { tw.delay -= sdt; if (tw.delay > 0) continue; }
      tw.t += sdt;
      const k = tw.dur <= 0 ? 1 : Math.min(1, tw.t / tw.dur);
      const e = tw.ease(k);
      if (k >= 1) for (const p in tw.props) tw.obj[p] = tw.props[p][1];
      else for (const p in tw.props) { const [a, b] = tw.props[p]; tw.obj[p] = a + (b - a) * e; }
      if (tw.step) tw.step(k);
      if (k >= 1) { this.tweens.splice(i, 1); tw.done(); }
    }
    this.fx.update(sdt);
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
    // 提示：5 秒沒動作
    if (this.inputEnabled && !this.busy && !this.hint && now - this.lastInput > 5000 && this.g && this.g.status === 'playing') {
      const h = this.g.findHint && this.g.findHint();
      if (h) this.hint = { a: h.a, b: h.b, t0: now };
      else this.lastInput = now;
    }
  }

  _draw(now) {
    const ctx = this.ctx, dpr = this.dpr, cell = this.cell;
    if (!this.g || !cell) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    let ox = 0, oy = 0;
    if (this.shakeT > 0) { const m = this.shakeMag * (this.shakeT / 300); ox = Math.sin(now * .09) * m; oy = Math.cos(now * .11) * m; }
    ctx.translate(ox, oy);
    if (this.bg) ctx.drawImage(this.bg, 0, 0, this.W, this.H);
    const X0 = this.offX + PAD, Y0 = PAD;

    // 雪墊
    for (let i = 0; i < this.cells.length; i++) {
      const m = this.cells[i];
      if (!m.snow || m.hole) continue;
      const sp = sprite('snow:' + Math.min(2, m.snow), () => snowSVG(Math.min(2, m.snow)), Math.round(cell * dpr));
      if (!sp.ready) continue;
      const r = (i / this.w) | 0, c = i % this.w;
      ctx.drawImage(sp.canvas, X0 + c * cell, Y0 + r * cell, cell, cell);
    }
    // 木箱
    for (let i = 0; i < this.cells.length; i++) {
      const m = this.cells[i];
      if (!m.crate) continue;
      const r = (i / this.w) | 0, c = i % this.w;
      const n = Math.min(3, m.crate);
      const sp = sprite('crate:' + n, () => crateSVG(n), Math.round(cell * dpr * .96));
      const hit = m.crateHit > 0 ? Math.sin(m.crateHit * 40) * 0.06 : 0;
      ctx.save();
      ctx.translate(X0 + (c + .5) * cell, Y0 + (r + .5) * cell);
      ctx.rotate(hit);
      if (sp.ready) ctx.drawImage(sp.canvas, -cell * .48, -cell * .48, cell * .96, cell * .96);
      else { ctx.fillStyle = '#C08A5A'; roundRect(ctx, -cell * .44, -cell * .44, cell * .88, cell * .88, 8); ctx.fill(); }
      ctx.restore();
      if (m.crateHit > 0) m.crateHit = Math.max(0, m.crateHit - 0.016);
    }

    // tile（裁切在棋盤範圍內，從上方掉進來的才不會露出）
    ctx.save();
    ctx.beginPath();
    ctx.rect(X0 - cell * .3, Y0 - 1, cell * this.w + cell * .6, cell * this.h + 2 + this.bottomExtra);
    ctx.clip();
    const tsz = cell * TILE_SCALE;
    let selS = null, hintA = null, hintB = null;
    if (this.sel) selS = this._at(this.sel.r, this.sel.c);
    if (this.hint) { hintA = this._at(this.hint.a.r, this.hint.a.c); hintB = this._at(this.hint.b.r, this.hint.b.c); }
    if (selS) this._glow(ctx, selS, X0, Y0, cell, 1 + Math.sin(now * .012) * .06);
    for (const s of this.sprites.values()) {
      if (s === selS) continue;
      this._drawTile(ctx, s, X0, Y0, cell, tsz, now, s === hintA || s === hintB);
    }
    if (selS) this._drawTile(ctx, selS, X0, Y0, cell, tsz, now, false, 1.1);
    ctx.restore();

    // lock 罩在 tile 上
    for (let i = 0; i < this.cells.length; i++) {
      const m = this.cells[i];
      if (!m.lock) continue;
      const r = (i / this.w) | 0, c = i % this.w;
      const sp = sprite('lock:' + m.lock, () => lockSVG(m.lock), Math.round(cell * dpr));
      const sc = m.lockS;
      if (m.lockS < 1) m.lockS = Math.min(1, m.lockS + 0.06);
      ctx.save();
      ctx.translate(X0 + (c + .5) * cell, Y0 + (r + .5) * cell);
      ctx.scale(sc, sc);
      if (sp.ready) ctx.drawImage(sp.canvas, -cell / 2, -cell / 2, cell, cell);
      else { ctx.globalAlpha = .5; ctx.fillStyle = m.lock === 'honey' ? '#FFC94D' : '#F7A8C4'; ctx.beginPath(); ctx.arc(0, 0, cell * .4, 0, 7); ctx.fill(); }
      ctx.restore();
    }

    this.fx.draw(ctx, this.W, this.H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  _glow(ctx, s, X0, Y0, cell, k) {
    const cx = X0 + (s.x + .5) * cell, cy = Y0 + (s.y + .5) * cell, R = cell * .62 * k;
    ctx.save(); ctx.globalAlpha = .95;
    ctx.drawImage(glowSprite(), cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
  }

  _drawTile(ctx, s, X0, Y0, cell, tsz, now, hinted, extraScale = 1) {
    if (s.a <= 0.01 || s.s <= 0.01) return;
    const img = this._tileImg(s);
    const cx = X0 + (s.x + .5) * cell, cy = Y0 + (s.y + .5) * cell;
    let rot = s.rot, sc = s.s * extraScale;
    if (hinted) { const t = (now - this.hint.t0) * .012; rot += Math.sin(t * 1.6) * 0.16; sc *= 1 + Math.max(0, Math.sin(t * .8)) * .06; }
    if (s.special && !hinted) sc *= 1 + Math.sin(now * .004 + s.id) * .035;
    ctx.save();
    ctx.globalAlpha = s.a;
    ctx.translate(cx, cy + tsz * .38);           // 以底部為壓扁的支點
    if (rot) ctx.rotate(rot);
    ctx.scale(sc * s.sx, sc * s.sy);
    if (img.ready) ctx.drawImage(img.canvas, -tsz / 2, -tsz * .88, tsz, tsz);
    else {
      ctx.fillStyle = s.special ? '#FF9EB5' : (ITEM_COLORS[s.item] || '#E0B0C8');
      ctx.beginPath(); ctx.arc(0, -tsz * .38, tsz * .4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ---------------- 補間 ----------------
  tween(obj, props, dur, easing = 'outQuad', delay = 0, step = null) {
    if (this.instant) dur = 0, delay = 0;
    return new Promise(done => {
      const p = {};
      for (const k in props) p[k] = [obj[k], props[k]];
      if (dur <= 0 && delay <= 0) { for (const k in props) obj[k] = props[k]; if (step) step(1); done(); return; }
      this.tweens.push({ obj, props: p, dur, ease: ease[easing] || ease.outQuad, delay, t: 0, done, step });
    });
  }
  wait(ms) { return this.instant ? Promise.resolve() : this.tween({ v: 0 }, { v: 1 }, ms, 'linear'); }
  shake(mag, ms = 300) { if (this.instant) return; this.shakeMag = Math.max(this.shakeMag * (this.shakeT > 0 ? 1 : 0), mag); this.shakeT = ms; }
  center(r, c) { return { x: this.offX + PAD + (c + .5) * this.cell, y: PAD + (r + .5) * this.cell }; }

  // ---------------- 播放 steps ----------------
  async play(steps) {
    for (const phase of steps || []) {
      if (this.destroyed) return;
      const hasActivate = phase.some(e => e.type === 'activate' || e.type === 'combo');
      const jobs = [];
      for (const ev of phase) {
        try { this.hooks.onEvent && this.hooks.onEvent(ev); } catch (e) { console.error(e); }
        jobs.push(this._event(ev, hasActivate));
      }
      await Promise.all(jobs);
    }
    this.reconcile();
  }

  _event(ev, hasActivate) {
    const cell = this.cell, fx = this.fx;
    switch (ev.type) {
      case 'swap': case 'swapBack': {
        const A = this._at(ev.a.r, ev.a.c), B = this._at(ev.b.r, ev.b.c);
        const ia = ev.a.r * this.w + ev.a.c, ib = ev.b.r * this.w + ev.b.c;
        this.grid[ia] = B ? B.id : null; this.grid[ib] = A ? A.id : null;
        const dur = ev.type === 'swap' ? 160 : 170;
        return Promise.all([
          A ? this.tween(A, { x: ev.b.c, y: ev.b.r }, dur, 'inOutQuad') : null,
          B ? this.tween(B, { x: ev.a.c, y: ev.a.r }, dur, 'inOutQuad') : null,
        ]);
      }
      case 'match': {
        const js = [];
        for (const grp of ev.groups || []) for (const p of grp) {
          const s = this._at(p.r, p.c);
          if (s) js.push(this.tween(s, { s: 1.12 }, 70, 'outQuad'));
        }
        return Promise.all(js);
      }
      case 'clear': {
        const js = [];
        let sx = 0, sy = 0, n = 0;
        const delay = hasActivate ? 140 : 0;
        for (const t of ev.tiles || []) {
          const s = this.sprites.get(t.id) || this._at(t.r, t.c);
          const { x, y } = this.center(t.r, t.c);
          sx += x; sy += y; n++;
          if (this.grid[t.r * this.w + t.c] === (s && s.id)) this.grid[t.r * this.w + t.c] = null;
          const color = (t.special ? ITEM_COLORS[t.special] : ITEM_COLORS[t.item]) || '#FF9EB5';
          if (!s) { if (!this.instant) setTimeout(() => fx.burst(x, y, color, cell, 3), delay); continue; }
          const d2 = delay + (t.cause === 'perfume' ? Math.random() * 120 : 0);
          js.push(this.tween(s, { s: 1.24 }, 70, 'outQuad', d2).then(() => {
            if (!this.instant) fx.burst(x, y, color, cell, t.cause === 'match' ? 5 : 3);
            return this.tween(s, { s: 0, a: 0 }, 150, 'inQuad');
          }).then(() => { if (this.sprites.get(s.id) === s && s.a <= 0.01) this.sprites.delete(s.id); }));
        }
        if (n && ev.scoreGain && !this.instant) fx.text(sx / n, sy / n, '+' + ev.scoreGain, cell * .42, '#D9A23A', 800);
        if (ev.wave >= 2 && !this.instant) fx.text(this.W / 2, this.H * .42, `${ev.wave} 連鎖！`, Math.min(cell * 1.05, 46), '#E8668C', 950, true);
        return Promise.all(js);
      }
      case 'create': {
        const s = this._addSprite(ev.tile, ev.r, ev.c);
        s.s = 0;
        const { x, y } = this.center(ev.r, ev.c);
        if (!this.instant) { fx.ring(x, y, cell * .2, cell * .9, '#FFD36E', 380, cell * .12); fx.flakes(x, y, cell, '#FFE7A0', 6); }
        return this.tween(s, { s: 1 }, 260, 'outBack', hasActivate ? 160 : 60);
      }
      case 'activate': return this._activate(ev);
      case 'combo': {
        const { x, y } = this.center(ev.r, ev.c);
        if (!this.instant) {
          fx.doFlash(.7, '#FFF4F8');
          fx.ring(x, y, cell * .3, cell * 4.5, '#FF9EB5', 650, cell * .25);
          fx.ring(x, y, cell * .2, cell * 3, '#FFD36E', 520, cell * .18, 80);
          fx.text(this.W / 2, this.H * .3, '組合技！', Math.min(cell * 1.15, 52), '#E8668C', 1000, true);
          this.shake(cell * .18, 420);
        }
        return this.wait(260);
      }
      case 'transform': {
        const js = [];
        for (const t of ev.tiles || []) {
          const s = this.sprites.get(t.id) || this._at(t.r, t.c);
          if (!s) continue;
          const { x, y } = this.center(t.r, t.c);
          js.push(this.tween(s, { s: 0.3 }, 110, 'inQuad', Math.random() * 120).then(() => {
            s.special = t.special;
            if (!this.instant) fx.flakes(x, y, cell, '#FFFFFF', 4);
            return this.tween(s, { s: 1 }, 200, 'outBack');
          }));
        }
        return Promise.all(js);
      }
      case 'obstacle': {
        const m = this.cells[ev.r * this.w + ev.c];
        const { x, y } = this.center(ev.r, ev.c);
        if (ev.kind === 'snow') {
          m.snow = ev.left;
          if (!this.instant) { fx.flakes(x, y, cell, '#FFFFFF', 7); fx.flakes(x, y, cell, '#BFE0F5', 4); }
        } else if (ev.kind === 'crate') {
          m.crate = ev.left; m.crateHit = 1;
          if (!this.instant) fx.chips(x, y, ev.left ? '#C99A73' : '#A8774E', cell, ev.left ? 4 : 9);
        } else {
          if (!ev.left) m.lock = null;
          if (!this.instant) {
            if (ev.kind === 'honey') { fx.flakes(x, y, cell, '#FFC94D', 7); fx.flakes(x, y, cell, '#FFE7A0', 4); }
            else { fx.chips(x, y, '#F7A8C4', cell, 5); fx.hearts(x, y, cell, 2, '#F7A8C4'); }
          }
        }
        return this.wait(140);
      }
      case 'honeySpread': {
        const m = this.cells[ev.r * this.w + ev.c];
        m.lock = 'honey'; m.lockS = 0.2;
        const { x, y } = this.center(ev.r, ev.c);
        if (!this.instant) fx.flakes(x, y - cell * .4, cell, '#FFC94D', 5);
        return this.wait(260);
      }
      case 'fall': {
        const js = [];
        // 先把所有移動的 tile 從格子表拿掉，再放到新位置
        const movers = [];
        for (const mv of ev.moves || []) {
          const s = this.sprites.get(mv.id) || this._at(mv.from.r, mv.from.c);
          if (!s) continue;
          if (this.grid[mv.from.r * this.w + mv.from.c] === s.id) this.grid[mv.from.r * this.w + mv.from.c] = null;
          movers.push([s, mv]);
        }
        for (const [s, mv] of movers) {
          this.grid[mv.to.r * this.w + mv.to.c] = s.id;
          js.push(this._fallTo(s, mv.to.r, mv.to.c));
        }
        for (const sp of ev.spawns || []) {
          const fromRow = sp.fromRow != null ? sp.fromRow : -1;
          const s = this._addSprite(sp.tile, sp.to.r, sp.to.c);
          s.y = fromRow;
          js.push(this._fallTo(s, sp.to.r, sp.to.c));
        }
        return Promise.all(js);
      }
      case 'babyHome': {
        const s = this.sprites.get(ev.id) || this._at(ev.r, ev.c);
        const { x, y } = this.center(ev.r, ev.c);
        if (this.grid[ev.r * this.w + ev.c] === (s && s.id)) this.grid[ev.r * this.w + ev.c] = null;
        if (!this.instant) { fx.hearts(x, y, cell, 5, '#FF8FB0'); fx.ring(x, y + cell * .4, cell * .2, cell * .8, '#FFD36E', 400, cell * .1); }
        if (!s) return this.wait(200);
        return this.tween(s, { y: ev.r + .55, s: .35, a: 0 }, 420, 'inQuad').then(() => this.sprites.delete(s.id));
      }
      case 'shuffle': {
        const js = [];
        const movers = [];
        for (const mv of ev.moves || []) {
          const s = this.sprites.get(mv.id);
          if (!s) continue;
          const i = Math.round(s.y) * this.w + Math.round(s.x);
          if (this.grid[i] === s.id) this.grid[i] = null;
          movers.push([s, mv]);
        }
        const cx = (this.w - 1) / 2, cy = (this.h - 1) / 2;
        for (const [s, mv] of movers) {
          this.grid[mv.to.r * this.w + mv.to.c] = s.id;
          js.push(this.tween(s, { x: cx, y: cy, s: .6, rot: 1.5 }, 260, 'inQuad', Math.random() * 80)
            .then(() => this.tween(s, { x: mv.to.c, y: mv.to.r, s: 1, rot: 0 }, 300, 'outBack')));
        }
        return Promise.all(js);
      }
      case 'end': case 'goals': case 'score': default:
        return null;
    }
  }

  _fallTo(s, r, c) {
    const dist = Math.max(0.3, Math.hypot(r - s.y, c - s.x));
    const dur = 85 + Math.sqrt(dist) * 70;
    return this.tween(s, { x: c, y: r }, dur, 'inQuad').then(() => {
      if (this.instant) return;
      s.sx = 1.12; s.sy = .84;
      return this.tween(s, { sx: 1, sy: 1 }, 170, 'outBack');
    });
  }

  _activate(ev) {
    const cell = this.cell, fx = this.fx;
    const { x, y } = this.center(ev.r, ev.c);
    if (this.instant) return null;
    const boardW = this.w * cell, boardH = this.h * cell;
    const X0 = this.offX + PAD, Y0 = PAD;
    switch (ev.special) {
      case 'pawH': case 'pawV': {
        const horiz = ev.special === 'pawH' ? (ev.dir !== 'v') : (ev.dir === 'h');
        if (horiz) fx.beam(X0 + boardW / 2, y, true, boardW, cell * .78, '#FF9EB5');
        else fx.beam(x, Y0 + boardH / 2, false, boardH, cell * .78, '#FF9EB5');
        fx.ring(x, y, cell * .2, cell * 1.1, '#FFFFFF', 300, cell * .12);
        for (let i = 0; i < 4; i++) fx.hearts(x, y, cell, 1, '#FF8FB0');
        this.shake(cell * .06, 200);
        return this.wait(180);
      }
      case 'bomb': {
        fx.doFlash(.45, '#FFF6D8');
        fx.ring(x, y, cell * .3, cell * 2.1, '#FFC94D', 480, cell * .3);
        fx.ring(x, y, cell * .2, cell * 1.6, '#FFFFFF', 380, cell * .14, 60);
        fx.flakes(x, y, cell, '#FFD36E', 10);
        this.shake(cell * .14, 320);
        return this.wait(200);
      }
      case 'perfume': {
        const color = this.perfumeColor;
        fx.ring(x, y, cell * .2, cell * 1.4, color, 420, cell * .14);
        const area = ev.area || [];
        let i = 0;
        for (const p of area) {
          const t = this.center(p.r, p.c);
          fx.mist(x, y, t.x, t.y, color, cell, Math.min(240, i * 14));
          if (i % 2 === 0) fx.mist(x, y, t.x, t.y, '#FFFFFF', cell * .7, Math.min(260, i * 14 + 30));
          i++;
        }
        if (!area.length) for (let k = 0; k < 10; k++) {
          const a = k / 10 * Math.PI * 2;
          fx.mist(x, y, x + Math.cos(a) * cell * 2, y + Math.sin(a) * cell * 2, color, cell, k * 20);
        }
        return this.wait(320);
      }
      default:
        fx.ring(x, y, cell * .2, cell * 1.4, '#FFFFFF', 300, cell * .12);
        return this.wait(150);
    }
  }

  /** 開場：所有 tile 從上方依序掉進來 */
  introDrop() {
    const js = [];
    for (const s of this.sprites.values()) {
      const r = s.y, c = s.x;
      s.y = r - this.h - 1.2;
      const delay = (this.h - r) * 45 + c * 18 + Math.random() * 30;
      js.push(new Promise(res => setTimeout(res, this.instant ? 0 : delay)).then(() => this._fallTo(s, r, c)));
    }
    return Promise.all(js);
  }

  // ---------------- 操作 ----------------
  _cellAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - this.offX - PAD, y = clientY - rect.top - PAD;
    const c = Math.floor(x / this.cell), r = Math.floor(y / this.cell);
    if (r < 0 || c < 0 || r >= this.h || c >= this.w) return null;
    if (this.cells[r * this.w + c].hole) return null;
    return { r, c };
  }

  _bindInput() {
    const cv = this.canvas;
    cv.style.touchAction = 'none';
    let start = null;
    this._onDown = e => {
      if (!this.inputEnabled || this.busy) return;
      const p = this._cellAt(e.clientX, e.clientY);
      if (!p) return;
      start = { p, x: e.clientX, y: e.clientY, used: false, id: e.pointerId };
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      this._poke();
    };
    this._onMove = e => {
      if (!start || start.used || start.id !== e.pointerId) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y, th = this.cell * .33;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      start.used = true;
      const p = start.p;
      const q = Math.abs(dx) > Math.abs(dy) ? { r: p.r, c: p.c + Math.sign(dx) } : { r: p.r + Math.sign(dy), c: p.c };
      this.sel = null;
      if (q.r < 0 || q.c < 0 || q.r >= this.h || q.c >= this.w || this.cells[q.r * this.w + q.c].hole) return;
      this.doSwap(p, q);
    };
    this._onUp = e => {
      if (!start || start.id !== e.pointerId) return;
      const st = start; start = null;
      if (st.used) return;
      this._tap(st.p);
    };
    this._onCancel = () => { start = null; };
    cv.addEventListener('pointerdown', this._onDown);
    cv.addEventListener('pointermove', this._onMove);
    cv.addEventListener('pointerup', this._onUp);
    cv.addEventListener('pointercancel', this._onCancel);
  }

  _poke() { this.lastInput = performance.now(); this.hint = null; }

  _tap(p) {
    if (!this.inputEnabled || this.busy) return;
    const s = this._at(p.r, p.c);
    const locked = !!this.cells[p.r * this.w + p.c].lock;
    if (this.sel) {
      const a = this.sel;
      if (a.r === p.r && a.c === p.c) { this.sel = null; return; }
      if (Math.abs(a.r - p.r) + Math.abs(a.c - p.c) === 1) { this.sel = null; this.doSwap(a, p); return; }
    }
    if (!s) { this.sel = null; return; }
    if (locked) { this._deny(s); this.sel = null; return; }
    if (s.special) { this.sel = null; this.doTap(p); return; }
    this.sel = p;
    this.hooks.onSelect && this.hooks.onSelect(p);
    if (!this.instant) { s.sx = 1.15; s.sy = .86; this.tween(s, { sx: 1, sy: 1 }, 240, 'outBack'); }
  }

  _deny(s) {
    this.hooks.onDenied && this.hooks.onDenied();
    this.tween(s, { rot: .18 }, 60).then(() => this.tween(s, { rot: -.18 }, 90)).then(() => this.tween(s, { rot: 0 }, 70));
  }

  async doSwap(a, b) {
    if (this.busy || !this.g || this.g.status !== 'playing') return;
    this._poke();
    this.busy = true;
    let res;
    try { res = this.g.trySwap(a, b); } catch (e) { console.error(e); this.busy = false; return; }
    this.hooks.onAction && this.hooks.onAction('swap', res);
    if (res && !res.ok && !(res.steps && res.steps.length)) {
      // 不能交換（被鎖、木箱、空格…）：輕晃一下就好
      const s = this._at(a.r, a.c) || this._at(b.r, b.c);
      if (s) this._deny(s);
    } else await this.play(res.steps);
    this.busy = false;
    this._poke();
    this.hooks.onSettled && this.hooks.onSettled(res);
  }

  async doTap(p) {
    if (this.busy || !this.g || this.g.status !== 'playing') return;
    this._poke();
    this.busy = true;
    let res;
    try { res = this.g.tapSpecial(p); } catch (e) { console.error(e); this.busy = false; return; }
    this.hooks.onAction && this.hooks.onAction('tap', res);
    if (res && res.ok) await this.play(res.steps);
    else { const s = this._at(p.r, p.c); if (s) this._deny(s); }
    this.busy = false;
    this._poke();
    this.hooks.onSettled && this.hooks.onSettled(res);
  }

  /** 每幀實際花在更新＋繪製的毫秒數（和機器忙不忙無關，用來估 iPhone 是否撐得住 60fps） */
  perfStats() {
    const p = this._perf || { n: 0, sum: 0, max: 0, busyN: 0, busySum: 0, busyMax: 0 };
    const r = x => Math.round(x * 100) / 100;
    return { frames: p.n, avgMs: r(p.sum / Math.max(1, p.n)), maxMs: r(p.max), animFrames: p.busyN, animAvgMs: r(p.busySum / Math.max(1, p.busyN)), animMaxMs: r(p.busyMax), particles: this.fx.count };
  }

  setPerfumeColor(c) { this.perfumeColor = c; this.preload(); }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this._raf);
    this._ro.disconnect();
    const cv = this.canvas;
    cv.removeEventListener('pointerdown', this._onDown);
    cv.removeEventListener('pointermove', this._onMove);
    cv.removeEventListener('pointerup', this._onUp);
    cv.removeEventListener('pointercancel', this._onCancel);
    this.tweens.length = 0;
    this.fx.clear();
    cv.remove();
  }
}
