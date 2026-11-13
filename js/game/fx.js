// 粒子與特效（C 擁有）。物件池，不在每幀配置新物件。座標為棋盤 CSS 像素。
const MAX = 420;

function heartPath(ctx, s) {
  ctx.moveTo(0, s * .9);
  ctx.bezierCurveTo(-s * 1.4, 0, -s * .9, -s * 1.1, 0, -s * .35);
  ctx.bezierCurveTo(s * .9, -s * 1.1, s * 1.4, 0, 0, s * .9);
}
function starPath(ctx, R) {
  const r = R * .48;
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R;
    i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
}
function sparklePath(ctx, R) {
  const k = R * .2;
  ctx.moveTo(0, -R); ctx.quadraticCurveTo(k, -k, R, 0); ctx.quadraticCurveTo(k, k, 0, R);
  ctx.quadraticCurveTo(-k, k, -R, 0); ctx.quadraticCurveTo(-k, -k, 0, -R); ctx.closePath();
}

// 香霧貼圖：每種顏色只產生一次
const mistCache = new Map();
function mistSprite(color) {
  let c = mistCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,.95)');
  g.addColorStop(.35, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.globalAlpha = .85;
  x.fillStyle = g;
  x.beginPath(); x.arc(32, 32, 32, 0, Math.PI * 2); x.fill();
  mistCache.set(color, c);
  return c;
}

const easeOut = t => 1 - (1 - t) * (1 - t);

export class FX {
  constructor() {
    this.pool = [];
    this.live = [];
    for (let i = 0; i < MAX; i++) this.pool.push({});
    this.flash = 0;          // 全棋盤白光 0–1
    this.flashColor = '#fff';
    this.lowPower = false;   // 跳過模式時少放粒子
  }
  get count() { return this.live.length; }
  clear() { while (this.live.length) this.pool.push(this.live.pop()); this.flash = 0; }

  _get(type) {
    const p = this.pool.pop() || (this.live.length ? this.live.shift() : {});
    p.type = type; p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.ay = 0; p.drag = 0;
    p.age = 0; p.life = 600; p.size = 10; p.size1 = null; p.rot = 0; p.vr = 0;
    p.color = '#FF9EB5'; p.alpha = 1; p.text = ''; p.len = 0; p.horiz = true; p.width = 0; p.delay = 0;
    this.live.push(p);
    return p;
  }

