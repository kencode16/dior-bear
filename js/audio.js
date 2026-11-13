// 聲音（F 擁有）：全部 WebAudio 合成；狗叫用 CC0 真實錄音 assets/sounds/bark.m4a（失敗退回合成）。
// API 見 架構.md：unlock() sfx(name, opts) setSfx(on) setMusic(on) playMusic(track, { chapter }) stopMusic()
// iOS：AudioContext 只在第一次觸控時（unlock）建立；之前呼叫 sfx 會靜靜略過，playMusic 會記住曲子、解鎖後才播。
// v1.2：sfx 加 paint、gift（opts.left>0＝只拆掉一層）、reward；沒有的音效名稱安靜略過（不丟例外、不印警告）。
//       playMusic('level', { chapter: 5 | 6 }) 播該章變奏（學校鐘聲／旋轉木馬華爾滋），其他章或沒給 chapter 照舊。
//       iPhone 靜音模式也要有聲音（見下方「iPhone 靜音模式」）；unlock() 可以重複呼叫，不會重複建立東西。

const BARK_URL = new URL('../assets/sounds/bark.m4a', import.meta.url).href;
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

let ac = null;          // AudioContext
let master = null;      // 總音量 → compressor → destination
let sfxBus = null;      // 音效
let musicBus = null;    // 音樂（開關用這個）
let unlocked = false;
let sfxOn = true;
let musicOn = true;
let primed = false;     // 播過 1 取樣的無聲緩衝區、而且 AudioContext 已在跑
const missing = new Set(); // 測試用：被要求過但不存在的音效／曲子名稱

