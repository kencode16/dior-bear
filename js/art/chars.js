// 角色美術（B2 擁有）：丁噹熊、大不溜（杜賓犬）、換裝圖層、商店小圖示。全部回傳完整 SVG 字串。
//
// viewBox（比架構.md 的預設值微調，沿用風格試作的座標，才能放下帽子、氣球和香水瓶）：
//   丁噹熊 BEAR_VIEWBOX = '0 -14 236 274'（寬 236、高 274，腳底約在 y=247）
//   大不溜 DOG_VIEWBOX  = '0 -16 128 130'（寬 128、高 130，腳底約在 y=106）
//   商店圖示 itemIconSVG = '0 0 100 100'
// 外部只需要用寬度縮放（height:auto），不必依賴這些數字。
//
// live:true 是給 charactersView 用的內部模式：所有表情都畫進同一張 SVG，靠根節點 data-expr 切換（CSS 在 css/chars.css）。
import { INK, SW, shine, dot, sparkle, star5, heartPath, uid } from './common.js';

export const BEAR_VIEWBOX = '0 -14 236 274';
export const DOG_VIEWBOX = '0 -16 128 130';
export const BEAR_EXPRS = ['normal', 'happy', 'squint', 'worried', 'pout', 'surprised', 'wink'];
export const DOG_EXPRS = ['smug', 'happy', 'bark', 'lick', 'sneeze', 'sad'];

