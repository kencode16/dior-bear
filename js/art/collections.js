// B3 收藏美術：熊朋友、香水瓶、家具、小屋背景、貼紙。全部回傳完整 SVG 字串（含 xmlns）。
// 畫風照 style/index_v2.html：粉彩馬卡龍 Q 版、同色系較深的粗圓描邊、豆豆眼＋亮點、腮紅、左上亮面。
// viewBox：friendSVG 0 0 200 220｜perfumeBottleSVG 0 0 100 120｜furnitureSVG 0 0 w h（= HOUSE_SLOTS 該位置）
//          houseBgSVG 0 0 360 480｜stickerSVG / lockedStickerSVG 0 0 200 200
// 小屋建議疊放順序（下→上）：houseBgSVG → wall → curtain → lamp → bed → rug → plant → table → 梳妝台上的香水 → 角色
import { INK, SW, shine, dot, sparkle, star5, heartPath, svg, uid } from './common.js';
import { bearSVG, dogSVG } from './chars.js';
import { tileSVG } from './tiles.js';
import { HOUSE_SLOTS, VANITY, VANITY_SHELF, WINDOW, PERFUMES, FURNITURE, STICKERS, FRIENDS } from '../data/items.js';

// ---------------- 小工具 ----------------
function rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
/** 兩色混合，t=0 為 a、t=1 為 b */
function mix(a, b, t) { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
const deep = (c, t = .35) => mix(c, '#5A3A2E', t);   // 同色系較深的描邊
const light = (c, t = .6) => mix(c, '#FFFFFF', t);
/** 把另一個完整 SVG 字串嵌進來，放在 (x,y) 大小 w×h */
const place = (s, x, y, w, h) => String(s).replace(/<svg\b/, `<svg x="${x}" y="${y}" width="${w}" height="${h}"`);
const goldStops = `<stop offset="0" stop-color="#FFEDB3"/><stop offset=".55" stop-color="#F2C866"/><stop offset="1" stop-color="#D9A53F"/>`;
const goldGrad = id => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${goldStops}</linearGradient>`;
const glassGrad = (id, c) => `<linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${light(c, .72)}"/><stop offset="1" stop-color="${light(c, .28)}"/></linearGradient>`;
const sparkleAt = (x, y, r, fill = '#fff', stroke = '#F3A6CB') => `<path d="${sparkle(x, y, r)}" fill="${fill}" stroke="${stroke}" stroke-width="${Math.max(1.2, r * .28)}" ${SW}/>`;
const heartAt = (x, y, s, fill = '#FF9EB5', stroke = '#E0668A', sw = 2) => `<path d="${heartPath(x, y, s)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${SW}/>`;
const pads = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="5.4" fill="#FFB7C6"/><circle cx="${x - 9}" cy="${y - 6}" r="2.8" fill="#FFB7C6"/><circle cx="${x}" cy="${y - 9}" r="2.8" fill="#FFB7C6"/><circle cx="${x + 9}" cy="${y - 6}" r="2.8" fill="#FFB7C6"/>`;

// =====================================================================
// 熊朋友（viewBox 0 0 200 220）
// =====================================================================
function bearFriend(o, happy) {
  const F = o.fur, L = o.line, sw = 5;
  const limbF = o.limbFill || F, limbL = o.limbLine || L;
  const earF = o.earFill || F, earL = o.earLine || L;
  const g = uid('fr');
  const er = o.earR || 21, ex = o.earX || 52, ey = o.earY || 46;
  const furFill = `url(#${g})`;
  let s = `<defs><radialGradient id="${g}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="${mix(F, '#ffffff', .2)}"/><stop offset="1" stop-color="${F}"/></radialGradient></defs>`;
  s += `<ellipse cx="100" cy="213" rx="62" ry="5" fill="#B98A64" opacity=".2"/>`;
  // 腳
  for (const x of [74, 126]) s += `<ellipse cx="${x}" cy="200" rx="22" ry="13" fill="${limbF}" stroke="${limbL}" stroke-width="${sw}"/>` + pads(x, 204);
  // 身體
  s += `<ellipse cx="100" cy="166" rx="54" ry="42" fill="${furFill}" stroke="${L}" stroke-width="${sw}"/>`;
  if (o.belly) s += `<ellipse cx="100" cy="177" rx="31" ry="25" fill="${o.belly}"/>`;
  s += o.bodyExtra || '';
  // 手
  s += o.armLeft ?? `<ellipse cx="50" cy="168" rx="14" ry="21" fill="${limbF}" stroke="${limbL}" stroke-width="${sw}" transform="rotate(24 50 168)"/>`;
  s += o.armRight ?? `<ellipse cx="150" cy="168" rx="14" ry="21" fill="${limbF}" stroke="${limbL}" stroke-width="${sw}" transform="rotate(-24 150 168)"/>`;
  s += o.mid || '';
  // 耳朵＋頭
  for (const x of [ex, 200 - ex]) s += `<circle cx="${x}" cy="${ey}" r="${er}" fill="${earF}" stroke="${earL}" stroke-width="${sw}"/><circle cx="${x}" cy="${ey}" r="${er * .52}" fill="${o.inner}"/>`;
  s += `<ellipse cx="100" cy="94" rx="70" ry="57" fill="${furFill}" stroke="${L}" stroke-width="${sw}"/>`;
  s += shine(62, 66, 10, 5, -30, o.dark ? .22 : .7);
  s += o.headExtra || '';
  // 眼睛
  for (const x of [76, 124]) {
    if (o.eyeRim) s += `<ellipse cx="${x}" cy="94" rx="${o.rimRx || 9.4}" ry="${o.rimRy || 10.8}" fill="${o.eyeRim}"/>`;
    if (happy) s += `<path d="M${x - 8} 97 Q${x} 85 ${x + 8} 97" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>`;
    else s += `<ellipse cx="${x}" cy="94" rx="6.6" ry="8" fill="${o.dark ? '#1C1416' : INK}"/><circle cx="${x + 2.4}" cy="90.6" r="2.7" fill="#fff"/><circle cx="${x - 1.8}" cy="98" r="1.2" fill="#fff"/>`;
  }
  // 口鼻
  s += `<ellipse cx="100" cy="115" rx="${o.muzzleRx || 22}" ry="${o.muzzleRy || 15}" fill="${o.muzzle}" stroke="${o.muzzleLine}" stroke-width="2.6"/>`;
  s += `<path d="M93 107 Q100 102.5 107 107 Q106 113 100 114.5 Q94 113 93 107 Z" fill="${o.nose}"/><ellipse cx="97.4" cy="107" rx="2.2" ry="1.2" fill="#fff" opacity=".8"/>`;
  if (happy) s += `<path d="M90 118.5 Q100 132 110 118.5 Z" fill="#7A4A38" stroke="#7A4A38" stroke-width="2" ${SW}/><path d="M94.5 123 Q100 129 105.5 123 Q100 120.5 94.5 123 Z" fill="#FF8FAA"/>`;
  else s += `<path d="M100 114.5 L100 118 M92.5 118 Q96.5 123 100 118 Q103.5 123 107.5 118" fill="none" stroke="#7A4A38" stroke-width="3" ${SW}/>`;
  // 腮紅
  for (const x of [57, 143]) s += `<ellipse cx="${x}" cy="114" rx="11" ry="7" fill="#FF97AC" opacity="${o.dark ? .75 : .55}"/>`;
  s += o.front || '';
  if (happy) s += sparkleAt(28, 40, 7) + sparkleAt(176, 70, 5.5, '#FFF6D8', '#E8C26A');
  return s;
}

function salmonMini(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M16 0 L27 -9 L25 0 L27 9 Z" fill="#FF9A6B" stroke="#D9673A" stroke-width="2.6" ${SW}/>` +
    `<ellipse cx="0" cy="0" rx="19" ry="10.5" fill="#FFAA7E" stroke="#D9673A" stroke-width="2.8"/>` +
    `<path d="M-4 -8 Q2 0 -4 8" fill="none" stroke="#E2794B" stroke-width="1.6" opacity=".7"/>` +
    `<circle cx="-10" cy="-2" r="2.2" fill="${INK}"/><circle cx="-9.3" cy="-2.8" r=".8" fill="#fff"/>` +
    `<ellipse cx="-6" cy="-5.5" rx="5" ry="2" fill="#fff" opacity=".5"/></g>`;
}

const FRIEND_ART = {
  // 北極熊「雪球」：白毛＋偏藍陰影、小耳朵、手抱一條小鮭魚
  snowball(h) {
    return bearFriend({
      fur: '#FCFEFF', line: '#9DBCD8', inner: '#FFD3DD', muzzle: '#FFFFFF', muzzleLine: '#CFE0EE',
      belly: '#EAF3FB', nose: '#3D4757', earR: 17, earX: 57, earY: 52, muzzleRx: 24, muzzleRy: 16,
      bodyExtra: `<path d="M58 186 Q100 214 142 186" fill="none" stroke="#DCEAF6" stroke-width="7" stroke-linecap="round" opacity=".9"/>` +
        `<path d="M70 132 Q100 146 130 132" fill="none" stroke="#DCEAF6" stroke-width="6" stroke-linecap="round" opacity=".8"/>`,
      front: salmonMini(150, 176, 1.05, -12) + `<circle cx="140" cy="186" r="10" fill="#FCFEFF" stroke="#9DBCD8" stroke-width="4"/>` +
        `<circle cx="168" cy="160" r="2.2" fill="#BFE0F5"/><circle cx="174" cy="168" r="1.6" fill="#BFE0F5"/>`,
    }, h);
  },
  // 貓熊「芝麻」：黑白、八字眼圈、裁縫師（脖子掛布尺、手腕針插）
  sesame(h) {
    const K = '#3F3539', KL = '#2A2226';
    return bearFriend({
      fur: '#FFFFFF', line: '#BDB1B7', inner: '#6A5B61', limbFill: K, limbLine: KL, earFill: K, earLine: KL,
      muzzle: '#FFFFFF', muzzleLine: '#E3DADE', nose: KL, eyeRim: '#FFFFFF', rimRx: 8.6, rimRy: 10, earR: 21, earX: 54, earY: 46,
      bodyExtra: `<path d="M50 146 Q100 124 150 146 L152 166 Q100 146 48 166 Z" fill="${K}"/>`,
      headExtra: `<ellipse cx="74" cy="97" rx="16" ry="20" fill="${K}" transform="rotate(32 74 97)"/><ellipse cx="126" cy="97" rx="16" ry="20" fill="${K}" transform="rotate(-32 126 97)"/>`,
      front:
        // 布尺：從脖子兩側垂下
        `<path d="M74 146 Q68 170 70 198" fill="none" stroke="#D99A2B" stroke-width="9" stroke-linecap="round"/><path d="M74 146 Q68 170 70 198" fill="none" stroke="#FFD36E" stroke-width="5.5" stroke-linecap="round"/>` +
        `<path d="M126 146 Q134 168 130 190" fill="none" stroke="#D99A2B" stroke-width="9" stroke-linecap="round"/><path d="M126 146 Q134 168 130 190" fill="none" stroke="#FFD36E" stroke-width="5.5" stroke-linecap="round"/>` +
        [156, 166, 176, 186].map(y => `<path d="M${66.5 + (y - 156) * .02} ${y} l5 0" stroke="#B9801A" stroke-width="1.6" stroke-linecap="round"/>`).join('') +
        [154, 163, 172, 181].map(y => `<path d="M${128 + (y - 154) * .1} ${y} l5 0" stroke="#B9801A" stroke-width="1.6" stroke-linecap="round"/>`).join('') +
        `<path d="M76 146 Q100 156 124 146" fill="none" stroke="#D99A2B" stroke-width="10" stroke-linecap="round"/><path d="M76 146 Q100 156 124 146" fill="none" stroke="#FFD36E" stroke-width="6" stroke-linecap="round"/>` +
        // 針插（左手腕）
        `<path d="M40 175 L37 162 M48 173 L51 160 M44 172 L44 158" stroke="#8C8C9C" stroke-width="1.6" stroke-linecap="round"/>` +
        `<circle cx="37" cy="161" r="2.6" fill="#A8E6B8"/><circle cx="51" cy="159" r="2.6" fill="#BBA8F2"/><circle cx="44" cy="157" r="2.6" fill="#FFD36E"/>` +
        `<ellipse cx="44" cy="180" rx="12" ry="9" fill="#FF8FAA" stroke="#D9557E" stroke-width="2.8"/><path d="M44 171 L44 189 M34 178 Q44 183 54 178" fill="none" stroke="#D9557E" stroke-width="1.4" opacity=".7"/>` +
        `<path d="M40 171 L44 168 L48 171" fill="#7DD39A" stroke="#4FA06A" stroke-width="1.6" ${SW}/>` + shine(40, 176, 3, 1.8, -20, .7),
    }, h);
  },
  // 馬來熊「可可」：深可可色、胸口橘黃月牙、小耳朵、木工圍裙＋小木槌
  cocoa(h) {
    const F = '#5E4842', L = '#3A2A27';
    return bearFriend({
      fur: F, line: L, inner: '#C99595', muzzle: '#EBBE8E', muzzleLine: '#B98552', nose: '#2A1F22', dark: true,
      eyeRim: '#F1D9C0', earR: 15, earX: 60, earY: 52, muzzleRx: 27, muzzleRy: 18,
      bodyExtra:
        `<path d="M66 148 Q100 186 134 148 Q100 168 66 148 Z" fill="#F4B860" stroke="#C98A3A" stroke-width="2.4" ${SW}/>` +
        // 腰間工具圍裙
        `<path d="M64 172 Q100 180 136 172" fill="none" stroke="#B9986A" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M70 174 Q100 180 130 174 L135 199 Q100 208 65 199 Z" fill="#EBD9B8" stroke="#B9986A" stroke-width="3" ${SW}/>` +
        `<rect x="82" y="182" width="36" height="15" rx="5" fill="#E2CBA2" stroke="#B9986A" stroke-width="2.4"/>` +
        `<path d="M89 183 L86 171" stroke="#FFD36E" stroke-width="4" stroke-linecap="round"/><path d="M86 171 L85.4 168" stroke="#FF9EB5" stroke-width="4" stroke-linecap="round"/>` +
        `<rect x="104" y="170" width="6" height="16" rx="1.5" fill="#F2D3A6" stroke="#B98552" stroke-width="1.6" transform="rotate(10 107 178)"/>`,
      front:
        `<path d="M150 192 L168 132" stroke="#8A5A36" stroke-width="7" stroke-linecap="round"/><path d="M150 192 L168 132" stroke="#C08A5A" stroke-width="3.5" stroke-linecap="round"/>` +
        `<rect x="154" y="118" width="30" height="17" rx="5" fill="#C99A73" stroke="#7A4E3A" stroke-width="3" transform="rotate(16 169 126)"/>` +
        shine(162, 122, 4, 1.8, 16, .55) +
        `<circle cx="154" cy="178" r="10" fill="${F}" stroke="${L}" stroke-width="4"/>`,
    }, h);
  },
  // 眼鏡熊「波波」：深棕、眼睛周圍奶油色眼鏡紋、胸口奶油色、攝影師（相機＋小背包肩帶）
  bobo(h) {
    const F = '#4E3E3A', L = '#2E2321', CR = '#F3DFC0';
    return bearFriend({
      fur: F, line: L, inner: '#C99595', muzzle: CR, muzzleLine: '#C9A77E', nose: '#2A1F22', dark: true,
      eyeRim: '#FFF3E8', rimRx: 8.2, rimRy: 9.6, earR: 19, earX: 54, earY: 48,
      headExtra:
        `<ellipse cx="76" cy="94" rx="15.5" ry="14.5" fill="none" stroke="${CR}" stroke-width="5"/><ellipse cx="124" cy="94" rx="15.5" ry="14.5" fill="none" stroke="${CR}" stroke-width="5"/>` +
        `<path d="M90 90 Q100 85 110 90" fill="none" stroke="${CR}" stroke-width="4.5" stroke-linecap="round"/>` +
        `<path d="M64 104 Q70 116 82 122 M136 104 Q130 116 118 122" fill="none" stroke="${CR}" stroke-width="5" stroke-linecap="round"/>`,
      bodyExtra:
        `<path d="M72 146 Q100 196 128 146 Q114 162 100 164 Q86 162 72 146 Z" fill="${CR}"/>` +
        `<path d="M60 140 Q68 170 64 198 M140 140 Q132 170 136 198" fill="none" stroke="#4FA06A" stroke-width="9" stroke-linecap="round"/>` +
        `<path d="M60 140 Q68 170 64 198 M140 140 Q132 170 136 198" fill="none" stroke="#A8E6B8" stroke-width="5" stroke-linecap="round"/>`,
      front:
        `<path d="M80 140 L86 162 M120 140 L114 162" stroke="#7D68C2" stroke-width="3" stroke-linecap="round"/>` +
        `<rect x="80" y="158" width="40" height="28" rx="7" fill="#BBA8F2" stroke="#7D68C2" stroke-width="3.2"/>` +
        `<rect x="84" y="153" width="11" height="7" rx="2" fill="#D9CCFA" stroke="#7D68C2" stroke-width="2.4"/><circle cx="113" cy="157" r="3" fill="#FF9EB5" stroke="#D9557E" stroke-width="1.8"/>` +
        `<circle cx="100" cy="172" r="10" fill="#5A4D78" stroke="#7D68C2" stroke-width="3"/><circle cx="100" cy="172" r="5" fill="#8C7FB8"/><circle cx="97" cy="169" r="2.2" fill="#fff" opacity=".9"/>` +
        shine(86, 164, 3, 1.6, -20, .7),
    }, h);
  },
};

export function friendSVG(friendId, { expr = 'normal' } = {}) {
  const f = FRIEND_ART[friendId] || FRIEND_ART.snowball;
  return svg(f(expr === 'happy'), '0 0 200 220');
}

// =====================================================================
// 香水瓶（viewBox 0 0 100 120）
// =====================================================================
const bottleShadow = `<ellipse cx="50" cy="115" rx="27" ry="3.8" fill="#B98A64" opacity=".2"/>`;
function bowAt(x, y, c = '#FFFFFF', line = '#E0668A', s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M0 0 C-8 -9 -18 -6 -16 1.5 C-14 9 -5 7 0 0 Z" fill="${c}" stroke="${line}" stroke-width="2.8" ${SW}/>` +
    `<path d="M0 0 C8 -9 18 -6 16 1.5 C14 9 5 7 0 0 Z" fill="${c}" stroke="${line}" stroke-width="2.8" ${SW}/>` +
    `<path d="M-2 2 L-6 12 M2 2 L6 12" stroke="${line}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<circle cx="0" cy="0" r="3.2" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.6"/></g>`;
}

const BOTTLES = {
  // 丁噹熊的第一瓶：圓胖瓶＋蝴蝶結＋噴頭球（和角色手上那瓶同款）
  p0(c) {
    const g = uid('pg'), gd = uid('pd'), D = deep(c, .25);
    return `<defs>${glassGrad(g, c)}${goldGrad(gd)}</defs>` + bottleShadow +
      `<path d="M60 27 Q80 23 84 38" fill="none" stroke="${D}" stroke-width="2.6" stroke-linecap="round"/>` +
      `<ellipse cx="85" cy="45" rx="7.5" ry="9" fill="${c}" stroke="${D}" stroke-width="2.6"/>` + shine(82.6, 41.6, 1.8, 2.8, 20, .75) +
      `<path d="M85 54 L85 58" stroke="#C98F1F" stroke-width="2" stroke-linecap="round"/><path d="M82.4 58 Q85 66 87.6 58 Z" fill="#F6CF66" stroke="#C98F1F" stroke-width="1.4" ${SW}/>` +
      `<circle cx="50" cy="80" r="30" fill="url(#${g})" stroke="${D}" stroke-width="4.5"/>` +
      `<path d="M21 84 Q35.5 78 50 84 Q64.5 90 79 84 A30 30 0 0 1 21 84 Z" fill="${c}" opacity=".55"/>` +
      `<rect x="42" y="44" width="16" height="10" rx="3" fill="${light(c, .7)}" stroke="${D}" stroke-width="3.4"/>` +
      `<rect x="37.5" y="27" width="25" height="18" rx="6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="3.4"/>` + shine(43.5, 32, 3.2, 1.8, -15, .85) +
      `<path d="M57 29 L63 23" stroke="#C98F1F" stroke-width="3.8" stroke-linecap="round"/>` +
      bowAt(50, 53, '#FFFFFF', D, .95) +
      `<path d="M28 76 Q30 66 38 61" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/>` + dot(27, 84, 2.2, .85);
  },
  // 蜂蜜莓果香：愛心瓶＋蓋上小草莓＋頸上莓果吊飾
  p1(c) {
    const g = uid('pg'), gd = uid('pd'), cp = uid('pc'), D = deep(c, .35);
    const heart = `M50 110 C14 90 14 58 34 54 C43 52 50 58 50 66 C50 58 57 52 66 54 C86 58 86 90 50 110 Z`;
    return `<defs>${glassGrad(g, c)}${goldGrad(gd)}<clipPath id="${cp}"><path d="${heart}"/></clipPath></defs>` + bottleShadow +
      `<path d="${heart}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><path d="M10 86 Q30 80 50 86 Q70 92 90 86 L90 120 L10 120 Z" fill="${c}" opacity=".6"/></g>` +
      `<path d="${heart}" fill="none" stroke="${D}" stroke-width="4.5" ${SW}/>` +
      `<rect x="43" y="44" width="14" height="12" rx="3" fill="${light(c, .7)}" stroke="${D}" stroke-width="3.2"/>` +
      `<rect x="38" y="30" width="24" height="16" rx="6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="3.2"/>` + shine(44, 34, 3, 1.6, -15, .85) +
      // 蓋上的小草莓
      `<path d="M50 30 C43 30 42 20 46 17 C48 16 52 16 54 17 C58 20 57 30 50 30 Z" fill="#FF8FB0" stroke="#D9557E" stroke-width="2.2" ${SW}/>` +
      `<path d="M45 17 L50 13 L55 17 L50 19 Z" fill="#7DD39A" stroke="#4FA06A" stroke-width="1.6" ${SW}/>` + dot(48, 23, 1, .9) + dot(52, 25, 1, .9) +
      // 頸上緞帶＋莓果吊飾
      `<path d="M42 52 Q50 56 58 52" fill="none" stroke="#FF9EB5" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M58 53 Q66 58 66 66" fill="none" stroke="#E0668A" stroke-width="1.6"/>` +
      `<circle cx="66" cy="69" r="4" fill="#A98FEA" stroke="#7D68C2" stroke-width="1.6"/><circle cx="72" cy="66" r="3.4" fill="#FF8FB0" stroke="#D9557E" stroke-width="1.4"/>` +
      `<path d="M27 70 Q28 61 35 58" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".85"/>` + dot(30, 78, 2, .85);
  },
  // 衣櫥玫瑰香：玫瑰花苞瓶＋葉子瓶頸＋花苞蓋
  p2(c) {
    const g = uid('pg'), cp = uid('pc'), D = deep(c, .3);
    const bud = `M50 111 C22 105 18 76 31 61 C37 54 44 52 50 52 C56 52 63 54 69 61 C82 76 78 105 50 111 Z`;
    return `<defs>${glassGrad(g, c)}<clipPath id="${cp}"><path d="${bud}"/></clipPath></defs>` + bottleShadow +
      `<path d="${bud}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><path d="M10 88 Q30 82 50 88 Q70 94 90 88 L90 120 L10 120 Z" fill="${c}" opacity=".55"/></g>` +
      `<path d="M33 66 Q50 82 67 66 M37 86 Q50 98 63 86 M50 52 Q42 70 50 84 Q58 70 50 52" fill="none" stroke="${D}" stroke-width="2.2" opacity=".45" stroke-linecap="round"/>` +
      `<path d="${bud}" fill="none" stroke="${D}" stroke-width="4.4" ${SW}/>` +
      // 葉子瓶頸
      `<path d="M50 56 L36 50 Q40 44 47 46 Z M50 56 L64 50 Q60 44 53 46 Z" fill="#7DD39A" stroke="#4FA06A" stroke-width="2.4" ${SW}/>` +
      `<rect x="44" y="38" width="12" height="13" rx="3" fill="${light(c, .7)}" stroke="${D}" stroke-width="3"/>` +
      // 花苞蓋
      `<path d="M50 40 C38 38 37 22 44 16 C47 13 53 13 56 16 C63 22 62 38 50 40 Z" fill="${c}" stroke="${D}" stroke-width="3" ${SW}/>` +
      `<path d="M50 20 Q44 26 50 32 Q56 28 52 23" fill="none" stroke="${D}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M41 36 L50 42 L59 36 Q56 44 50 44 Q44 44 41 36 Z" fill="#7DD39A" stroke="#4FA06A" stroke-width="2" ${SW}/>` + shine(45, 22, 2.2, 3.4, 15, .7) +
      `<path d="M28 80 Q29 70 35 64" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".85"/>` + dot(30, 88, 2, .85);
  },
  // 暖暖可可香：圓柱瓶＋菱格紋＋木頭蓋＋肉桂棒
  p3(c) {
    const g = uid('pg'), cp = uid('pc'), D = deep(c, .35);
    let quilt = '';
    for (let k = -60; k <= 100; k += 11) quilt += `M${k} 40 L${k + 70} 110 M${k + 70} 40 L${k} 110 `;
    return `<defs>${glassGrad(g, c)}<clipPath id="${cp}"><rect x="27" y="46" width="46" height="62" rx="14"/></clipPath></defs>` + bottleShadow +
      `<rect x="27" y="46" width="46" height="62" rx="14" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><rect x="20" y="84" width="60" height="30" fill="${c}" opacity=".55"/><path d="${quilt}" stroke="${D}" stroke-width="1" opacity=".22"/></g>` +
      `<rect x="27" y="46" width="46" height="62" rx="14" fill="none" stroke="${D}" stroke-width="4.4"/>` +
      `<ellipse cx="50" cy="78" rx="15" ry="10.5" fill="#FFF6E8" stroke="#D9AE55" stroke-width="2.4"/>` +
      // 標籤上的小可可杯
      `<path d="M44 74 L56 74 L55 82 Q50 85 45 82 Z" fill="#C98B62" stroke="#7A4E3A" stroke-width="1.4" ${SW}/><path d="M56 76 Q60 77 56 80" fill="none" stroke="#7A4E3A" stroke-width="1.4"/>` +
      `<path d="M48 72 Q46 69 48 67 M52 72 Q50 69 52 67" fill="none" stroke="#C9A77E" stroke-width="1.1" stroke-linecap="round"/>` +
      `<rect x="43" y="36" width="14" height="11" rx="3" fill="${light(c, .7)}" stroke="${D}" stroke-width="3"/>` +
      `<rect x="38" y="20" width="24" height="17" rx="5" fill="#A8774F" stroke="#6E4A2F" stroke-width="3"/><ellipse cx="50" cy="21" rx="10" ry="2.6" fill="#C9996B"/>` +
      `<path d="M41 26 H59 M41 31 H59" stroke="#8A5E3C" stroke-width="1.2" opacity=".6"/>` +
      // 奶油色緞帶＋肉桂棒
      `<path d="M41 44 Q50 48 59 44" fill="none" stroke="#FFF1DE" stroke-width="4.5" stroke-linecap="round"/>` +
      `<rect x="56" y="34" width="5.5" height="22" rx="2.5" fill="#B5703F" stroke="#7A4428" stroke-width="1.6" transform="rotate(35 58 45)"/>` +
      `<path d="M33 66 Q33 56 38 51" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".8"/>`;
  },
  // 旅行的風：雲朵瓶＋帆船標籤＋旅行吊牌
  p4(c) {
    const g = uid('pg'), gd = uid('pd'), cp = uid('pc'), D = deep(c, .35);
    const cloud = `M26 106 Q12 106 12 93 Q12 80 25 79 Q25 63 41 62 Q50 52 61 60 Q77 58 79 74 Q90 76 89 91 Q88 106 75 106 Z`;
    return `<defs>${glassGrad(g, c)}${goldGrad(gd)}<clipPath id="${cp}"><path d="${cloud}"/></clipPath></defs>` + bottleShadow +
      `<path d="${cloud}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><path d="M0 94 Q20 88 40 94 Q60 100 80 94 Q90 91 100 94 L100 120 L0 120 Z" fill="${c}" opacity=".6"/></g>` +
      `<path d="${cloud}" fill="none" stroke="${D}" stroke-width="4.2" ${SW}/>` +
      // 帆船
      `<path d="M38 88 L62 88 L57 95 L43 95 Z" fill="#FFB59A" stroke="#C9734E" stroke-width="1.8" ${SW}/>` +
      `<path d="M49 87 L49 70 L60 84 Z" fill="#fff" stroke="${D}" stroke-width="1.8" ${SW}/><path d="M47 86 L47 75 L40 85 Z" fill="#FFE4EB" stroke="${D}" stroke-width="1.6" ${SW}/>` +
      `<path d="M34 98 Q38 95 42 98 Q46 101 50 98 Q54 95 58 98 Q62 101 66 98" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>` +
      `<rect x="44" y="48" width="12" height="13" rx="3" fill="${light(c, .7)}" stroke="${D}" stroke-width="3"/>` +
      `<rect x="39" y="30" width="22" height="19" rx="7" fill="#FFFFFF" stroke="${D}" stroke-width="3"/><rect x="39" y="40" width="22" height="4" fill="url(#${gd})"/>` + shine(44, 34, 2.6, 1.6, -15, .9) +
      // 旅行吊牌
      `<path d="M56 54 Q66 54 70 60" fill="none" stroke="#C9734E" stroke-width="1.4"/>` +
      `<path d="M69 58 L82 54 L86 66 L73 70 Z" fill="#FFF3D6" stroke="#D9AE55" stroke-width="2" ${SW}/><circle cx="72" cy="61" r="1.4" fill="#D9AE55"/>` +
      `<path d="M76 61 L82 59 M77 64 L83 62" stroke="#E8668C" stroke-width="1.2" stroke-linecap="round"/>` +
      `<path d="M22 92 Q22 84 28 82" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`;
  },
  // 丁噹熊的招牌香水：八角切面瓶＋金框＋菱格金點＋小熊頭金蓋＋鈴鐺
  p5(c) {
    const g = uid('pg'), gd = uid('pd'), cp = uid('pc'), D = deep(c, .35);
    const oct = `M32 50 L68 50 L82 64 L82 96 L68 110 L32 110 L18 96 L18 64 Z`;
    let quilt = '', dots = '';
    for (let k = -60; k <= 100; k += 12) quilt += `M${k} 44 L${k + 70} 114 M${k + 70} 44 L${k} 114 `;
    for (let y = 56; y <= 108; y += 12) for (let x = 24 + ((y - 56) / 12 % 2) * 6; x <= 78; x += 12) dots += `<circle cx="${x}" cy="${y}" r="1.1" fill="#F6CF66"/>`;
    return `<defs>${glassGrad(g, c)}${goldGrad(gd)}<clipPath id="${cp}"><path d="${oct}"/></clipPath></defs>` + bottleShadow +
      `<path d="${oct}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><rect x="10" y="86" width="80" height="30" fill="${c}" opacity=".55"/><path d="${quilt}" stroke="#fff" stroke-width="1.1" opacity=".5"/>${dots}</g>` +
      `<path d="M36 58 L64 58 L74 68 L74 92 L64 102 L36 102 L26 92 L26 68 Z" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>` +
      `<path d="${oct}" fill="none" stroke="url(#${gd})" stroke-width="5" ${SW}/><path d="${oct}" fill="none" stroke="#C98F1F" stroke-width="1.2" opacity=".6"/>` +
      `<rect x="41" y="42" width="18" height="10" rx="3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2.6"/>` +
      // 小熊頭金蓋
      `<circle cx="38.5" cy="17" r="6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2.4"/><circle cx="61.5" cy="17" r="6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2.4"/>` +
      `<circle cx="38.5" cy="17" r="2.6" fill="#FFC4D0"/><circle cx="61.5" cy="17" r="2.6" fill="#FFC4D0"/>` +
      `<ellipse cx="50" cy="29" rx="14.5" ry="13" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2.8"/>` +
      `<circle cx="45" cy="28" r="1.7" fill="${INK}"/><circle cx="55" cy="28" r="1.7" fill="${INK}"/>` +
      `<ellipse cx="41" cy="32.5" rx="2.6" ry="1.5" fill="#FF97AC" opacity=".7"/><ellipse cx="59" cy="32.5" rx="2.6" ry="1.5" fill="#FF97AC" opacity=".7"/>` +
      `<ellipse cx="50" cy="33.5" rx="4" ry="2.8" fill="#FFF3D0"/><ellipse cx="50" cy="32.6" rx="1.6" ry="1.1" fill="#7A4A38"/>` + shine(44, 22, 3, 1.6, -20, .9) +
      // 粉紅緞帶＋鈴鐺
      `<path d="M41 51 Q50 55 59 51" fill="none" stroke="#FF9EB5" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M59 52 Q70 54 72 62" fill="none" stroke="#E0668A" stroke-width="2.4" stroke-linecap="round"/>` +
      `<circle cx="73" cy="68" r="6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2"/><path d="M67.6 69 L78.4 69" stroke="#C98F1F" stroke-width="1.4"/><circle cx="73" cy="71.5" r="1.3" fill="#A97412"/>` +
      bowAt(50, 52, '#FFB0C4', '#E0668A', .55) +
      sparkleAt(14, 40, 5, '#FFF6D8', '#E8C26A') + sparkleAt(88, 36, 4, '#fff', '#C9A7F5') + sparkleAt(90, 100, 3.5, '#FFF6D8', '#E8C26A') +
      `<path d="M25 74 Q25 64 31 59" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`;
  },
};

export function perfumeBottleSVG(perfumeId) {
  const p = PERFUMES.find(x => x.id === perfumeId) || PERFUMES[0];
  const f = BOTTLES[p.id] || BOTTLES.p0;
  return svg(f(p.color), '0 0 100 120');
}

// =====================================================================
// 家具（viewBox 0 0 w h，w、h = HOUSE_SLOTS 該位置的寬高）
// =====================================================================
const slotOf = id => HOUSE_SLOTS.find(s => s.id === id);
const gingham = (id, a = '#FFB0C4', b = '#FFF6F8') => `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${b}"/><rect width="5" height="10" fill="${a}" opacity=".5"/><rect width="10" height="5" fill="${a}" opacity=".5"/></pattern>`;
const glow = (id, c) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".75"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;

const FURN = {
  // ---------- 燈（60×100，從天花板 y=0 吊下來） ----------
  f_lamp_mushroom() {
    const gl = uid('gl');
    let dots = [[18, 50, 3.6], [32, 44, 4.2], [44, 54, 3], [26, 58, 2.4], [40, 61, 2.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".95"/>`).join('');
    return `<defs>${glow(gl, '#FFE7A8')}</defs><circle cx="30" cy="72" r="30" fill="url(#${gl})"/>` +
      `<rect x="24" y="0" width="12" height="4" rx="2" fill="#B98A64"/><path d="M30 3 L30 40" stroke="#8A6A5A" stroke-width="2.4"/>` +
      `<ellipse cx="30" cy="66" rx="21" ry="5" fill="#FFF0C8"/><circle cx="30" cy="72" r="7.5" fill="#FFF6CF" stroke="#E8C26A" stroke-width="2.2"/>` +
      `<path d="M5 66 Q5 37 30 37 Q55 37 55 66 Q30 72 5 66 Z" fill="#FF8FA8" stroke="#D9557E" stroke-width="3.4" ${SW}/>` + dots +
      shine(16, 46, 5, 2.4, -35, .55);
  },
  f_lamp_moon() {
    const gl = uid('gl'), gd = uid('gd');
    return `<defs>${glow(gl, '#FFF0B0')}${goldGrad(gd)}</defs><circle cx="30" cy="58" r="30" fill="url(#${gl})"/>` +
      `<rect x="24" y="0" width="12" height="4" rx="2" fill="#B98A64"/><path d="M30 3 L30 33" stroke="#8A6A5A" stroke-width="2.2"/>` +
      `<path d="M14 66 L14 82 M46 74 L46 88" stroke="#C9A77E" stroke-width="1.2"/>` +
      `<path d="${star5(14, 87, 6, 2.8)}" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4" ${SW}/>` +
      `<path d="${star5(46, 93, 5, 2.3)}" fill="#FFE4EB" stroke="#E0668A" stroke-width="1.4" ${SW}/>` +
      // 彎月（開口朝右）＋睡臉
      `<path d="M34 33 A25 25 0 1 0 54 72 A21 21 0 0 1 34 33 Z" fill="#FFE08A" stroke="#E0B04A" stroke-width="3" ${SW}/>` +
      `<path d="M17 56 Q21 60 25 56" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="16" cy="63" rx="3.6" ry="2.2" fill="#FF97AC" opacity=".55"/><path d="M22 66 Q25 68 28 66" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>` +
      shine(16, 44, 2.6, 5, 20, .6);
  },
  f_lamp_string() {
    const gl = uid('gl');
    const strands = `M30 3 Q12 20 10 48 Q9 70 12 94 M30 3 Q30 30 30 58 Q30 76 30 84 M30 3 Q48 20 50 44 Q51 62 48 80`;
    const pts = [[10, 28], [9.5, 56], [12, 86], [30, 24], [30, 50], [30, 76], [49, 32], [50, 56], [48, 78]];
    const cols = [['#FFD36E', '#D99A2B'], ['#FF9EB5', '#E0668A'], ['#A8E6B8', '#4FA06A'], ['#BBA8F2', '#7D68C2']];
    return `<defs>${glow(gl, '#FFF3C4')}</defs>` + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#${gl})"/>`).join('') +
      `<rect x="24" y="0" width="12" height="4" rx="2" fill="#B98A64"/><path d="${strands}" fill="none" stroke="#8A6A5A" stroke-width="1.6"/>` +
      pts.map(([x, y], i) => { const [f, l] = cols[i % 4]; return `<path d="${star5(x, y + 3, 6.2, 3)}" fill="${f}" stroke="${l}" stroke-width="1.5" ${SW}/>` + dot(x - 1.5, y + 1.5, 1.1, .9); }).join('');
  },

  // ---------- 牆上掛飾（110×80） ----------
  f_wall_frame() {
    const gd = uid('gd');
    return `<defs>${goldGrad(gd)}</defs>` +
      `<circle cx="55" cy="4" r="2.6" fill="#B98A64"/><path d="M55 4 L26 16 M55 4 L84 16" stroke="#B98A64" stroke-width="1.6"/>` +
      `<rect x="15" y="13" width="80" height="63" rx="9" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2.6"/>` +
      `<rect x="22" y="20" width="66" height="49" rx="5" fill="#FFE4EB" stroke="#E8C26A" stroke-width="1.6"/>` +
      `<ellipse cx="55" cy="66" rx="30" ry="6" fill="#C9EBD2"/>` +
      // 小小的丁噹熊頭
      `<circle cx="35" cy="37" r="5" fill="#FFF1DE" stroke="#D6A985" stroke-width="1.8"/><circle cx="53" cy="37" r="5" fill="#FFF1DE" stroke="#D6A985" stroke-width="1.8"/>` +
      `<ellipse cx="44" cy="48" rx="13" ry="11" fill="#FFF1DE" stroke="#D6A985" stroke-width="2"/>` +
      `<circle cx="39.5" cy="47" r="1.5" fill="${INK}"/><circle cx="48.5" cy="47" r="1.5" fill="${INK}"/><ellipse cx="44" cy="51.5" rx="3.6" ry="2.4" fill="#FFFAF3" stroke="#EDD2B5" stroke-width="1"/>` +
      `<ellipse cx="36" cy="51" rx="2.4" ry="1.4" fill="#FF97AC" opacity=".6"/><ellipse cx="52" cy="51" rx="2.4" ry="1.4" fill="#FF97AC" opacity=".6"/>` +
      // 小小的大不溜頭（杜賓立耳）
      `<path d="M62 46 L60 34 L67 41 Z M76 46 L79 34 L71 41 Z" fill="#4E3F42" stroke="#3D2E2E" stroke-width="1.6" ${SW}/>` +
      `<ellipse cx="69" cy="50" rx="10" ry="9" fill="#4E3F42" stroke="#3D2E2E" stroke-width="1.8"/>` +
      `<ellipse cx="69" cy="54" rx="5.5" ry="3.8" fill="#E3925C"/><circle cx="65" cy="48" r="1.3" fill="#FFF3E8"/><circle cx="73" cy="48" r="1.3" fill="#FFF3E8"/>` +
      `<ellipse cx="69" cy="52.4" rx="1.8" ry="1.2" fill="#2A1F22"/>` +
      heartAt(57, 28, 4.5, '#FF9EB5', '#E0668A', 1.6) + bowAt(55, 14, '#FFB0C4', '#E0668A', .55) + shine(22, 22, 4, 1.6, -30, .7);
  },
  f_wall_garland() {
    const P0 = [2, 10], P1 = [55, 44], P2 = [108, 10];
    const at = t => [0, 1].map(i => (1 - t) ** 2 * P0[i] + 2 * t * (1 - t) * P1[i] + t * t * P2[i]);
    const cols = [['#FFB0C4', '#E0668A'], ['#A8E6B8', '#4FA06A'], ['#FFD36E', '#D99A2B'], ['#BBA8F2', '#7D68C2'], ['#FFB59A', '#D9734E']];
    let flags = '';
    for (let i = 0; i < 7; i++) {
      const t = (i + .5) / 7, [a1, b1] = at(t - .055), [a2, b2] = at(t + .055), [mx, my] = at(t);
      const [f, l] = cols[i % 5];
      flags += `<path d="M${a1.toFixed(1)} ${b1.toFixed(1)} L${a2.toFixed(1)} ${b2.toFixed(1)} L${mx.toFixed(1)} ${(my + 22).toFixed(1)} Z" fill="${f}" stroke="${l}" stroke-width="2" ${SW}/>` +
        `<circle cx="${mx.toFixed(1)}" cy="${(my + 7).toFixed(1)}" r="1.8" fill="#fff" opacity=".85"/>`;
    }
    return `<path d="M${P0} Q${P1} ${P2}" fill="none" stroke="#B98A64" stroke-width="1.8"/>` + flags +
      bowAt(5, 10, '#FF9EB5', '#E0668A', .45) + bowAt(105, 10, '#FF9EB5', '#E0668A', .45);
  },
  f_wall_map() {
    return `<rect x="8" y="10" width="96" height="66" rx="4" fill="#E9D3AE" opacity=".6"/>` +
      `<rect x="6" y="7" width="96" height="66" rx="4" fill="#FFF6E2" stroke="#D9B98A" stroke-width="2.4"/>` +
      `<rect x="12" y="13" width="84" height="54" rx="3" fill="#DDF0FA"/>` +
      `<path d="M16 26 Q24 16 36 20 Q44 24 40 34 Q36 44 24 42 Q14 38 16 26 Z" fill="#C9EBD2" stroke="#7DBF92" stroke-width="1.6"/>` +
      `<path d="M58 36 Q66 26 80 30 Q92 34 90 48 Q86 60 72 58 Q58 56 58 46 Z" fill="#C9EBD2" stroke="#7DBF92" stroke-width="1.6"/>` +
      `<path d="M44 52 Q50 48 54 54 Q50 60 44 52 Z" fill="#C9EBD2" stroke="#7DBF92" stroke-width="1.4"/>` +
      `<path d="M28 32 Q40 54 54 46 Q64 40 74 46" fill="none" stroke="#E8668C" stroke-width="2" stroke-dasharray="2.5 3" stroke-linecap="round"/>` +
      heartAt(28, 30, 3.4, '#FF9EB5', '#E0668A', 1.4) + heartAt(74, 44, 3.4, '#FF9EB5', '#E0668A', 1.4) +
      `<path d="${star5(88, 22, 6, 2.2)}" fill="#FFD36E" stroke="#D99A2B" stroke-width="1.2" ${SW}/>` +
      `<path d="M30 58 L40 58 L38 61 L32 61 Z M35 57 L35 50 L39 56 Z" fill="#fff" stroke="#8CB7D1" stroke-width="1.2" ${SW}/>` +
      `<path d="M38 7 L54 7" stroke="#D9B98A" stroke-width=".8"/>` +
      `<rect x="2" y="2" width="20" height="8" rx="1.5" fill="#FFB0C4" opacity=".85" transform="rotate(-24 12 6)"/>` +
      `<rect x="88" y="2" width="20" height="8" rx="1.5" fill="#A8E6B8" opacity=".85" transform="rotate(24 98 6)"/>`;
  },

  // ---------- 窗簾（138×130；窗戶在 (14,14)–(124,114)） ----------
  f_curtain_gingham() { return curtain('gingham'); },
  f_curtain_lace() { return curtain('lace'); },

  // ---------- 床（150×134，底部 y=134 貼地） ----------
  f_bed_leaf() {
    const gh = uid('gh');
    let leaves = '';
    [[30, 86], [58, 92], [86, 84], [112, 92], [46, 76], [100, 76]].forEach(([x, y], i) => {
      leaves += `<path d="M${x} ${y} q5 -8 10 0 q-5 8 -10 0 Z" fill="#7DD39A" opacity=".7" transform="rotate(${i % 2 ? 30 : -30} ${x + 5} ${y})"/>`;
    });
    return `<defs><linearGradient id="${gh}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9F0D3"/><stop offset="1" stop-color="#8FD9A6"/></linearGradient></defs>` +
      `<ellipse cx="75" cy="131" rx="72" ry="4" fill="#8A6A5E" opacity=".18"/>` +
      `<rect x="10" y="118" width="10" height="15" rx="3" fill="#C99A73" stroke="#9B6B47" stroke-width="2.4"/><rect x="130" y="118" width="10" height="15" rx="3" fill="#C99A73" stroke="#9B6B47" stroke-width="2.4"/>` +
      `<path d="M75 6 C114 6 142 32 142 70 L142 98 L8 98 L8 70 C8 32 36 6 75 6 Z" fill="url(#${gh})" stroke="#4FA06A" stroke-width="4" ${SW}/>` +
      `<path d="M75 12 L75 92 M75 36 Q56 30 40 40 M75 36 Q94 30 110 40 M75 58 Q52 52 30 64 M75 58 Q98 52 120 64" fill="none" stroke="#4FA06A" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>` +
      shine(40, 26, 10, 4, -30, .55) +
      `<rect x="4" y="90" width="142" height="32" rx="10" fill="#E8C291" stroke="#B98552" stroke-width="3.6"/>` +
      `<rect x="10" y="62" width="130" height="32" rx="12" fill="#FFF8EE" stroke="#D6B48E" stroke-width="3"/>` +
      `<rect x="26" y="50" width="48" height="24" rx="11" fill="#FFFDF8" stroke="#D6B48E" stroke-width="3"/>` +
      `<rect x="78" y="54" width="40" height="20" rx="10" fill="#FFE4EB" stroke="#E8A0B4" stroke-width="2.6"/>` +
      `<path d="M8 74 Q75 66 142 74 L142 98 Q133 106 124 98 Q115 106 106 98 Q97 106 88 98 Q79 106 70 98 Q61 106 52 98 Q43 106 34 98 Q25 106 16 98 Q12 102 8 98 Z" fill="#BFE8C8" stroke="#4FA06A" stroke-width="3" ${SW}/>` + leaves +
      `<path d="M10 76 Q75 69 140 76" fill="none" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>`;
  },
  f_bed_canopy() {
    let scal = '';
    for (let i = 0; i < 9; i++) { const x = 12 + i * 14; scal += `Q${x + 7} ${30} ${x + 14} 20 `; }
    let tufts = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) tufts += `<circle cx="${38 + c * 18 + (r % 2) * 9}" cy="${48 + r * 14}" r="1.8" fill="#E8668C" opacity=".75"/>`;
    return `<ellipse cx="75" cy="131" rx="72" ry="4" fill="#8A6A5E" opacity=".18"/>` +
      `<rect x="10" y="118" width="10" height="15" rx="3" fill="#F2D3A6" stroke="#D9AE55" stroke-width="2.4"/><rect x="130" y="118" width="10" height="15" rx="3" fill="#F2D3A6" stroke="#D9AE55" stroke-width="2.4"/>` +
      // 床幔
      `<path d="M14 16 C4 50 6 92 16 122 L34 122 C24 92 26 52 34 20 Z" fill="#FFC4D3" opacity=".55" stroke="#F29AB4" stroke-width="2"/>` +
      `<path d="M136 16 C146 50 144 92 134 122 L116 122 C126 92 124 52 116 20 Z" fill="#FFC4D3" opacity=".55" stroke="#F29AB4" stroke-width="2"/>` +
      // 床頭板：絎縫
      `<path d="M24 98 L24 44 Q24 26 75 24 Q126 26 126 44 L126 98 Z" fill="#FFD6E2" stroke="#E8668C" stroke-width="3.6" ${SW}/>` +
      `<path d="M30 40 L120 92 M30 66 L84 98 M48 30 L126 76 M120 40 L30 92 M120 66 L66 98 M102 30 L24 76" stroke="#F29AB4" stroke-width="1.4" opacity=".7"/>` + tufts +
      `<rect x="4" y="90" width="142" height="32" rx="10" fill="#FFF8F3" stroke="#E8B7C6" stroke-width="3.4"/><path d="M10 112 H140" stroke="#E8C26A" stroke-width="2" opacity=".8"/>` +
      `<rect x="12" y="62" width="126" height="32" rx="12" fill="#FFFDF8" stroke="#E8B7C6" stroke-width="2.6"/>` +
      `<rect x="28" y="52" width="46" height="22" rx="10" fill="#FFFFFF" stroke="#E8B7C6" stroke-width="2.6"/>` +
      `<path d="M30 70 Q51 76 72 70" fill="none" stroke="#F29AB4" stroke-width="1.6" stroke-dasharray="2 2.5"/>` +
      `<path d="${heartPath(100, 64, 12)}" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.6" ${SW}/>` +
      `<path d="M8 76 Q75 68 142 76 L142 100 Q75 108 8 100 Z" fill="#FFB0C4" stroke="#E0668A" stroke-width="3" ${SW}/>` +
      [24, 44, 64, 84, 104, 124].map(x => `<circle cx="${x}" cy="88" r="1.6" fill="#F6CF66"/>`).join('') +
      `<path d="M14 84 L34 96 L54 84 L74 96 L94 84 L114 96 L134 84" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>` +
      // 床幔頂
      `<path d="M8 4 Q75 -6 142 4 L142 20 Q135 30 128 20 Q121 30 114 20 Q107 30 100 20 Q93 30 86 20 Q79 30 72 20 Q65 30 58 20 Q51 30 44 20 Q37 30 30 20 Q23 30 16 20 Q12 26 8 20 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.8" ${SW}/>` +
      `<path d="M10 9 Q75 0 140 9" fill="none" stroke="#F6CF66" stroke-width="2.2"/>` +
      bowAt(22, 64, '#FF9EB5', '#E0668A', .55) + bowAt(128, 64, '#FF9EB5', '#E0668A', .55);
  },
  f_bed_cloud() {
    const gd = uid('gd');
    const cloud = `M14 98 L14 58 Q8 40 24 34 Q26 14 48 18 Q58 4 76 12 Q94 2 104 18 Q126 14 126 34 Q144 40 136 58 L136 98 Z`;
    return `<defs>${goldGrad(gd)}</defs><ellipse cx="75" cy="131" rx="72" ry="4" fill="#8A6A5E" opacity=".18"/>` +
      `<circle cx="16" cy="126" r="7" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2"/><circle cx="134" cy="126" r="7" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2"/>` +
      `<path d="${cloud}" fill="#FFFFFF" stroke="#9CC8E6" stroke-width="4" ${SW}/>` +
      `<path d="M98 30 A9 9 0 1 0 108 42 A7 7 0 0 1 98 30 Z" fill="#FFE08A" stroke="#E0B04A" stroke-width="1.8"/>` +
      `<path d="${star5(40, 34, 5, 2.2)}" fill="#FFE08A" stroke="#E0B04A" stroke-width="1.2" ${SW}/><path d="${star5(70, 26, 3.6, 1.6)}" fill="#FFE4EB" stroke="#E0668A" stroke-width="1" ${SW}/>` +
      shine(36, 26, 8, 3, -20, .9) +
      `<rect x="4" y="90" width="142" height="32" rx="12" fill="#E4F2FC" stroke="#9CC8E6" stroke-width="3.4"/>` +
      `<rect x="12" y="62" width="126" height="32" rx="12" fill="#FFFFFF" stroke="#C7DDF0" stroke-width="2.6"/>` +
      `<rect x="28" y="50" width="48" height="24" rx="11" fill="#E4F2FC" stroke="#9CC8E6" stroke-width="2.6"/>` +
      `<path d="M8 76 Q75 66 142 76 L142 100 Q75 108 8 100 Z" fill="#D9CCFA" stroke="#9B87D9" stroke-width="3" ${SW}/>` +
      [[26, 88], [52, 84], [78, 92], [104, 84], [128, 90]].map(([x, y]) => `<path d="${star5(x, y, 4, 1.8)}" fill="#FFF6D8" stroke="#E0B04A" stroke-width="1" ${SW}/>`).join('') +
      `<path d="M10 80 Q75 72 140 80" fill="none" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>`;
  },

  // ---------- 桌椅（110×84，底部貼地） ----------
  f_table_stump() {
    const stump = (cx, top, rx, h) =>
      `<path d="M${cx - rx} ${top} L${cx - rx + 1} ${top + h - 4} Q${cx - rx - 5} ${top + h} ${cx - rx - 6} ${top + h + 1} L${cx + rx + 6} ${top + h + 1} Q${cx + rx + 5} ${top + h} ${cx + rx - 1} ${top + h - 4} L${cx + rx} ${top} Z" fill="#B88355" stroke="#7A4E3A" stroke-width="2.8" ${SW}/>` +
      `<path d="M${cx - rx * .4} ${top + 6} L${cx - rx * .45} ${top + h - 4} M${cx + rx * .35} ${top + 8} L${cx + rx * .4} ${top + h - 6}" stroke="#8E5E3A" stroke-width="1.6" opacity=".6"/>` +
      `<ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${rx * .3}" fill="#F2D3A6" stroke="#7A4E3A" stroke-width="2.8"/>` +
      `<ellipse cx="${cx}" cy="${top}" rx="${rx * .6}" ry="${rx * .18}" fill="none" stroke="#D9AE7A" stroke-width="1.4"/><ellipse cx="${cx}" cy="${top}" rx="${rx * .28}" ry="${rx * .08}" fill="none" stroke="#D9AE7A" stroke-width="1.2"/>`;
    return `<ellipse cx="55" cy="82" rx="54" ry="3" fill="#8A6A5E" opacity=".18"/>` +
      stump(14, 58, 11, 22) + stump(96, 58, 11, 22) + stump(55, 38, 27, 42) +
      `<path d="M36 64 q4 -6 8 0 q-4 6 -8 0Z" fill="#7DD39A" stroke="#4FA06A" stroke-width="1.2"/>` +
      // 蜂蜜茶杯
      `<path d="M58 22 L72 22 L70 34 Q65 37 60 34 Z" fill="#FFF8EE" stroke="#D6A985" stroke-width="2.2" ${SW}/><path d="M72 25 Q77 27 71 31" fill="none" stroke="#D6A985" stroke-width="2"/>` +
      `<ellipse cx="65" cy="23" rx="6.5" ry="1.8" fill="#FFC94D"/>` + heartAt(65, 29, 2.4, '#FF9EB5', '#E0668A', 1) +
      `<path d="M62 18 Q60 14 62 11 M67 18 Q65 14 67 11" fill="none" stroke="#E9D3BE" stroke-width="1.6" stroke-linecap="round"/>`;
  },
  f_table_picnic() {
    const gh = uid('gh');
    return `<defs>${gingham(gh)}</defs><ellipse cx="55" cy="82" rx="54" ry="3" fill="#8A6A5E" opacity=".18"/>` +
      `<path d="M24 40 L14 82 M36 40 L44 82 M86 40 L96 82 M74 40 L66 82" stroke="#9B6B47" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="2" y="58" width="106" height="7" rx="3" fill="#D9A877" stroke="#9B6B47" stroke-width="2.4"/>` +
      `<rect x="8" y="30" width="94" height="10" rx="3" fill="#D9A877" stroke="#9B6B47" stroke-width="2.4"/>` +
      `<path d="M8 30 H102 L106 44 L96 40 L86 47 L76 40 L66 47 L55 40 L44 47 L34 40 L24 47 L14 40 L4 44 Z" fill="url(#${gh})" stroke="#E57A9A" stroke-width="2" ${SW}/>` +
      // 野餐籃
      `<path d="M28 18 Q40 2 52 18" fill="none" stroke="#B88355" stroke-width="3"/>` +
      `<circle cx="34" cy="17" r="5" fill="#FF8FB0" stroke="#D9557E" stroke-width="1.6"/><circle cx="44" cy="15" r="5" fill="#7DD39A" stroke="#4FA06A" stroke-width="1.6"/>` +
      `<path d="M24 18 H56 L52 32 H28 Z" fill="#E9B87F" stroke="#9B6B47" stroke-width="2.2" ${SW}/><path d="M30 22 H50 M31 27 H49" stroke="#B88355" stroke-width="1.4"/>` +
      // 蜂蜜罐
      `<rect x="68" y="16" width="16" height="15" rx="4" fill="#FFC94D" stroke="#D99A2B" stroke-width="2"/><path d="M66 16 Q76 9 86 16 Z" fill="#FFB0C4" stroke="#E0668A" stroke-width="1.6"/>` +
      `<circle cx="73" cy="23" r="1" fill="${INK}"/><circle cx="79" cy="23" r="1" fill="${INK}"/>`;
  },
  f_table_round() {
    const gd = uid('gd');
    return `<defs>${goldGrad(gd)}</defs><ellipse cx="55" cy="82" rx="52" ry="3" fill="#8A6A5E" opacity=".18"/>` +
      // 愛心椅背小椅子（在桌子後面）
      `<path d="M92 82 L92 58 M106 82 L106 58" stroke="#D9AE55" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="${heartPath(99, 34, 11)}" fill="#FFE4EB" stroke="#E0668A" stroke-width="2.6" ${SW}/><path d="M99 44 L99 58" stroke="#D9AE55" stroke-width="3"/>` +
      `<rect x="86" y="54" width="24" height="6" rx="3" fill="#FFB0C4" stroke="#E0668A" stroke-width="2"/>` +
      // 圓桌
      `<path d="M50 58 L50 78" stroke="url(#${gd})" stroke-width="6"/><ellipse cx="50" cy="80" rx="15" ry="3.5" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.6"/>` +
      `<path d="M14 40 Q14 58 22 60 Q28 54 34 60 Q40 54 46 60 Q52 54 58 60 Q64 54 70 60 Q76 54 82 60 Q86 58 86 40 Z" fill="#FFFFFF" stroke="#E8B7C6" stroke-width="2.2" ${SW}/>` +
      `<ellipse cx="50" cy="40" rx="36" ry="8" fill="#FFF8F3" stroke="url(#${gd})" stroke-width="3"/>` +
      // 點心架
      `<path d="M30 38 L30 8" stroke="url(#${gd})" stroke-width="2"/><ellipse cx="30" cy="36" rx="12" ry="3" fill="#fff" stroke="#E8B7C6" stroke-width="1.6"/><ellipse cx="30" cy="22" rx="9" ry="2.4" fill="#fff" stroke="#E8B7C6" stroke-width="1.6"/>` +
      `<ellipse cx="25" cy="32" rx="4" ry="3" fill="#FFB0C4"/><ellipse cx="34" cy="32" rx="4" ry="3" fill="#A8E6B8"/><ellipse cx="30" cy="18.5" rx="3.6" ry="2.8" fill="#BBA8F2"/><circle cx="30" cy="7" r="2" fill="url(#${gd})"/>` +
      // 茶壺＋茶杯
      `<path d="M58 36 Q55 22 66 21 Q77 22 74 36 Z" fill="#E4F2FC" stroke="#8CB7D1" stroke-width="2.2" ${SW}/><path d="M74 28 Q82 24 84 18" fill="none" stroke="#8CB7D1" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="M57 25 Q50 26 56 33" fill="none" stroke="#8CB7D1" stroke-width="2.2"/><circle cx="66" cy="19" r="2.4" fill="url(#${gd})"/>` + heartAt(66, 29, 2.6, '#FF9EB5', '#E0668A', 1) +
      `<path d="M42 38 L42 33 L49 33 L48.5 38 Z" fill="#fff" stroke="#E8B7C6" stroke-width="1.4"/>`;
  },

  // ---------- 地毯（220×70） ----------
  f_rug_round() {
    const rings = [[104, 31, '#FFB0C4'], [88, 26, '#FFF3E0'], [72, 21, '#A8E6B8'], [56, 16, '#FFE08A'], [40, 11.5, '#FFB0C4'], [24, 7, '#FFF3E0']];
    return `<ellipse cx="110" cy="39" rx="106" ry="31" fill="#8A6A5E" opacity=".12"/>` +
      rings.map(([rx, ry, c]) => `<ellipse cx="110" cy="35" rx="${rx}" ry="${ry}" fill="${c}" stroke="${deep(c, .25)}" stroke-width="2.2" stroke-dasharray="5 3"/>`).join('');
  },
  f_rug_heart() {
    let hearts = [[60, 34], [160, 34], [110, 20], [86, 46], [134, 46]].map(([x, y]) => `<path d="${heartPath(x, y, 5)}" fill="#fff" opacity=".8"/>`).join('');
    return `<g transform="translate(0 2) scale(1 .5)"><path d="${heartPath(110, 70, 88)}" fill="#8A6A5E" opacity=".12" transform="translate(0 8)"/>` +
      `<path d="${heartPath(110, 66, 86)}" fill="#FFB0C4" stroke="#E0668A" stroke-width="5" ${SW}/>` +
      `<path d="${heartPath(110, 66, 70)}" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 7"/></g>` + hearts;
  },
  f_rug_quilt() {
    const cp = uid('cp');
    const shape = `M34 6 H186 Q194 6 197 12 L214 58 Q216 66 206 66 H14 Q4 66 6 58 L23 12 Q26 6 34 6 Z`;
    let lines = '', dots = '';
    for (let k = -80; k <= 260; k += 22) lines += `M${k} 0 L${k + 70} 70 M${k + 70} 0 L${k} 70 `;
    for (let y = 6; y <= 66; y += 22) for (let x = -80 + 35; x <= 260; x += 22) { const xx = x + (y === 28 ? 11 : 0); if (xx > 0 && xx < 220) dots += `<circle cx="${xx}" cy="${y + 11}" r="1.4" fill="#D9AE55"/>`; }
    let tassels = '';
    for (let y = 18; y <= 56; y += 7) tassels += `<path d="M${22 - (y - 12) * .37} ${y} l-6 0 M${198 + (y - 12) * .37} ${y} l6 0" stroke="#E8C26A" stroke-width="2" stroke-linecap="round"/>`;
    return `<defs><clipPath id="${cp}"><path d="${shape}"/></clipPath></defs><ellipse cx="110" cy="64" rx="106" ry="5" fill="#8A6A5E" opacity=".12"/>` + tassels +
      `<path d="${shape}" fill="#FFF3E4"/><g clip-path="url(#${cp})"><path d="${lines}" stroke="#F0C9A8" stroke-width="1.4"/>${dots}</g>` +
      `<path d="${shape}" fill="none" stroke="#D9AE55" stroke-width="3"/><path d="M38 12 H182 L196 60 H24 Z" fill="none" stroke="#FFB0C4" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  },

  // ---------- 植物（52×92，底部貼地） ----------
  f_plant_pot() {
    const leaf = (x, y, rx, ry, rot) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#8FD9A6" stroke="#4FA06A" stroke-width="2.4" transform="rotate(${rot} ${x} ${y})"/>` +
      `<path d="M${x} ${y - ry * .7} L${x} ${y + ry * .7}" stroke="#4FA06A" stroke-width="1.2" opacity=".6" transform="rotate(${rot} ${x} ${y})"/>`;
    return `<ellipse cx="26" cy="90" rx="18" ry="2.4" fill="#8A6A5E" opacity=".2"/>` +
      `<path d="M26 60 L22 30 M26 60 L34 26 M26 60 L14 42 M26 60 L40 44 M26 60 L26 16" stroke="#4FA06A" stroke-width="2"/>` +
      leaf(22, 28, 8, 11, -20) + leaf(35, 24, 8, 11, 25) + leaf(13, 42, 7, 10, -55) + leaf(41, 43, 7, 10, 55) + leaf(26, 14, 7.5, 10, 0) +
      `<path d="M10 62 H42 L38 87 Q26 91 14 87 Z" fill="#F3A47E" stroke="#C9734E" stroke-width="2.8" ${SW}/>` +
      `<rect x="7" y="56" width="38" height="9" rx="3.5" fill="#F7B896" stroke="#C9734E" stroke-width="2.8"/>` +
      `<circle cx="20.5" cy="74" r="1.6" fill="${INK}"/><circle cx="31.5" cy="74" r="1.6" fill="${INK}"/><ellipse cx="17" cy="78" rx="2.6" ry="1.6" fill="#FF6F92" opacity=".45"/><ellipse cx="35" cy="78" rx="2.6" ry="1.6" fill="#FF6F92" opacity=".45"/>` +
      `<path d="M24 77 Q26 79 28 77" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>` + shine(13, 66, 2, 4, 10, .5);
  },
  f_plant_sunflower() {
    let petals = '';
    for (let i = 0; i < 12; i++) { const a = i * 30; petals += `<ellipse cx="26" cy="11" rx="4.2" ry="8" fill="#FFD36E" stroke="#D99A2B" stroke-width="1.6" transform="rotate(${a} 26 22)"/>`; }
    return `<ellipse cx="26" cy="90" rx="17" ry="2.4" fill="#8A6A5E" opacity=".2"/>` +
      `<path d="M26 66 Q24 48 26 30" stroke="#4FA06A" stroke-width="3.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M25 52 Q12 44 8 50 Q14 58 25 52 Z M27 44 Q40 36 44 42 Q38 50 27 44 Z" fill="#8FD9A6" stroke="#4FA06A" stroke-width="2" ${SW}/>` +
      petals + `<circle cx="26" cy="22" r="9.5" fill="#E8A65E" stroke="#B5703F" stroke-width="2.2"/>` +
      `<circle cx="22.6" cy="21" r="1.4" fill="${INK}"/><circle cx="29.4" cy="21" r="1.4" fill="${INK}"/><path d="M24 24.6 Q26 26.4 28 24.6" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>` +
      `<ellipse cx="20" cy="24.5" rx="2" ry="1.2" fill="#FF6F92" opacity=".5"/><ellipse cx="32" cy="24.5" rx="2" ry="1.2" fill="#FF6F92" opacity=".5"/>` +
      `<path d="M12 68 H40 L37 87 Q26 91 15 87 Z" fill="#9CC8E6" stroke="#5E9CC4" stroke-width="2.8" ${SW}/>` +
      `<rect x="9" y="62" width="34" height="8" rx="3.5" fill="#B9DBF1" stroke="#5E9CC4" stroke-width="2.8"/>` +
      `<path d="${heartPath(26, 78, 4)}" fill="#fff" opacity=".85"/>`;
  },
};

function curtain(kind) {
  const gh = uid('gh'), gd = uid('gd');
  const W = 138;
  const lace = kind === 'lace';
  const fill = lace ? '#FFFFFF' : `url(#${gh})`, line = lace ? '#C9B8EE' : '#E57A9A';
  const left = `M4 12 H44 C40 42 30 68 25 86 C31 102 39 116 42 127 H4 Z`;
  // 右片＝左片左右鏡像
  const right = `M134 12 H94 C98 42 108 68 113 86 C107 102 99 116 96 127 H134 Z`;
  let val = `M4 10 H134 V24`;
  for (let i = 0; i < 9; i++) { const x0 = 134 - i * 14.44, x1 = x0 - 14.44; val += ` Q${(x0 + x1) / 2} 36 ${x1} 24`; }
  val += ' Z';
  let lacedots = '';
  if (lace) {
    for (let y = 20; y < 124; y += 9) for (let x = 8; x < 40; x += 9) lacedots += `<circle cx="${x + (y / 9 % 2) * 4}" cy="${y}" r="1.3" fill="#D9CCFA"/>`;
  }
  const scallopEdge = (x0, x1, y) => { let d = `M${x0} ${y}`; const n = 8, step = (x1 - x0) / n; for (let i = 0; i < n; i++) d += ` q${step / 2} 6 ${step} 0`; return d; };
  const tie = (x, y) => lace
    ? `<path d="M${x - 14} ${y} Q${x} ${y + 6} ${x + 14} ${y}" fill="none" stroke="#BBA8F2" stroke-width="4" stroke-linecap="round"/>` + [-10, -5, 0, 5, 10].map(d => `<circle cx="${x + d}" cy="${y + 2.6 - Math.abs(d) * .1}" r="2" fill="#fff" stroke="#C9B8EE" stroke-width="1"/>`).join('')
    : `<path d="M${x - 14} ${y} Q${x} ${y + 6} ${x + 14} ${y}" fill="none" stroke="#E0668A" stroke-width="5" stroke-linecap="round"/>` + bowAt(x, y + 2, '#FF9EB5', '#E0668A', .5);
  return `<defs>${gingham(gh)}${goldGrad(gd)}<clipPath id="${gh}c"><path d="${left}"/><path d="${right}"/></clipPath></defs>` +
    `<path d="${left}" fill="${fill}" stroke="${line}" stroke-width="2.4" ${SW} opacity="${lace ? .9 : 1}"/>` +
    `<path d="${right}" fill="${fill}" stroke="${line}" stroke-width="2.4" ${SW} opacity="${lace ? .9 : 1}"/>` +
    (lace ? `<g clip-path="url(#${gh}c)"><g>${lacedots}</g><g transform="translate(${W} 0) scale(-1 1)">${lacedots}</g></g>` +
      `<path d="${scallopEdge(4, 42, 127)}" fill="none" stroke="#C9B8EE" stroke-width="2"/><path d="${scallopEdge(96, 134, 127)}" fill="none" stroke="#C9B8EE" stroke-width="2"/>` : '') +
    `<path d="M14 20 Q16 60 13 120 M26 20 Q28 50 24 84 M124 20 Q122 60 125 120 M112 20 Q110 50 114 84" fill="none" stroke="${line}" stroke-width="1.6" opacity=".35"/>` +
    tie(25, 86) + tie(113, 86) +
    `<path d="${val}" fill="${lace ? '#FFFFFF' : `url(#${gh})`}" stroke="${line}" stroke-width="2.4" ${SW}/>` +
    (lace ? Array.from({ length: 9 }, (_, i) => `<circle cx="${134 - i * 14.44 - 7.22}" cy="29" r="2.2" fill="#D9CCFA"/>`).join('') : `<path d="M4 16 H134" stroke="#fff" stroke-width="1.6" opacity=".8"/>`) +
    `<rect x="2" y="5" width="134" height="5" rx="2.5" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>` +
    `<circle cx="4" cy="7.5" r="4.4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/><circle cx="134" cy="7.5" r="4.4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>`;
}

export function furnitureSVG(furnitureId) {
  const it = FURNITURE.find(f => f.id === furnitureId);
  const sl = slotOf(it ? it.slot : 'rug');
  const f = FURN[furnitureId];
  const inner = f ? f() : `<rect width="${sl.w}" height="${sl.h}" rx="12" fill="#F3D9C4"/>`;
  return svg(inner, `0 0 ${sl.w} ${sl.h}`);
}

// =====================================================================
// 樹洞小屋背景（viewBox 0 0 360 480）
// tod：'morning' | 'day'（預設）| 'dusk' | 'night'，窗外天空與窗光跟著變
// =====================================================================
const HOUSE_TOD = {
  morning: { sky: ['#BCE4FF', '#FFF0CF'], leaf: ['#A6DDAE', '#D0F0D2'], branch: '#A8774F', beam: ['#FFF3C2', .78], beamFar: 150, mote: '#FFF2B0' },
  day:     { sky: ['#CDEBFA', '#E9F8EE'], leaf: ['#9FD9A9', '#C2EBC8'], branch: '#A8774F', beam: ['#FFFBEA', .55], beamFar: 150, mote: '#FFF6C8' },
  dusk:    { sky: ['#FF9C8A', '#FFD9A6'], leaf: ['#D7A98A', '#EBC6A4'], branch: '#9A6650', beam: ['#FFB27E', .5], beamFar: 205, mote: '#FFD2B0' },
  night:   { sky: ['#252C70', '#4D4596'], leaf: ['#405C82', '#5A77A0'], branch: '#4A3C5C', beam: ['#C4D6FF', .34], beamFar: 150, mote: '#E2EAFF' },
};

/** 窗外的太陽／夕陽／月亮（畫在窗戶裁切區內，在樹葉後面） */
function windowOrb(tod, wx, wy) {
  if (tod === 'morning') {
    const g = uid('wo');
    return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".6" stop-color="#FFE38A" stop-opacity=".7"/><stop offset="1" stop-color="#FFE38A" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="${wx + 70}" cy="${wy + 66}" r="44" fill="url(#${g})"/>` +
      `<circle cx="${wx + 70}" cy="${wy + 66}" r="21" fill="#FFE17A" stroke="#F5B942" stroke-width="2.4"/>` +
      `<path d="M${wx + 62} ${wy + 66} q4 -4 8 0 M${wx + 72} ${wy + 66} q4 -4 8 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="${wx + 59}" cy="${wy + 72}" rx="3.4" ry="2" fill="#FF8FA3" opacity=".5"/><ellipse cx="${wx + 81}" cy="${wy + 72}" rx="3.4" ry="2" fill="#FF8FA3" opacity=".5"/>`;
  }
  if (tod === 'day') {
    return `<circle cx="${wx + 80}" cy="${wy + 28}" r="16" fill="#FFF6C8" opacity=".9"/>` +
      `<path d="M${wx + 36} ${wy + 40} q6 -10 16 -4 q8 -8 16 2 q8 0 6 8 h-34 q-8 0 -4 -6 Z" fill="#fff" opacity=".95"/>`;
  }
  if (tod === 'dusk') {
    const g = uid('wo');
    return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#FFE0A0"/><stop offset=".55" stop-color="#FFB070" stop-opacity=".7"/><stop offset="1" stop-color="#FF9A7A" stop-opacity="0"/></radialGradient></defs>` +
      `<circle cx="${wx + 62}" cy="${wy + 86}" r="46" fill="url(#${g})"/>` +
      `<circle cx="${wx + 62}" cy="${wy + 86}" r="20" fill="#FFA45E" stroke="#E9774A" stroke-width="2.4"/>` +
      `<path d="M${wx + 4} ${wy + 40} h40 M${wx + 56} ${wy + 30} h46 M${wx + 20} ${wy + 54} h34" stroke="#FFC4CF" stroke-width="5" stroke-linecap="round" opacity=".85"/>` +
      `<path d="M${wx + 74} ${wy + 46} q3 -4 6 0 q3 -4 6 0" stroke="#8E5A6A" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  }
  // night：彎月＋星星
  let stars = '';
  [[12, 14, 1.6], [34, 30, 1.2], [56, 10, 1.4], [96, 52, 1.2], [20, 46, 1], [70, 44, 1.1], [88, 14, 1]].forEach(([x, y, r], i) => {
    stars += i % 2 ? `<circle cx="${wx + x}" cy="${wy + y}" r="${r}" fill="#FFF6D0"/>` : `<path d="${sparkle(wx + x, wy + y, r * 3)}" fill="#FFF6D0"/>`;
  });
  return `<circle cx="${wx + 76}" cy="${wy + 30}" r="26" fill="#FFF3C4" opacity=".14"/>` +
    `<path d="M${wx + 80} ${wy + 14} A17 17 0 1 0 ${wx + 92} ${wy + 42} A13 13 0 1 1 ${wx + 80} ${wy + 14} Z" fill="#FFE59A" stroke="#E9B95A" stroke-width="2"/>` +
    `<path d="M${wx + 66} ${wy + 30} q3 3 6 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>` + stars;
}

export function houseBgSVG(opts = {}) {
  const tod = HOUSE_TOD[opts && opts.tod] ? opts.tod : 'day';
  const T = HOUSE_TOD[tod];
  const gw = uid('hw'), gf = uid('hf'), gb = uid('hb'), gs = uid('hs'), gl = uid('hl'), gm = uid('hm'), gd = uid('gd'), cpW = uid('cw'), cpR = uid('cr'), gq = uid('hq');
  const room = `M10 480 V112 Q10 6 180 4 Q350 6 350 112 V480 Z`;
  const { x: wx, y: wy, w: ww, h: wh } = WINDOW;
  const winPath = `M${wx} ${wy + wh} V${wy + 34} Q${wx} ${wy} ${wx + ww / 2} ${wy} Q${wx + ww} ${wy} ${wx + ww} ${wy + 34} V${wy + wh} Z`;
  const V = VANITY, S = VANITY_SHELF;
  // 年輪
  let rings = '';
  for (let i = 1; i <= 9; i++) rings += `<ellipse cx="180" cy="320" rx="${i * 34}" ry="${i * 27}" fill="none" stroke="#E2B47A" stroke-width="${i % 3 ? 1.6 : 2.4}" opacity="${i % 3 ? .3 : .42}"/>`;
  // 地板木條（往中間收的透視）
  let planks = '';
  for (let i = -6; i <= 6; i++) { const x0 = 180 + i * 30, x1 = 180 + i * 52; planks += `<path d="M${x0} 304 L${x1} 480" stroke="#C99560" stroke-width="1.6" opacity=".55"/>`; }
  planks += [360, 410, 452].map((y, i) => `<path d="M10 ${y} H350" stroke="#C99560" stroke-width="1.2" opacity="${.35 - i * .05}"/>`).join('');
  // 樹皮外框紋路
  let bark = '';
  for (let i = 0; i < 14; i++) { const y = 140 + i * 25; bark += `<path d="M3 ${y} q3 8 0 16" stroke="#7A5236" stroke-width="1.6" fill="none" opacity=".6"/><path d="M357 ${y + 10} q-3 8 0 16" stroke="#7A5236" stroke-width="1.6" fill="none" opacity=".6"/>`; }
  // 下半牆的菱格絎縫護牆板
  let quilt = '';
  for (let k = -300; k <= 400; k += 26) quilt += `M${k} 236 L${k + 64} 300 M${k + 64} 236 L${k} 300 `;
  let qdots = '';
  for (let x = 13; x < 360; x += 26) qdots += `<circle cx="${x}" cy="268" r="1.5" fill="#E8C26A"/>`;
  // 窗外
  const outside = `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#${gs})"/>` +
    windowOrb(tod, wx, wy) +
    [[wx + 6, wy + 20, 22], [wx + 28, wy + 4, 20], [wx + 98, wy + 66, 24], [wx + 10, wy + 82, 26], [wx + 60, wy + 98, 22]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.leaf[0]}"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .55}" fill="${T.leaf[1]}"/>`).join('') +
    `<path d="M${wx + 40} ${wy + 110} Q${wx + 46} ${wy + 70} ${wx + 70} ${wy + 54}" stroke="${T.branch}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${wx + 72}" cy="${wy + 50}" rx="9" ry="5" fill="${tod === 'night' ? '#6F8FB8' : tod === 'dusk' ? '#E7B48A' : '#8FD9A6'}" transform="rotate(-30 ${wx + 72} ${wy + 50})"/>`;

  return svg(`<defs>
    <linearGradient id="${gw}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9DFB2"/><stop offset="1" stop-color="#F2CB92"/></linearGradient>
    <linearGradient id="${gf}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9BE8A"/><stop offset="1" stop-color="#E0AE78"/></linearGradient>
    <linearGradient id="${gb}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9B6B47"/><stop offset=".5" stop-color="#B07D55"/><stop offset="1" stop-color="#9B6B47"/></linearGradient>
    <linearGradient id="${gs}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.sky[0]}"/><stop offset="1" stop-color="${T.sky[1]}"/></linearGradient>
    <linearGradient id="${gl}" x1="0" y1="0" x2="-.6" y2="1"><stop offset="0" stop-color="${T.beam[0]}" stop-opacity="${T.beam[1]}"/><stop offset="1" stop-color="${T.beam[0]}" stop-opacity="0"/></linearGradient>
    <linearGradient id="${gm}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3FBFF"/><stop offset="1" stop-color="#D3E9F6"/></linearGradient>
    <linearGradient id="${gq}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFEFF2"/><stop offset="1" stop-color="#FFE2E8"/></linearGradient>
    ${goldGrad(gd)}
    <clipPath id="${cpW}"><path d="${winPath}"/></clipPath>
    <clipPath id="${cpR}"><path d="${room}"/></clipPath>
  </defs>` +
    // 樹皮外框
    `<rect width="360" height="480" fill="url(#${gb})"/>` + bark +
    `<g clip-path="url(#${cpR})">` +
    `<rect width="360" height="304" fill="url(#${gw})"/>` + rings +
    `<rect y="236" width="360" height="66" fill="url(#${gq})"/><path d="${quilt}" stroke="#F7C6D3" stroke-width="1.4"/>${qdots}` +
    `<rect y="232" width="360" height="6" fill="#E8C291"/><rect y="233.5" width="360" height="1.6" fill="#FFF3DC" opacity=".8"/>` +
    // 天花板掛鉤、牆上小釘子
    `<circle cx="180" cy="5" r="4" fill="none" stroke="#B98A64" stroke-width="2.4"/>` +
    `<circle cx="95" cy="74" r="2.6" fill="#B98A64"/><circle cx="94.2" cy="73.2" r=".9" fill="#FFF3DC"/>` +
    // 窗戶
    `<path d="${winPath}" fill="#C08A5A" transform="translate(0 2)" opacity=".35"/>` +
    `<g clip-path="url(#${cpW})">${outside}</g>` +
    `<path d="M${wx + ww / 2} ${wy} V${wy + wh} M${wx} ${wy + 56} H${wx + ww}" stroke="#C08A5A" stroke-width="5"/>` +
    `<path d="${winPath}" fill="none" stroke="#C08A5A" stroke-width="7" ${SW}/><path d="${winPath}" fill="none" stroke="#E2B07D" stroke-width="2.4" ${SW}/>` +
    `<path d="M${wx + 10} ${wy + 46} Q${wx + 14} ${wy + 22} ${wx + 30} ${wy + 14}" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>` +
    `<rect x="${wx - 8}" y="${wy + wh - 2}" width="${ww + 16}" height="9" rx="4" fill="#D9A877" stroke="#9B6B47" stroke-width="2.4"/>` +
    // 踢腳板與地板
    `<rect y="296" width="360" height="10" fill="#C99560"/><rect y="296" width="360" height="2.4" fill="#E9BE8A"/>` +
    `<rect y="306" width="360" height="174" fill="url(#${gf})"/>` + planks +
    // 窗光
    `<path d="M${wx} ${wy + wh} L${wx + ww} ${wy + wh} L${wx + 30} 470 L${wx - T.beamFar} 470 Z" fill="url(#${gl})"/>` +
    [[wx - 20, 260, 2.2], [wx - 52, 330, 1.8], [wx - 10, 360, 2.4], [wx - 90, 420, 1.8], [wx - 40, 400, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${T.mote}" opacity="${tod === 'night' ? .7 : .9}"/>`).join('') +
    // 地板小細節：落葉、木節
    `<path d="M300 452 q8 -10 16 0 q-8 10 -16 0 Z" fill="#F3A47E" opacity=".8" transform="rotate(-20 308 452)"/>` +
    `<ellipse cx="96" cy="452" rx="9" ry="3" fill="none" stroke="#C99560" stroke-width="1.6" opacity=".6"/>` +
    `</g>` +
    // 樹洞拱形內緣
    `<path d="${room}" fill="none" stroke="#7A5236" stroke-width="5"/><path d="${room}" fill="none" stroke="#D6A16E" stroke-width="2" transform="translate(0 1)" opacity=".6"/>` +
    // 樹洞頂的苔蘚＋小蘑菇＋葉子
    `<path d="M70 26 Q90 12 112 14 Q102 22 70 26 Z M250 14 Q272 12 292 26 Q262 22 250 14 Z" fill="#8FD9A6" stroke="#4FA06A" stroke-width="2" ${SW}/>` +
    `<path d="M326 70 Q336 58 346 66 Q336 72 326 70 Z" fill="#FF8FA8" stroke="#D9557E" stroke-width="2" ${SW}/><path d="M336 68 L336 78" stroke="#F2D3A6" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M14 92 q10 -10 18 2 q-10 8 -18 -2 Z" fill="#9FD9A9" stroke="#4FA06A" stroke-width="1.6"/>` +
    // 梳妝台（固定）：上層香水架（VANITY_SHELF，空著）＋中間鏡子＋桌面＋抽屜
    vanity(V, S, gm, gd), '0 0 360 480');
}

// =====================================================================
// 小屋光線層（viewBox 0 0 360 480），由介面疊在家具上、角色下：
//   shade：用 mix-blend-mode:multiply 疊（黃昏偏暖、晚上變暗偏藍；燈、窗邊、角色附近留亮區）
//   glow ：用 mix-blend-mode:screen 疊（燈光暈、晨光、晚霞光、月光、香水微光）
// lamp：目前擺的燈 id（晚上才會亮）。回傳 { shade, glow }，沒有的層為 ''。
// =====================================================================
const LAMP_LIGHT = {
  f_lamp_mushroom: { x: 180, y: 74, r: 128, c: '#FFC46A', core: '#FFE4A0' },
  f_lamp_moon:     { x: 178, y: 58, r: 120, c: '#FFD878', core: '#FFEDB8' },
  f_lamp_string:   { x: 180, y: 56, r: 112, c: '#FFCF8A', core: '#FFE9C0', dots: [[160, 31], [159.5, 59], [162, 89], [180, 27], [180, 53], [180, 79], [199, 35], [200, 59], [198, 81]] },
};

export function houseLightSVG(tod, opts = {}) {
  const lamp = LAMP_LIGHT[opts.lamp] || null;
  const VB = '0 0 360 480';
  const radial = (id, c, o0 = 1, mid = .45, omid = .5) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity="${o0}"/><stop offset="${mid}" stop-color="${c}" stop-opacity="${omid}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const { x: wx, y: wy, w: ww, h: wh } = WINDOW;
  const S = VANITY_SHELF;
  if (tod === 'night') {
    const m = uid('lm'), h = uid('lh'), hs = uid('lhs'), gL = uid('lg'), gW = uid('lw'), gP = uid('lp'), gC = uid('lc');
    // 遮罩：白＝套用暗色，黑＝留亮
    const holes =
      (lamp ? `<circle cx="${lamp.x}" cy="${lamp.y}" r="${lamp.r}" fill="url(#${h})"/><ellipse cx="${lamp.x}" cy="${lamp.y + 150}" rx="${lamp.r * 1.25}" ry="${lamp.r * .9}" fill="url(#${hs})"/>` : '') +
      `<ellipse cx="${wx + ww / 2}" cy="${wy + wh / 2}" rx="${ww * .75}" ry="${wh * .75}" fill="url(#${hs})"/>` +
      `<path d="M${wx} ${wy + wh} L${wx + ww} ${wy + wh} L${wx + 30} 470 L${wx - 150} 470 Z" fill="#000" opacity=".22"/>` +
      `<ellipse cx="180" cy="400" rx="${lamp ? 130 : 105}" ry="${lamp ? 92 : 74}" fill="url(#${hs})"/>` +
      (!lamp ? `<ellipse cx="${S.x + S.w / 2}" cy="${S.y + S.h / 2}" rx="${S.w * .8}" ry="${S.h * 1.4}" fill="url(#${hs})"/>` : '');
    const shade = svg(`<defs>${radial(h, '#000', 1, .5, .8)}${radial(hs, '#000', .7, .5, .35)}` +
      `<mask id="${m}" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="480"><rect width="360" height="480" fill="#fff"/>${holes}</mask></defs>` +
      `<rect width="360" height="480" fill="#7F86CA" mask="url(#${m})"/>`, VB);
    const glow = svg(`<defs>${lamp ? radial(gL, lamp.c, .62, .35, .3) + radial(gC, lamp.core, .85, .5, .45) : ''}${radial(gW, '#9FB8FF', .38)}${radial(gP, '#FFB3C8', .55)}</defs>` +
      (lamp ? `<circle cx="${lamp.x}" cy="${lamp.y}" r="${lamp.r}" fill="url(#${gL})"/><ellipse cx="${lamp.x}" cy="${lamp.y + 165}" rx="${lamp.r * 1.1}" ry="${lamp.r * .55}" fill="url(#${gL})" opacity=".55"/>` +
        (lamp.dots ? lamp.dots.map(([x, y]) => `<circle cx="${x}" cy="${y + 3}" r="15" fill="url(#${gC})"/>`).join('') : `<circle cx="${lamp.x}" cy="${lamp.y}" r="24" fill="url(#${gC})"/>`) : '') +
      `<ellipse cx="${wx + ww / 2}" cy="${wy + wh / 2}" rx="${ww * .9}" ry="${wh * .8}" fill="url(#${gW})"/>` +
      (!lamp ? `<ellipse cx="${S.x + S.w / 2}" cy="${S.y + S.h / 2}" rx="${S.w * .65}" ry="${S.h * 1.1}" fill="url(#${gP})"/>` : ''), VB);
    return { shade, glow };
  }
  if (tod === 'dusk') {
    const g = uid('ld'), g2 = uid('ld');
    const shade = svg(`<rect width="360" height="480" fill="#FFE2CF"/>`, VB);
    const glow = svg(`<defs>${radial(g, '#FF9A6A', .4)}${radial(g2, '#FF8FB0', .26)}</defs>` +
      `<ellipse cx="${wx + ww / 2}" cy="${wy + wh / 2 + 10}" rx="${ww}" ry="${wh}" fill="url(#${g})"/>` +
      `<ellipse cx="${wx - 70}" cy="420" rx="150" ry="70" fill="url(#${g2})"/>`, VB);
    return { shade, glow };
  }
  if (tod === 'morning') {
    const g = uid('lmn');
    const glow = svg(`<defs>${radial(g, '#FFE9A8', .6)}</defs>` +
      `<ellipse cx="${wx + ww / 2}" cy="${wy + wh / 2}" rx="${ww * 1.2}" ry="${wh * 1.1}" fill="url(#${g})"/>` +
      `<ellipse cx="${wx - 50}" cy="420" rx="140" ry="64" fill="url(#${g})" opacity=".7"/>`, VB);
    return { shade: '', glow };
  }
  return { shade: '', glow: '' };
}

function vanity(V, S, gm, gd) {
  const x0 = V.x, x1 = V.x + V.w, cx = V.x + V.w / 2, shelfBottom = S.y + S.h;
  const mirrorTop = shelfBottom + 7, deskTop = 292, bottom = V.y + V.h;
  return `<ellipse cx="${cx}" cy="${bottom + 1}" rx="${V.w / 2 + 2}" ry="4" fill="#8A6A5E" opacity=".22"/>` +
    // 頂飾
    `<path d="M${x0 + 4} ${S.y} Q${cx} ${V.y - 10} ${x1 - 4} ${S.y} Z" fill="#FFF8F3" stroke="#D6A985" stroke-width="3" ${SW}/>` +
    bowAt(cx, V.y + 2, '#FF9EB5', '#E0668A', .55) +
    // 香水架（空的壁龕）
    `<rect x="${x0 + 3}" y="${S.y - 2}" width="${V.w - 6}" height="${S.h + 4}" rx="6" fill="#FFF8F3" stroke="#D6A985" stroke-width="3"/>` +
    `<rect x="${S.x}" y="${S.y + 2}" width="${S.w}" height="${S.h - 2}" rx="4" fill="#FFE4EB"/>` +
    `<path d="M${S.x + 6} ${S.y + 8} Q${cx} ${S.y + 2} ${S.x + S.w - 6} ${S.y + 8}" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>` +
    `<rect x="${x0}" y="${shelfBottom}" width="${V.w}" height="6" rx="3" fill="#F2D3A6" stroke="#B98552" stroke-width="2.4"/>` +
    // 鏡子
    `<rect x="${x0 + 8}" y="${mirrorTop - 3}" width="${V.w - 16}" height="${deskTop - mirrorTop + 1}" rx="5" fill="#FFF8F3" stroke="#D6A985" stroke-width="2.4"/>` +
    `<ellipse cx="${cx}" cy="${(mirrorTop + deskTop) / 2 - 1}" rx="${V.w / 2 - 18}" ry="${(deskTop - mirrorTop) / 2 - 4}" fill="url(#${gm})" stroke="url(#${gd})" stroke-width="3.4"/>` +
    `<path d="M${cx - 22} ${mirrorTop + 20} L${cx - 10} ${mirrorTop + 8} M${cx - 16} ${mirrorTop + 28} L${cx} ${mirrorTop + 12}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>` +
    // 桌面＋抽屜
    `<rect x="${x0 - 3}" y="${deskTop}" width="${V.w + 6}" height="8" rx="4" fill="#F2D3A6" stroke="#B98552" stroke-width="2.4"/>` +
    `<rect x="${x0 + 4}" y="${deskTop + 8}" width="${V.w - 8}" height="${bottom - deskTop - 16}" rx="5" fill="#FFF8F3" stroke="#D6A985" stroke-width="2.6"/>` +
    `<path d="M${cx} ${deskTop + 8} V${bottom - 8}" stroke="#D6A985" stroke-width="2"/>` +
    `<circle cx="${cx - 12}" cy="${deskTop + 19}" r="3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.2"/><circle cx="${cx + 12}" cy="${deskTop + 19}" r="3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.2"/>` +
    `<rect x="${x0 + 8}" y="${bottom - 9}" width="7" height="10" rx="2" fill="#D6A985"/><rect x="${x1 - 15}" y="${bottom - 9}" width="7" height="10" rx="2" fill="#D6A985"/>`;
}

// =====================================================================
// 貼紙（viewBox 0 0 200 200）
// =====================================================================
const CH_BG = {
  1: ['#FFF0DF', '#DDF3E2'], // 晨光森林
  2: ['#FFEAF0', '#FFD6E2'], // 粉色裁縫店
  3: ['#FBE6C8', '#F2CF9E'], // 暖燈樹洞
  4: ['#FFD9C2', '#DDEFFB'], // 夕陽湖畔
};
const friendInfo = id => FRIENDS.find(f => f.id === id);
const MEET_PROPS = { 1: ['salmon', 'straw'], 2: ['bow', 'knitHat'], 3: ['cocoaMug', 'pillow'], 4: ['airBalloon', 'camera'] };

function stickerShell(shape, inner, bg, tilt = 0) {
  const cp = uid('sc'), g = uid('sg');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient><clipPath id="${cp}">${shape}</clipPath></defs>` +
    `<g transform="rotate(${tilt} 100 100)">` +
    `<g transform="translate(3 5)" opacity=".18" fill="#8A5A44">${shape}</g>` +
    `<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round">${shape}</g>` +
    `<g fill="url(#${g})">${shape}</g>` +
    `<g clip-path="url(#${cp})">${inner}</g>` +
    `<g fill="none" stroke="#F0E2D6" stroke-width="1.6">${shape}</g></g>`;
}
const circleShape = `<circle cx="100" cy="100" r="80"/>`;
const squareShape = `<rect x="22" y="22" width="156" height="156" rx="30"/>`;
function scallopShape() {
  let d = '';
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2 - Math.PI / 2, am = (i - .5) / n * Math.PI * 2 - Math.PI / 2;
    const x = 100 + Math.cos(a) * 74, y = 100 + Math.sin(a) * 74;
    const cx = 100 + Math.cos(am) * 90, cy = 100 + Math.sin(am) * 90;
    d += i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `<path d="${d} Z"/>`;
}

// 熊朋友最喜歡的東西
const LIKE_PROPS = {
  snowball: () => `<path d="M30 160 Q60 150 100 160 Q140 170 172 158 L180 200 L20 200 Z" fill="#BFE0F5"/>` +
    `<path d="M40 164 Q50 160 60 164 M120 168 Q130 164 140 168" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
    salmonMini(44, 132, 1.25, -18) + salmonMini(156, 136, 1.2, 200) + salmonMini(150, 64, .95, 12),
  sesame: () => `<rect x="24" y="118" width="20" height="54" rx="9" fill="#FFB0C4" stroke="#E0668A" stroke-width="2.6" transform="rotate(-12 34 145)"/>` +
    `<rect x="42" y="126" width="18" height="48" rx="8" fill="#A8E6B8" stroke="#4FA06A" stroke-width="2.6" transform="rotate(-4 51 150)"/>` +
    `<path d="M28 132 l14 -3 M30 146 l14 -3 M32 160 l14 -3" stroke="#fff" stroke-width="2" opacity=".8"/>` +
    `<rect x="146" y="132" width="26" height="8" rx="2" fill="#F2D3A6" stroke="#B98552" stroke-width="2"/><rect x="149" y="140" width="20" height="22" fill="#BBA8F2" stroke="#7D68C2" stroke-width="2"/><rect x="146" y="162" width="26" height="8" rx="2" fill="#F2D3A6" stroke="#B98552" stroke-width="2"/>` +
    `<path d="M150 70 L170 52 M150 52 L170 70" stroke="#9AA0B5" stroke-width="3.4" stroke-linecap="round"/><circle cx="147" cy="73" r="5" fill="none" stroke="#FF8FB0" stroke-width="3"/><circle cx="173" cy="73" r="5" fill="none" stroke="#FF8FB0" stroke-width="3"/>` +
    bowAt(42, 64, '#FFD36E', '#D99A2B', .8),
  cocoa: () => `<rect x="18" y="150" width="56" height="10" rx="3" fill="#E9B87F" stroke="#9B6B47" stroke-width="2.2"/><rect x="24" y="140" width="50" height="10" rx="3" fill="#D9A877" stroke="#9B6B47" stroke-width="2.2"/>` +
    `<path d="M136 128 L176 128 L172 168 Q156 176 140 168 Z" fill="#FFF8EE" stroke="#C98B62" stroke-width="3" ${SW}/>` +
    `<path d="M176 136 Q188 140 175 156" fill="none" stroke="#C98B62" stroke-width="3.4"/><ellipse cx="156" cy="130" rx="19" ry="4.6" fill="#9B6B47"/>` +
    `<rect x="148" y="124" width="9" height="8" rx="2.5" fill="#FFF" stroke="#E8B7C6" stroke-width="1.4"/><rect x="157" y="122" width="9" height="8" rx="2.5" fill="#FFE4EB" stroke="#E8B7C6" stroke-width="1.4"/>` +
    heartAt(156, 152, 5, '#FF9EB5', '#E0668A', 1.6) +
    `<path d="M150 116 Q146 106 152 98 M162 116 Q158 104 164 94" fill="none" stroke="#E9D3BE" stroke-width="3" stroke-linecap="round"/>`,
  bobo: () => `<path d="M10 176 L50 128 L78 160 L104 134 L150 190 Z" fill="#C9EBD2" opacity=".9"/>` +
    `<g transform="rotate(-10 40 70)"><rect x="18" y="48" width="44" height="40" rx="3" fill="#fff" stroke="#E8D9CC" stroke-width="2"/><rect x="22" y="52" width="36" height="26" fill="#DDEFFB"/><path d="M22 78 L34 62 L44 72 L50 66 L58 78 Z" fill="#8FD9A6"/></g>` +
    `<g transform="rotate(8 160 64)"><rect x="140" y="44" width="40" height="38" rx="3" fill="#fff" stroke="#E8D9CC" stroke-width="2"/><rect x="144" y="48" width="32" height="24" fill="#FFE4EB"/><circle cx="160" cy="60" r="7" fill="#FFD36E"/></g>` +
    `<g transform="translate(148 150) rotate(-8)"><rect x="-22" y="-14" width="44" height="30" rx="7" fill="#BBA8F2" stroke="#7D68C2" stroke-width="2.6"/><circle cx="0" cy="1" r="10" fill="#5A4D78" stroke="#7D68C2" stroke-width="2.6"/><circle cx="-3" cy="-2" r="2.6" fill="#fff"/></g>`,
};

function friendSticker(st) {
  const f = friendInfo(st.friend), ch = f.chapter, bg = CH_BG[ch];
  if (st.kind === 'meet') {
    const inner = `<ellipse cx="100" cy="178" rx="100" ry="30" fill="${bg[1]}" opacity=".9"/>` +
      place(friendSVG(f.id, { expr: 'happy' }), 18, 46, 94, 103) +
      place(bearSVG({ expr: 'happy' }), 98, 54, 80, 95) +
      place(tileSVG(MEET_PROPS[ch][0]), 62, 146, 28, 28) + place(tileSVG(MEET_PROPS[ch][1]), 110, 148, 26, 26) +
      heartAt(100, 44, 9) + sparkleAt(46, 46, 6) + sparkleAt(160, 50, 5, '#FFF6D8', '#E8C26A') +
      `<path d="M28 86 Q22 80 26 74 M174 90 Q180 84 176 78" fill="none" stroke="#E8A0B4" stroke-width="2.4" stroke-linecap="round"/>`;
    return stickerShell(circleShape, inner, bg);
  }
  if (st.kind === 'like') {
    const inner = LIKE_PROPS[f.id]() + place(friendSVG(f.id, { expr: 'happy' }), 46, 34, 108, 119) +
      sparkleAt(36, 40, 6) + sparkleAt(170, 110, 5, '#FFF6D8', '#E8C26A');
    return stickerShell(squareShape, inner, bg, -4);
  }
  // photo：拍立得合照
  const pid = uid('ph');
  const photo = `<defs><clipPath id="${pid}"><rect x="34" y="28" width="132" height="112" rx="3"/></clipPath></defs>` +
    `<rect x="24" y="18" width="152" height="166" rx="6" fill="#FFFFFF" stroke="#EADBCF" stroke-width="2"/>` +
    `<g clip-path="url(#${pid})"><rect x="34" y="28" width="132" height="112" fill="${bg[0]}"/><ellipse cx="100" cy="146" rx="90" ry="26" fill="${bg[1]}"/>` +
    `<circle cx="146" cy="50" r="10" fill="#FFF6C8" opacity=".9"/>` +
    place(friendSVG(f.id, { expr: 'happy' }), 36, 56, 66, 73) +
    place(bearSVG({ expr: 'happy' }), 90, 52, 60, 71) +
    place(dogSVG({ expr: 'happy' }), 128, 98, 44, 37) + `</g>` +
    heartAt(60, 162, 5) + heartAt(78, 166, 3.6, '#FFD36E', '#D99A2B', 1.4) + sparkleAt(140, 162, 5, '#FFF6D8', '#E8C26A') +
    `<path d="M96 166 Q104 158 112 166 Q120 174 128 166" fill="none" stroke="#E8A0B4" stroke-width="2" stroke-linecap="round"/>` +
    `<rect x="80" y="10" width="40" height="14" rx="2" fill="#FFB0C4" opacity=".8" transform="rotate(-6 100 17)"/>`;
  return `<g transform="rotate(4 100 100)"><rect x="27" y="23" width="152" height="166" rx="6" fill="#8A5A44" opacity=".16"/>${photo}</g>`;
}

const BEAR_STICKER = {
  1: () => {
    const gh = uid('gh');
    return `<defs>${gingham(gh)}</defs><ellipse cx="100" cy="176" rx="96" ry="34" fill="url(#${gh})" stroke="#E57A9A" stroke-width="2"/>` +
      place(bearSVG({ expr: 'happy', outfit: { clothes: 'cl_apron', hand: 'hd_honeySpoon' } }), 74, 36, 90, 106) +
      place(dogSVG({ expr: 'lick' }), 40, 100, 72, 61) +
      place(tileSVG('honey'), 126, 128, 32, 32) + place(tileSVG('straw'), 100, 148, 24, 24) + place(tileSVG('blue'), 150, 100, 24, 24) +
      sparkleAt(48, 54, 6) + sparkleAt(156, 46, 5, '#FFF6D8', '#E8C26A');
  },
  2: () => `<path d="M30 40 H170" stroke="#D9AE55" stroke-width="3"/>` +
    [[46, '#FFB0C4'], [72, '#A8E6B8'], [138, '#BBA8F2'], [162, '#FFD36E']].map(([x, c]) => `<path d="M${x} 40 l0 6 M${x - 10} 54 L${x} 46 L${x + 10} 54" fill="none" stroke="#B98A64" stroke-width="1.8"/><path d="M${x - 11} 54 H${x + 11} L${x + 8} 82 H${x - 8} Z" fill="${c}" stroke="${deep(c, .3)}" stroke-width="2" ${SW}/>`).join('') +
    `<ellipse cx="156" cy="130" rx="22" ry="34" fill="#E4F2FC" stroke="#D9AE55" stroke-width="4"/><path d="M146 112 L160 100 M148 124 L166 108" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` +
    place(bearSVG({ expr: 'wink', outfit: { head: 'hat_beret', clothes: 'cl_overalls' } }), 46, 54, 92, 109) +
    place(dogSVG({ expr: 'smug', outfit: { collar: 'col_bowtie' } }), 34, 116, 64, 54) +
    sparkleAt(36, 70, 6) + heartAt(178, 80, 5),
  3: () => `<rect x="118" y="30" width="56" height="50" rx="24" fill="#3E4A78" stroke="#C08A5A" stroke-width="4"/>` +
    `<path d="M150 42 A10 10 0 1 0 160 56 A8 8 0 0 1 150 42 Z" fill="#FFE08A"/>` +
    `<path d="${star5(130, 48, 3.4, 1.5)}" fill="#FFF6D8"/><path d="${star5(140, 66, 2.6, 1.2)}" fill="#FFF6D8"/>` +
    `<path d="M0 150 Q100 130 200 150 L200 200 L0 200 Z" fill="#D9CCFA" stroke="#9B87D9" stroke-width="2.4"/>` +
    [[30, 170], [80, 160], [130, 172], [170, 160]].map(([x, y]) => `<path d="${star5(x, y, 4, 1.8)}" fill="#FFF6D8" stroke="#E0B04A" stroke-width="1" ${SW}/>`).join('') +
    place(bearSVG({ expr: 'squint', outfit: { clothes: 'cl_pajamas' } }), 60, 40, 88, 104) +
    place(dogSVG({ expr: 'happy' }), 32, 112, 68, 58) +
    place(tileSVG('nightLamp'), 148, 116, 34, 34) +
    `<path d="M44 66 h10 l-10 10 h10 M58 52 h7 l-7 7 h7" fill="none" stroke="#9B87D9" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  4: () => {
    const cp = uid('bc');
    let stripes = '';
    for (let i = -4; i <= 4; i++) stripes += `<path d="M${100 + i * 12} 10 Q${100 + i * 22} 58 ${100 + i * 9} 104" fill="none" stroke="${i % 2 ? '#FFFFFF' : '#FF9EB5'}" stroke-width="11"/>`;
    return `<circle cx="40" cy="150" r="22" fill="#fff" opacity=".8"/><circle cx="60" cy="156" r="16" fill="#fff" opacity=".8"/><circle cx="160" cy="70" r="14" fill="#fff" opacity=".7"/>` +
      `<path d="M160 120 q6 -5 12 0 q6 -5 12 0" fill="none" stroke="#9B6B47" stroke-width="2" stroke-linecap="round"/>` +
      `<defs><clipPath id="${cp}"><path d="M100 8 C142 8 150 50 136 76 Q124 98 112 106 H88 Q76 98 64 76 C50 50 58 8 100 8 Z"/></clipPath></defs>` +
      `<g transform="translate(100 4) scale(.84) translate(-100 0)"><g clip-path="url(#${cp})"><rect x="40" y="0" width="120" height="120" fill="#FFE4EB"/>${stripes}</g>` +
      `<path d="M100 8 C142 8 150 50 136 76 Q124 98 112 106 H88 Q76 98 64 76 C50 50 58 8 100 8 Z" fill="none" stroke="#E0668A" stroke-width="3.6"/>` +
      shine(78, 30, 8, 4, -30, .6) + `</g>` +
      `<path d="M90 94 L76 150 M110 94 L124 150" stroke="#B98A64" stroke-width="2"/>` +
      place(bearSVG({ expr: 'happy', outfit: { head: 'hat_strawHat', clothes: 'cl_travelVest', hand: 'hd_camera' } }), 58, 82, 84, 99) +
      place(dogSVG({ expr: 'smug', outfit: { dogHead: 'dog_sunglasses' } }), 116, 118, 54, 46) +
      `<path d="M68 148 H132 L127 180 Q100 187 73 180 Z" fill="#E9B87F" stroke="#9B6B47" stroke-width="3" ${SW}/>` +
      `<path d="M70 158 H130 M72 169 H128" stroke="#B88355" stroke-width="1.8"/><path d="M84 148 V182 M100 148 V184 M116 148 V182" stroke="#B88355" stroke-width="1.4" opacity=".7"/>` +
      sparkleAt(30, 50, 6) + sparkleAt(172, 34, 5, '#FFF6D8', '#E8C26A');
  },
};

export function stickerSVG(stickerId) {
  const st = STICKERS.find(s => s.id === stickerId) || STICKERS[0];
  if (st.kind === 'bear') return svg(stickerShell(scallopShape(), BEAR_STICKER[st.chapter](), CH_BG[st.chapter]), '0 0 200 200');
  return svg(friendSticker(st), '0 0 200 200');
}

export function lockedStickerSVG() {
  const shape = `<rect x="22" y="22" width="156" height="156" rx="30"/>`;
  return svg(`<g transform="translate(3 5)" opacity=".14" fill="#6E6A70">${shape}</g>` +
    `<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="16" stroke-linejoin="round">${shape}</g>` +
    `<g fill="#ECE8EA">${shape}</g>` +
    `<g fill="none" stroke="#D6D0D4" stroke-width="2" stroke-dasharray="6 5"><rect x="32" y="32" width="136" height="136" rx="24"/></g>` +
    // 熊頭剪影
    `<g fill="#D3CDD1"><circle cx="70" cy="70" r="20"/><circle cx="130" cy="70" r="20"/><ellipse cx="100" cy="108" rx="52" ry="44"/></g>` +
    // 問號
    `<path d="M88 96 Q88 80 100 80 Q113 80 113 92 Q113 100 104 105 Q100 108 100 116" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="100" cy="131" r="5.4" fill="#FFFFFF"/>`, '0 0 200 200');
}