// ---------------- iPhone 靜音模式 ----------------
// iPhone 開靜音（側邊開關）時，Safari 的 Web Audio 預設會一起被靜音。
// 1. iOS 17 以上：navigator.audioSession.type = 'playback'（載入時設，unlock 時再設一次）。
// 2. 沒有 audioSession 的舊 iOS：第一次觸控時播一段循環的無聲 <audio>，把音訊工作階段切到「播放」模式。
// 3. 觸控時建立並 resume() AudioContext，再播 1 取樣的無聲緩衝區。
// （做法來自《菊島連連烘》，已在使用者 iPhone 實機確認有效。）
const NAV = typeof navigator !== 'undefined' ? navigator : null;
const UA = (NAV && NAV.userAgent) || '';
// iPad 的 Safari 會假裝成 Mac：用「Mac＋觸控螢幕＋不是 Chrome」判斷
const IS_IOS = /iP(hone|ad|od)/.test(UA) || (/Macintosh/.test(UA) && !!NAV && NAV.maxTouchPoints > 1 && !/Chrome\//.test(UA));
// 測試用：網址加 ?silentloop 可以在電腦上強制走舊 iOS 的無聲循環路徑
const FORCE_LOOP = typeof location !== 'undefined' && /[?&]silentloop\b/.test(location.search || '');
const NEED_SILENT_LOOP = FORCE_LOOP || (IS_IOS && !(NAV && NAV.audioSession));

function setSession() {
  try { if (NAV && NAV.audioSession && NAV.audioSession.type !== 'playback') NAV.audioSession.type = 'playback'; } catch (e) { /* 不支援就算了 */ }
}
setSession();

let silentURL = null, silentEl = null, silentPlaying = false;
/** 程式產生 0.5 秒、8 kHz、8-bit 的無聲 WAV（128 = 無聲），回傳 Blob URL */
function silentWavURL() {
  if (silentURL) return silentURL;
  const n = 4000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  silentURL = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return silentURL;
}
/** 舊 iOS：在觸控裡播循環的無聲 <audio>（只建立一次；被暫停了就再播） */
function playSilentLoop() {
  if (!NEED_SILENT_LOOP || typeof document === 'undefined' || document.hidden) return;
  try {
    if (!silentEl) {
      silentEl = document.createElement('audio');
      silentEl.setAttribute('playsinline', ''); silentEl.setAttribute('webkit-playsinline', '');
      silentEl.playsInline = true; silentEl.loop = true; silentEl.muted = false; silentEl.preload = 'auto';
      silentEl.src = silentWavURL();
    }
    if (!silentEl.paused) return;
    const p = silentEl.play();
    if (p && p.then) p.then(() => { silentPlaying = true; }, () => { /* 還不算使用者手勢：下次觸控再試 */ });
    else silentPlaying = true;
  } catch (e) { /* 安靜略過 */ }
}
/** 喚醒 AudioContext（suspended／iOS 的 interrupted 都要 resume）；失敗安靜略過 */
function resumeCtx() {
  if (!ac || ac.state === 'running' || ac.state === 'closed') return;
  try { const p = ac.resume(); if (p && p.catch) p.catch(() => { /* 不是使用者手勢：下次再試 */ }); } catch (e) { /* 舊版 Safari */ }
}
/** 播 1 取樣的無聲緩衝區；AudioContext 還沒在跑之前，每次觸控都再播一次 */
function primeCtx() {
  if (primed) return;
  try {
    const b = ac.createBuffer(1, 1, 22050), s = ac.createBufferSource();
    s.buffer = b; s.connect(ac.destination); s.start(0);
    if (ac.state === 'running') primed = true;
  } catch (e) { /* 略過 */ }
}

function ensureContext() {
  if (ac) return ac;
  const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try {
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 6;
    comp.attack.value = .003; comp.release.value = .2;
    master = ac.createGain(); master.gain.value = .7;
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxOn ? 1 : 0;
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? .5 : 0;
    sfxBus.connect(master); musicBus.connect(master); master.connect(comp); comp.connect(ac.destination);
  } catch (e) { ac = null; }
  return ac;
}

// ---------------- 基本發聲 ----------------
function tone({ freq, type = 'sine', t = 0, dur = .3, vol = .2, attack = .004, freqEnd, glide = .6, out, vibrato = 0 }) {
  const now = ac.currentTime + t, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, now);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, now + dur * glide);
  if (vibrato) {
    const l = ac.createOscillator(), lg = ac.createGain();
    l.frequency.value = 6; lg.gain.value = freq * vibrato;
    l.connect(lg); lg.connect(o.frequency); l.start(now); l.stop(now + dur + .05);
  }
  g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + attack); g.gain.exponentialRampToValueAtTime(.0001, now + dur);
  o.connect(g); g.connect(out || sfxBus); o.start(now); o.stop(now + dur + .05);
}
let _noise = null;
function noiseBuf() {
  if (!_noise) {
    const len = ac.sampleRate * .6 | 0; _noise = ac.createBuffer(1, len, ac.sampleRate);
    const d = _noise.getChannelData(0); let seed = 7;
    for (let i = 0; i < len; i++) { seed = (seed * 16807) % 2147483647; d[i] = seed / 1073741823.5 - 1; }
  }
  return _noise;
}
function noise({ t = 0, dur = .2, vol = .2, type = 'bandpass', freq = 1200, freqEnd, q = .8, attack = .01, out }) {
  const now = ac.currentTime + t, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf(); f.type = type; f.frequency.setValueAtTime(freq, now); f.Q.value = q;
  if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, now + dur);
  g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + attack); g.gain.exponentialRampToValueAtTime(.0001, now + dur);
  s.connect(f); f.connect(g); g.connect(out || sfxBus); s.start(now); s.stop(now + dur + .05);
}
/** 鈴鐺：非整數倍泛音 */
function bell(f, t = 0, v = 1) {
  [[1, .2, 1.3], [2.01, .07, .85], [2.76, .09, .6], [4.07, .045, .35], [5.4, .03, .22]]
    .forEach(([m, vol, d]) => tone({ freq: f * m, t, dur: d, vol: vol * v, attack: .002 }));
}
/** 木琴：短促、帶一點泛音 */
function xylo(f, t = 0, v = 1) {
  tone({ freq: f, t, dur: .32, vol: .14 * v, attack: .002 });
  tone({ freq: f * 3.98, t, dur: .08, vol: .035 * v, attack: .001 });
  tone({ freq: f * 2, t, dur: .16, vol: .04 * v, attack: .002, type: 'triangle' });
}
/** 泡泡：音高往上滑的圓潤短音 */
function bubble(f, t = 0, v = 1) {
  tone({ freq: f, freqEnd: f * 2.1, t, dur: .15, vol: .2 * v });
  tone({ freq: f * 1.5, freqEnd: f * 2.9, t: t + .035, dur: .11, vol: .07 * v });
}
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// 五聲音階（C 大調），pop 依連鎖波數往上爬
const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96];

