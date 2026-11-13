// 棋盤美術（B1 擁有）：36 種物件、特殊道具、障礙（含 v1.2 塗色、禮物盒）、熊寶寶、小門、六章主題。
// 全部回傳完整 SVG 字串（含 xmlns；物件 viewBox 0 0 100 100），可直接當 data:image/svg+xml 圖片載入。
// 每次呼叫都用 uid() 產生新的漸層 id，同頁多個 SVG 不會互相覆蓋。
// 畫風照 style/index_v2.html：粉彩馬卡龍 Q 版、同色系深色粗圓描邊、豆豆眼＋腮紅、左上亮面。
import { face, shine, dot, shadow, sparkle, star5, hexPath, heartPath, svg, uid, INK, SW } from './common.js';

// ---------- 色系（每種：漸層上 a、漸層下 b、描邊 s、主色 m、淺色 l） ----------
const P = {
  yellow: { a: '#FFE69C', b: '#FFC24C', s: '#D99A2B', m: '#FFC94D', l: '#FFF0C4' },
  peach:  { a: '#FFC3A0', b: '#FF9162', s: '#E2794A', m: '#FF9A6B', l: '#FFE2D0' },
  pink:   { a: '#FFB8CC', b: '#FF84A8', s: '#E0608A', m: '#FF8FB0', l: '#FFE1EA' },
  lav:    { a: '#D6C8FA', b: '#A189EA', s: '#7A62C6', m: '#A98FEA', l: '#EEE8FF' },
  milk:   { a: '#F1D3B2', b: '#DDB089', s: '#A9744E', m: '#C99A73', l: '#F7E6D3' },
  mint:   { a: '#CDF3D6', b: '#8ED8A2', s: '#4FA06A', m: '#7DD39A', l: '#E3F6E8' },
  sky:    { a: '#D6EEFD', b: '#8CC8F0', s: '#4E8FC4', m: '#8CC6EE', l: '#E8F4FD' },
  cocoa:  { a: '#D8A985', b: '#A86F47', s: '#74472D', m: '#A8754E', l: '#EED5C0' },
};

/** 一張圖的漸層登記簿：lg() 回傳 url(#id)，最後 wrap() 把 defs 包進去 */
function ctx() {
  const defs = [];
  return {
    lg(c1, c2, x2 = 0, y2 = 1) {
      const id = uid('t');
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`);
      return `url(#${id})`;
    },
    /** 多段線性漸層：stops = [[offset, color], ...] */
    lgN(stops, x2 = 0, y2 = 1) {
      const id = uid('t');
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
      return `url(#${id})`;
    },
    rg(c1, c2, o1 = 1, o2 = 0) {
      const id = uid('t');
      defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="${c1}" stop-opacity="${o1}"/><stop offset="1" stop-color="${c2}" stop-opacity="${o2}"/></radialGradient>`);
      return `url(#${id})`;
    },
    clip(inner) {
      const id = uid('t');
      defs.push(`<clipPath id="${id}">${inner}</clipPath>`);
      return `url(#${id})`;
    },
    pattern(w, h, inner) {
      const id = uid('t');
      defs.push(`<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${inner}</pattern>`);
      return `url(#${id})`;
    },
    wrap(inner, vb = '0 0 100 100') { return svg((defs.length ? `<defs>${defs.join('')}</defs>` : '') + inner, vb); },
  };
}
const grad = (g, c) => g.lg(c.a, c.b);

// ---------- 色彩小工具（香水瓶換色用） ----------
function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(x => x + x).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  let hh = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    hh /= 6;
  }
  return [hh, s, l];
}
function hslToHex(h, s, l) {
  const f = n => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}
/** 調整亮度：dl 為 -1～1 的增量 */
function shade(hex, dl, ds = 0) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.max(0, Math.min(1, s + ds)), Math.max(0, Math.min(1, l + dl)));
}

// =====================================================================
// 36 種物件
// =====================================================================
const ART = {};

// ---------- 第 1 章 森林早餐（沿用樣張） ----------
ART.honey = g => {
  const ging = g.pattern(10, 10, `<rect width="10" height="10" fill="#FFE8EE"/><rect width="5" height="10" fill="#FFAFC4" opacity=".6"/><rect width="10" height="5" fill="#FFAFC4" opacity=".6"/>`);
  return shadow() +
    `<path d="M19 52 Q19 36 33 35 L67 35 Q81 36 81 52 L81 73 Q81 91 62 91 L38 91 Q19 91 19 73 Z" fill="${grad(g, P.yellow)}" stroke="#D99A2B" stroke-width="5" ${SW}/>` +
    `<rect x="27" y="26" width="46" height="12" rx="6" fill="#FFF0C4" stroke="#D99A2B" stroke-width="4.5"/>` +
    `<path d="M36 34 Q35 47 40.5 47.5 Q46 47.5 45 36 Z" fill="#FFB52E" stroke="#D99A2B" stroke-width="3" ${SW}/>` +
    `<path d="M20 29 Q22 9 50 8 Q78 9 80 29 Q73 34 65 30 Q57.5 35 50 30 Q42.5 35 35 30 Q27 34 20 29 Z" fill="${ging}" stroke="#E36E93" stroke-width="4" ${SW}/>` +
    `<path d="M25 31.5 Q50 37 75 31.5" fill="none" stroke="#FF8FAB" stroke-width="4.5" stroke-linecap="round"/>` +
    shine(27, 58, 4.2, 9, 8) + dot(28, 74, 2.4) + shine(32, 15, 5, 2.4, -18, .7) +
    face(52, 62, 1.02);
};
ART.salmon = g =>
  shadow(48, 92, 30) +
  `<path d="M74 51 Q83 40 91 31 Q98 36 95.5 51 Q98 66 91 71 Q83 62 74 51 Z" fill="#FFA273" stroke="#E2794A" stroke-width="5" ${SW}/>` +
  `<path d="M38 31 Q47 14 61 29" fill="#FFBE98" stroke="#E2794A" stroke-width="4.5" ${SW}/>` +
  `<path d="M9 52 C9 35 30 26 51 28 C66 29.5 76 39 80 50 C76 63 66 72 51 73 C30 75 9 68 9 52 Z" fill="${g.lg('#FFB98F', '#FF915F')}" stroke="#E2794A" stroke-width="5" ${SW}/>` +
  `<path d="M17 61 C27 70 50 72 70 63 C62 71 52 73.5 42 73 C30 72.5 21 68 17 61 Z" fill="#FFE2D0" opacity=".95"/>` +
  `<circle cx="58" cy="37" r="2" fill="#E9875B"/><circle cx="66" cy="42" r="1.7" fill="#E9875B"/><circle cx="64.5" cy="34.5" r="1.4" fill="#E9875B"/>` +
  shine(24, 38, 6.5, 3.4, -24) + dot(16, 46, 1.8) +
  face(36, 50, .95);