  /** 消除時的愛心＋星星碎片 */
  burst(x, y, color, cell, n = 5) {
    if (this.lowPower) n = Math.min(n, 2);
    for (let i = 0; i < n; i++) {
      const p = this._get(i % 3 === 0 ? 'star' : (i % 3 === 1 ? 'heart' : 'sparkle'));
      const a = Math.random() * Math.PI * 2, sp = (0.5 + Math.random() * 0.9) * cell * 2.2;
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - cell * 1.2; p.ay = cell * 5; p.drag = 1.6;
      p.size = cell * (0.11 + Math.random() * 0.08); p.size1 = p.size * 0.4;
      p.color = p.type === 'sparkle' ? '#FFFFFF' : color; p.life = 520 + Math.random() * 260;
      p.rot = Math.random() * 6; p.vr = (Math.random() - .5) * 8;
    }
    // 「噗」的白圈
    const r = this._get('ring');
    r.x = x; r.y = y; r.size = cell * .2; r.size1 = cell * .62; r.life = 260; r.color = '#FFFFFF'; r.width = cell * .09;
  }
  ring(x, y, r0, r1, color, life = 420, width = 6, delay = 0) {
    const p = this._get('ring');
    p.x = x; p.y = y; p.size = r0; p.size1 = r1; p.color = color; p.life = life; p.width = width; p.delay = delay;
  }
  /** 熊掌光帶：沿整列或整行掃過 */
  beam(x, y, horiz, len, thick, color, life = 380, delay = 0) {
    const p = this._get('beam');
    p.x = x; p.y = y; p.horiz = horiz; p.len = len; p.size = thick; p.color = color; p.life = life; p.delay = delay;
  }
  mist(x, y, tx, ty, color, cell, delay = 0) {
    const p = this._get('mist');
    p.x = x; p.y = y; p.vx = (tx - x) / 0.42; p.vy = (ty - y) / 0.42 - cell * .3; p.drag = 0.4;
    p.size = cell * (0.35 + Math.random() * 0.2); p.size1 = cell * (0.8 + Math.random() * 0.3);
    p.color = color; p.life = 620 + Math.random() * 200; p.delay = delay; p.alpha = .9;
  }
  chips(x, y, color, cell, n = 6) {
    if (this.lowPower) n = 2;
    for (let i = 0; i < n; i++) {
      const p = this._get('chip');
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, sp = cell * (1.2 + Math.random() * 1.6);
      p.x = x + (Math.random() - .5) * cell * .5; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.ay = cell * 9;
      p.size = cell * (0.08 + Math.random() * 0.07); p.color = color; p.life = 600; p.rot = Math.random() * 6; p.vr = (Math.random() - .5) * 14;
    }
  }
  flakes(x, y, cell, color = '#FFFFFF', n = 6) {
    if (this.lowPower) n = 2;
    for (let i = 0; i < n; i++) {
      const p = this._get('dot');
      const a = Math.random() * Math.PI * 2, sp = cell * (0.4 + Math.random() * 1.1);
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - cell * .4; p.ay = cell * 1.5; p.drag = 1;
      p.size = cell * (0.05 + Math.random() * 0.06); p.size1 = 0; p.color = color; p.life = 520 + Math.random() * 200;
    }
  }
  /** 往上飄的愛心（寶寶回家、慶祝） */
  hearts(x, y, cell, n = 4, color = '#FF8FB0') {
    for (let i = 0; i < n; i++) {
      const p = this._get('heart');
      p.x = x + (Math.random() - .5) * cell * .8; p.y = y; p.vx = (Math.random() - .5) * cell * .6; p.vy = -cell * (1.4 + Math.random());
      p.size = cell * (0.12 + Math.random() * 0.08); p.size1 = p.size * .7; p.color = color; p.life = 900 + Math.random() * 300; p.delay = i * 70;
    }
  }
  /** v1.2 蠟筆塗色的小星星（往上飄、很快消失） */
  stars(x, y, cell, n = 2, color = '#FFD36E') {
    if (this.lowPower) n = Math.min(n, 1);
    for (let i = 0; i < n; i++) {
      const p = this._get(i % 2 ? 'sparkle' : 'star');
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = cell * (0.6 + Math.random() * 0.9);
      p.x = x + (Math.random() - .5) * cell * .5; p.y = y + (Math.random() - .5) * cell * .4;
      p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.drag = 2.2; p.ay = cell * .6;
      p.size = cell * (0.1 + Math.random() * 0.06); p.size1 = p.size * .3;
      p.color = p.type === 'sparkle' ? '#FFFFFF' : color; p.life = 480 + Math.random() * 220;
      p.rot = Math.random() * 6; p.vr = (Math.random() - .5) * 6; p.delay = i * 40;
    }
  }
  /** 小閃光（禮物盒、道具跳出） */
  sparkles(x, y, cell, n = 4) {
    if (this.lowPower) n = Math.min(n, 1);
    for (let i = 0; i < n; i++) {
      const p = this._get('sparkle');
      const a = Math.random() * Math.PI * 2, sp = cell * (0.5 + Math.random());
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp - cell * .5; p.drag = 2;
      p.size = cell * (0.1 + Math.random() * 0.07); p.size1 = p.size * .2; p.color = i % 2 ? '#FFFFFF' : '#FFE7A0';
      p.life = 420 + Math.random() * 200; p.rot = Math.random() * 6; p.vr = (Math.random() - .5) * 5;
    }
  }
  /** v1.2 禮物盒打開的紙花（彩色小紙片，翻轉飄落） */
  confetti(x, y, cell, n = 16) {
    if (this.lowPower) n = Math.min(n, 3);
    const cols = ['#FF9EB5', '#FFD36E', '#8FD9B6', '#8CCBEA', '#C9A7F5', '#FFB38A', '#FFFFFF'];
    for (let i = 0; i < n; i++) {
      const p = this._get('confetti');
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.6, sp = cell * (2 + Math.random() * 2.6);
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.ay = cell * 6; p.drag = 2.4;
      p.size = cell * (0.06 + Math.random() * 0.05); p.color = cols[i % cols.length];
      p.life = 900 + Math.random() * 500; p.rot = Math.random() * 6; p.vr = (Math.random() - .5) * 16; p.len = Math.random() * 6;
    }
  }
  /** v1.2 彩帶：細長捲曲的緞帶往外噴 */
  streamers(x, y, cell, n = 5) {
    if (this.lowPower) n = Math.min(n, 2);
    const cols = ['#FF8FB0', '#FFC94D', '#7DD3B0', '#8CCBEA', '#B79AF0'];
    for (let i = 0; i < n; i++) {
      const p = this._get('streamer');
      const a = -Math.PI / 2 + (i / Math.max(1, n - 1) - .5) * 2.4 + (Math.random() - .5) * .3, sp = cell * (2.6 + Math.random() * 1.6);
      p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.ay = cell * 5; p.drag = 2.6;
      p.size = cell * .55; p.width = Math.max(1.5, cell * .07); p.color = cols[i % cols.length];
      p.life = 950 + Math.random() * 300; p.rot = a; p.len = Math.random() * 6;
    }
  }
  /** 浮起的文字（分數、連鎖、組合技） */
  text(x, y, str, size, color = '#E8668C', life = 900, big = false) {
    const p = this._get('text');
    p.x = x; p.y = y; p.vy = big ? 0 : -size * 1.4; p.text = str; p.size = size; p.color = color; p.life = life; p.big = big;
  }
  doFlash(a = .55, color = '#FFFFFF') { this.flash = Math.max(this.flash, a); this.flashColor = color; }