// ---------------- 狗叫 ----------------
let barkBuf = null, barkLoad = null;
function loadBark() {
  if (!ac) return Promise.resolve(null);
  if (!barkLoad) {
    barkLoad = fetch(BARK_URL)
      .then(r => { if (!r.ok) throw new Error('bark ' + r.status); return r.arrayBuffer(); })
      .then(buf => new Promise((ok, ng) => { const p = ac.decodeAudioData(buf, ok, ng); if (p && p.then) p.then(ok, ng); }))
      .then(b => { barkBuf = b; return b; })
      .catch(() => { barkBuf = null; return null; });
  }
  return barkLoad;
}
function synthBark(t) {
  const now = ac.currentTime + t;
  const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(320, now); o.frequency.linearRampToValueAtTime(390, now + .025); o.frequency.exponentialRampToValueAtTime(190, now + .17);
  f.type = 'bandpass'; f.frequency.setValueAtTime(950, now); f.frequency.exponentialRampToValueAtTime(480, now + .17); f.Q.value = 1.3;
  g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.55, now + .012); g.gain.exponentialRampToValueAtTime(.14, now + .09); g.gain.exponentialRampToValueAtTime(.0001, now + .21);
  o.connect(f); f.connect(g); g.connect(sfxBus); o.start(now); o.stop(now + .24);
  noise({ t, dur: .13, vol: .3, freq: 1300, q: .9, attack: .006 });
  tone({ freq: 170, freqEnd: 105, t, dur: .13, vol: .22 });
}
async function bark() {
  const b = barkBuf || await Promise.race([loadBark(), new Promise(r => setTimeout(() => r(null), 700))]);
  if (!ac) return;
  if (b) { const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = .95; s.connect(g); g.connect(sfxBus); s.start(); }
  else { synthBark(0); synthBark(.27); }
}

/** 小號角：鋸齒波＋低通濾波，濾波器打開一點點像吹氣 */
function horn(m, t, d, vol = .09) {
  const now = ac.currentTime + t, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
  o.type = 'sawtooth'; o.frequency.value = mtof(m);
  f.type = 'lowpass'; f.frequency.setValueAtTime(900, now); f.frequency.linearRampToValueAtTime(2200, now + .06); f.Q.value = .7;
  g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + .03); g.gain.setValueAtTime(vol, now + d * .7); g.gain.exponentialRampToValueAtTime(.0001, now + d);
  o.connect(f); f.connect(g); g.connect(sfxBus); o.start(now); o.stop(now + d + .05);
}