ART.straw = g => {
  let leaves = '';
  [200, 246, 294, 340].forEach(a => {
    const r = a * Math.PI / 180, cx = 50 + Math.cos(r) * 10, cy = 31 + Math.sin(r) * 8;
    leaves += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="10" ry="5" fill="#93D9A5" stroke="#4FA06A" stroke-width="3.2" transform="rotate(${a} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`;
  });
  const seeds = [[31, 44], [69, 44], [23, 57], [77, 57], [37, 77], [63, 77], [50, 83]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.6" fill="#FFF4C8"/>`).join('');
  return shadow(50, 94, 24) +
    `<path d="M50 89 C29 85 14 65 17 47 C19 33 34 27 50 31 C66 27 81 33 83 47 C86 65 71 85 50 89 Z" fill="${g.lg('#FFB2C8', '#FF84A8')}" stroke="#E0608A" stroke-width="5" ${SW}/>` +
    seeds + leaves +
    `<path d="M50 29 Q50 19 56 13" fill="none" stroke="#4FA06A" stroke-width="4.2" stroke-linecap="round"/>` +
    shine(25, 52, 3.6, 7.5, 22) +
    face(50, 58, 1.02);
};
ART.blue = g => {
  const b = g.lg('#CDBDF8', '#A189EA');
  return shadow(48, 94, 28) +
    `<circle cx="73" cy="31" r="15.5" fill="${b}" stroke="#7A62C6" stroke-width="4.5"/>` +
    `<path d="${star5(73, 19, 6, 2.8)}" fill="#8E76D8" stroke="#6A53B6" stroke-width="2.2" ${SW}/>` +
    shine(66, 26, 2.6, 4.4, 25, .5) +
    `<circle cx="45" cy="58" r="31" fill="${b}" stroke="#7A62C6" stroke-width="5"/>` +
    `<path d="${star5(45, 30, 8.5, 3.8)}" fill="#8E76D8" stroke="#6A53B6" stroke-width="2.6" ${SW}/>` +
    `<circle cx="45" cy="30.5" r="2" fill="#5E47A8"/>` +
    shine(27, 50, 4.5, 9, 25, .55) + dot(30, 67, 2.2, .6) +
    face(46, 62, 1.02);
};
ART.acorn = g => {
  let marks = '';
  [[31, 31], [43, 28], [57, 28], [69, 31], [25, 41], [37, 39], [50, 38], [63, 39], [75, 41]].forEach(([x, y]) => {
    marks += `<path d="M${x - 4} ${y - 1.8} L${x} ${y + 2} L${x + 4} ${y - 1.8}" fill="none" stroke="#8F6040" stroke-width="2" opacity=".55" ${SW}/>`;
  });
  return shadow(50, 94, 22) +
    `<path d="M24 45 C24 70 36 88 50 91 C64 88 76 70 76 45 Z" fill="${g.lg('#F1D3B2', '#DDB089')}" stroke="#A9744E" stroke-width="5" ${SW}/>` +
    `<path d="M50 22 Q49 12 56 7" fill="none" stroke="#8A5A3C" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M16 44 Q16 20 50 19 Q84 20 84 44 Q84 52 50 51 Q16 52 16 44 Z" fill="${g.lg('#C99C76', '#AA7853')}" stroke="#8A5A3C" stroke-width="5" ${SW}/>` +
    marks +
    shine(30, 27, 5.5, 2.6, -25, .4) + shine(33, 62, 3.4, 7, 10) +
    face(50, 66, .95);
};
ART.apple = g =>
  shadow(50, 94, 26) +
  `<path d="M50 30 Q49 20 54 12" fill="none" stroke="#9A6A48" stroke-width="5" stroke-linecap="round"/>` +
  `<path d="M55 21 Q63 7 79 12 Q71 27 55 21 Z" fill="#82CF96" stroke="#4E9F66" stroke-width="3.5" ${SW}/>` +
  `<path d="M58 19.5 Q67 15 75 13.5" fill="none" stroke="#4E9F66" stroke-width="2" stroke-linecap="round" opacity=".7"/>` +
  `<path d="M50 33 C40 24 21 26 17 44 C13 62 25 86 41 88.5 C45.5 89 48 87 50 86 C52 87 54.5 89 59 88.5 C75 86 87 62 83 44 C79 26 60 24 50 33 Z" fill="${g.lg('#C8F2D2', '#90D9A4')}" stroke="#5AAE76" stroke-width="5" ${SW}/>` +
  shine(29, 47, 4.6, 8.5, 24) + dot(26, 63, 2.2, .7) +
  face(50, 60, 1.02);

// ---------- 第 2 章 熊熊衣櫥 ----------
// 蝴蝶結（粉紅）：寬寬的左右兩個耳朵＋垂下來的兩條尾巴，臉在中間的結上
ART.bow = g => {
  const c = P.pink, f = grad(g, c);
  const loopL = `M42 43 C31 28 11 22 7 38 C4 52 9 69 25 68 C34 67.5 39 60 42 56 Z`;
  const loopR = `M58 43 C69 28 89 22 93 38 C96 52 91 69 75 68 C66 67.5 61 60 58 56 Z`;
  const tailL = `M45 60 C41 70 35 80 30 89 L39.5 85 L44 92 C47.5 81 49.5 71 50 63 Z`;
  const tailR = `M55 60 C59 70 65 80 70 89 L60.5 85 L56 92 C52.5 81 50.5 71 50 63 Z`;
  const dots = [[20, 40], [15, 54], [27, 56], [80, 40], [85, 54], [73, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" opacity=".75"/>`).join('');
  return shadow(50, 94, 22) +
    `<path d="${tailL}" fill="${f}" stroke="${c.s}" stroke-width="4.5" ${SW}/><path d="${tailR}" fill="${f}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="${loopL}" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/><path d="${loopR}" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M38 47 C30 39 20 36 16 44" fill="none" stroke="#E86E95" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
    `<path d="M62 47 C70 39 80 36 84 44" fill="none" stroke="#E86E95" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
    dots + shine(14, 34, 3, 5.5, 30, .7) +
    `<rect x="35" y="35" width="30" height="31" rx="12" fill="${g.lg('#FFC9D8', '#FF95B4')}" stroke="${c.s}" stroke-width="5"/>` +
    shine(41, 41, 3, 1.8, -20, .8) +
    face(50, 49, .66);
};
// 毛線帽（薰衣草紫）：圓頂＋毛球＋針織反摺帽緣，臉在帽頂
ART.knitHat = g => {
  const c = P.lav;
  let ribs = '';
  for (let x = 22; x <= 78; x += 7) ribs += `<path d="M${x} 66 L${x} 82" stroke="#B9A6F0" stroke-width="2.6" stroke-linecap="round"/>`;
  let knit = '';
  [[30, 38], [70, 38], [24, 52], [76, 52]].forEach(([x, y]) => { knit += `<path d="M${x - 3.5} ${y - 2.5} L${x} ${y + 2} L${x + 3.5} ${y - 2.5}" fill="none" stroke="#8C74D6" stroke-width="2" opacity=".5" ${SW}/>`; });
  const pom = [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a * Math.PI / 180; return `<circle cx="${(50 + Math.cos(r) * 8).toFixed(1)}" cy="${(15 + Math.sin(r) * 8).toFixed(1)}" r="5" fill="#F3EEFF"/>`; }).join('');
  return shadow(50, 94, 30) +
    `<circle cx="50" cy="15" r="12.5" fill="#F3EEFF" stroke="${c.s}" stroke-width="4"/>` + pom +
    `<circle cx="47" cy="12" r="2.4" fill="#fff"/>` +
    `<path d="M17 68 C15 40 31 24 50 24 C69 24 85 40 83 68 Z" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    knit +
    `<rect x="12" y="62" width="76" height="24" rx="12" fill="${g.lg('#E9E1FF', '#CBBDF7')}" stroke="${c.s}" stroke-width="5"/>` + ribs +
    shine(29, 40, 3.6, 7.5, 28) +
    face(50, 49, .95);
};
// 圍巾（薄荷綠）：圍成一圈的條紋圍巾＋垂下兩條流蘇尾巴
ART.scarf = g => {
  const c = P.mint, f = grad(g, c);
  const ring = `M13 44 A37 22 0 1 0 87 44 A37 22 0 1 0 13 44 Z M31 40 A19 8.5 0 1 1 69 40 A19 8.5 0 1 1 31 40 Z`;
  const cl = g.clip(`<path d="${ring}" fill-rule="evenodd"/>`);
  let stripes = '';
  for (let x = 6; x < 100; x += 15) stripes += `<path d="M${x} 16 Q${x + 6} 44 ${x - 2} 72" stroke="#F2FFF5" stroke-width="5" fill="none" opacity=".9"/>`;
  const fringe = (x0, y0, x1, y1) => { let s = ''; for (let i = 0; i <= 3; i++) { const t = i / 3, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l0 6" stroke="${c.s}" stroke-width="2.6" stroke-linecap="round"/>`; } return s; };
  return shadow(50, 94, 30) +
    `<path d="${ring}" fill-rule="evenodd" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<g clip-path="${cl}">${stripes}</g>` +
    `<path d="${ring}" fill-rule="evenodd" fill="none" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M57 56 L55 84 Q61 86.5 67 84 L68 57 Z" fill="${f}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M55.6 74 Q61 76 67.4 74" stroke="#F2FFF5" stroke-width="4" fill="none"/>` +
    `<path d="M67 54 L74 81 Q80 82 85.5 79 L77 51 Z" fill="${f}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M71.5 70 Q77 70.5 82.5 68" stroke="#F2FFF5" stroke-width="4" fill="none"/>` +
    fringe(56, 86, 66, 86) + fringe(75, 82.5, 85, 80) +
    shine(22, 37, 3, 6, 40, .7) +
    face(37, 55.5, .74);
};
// 小雨靴（蜂蜜黃）：側面的胖胖雨靴，L 形剪影
ART.boots = g => {
  const c = P.yellow;
  return shadow(56, 94, 34) +
    `<path d="M25 22 L61 22 L61 60 Q61 65 66 66 L80 68 Q93 70 93 81 L93 84 Q93 90 86 90 L28 90 Q20 90 20 83 L20 27 Q20 22 25 22 Z" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M21 82 L92 82" stroke="${c.s}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M22.5 84 L91 84 Q91 88 86 88 L28 88 Q23 88 22.5 84 Z" fill="#F0A93A"/>` +
    `<rect x="15" y="12" width="51" height="15" rx="7.5" fill="#FFF0C4" stroke="${c.s}" stroke-width="4.5"/>` +
    `<path d="M15.5 15 Q10 13 9 20" fill="none" stroke="${c.s}" stroke-width="3.5" stroke-linecap="round"/>` +
    `<path d="${heartPath(80, 75.5, 4.2)}" fill="#FF8FB0" stroke="#E0608A" stroke-width="1.8"/>` +
    `<circle cx="24" cy="20" r="2" fill="#fff" opacity=".9"/>` +
    shine(27, 42, 3.6, 8, 8) +
    face(41, 47, .95);
};
// 吊帶褲（天空藍）：胸前一塊＋兩條吊帶＋兩隻褲管
ART.dungarees = g => {
  const c = P.sky, f = grad(g, c);
  return shadow(50, 95, 30) +
    `<path d="M33 34 L27 9" stroke="${c.s}" stroke-width="10" stroke-linecap="round"/><path d="M33 34 L27 9" stroke="#A9D7F5" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M67 34 L73 9" stroke="${c.s}" stroke-width="10" stroke-linecap="round"/><path d="M67 34 L73 9" stroke="#A9D7F5" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M17 54 L83 54 L86 87 Q86 92 81 92 L58 92 Q55 92 54.5 88 L52.5 73 Q50 68.5 47.5 73 L45.5 88 Q45 92 42 92 L19 92 Q14 92 14 87 Z" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M16 83 L44.5 83 M55.5 83 L84.5 83" stroke="#E8F4FD" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M27 58 L27 33 Q27 29 31 29 L69 29 Q73 29 73 33 L73 58 Z" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<circle cx="32.5" cy="34.5" r="3.6" fill="#FFD36E" stroke="#D99A2B" stroke-width="2"/><circle cx="67.5" cy="34.5" r="3.6" fill="#FFD36E" stroke="#D99A2B" stroke-width="2"/>` +
    `<path d="${heartPath(71, 70, 4.5)}" fill="#FF9EB5" stroke="#E0608A" stroke-width="1.8"/>` +
    shine(21, 66, 2.6, 6, 6) + shine(33, 41, 2.2, 3.6, 10, .55) +
    face(50, 43.5, .82);
};
// 小圍裙（蜜桃橘）：掛脖帶＋胸片＋荷葉邊裙＋愛心口袋，臉在裙子上
ART.apron = g => {
  const c = P.peach, f = grad(g, c);
  return shadow(50, 94, 32) +
    `<path d="M37 24 C36 7 64 7 63 24" fill="none" stroke="${c.s}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M29 48 Q19 45 11 51 M29 48 Q20 54 14 60" fill="none" stroke="${c.s}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M71 48 Q81 45 89 51 M71 48 Q80 54 86 60" fill="none" stroke="${c.s}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M33 22 L67 22 Q69 22 69 25 L71 47 L29 47 L31 25 Q31 22 33 22 Z" fill="${f}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="${heartPath(50, 34, 4.4)}" fill="#fff" opacity=".85"/>` +
    `<path d="M23 46 L77 46 Q84 68 87 81 Q81 90 73 85.5 Q66.5 92 58.5 86.5 Q50 93 41.5 86.5 Q33.5 92 27 85.5 Q19 90 13 81 Q16 68 23 46 Z" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M17 78 Q22 83 27 79 Q33 85 41 80 Q50 86 59 80 Q67 85 73 79 Q78 83 83 78" fill="none" stroke="#FFF4EC" stroke-width="3.2" stroke-linecap="round" opacity=".95"/>` +
    `<rect x="22" y="44" width="56" height="7" rx="3.5" fill="#FFE2D0" stroke="${c.s}" stroke-width="3"/>` +
    shine(27, 60, 3, 7, 14) +
    face(50, 62, .98);
};