// ---------------- 顏色小工具 ----------------
function rgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); }
function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function fromHsl([h, s, l]) {
  if (!s) return [l * 255, l * 255, l * 255];
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
/** 同色系較深的描邊色（不是純黑） */
export function deep(c) { const [h, s, l] = toHsl(rgb(c)); return hex(fromHsl([h, s * .66, l * .8])); }

const wrap = (inner, vb, cls = '', attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" class="${cls}" ${attrs} aria-hidden="true">${inner}</svg>`;
const goldGrad = id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE68F"/><stop offset="1" stop-color="#F2B42E"/></linearGradient>`;
/** 二次貝茲曲線上的點 */
const qpt = (p0, p1, p2, t) => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
const f1 = n => +n.toFixed(1);

// =====================================================================
//                               丁噹熊
// =====================================================================
const BC = '#FFF1DE', BO = '#D6A985', BROWN = '#7A4A38';

// ---------- 香水瓶（右手，顏色跟著今天選的香水） ----------
function perfumeBottle(ids, color) {
  const dk = deep(color), bulb = mix(color, '#ffffff', .12);
  return `<path d="M57 21 Q78 18 84 34" fill="none" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>` +
    `<g class="ch-bulb"><ellipse cx="85" cy="42" rx="8" ry="9.5" fill="${bulb}" stroke="${dk}" stroke-width="3"/>${shine(82.3, 38.6, 2, 3, 20, .75)}` +
    `<path d="M85 51.5 L85 55" stroke="#C98F1F" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M82.2 55 Q85 64.5 87.8 55 Z" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.6" ${SW}/></g>` +
    `<circle cx="47" cy="63" r="27" fill="url(#${ids.glass})" stroke="${dk}" stroke-width="5"/>` +
    `<path d="M20.2 66 Q33.6 60 47 66 Q60.4 72 73.8 66 A27 27 0 0 1 20.2 66 Z" fill="${color}" opacity=".55"/>` +
    `<rect x="39" y="29" width="16" height="10" rx="3" fill="${mix(color, '#ffffff', .6)}" stroke="${dk}" stroke-width="4"/>` +
    `<rect x="35.5" y="13" width="23" height="17" rx="6" fill="url(#${ids.gold})" stroke="#C98F1F" stroke-width="4"/>` +
    shine(41.5, 18, 3.2, 1.9, -15, .85) +
    `<path d="M55 15 L61.5 9" stroke="#C98F1F" stroke-width="4.2" stroke-linecap="round"/>` +
    `<circle class="ch-nozzle" cx="62.5" cy="8" r="1" fill="none"/>` +
    `<path d="M47 37.5 C39 29 29.5 32 31.5 39.5 C33.5 47 42 45 47 37.5 Z" fill="#fff" stroke="${dk}" stroke-width="3" ${SW}/>` +
    `<path d="M47 37.5 C55 29 64.5 32 62.5 39.5 C60.5 47 52 45 47 37.5 Z" fill="#fff" stroke="${dk}" stroke-width="3" ${SW}/>` +
    `<circle cx="47" cy="37.5" r="3.6" fill="#F6CF66" stroke="#C98F1F" stroke-width="2"/>` +
    `<path d="M27 58 Q29 49 36 45" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".85"/>` + dot(26, 66, 2.4, .85);
}

// ---------- 緞帶與鈴鐺 ----------
const RIBBONS = {
  rib_pink:      { dark: '#E0668A', light: '#FFA3BB', bow: '#FFB0C4', knot: '#FF8FAA', bell: 'round' },
  rib_mint:      { dark: '#4FA06A', light: '#A8E6B8', bow: '#C4F0D0', knot: '#8ED9A4', bell: 'round' },
  rib_lavender:  { dark: '#8E72D6', light: '#C9B8F5', bow: '#DED3FB', knot: '#B9A4F0', bell: 'round' },
  rib_honey:     { dark: '#D08A1E', light: '#FFD36E', bow: '#FFE6A6', knot: '#FFC94D', bell: 'round' },
  rib_heartBell: { dark: '#D94C77', light: '#FF8FAA', bow: '#FFA8BF', knot: '#FF7A9C', bell: 'heart' },
  rib_starBell:  { dark: '#5A9CCB', light: '#A9D8F5', bow: '#CBE8FA', knot: '#8CCBEA', bell: 'star' },
};
function bellArt(kind, gold) {
  const top = `<circle cx="110" cy="185" r="3.6" fill="none" stroke="#C98F1F" stroke-width="2.6"/>`;
  let body;
  if (kind === 'heart') {
    body = `<path d="${heartPath(110, 199, 11.5)}" fill="url(#${gold})" stroke="#C98F1F" stroke-width="3.2" ${SW}/>` +
      `<path d="M104 199 L116 199" stroke="#C98F1F" stroke-width="2.2" stroke-linecap="round"/><circle cx="110" cy="203.5" r="2.2" fill="#A97412"/>` +
      `<ellipse cx="104" cy="193.5" rx="3" ry="1.9" fill="#fff" opacity=".9" transform="rotate(-30 104 193.5)"/>`;
  } else if (kind === 'star') {
    body = `<path d="${star5(110, 199.5, 14, 7)}" fill="url(#${gold})" stroke="#C98F1F" stroke-width="3" ${SW}/>` +
      `<circle cx="110" cy="201" r="2.4" fill="#A97412"/><ellipse cx="106.5" cy="194" rx="2.6" ry="1.6" fill="#fff" opacity=".9" transform="rotate(-30 106.5 194)"/>`;
  } else {
    body = `<circle cx="110" cy="198" r="11.5" fill="url(#${gold})" stroke="#C98F1F" stroke-width="3.2"/>` +
      `<path d="M100 199.5 L120 199.5" stroke="#C98F1F" stroke-width="2.6" stroke-linecap="round"/>` +
      `<circle cx="110" cy="204.5" r="2.4" fill="#A97412"/>` +
      `<ellipse cx="105.5" cy="193" rx="3.3" ry="2.1" fill="#fff" opacity=".9" transform="rotate(-25 105.5 193)"/>`;
  }
  return `<g class="ch-bell">${top}${body}</g>`;
}
function ribbonArt(id, gold) {
  const r = RIBBONS[id] || RIBBONS.rib_pink;
  return `<path d="M72 167 Q110 186 148 167" fill="none" stroke="${r.dark}" stroke-width="14" stroke-linecap="round"/>` +
    `<path d="M72 167 Q110 186 148 167" fill="none" stroke="${r.light}" stroke-width="8.5" stroke-linecap="round"/>` +
    `<path d="M110 178 L101 194 M110 178 L119 194" stroke="${r.dark}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M110 178 L101 194 M110 178 L119 194" stroke="${r.light}" stroke-width="3.2" stroke-linecap="round"/>` +
    bellArt(r.bell, gold) +
    `<path d="M110 178 C96 165 83 169 85 180 C87 191 100 189 110 178 Z" fill="${r.bow}" stroke="${r.dark}" stroke-width="3.6" stroke-linejoin="round"/>` +
    `<path d="M110 178 C124 165 137 169 135 180 C133 191 120 189 110 178 Z" fill="${r.bow}" stroke="${r.dark}" stroke-width="3.6" stroke-linejoin="round"/>` +
    `<path d="M93 175 Q97 172 101 175" fill="none" stroke="${r.dark}" stroke-width="2" opacity=".6" stroke-linecap="round"/>` +
    `<path d="M119 175 Q123 172 127 175" fill="none" stroke="${r.dark}" stroke-width="2" opacity=".6" stroke-linecap="round"/>` +
    `<circle cx="110" cy="178" r="6" fill="${r.knot}" stroke="${r.dark}" stroke-width="3"/>`;
}

// ---------- 衣服（穿在身上，剪裁成身體形狀；有袖子的會把手臂染色） ----------
const CLOTHES = {
  cl_apron: {
    art: () => `<path d="M80 174 Q110 182 140 174 L147 240 L73 240 Z" fill="#FFFFFF" stroke="#F3A6BF" stroke-width="3" ${SW}/>` +
      `<path d="M74 229 q4.6 7 9.2 0 q4.6 7 9.2 0 q4.6 7 9.2 0 q4.6 7 9.2 0 q4.6 7 9.2 0 q4.6 7 9.2 0 q4.6 7 9.2 0 q4.6 7 9.2 0" fill="none" stroke="#FF9EB5" stroke-width="3.2" stroke-linecap="round"/>` +
      `<path d="M52 203 Q110 216 168 203" fill="none" stroke="#FF9EB5" stroke-width="5.5" stroke-linecap="round"/>` +
      `<path d="${heartPath(110, 222, 8.5)}" fill="#FFD6E1" stroke="#F08AAA" stroke-width="2.4" ${SW}/>` +
      `<path d="M102 220 L118 220" stroke="#F08AAA" stroke-width="1.6" stroke-dasharray="2 2.4" opacity=".8"/>`,
  },
  cl_overalls: {
    art: () => `<path d="M40 210 Q110 222 180 210 L180 260 L40 260 Z" fill="#A9D3F2"/>` +
      `<path d="M40 210 Q110 222 180 210" fill="none" stroke="#5E93C4" stroke-width="3"/>` +
      `<path d="M50 214 Q110 226 170 214" fill="none" stroke="#5E93C4" stroke-width="1.6" stroke-dasharray="3 3" opacity=".7"/>` +
      `<path d="M71 168 L90 186 M149 168 L130 186" stroke="#5E93C4" stroke-width="10.5" stroke-linecap="round"/>` +
      `<path d="M71 168 L90 186 M149 168 L130 186" stroke="#A9D3F2" stroke-width="6.5" stroke-linecap="round"/>` +
      `<path d="M86 184 Q110 181 134 184 L136 218 Q110 222 84 218 Z" fill="#A9D3F2" stroke="#5E93C4" stroke-width="3" ${SW}/>` +
      `<rect x="99" y="194" width="22" height="15" rx="4" fill="none" stroke="#5E93C4" stroke-width="1.8" stroke-dasharray="2.6 2.4"/>` +
      `<circle cx="91" cy="190" r="3.6" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.8"/><circle cx="129" cy="190" r="3.6" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.8"/>` +
      `<path d="M110 222 L110 260" stroke="#5E93C4" stroke-width="2" opacity=".6"/>`,
  },
  cl_raincoat: {
    sleeve: ['#FFD86E', '#D99A2B'],
    art: () => `<rect x="40" y="140" width="140" height="120" fill="#FFD86E"/>` +
      `<path d="M58 176 Q80 196 66 214" fill="none" stroke="#FFF4CC" stroke-width="5" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M110 184 L110 245" stroke="#D99A2B" stroke-width="3"/>` +
      [198, 214, 230].map(y => `<rect x="114" y="${y - 3}" width="12" height="6" rx="3" fill="#B97A4E" stroke="#8A5536" stroke-width="1.6"/><path d="M110 ${y} L114 ${y}" stroke="#8A5536" stroke-width="1.6"/>`).join('') +
      `<path d="M66 214 L86 214 L84 224 L68 224 Z M134 214 L154 214 L152 224 L136 224 Z" fill="#F7C54E" stroke="#D99A2B" stroke-width="2.6" ${SW}/>` +
      `<path d="M84 172 L104 186 L90 194 Z M136 172 L116 186 L130 194 Z" fill="#FFE59B" stroke="#D99A2B" stroke-width="2.6" ${SW}/>`,
  },
  cl_pajamas: {
    sleeve: ['#D5C6F7', '#9C86DE'],
    art: () => {
      const stars = [[70, 200], [96, 228], [140, 205], [124, 236], [154, 226], [62, 226], [112, 206]];
      const dots = [[84, 214], [150, 190], [72, 186], [132, 222], [102, 240], [160, 214]];
      return `<rect x="40" y="140" width="140" height="120" fill="#D5C6F7"/>` +
        stars.map(([x, y], i) => `<path d="${star5(x, y, 5.6, 2.6)}" fill="${i % 2 ? '#FFF6C2' : '#FFFFFF'}" stroke="#E3BF72" stroke-width="1" ${SW}/>`).join('') +
        dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#FFFFFF" opacity=".85"/>`).join('') +
        `<path d="M110 186 L110 245" stroke="#9C86DE" stroke-width="2.4"/>` +
        [196, 212, 228].map(y => `<circle cx="114.5" cy="${y}" r="3" fill="#fff" stroke="#9C86DE" stroke-width="1.6"/>`).join('') +
        `<path d="M86 172 Q96 192 110 186 Q124 192 134 172" fill="#F1EBFF" stroke="#9C86DE" stroke-width="2.6" ${SW}/>`;
    },
  },
  cl_travelVest: {
    art: () => `<path d="M40 150 L96 176 Q98 210 94 250 L40 250 Z" fill="#E7D3A4"/>` +
      `<path d="M180 150 L124 176 Q122 210 126 250 L180 250 Z" fill="#E7D3A4"/>` +
      `<path d="M96 176 Q98 210 94 250 M124 176 Q122 210 126 250" fill="none" stroke="#B39565" stroke-width="3"/>` +
      `<path d="M92 180 Q94 210 90 246 M128 180 Q126 210 130 246" fill="none" stroke="#B39565" stroke-width="1.5" stroke-dasharray="2.6 2.6" opacity=".8"/>` +
      `<rect x="64" y="208" width="22" height="20" rx="4" fill="#DCC48E" stroke="#B39565" stroke-width="2.4"/><path d="M64 214 L86 214" stroke="#B39565" stroke-width="2.4"/>` +
      `<rect x="134" y="208" width="22" height="20" rx="4" fill="#DCC48E" stroke="#B39565" stroke-width="2.4"/><path d="M134 214 L156 214" stroke="#B39565" stroke-width="2.4"/>` +
      `<circle cx="75" cy="211" r="1.8" fill="#8A6E45"/><circle cx="145" cy="211" r="1.8" fill="#8A6E45"/>` +
      `<circle cx="146" cy="194" r="6.5" fill="#A8E6B8" stroke="#4FA06A" stroke-width="2"/><path d="M143 194 L149 194 M146 191 L146 197" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  },
};

// ---------- 頭上配件（畫在頭的上面） ----------
const HEADWEAR = {
  hat_berryClip: () =>
    `<rect x="128" y="57" width="26" height="6" rx="3" fill="#F6CF66" stroke="#C98F1F" stroke-width="2" transform="rotate(-28 141 60)"/>` +
    `<path d="M152 40 C146 40 138 45 140 55 C142 64 150 70 154 72 C158 70 166 64 168 55 C170 45 162 40 156 40 Z" fill="#FF8FB0" stroke="#E46D90" stroke-width="3" transform="rotate(18 154 56)" ${SW}/>` +
    `<g transform="rotate(18 154 56)">` + [[149, 50], [159, 50], [154, 58], [147, 60], [161, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2" fill="#FFF4C8"/>`).join('') +
    `<path d="M144 41 Q148 33 154 39 Q158 31 164 41 Q158 44 154 42 Q150 45 144 41 Z" fill="#7DD39A" stroke="#4FA06A" stroke-width="2.2" ${SW}/>` +
    shine(148, 48, 2, 3.4, -20, .8) + `</g>`,
  hat_beanie: () =>
    `<path d="M65 66 Q65 16 110 14 Q155 16 155 66 Z" fill="#C9B8F5" stroke="#8E72D6" stroke-width="4" ${SW}/>` +
    `<path d="M86 24 Q81 42 83 60 M110 16 L110 60 M134 24 Q139 42 137 60" fill="none" stroke="#8E72D6" stroke-width="2" opacity=".55" stroke-linecap="round"/>` +
    `<path d="M77 34 Q84 24 95 22" fill="none" stroke="#fff" stroke-width="4.4" stroke-linecap="round" opacity=".6"/>` +
    `<rect x="58" y="55" width="104" height="18" rx="9" fill="#B9A4F0" stroke="#8E72D6" stroke-width="4"/>` +
    [66, 74, 82, 90, 98, 106, 114, 122, 130, 138, 146, 154].map(x => `<path d="M${x} 59.5 L${x} 68.5" stroke="#8E72D6" stroke-width="1.8" opacity=".6" stroke-linecap="round"/>`).join('') +
    `<circle cx="110" cy="12" r="12" fill="#FFF4FA" stroke="#E3B7CF" stroke-width="3.4"/>` +
    `<path d="M103 8 L107 12 M112 5 L114 11 M105 17 L109 18 M114 16 L118 14" stroke="#E3B7CF" stroke-width="1.8" stroke-linecap="round"/>`,
  hat_beret: () =>
    `<path d="M126 22 Q128 15 133 16" fill="none" stroke="#C8486E" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M64 52 Q66 26 112 22 Q164 22 170 44 Q166 56 118 58 Q74 60 64 52 Z" fill="#F27CA0" stroke="#C8486E" stroke-width="4" ${SW}/>` +
    `<path d="M70 52 Q112 60 166 46" fill="none" stroke="#C8486E" stroke-width="2" opacity=".5"/>` +
    `<path d="M84 34 Q100 26 118 26" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>` +
    `<circle cx="150" cy="44" r="3" fill="#FFE68F" stroke="#C98F1F" stroke-width="1.4"/>`,
  hat_flowerCrown: () => {
    let s = '';
    const pts = [];
    for (let i = 0; i < 7; i++) {
      const x = 50 + i * 20;
      const y = 108 - 64 * Math.sqrt(Math.max(0, 1 - ((x - 110) / 77) ** 2)) + 3;
      pts.push([x, y]);
    }
    s += `<path d="M${pts.map(p => p.join(' ')).join(' L')}" fill="none" stroke="#7DD39A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x, y] = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
      s += `<ellipse cx="${f1(x)}" cy="${f1(y - 3)}" rx="5" ry="2.6" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.6" transform="rotate(${i % 2 ? 30 : -30} ${f1(x)} ${f1(y - 3)})"/>`;
    }
    const cols = [['#FFB0C4', '#E0668A'], ['#FFFFFF', '#E3B7CF'], ['#FFE68F', '#D99A2B'], ['#D5C6F7', '#9C86DE']];
    pts.forEach(([x, y], i) => {
      const [fc, sc] = cols[i % cols.length], R = i === 3 ? 8.4 : 7;
      let petals = '';
      for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 2 * Math.PI / 5; petals += `<circle cx="${f1(x + Math.cos(a) * R * .62)}" cy="${f1(y + Math.sin(a) * R * .62)}" r="${f1(R * .52)}" fill="${fc}" stroke="${sc}" stroke-width="1.6"/>`; }
      s += petals + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R * .36)}" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.2"/>`;
    });
    return s;
  },
  hat_strawHat: () =>
    `<ellipse cx="110" cy="54" rx="76" ry="17" fill="#F5DB98" stroke="#C9A057" stroke-width="4"/>` +
    `<path d="M48 56 Q110 70 172 56" fill="none" stroke="#C9A057" stroke-width="1.8" stroke-dasharray="3 3" opacity=".7"/>` +
    `<path d="M74 54 Q72 20 110 16 Q148 20 146 54 Q110 60 74 54 Z" fill="#F8E2A8" stroke="#C9A057" stroke-width="4" ${SW}/>` +
    `<path d="M84 30 Q110 24 136 30 M80 42 Q110 36 140 42" fill="none" stroke="#C9A057" stroke-width="1.6" opacity=".55"/>` +
    `<path d="M74.5 46 Q110 54 145.5 46 L146 54 Q110 61 74 54 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.4" ${SW}/>` +
    `<path d="M140 52 C134 42 126 46 128 52 C130 58 136 56 140 52 Z M140 52 C146 42 154 46 152 52 C150 58 144 56 140 52 Z" fill="#FFB0C4" stroke="#E0668A" stroke-width="2.2" ${SW}/>` +
    `<circle cx="140" cy="52" r="3.2" fill="#FF8FAA" stroke="#E0668A" stroke-width="1.8"/>` +
    `<path d="M88 26 Q96 20 106 20" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".7"/>`,
};

// ---------- 左手拿的東西（畫在左手臂下面，手掌會蓋在握把上） ----------
const HANDHELD = {
  hd_honeySpoon: () =>
    `<path d="M47 220 L25 178" stroke="#B9875A" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M47 220 L25 178" stroke="#E7BC8A" stroke-width="5" stroke-linecap="round"/>` +
    `<ellipse cx="21" cy="170" rx="11" ry="8" fill="#E7BC8A" stroke="#B9875A" stroke-width="3" transform="rotate(-62 21 170)"/>` +
    `<path d="M14 166 Q16 158 23 160 Q30 162 28 170 Q26 178 30 186 Q27 189 24 184 Q20 176 14 166 Z" fill="#FFC94D" stroke="#D99A2B" stroke-width="2.2" ${SW}/>` +
    shine(18, 163, 2, 3, -30, .85),
  hd_bouquet: () => {
    const fl = [[32, 184, '#FFB0C4', '#E0668A'], [47, 176, '#FFE68F', '#D99A2B'], [60, 186, '#D5C6F7', '#9C86DE'], [40, 194, '#FFFFFF', '#E3B7CF'], [55, 196, '#FFB0C4', '#E0668A']];
    return `<g transform="translate(46 214) scale(1.3) translate(-46 -214)"><path d="M38 198 L44 214 M47 196 L45 214 M56 198 L46 214" stroke="#4FA06A" stroke-width="2.6" stroke-linecap="round"/>` +
      `<ellipse cx="30" cy="196" rx="6" ry="3" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.8" transform="rotate(-35 30 196)"/>` +
      `<ellipse cx="64" cy="196" rx="6" ry="3" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.8" transform="rotate(35 64 196)"/>` +
      fl.map(([x, y, c, s]) => [0, 1, 2, 3, 4].map(k => { const a = k * 1.2566; return `<circle cx="${f1(x + Math.cos(a) * 4.2)}" cy="${f1(y + Math.sin(a) * 4.2)}" r="3.9" fill="${c}" stroke="${s}" stroke-width="1.4"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="2.6" fill="#F6CF66"/>`).join('') +
      `<path d="M30 200 L62 200 L50 226 L42 226 Z" fill="#FFE4EB" stroke="#F08AAA" stroke-width="2.6" ${SW}/>` +
      `<path d="M40 210 L52 210" stroke="#F08AAA" stroke-width="3" stroke-linecap="round"/></g>`;
  },
  hd_balloon: () =>
    `<path d="M44 214 Q27 190 31 166 Q35 151 20 140" fill="none" stroke="#B9A4F0" stroke-width="1.8"/>` +
    `<path d="M20 137.5 L16.5 142 L23.5 142 Z" fill="#B9A4F0" stroke="#8E72D6" stroke-width="1.6" ${SW}/>` +
    `<path d="${heartPath(20, 124, 15)}" fill="#C9B8F5" stroke="#8E72D6" stroke-width="3.2" ${SW}/>` +
    shine(13, 118, 2.8, 5, -25, .8) + dot(24, 115, 1.6, .9),
  hd_camera: () =>
    `<path d="M20 206 Q30 196 40 206" fill="none" stroke="#E0668A" stroke-width="2.4"/>` +
    `<rect x="12" y="206" width="34" height="24" rx="7" fill="#A8E6B8" stroke="#4FA06A" stroke-width="3"/>` +
    `<rect x="16" y="202" width="10" height="6" rx="2" fill="#7DD39A" stroke="#4FA06A" stroke-width="2"/>` +
    `<path d="M12 214 L46 214" stroke="#4FA06A" stroke-width="1.6" opacity=".6"/>` +
    `<circle cx="27" cy="219" r="7.6" fill="#FFF8EE" stroke="#4FA06A" stroke-width="2.6"/>` +
    `<circle cx="27" cy="219" r="4.2" fill="#5E7FA8"/><circle cx="25.4" cy="217.4" r="1.5" fill="#fff"/>` +
    `<circle cx="40" cy="210" r="1.8" fill="#FFE68F"/>`,
};

// ---------- 丁噹熊表情（眼睛、眉毛、嘴巴、附加物） ----------
const MOUTH_NORMAL = `<path d="M110 129 L110 133 M100 133 Q105 139 110 133 Q115 139 120 133" fill="none" stroke="${BROWN}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
const eyesOpen = (rx = 7.2, ry = 8.8, hl = 2.9) => `<g class="ch-beyes"><ellipse cx="82" cy="106" rx="${rx}" ry="${ry}" fill="${INK}"/><ellipse cx="138" cy="106" rx="${rx}" ry="${ry}" fill="${INK}"/>` +
  `<circle cx="${f1(82 + rx * .36)}" cy="${f1(106 - ry * .41)}" r="${hl}" fill="#fff"/><circle cx="${f1(138 + rx * .36)}" cy="${f1(106 - ry * .41)}" r="${hl}" fill="#fff"/>` +
  `<circle cx="80" cy="${f1(106 + ry * .45)}" r="1.3" fill="#fff"/><circle cx="136" cy="${f1(106 + ry * .45)}" r="1.3" fill="#fff"/></g>`;
const arcEyes = `<path d="M73 109 Q82 97 91 109 M129 109 Q138 97 147 109" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
const openSmile = (w = 10, d = 14) => `<path d="M110 129 L110 132" stroke="${BROWN}" stroke-width="3.4" stroke-linecap="round"/>` +
  `<path d="M${110 - w} 132.5 Q110 ${132 + d} ${110 + w} 132.5 Z" fill="${BROWN}" stroke="${BROWN}" stroke-width="2.6" ${SW}/>` +
  `<path d="M${110 - w * .55} ${f1(132 + d * .62)} Q110 ${f1(132 + d * .38)} ${110 + w * .55} ${f1(132 + d * .62)} Q110 ${f1(132 + d * .86)} ${110 - w * .55} ${f1(132 + d * .62)} Z" fill="#FF8FAA"/>`;

const BEAR_FACES = {
  normal: () => eyesOpen() + MOUTH_NORMAL,
  happy: () => arcEyes + openSmile(10, 14),
  squint: () => `<path d="M75 99 L89 106 L75 113 M145 99 L131 106 L145 113" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` +
    MOUTH_NORMAL +
    `<path d="M58 126 L62 121 M64 128 L68 123 M70 130 L74 125 M146 125 L150 130 M152 123 L156 128 M158 121 L162 126" stroke="#FF6F92" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
  worried: () => eyesOpen(6.6, 8.2, 2.6) +
    `<path d="M71 93 Q81 92 91 86 M149 93 Q139 92 129 86" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<path d="M110 129 L110 133" stroke="${BROWN}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M100 137 Q103 133 106 137 Q109 141 112 137 Q115 133 118 137" fill="none" stroke="${BROWN}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<g class="ch-sweat"><path d="M166 70 Q157 84 160 89 Q166 95 172 89 Q175 84 166 70 Z" fill="#AEE0F8" stroke="#5AAFDB" stroke-width="2.6" ${SW}/>${shine(163.5, 84, 1.6, 2.8, 20, .9)}</g>`,
  pout: () => eyesOpen(7, 8.4, 2.7) +
    `<path d="M72 91 Q82 92 91 97 M148 91 Q138 92 129 97" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>` +
    `<ellipse cx="66" cy="128" rx="16" ry="11" fill="#FF97AC" opacity=".45"/><ellipse cx="154" cy="128" rx="16" ry="11" fill="#FF97AC" opacity=".45"/>` +
    `<path d="M107 131 Q115 132.5 110 136 Q115 139.5 107 141" fill="none" stroke="${BROWN}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  surprised: () => eyesOpen(8.6, 10.6, 3.4) +
    `<path d="M72 88 Q82 81 91 87 M148 88 Q138 81 129 87" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<ellipse cx="110" cy="138" rx="5.4" ry="6.6" fill="${BROWN}"/><ellipse cx="110" cy="140.5" rx="3" ry="2.6" fill="#FF8FAA"/>`,
  wink: () => `<g class="ch-beyes"><ellipse cx="82" cy="106" rx="7.2" ry="8.8" fill="${INK}"/><circle cx="84.6" cy="102.4" r="2.9" fill="#fff"/><circle cx="80" cy="110" r="1.3" fill="#fff"/></g>` +
    `<path d="M129 108 Q138 98 147 108" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="${sparkle(158, 92, 6)}" fill="#FFF6C2" stroke="#E3BF72" stroke-width="1.6" ${SW}/>` +
    openSmile(8, 11),
};

/**
 * 丁噹熊。
 * @param {{expr?:string, outfit?:{head?:string,ribbon?:string,clothes?:string,hand?:string}, perfumeColor?:string, live?:boolean}} o
 */
export function bearSVG({ expr = 'normal', outfit = {}, perfumeColor = '#FF9EB5', live = false } = {}) {
  if (!BEAR_FACES[expr]) expr = 'normal';
  const ids = { gold: uid('chg'), glass: uid('chgl'), clip: uid('chc') };
  const light = mix(perfumeColor, '#ffffff', .62), mid = mix(perfumeColor, '#ffffff', .18);
  const cl = CLOTHES[outfit.clothes];
  const [sleeve, sleeveO] = cl?.sleeve || [BC, BO];
  const head = HEADWEAR[outfit.head] ? HEADWEAR[outfit.head]() : '';
  const hand = HANDHELD[outfit.hand] ? HANDHELD[outfit.hand]() : '';
  const faces = live
    ? BEAR_EXPRS.map(e => `<g class="ch-x ch-x-${e}">${BEAR_FACES[e]()}</g>`).join('')
    : BEAR_FACES[expr]();
  const pawTip = (cx, cy) => cl?.sleeve ? `<circle cx="${cx}" cy="${cy}" r="9.5" fill="${BC}" stroke="${BO}" stroke-width="5"/>` : '';
  const inner =
    `<defs>${goldGrad(ids.gold)}<linearGradient id="${ids.glass}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${mid}"/></linearGradient>` +
    `<clipPath id="${ids.clip}"><ellipse cx="110" cy="192" rx="58.5" ry="47.5"/></clipPath></defs>` +
    `<ellipse cx="110" cy="246" rx="70" ry="6" fill="#B98A64" opacity=".18"/>` +
    // 腳
    `<g><ellipse cx="80" cy="232" rx="25" ry="15" fill="${BC}" stroke="${BO}" stroke-width="6"/><ellipse cx="140" cy="232" rx="25" ry="15" fill="${BC}" stroke="${BO}" stroke-width="6"/>` +
    `<ellipse cx="80" cy="235" rx="9.5" ry="6.5" fill="#FFB7C6"/><ellipse cx="140" cy="235" rx="9.5" ry="6.5" fill="#FFB7C6"/>` +
    `<circle cx="69" cy="226" r="3.4" fill="#FFB7C6"/><circle cx="80" cy="222.5" r="3.4" fill="#FFB7C6"/><circle cx="91" cy="226" r="3.4" fill="#FFB7C6"/>` +
    `<circle cx="129" cy="226" r="3.4" fill="#FFB7C6"/><circle cx="140" cy="222.5" r="3.4" fill="#FFB7C6"/><circle cx="151" cy="226" r="3.4" fill="#FFB7C6"/></g>` +
    // 身體＋肚子＋衣服
    `<ellipse cx="110" cy="192" rx="60" ry="49" fill="${BC}"/>` +
    `<ellipse cx="110" cy="203" rx="35" ry="29" fill="#FFFAF3"/>` +
    (cl ? `<g clip-path="url(#${ids.clip})">${cl.art()}</g>` : '') +
    `<ellipse cx="110" cy="192" rx="60" ry="49" fill="none" stroke="${BO}" stroke-width="6"/>` +
    // 左手（含手上拿的東西）
    `<g class="ch-arm-l">${hand}<ellipse cx="52" cy="195" rx="15.5" ry="23" fill="${sleeve}" stroke="${sleeveO}" stroke-width="6" transform="rotate(22 52 195)"/>${pawTip(44.5, 213.5)}</g>` +
    // 頭
    `<g class="ch-head">` +
    `<circle cx="57" cy="60" r="27" fill="${BC}" stroke="${BO}" stroke-width="6"/><circle cx="57" cy="60" r="14" fill="#FFC4D0"/>` +
    `<circle cx="163" cy="60" r="27" fill="${BC}" stroke="${BO}" stroke-width="6"/><circle cx="163" cy="60" r="14" fill="#FFC4D0"/>` +
    `<ellipse cx="110" cy="108" rx="77" ry="64" fill="${BC}" stroke="${BO}" stroke-width="6"/>` +
    `<path d="M103 47 Q99 33 110 31 Q121 31 117 41" fill="none" stroke="${BO}" stroke-width="5.5" stroke-linecap="round"/>` +
    shine(66, 82, 9, 5, -30, .7) +
    `<ellipse cx="67" cy="128" rx="13" ry="8" fill="#FF97AC" opacity=".55"/><ellipse cx="153" cy="128" rx="13" ry="8" fill="#FF97AC" opacity=".55"/>` +
    `<ellipse cx="110" cy="128" rx="24" ry="17" fill="#FFFAF3" stroke="#EDD2B5" stroke-width="3"/>` +
    `<path d="M102 120 Q110 115 118 120 Q117 127 110 129 Q103 127 102 120 Z" fill="${BROWN}"/>` +
    `<ellipse cx="107" cy="120" rx="2.6" ry="1.4" fill="#fff" opacity=".85"/>` +
    faces + head + `</g>` +
    // 緞帶、鈴鐺
    ribbonArt(outfit.ribbon, ids.gold) +
    // 右手舉香水
    `<g class="ch-arm-hold"><g transform="translate(164.2 66.6) scale(.72)">${perfumeBottle(ids, perfumeColor)}</g>` +
    `<ellipse cx="172" cy="150" rx="15.5" ry="24" fill="${sleeve}" stroke="${sleeveO}" stroke-width="6" transform="rotate(40 172 150)"/>${pawTip(186.5, 132)}</g>`;
  return wrap(inner, BEAR_VIEWBOX, live ? 'ch-live ch-bear-svg' : 'ch-bear-svg', live ? `data-expr="${expr}"` : '');
}

// =====================================================================
//                         大不溜（Q 版杜賓犬）
// =====================================================================
const DO = '#3D2E2E', DT = '#E3925C', DTO = '#AC653D', DLEG = '#5A4945';

// ---------- 項圈：帶子（畫在頭後面）＋吊飾（畫在最前面） ----------
const CP = [[57, 64], [80, 78], [103, 63]];
const COLLARS = {
  col_pink: {
    band: () => `<path d="M57 64 Q80 78 103 63" fill="none" stroke="#E0668A" stroke-width="9" stroke-linecap="round"/><path d="M57 64 Q80 78 103 63" fill="none" stroke="#FFA3BB" stroke-width="5" stroke-linecap="round"/>`,
    front: () => `<path d="M80 73.5 C77 70.5 73 72.5 74.5 76 C75.5 78.5 78 80 80 81.5 C82 80 84.5 78.5 85.5 76 C87 72.5 83 70.5 80 73.5 Z" fill="#FFD95E" stroke="#B9801A" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="78.2" cy="75" rx="1.4" ry=".9" fill="#fff" opacity=".85"/>`,
  },
  col_plaid: {
    band: () => `<path d="M57 64 Q80 78 103 63" fill="none" stroke="#B83E48" stroke-width="9.5" stroke-linecap="round"/>` +
      `<path d="M57 64 Q80 78 103 63" fill="none" stroke="#E5636B" stroke-width="5.5" stroke-linecap="round"/>` +
      `<path d="M57 64 Q80 78 103 63" fill="none" stroke="#FFE1E1" stroke-width="5.5" stroke-dasharray="1.4 3.2" opacity=".9"/>` +
      `<path d="M57 64 Q80 78 103 63" fill="none" stroke="#8E2C36" stroke-width="1.4" opacity=".7"/>`,
    front: () => `<circle cx="80" cy="77" r="4.6" fill="#FFD95E" stroke="#B9801A" stroke-width="1.8"/><circle cx="80" cy="77" r="1.6" fill="#B9801A" opacity=".6"/><ellipse cx="78.6" cy="75.4" rx="1.2" ry=".8" fill="#fff" opacity=".85"/>`,
  },
  col_bowtie: {
    band: () => `<path d="M57 64 Q80 78 103 63" fill="none" stroke="#C8486E" stroke-width="6" stroke-linecap="round"/><path d="M57 64 Q80 78 103 63" fill="none" stroke="#FF8FAA" stroke-width="2.6" stroke-linecap="round"/>`,
    front: () => `<path d="M80 72 L68 65 Q65 72 68 79 Z M80 72 L92 65 Q95 72 92 79 Z" fill="#FF6F8F" stroke="#C8486E" stroke-width="2.2" ${SW}/>` +
      [[71, 69], [70.5, 75], [89, 69], [89.5, 75]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`).join('') +
      `<rect x="76.5" y="68.5" width="7" height="7" rx="2.4" fill="#FF8FAA" stroke="#C8486E" stroke-width="2"/>`,
  },
  col_pearls: {
    band: () => {
      let s = '';
      for (let i = 0; i <= 10; i++) { const [x, y] = qpt(...CP, i / 10); s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.3" fill="#FFFDF8" stroke="#C9B9AE" stroke-width="1.2"/><circle cx="${f1(x - 1)}" cy="${f1(y - 1)}" r=".9" fill="#fff"/>`; }
      return s;
    },
    front: () => `<path d="M80 74 L80 77" stroke="#C9B9AE" stroke-width="1.4"/><path d="M80 77 L84 81.5 L80 87 L76 81.5 Z" fill="#FFA3BB" stroke="#E0668A" stroke-width="1.6" ${SW}/><path d="M78.5 80.5 L80 79 L81 80.5" fill="none" stroke="#fff" stroke-width="1" opacity=".9"/>`,
  },
  col_goldChain: {
    band: id => {
      let s = '';
      for (let i = 0; i <= 13; i++) { const [x, y] = qpt(...CP, i / 13); s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 2 ? 2.2 : 3.4}" ry="${i % 2 ? 3.2 : 2.2}" fill="none" stroke="#D9A52B" stroke-width="2.2"/>`; }
      return s;
    },
    front: id => `<circle cx="80" cy="79" r="6" fill="url(#${id})" stroke="#B9801A" stroke-width="1.8"/><path d="${star5(80, 79, 3.6, 1.6)}" fill="#FFF6C2" stroke="#B9801A" stroke-width=".8"/><ellipse cx="77.6" cy="76.4" rx="1.5" ry=".9" fill="#fff" opacity=".85"/>`,
  },
};

// ---------- 大不溜頭上／臉上配件 ----------
const DOG_HEADWEAR = {
  dog_sunglasses: () =>
    `<path d="M58 42 L77 42 Q78 55 68 55.5 Q58 55 58 42 Z" fill="#2E2530" stroke="#D9AE55" stroke-width="2.4" ${SW}/>` +
    `<path d="M83 42 L102 42 Q102 55 92 55.5 Q82 55 83 42 Z" fill="#2E2530" stroke="#D9AE55" stroke-width="2.4" ${SW}/>` +
    `<path d="M77 44 Q80 41.5 83 44" fill="none" stroke="#D9AE55" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M56 42.5 L52 40 M104 42.5 L108 40" stroke="#D9AE55" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M61 45 L66 50 M64 44 L70 50.5 M86 45 L91 50 M89 44 L95 50.5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`,
  dog_cap: () =>
    `<path d="M62 23 Q48 17 38 22 Q46 29 62 27 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.6" ${SW}/>` +
    `<path d="M58 29 Q59 7 80 6 Q101 7 102 29 Q80 24 58 29 Z" fill="#A8E6B8" stroke="#4FA06A" stroke-width="3" ${SW}/>` +
    `<path d="M80 6.5 L80 25.5 M68 9 Q66 18 66 27 M92 9 Q94 18 94 27" fill="none" stroke="#4FA06A" stroke-width="1.6" opacity=".6"/>` +
    `<path d="M73 28 Q80 18.5 87 28 Z" fill="#6A5652" stroke="#4FA06A" stroke-width="2"/>` +
    `<path d="M71.5 28.2 L88.5 28.2" stroke="#FFF8EE" stroke-width="2.4" stroke-linecap="round"/>` +
    `<circle cx="80" cy="6" r="2.6" fill="#FF9EB5" stroke="#E0668A" stroke-width="1.6"/>` +
    `<path d="M65 13 Q70 9 76 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`,
  dog_bandana: () =>
    `<path d="M57 31 Q58 12 80 10 Q102 12 103 31 Q80 25 57 31 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="3" ${SW}/>` +
    [[66, 19], [76, 15], [87, 15], [96, 21], [71, 25], [83, 22], [93, 27]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="#fff"/>`).join('') +
    `<path d="M56 29 L44 35 Q45 29 48 26 Z M56 29 L46 20 Q52 19 57 23 Z" fill="#FF8FAA" stroke="#E0668A" stroke-width="2.4" ${SW}/>` +
    `<circle cx="56.5" cy="28" r="3.6" fill="#FF8FAA" stroke="#E0668A" stroke-width="2.2"/>`,
  dog_crown: id =>
    `<g transform="rotate(-12 80 12)"><path d="M67 19 L65 3 L73 10 L80 -2 L87 10 L95 3 L93 19 Z" fill="url(#${id})" stroke="#C98F1F" stroke-width="2.4" ${SW}/>` +
    `<rect x="66" y="15" width="28" height="6" rx="2.5" fill="#F6CF66" stroke="#C98F1F" stroke-width="2.2"/>` +
    `<circle cx="80" cy="18" r="2.6" fill="#FF8FAA" stroke="#E0668A" stroke-width="1.2"/><circle cx="72" cy="18" r="1.8" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1"/><circle cx="88" cy="18" r="1.8" fill="#C9B8F5" stroke="#8E72D6" stroke-width="1"/>` +
    `<circle cx="65" cy="3" r="1.8" fill="#FFF6C2" stroke="#C98F1F" stroke-width="1"/><circle cx="80" cy="-2" r="2" fill="#FFF6C2" stroke="#C98F1F" stroke-width="1"/><circle cx="95" cy="3" r="1.8" fill="#FFF6C2" stroke="#C98F1F" stroke-width="1"/>` +
    `<path d="M70 12 L72 7" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></g>`,
};

// ---------- 大不溜表情：eyes（嘴套之前）、mouth（嘴套與鼻子之後） ----------
const DK = '#1C1416', DM = '#5A2E33';
const smugEyes = `<path d="M62 44.5 L74 44.5 Q74 54 68 54 Q62 54 62 44.5 Z M86 44.5 L98 44.5 Q98 54 92 54 Q86 54 86 44.5 Z" fill="#FFF3E8"/>` +
  `<path d="M64.4 44.5 L73 44.5 Q73 51.8 68.7 51.8 Q64.4 51.8 64.4 44.5 Z M88.4 44.5 L97 44.5 Q97 51.8 92.7 51.8 Q88.4 51.8 88.4 44.5 Z" fill="${DK}"/>` +
  `<path d="M60.5 44.5 L75.5 44.5 M84.5 44.5 L99.5 44.5" stroke="${DK}" stroke-width="3.2" stroke-linecap="round"/>` +
  `<circle cx="70.8" cy="47.3" r="1.6" fill="#fff"/><circle cx="94.8" cy="47.3" r="1.6" fill="#fff"/>`;
const smirk = `<path d="M80 58.5 L80 61.2 M72.5 61.8 Q76.5 65.3 80 61.2 Q85 64.8 89.5 58.6" fill="none" stroke="#3A2A2D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
const tongueOut = (len = 10.5) => `<g class="ch-tongue"><path d="M82.5 63 Q83 ${63 + len} 88.5 ${63 + len} Q94 ${63 + len} 93 63.5 Z" fill="#FF8FAA" stroke="#E0668A" stroke-width="2" stroke-linejoin="round"/><path d="M88 64.5 L88 ${f1(63 + len * .62)}" stroke="#E0668A" stroke-width="1.5" stroke-linecap="round"/></g>`;
const openMouth = (depth, fangs) => `<path d="M71 60.5 Q80 ${60 + depth} 90 59.5 Q80 63 71 60.5 Z" fill="${DM}" stroke="#3A2A2D" stroke-width="2.2" ${SW}/>` +
  `<path d="M75.5 ${f1(60 + depth * .62)} Q80 ${f1(60 + depth * .95)} 85.5 ${f1(60 + depth * .6)} Q80 ${f1(60 + depth * .45)} 75.5 ${f1(60 + depth * .62)} Z" fill="#FF8FAA"/>` +
  (fangs ? `<path d="M73.5 61.2 L75 64.6 L76.6 61.8 Z M86.5 61.2 L85 64.4 L83.4 61.4 Z" fill="#fff"/>` : '') +
  `<path d="M80 58.5 L80 61.6" stroke="#3A2A2D" stroke-width="2.4" stroke-linecap="round"/>`;

const DOG_FACES = {
  smug: { eyes: () => smugEyes, mouth: () => smirk },
  happy: {
    eyes: () => `<path d="M62 49.5 Q68 41 74 49.5 M86 49.5 Q92 41 98 49.5" fill="none" stroke="${DK}" stroke-width="3.4" stroke-linecap="round"/>`,
    mouth: () => openMouth(15, false),
  },
  bark: {
    eyes: () => `<path d="M62 45.5 L74 47 Q73.5 54 68 54 Q62.5 54 62 45.5 Z M86 47 L98 45.5 Q97.5 54 92 54 Q86.5 54 86 47 Z" fill="#FFF3E8"/>` +
      `<path d="M64.5 46 L73 47.2 Q72.5 52 68.5 52 Q64.5 52 64.5 46 Z M87 47.2 L95.5 46 Q95.5 52 91.5 52 Q87.5 52 87 47.2 Z" fill="${DK}"/>` +
      `<path d="M60.5 43.6 L75.5 47.2 M84.5 47.2 L99.5 43.6" stroke="${DK}" stroke-width="3.2" stroke-linecap="round"/>`,
    mouth: () => openMouth(19, true),
  },
  lick: {
    eyes: () => `<path d="M62 46.5 Q68 52 74 46.5 M86 46.5 Q92 52 98 46.5" fill="none" stroke="${DK}" stroke-width="3.2" stroke-linecap="round"/>`,
    mouth: () => tongueOut(12.5) + smirk,
  },
  sneeze: {
    eyes: () => `<path d="M62 41.5 L72.5 47 L62 52.5 M98 41.5 L87.5 47 L98 52.5" fill="none" stroke="${DK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    mouth: () => `<path d="M74 48.6 Q77 46.6 80 48.6 Q83 46.6 86 48.6" fill="none" stroke="${DTO}" stroke-width="1.8" stroke-linecap="round"/>` +
      `<path d="M80 58.5 L80 60.8" stroke="#3A2A2D" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="80" cy="64" rx="3.6" ry="3.2" fill="${DM}" stroke="#3A2A2D" stroke-width="1.8"/>` +
      `<g class="ch-puff"><circle cx="104" cy="55" r="3.4" fill="#fff" stroke="#BFE0F5" stroke-width="1.4"/><circle cx="111" cy="50" r="2.4" fill="#fff" stroke="#BFE0F5" stroke-width="1.2"/><circle cx="110" cy="60" r="2" fill="#fff" stroke="#BFE0F5" stroke-width="1.2"/><circle cx="116" cy="55" r="1.5" fill="#fff" stroke="#BFE0F5" stroke-width="1"/></g>`,
  },
  sad: {
    eyes: () => `<ellipse cx="68" cy="48" rx="6.2" ry="6.8" fill="${DK}"/><ellipse cx="92" cy="48" rx="6.2" ry="6.8" fill="${DK}"/>` +
      `<circle cx="70.2" cy="45.4" r="2.3" fill="#fff"/><circle cx="94.2" cy="45.4" r="2.3" fill="#fff"/><circle cx="66.4" cy="51" r="1.1" fill="#fff"/><circle cx="90.4" cy="51" r="1.1" fill="#fff"/>` +
      `<path d="M61 41 Q66 38.5 72 36.5 M99 41 Q94 38.5 88 36.5" fill="none" stroke="${DK}" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>`,
    mouth: () => `<path d="M80 58.5 L80 61.4 M73.5 65 Q80 59.8 86.5 65" fill="none" stroke="#3A2A2D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
};

/**
 * 大不溜（Q 版杜賓犬，沒有頭髮）。
 * @param {{expr?:string, outfit?:{dogHead?:string, collar?:string}, live?:boolean}} o
 */
export function dogSVG({ expr = 'smug', outfit = {}, live = false } = {}) {
  if (!DOG_FACES[expr]) expr = 'smug';
  const gid = uid('chd'), gold = uid('chg');
  const B = `url(#${gid})`;
  const collar = COLLARS[outfit.collar] || COLLARS.col_pink;
  const hw = DOG_HEADWEAR[outfit.dogHead] ? DOG_HEADWEAR[outfit.dogHead](gold) : '';
  const sadL = !live && expr === 'sad' ? ' transform="rotate(-28 64 28)"' : '';
  const sadR = !live && expr === 'sad' ? ' transform="rotate(28 96 28)"' : '';
  const eyes = live ? DOG_EXPRS.map(e => `<g class="ch-x ch-x-${e}">${DOG_FACES[e].eyes()}</g>`).join('') : DOG_FACES[expr].eyes();
  const mouth = live ? DOG_EXPRS.map(e => `<g class="ch-x ch-x-${e}">${DOG_FACES[e].mouth()}</g>`).join('') : DOG_FACES[expr].mouth();
  const inner =
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#76635F"/><stop offset="1" stop-color="#554541"/></linearGradient>${goldGrad(gold)}</defs>` +
    `<ellipse cx="60" cy="107" rx="46" ry="4.5" fill="#8A6A5E" opacity=".22"/>` +
    `<g class="ch-tail"><path d="M25 60 L16 49" stroke="${DO}" stroke-width="13" stroke-linecap="round"/><path d="M25 60 L16 49" stroke="#5A4A4F" stroke-width="7.5" stroke-linecap="round"/></g>` +
    // 後腳
    `<rect x="21" y="82" width="17" height="22" rx="8" fill="${DLEG}" stroke="${DO}" stroke-width="4.2"/>` +
    `<path d="M23.2 91 L35.8 91 L35.8 97 Q35.8 101.8 29.5 101.8 Q23.2 101.8 23.2 97 Z" fill="${DT}"/>` +
    `<rect x="38" y="85" width="17" height="21" rx="8" fill="${DLEG}" stroke="${DO}" stroke-width="4.2"/>` +
    `<path d="M40.2 93.5 L52.8 93.5 L52.8 99 Q52.8 103.8 46.5 103.8 Q40.2 103.8 40.2 99 Z" fill="${DT}"/>` +
    // 身體
    `<ellipse cx="55" cy="70" rx="39" ry="28" fill="${B}" stroke="${DO}" stroke-width="5"/>` +
    `<path d="M30 55 C40 47 54 46 64 50" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" opacity=".26"/>` +
    `<path d="M24 66 C24 60 27 56 31 53" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".16"/>` +
    `<ellipse cx="44" cy="80" rx="16" ry="6" fill="#fff" opacity=".07"/>` +
    `<path d="M70 51 Q84 56 86 73" fill="none" stroke="#7D6A70" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>` +
    `<path d="M36 62 Q44 58 52 62" fill="none" stroke="#7D6A70" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>` +
    // 胸口、前腳
    `<path d="M63 68 C62 86 72 97 80 97 C88 97 98 86 97 68 Z" fill="${DT}"/>` +
    `<rect x="61" y="80" width="18" height="25" rx="8.5" fill="${B}" stroke="${DO}" stroke-width="4.2"/>` +
    `<path d="M63.3 90.5 L76.7 90.5 L76.7 97.5 Q76.7 102.7 70 102.7 Q63.3 102.7 63.3 97.5 Z" fill="${DT}"/>` +
    `<rect x="83" y="80" width="18" height="25" rx="8.5" fill="${B}" stroke="${DO}" stroke-width="4.2"/>` +
    `<path d="M85.3 90.5 L98.7 90.5 L98.7 97.5 Q98.7 102.7 92 102.7 Q85.3 102.7 85.3 97.5 Z" fill="${DT}"/>` +
    `<path d="M66.5 99 L66.5 103 M70 99.5 L70 103.5 M73.5 99 L73.5 103 M88.5 99 L88.5 103 M92 99.5 L92 103.5 M95.5 99 L95.5 103" stroke="${DTO}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>` +
    // 項圈帶子
    collar.band(gold) +
    // 耳朵（立耳，右耳尖微折）
    `<g class="ch-dear-l"${sadL}><path d="M57 32 C51 18 49 3 52 -7 C61 -2 70 10 72 22 Z" fill="${B}" stroke="${DO}" stroke-width="4.5" stroke-linejoin="round"/>` +
    `<path d="M59 26 C56 17 55.5 8 56.5 1 C62 5 66.5 12 67.5 20 Z" fill="#D99AA6" opacity=".9"/></g>` +
    `<g class="ch-dear-r"${sadR}><path d="M103 32 C108 21 109.5 11 107.5 2 C99 5 90 12 88 22 Z" fill="${B}" stroke="${DO}" stroke-width="4.5" stroke-linejoin="round"/>` +
    `<path d="M101 26 C104 19 105 12 104.5 7 C99 9.5 94 14 92.5 20 Z" fill="#D99AA6" opacity=".9"/>` +
    `<path d="M107.5 2 C111.5 3 115 7.5 114.5 12.5 C111 11.5 107.5 9 105 5.5 Z" fill="#5E4E54" stroke="${DO}" stroke-width="3.6" stroke-linejoin="round"/></g>` +
    // 頭
    `<ellipse cx="80" cy="44" rx="30.5" ry="26.5" fill="${B}" stroke="${DO}" stroke-width="5"/>` +
    shine(68, 27, 9, 3.2, -14, .22) +
    `<ellipse cx="66" cy="36" rx="4.4" ry="3.1" fill="${DT}" transform="rotate(-18 66 36)"/>` +
    `<ellipse cx="94" cy="36" rx="4.4" ry="3.1" fill="${DT}" transform="rotate(18 94 36)"/>` +
    eyes +
    `<ellipse cx="58.5" cy="57.5" rx="5.8" ry="3.5" fill="#FF9DB5" opacity=".62"/><ellipse cx="101.5" cy="57.5" rx="5.8" ry="3.5" fill="#FF9DB5" opacity=".62"/>` +
    `<ellipse cx="80" cy="59" rx="16" ry="11.5" fill="${DT}" stroke="${DTO}" stroke-width="2.6"/>` +
    `<ellipse cx="74" cy="56.5" rx="4" ry="2" fill="#fff" opacity=".28"/>` +
    `<path d="M73.5 52 Q80 47.5 86.5 52 Q85.5 57.5 80 58.5 Q74.5 57.5 73.5 52 Z" fill="#2A1F22"/>` +
    `<ellipse cx="77.4" cy="52.2" rx="2.3" ry="1.2" fill="#fff" opacity=".85"/>` +
    mouth +
    collar.front(gold) +
    hw;
  return wrap(inner, DOG_VIEWBOX, live ? 'ch-live ch-dog-svg' : 'ch-dog-svg', live ? `data-expr="${expr}"` : '');
}

// =====================================================================
//                         商店小圖示（100×100）
// =====================================================================
// 頭上配件、手上東西、緞帶、狗配件：沿用穿在身上的畫法，依外框縮放置中。
const ICON_BOX = {
  hat_berryClip: [126, 30, 172, 76], hat_beanie: [56, 0, 164, 74], hat_beret: [60, 12, 174, 62],
  hat_flowerCrown: [38, 34, 182, 86], hat_strawHat: [32, 12, 188, 74],
  hd_honeySpoon: [6, 154, 52, 226], hd_bouquet: [14, 152, 78, 232], hd_balloon: [-2, 102, 46, 176], hd_camera: [10, 194, 48, 232],
  ribbon: [66, 158, 154, 216],
  dog_sunglasses: [50, 38, 110, 58], dog_cap: [36, 2, 104, 31], dog_bandana: [42, 8, 106, 38], dog_crown: [60, -6, 100, 24],
};
function fitBox([x0, y0, x1, y1], inner, size = 78) {
  const w = x1 - x0, h = y1 - y0, s = size / Math.max(w, h);
  const tx = 50 - s * (x0 + x1) / 2, ty = 47 - s * (y0 + y1) / 2;
  return `<g transform="translate(${f1(tx)} ${f1(ty)}) scale(${s.toFixed(4)})">${inner}</g>`;
}
const iconShadow = `<ellipse cx="50" cy="91" rx="28" ry="4.2" fill="#B98A64" opacity=".18"/>`;

// 衣服單獨畫成衣服的樣子
const SHIRT = 'M36 20 L64 20 Q70 20 74 24 L89 43 Q91 47 87 50 L78 56 L76 53 L76 82 Q76 86 72 86 L28 86 Q24 86 24 82 L24 53 L22 56 L13 50 Q9 47 11 43 L26 24 Q30 20 36 20 Z';
const CLOTHES_ICON = {
  cl_apron: () => `<path d="M38 12 Q50 4 62 12" fill="none" stroke="#FF9EB5" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M36 12 L64 12 L64 36 L76 38 L80 84 Q50 92 20 84 L24 38 L36 36 Z" fill="#fff" stroke="#F3A6BF" stroke-width="3" ${SW}/>` +
    `<path d="M22 80 q4.5 7 9.5 0 q4.5 7 9.5 0 q4.5 7 9.5 0 q4.5 7 9.5 0 q4.5 7 9.5 0 q4.5 7 9.5 0" fill="none" stroke="#FF9EB5" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M14 40 L24 38 M86 40 L76 38" stroke="#FF9EB5" stroke-width="4" stroke-linecap="round"/><path d="M12 40 L6 52 M88 40 L94 52" stroke="#FF9EB5" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${heartPath(50, 60, 9)}" fill="#FFD6E1" stroke="#F08AAA" stroke-width="2.4" ${SW}/>`,
  cl_overalls: () => `<path d="M30 10 L36 40 M70 10 L64 40" stroke="#5E93C4" stroke-width="8" stroke-linecap="round"/><path d="M30 10 L36 40 M70 10 L64 40" stroke="#A9D3F2" stroke-width="4.4" stroke-linecap="round"/>` +
    `<path d="M32 30 L68 30 L70 50 L80 52 L82 86 L56 86 L52 70 L48 70 L44 86 L18 86 L20 52 L30 50 Z" fill="#A9D3F2" stroke="#5E93C4" stroke-width="3" ${SW}/>` +
    `<rect x="42" y="36" width="16" height="11" rx="3" fill="none" stroke="#5E93C4" stroke-width="1.8" stroke-dasharray="2.4 2.2"/>` +
    `<circle cx="36" cy="34" r="3.4" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.6"/><circle cx="64" cy="34" r="3.4" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.6"/>` +
    `<path d="M20 54 Q50 60 80 54" fill="none" stroke="#5E93C4" stroke-width="1.6" stroke-dasharray="2.6 2.4" opacity=".7"/>`,
  cl_raincoat: () => `<path d="M38 22 Q50 6 62 22 Q50 16 38 22 Z" fill="#FFD86E" stroke="#D99A2B" stroke-width="3" ${SW}/>` +
    `<path d="${SHIRT}" fill="#FFD86E" stroke="#D99A2B" stroke-width="3" ${SW}/>` +
    `<path d="M50 26 L50 86" stroke="#D99A2B" stroke-width="2.6"/>` +
    [40, 54, 68].map(y => `<rect x="53" y="${y - 2.6}" width="10" height="5.2" rx="2.6" fill="#B97A4E" stroke="#8A5536" stroke-width="1.4"/>`).join('') +
    `<path d="M30 62 L44 62 L43 69 L31 69 Z" fill="#F7C54E" stroke="#D99A2B" stroke-width="2.2" ${SW}/>` +
    `<path d="M40 20 L50 30 L44 34 Z M60 20 L50 30 L56 34 Z" fill="#FFE59B" stroke="#D99A2B" stroke-width="2.2" ${SW}/>` +
    `<path d="M30 32 Q34 46 30 56" fill="none" stroke="#FFF4CC" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>`,
  cl_pajamas: () => `<path d="${SHIRT}" fill="#D5C6F7" stroke="#9C86DE" stroke-width="3" ${SW}/>` +
    [[34, 44], [64, 40], [40, 70], [62, 66], [18, 46], [84, 46]].map(([x, y], i) => `<path d="${star5(x, y, 5.4, 2.5)}" fill="${i % 2 ? '#FFF6C2' : '#fff'}" stroke="#E3BF72" stroke-width="1" ${SW}/>`).join('') +
    [[48, 56], [30, 58], [70, 52], [56, 78]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".9"/>`).join('') +
    `<path d="M50 28 L50 86" stroke="#9C86DE" stroke-width="2"/>` + [40, 54, 68].map(y => `<circle cx="53.5" cy="${y}" r="2.6" fill="#fff" stroke="#9C86DE" stroke-width="1.4"/>`).join('') +
    `<path d="M38 20 Q44 32 50 28 Q56 32 62 20" fill="#F1EBFF" stroke="#9C86DE" stroke-width="2.4" ${SW}/>`,
  cl_travelVest: () => `<path d="M30 14 L44 22 Q46 54 42 86 L20 86 Q18 50 24 30 Z" fill="#E7D3A4" stroke="#B39565" stroke-width="3" ${SW}/>` +
    `<path d="M70 14 L56 22 Q54 54 58 86 L80 86 Q82 50 76 30 Z" fill="#E7D3A4" stroke="#B39565" stroke-width="3" ${SW}/>` +
    `<rect x="24" y="56" width="16" height="15" rx="3" fill="#DCC48E" stroke="#B39565" stroke-width="2"/><path d="M24 61 L40 61" stroke="#B39565" stroke-width="2"/>` +
    `<rect x="60" y="56" width="16" height="15" rx="3" fill="#DCC48E" stroke="#B39565" stroke-width="2"/><path d="M60 61 L76 61" stroke="#B39565" stroke-width="2"/>` +
    `<circle cx="66" cy="40" r="5.6" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.8"/><path d="M63.4 40 L68.6 40 M66 37.4 L66 42.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
};
// 項圈單獨畫成一圈
function collarIcon(id, gold) {
  const c = COLLARS[id] || COLLARS.col_pink;
  const ring = {
    col_pink: `<ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#E0668A" stroke-width="10"/><ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#FFA3BB" stroke-width="5.5"/>`,
    col_plaid: `<ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#B83E48" stroke-width="10.5"/><ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#E5636B" stroke-width="6"/><ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#FFE1E1" stroke-width="6" stroke-dasharray="1.6 3.6" opacity=".9"/><ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#8E2C36" stroke-width="1.4" opacity=".7"/>`,
    col_bowtie: `<ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#C8486E" stroke-width="6.5"/><ellipse cx="50" cy="48" rx="33" ry="22" fill="none" stroke="#FF8FAA" stroke-width="3"/>`,
    col_pearls: Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2; const x = 50 + Math.cos(a) * 33, y = 48 + Math.sin(a) * 22; return `<circle cx="${f1(x)}" cy="${f1(y)}" r="4" fill="#FFFDF8" stroke="#C9B9AE" stroke-width="1.3"/><circle cx="${f1(x - 1.2)}" cy="${f1(y - 1.2)}" r="1.1" fill="#fff"/>`; }).join(''),
    col_goldChain: Array.from({ length: 26 }, (_, i) => { const a = i / 26 * Math.PI * 2; const x = 50 + Math.cos(a) * 33, y = 48 + Math.sin(a) * 22; const rot = a * 180 / Math.PI + 90; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${i % 2 ? 2.4 : 4}" ry="${i % 2 ? 3.8 : 2.4}" fill="none" stroke="#D9A52B" stroke-width="2.4" transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"/>`; }).join(''),
  }[id] || '';
  // 吊飾：用原本的座標（中心約 80,76）平移放大到 (50,74)
  const front = `<g transform="translate(50 72) scale(1.9) translate(-80 -76)">${c.front(gold)}</g>`;
  return ring + front;
}

/** 商店小圖示（BEAR_ITEMS、DOG_ITEMS 每一件），viewBox 0 0 100 100 */
export function itemIconSVG(itemId) {
  const gold = uid('chg');
  let inner = '';
  if (itemId === 'hd_balloon') inner = `<path d="M50 62 Q42 72 52 80 Q60 86 50 92" fill="none" stroke="#B9A4F0" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M50 58 L45 64 L55 64 Z" fill="#B9A4F0" stroke="#8E72D6" stroke-width="2" ${SW}/>` +
    `<path d="${heartPath(50, 36, 25)}" fill="#C9B8F5" stroke="#8E72D6" stroke-width="3.6" ${SW}/>` + shine(38, 26, 4.4, 7.6, -25, .8) + dot(57, 22, 2.4, .9);
  else if (HEADWEAR[itemId]) inner = fitBox(ICON_BOX[itemId], HEADWEAR[itemId]());
  else if (HANDHELD[itemId]) inner = fitBox(ICON_BOX[itemId], HANDHELD[itemId]());
  else if (RIBBONS[itemId]) inner = fitBox(ICON_BOX.ribbon, ribbonArt(itemId, gold), 76);
  else if (CLOTHES_ICON[itemId]) inner = CLOTHES_ICON[itemId]();
  else if (DOG_HEADWEAR[itemId]) inner = fitBox(ICON_BOX[itemId], DOG_HEADWEAR[itemId](gold));
  else if (COLLARS[itemId]) inner = collarIcon(itemId, gold);
  else inner = `<circle cx="50" cy="48" r="30" fill="#FFE4EB" stroke="#F3A6BF" stroke-width="3"/><path d="${heartPath(50, 48, 12)}" fill="#FF9EB5"/>`;
  return wrap(`<defs>${goldGrad(gold)}</defs>${iconShadow}${inner}`, '0 0 100 100', 'ch-icon');
}