// ---------------- 音效表 ----------------
const SFX = {
  tap() { tone({ freq: 660, freqEnd: 900, dur: .09, vol: .07, type: 'triangle' }); },
  select() { bubble(880, 0, .45); },
  swap() { tone({ freq: 400, freqEnd: 640, dur: .13, vol: .08 }); },
  swapBack() { tone({ freq: 620, freqEnd: 420, dur: .12, vol: .08 }); tone({ freq: 520, freqEnd: 330, t: .11, dur: .14, vol: .07, vibrato: .02 }); },
  pop(o = {}) {
    const w = Math.max(1, Math.min(PENTA.length, o.wave || 1));
    const f = mtof(PENTA[w - 1]) / 2;
    bubble(f); xylo(mtof(PENTA[w - 1]), .01, .8);
    if (w >= 3) tone({ freq: mtof(PENTA[w - 1] + 12), t: .05, dur: .25, vol: .04, attack: .002 });
  },
  create() {
    [76, 79, 84, 88].forEach((m, i) => xylo(mtof(m), i * .055, .9));
    noise({ t: .2, dur: .35, vol: .05, type: 'highpass', freq: 6000, attack: .05 });
    bell(mtof(96), .22, .4);
  },
  paw() {
    noise({ dur: .32, vol: .2, freq: 500, freqEnd: 3200, q: 1.2, attack: .03 });
    tone({ freq: 180, freqEnd: 90, dur: .16, vol: .2 });
    tone({ freq: 660, freqEnd: 1320, t: .05, dur: .22, vol: .06, type: 'triangle' });
  },
  bomb() {
    tone({ freq: 150, freqEnd: 48, dur: .45, vol: .38, glide: .8 });
    noise({ dur: .45, vol: .22, type: 'lowpass', freq: 900, freqEnd: 200, q: .5, attack: .005 });
    [0, 1, 2, 3].forEach(i => bubble(500 + i * 130, .12 + i * .06, .5));
  },
  perfume() {
    noise({ dur: .4, vol: .14, type: 'highpass', freq: 3800, q: .5, attack: .03 });
    [88, 91, 93, 96, 100].forEach((m, i) => bell(mtof(m), .08 + i * .07, .35));
  },
  combo() {
    SFX.paw(); SFX.bomb();
    [72, 76, 79, 84].forEach(m => tone({ freq: mtof(m), t: .2, dur: .7, vol: .05, type: 'triangle', attack: .02 }));
  },
  snow() {
    noise({ dur: .12, vol: .1, type: 'highpass', freq: 5000, attack: .002 });
    noise({ t: .05, dur: .1, vol: .07, type: 'highpass', freq: 6500, attack: .002 });
    tone({ freq: mtof(98), t: .02, dur: .3, vol: .04, attack: .002 });
  },
  crate() {
    noise({ dur: .07, vol: .25, freq: 900, q: 2, attack: .002 });
    tone({ freq: 230, freqEnd: 170, dur: .12, vol: .18, type: 'triangle' });
    tone({ freq: 190, freqEnd: 140, t: .09, dur: .12, vol: .14, type: 'triangle' });
  },
  unlock() { tone({ freq: 300, freqEnd: 620, dur: .2, vol: .12, vibrato: .03 }); xylo(mtof(84), .12, .7); },
  honeySpread() { tone({ freq: 220, freqEnd: 120, dur: .35, vol: .14, glide: .9 }); noise({ dur: .25, vol: .05, type: 'lowpass', freq: 500, attack: .05 }); },
  baby() { [79, 84, 88].forEach((m, i) => bell(mtof(m), i * .1, .55)); tone({ freq: 520, freqEnd: 780, t: .32, dur: .2, vol: .06 }); },
  shuffle() { for (let i = 0; i < 6; i++) tone({ freq: 500 + (i % 2 ? 300 : 0), freqEnd: 900 - (i % 2 ? 300 : 0), t: i * .06, dur: .1, vol: .05, type: 'triangle' }); },
  // v1.2 蠟筆塗色：蠟筆來回塗的沙沙聲＋兩個輕快的木琴音（opts.wave 連鎖越高音越高）
  paint(o = {}) {
    [0, .06, .12, .18].forEach((t, i) => {
      const up = i % 2 === 0;
      noise({ t, dur: .06, vol: .1 - i * .012, freq: up ? 1700 : 2700, freqEnd: up ? 2700 : 1700, q: 1.6, attack: .008 });
    });
    const w = Math.max(1, Math.min(PENTA.length - 2, o.wave || 1));
    xylo(mtof(PENTA[w - 1]), .16, .42);
    xylo(mtof(PENTA[w + 1]), .23, .5);
    tone({ freq: mtof(PENTA[w + 1] + 12), t: .27, dur: .2, vol: .025, attack: .002 });
  },
  // v1.2 驚喜禮物盒：緞帶「咻～」拉開＋紙盒「啵」＋「叮」；opts.left > 0 表示只拆掉一層（沒有叮）
  gift(o = {}) {
    noise({ dur: .22, vol: .1, freq: 1200, freqEnd: 4200, q: 1.4, attack: .02 });
    noise({ t: .1, dur: .12, vol: .05, type: 'highpass', freq: 3200, attack: .01 });
    tone({ freq: 520, freqEnd: 300, t: .03, dur: .09, vol: .05, type: 'triangle' });
    if (o.left > 0) return;
    bubble(560, .18, .6);
    bell(mtof(93), .24, .55);
    [96, 100, 103].forEach((m, i) => tone({ freq: mtof(m), t: .32 + i * .05, dur: .22, vol: .028, attack: .002 }));
  },
  // v1.2 拿到金色限定：小號角「噠噠噠——」＋閃亮亮的鈴聲往上撒
  reward() {
    horn(79, 0, .1, .08); horn(79, .1, .1, .08); horn(84, .2, .75, .085); horn(76, .2, .75, .045);
    [91, 96, 100, 103].forEach((m, i) => bell(mtof(m), .3 + i * .08, .35));
    noise({ t: .25, dur: .8, vol: .045, type: 'highpass', freq: 7000, attack: .12 });
  },
  win() {
    horn(67, 0, .16); horn(72, .16, .16); horn(76, .32, .16); horn(79, .48, .6);
    bell(mtof(91), .5, .7); bell(mtof(96), .66, .5);
  },
  lose() {
    [67, 64, 60].forEach((m, i) => tone({ freq: mtof(m), freqEnd: mtof(m) * .97, t: i * .26, dur: i === 2 ? .7 : .3, vol: .1, type: 'triangle', vibrato: i === 2 ? .015 : 0 }));
  },
  star(o = {}) {
    const n = Math.max(1, Math.min(3, o.n || 1));
    const m = [84, 88, 91][n - 1];
    bell(mtof(m), 0, .9); xylo(mtof(m + 12), .03, .5);
    noise({ t: .05, dur: .3, vol: .04, type: 'highpass', freq: 7000, attack: .03 });
  },
  buy() { bell(mtof(83), 0, .7); bell(mtof(88), .1, .8); tone({ freq: 1200, freqEnd: 2000, t: .02, dur: .08, vol: .05, type: 'square' }); },
  equip() { noise({ dur: .18, vol: .08, freq: 1800, freqEnd: 3500, q: 1, attack: .04 }); xylo(mtof(88), .1, .6); },
  page() { noise({ dur: .09, vol: .07, freq: 2200, q: .7, attack: .01 }); noise({ t: .06, dur: .08, vol: .05, freq: 3000, q: .7, attack: .01 }); },
  bell() { bell(1760, 0); bell(1318.5, .17); },
  spray(o = {}) { noise({ t: o.t || 0, dur: .32, vol: .13, type: 'highpass', freq: 3800, q: .5, attack: .03 }); },
  bark() { bark(); },
  sneeze() {
    // 「哈——」：吸氣上揚
    noise({ dur: .26, vol: .06, freq: 900, freqEnd: 1700, q: 1.5, attack: .15 });
    tone({ freq: 380, freqEnd: 620, dur: .26, vol: .05, glide: 1, type: 'triangle', attack: .12 });
    // 「啾！」：短促
    noise({ t: .3, dur: .14, vol: .22, type: 'highpass', freq: 2600, q: .6, attack: .004 });
    tone({ freq: 950, freqEnd: 480, t: .3, dur: .14, vol: .09, type: 'triangle', attack: .004 });
  },
  lick() {
    noise({ dur: .08, vol: .1, freq: 1800, freqEnd: 3200, q: 3, attack: .01 });
    tone({ freq: 700, freqEnd: 1100, t: .01, dur: .06, vol: .04 });
    noise({ t: .1, dur: .06, vol: .06, freq: 2000, freqEnd: 3400, q: 3, attack: .01 });
  },
};