  update(dt) {
    const s = dt / 1000;
    this.flash = Math.max(0, this.flash - s * 2.6);
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      if (p.age >= p.life) { this.live[i] = this.live[this.live.length - 1]; this.live.pop(); this.pool.push(p); continue; }
      if (p.drag) { const k = Math.max(0, 1 - p.drag * s); p.vx *= k; p.vy *= k; }
      p.vy += p.ay * s;
      p.x += p.vx * s; p.y += p.vy * s;
      p.rot += p.vr * s;
    }
  }

  draw(ctx, W, H) {
    let beams = 0;
    for (const p of this.live) if (p.type === 'beam' && p.delay <= 0) beams++;
    const beamK = beams > 3 ? Math.max(.3, 3 / beams) : 1;   // 同時很多條光帶時淡一點，免得像條碼
    for (const p of this.live) {
      if (p.delay > 0) continue;
      const t = p.age / p.life;
      ctx.save();
      switch (p.type) {
        case 'heart': case 'star': case 'sparkle': {
          const sz = p.size1 == null ? p.size : p.size + (p.size1 - p.size) * t;
          ctx.globalAlpha = t < .7 ? 1 : 1 - (t - .7) / .3;
          ctx.translate(p.x, p.y); ctx.rotate(p.type === 'heart' ? p.rot * .15 : p.rot);
          ctx.beginPath();
          if (p.type === 'heart') heartPath(ctx, sz); else if (p.type === 'star') starPath(ctx, sz * 1.25); else sparklePath(ctx, sz * 1.3);
          ctx.fillStyle = p.color; ctx.fill();
          if (p.type !== 'sparkle') { ctx.lineWidth = Math.max(1, sz * .22); ctx.strokeStyle = '#FFFFFF'; ctx.stroke(); }
          break;
        }
        case 'dot':
          ctx.globalAlpha = 1 - t; ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.5, p.size * (1 - t * .5)), 0, Math.PI * 2); ctx.fill();
          break;
        case 'chip':
          ctx.globalAlpha = t < .6 ? 1 : 1 - (t - .6) / .4;
          ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
          ctx.fillRect(-p.size, -p.size * .55, p.size * 2, p.size * 1.1);
          break;
        case 'ring': {
          const e = easeOut(t), r = p.size + (p.size1 - p.size) * e;
          ctx.globalAlpha = 1 - t; ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, p.width * (1 - t * .7));
          ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
          break;
        }
        case 'beam': {
          const grow = Math.min(1, t / .35), fade = t < .45 ? 1 : 1 - (t - .45) / .55;
          const L = p.len * grow, th = p.size * (0.6 + 0.4 * fade);
          ctx.globalAlpha = .55 * fade * beamK; ctx.fillStyle = p.color;
          if (p.horiz) roundRect(ctx, p.x - L / 2, p.y - th / 2, L, th, th / 2);
          else roundRect(ctx, p.x - th / 2, p.y - L / 2, th, L, th / 2);
          ctx.fill();
          ctx.globalAlpha = .95 * fade * beamK; ctx.fillStyle = '#FFFFFF';
          const t2 = th * (beamK < 1 ? .22 : .38);
          if (p.horiz) roundRect(ctx, p.x - L / 2, p.y - t2 / 2, L, t2, t2 / 2);
          else roundRect(ctx, p.x - t2 / 2, p.y - L / 2, t2, L, t2 / 2);
          ctx.fill();
          break;
        }
        case 'mist': {
          const sz = p.size + (p.size1 - p.size) * t;
          ctx.globalAlpha = p.alpha * (t < .2 ? t / .2 : 1 - (t - .2) / .8);
          ctx.drawImage(mistSprite(p.color), p.x - sz, p.y - sz, sz * 2, sz * 2);
          break;
        }
        case 'confetti': {
          ctx.globalAlpha = t < .7 ? 1 : 1 - (t - .7) / .3;
          const sway = Math.sin(p.age * .012 + p.len) * p.size * 1.2;
          ctx.translate(p.x + sway, p.y); ctx.rotate(p.rot);
          ctx.scale(1, Math.cos(p.age * .018 + p.len));    // 翻面
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size, -p.size * .6, p.size * 2, p.size * 1.2);
          if (p.color === '#FFFFFF') { ctx.strokeStyle = '#F2C6D3'; ctx.lineWidth = 1; ctx.strokeRect(-p.size, -p.size * .6, p.size * 2, p.size * 1.2); }
          break;
        }
        case 'streamer': {
          ctx.globalAlpha = t < .6 ? 1 : 1 - (t - .6) / .4;
          const L = p.size * (0.5 + Math.min(1, t * 3) * .5);
          const ang = Math.atan2(p.vy, p.vx) + Math.PI;     // 尾巴拖在後面
          const ph = p.age * .02 + p.len;
          ctx.translate(p.x, p.y); ctx.rotate(ang);
          ctx.beginPath(); ctx.moveTo(0, 0);
          for (let k = 1; k <= 6; k++) ctx.lineTo(L * k / 6, Math.sin(ph + k * 1.3) * p.width * 1.8);
          ctx.strokeStyle = p.color; ctx.lineWidth = p.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
          break;
        }
        case 'text': {
          const pop = p.big ? (t < .15 ? .4 + t / .15 * .75 : (t < .25 ? 1.15 - (t - .15) / .1 * .15 : 1)) : (t < .12 ? .6 + t / .12 * .4 : 1);
          ctx.globalAlpha = t < .7 ? 1 : 1 - (t - .7) / .3;
          ctx.translate(p.x, p.y); ctx.scale(pop, pop);
          ctx.font = `800 ${p.size}px "Arial Rounded MT Bold","PingFang TC","Noto Sans TC",sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, p.size * .28); ctx.strokeStyle = '#FFFFFF';
          ctx.strokeText(p.text, 0, 0);
          ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
          break;
        }
      }
      ctx.restore();
    }
    if (this.flash > 0) {
      ctx.save(); ctx.globalAlpha = this.flash * .6; ctx.fillStyle = this.flashColor; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  }
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