// ---------- 第 3 章 樹洞小屋 ----------
// 枕頭（天空藍）：四角尖尖、四邊鼓鼓的方枕
ART.pillow = g => {
  const c = P.sky;
  const body = `M15 19 Q50 7 85 19 Q95 52 85 85 Q50 95 15 85 Q5 52 15 19 Z`;
  const inner = `M21 25 Q50 16 79 25 Q87 52 79 79 Q50 88 21 79 Q13 52 21 25 Z`;
  const tass = [[13, 17], [87, 17], [13, 87], [87, 87]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#FFFFFF" stroke="${c.s}" stroke-width="2.6"/>`).join('');
  return shadow(50, 96, 30) +
    `<path d="${body}" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="${inner}" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-dasharray="4 4" opacity=".9"/>` +
    tass +
    `<path d="${star5(74, 70, 4.5, 2)}" fill="#FFE69C" stroke="#D99A2B" stroke-width="1.6" ${SW}/>` +
    `<path d="${star5(28, 31, 3.2, 1.5)}" fill="#fff" opacity=".9"/>` +
    shine(25, 50, 3.2, 8, 6) +
    face(50, 51, 1);
};
// 毛毯（粉紅）：摺成兩折的格紋毛毯（左邊看得到兩道圓圓的摺邊）＋綁一條緞帶＋右側流蘇
ART.blanket = g => {
  const c = P.pink;
  const body = `M25 25 L83 25 Q88 25 88 30 L88 82 Q88 87 83 87 L25 87 Q11 87 11 71.5 Q11 56 23 56 Q11 56 11 40.5 Q11 25 25 25 Z`;
  const ging = g.pattern(12, 12, `<rect width="12" height="12" fill="#FFE1EA"/><rect width="6" height="12" fill="#FF9DBA" opacity=".45"/><rect width="12" height="6" fill="#FF9DBA" opacity=".45"/>`);
  let fr = '';
  for (let y = 31; y <= 81; y += 6.25) fr += `<path d="M88 ${y.toFixed(1)} l6 1.5" stroke="${c.s}" stroke-width="2.8" stroke-linecap="round"/>`;
  return shadow(50, 95, 36) + fr +
    `<path d="${body}" fill="${ging}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M23 56 L88 56" stroke="${c.s}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<path d="M16 47 Q15 36 24 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>` +
    `<path d="M16 78 Q15 67 22 62" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>` +
    `<rect x="63" y="23" width="11" height="66" rx="3" fill="#FFFFFF" stroke="${c.s}" stroke-width="3"/>` +
    `<path d="M68.5 56 C62 46 54 50 58 56 C54 62 62 66 68.5 56 Z" fill="#FFFFFF" stroke="${c.s}" stroke-width="2.6" ${SW}/>` +
    `<path d="M68.5 56 C75 46 83 50 79 56 C83 62 75 66 68.5 56 Z" fill="#FFFFFF" stroke="${c.s}" stroke-width="2.6" ${SW}/>` +
    `<circle cx="68.5" cy="56" r="3.2" fill="#FFD36E" stroke="#D99A2B" stroke-width="1.6"/>` +
    `<ellipse cx="38" cy="41" rx="15" ry="11" fill="#FFF5F8" opacity=".75"/>` +
    face(38, 40, .8);
};
// 小夜燈（蜂蜜黃）：發光的彎月＋小星星，坐在小底座上
ART.nightLamp = g => {
  const c = P.yellow;
  const moon = `M58 10 A38 38 0 1 0 88 64 A31 31 0 1 1 58 10 Z`;
  return `<circle cx="47" cy="48" r="45" fill="${g.rg('#FFF3B8', '#FFE69C', .85, 0)}"/>` +
    shadow(48, 95, 22) +
    `<rect x="31" y="83" width="34" height="10" rx="5" fill="#F3D3B3" stroke="#A9744E" stroke-width="3.6"/>` +
    `<path d="${moon}" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M72 26 L72 36" stroke="${c.s}" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="${star5(72, 42, 7, 3.2)}" fill="#FFF6C2" stroke="${c.s}" stroke-width="2.4" ${SW}/>` +
    `<path d="${sparkle(85, 22, 5)}" fill="#fff" stroke="#F3C55A" stroke-width="1.6" ${SW}/>` +
    shine(19, 46, 3.4, 8, 14) + dot(26, 26, 2, .8) +
    face(35, 59, .92);
};
// 熱可可杯（可可棕）：馬克杯＋棉花糖＋兩縷熱氣
ART.cocoaMug = g => {
  const c = P.cocoa;
  return shadow(48, 94, 28) +
    `<path d="M35 22 Q30 15 35 9 Q40 3 36 -2" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".95"/>` +
    `<path d="M35 22 Q30 15 35 9" fill="none" stroke="#E4CBB7" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M55 22 Q50 15 55 9 Q60 3 56 -2" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".95"/>` +
    `<path d="M55 22 Q50 15 55 9" fill="none" stroke="#E4CBB7" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M73 44 Q91 42 89 59 Q87 74 70 72" fill="none" stroke="${c.s}" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M73 44 Q91 42 89 59 Q87 74 70 72" fill="none" stroke="#D3A07C" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M17 33 L79 33 L74 80 Q73 89 63 89 L33 89 Q23 89 22 80 Z" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<ellipse cx="48" cy="33" rx="29" ry="7" fill="#6B3E27" stroke="${c.s}" stroke-width="4"/>` +
    `<rect x="31" y="25" width="11" height="10" rx="3.5" fill="#FFFFFF" stroke="#E4CBB7" stroke-width="2" transform="rotate(-12 36 30)"/>` +
    `<rect x="45" y="27" width="11" height="10" rx="3.5" fill="#FFD6E1" stroke="#EAA8BC" stroke-width="2" transform="rotate(10 50 32)"/>` +
    `<rect x="57" y="25" width="10" height="9" rx="3.5" fill="#FFFFFF" stroke="#E4CBB7" stroke-width="2"/>` +
    `<path d="M22 46 L74.5 46" stroke="#EED5C0" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round"/>` +
    shine(28, 57, 3.4, 8, 6, .55) +
    face(48, 64, .98);
};
// 盆栽（薄荷綠）：三片圓葉子＋奶油色小盆
ART.plant = g => {
  const c = P.mint, f = grad(g, c);
  return shadow(50, 95, 22) +
    `<path d="M50 70 L50 50" stroke="${c.s}" stroke-width="4" stroke-linecap="round"/>` +
    `<ellipse cx="23" cy="53" rx="16" ry="9.5" fill="${f}" stroke="${c.s}" stroke-width="4.5" transform="rotate(-28 23 53)"/>` +
    `<path d="M12 58 Q22 53 34 49" fill="none" stroke="${c.s}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>` +
    `<ellipse cx="77" cy="53" rx="16" ry="9.5" fill="${f}" stroke="${c.s}" stroke-width="4.5" transform="rotate(28 77 53)"/>` +
    `<path d="M88 58 Q78 53 66 49" fill="none" stroke="${c.s}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M50 9 C70 10 76 26 74 39 C72 53 62 61 50 61 C38 61 28 53 26 39 C24 26 30 10 50 9 Z" fill="${f}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M50 12 Q53 6 59 5" fill="none" stroke="${c.s}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="70" cy="18" r="5" fill="#FFB2C8" stroke="#E0608A" stroke-width="2.2"/><circle cx="70" cy="18" r="1.8" fill="#FFE69C"/>` +
    `<path d="M30 66 L70 66 L65 90 Q64 93 60 93 L40 93 Q36 93 35 90 Z" fill="${g.lg('#FFF6EA', '#F6DEC4')}" stroke="#C9956C" stroke-width="4.5" ${SW}/>` +
    `<rect x="26" y="62" width="48" height="10" rx="5" fill="#FFB2C8" stroke="#E0608A" stroke-width="3.6"/>` +
    shine(34, 24, 3, 6, 24) +
    face(50, 37, .92);
};
// 鬧鐘（蜜桃橘）：兩個鈴＋圓鐘身＋奶油色鐘面＋小腳
ART.clock = g => {
  const c = P.peach;
  const ticks = [[50, 30], [76, 56], [50, 82], [24, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${c.s}"/>`).join('');
  return shadow(50, 95, 28) +
    `<path d="M33 84 L27 92 M67 84 L73 92" stroke="${c.s}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M14 26 A13 13 0 0 1 36 12 Z" fill="${g.lg('#FFD9C2', '#FFA273')}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M86 26 A13 13 0 0 0 64 12 Z" fill="${g.lg('#FFD9C2', '#FFA273')}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M50 22 L50 14" stroke="${c.s}" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="12" r="4" fill="#FFD36E" stroke="#D99A2B" stroke-width="2.4"/>` +
    `<circle cx="50" cy="56" r="34" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5"/>` +
    `<circle cx="50" cy="56" r="26" fill="#FFF8EE" stroke="#F3B596" stroke-width="2.6"/>` +
    ticks +
    `<path d="M50 38 L50 46 M50 38 L57 41" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>` +
    shine(26, 44, 3, 7, 24, .7) +
    face(50, 58, .88);
};

// ---------- 第 4 章 熊熊去旅行 ----------
// 熱氣球（粉紅）：條紋氣球＋小籃子
ART.airBalloon = g => {
  const c = P.pink;
  const env = `M50 6 C75 6 89 24 87 43 C85 59 67 69 61 76 L39 76 C33 69 15 59 13 43 C11 24 25 6 50 6 Z`;
  return shadow(50, 96, 16) +
    `<path d="M40 76 L41 85 M60 76 L59 85" stroke="#A9744E" stroke-width="2.6" stroke-linecap="round"/>` +
    `<rect x="37" y="83" width="26" height="12" rx="3.5" fill="${g.lg('#F1D3B2', '#D7A97F')}" stroke="#A9744E" stroke-width="3.6"/>` +
    `<path d="M39 89 L61 89 M44 84 L44 94 M50 84 L50 94 M56 84 L56 94" stroke="#B9875F" stroke-width="1.6" opacity=".8"/>` +
    `<path d="${env}" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M50 6 C38 20 36 54 42 76 L58 76 C64 54 62 20 50 6 Z" fill="#FFE1EA" stroke="${c.s}" stroke-width="3" ${SW}/>` +
    `<path d="M50 6 C30 16 24 50 30 68" fill="none" stroke="#FFD0DE" stroke-width="2.4" opacity=".9"/>` +
    `<path d="M50 6 C70 16 76 50 70 68" fill="none" stroke="#FFD0DE" stroke-width="2.4" opacity=".9"/>` +
    `<rect x="38" y="70" width="24" height="7" rx="3.5" fill="#FFD36E" stroke="#D99A2B" stroke-width="2.6"/>` +
    shine(24, 30, 3.4, 8, 30) +
    face(50, 41, .9);
};
// 腳踏車（薄荷綠）：兩個大輪子＋胖胖車身＋小坐墊和把手
ART.bicycle = g => {
  const c = P.mint;
  const wheel = (x) => `<circle cx="${x}" cy="68" r="17" fill="#F4FCF6" stroke="#3E8F5C" stroke-width="6"/>` +
    `<path d="M${x - 11} 68 L${x + 11} 68 M${x} 57 L${x} 79" stroke="#A8DDB7" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="${x}" cy="68" r="4" fill="#FFD36E" stroke="#D99A2B" stroke-width="2"/>`;
  return shadow(50, 94, 40) +
    wheel(23) + wheel(77) +
    `<path d="M66 44 L72 24" stroke="${c.s}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M65 22 L80 20" stroke="${c.s}" stroke-width="7" stroke-linecap="round"/><path d="M76 20.5 L81 19.8" stroke="#FFB2C8" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M24 66 Q26 40 49 37 Q70 34 74 60 Q76 68 70 70 L30 70 Q24 70 24 66 Z" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M35 33 L37 38" stroke="${c.s}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M24 31 Q24 26 31 26 L42 26 Q47 27 45 31 Q43 34 34 34 Q25 34 24 31 Z" fill="#C99C76" stroke="#8A5A3C" stroke-width="3.6" ${SW}/>` +
    shine(34, 46, 2.6, 5, 30) +
    face(50, 53, .8);
};
// 背包（蜜桃橘）：提把＋上蓋扣環＋大口袋（臉在口袋上）
ART.backpack = g => {
  const c = P.peach;
  return shadow(50, 95, 30) +
    `<path d="M39 18 Q39 7 50 7 Q61 7 61 18" fill="none" stroke="${c.s}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="12" y="38" width="10" height="34" rx="5" fill="#FFB38E" stroke="${c.s}" stroke-width="3.6"/>` +
    `<rect x="78" y="38" width="10" height="34" rx="5" fill="#FFB38E" stroke="${c.s}" stroke-width="3.6"/>` +
    `<rect x="18" y="15" width="64" height="77" rx="24" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5"/>` +
    `<path d="M19 40 Q19 15 50 15 Q81 15 81 40 L81 45 Q50 53 19 45 Z" fill="${g.lg('#FFB38E', '#FF915F')}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<rect x="44" y="42" width="12" height="11" rx="3.5" fill="#FFD36E" stroke="#D99A2B" stroke-width="2.6"/>` +
    `<rect x="26" y="57" width="48" height="29" rx="12" fill="#FFE2D0" stroke="${c.s}" stroke-width="4"/>` +
    `<rect x="30" y="61" width="40" height="21" rx="9" fill="none" stroke="#F6A27B" stroke-width="1.8" stroke-dasharray="3 3"/>` +
    shine(29, 27, 4.5, 2.4, -25, .75) +
    face(50, 69, .82);
};
// 小船（天空藍）：藍色船身＋白色條紋帆＋小旗子
ART.boat = g => {
  const c = P.sky;
  return `<path d="M6 92 Q16 86 26 92 Q36 98 46 92 Q56 86 66 92 Q76 98 86 92 Q91 89 95 91" fill="none" stroke="#A9D7F5" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M51 6 L51 58" stroke="#A9744E" stroke-width="3.6" stroke-linecap="round"/>` +
    `<path d="M51 7 L63 11 L51 15 Z" fill="#FF8FB0" stroke="#E0608A" stroke-width="2.2" ${SW}/>` +
    `<path d="M48 14 L48 55 L17 55 Q27 31 48 14 Z" fill="${g.lg('#FFFFFF', '#F2F7FC')}" stroke="${c.s}" stroke-width="4" ${SW}/>` +
    `<path d="M38 26 L38 55 M28 38 L28 55" stroke="#FFB2C8" stroke-width="4"/>` +
    `<path d="M48 14 L48 55 L17 55 Q27 31 48 14 Z" fill="none" stroke="${c.s}" stroke-width="4" ${SW}/>` +
    `<path d="M55 22 L55 55 L77 55 Q72 37 55 22 Z" fill="#FFE1EA" stroke="#E0608A" stroke-width="3.6" ${SW}/>` +
    `<path d="M9 57 L91 57 Q88 84 63 87 L37 87 Q12 84 9 57 Z" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M11.5 64 L88.5 64" stroke="#E8F4FD" stroke-width="3.5" stroke-linecap="round"/>` +
    shine(19, 70, 2.6, 5, 10) +
    face(50, 73, .88);
};
// 地圖（蜂蜜黃）：三折地圖＋虛線路徑＋愛心終點
ART.map = g => {
  const c = P.yellow;
  return shadow(50, 95, 36) +
    `<path d="M10 22 L37 15 L37 83 L10 90 Z" fill="${g.lg('#FFF0C4', '#FFDC85')}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M37 15 L63 23 L63 91 L37 83 Z" fill="${g.lg('#FFE08E', '#FFC24C')}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M63 23 L90 16 L90 84 L63 91 Z" fill="${g.lg('#FFF0C4', '#FFDC85')}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M16 34 Q28 24 40 33 Q50 41 60 31 Q68 24 76 30" fill="none" stroke="#FF8FB0" stroke-width="3" stroke-dasharray="4 4" stroke-linecap="round"/>` +
    `<path d="${heartPath(80, 29, 5.2)}" fill="#FF8FB0" stroke="#E0608A" stroke-width="2"/>` +
    `<path d="M16 76 l5 -8 l5 8 Z" fill="#8ED8A2" stroke="#4FA06A" stroke-width="2" ${SW}/>` +
    `<circle cx="80" cy="76" r="3.5" fill="#8CC8F0" stroke="#4E8FC4" stroke-width="1.8"/>` +
    shine(17, 46, 2.4, 6, 4, .7) +
    face(50, 58, .9);
};
// 相機（薰衣草紫）：寬機身＋閃光燈＋快門鈕，臉在大鏡頭裡
ART.camera = g => {
  const c = P.lav;
  return shadow(50, 94, 36) +
    `<rect x="19" y="20" width="22" height="13" rx="4" fill="#EEE8FF" stroke="${c.s}" stroke-width="4"/>` +
    `<circle cx="73" cy="25" r="6" fill="#FF8FB0" stroke="#E0608A" stroke-width="3"/>` +
    `<rect x="8" y="29" width="84" height="57" rx="16" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5"/>` +
    `<path d="M9 46 L91 46" stroke="#C9BBF5" stroke-width="3"/>` +
    `<rect x="72" y="35" width="12" height="7" rx="3" fill="#FFF6C2" stroke="${c.s}" stroke-width="2.2"/>` +
    `<circle cx="50" cy="60" r="25" fill="#8E76D8" stroke="${c.s}" stroke-width="4.5"/>` +
    `<circle cx="50" cy="60" r="19.5" fill="${g.lg('#FFFFFF', '#E3DAFC')}" stroke="#B9A6F0" stroke-width="2.4"/>` +
    `<path d="${heartPath(18, 40, 3)}" fill="#FFB2C8"/>` +
    shine(40, 49, 3.6, 2, -30, .9) +
    face(50, 60, .76);
};

// ---------- 共用：凸凸雲朵輪廓（棉花糖、爆米花） ----------
/** 沿橢圓排 n 個向外鼓的小圓弧，k 越小越鼓（≥0.5） */
function bumpyPath(cx, cy, rx, ry, n, k = .6, a0 = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = a0 + i * 2 * Math.PI / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const r = (Math.hypot(x2 - x1, y2 - y1) * k).toFixed(1);
    d += ` A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  return d + 'Z';
}

// ---------- 第 5 章 熊熊上學去 ----------
// 鉛筆（蜂蜜黃）：斜放的六角鉛筆（右上粉紅橡皮擦＋銀色金屬箍、左下削尖的木頭筆頭），臉在筆桿中間
ART.pencil = g => {
  const c = P.yellow;
  const pencil =
    `<path d="M32 66 L68 66 L54 94 Q50 100 46 94 Z" fill="${g.lg('#FFF4E2', '#F0C99A', 1, 0)}" stroke="#B9875F" stroke-width="4.5" ${SW}/>` +
    `<path d="M45.2 86 L54.8 86 L52.6 91 Q50 95.5 47.4 91 Z" fill="#7C6A80"/>` +
    `<path d="M32 25 L68 25 L68 68 Q62 75 56 68 Q50 75 44 68 Q38 75 32 68 Z" fill="${g.lg('#FFEFA8', '#FFBC3E', 1, 0)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M44 27 L44 68 M56 27 L56 68" stroke="#FFF7D6" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>` +
    `<rect x="30.5" y="14" width="39" height="13" rx="3.5" fill="${g.lg('#F7F4FB', '#CEC5DE', 1, 0)}" stroke="#9C90B0" stroke-width="4"/>` +
    `<path d="M33 18.5 L67 18.5 M33 22.5 L67 22.5" stroke="#B4A9C6" stroke-width="1.8"/>` +
    `<path d="M32 15 L32 9 Q32 2 40 2 L60 2 Q68 2 68 9 L68 15 Z" fill="${g.lg('#FFC9D8', '#FF8FB0', 1, 0)}" stroke="${P.pink.s}" stroke-width="4.5" ${SW}/>` +
    shine(38, 8, 3.4, 2, 0, .75) + shine(37.6, 44, 2.4, 12, 0, .7);
  return shadow(46, 93, 20) +
    `<path d="${sparkle(17, 20, 6.5)}" fill="#FFF6C2" stroke="#F0B43C" stroke-width="2" ${SW}/>` +
    `<g transform="rotate(42 50 50)">${pencil}</g>` +
    face(50, 49, .8);
};
// 繪本（天空藍）：直立的厚精裝書（右側露出奶油色書頁、底下垂粉紅書籤），封面有小彩虹
ART.book = g => {
  const c = P.sky;
  let pages = '';
  for (let y = 22; y <= 80; y += 7) pages += `<path d="M77 ${y} L84 ${y + .6}" stroke="#D9C7A8" stroke-width="1.6" stroke-linecap="round"/>`;
  return shadow(50, 95, 32) +
    `<path d="M60 84 L60 98 L64.5 94 L69 98 L69 84 Z" fill="#FF8FB0" stroke="#E0608A" stroke-width="2.6" ${SW}/>` +
    `<rect x="17" y="11" width="73" height="81" rx="10" fill="#7DB7E3" stroke="${c.s}" stroke-width="4.5"/>` +
    `<path d="M70 9 L82 11 Q87 12 87 17 L87 82 Q87 87 82 88 L70 89 Z" fill="${g.lg('#FFFDF6', '#F3E6CC', 1, 0)}" stroke="#C9AD84" stroke-width="3" ${SW}/>` +
    pages +
    `<rect x="9" y="7" width="69" height="80" rx="10" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5"/>` +
    `<path d="M21 9 L21 85" stroke="${c.s}" stroke-width="3"/>` +
    `<path d="M11.5 10 L21 10 L21 84 L11.5 84 Z" fill="#79B2E0" opacity=".55"/>` +
    `<path d="M11 22 L21 22 M11 72 L21 72" stroke="#FFD36E" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M36 33 A14 14 0 0 1 64 33" fill="none" stroke="#FF9EB5" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M40.5 33 A9.5 9.5 0 0 1 59.5 33" fill="none" stroke="#FFD36E" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M45 33 A5 5 0 0 1 55 33" fill="none" stroke="#8ED8A2" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M31 35 Q31 31 35 31 Q37 28 40 31 Q43 31 42.5 35 Z" fill="#fff" stroke="#BFE0F5" stroke-width="1.4"/>` +
    `<path d="${sparkle(70, 17, 5)}" fill="#fff" opacity=".95"/>` +
    shine(28, 50, 2.6, 10, 4, .65) +
    face(49, 57, .9);
};
// 蠟筆（粉紅）：胖胖直立蠟筆（圓錐筆尖＋鋸齒紋包裝紙），旁邊畫了一顆愛心
ART.crayon = g => {
  const c = P.pink;
  const zig = y => { let d = `M28 ${y}`; for (let x = 28; x < 64; x += 6) d += ` L${x + 3} ${y - 3} L${x + 6} ${y}`; return `<path d="${d}" fill="none" stroke="#FFF1F5" stroke-width="2.4" ${SW}/>`; };
  return shadow(46, 94, 22) +
    `<path d="${heartPath(80, 80, 9.5)}" fill="#FFE8EF" stroke="#FF84A8" stroke-width="3.6" ${SW}/>` +
    `<path d="M72 64 Q78 60 84 63 M86 92 Q90 90 92 86" fill="none" stroke="#FF9EBB" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M27 38 C28 28 33 17 38.5 11 Q45 4.5 51.5 11 C57 17 62 28 63 38 Z" fill="${g.lg('#FFB0C6', '#F06D96', 1, 0)}" stroke="${c.s}" stroke-width="4.5" ${SW}/>` +
    `<path d="M35 25 Q38 17 42 13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>` +
    `<rect x="24" y="35" width="42" height="57" rx="9" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5"/>` +
    `<rect x="26.5" y="39" width="37" height="10" fill="#F06D96"/>` + zig(46) +
    `<rect x="26.5" y="78" width="37" height="9" fill="#F06D96"/>` + zig(84) +
    `<rect x="24" y="35" width="42" height="57" rx="9" fill="none" stroke="${c.s}" stroke-width="5"/>` +
    shine(31, 62, 2.4, 8, 4, .7) +
    face(45, 61, .8);
};
// 地球儀（薄荷綠）：薄荷色地球（奶油色陸地）＋斜斜的金色子午環＋木頭底座
ART.globe = g => {
  const c = P.mint;
  const cl = g.clip(`<circle cx="48" cy="46" r="30"/>`);
  const ring = `M61.5 12.6 A36 36 0 0 1 34.5 79.4`;
  return shadow(48, 95, 22) +
    `<path d="M48 82 L48 87" stroke="#A9744E" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M28 95 Q28 85 48 85 Q68 85 68 95 Z" fill="${g.lg('#F7E6D3', '#D9AA80')}" stroke="#A9744E" stroke-width="4" ${SW}/>` +
    `<path d="${ring}" fill="none" stroke="#D99A2B" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="${ring}" fill="none" stroke="#FFE08E" stroke-width="3.6" stroke-linecap="round"/>` +
    `<circle cx="48" cy="46" r="30" fill="${g.lg('#D8F6DF', '#86D29C')}" stroke="${c.s}" stroke-width="5"/>` +
    `<g clip-path="${cl}" fill="#FFF3C9" stroke="#6FBF88" stroke-width="2">` +
      `<path d="M16 30 Q22 17 36 18 Q45 20 41 28 Q35 31 34 37 Q27 42 18 37 Z"/>` +
      `<path d="M64 24 Q76 24 80 37 Q82 50 73 55 Q66 51 68 44 Q60 37 64 24 Z"/>` +
      `<path d="M30 68 Q42 62 55 68 Q61 75 50 79 Q36 80 30 68 Z"/>` +
    `</g>` +
    `<path d="M19 49 Q48 60 77 49" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="3 4" stroke-linecap="round" opacity=".75"/>` +
    `<circle cx="48" cy="46" r="30" fill="none" stroke="${c.s}" stroke-width="5"/>` +
    `<circle cx="61.5" cy="12.6" r="3.6" fill="#FFD36E" stroke="#D99A2B" stroke-width="2.2"/>` +
    `<circle cx="34.5" cy="79.4" r="3.6" fill="#FFD36E" stroke="#D99A2B" stroke-width="2.2"/>` +
    shine(30, 34, 3.2, 6.5, 35, .7) +
    face(48, 47, .88);
};
// 調色盤（蜜桃橘）：蛋形調色盤＋大拇指洞＋上緣五色顏料＋一支小畫筆
ART.palette = g => {
  const c = P.peach;
  const body = `M10 52 C8 30 28 13 52 13 C76 13 92 30 90 50 C89 62 82 66 76 64 C70 62 64 66 66 74 C68 82 64 90 50 90 C26 90 11 74 10 52 Z`;
  const hole = `M74 41 a6 6 0 1 0 0.01 0 Z`;
  const dab = (x, y, col, s) => `<path d="${bumpyPath(x, y, 5.2, 4.6, 5, .62)}" fill="${col}" stroke="${s}" stroke-width="2.2" ${SW}/>` + `<circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.4" fill="#fff" opacity=".85"/>`;
  return shadow(50, 95, 32) +
    `<path d="M68 96 L88 70" stroke="#A9744E" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M68 96 L88 70" stroke="#F1D3B2" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M86 72 L91 65" stroke="#9C90B0" stroke-width="7.5" stroke-linecap="round"/>` +
    `<path d="M89.5 66.5 Q93 58 97 56 Q97.5 62 92.5 68.5 Z" fill="#8CC6EE" stroke="#4E8FC4" stroke-width="2.4" ${SW}/>` +
    `<path d="${body} ${hole}" fill-rule="evenodd" fill="${g.lg('#FFD9C2', '#FF9A6B')}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    dab(24, 38, '#FF8FB0', '#E0608A') + dab(36, 26, '#FFD36E', '#D99A2B') + dab(52, 22, '#8ED8A2', '#4FA06A') + dab(67, 26, '#8CC6EE', '#4E8FC4') + dab(78, 54, '#B9A6F0', '#7A62C6') +
    shine(19, 56, 3, 7, 12, .65) +
    face(46, 58, .88);
};
// 拼圖（薰衣草紫）：一片拼圖（上、右凸，左、下凹）
ART.puzzle = g => {
  const c = P.lav;
  const d = `M16 26 L40 26 C38 20 38 11 47 11 C56 11 56 20 54 26 L78 26 L78 47 C84 45 93 45 93 54.5 C93 64 84 64 78 62 L78 86 L56 86 C58 80 57 75 47 75 C37 75 36 80 38 86 L16 86 L16 63 C22 65 27 62 27 55 C27 48 22 45 16 47 Z`;
  return shadow(50, 95, 32) +
    `<path d="${d}" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M21 31 L37 31 M58 31 L73 31 L73 43" fill="none" stroke="#EEE8FF" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>` +
    `<circle cx="47" cy="19" r="3" fill="#fff" opacity=".7"/>` +
    `<path d="${star5(68, 78, 4.2, 1.9)}" fill="#FFE69C" stroke="#D99A2B" stroke-width="1.6" ${SW}/>` +
    shine(22, 70, 2.4, 5, 8, .55) +
    face(51, 51, .86);
};

// ---------- 第 6 章 熊熊遊樂園 ----------
// 棉花糖（粉紅）：一大朵蓬蓬雲＋細細的條紋紙棒
ART.cottonCandy = g => {
  const c = P.pink;
  const stick = `M44 64 L56 64 L52.4 94 Q50 97.5 47.6 94 Z`;
  const scl = g.clip(`<path d="${stick}"/>`);
  return shadow(50, 96, 13) +
    `<path d="${stick}" fill="#FFFFFF" stroke="#E0608A" stroke-width="3.6" ${SW}/>` +
    `<g clip-path="${scl}"><path d="M40 70 L60 62 M40 78 L60 70 M40 86 L60 78 M40 94 L60 86" stroke="#FF9EB5" stroke-width="3.2"/></g>` +
    `<path d="${stick}" fill="none" stroke="#E0608A" stroke-width="3.6" ${SW}/>` +
    `<path d="${bumpyPath(50, 39, 35, 28, 11, .6)}" fill="${g.lg('#FFD0DE', '#FF8FB0')}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="M24 34 Q28 24 38 25 M60 21 Q70 20 74 28 M66 56 Q74 54 78 46" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>` +
    `<path d="M30 54 Q36 60 44 58" fill="none" stroke="#E96F98" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>` +
    shine(24, 44, 3, 5.5, 20, .6) +
    `<path d="${sparkle(86, 10, 5.5)}" fill="#fff" stroke="#F3A6C0" stroke-width="1.6" ${SW}/>` +
    face(50, 41, .95);
};
// 冰淇淋（薄荷綠）：一大球薄荷冰淇淋（往下滴）＋彩色糖粒＋櫻桃＋格紋甜筒
ART.iceCream = g => {
  const c = P.mint;
  const cone = `M27 54 L73 54 L52 94 Q50 97.5 48 94 Z`;
  const ccl = g.clip(`<path d="${cone}"/>`);
  let grid = '';
  for (let i = -3; i <= 6; i++) grid += `<path d="M${18 + i * 9} 46 L${58 + i * 9} 100 M${82 - i * 9} 46 L${42 - i * 9} 100" stroke="#D99A5B" stroke-width="2"/>`;
  const spr = (x, y, r, col) => `<rect x="${x - 3.4}" y="${y - 1.3}" width="6.8" height="2.6" rx="1.3" fill="${col}" transform="rotate(${r} ${x} ${y})"/>`;
  return shadow(50, 96, 13) +
    `<path d="${cone}" fill="${g.lg('#FFE3B8', '#F2B874')}" stroke="#C98A4B" stroke-width="4.5" ${SW}/>` +
    `<g clip-path="${ccl}">${grid}</g>` +
    `<path d="${cone}" fill="none" stroke="#C98A4B" stroke-width="4.5" ${SW}/>` +
    `<path d="M21 51 C17 29 31 15 50 15 C69 15 83 29 79 51 Q77 59 71 56 Q68 66 61 58 Q55 66 50 58 Q44 66 39 58 Q32 64 29 56 Q23 59 21 51 Z" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    spr(30, 29, -30, '#FF8FB0') + spr(42, 22, 20, '#FFD36E') + spr(60, 21, -15, '#A98FEA') + spr(71, 31, 35, '#8CC6EE') + spr(25, 43, 60, '#FFD36E') + spr(75, 45, -50, '#FF8FB0') +
    `<path d="M51 9 Q53 3 59 1.5" stroke="#4FA06A" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<circle cx="49" cy="12" r="6" fill="#FF8FB0" stroke="#E0608A" stroke-width="3"/>` + dot(47, 10, 1.6, .9) +
    shine(28, 37, 2.8, 6, 25, .6) +
    face(50, 39, .92);
};
// 爆米花（蜂蜜黃）：黃白直條紋紙盒（上寬下窄）＋滿出來的一朵朵爆米花
ART.popcorn = g => {
  const c = P.yellow;
  const box = `M17 44 L83 44 L73 91 Q72.5 94 70 94 L30 94 Q27.5 94 27 91 Z`;
  const bcl = g.clip(`<path d="${box}"/>`);
  let stripes = '';
  for (let i = 1; i < 7; i += 2) {
    const t0 = 17 + i * 66 / 7, t1 = 17 + (i + 1) * 66 / 7, b0 = 27 + i * 46 / 7, b1 = 27 + (i + 1) * 46 / 7;
    stripes += `<path d="M${t0.toFixed(1)} 40 L${t1.toFixed(1)} 40 L${b1.toFixed(1)} 96 L${b0.toFixed(1)} 96 Z" fill="#FFF4D2"/>`;
  }
  const kern = (x, y, r) => `<path d="${bumpyPath(x, y, r * .78, r * .72, 5, .6, -1.2 + x * .07)}" fill="#FFFBEE" stroke="#E2AA3C" stroke-width="2.8" ${SW}/>` + `<circle cx="${x + r * .2}" cy="${y + r * .25}" r="${(r * .28).toFixed(1)}" fill="#FFE08E" opacity=".8"/>`;
  return shadow(50, 96, 26) +
    kern(28, 37, 10) + kern(72, 37, 10) + kern(40, 27, 11) + kern(60, 27, 11) + kern(50, 15, 10) + kern(50, 36, 10) + kern(85, 18, 5.5) +
    `<path d="${box}" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<g clip-path="${bcl}">${stripes}</g>` +
    `<path d="${box}" fill="none" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<rect x="13" y="40" width="74" height="10" rx="5" fill="${g.lg('#FFF0C4', '#FFD36E')}" stroke="${c.s}" stroke-width="4"/>` +
    `<path d="${star5(50, 84, 4.6, 2.1)}" fill="#FF9EB5" stroke="#E0608A" stroke-width="1.6" ${SW}/>` +
    shine(25, 60, 2.4, 7, -10, .6) +
    face(50, 65, .86);
};
// 小喇叭（蜜桃橘）：側面的胖小喇叭——左邊吹嘴、中間三個按鍵和繞一圈的管子、右邊大大往外張開的喇叭口（臉在喇叭口外側）
ART.trumpet = g => {
  const c = P.peach;
  const tube = (d, w) => `<path d="${d}" fill="none" stroke="${c.s}" stroke-width="${w + 5}" ${SW}/><path d="${d}" fill="none" stroke="#FFB892" stroke-width="${w}" ${SW}/>`;
  const valve = x => `<path d="M${x} 46 L${x} 74" stroke="${c.s}" stroke-width="9" stroke-linecap="round"/><path d="M${x} 46 L${x} 74" stroke="#FFD2BC" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${x} 44 L${x} 37" stroke="${c.s}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<ellipse cx="${x}" cy="35.5" rx="4.6" ry="2.8" fill="#FFF6EA" stroke="${c.s}" stroke-width="2.4"/>`;
  return shadow(50, 93, 36) +
    `<path d="M14 26 L14 12 L22 10 L22 23" fill="none" stroke="#E0608A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<ellipse cx="11.2" cy="26.4" rx="3.8" ry="2.9" fill="#FF8FB0" stroke="#E0608A" stroke-width="2"/><ellipse cx="19.2" cy="23.6" rx="3.8" ry="2.9" fill="#FF8FB0" stroke="#E0608A" stroke-width="2"/>` +
    tube('M24 52 Q13 52 13 63 Q13 74 24 74 L42 74 Q50 74 50 66 L50 56', 6) +
    tube('M9 52 L54 52', 7) +
    `<path d="M2 45.5 Q8 45.5 10 49.5 L10 54.5 Q8 58.5 2 58.5 Z" fill="#FFE2D0" stroke="${c.s}" stroke-width="3.2" ${SW}/>` +
    valve(26) + valve(34) + valve(42) +
    `<path d="M46 45 C60 44 70 36 79 20 Q82 15 88 16 L88 84 Q82 85 79 80 C70 64 60 56 46 55 Z" fill="${g.lg('#FFD3BA', '#FF9162')}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<ellipse cx="89" cy="50" rx="7" ry="34" fill="${g.lg('#FFF6EC', '#FFC9A8', 1, 0)}" stroke="${c.s}" stroke-width="4.5"/>` +
    `<path d="M50 49 C62 48 70 42 77 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
    face(71, 52, .66);
};
// 旋轉木馬（薰衣草紫）：條紋圓錐帳篷頂＋花邊彩燈＋金色柱子＋小白馬＋圓台
ART.carousel = g => {
  const c = P.lav;
  const roof = `M50 9 C58 20 76 32 93 43 Q50 49 7 43 C24 32 42 20 50 9 Z`;
  const rcl = g.clip(`<path d="${roof}"/>`);
  let st = '';
  for (let k = 1; k < 7; k += 2) st += `<path d="M50 9 L${(7 + k * 86 / 7).toFixed(1)} 50 L${(7 + (k + 1) * 86 / 7).toFixed(1)} 50 Z" fill="#F1ECFF"/>`;
  let scal = 'M8 43 Q50 49 92 43 L92 47';
  for (let i = 0; i < 6; i++) { const x1 = 92 - i * 14, x0 = x1 - 14; scal += ` A7 6 0 0 1 ${x0} 47`; }
  scal += ' Z';
  const bulbs = [15, 29, 43, 57, 71, 85].map(x => `<circle cx="${x}" cy="49" r="2.3" fill="#FFE08E" stroke="#E9A42E" stroke-width="1.2"/>`).join('');
  const pole = x => `<path d="M${x} 50 L${x} 80" stroke="#D99A2B" stroke-width="5.5" stroke-linecap="round"/><path d="M${x} 50 L${x} 80" stroke="#FFE08E" stroke-width="2.2" stroke-linecap="round"/>`;
  return shadow(50, 95, 36) +
    `<path d="M50 10 L50 1" stroke="#D99A2B" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path d="M50 1.5 L60 4.5 L50 7.5 Z" fill="#FF8FB0" stroke="#E0608A" stroke-width="1.8" ${SW}/>` +
    pole(21) + pole(79) + pole(50) +
    // 小白馬
    `<path d="M57 63 Q66 61 67 66" fill="none" stroke="#FF9EB5" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M44 70 L41 78 M47 71 L47 79 M55 71 L57 79 M58 70 L62 77" stroke="${c.s}" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="51" cy="67" rx="10" ry="6" fill="#FFFFFF" stroke="${c.s}" stroke-width="3"/>` +
    `<path d="M44 66 L39 57 Q37.5 53 41.5 52.5 L46 53.5 Q48.5 55 46.5 58.5 L49 64 Z" fill="#FFFFFF" stroke="${c.s}" stroke-width="3" ${SW}/>` +
    `<path d="M45 53 Q50 55 49 61" fill="none" stroke="#FF9EB5" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="49" y="61" width="7" height="5" rx="2" fill="#FF9EB5"/>` +
    `<circle cx="41.5" cy="55.5" r="1.1" fill="${INK}"/>` +
    // 圓台
    `<rect x="7" y="78" width="86" height="13" rx="6.5" fill="${g.lg('#C9B9F6', '#9C84E6')}" stroke="${c.s}" stroke-width="4.5"/>` +
    `<path d="M12 84.5 L88 84.5" stroke="#FFB2C8" stroke-width="3" stroke-linecap="round" stroke-dasharray="7 5"/>` +
    // 屋頂
    `<path d="${roof}" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<g clip-path="${rcl}">${st}</g>` +
    `<path d="${roof}" fill="none" stroke="${c.s}" stroke-width="5" ${SW}/>` +
    `<path d="${scal}" fill="#FFB2C8" stroke="#E0608A" stroke-width="3" ${SW}/>` + bulbs +
    `<circle cx="50" cy="10" r="3.4" fill="#FFD36E" stroke="#D99A2B" stroke-width="2"/>` +
    face(50, 31, .78);
};
// 摩天輪（天空藍）：大圓輪＋輪輻＋一圈彩色小車廂＋A 字支架，臉在中間的輪軸
ART.ferrisWheel = g => {
  const c = P.sky;
  const cx = 50, cy = 44, R = 35;
  let spokes = '', cabins = '';
  const cols = [['#FF9EB5', '#E0608A'], ['#FFD36E', '#D99A2B'], ['#8ED8A2', '#4FA06A'], ['#B9A6F0', '#7A62C6']];
  for (let k = 0; k < 8; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 4, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
    spokes += `<path d="M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)}" stroke="#8CC6EE" stroke-width="2.6" stroke-linecap="round"/>`;
    const [f, s] = cols[k % 4];
    cabins += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} ${(y + 3).toFixed(1)}" stroke="${c.s}" stroke-width="2"/>` +
      `<rect x="${(x - 6).toFixed(1)}" y="${(y + 2).toFixed(1)}" width="12" height="10" rx="4.5" fill="${f}" stroke="${s}" stroke-width="2.4"/>` +
      `<rect x="${(x - 3.2).toFixed(1)}" y="${(y + 4).toFixed(1)}" width="6.4" height="3.6" rx="1.6" fill="#fff" opacity=".9"/>`;
  }
  return shadow(50, 95, 32) +
    `<path d="M50 46 L24 91 M50 46 L76 91" stroke="${c.s}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M50 46 L24 91 M50 46 L76 91" stroke="#BFE0F7" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M16 92 L84 92" stroke="${c.s}" stroke-width="6" stroke-linecap="round"/>` +
    spokes +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${c.s}" stroke-width="8"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#BFE0F7" stroke-width="3.4"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${R - 7}" fill="none" stroke="#A9D7F5" stroke-width="2" stroke-dasharray="3 4"/>` +
    cabins +
    `<circle cx="${cx}" cy="${cy}" r="18" fill="${grad(g, c)}" stroke="${c.s}" stroke-width="4.5"/>` +
    shine(42, 36, 3, 2, -30, .8) +
    face(50, 45, .66);
};

// =====================================================================
// 特殊道具
// =====================================================================
function pawCore(g) {
  const bean = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="6.6" ry="7.8" fill="#FF9EB5" stroke="#E46D90" stroke-width="3" transform="rotate(${rot} ${x} ${y})"/>` + shine(x - 1.8, y - 2.6, 1.6, 2.4, rot, .75);
  return `<circle cx="50" cy="52" r="29" fill="${g.lg('#FFFBF3', '#FFE8D0')}" stroke="#E2B08A" stroke-width="5"/>` +
    `<path d="M50 50 C39 50 31 60 32 68 C33 75.5 42 77 50 73.5 C58 77 67 75.5 68 68 C69 60 61 50 50 50 Z" fill="#FF9EB5" stroke="#E46D90" stroke-width="3" ${SW}/>` +
    shine(42, 58, 4, 2.4, -25, .7) +
    bean(33, 43, -28) + bean(44, 35, -9) + bean(56, 35, 9) + bean(67, 43, 28) +
    shine(33, 37, 5, 2.6, -35, .5);
}
const arrowR = `M99 52 L82 37 L82 67 Z`;
function pawH(g) {
  return `<rect x="3" y="40" width="94" height="24" rx="12" fill="#FFE4EB" opacity=".9"/>` +
    `<path d="M1 52 L18 37 L18 67 Z" fill="#FFCF5A" stroke="#E0A030" stroke-width="3.4" ${SW}/>` +
    `<path d="${arrowR}" fill="#FFCF5A" stroke="#E0A030" stroke-width="3.4" ${SW}/>` +
    pawCore(g);
}
function pawV(g) {
  return `<rect x="38" y="1" width="24" height="98" rx="12" fill="#FFE4EB" opacity=".9"/>` +
    `<path d="M50 0 L35 17 L65 17 Z" fill="#FFCF5A" stroke="#E0A030" stroke-width="3.4" ${SW}/>` +
    `<path d="M50 100 L35 83 L65 83 Z" fill="#FFCF5A" stroke="#E0A030" stroke-width="3.4" ${SW}/>` +
    pawCore(g);
}
function bomb(g) {
  return shadow(50, 95, 26) +
    `<path d="M50 16 Q51 8 59 6.5" fill="none" stroke="#8A5A3C" stroke-width="3.6" stroke-linecap="round"/>` +
    `<path d="${hexPath(50, 54, 38)}" fill="${g.lg('#FFDF85', '#FFB93A')}" stroke="#CF8C20" stroke-width="6" ${SW}/>` +
    `<path d="${hexPath(70, 38, 6.5)}" fill="#FFEBA8" stroke="#E9A42E" stroke-width="2.4" ${SW}/>` +
    `<path d="${hexPath(70, 74, 6)}" fill="#FFEBA8" stroke="#E9A42E" stroke-width="2.4" ${SW}/>` +
    `<path d="${hexPath(50, 82, 5)}" fill="#FFEBA8" stroke="#E9A42E" stroke-width="2.2" ${SW}/>` +
    `<path d="${sparkle(62, 5, 8)}" fill="#FFF6C2" stroke="#FF8FB0" stroke-width="2.2" ${SW}/>` +
    `<circle cx="62" cy="5" r="2.2" fill="#FF8FB0"/>` +
    shine(27, 44, 3.8, 8.5, 30) +
    face(47, 57, .98);
}
const DEFAULT_PERFUME = '#FF9EB5';
/** 圓胖香水瓶（粉紅玻璃、白蝴蝶結瓶頸、金蓋、噴頭球）。color 可換色 */
function perfume(g, color = DEFAULT_PERFUME) {
  let glassA = '#FFE0EA', glassB = '#FFA6C1', line = '#E0668A', liquid = '#FF8FB0', bulbLine = '#D9557E';
  if (color && color.toUpperCase() !== DEFAULT_PERFUME) {
    glassA = shade(color, .2); glassB = shade(color, .03);
    line = shade(color, -.2); liquid = shade(color, -.04); bulbLine = shade(color, -.27);
  }
  return shadow(47, 94, 24) +
    `<path d="M57 21 Q78 18 84 34" fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="85" cy="42" rx="8" ry="9.5" fill="${liquid}" stroke="${bulbLine}" stroke-width="3"/>` + shine(82.3, 38.6, 2, 3, 20, .75) +
    `<path d="M85 51.5 L85 55" stroke="#C98F1F" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M82.2 55 Q85 64.5 87.8 55 Z" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.6" ${SW}/>` +
    `<circle cx="47" cy="63" r="27" fill="${g.lg(glassA, glassB, 1, 1)}" stroke="${line}" stroke-width="5"/>` +
    `<path d="M20.2 66 Q33.6 60 47 66 Q60.4 72 73.8 66 A27 27 0 0 1 20.2 66 Z" fill="${liquid}" opacity=".5"/>` +
    `<rect x="39" y="29" width="16" height="10" rx="3" fill="${shade(glassA, .04)}" stroke="${line}" stroke-width="4"/>` +
    `<rect x="35.5" y="13" width="23" height="17" rx="6" fill="${g.lg('#FFE68F', '#F2B42E')}" stroke="#C98F1F" stroke-width="4"/>` +
    shine(41.5, 18, 3.2, 1.9, -15, .85) +
    `<path d="M55 15 L61.5 9" stroke="#C98F1F" stroke-width="4.2" stroke-linecap="round"/>` +
    `<path d="M47 37.5 C39 29 29.5 32 31.5 39.5 C33.5 47 42 45 47 37.5 Z" fill="#fff" stroke="${line}" stroke-width="3" ${SW}/>` +
    `<path d="M47 37.5 C55 29 64.5 32 62.5 39.5 C60.5 47 52 45 47 37.5 Z" fill="#fff" stroke="${line}" stroke-width="3" ${SW}/>` +
    `<circle cx="47" cy="37.5" r="3.6" fill="#F6CF66" stroke="#C98F1F" stroke-width="2"/>` +
    `<path d="M27 58 Q29 49 36 45" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".85"/>` + dot(26, 66, 2.4, .85) +
    `<path d="${sparkle(12, 26, 6.5)}" fill="#fff" stroke="${shade(line, .25)}" stroke-width="2" ${SW}/>` +
    face(48, 67, .95);
}

// =====================================================================
// 熊寶寶、障礙、小門
// =====================================================================
function baby(g) {
  return `<circle cx="50" cy="52" r="44" fill="${g.rg('#FFF6C2', '#FFF6C2', .9, 0)}"/>` +
    shadow(50, 95, 24) +
    // 襁褓
    `<path d="M24 58 C18 82 34 93 50 93 C66 93 82 82 76 58 Z" fill="${g.lg('#FFFFFF', '#EAF5FF')}" stroke="#8CB9DD" stroke-width="4.5" ${SW}/>` +
    `<path d="M24 60 Q50 76 77 60 L74 70 Q50 84 27 70 Z" fill="#BFE0F5" stroke="#8CB9DD" stroke-width="3" ${SW}/>` +
    `<path d="${star5(62, 84, 4.2, 1.9)}" fill="#FFE69C" stroke="#D99A2B" stroke-width="1.6" ${SW}/>` +
    `<path d="${heartPath(38, 84, 3.6)}" fill="#FFB2C8"/>` +
    // 頭
    `<circle cx="31" cy="20" r="9.5" fill="#E9C7A3" stroke="#B48659" stroke-width="4"/><circle cx="31" cy="20" r="4.5" fill="#FFB8CC"/>` +
    `<circle cx="69" cy="20" r="9.5" fill="#E9C7A3" stroke="#B48659" stroke-width="4"/><circle cx="69" cy="20" r="4.5" fill="#FFB8CC"/>` +
    `<circle cx="50" cy="42" r="24" fill="${g.lg('#F3D9BC', '#E2B990')}" stroke="#B48659" stroke-width="4.5"/>` +
    `<ellipse cx="50" cy="51" rx="9.5" ry="7" fill="#FFF3E3"/>` +
    `<ellipse cx="50" cy="48.5" rx="3.2" ry="2.4" fill="${INK}"/>` +
    // 睡著的眼睛
    `<path d="M36 41 Q40 45 44 41 M56 41 Q60 45 64 41" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<ellipse cx="33" cy="49" rx="4.5" ry="2.8" fill="#FF6F92" opacity=".45"/><ellipse cx="67" cy="49" rx="4.5" ry="2.8" fill="#FF6F92" opacity=".45"/>` +
    // 奶嘴
    `<circle cx="50" cy="56.5" r="4.2" fill="#FF9EB5" stroke="#E0608A" stroke-width="2"/><circle cx="50" cy="56.5" r="1.4" fill="#fff"/>` +
    `<path d="M50 14 Q47 8 52 6" fill="none" stroke="#B48659" stroke-width="2.6" stroke-linecap="round"/>` +
    shine(37, 33, 3.4, 2, -30, .7) +
    `<path d="${sparkle(86, 20, 6)}" fill="#fff" stroke="#F3C55A" stroke-width="1.6" ${SW}/>`;
}

function snow(g, n) {
  const two = n >= 2;
  const flake = (x, y, r) => `<g stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"><path d="M${x - r} ${y} L${x + r} ${y} M${x - r * .5} ${y - r * .87} L${x + r * .5} ${y + r * .87} M${x - r * .5} ${y + r * .87} L${x + r * .5} ${y - r * .87}"/></g>`;
  return `<rect x="3" y="3" width="94" height="94" rx="18" fill="${two ? g.lg('#D8EEFC', '#B9DDF5') : g.lg('#EEF8FF', '#D6ECFB')}" stroke="${two ? '#6FAEDC' : '#9CCBEB'}" stroke-width="${two ? 5 : 4}"/>` +
    (two ? `<rect x="10" y="10" width="80" height="80" rx="13" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-dasharray="5 4" opacity=".9"/>` : '') +
    `<path d="M3 22 Q3 5 19 5 Q27 1 36 5 Q44 1 52 5 Q60 1 68 5 Q75 1 82 5 Q97 5 97 22 Q90 26 83 22 Q76 27 68 22 Q60 27 52 22 Q44 27 36 22 Q28 27 20 22 Q10 27 3 22 Z" fill="#FFFFFF" stroke="${two ? '#8CC1E6' : '#B8DDF5'}" stroke-width="2.6" ${SW}/>` +
    (two ? `<path d="M3 80 Q10 75 18 80 Q26 75 34 80 Q42 75 50 80 Q58 75 66 80 Q74 75 82 80 Q90 75 97 80 L97 82 Q97 97 82 97 L18 97 Q3 97 3 82 Z" fill="#FFFFFF" stroke="#8CC1E6" stroke-width="2.6" ${SW}/>` : '') +
    flake(13, 88, 5.5) + flake(87, 34, 5) +
    (two ? flake(13, 36, 4.5) + flake(87, 88 - 18, 4.5) : '') +
    `<path d="${sparkle(86, 88, 4.5)}" fill="#fff"/>`;
}

function crate(g, n) {
  const lv = Math.max(1, Math.min(3, n | 0));
  const nail = (x, y) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#8A5A3C" opacity=".75"/>`;
  let s = `<rect x="5" y="6" width="90" height="89" rx="12" fill="${g.lg('#F0C79D', '#D29A68')}" stroke="#8A5A3C" stroke-width="5"/>` +
    `<path d="M7 36 L93 36 M7 65 L93 65" stroke="#A9744E" stroke-width="3.2"/>` +
    `<path d="M14 21 Q30 19 44 22 M58 50 Q72 48 86 51 M16 80 Q30 78 40 81" stroke="#E3B488" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    `<path d="M14 14 L86 87" stroke="#B57E52" stroke-width="10" stroke-linecap="round"/>` +
    `<path d="M14 14 L86 87" stroke="#E2AE7E" stroke-width="5" stroke-linecap="round"/>` +
    nail(14, 14) + nail(86, 87) + shine(18, 27, 4, 2, -10, .45);
  if (lv >= 2) {
    const br = (x, y, rx, ry) => `<path d="M${x} ${y + ry * 18} L${x} ${y} L${x + rx * 18} ${y}" fill="none" stroke="#9E9AA8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M${x} ${y + ry * 18} L${x} ${y} L${x + rx * 18} ${y}" fill="none" stroke="#DCDAE3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="${x + rx * 5}" cy="${y + ry * 5}" r="2.2" fill="#77727F"/>`;
    s += br(11, 12, 1, 1) + br(89, 12, -1, 1) + br(11, 89, 1, -1) + br(89, 89, -1, -1);
  }
  if (lv >= 3) {
    s += `<path d="M50 6 L50 95 M5 50 L95 50" stroke="#E0608A" stroke-width="9"/>` +
      `<path d="M50 6 L50 95 M5 50 L95 50" stroke="#FF9EB5" stroke-width="5"/>` +
      `<path d="M50 50 C42 40 30 42 33 50 C30 58 42 60 50 50 Z" fill="#FF9EB5" stroke="#E0608A" stroke-width="3" ${SW}/>` +
      `<path d="M50 50 C58 40 70 42 67 50 C70 58 58 60 50 50 Z" fill="#FF9EB5" stroke="#E0608A" stroke-width="3" ${SW}/>` +
      `<circle cx="50" cy="50" r="4.6" fill="#FFD36E" stroke="#D99A2B" stroke-width="2"/>`;
  }
  return s;
}

function lock(g, kind) {
  if (kind === 'honey') {
    // 蜂蜜黏黏：上緣一層亮晶晶的蜂蜜往下滴，其餘只淡淡染一層琥珀色，看得到下面的物件
    return `<rect x="4" y="4" width="92" height="92" rx="18" fill="#FFC24C" opacity=".16"/>` +
      `<rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="#E9A42E" stroke-width="3" opacity=".8"/>` +
      `<path d="M4 20 Q4 4 20 4 L80 4 Q96 4 96 20 L96 27 Q93 32 90 27 Q89 40 83 40 Q77 40 78 29 Q73 24 68 29 Q68 34 63 34 Q58 34 59 28 Q53 23 47 28 Q48 46 40 46 Q33 46 34 30 Q29 24 23 29 Q23 36 17 36 Q11 36 11 29 Q7 25 4 28 Z" fill="${g.lg('#FFE08E', '#FFBF45')}" opacity=".9" stroke="#D99A2B" stroke-width="3" ${SW}/>` +
      `<path d="M14 11 Q30 8 44 11" stroke="#FFF6D6" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".95"/>` +
      `<ellipse cx="40" cy="39" rx="1.8" ry="3" fill="#FFF6D6" opacity=".9"/><ellipse cx="83" cy="33" rx="1.5" ry="2.4" fill="#FFF6D6" opacity=".9"/>` +
      `<path d="M4 82 Q4 96 18 96 L30 96 Q33 92 29 89 Q22 88 18 91 Q12 92 9 86 Q7 83 4 82 Z" fill="#FFC24C" opacity=".75" stroke="#D99A2B" stroke-width="2.2" ${SW}/>` +
      `<path d="${hexPath(86, 13, 5)}" fill="#FFEBA8" stroke="#E9A42E" stroke-width="1.8" ${SW}/>`;
  }
  // 毛線團：兩條米白色粗毛線纏過物件＋右下角的毛線球（米白色跟每一種物件都對比得出來）
  const strand = d => `<path d="${d}" fill="none" stroke="#B9875F" stroke-width="7.5" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="#FFF6EA" stroke-width="4.2" stroke-linecap="round"/>` +
    `<path d="${d}" fill="none" stroke="#E7C9A8" stroke-width="1.4" stroke-linecap="round" stroke-dasharray="2.5 3.5"/>`;
  return `<rect x="4" y="4" width="92" height="92" rx="18" fill="none" stroke="#D9B48E" stroke-width="3" stroke-dasharray="6 5" opacity=".9"/>` +
    strand('M5 34 Q34 20 58 36 Q78 50 95 40') +
    strand('M10 76 Q36 58 60 70 Q72 76 80 72') +
    strand('M24 5 Q16 40 34 58 Q46 72 42 95') +
    `<circle cx="82" cy="82" r="13" fill="${g.lg('#FFFBF4', '#F1DCC2')}" stroke="#B9875F" stroke-width="3.4"/>` +
    `<path d="M71 77 Q82 71 93 79 M70 85 Q82 79 94 87 M77 71 Q86 81 82 94" fill="none" stroke="#C9A07A" stroke-width="2" opacity=".85"/>` +
    `<path d="M74 92 L66 98" stroke="#FF8FB0" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="98" r="2.4" fill="#FF8FB0"/>` +
    shine(77, 76, 2.4, 1.5, -30, .9);
}

// ---------- v1.2 蠟筆塗色、驚喜禮物盒 ----------
/** 已上色的格子底：粉彩彩虹蠟筆色塊＋斜斜的蠟筆筆觸＋手畫感的邊框＋四角小塗鴉（tile 蓋上去四角仍看得到） */
function paint(g) {
  const fill = g.lgN([[0, '#FFB3CB'], [.38, '#FFD49E'], [.66, '#B5E7C2'], [1, '#B3CFF6']], 1, 1);
  const hatch = g.pattern(7, 7, `<path d="M-1 8 L8 -1" stroke="#FFFFFF" stroke-width="1.7" opacity=".5"/>`);
  const hatch2 = g.pattern(11, 11, `<path d="M-1 3 L3 -1 M-1 12 L12 -1" stroke="#E2789E" stroke-width="1" opacity=".22"/>`);
  const edge = `M10 7 Q30 4 50 6.5 Q72 4 90 7.5 Q96 12 93.5 30 Q96 50 93 70 Q95.5 88 90 93 Q70 96 50 93.5 Q28 96 10 93 Q4.5 88 6.5 70 Q4 50 7 30 Q4.5 12 10 7 Z`;
  return `<rect x="3.5" y="3.5" width="93" height="93" rx="22" fill="${fill}" opacity=".9"/>` +
    `<rect x="3.5" y="3.5" width="93" height="93" rx="22" fill="${hatch}"/>` +
    `<rect x="3.5" y="3.5" width="93" height="93" rx="22" fill="${hatch2}"/>` +
    `<path d="${edge}" fill="none" stroke="#F07CA4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>` +
    `<path d="M12 10.5 Q40 7.5 66 10 M89.5 34 Q92 60 89 82" fill="none" stroke="#9C86E6" stroke-width="2" stroke-linecap="round" opacity=".45"/>` +
    `<path d="${star5(15, 15, 7, 3.2)}" fill="#FFE27A" stroke="#F0A93A" stroke-width="1.8" ${SW}/>` +
    `<path d="${heartPath(85.5, 85, 6)}" fill="#FF8FB0" stroke="#E0608A" stroke-width="1.6"/>` +
    `<circle cx="86" cy="14" r="3.4" fill="#8ED8A2" stroke="#4FA06A" stroke-width="1.4"/>` +
    `<circle cx="14" cy="86" r="3.4" fill="#8CC6EE" stroke="#4E8FC4" stroke-width="1.4"/>`;
}

/** 驚喜禮物盒：1 層＝粉紅點點盒＋金色直緞帶＋蝴蝶結；2 層＝再包一層紫色星星包裝紙＋十字緞帶＋大蝴蝶結＋吊牌 */
function gift(g, n) {
  const two = n >= 2;
  const box = two ? { a: '#E6DCFE', b: '#A892EE', s: '#6F57BE', lid: ['#EEE8FF', '#BBA8F4'] }
                  : { a: '#FFD0DD', b: '#FF8FB0', s: '#E0608A', lid: ['#FFE1EA', '#FFA6C1'] };
  const rib = two ? { m: '#FF9EB5', l: '#FFE1EA', s: '#E0608A' } : { m: '#FFD36E', l: '#FFF0C4', s: '#D99A2B' };
  const sw = two ? 5.5 : 4.5;
  const deco = two
    ? [[22, 52], [76, 54], [24, 84], [78, 85], [36, 38], [68, 37]].map(([x, y], i) => i % 2 ? `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff" opacity=".85"/>` : `<path d="${star5(x, y, 4.6, 2)}" fill="#FFE69C" stroke="#D99A2B" stroke-width="1.3" ${SW}/>`).join('')
    : [[22, 54], [32, 80], [70, 56], [80, 80], [24, 37], [76, 37]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" opacity=".8"/>`).join('');
  const s = two ? 1.25 : 1;
  const loop = (dir) => `<path d="M50 30 C${50 + dir * 8 * s} ${30 - 15 * s} ${50 + dir * 25 * s} ${30 - 17 * s} ${50 + dir * 24 * s} ${30 - 5 * s} C${50 + dir * 23 * s} ${30 + 3 * s} ${50 + dir * 10 * s} ${30 + 2 * s} 50 30 Z" fill="${g.lg(rib.l, rib.m)}" stroke="${rib.s}" stroke-width="3.6" ${SW}/>`;
  const tails = `<path d="M47 31 L38 44 L44 43 L45 49 L51 33 Z M53 31 L62 44 L56 43 L55 49 L49 33 Z" fill="${rib.m}" stroke="${rib.s}" stroke-width="2.6" ${SW}/>`;
  let out = shadow(50, 95, 36) +
    `<rect x="12" y="42" width="76" height="50" rx="9" fill="${g.lg(box.a, box.b)}" stroke="${box.s}" stroke-width="${sw}"/>` +
    deco +
    `<rect x="43" y="42" width="14" height="50" fill="${rib.m}" stroke="${rib.s}" stroke-width="2.6"/>` +
    `<path d="M47 44 L47 90" stroke="${rib.l}" stroke-width="2.2" opacity=".9"/>`;
  if (two) out += `<rect x="12" y="60" width="76" height="13" fill="${rib.m}" stroke="${rib.s}" stroke-width="2.6"/>` +
    `<path d="M14 63.5 L86 63.5" stroke="${rib.l}" stroke-width="2.2" opacity=".9"/>` +
    `<rect x="43" y="60" width="14" height="13" fill="${shade(rib.m, -.06)}" stroke="${rib.s}" stroke-width="2.6"/>`;
  out += `<rect x="12" y="42" width="76" height="50" rx="9" fill="none" stroke="${box.s}" stroke-width="${sw}"/>` +
    `<rect x="7" y="30" width="86" height="16" rx="7" fill="${g.lg(box.lid[0], box.lid[1])}" stroke="${box.s}" stroke-width="${sw}"/>` +
    `<rect x="43" y="30" width="14" height="16" fill="${rib.m}" stroke="${rib.s}" stroke-width="2.6"/>` +
    `<rect x="7" y="30" width="86" height="16" rx="7" fill="none" stroke="${box.s}" stroke-width="${sw}"/>` +
    shine(17, 35, 4, 1.8, -8, .8) + shine(19, 62, 2.4, 7, 0, .5) +
    tails + loop(-1) + loop(1) +
    `<circle cx="50" cy="30" r="${two ? 6 : 5}" fill="${rib.m}" stroke="${rib.s}" stroke-width="2.8"/>` + dot(48.5, 28.5, 1.5, .9);
  if (two) out += `<path d="M62 33 L73 19" stroke="#C9956C" stroke-width="1.6"/>` +
    `<path d="M70 14 L81 12 L84 22 L74 25 Z" fill="#FFF6E6" stroke="#C9956C" stroke-width="2.2" ${SW}/>` +
    `<circle cx="73" cy="17.5" r="1.4" fill="#C9956C"/>` +
    `<path d="${heartPath(78.5, 18.5, 3)}" fill="#FF8FB0"/>` +
    `<path d="${sparkle(14, 18, 6)}" fill="#fff" stroke="#B9A6F0" stroke-width="1.8" ${SW}/>`;
  else out += `<path d="${sparkle(86, 16, 5.5)}" fill="#fff" stroke="#F3A6C0" stroke-width="1.6" ${SW}/>`;
  return out;
}

function exitDoor(g) {
  return `<path d="M10 4 L22 4 L16 13 Z M78 4 L90 4 L84 13 Z" fill="#FF9EB5" stroke="#E0608A" stroke-width="2" ${SW}/>` +
    `<path d="M10 17 L22 17 L16 26 Z M78 17 L90 17 L84 26 Z" fill="#FFC9D8" stroke="#E0608A" stroke-width="2" ${SW}/>` +
    `<rect x="27" y="33" width="46" height="7" rx="3.5" fill="#FFB2C8" stroke="#E0608A" stroke-width="2.4"/>` +
    `<path d="M33 35 L33 16 Q33 3 50 3 Q67 3 67 16 L67 35 Z" fill="${g.lg('#E8B98A', '#C98F5F')}" stroke="#8A5A3C" stroke-width="3.6" ${SW}/>` +
    `<path d="M37 33 L37 17 Q37 7 50 7 Q63 7 63 17 L63 33" fill="none" stroke="#B57E52" stroke-width="1.8"/>` +
    `<path d="${heartPath(50, 16, 4.4)}" fill="#FFE69C" stroke="#D99A2B" stroke-width="1.6"/>` +
    `<circle cx="60" cy="25" r="2.4" fill="#FFD36E" stroke="#D99A2B" stroke-width="1.4"/>`;
}

// =====================================================================
// 六章主題
// =====================================================================
// 不加引號的 url()：把 ( ) ' 也編碼，放進 style 屬性或 JS 都不會斷掉
const enc = s => `url(data:image/svg+xml,${encodeURIComponent(s).replace(/[()']/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())})`;
const MOTIF = {
  leaf: (x, y, col) => `<path d="M${x - 4} ${y + 3} Q${x - 4} ${y - 4} ${x + 4} ${y - 4} Q${x + 4} ${y + 3} ${x - 4} ${y + 3} Z" fill='${col}'/>`,
  button: (x, y, col) => `<circle cx='${x}' cy='${y}' r='3.6' fill='${col}'/><circle cx='${x - 1}' cy='${y}' r='.8' fill='#fff'/><circle cx='${x + 1.2}' cy='${y}' r='.8' fill='#fff'/>`,
  star: (x, y, col) => `<path d='${star5(x, y, 4, 1.8)}' fill='${col}'/>`,
  cloud: (x, y, col) => `<path d='M${x - 6} ${y + 2} Q${x - 6} ${y - 2} ${x - 2} ${y - 2} Q${x} ${y - 5} ${x + 3} ${y - 2} Q${x + 6} ${y - 2} ${x + 6} ${y + 2} Z' fill='${col}'/>`,
};
/** 背景菱格絎縫紋（透明底，疊在漸層上） */
function quilt(size, line, dash, dotCol, motif, motifCol) {
  const h = size / 2;
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<defs><radialGradient id='a'><stop offset='0' stop-color='#fff' stop-opacity='.8'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient></defs>` +
    `<g fill='url(#a)'><circle cx='${h}' cy='0' r='${size * .3}'/><circle cx='0' cy='${h}' r='${size * .3}'/><circle cx='${size}' cy='${h}' r='${size * .3}'/><circle cx='${h}' cy='${size}' r='${size * .3}'/></g>` +
    `<path d='M0 0L${size} ${size}M${size} 0L0 ${size}' stroke='${line}' stroke-width='${size / 14}'/>` +
    `<path d='M0 0L${size} ${size}M${size} 0L0 ${size}' stroke='${dash}' stroke-width='${size / 46}' stroke-dasharray='3 3.5'/>` +
    `<g fill='${dotCol}'><circle cx='${h}' cy='${h}' r='${size / 24}'/><circle cx='0' cy='0' r='${size / 24}'/><circle cx='${size}' cy='0' r='${size / 24}'/><circle cx='0' cy='${size}' r='${size / 24}'/><circle cx='${size}' cy='${size}' r='${size / 24}'/></g>` +
    (motif ? `<g opacity='.55'>${MOTIF[motif](h, size * .12, motifCol)}${MOTIF[motif](h, size * 1.12, motifCol)}</g>` : '') +
    `</svg>`;
  return enc(s.replace(/"/g, "'"));
}
/** 棋盤框的小格紋（含底色） */
function frameQuilt(base, line, dash, dotCol) {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'>` +
    `<defs><radialGradient id='a'><stop offset='0' stop-color='#fff' stop-opacity='.7'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient></defs>` +
    `<rect width='32' height='32' fill='${base}'/>` +
    `<g fill='url(#a)'><circle cx='16' cy='0' r='10'/><circle cx='0' cy='16' r='10'/><circle cx='32' cy='16' r='10'/><circle cx='16' cy='32' r='10'/></g>` +
    `<path d='M0 0L32 32M32 0L0 32' stroke='${line}' stroke-width='3'/>` +
    `<path d='M0 0L32 32M32 0L0 32' stroke='${dash}' stroke-width='1' stroke-dasharray='2 2.4'/>` +
    `<g fill='${dotCol}'><circle cx='16' cy='16' r='1.5'/><circle cx='0' cy='0' r='1.5'/><circle cx='32' cy='0' r='1.5'/><circle cx='0' cy='32' r='1.5'/><circle cx='32' cy='32' r='1.5'/></g></svg>`;
  return enc(s);
}

// ---------- v1.2 第 5、6 章的背景 ----------
/** 第 5 章：午後陽光教室——筆記本橫線＋粉紅邊線＋粉筆綠小塗鴉＋右上斜照的陽光；棋盤框是軟木板 */
function classroomBg() {
  const doodle =
    `<path d='${star5(22, 16, 6, 2.7)}' fill='none' stroke='#8FC7A0' stroke-width='1.6' stroke-linejoin='round'/>` +
    `<path d='${heartPath(92, 46, 4.6)}' fill='none' stroke='#F4A9BF' stroke-width='1.6'/>` +
    `<circle cx='52' cy='76' r='4' fill='none' stroke='#F2C45A' stroke-width='1.6'/>` +
    `<path d='M100 101 h8 M104 97 v8' stroke='#8FC7A0' stroke-width='1.6' stroke-linecap='round'/>` +
    `<path d='M12 104 l5 -8 l5 8 z' fill='none' stroke='#B7A6EE' stroke-width='1.5' stroke-linejoin='round'/>`;
  const tile = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>` +
    `<path d='M0 29.5H120M0 59.5H120M0 89.5H120M0 119.5H120' stroke='#CFE1F1' stroke-width='1.6'/>` +
    `<g opacity='.6'>${doodle}</g></svg>`;
  return `linear-gradient(118deg, rgba(255,250,225,0) 38%, rgba(255,247,214,.55) 46%, rgba(255,250,225,0) 54%, rgba(255,250,225,0) 60%, rgba(255,247,214,.4) 65%, rgba(255,250,225,0) 71%), ` +
    `radial-gradient(130% 70% at 100% 0%, rgba(255,226,140,.5), rgba(255,226,140,0) 60%), ` +
    `linear-gradient(90deg, rgba(240,140,165,0) 26px, rgba(240,140,165,.5) 26px, rgba(240,140,165,.5) 28px, rgba(240,140,165,0) 28px), ` +
    `${enc(tile)} 0 0 / 120px 120px repeat, linear-gradient(180deg, #FFF9E6, #F6EAD3)`;
}
/** 軟木板紋（棋盤框） */
function corkFrame() {
  let sp = '';
  const pts = [[3, 5], [11, 2], [19, 9], [28, 4], [35, 12], [6, 15], [14, 20], [24, 17], [32, 24], [2, 27], [10, 31], [20, 28], [29, 35], [37, 31], [5, 38], [16, 37], [25, 6], [33, 19], [8, 23], [22, 33]];
  pts.forEach(([x, y], i) => { sp += `<ellipse cx='${x}' cy='${y}' rx='${1 + (i % 3) * .4}' ry='${.8 + (i % 2) * .4}' fill='${i % 3 ? '#C39260' : '#F7DFB9'}' opacity='${i % 3 ? .55 : .8}'/>`; });
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#E6C597'/>${sp}</svg>`;
  return `${enc(s)} 0 0 / 40px 40px repeat, #E6C597`;
}
/** 第 6 章：彩燈遊樂園——頂端旋轉木馬花邊＋一排排彩色串燈＋粉彩條紋帳篷，整體明亮 */
function parkBg() {
  const val = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='22'>` +
    `<path d='M0 0H20V9A10 10 0 0 1 0 9Z' fill='#FFB8CF'/><path d='M20 0H40V9A10 10 0 0 1 20 9Z' fill='#CDBDF8'/>` +
    `<circle cx='10' cy='14.5' r='2.2' fill='#FFE08E'/><circle cx='30' cy='14.5' r='2.2' fill='#FFE08E'/></svg>`;
  const cols = ['#FFD36E', '#FF9EB5', '#8ED8A2', '#8CC6EE', '#B9A6F0', '#FFB38E'];
  let bulbs = '';
  const q = (t, x0, x1) => { const xm = (x0 + x1) / 2; const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * xm + t * t * x1; const y = (1 - t) * (1 - t) * 34 + 2 * (1 - t) * t * 58 + t * t * 34; return [x, y]; };
  let k = 0;
  for (const [x0, x1] of [[0, 80], [80, 160]]) for (const t of [.17, .5, .83]) {
    const [x, y] = q(t, x0, x1), col = cols[k++ % cols.length];
    bulbs += `<circle cx='${x.toFixed(1)}' cy='${(y + 5).toFixed(1)}' r='10' fill='${col}' opacity='.22'/>` +
      `<rect x='${(x - 1.6).toFixed(1)}' y='${(y - 1).toFixed(1)}' width='3.2' height='3' fill='#B49CCB'/>` +
      `<ellipse cx='${x.toFixed(1)}' cy='${(y + 5).toFixed(1)}' rx='3.6' ry='4.6' fill='${col}'/>` +
      `<circle cx='${(x - 1.1).toFixed(1)}' cy='${(y + 3.6).toFixed(1)}' r='1.1' fill='#fff' opacity='.9'/>`;
  }
  const lights = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='150'>` +
    `<path d='M0 34Q40 58 80 34Q120 58 160 34' fill='none' stroke='#C7A9D9' stroke-width='1.6'/>${bulbs}` +
    `<path d='${star5(40, 112, 4, 1.8)}' fill='#FFE08E' opacity='.7'/><circle cx='122' cy='100' r='2.4' fill='#FF9EB5' opacity='.6'/><circle cx='96' cy='128' r='1.8' fill='#8CC6EE' opacity='.7'/></svg>`;
  return `${enc(val)} 0 0 / 40px 22px repeat-x, ${enc(lights)} 0 8px / 160px 150px repeat, ` +
    `repeating-linear-gradient(90deg, rgba(255,186,212,.32) 0 30px, rgba(255,255,255,0) 30px 60px), ` +
    `linear-gradient(180deg, #FFEAF3 0%, #FFF4F8 45%, #EDE6FC 100%)`;
}
/** 糖果條紋棋盤框 */
function candyFrame() {
  return `repeating-linear-gradient(45deg, #FFC2D7 0 9px, #FFF4F8 9px 18px), #FFD0E1`;
}

const THEMES = {
  1: { name: '晨光森林', top: '#FFF6E2', bottom: '#EAF6E1', line: '#F0E2C8', dash: '#DCC79F', dot: '#E3BF72', motif: 'leaf', motifCol: '#9ED6A9',
       boardFrame: '#FFDCE6', fLine: '#F7C3D2', fDash: '#EEA3BB', fDot: '#E3BF72', cellA: '#FFF7EC', cellB: '#FCEBD9', accent: '#FF9EB5' },
  2: { name: '粉色裁縫店', top: '#FFF2F6', bottom: '#FCE2EC', line: '#F6D5E0', dash: '#E9AFC3', dot: '#E3BF72', motif: 'button', motifCol: '#F59BB8',
       boardFrame: '#E9DEFB', fLine: '#D7C8F6', fDash: '#B9A5EE', fDot: '#E3BF72', cellA: '#FFF8FA', cellB: '#FBE7EF', accent: '#E8668C' },
  3: { name: '暖燈樹洞', top: '#FBEBD8', bottom: '#F1D6BA', line: '#EBD2B2', dash: '#D4AE82', dot: '#E3BF72', motif: 'star', motifCol: '#FFD36E',
       boardFrame: '#F5DDBE', fLine: '#E7C59A', fDash: '#D3A46D', fDot: '#C9956C', cellA: '#FFF7EA', cellB: '#F6E2C9', accent: '#E0A030' },
  4: { name: '夕陽湖畔', top: '#FFE6D6', bottom: '#E2ECFB', line: '#F3D8CC', dash: '#E2B6A6', dot: '#E3BF72', motif: 'cloud', motifCol: '#FFFFFF',
       boardFrame: '#D8EBFB', fLine: '#BCDAF4', fDash: '#95C2EA', fDot: '#E3BF72', cellA: '#F8FBFF', cellB: '#E6F0FA', accent: '#5FA8DE' },
  // v1.2：第 5、6 章用自己的背景與框（custom）
  5: { name: '午後陽光教室', custom: true, bg: classroomBg, frame: corkFrame,
       boardFrame: '#E6C597', cellA: '#FFFDF5', cellB: '#F6EEDC', accent: '#4FA06A' },
  6: { name: '彩燈遊樂園', custom: true, bg: parkBg, frame: candyFrame,
       boardFrame: '#FFD0E1', cellA: '#FFFAFD', cellB: '#F2EDFC', accent: '#A07BE6' },
};

// =====================================================================
// 對外 API
// =====================================================================
/** 24 種物件之一（帶小臉），完整 SVG 字串 */
export function tileSVG(item) {
  const fn = ART[item];
  const g = ctx();
  if (!fn) return g.wrap(`<circle cx="50" cy="52" r="32" fill="#EEE" stroke="#BBB" stroke-width="4"/>`);
  return g.wrap(fn(g));
}
/** 特殊道具：'pawH' | 'pawV' | 'bomb' | 'perfume'；opts.perfumeColor 改香水瓶顏色 */
export function specialSVG(special, opts = {}) {
  const g = ctx();
  if (special === 'pawH') return g.wrap(pawH(g));
  if (special === 'pawV') return g.wrap(pawV(g));
  if (special === 'bomb') return g.wrap(bomb(g));
  if (special === 'perfume') return g.wrap(perfume(g, opts.perfumeColor));
  return g.wrap('');
}
/** 熊寶寶 */
export function babySVG() { const g = ctx(); return g.wrap(baby(g)); }
/** 格子底下的雪墊（1 或 2 層），畫在 tile 下方 */
export function snowSVG(layers = 1) { const g = ctx(); return g.wrap(snow(g, layers)); }
/** 木箱（1–3 層） */
export function crateSVG(layers = 1) { const g = ctx(); return g.wrap(crate(g, layers)); }
/** 罩在 tile 上的鎖：'yarn' 毛線團、'honey' 蜂蜜黏黏（半透明，看得到下面的物件） */
export function lockSVG(kind) { const g = ctx(); return g.wrap(lock(g, kind)); }
/** 熊寶寶回家的小門，viewBox 0 0 100 40，畫在出口欄最下方格子的下緣 */
export function exitSVG() { const g = ctx(); return g.wrap(exitDoor(g), '0 0 100 40'); }
/**
 * 六章主題（1–6）。回傳：
 * bg（整頁 CSS background 值）、boardFrame（棋盤框底色）、frameBg（棋盤框的 CSS background 值，含格紋）、
 * boardBg（棋盤內底色）、cellA / cellB（交錯格子色）、accent（強調色）、name
 */
export function chapterTheme(ch) {
  const t = THEMES[ch] || THEMES[1];
  return {
    name: t.name,
    bg: t.custom ? t.bg() : `${quilt(56, t.line, t.dash, t.dot, t.motif, t.motifCol)} 0 0 / 56px 56px repeat, linear-gradient(180deg, ${t.top}, ${t.bottom})`,
    boardFrame: t.boardFrame,
    frameBg: t.custom ? t.frame() : `${frameQuilt(t.boardFrame, t.fLine, t.fDash, t.fDot)} 0 0 / 32px 32px repeat, ${t.boardFrame}`,
    boardBg: '#FFFDF8',
    cellA: t.cellA,
    cellB: t.cellB,
    accent: t.accent,
  };
}
/** v1.2 已上色格子的底（畫在格子底色上、雪和 tile 下面），viewBox 0 0 100 100 */
export function paintSVG() { const g = ctx(); return g.wrap(paint(g)); }
/** v1.2 驚喜禮物盒（1–2 層），viewBox 0 0 100 100 */
export function giftSVG(layers = 1) { const g = ctx(); return g.wrap(gift(g, layers)); }
/** 每種物件的主色（給粒子特效）；特殊道具、寶寶也有 */
export const ITEM_COLORS = {
  honey: '#FFC94D', salmon: '#FF9A6B', straw: '#FF8FB0', blue: '#A98FEA', acorn: '#C99A73', apple: '#7DD39A',
  bow: P.pink.m, knitHat: P.lav.m, scarf: P.mint.m, boots: P.yellow.m, dungarees: P.sky.m, apron: P.peach.m,
  pillow: P.sky.m, blanket: P.pink.m, nightLamp: P.yellow.m, cocoaMug: P.cocoa.m, plant: P.mint.m, clock: P.peach.m,
  airBalloon: P.pink.m, bicycle: P.mint.m, backpack: P.peach.m, boat: P.sky.m, map: P.yellow.m, camera: P.lav.m,
  pencil: P.yellow.m, book: P.sky.m, crayon: P.pink.m, globe: P.mint.m, palette: P.peach.m, puzzle: P.lav.m,
  cottonCandy: P.pink.m, iceCream: P.mint.m, popcorn: P.yellow.m, trumpet: P.peach.m, carousel: P.lav.m, ferrisWheel: P.sky.m,
  pawH: '#FF9EB5', pawV: '#FF9EB5', bomb: '#FFC94D', perfume: '#FF9EB5', baby: '#E2B990',
};
/** 全部 36 種物件 id（預覽與測試用） */
export const ALL_TILE_ITEMS = Object.keys(ART);