// ---------------- 音樂（音樂盒，lookahead 排程） ----------------
// 曲譜：每格一個八分音符。音名如 A5、Bb4、F#5；'-' 表示休止／延續。
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parse(str) {
  return str.trim().split(/\s+/).map(tok => {
    if (tok === '-') return null;
    const m = /^([A-G])([b#]?)(\d)$/.exec(tok);
    if (!m) return null;
    return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  });
}
const TRACKS = {
  // 溫柔：F 大調，F–Dm–Bb–C，兩段
  home: {
    bpm: 84, loop: true, vol: .9,
    mel: parse(`A5 - C6 - A5 G5 F5 -   F5 - A5 - D6 - C6 -   D6 - C6 A5 Bb5 - A5 -   G5 - E5 - G5 - C6 -
                A5 - C6 - F6 - E6 D6   C6 - A5 - D6 - F5 -   G5 - Bb5 - A5 - G5 -   F5 - - - - - - -`),
    bass: parse(`F3 - - - C4 - - -   D3 - - - A3 - - -   Bb2 - - - F3 - - -   C3 - - - G3 - - -
                 F3 - - - C4 - - -   D3 - - - A3 - - -   Bb2 - - - C3 - - -   F3 - C4 - F3 - - -`),
  },
  // 輕快：C 大調，C–Am–F–G
  map: {
    bpm: 112, loop: true, vol: .8,
    mel: parse(`E5 G5 C6 G5 E5 - G5 -   A5 C6 E6 C6 A5 - - -   F5 A5 C6 A5 F5 - A5 -   G5 B5 D6 - B5 - G5 -
                E5 G5 C6 G5 E6 - D6 -   C6 - A5 - E5 - A5 -   F5 - A5 - C6 - D6 -   C6 - - - G5 - - -`),
    bass: parse(`C3 - G3 - C3 - G3 -   A2 - E3 - A2 - E3 -   F2 - C3 - F2 - C3 -   G2 - D3 - G2 - D3 -
                 C3 - G3 - C3 - G3 -   A2 - E3 - A2 - E3 -   F2 - C3 - G2 - D3 -   C3 - G3 - C3 - - -`),
  },
  // 關卡：G 大調，稀疏、音量小，不搶音效
  level: {
    bpm: 100, loop: true, vol: .55,
    mel: parse(`B5 - - D6 - - G5 -   - - A5 - B5 - - -   C6 - - B5 - - A5 -   - - G5 - A5 - - -
                B5 - - D6 - - G6 -   - - F#6 - E6 - - -   D6 - - B5 - - A5 -   - - G5 - - - - -`),
    bass: parse(`G3 - D4 - G3 - D4 -   E3 - B3 - E3 - B3 -   C3 - G3 - C3 - G3 -   D3 - A3 - D3 - A3 -
                 G3 - D4 - G3 - D4 -   E3 - B3 - E3 - B3 -   C3 - G3 - D3 - A3 -   G3 - D4 - G3 - - -`),
  },
  // v1.2 第 5 章「熊熊上學去」：C 大調、輕快；開頭是學校鐘聲「噹噹噹噹」，高八度用鈴聲（alt）疊一層
  level_ch5: {
    bpm: 108, loop: true, vol: .5, altVol: .4,
    mel: parse(`E5 - C5 - D5 - G4 -   G4 - D5 - E5 - C5 -   E5 G5 - E5 F5 - D5 -   E5 - C5 - - - - -
                A5 - G5 - E5 - G5 -   F5 - D5 - F5 A5 G5 -   E5 - D5 - C5 - D5 -   C5 - - - - - - -`),
    alt: parse(`E6 - C6 - D6 - G5 -   G5 - D6 - E6 - C6 -   - - - - - - - -   - - - - G6 - - -
                - - - - - - - -   - - - - - - - -   - - - - - - - -   - - - - G6 - - -`),
    bass: parse(`C3 - G3 - C3 - G3 -   G2 - D3 - C3 - G3 -   C3 - G3 - G2 - D3 -   C3 - G3 - E3 - G3 -
                 A2 - E3 - C3 - G3 -   F2 - C3 - G2 - D3 -   C3 - G3 - G2 - D3 -   C3 - G3 - C3 - - -`),
  },
  // v1.2 第 6 章「熊熊遊樂園」：F 大調旋轉木馬華爾滋（3/4 拍，每小節 6 格），低音「蹦－恰－恰」
  level_ch6: {
    bpm: 150, loop: true, vol: .5, altVol: .35, bassDur: .45,
    mel: parse(`A5 - - - C6 -   F6 - - - E6 -   D6 - C6 - Bb5 -   G5 - - - - -
                G5 - - - Bb5 -   E6 - - - D6 -   C6 - A5 - G5 -   F5 - - - - -
                D6 - - - F6 -   D6 - Bb5 - D6 -   C6 - - - A5 -   F5 - A5 - C6 -
                Bb5 - - - G5 -   C6 - Bb5 - G5 -   E5 - - - G5 -   F5 - - - - -`),
    alt: parse(`- - - - - -   - - - - - -   - - - - - -   - - G6 - C7 -
                - - - - - -   - - - - - -   - - - - - -   - - A6 - F6 -
                - - - - - -   - - - - - -   - - - - - -   - - A6 - C7 -
                - - - - - -   - - - - - -   - - - - - -   - - C7 - A6 -`),
    bass: parse(`F2 - A3 - C4 -   F2 - A3 - C4 -   G2 - Bb3 - D4 -   C3 - Bb3 - E4 -
                 C3 - Bb3 - E4 -   C3 - Bb3 - E4 -   F2 - A3 - C4 -   F2 - A3 - C4 -
                 Bb2 - Bb3 - D4 -   Bb2 - Bb3 - D4 -   F2 - A3 - C4 -   F2 - A3 - C4 -
                 C3 - Bb3 - E4 -   C3 - Bb3 - E4 -   C3 - Bb3 - E4 -   F2 - A3 - C4 -`),
  },
  // 勝利：短曲只播一次
  win: {
    bpm: 132, loop: false, vol: 1,
    mel: parse(`C5 E5 G5 C6 - E6 - G6   - - E6 - G6 - - -   C7 - - - - - - -`),
    bass: parse(`C3 - - - G3 - - -   F3 - - - G3 - - -   C3 - - - - - - -`),
  },
};

/** 音樂盒音色：正弦＋泛音、快起慢收 */
function musicBox(f, t, vol, out) {
  const d = 1.5;
  tone({ freq: f, t, dur: d, vol: vol, attack: .003, out });
  tone({ freq: f * 2, t, dur: d * .6, vol: vol * .28, attack: .003, out });
  tone({ freq: f * 3, t, dur: d * .3, vol: vol * .08, attack: .002, out });
  tone({ freq: f * 4.2, t, dur: .12, vol: vol * .05, attack: .001, out });
}
function softBass(f, t, vol, out, dur = .8) {
  tone({ freq: f, t, dur, vol: vol, type: 'triangle', attack: .01, out });
}
/** 小鈴聲（音樂用，接在曲子自己的 bus 上） */
function chime(f, t, vol, out) {
  [[1, 1, 1.2], [2.76, .25, .5], [5.4, .08, .25]]
    .forEach(([m, v, d]) => tone({ freq: f * m, t, dur: d, vol: vol * v, attack: .002, out }));
}
// 對外的曲名；level 可以帶 { chapter } 換成該章變奏（TRACKS 裡的 level_ch5、level_ch6）
const PUBLIC_TRACKS = ['home', 'map', 'level', 'win'];
function resolveTrack(track, opts) {
  if (!PUBLIC_TRACKS.includes(track)) return null;
  if (track === 'level' && opts && opts.chapter != null) {
    const key = 'level_ch' + Number(opts.chapter);
    if (has(TRACKS, key)) return key;
  }
  return track;
}

const LOOKAHEAD = .15;   // 往前排多少秒
const TICK_MS = 30;
let player = null;       // { name, track, bus, step, nextTime, timer }
let wantTrack = null;    // 想播的曲子（還沒解鎖、或音樂關掉時記住）
let activeTimers = 0;    // 測試用：目前活著的排程 timer 數

function schedule(p) {
  if (!ac || player !== p) return;
  const now = ac.currentTime;
  const stepDur = 60 / p.track.bpm / 2;
  if (p.nextTime < now - .2) p.nextTime = now + .05; // 背景暫停回來，避免一次補一大串
  while (p.nextTime < now + LOOKAHEAD) {
    const len = p.track.mel.length;
    if (p.step >= len) {
      if (p.track.loop) p.step = 0;
      else { stopPlayer(p, 1.2); if (wantTrack === p.name) wantTrack = null; return; }
    }
    const tr = p.track, m = tr.mel[p.step], b = tr.bass[p.step], a = tr.alt ? tr.alt[p.step] : null;
    const v = tr.vol, dt = p.nextTime - now;
    if (m != null) musicBox(mtof(m), dt, .1 * v, p.bus);
    if (a != null) chime(mtof(a), dt, .1 * v * (tr.altVol || .4), p.bus);
    if (b != null) softBass(mtof(b), dt, .07 * v, p.bus, tr.bassDur);
    p.step++;
    p.nextTime += stepDur;
  }
  p.timer = setTimeout(() => { activeTimers--; p.timer = null; schedule(p); }, TICK_MS);
  activeTimers++;
}
function stopPlayer(p, fade = .6) {
  if (!p) return;
  if (p.timer) { clearTimeout(p.timer); p.timer = null; activeTimers--; }
  try {
    const now = ac.currentTime;
    p.bus.gain.cancelScheduledValues(now);
    p.bus.gain.setValueAtTime(p.bus.gain.value, now);
    p.bus.gain.linearRampToValueAtTime(0, now + fade);
    setTimeout(() => { try { p.bus.disconnect(); } catch (e) { /* 已斷開 */ } }, (fade + 2) * 1000);
  } catch (e) { /* 略過 */ }
  if (player === p) player = null;
}
function startPlayer(name) {
  const track = has(TRACKS, name) ? TRACKS[name] : null;
  if (!track || !ac) return;
  if (player && player.name === name) return;
  if (player) stopPlayer(player, .6);
  const bus = ac.createGain();
  const now = ac.currentTime;
  bus.gain.setValueAtTime(0, now);
  bus.gain.linearRampToValueAtTime(1, now + .8);
  bus.connect(musicBus);
  const p = { name, track, bus, step: 0, nextTime: now + .1, timer: null };
  player = p;
  schedule(p);
}

// ---------------- 對外 API ----------------
const audio = {
  /** 觸控／點擊時呼叫（main.js 在 pointerdown、touchend、pointerup、click 都會叫）：可以重複呼叫，不會重複建立東西 */
  unlock() {
    setSession();
    if (!ensureContext()) return;
    resumeCtx();          // suspended／interrupted 都再 resume
    primeCtx();
    playSilentLoop();
    if (!unlocked) { unlocked = true; loadBark(); }
    if (wantTrack && musicOn && !player) startPlayer(wantTrack);
  },
  sfx(name, opts) {
    if (!sfxOn || !ac || !unlocked) return;
    if (!has(SFX, name) || typeof SFX[name] !== 'function') { missing.add(String(name)); return; }   // 沒有的音效：安靜略過
    try { SFX[name](opts || {}); } catch (e) { console.warn('音效錯誤', name, e); }
  },
  setSfx(on) {
    sfxOn = !!on;
    if (sfxBus) { const now = ac.currentTime; sfxBus.gain.cancelScheduledValues(now); sfxBus.gain.setValueAtTime(sfxOn ? 1 : 0, now); }
  },
  setMusic(on) {
    musicOn = !!on;
    if (!ac) return;
    const now = ac.currentTime;
    musicBus.gain.cancelScheduledValues(now);
    musicBus.gain.setValueAtTime(musicOn ? .5 : 0, now);
    if (!musicOn) { if (player) stopPlayer(player, .05); }
    else if (unlocked && wantTrack && !player) startPlayer(wantTrack);
  },
  /** track：'home' | 'map' | 'level' | 'win'；opts.chapter（只對 level 有用）：5、6 有自己的變奏，其他章照舊 */
  playMusic(track, opts) {
    const key = resolveTrack(track, opts);
    if (!key) { missing.add(String(track)); return; }   // 沒有的曲子：安靜略過
    wantTrack = key;
    if (ac && unlocked && musicOn) startPlayer(key);
  },
  stopMusic() {
    wantTrack = null;
    if (player) stopPlayer(player, .6);
  },
  /** 測試用 */
  _debug: () => ({ unlocked, state: ac && ac.state, track: player && player.name, wantTrack, activeTimers, sfxOn, musicOn, barkLoaded: !!barkBuf,
    primed, missing: [...missing], ios: IS_IOS, needSilentLoop: NEED_SILENT_LOOP, silentLoop: !!silentEl && !silentEl.paused, silentPlaying,
    audioSession: NAV && NAV.audioSession ? NAV.audioSession.type : null,
    trackLens: Object.fromEntries(Object.entries(TRACKS).map(([k, t]) => [k, [t.mel.length, t.bass.length, t.alt ? t.alt.length : null]])) }),
  SFX_NAMES: Object.keys(SFX),
  TRACK_NAMES: PUBLIC_TRACKS.slice(),
  LEVEL_CHAPTERS: Object.keys(TRACKS).filter(k => k.startsWith('level_ch')).map(k => Number(k.slice(8))),
};

// 切到背景時暫停，回來再繼續（省電，也避免 iOS 背景卡音）
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ac || !unlocked) return;
    if (document.hidden) {
      try { const p = ac.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 略過 */ }
      try { if (silentEl && !silentEl.paused) silentEl.pause(); } catch (e) { /* 略過 */ }
    } else {
      resumeCtx();
      if (silentEl) playSilentLoop();   // 舊 iOS：回來後再播無聲循環（不行的話下次觸控再試）
    }
  });
}

export default audio;
