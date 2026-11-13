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
  s += o.back || '';   // 身體後面的東西（小楓的尾巴）
  // 腳
  for (const x of [74, 126]) s += `<ellipse cx="${x}" cy="200" rx="22" ry="13" fill="${limbF}" stroke="${limbL}" stroke-width="${sw}"/>` + pads(x, 204);
  // 身體
  s += `<ellipse cx="100" cy="166" rx="54" ry="42" fill="${o.bodyFill || furFill}" stroke="${o.bodyLine || L}" stroke-width="${sw}"/>`;
  if (o.belly) s += `<ellipse cx="100" cy="177" rx="31" ry="25" fill="${o.belly}"/>`;
  s += o.bodyExtra || '';
  // 手
  s += o.armLeft ?? `<ellipse cx="50" cy="168" rx="14" ry="21" fill="${limbF}" stroke="${limbL}" stroke-width="${sw}" transform="rotate(24 50 168)"/>`;
  s += o.armRight ?? `<ellipse cx="150" cy="168" rx="14" ry="21" fill="${limbF}" stroke="${limbL}" stroke-width="${sw}" transform="rotate(-24 150 168)"/>`;
  s += o.mid || '';
  // 耳朵＋頭
  if (o.ears != null) s += o.ears;   // 自訂耳朵（小楓的尖耳朵）
  else for (const x of [ex, 200 - ex]) s += `<circle cx="${x}" cy="${ey}" r="${er}" fill="${earF}" stroke="${earL}" stroke-width="${sw}"/><circle cx="${x}" cy="${ey}" r="${er * .52}" fill="${o.inner}"/>`;
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
  // 台灣黑熊「黑糖」：黑毛、胸前白色 V 字、圓耳朵、熊熊學校老師（金框圓眼鏡、耳後夾鉛筆、抱著繪本）
  heitang(h) {
    const F = '#3B3236', L = '#211A1D';
    const glasses =
      [76, 124].map(x => `<circle cx="${x}" cy="94" r="14" fill="#FFF3E6" opacity=".88"/>`).join('') +
      `<path d="M62 90 L45 82 M138 90 L155 82" stroke="#C98F1F" stroke-width="3.4" stroke-linecap="round"/>` +
      [76, 124].map(x => `<circle cx="${x}" cy="94" r="14" fill="none" stroke="#C98F1F" stroke-width="4.6"/><circle cx="${x}" cy="94" r="14" fill="none" stroke="#FFDA7E" stroke-width="1.9"/>`).join('') +
      `<path d="M90 91 Q100 84.5 110 91" fill="none" stroke="#C98F1F" stroke-width="4.2" stroke-linecap="round"/><path d="M90 91 Q100 84.5 110 91" fill="none" stroke="#FFDA7E" stroke-width="1.6" stroke-linecap="round"/>` +
      [76, 124].map(x => `<path d="M${x - 9} 88 Q${x - 7} 83.5 ${x - 2} 82.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>`).join('');
    // 耳後夾的小鉛筆
    const pencil = `<g transform="translate(150 40) rotate(-28)">` +
      `<rect x="-20" y="-4" width="30" height="8" rx="2" fill="#FFD36E" stroke="#C98F1F" stroke-width="2"/>` +
      `<path d="M-14 -4 V4 M-8 -4 V4" stroke="#E9B23C" stroke-width="1.2"/>` +
      `<rect x="-26" y="-4" width="7" height="8" rx="2.4" fill="#FF9EB5" stroke="#E0668A" stroke-width="2"/>` +
      `<path d="M10 -4 L19 0 L10 4 Z" fill="#F7DDB8" stroke="#C98F1F" stroke-width="2" ${SW}/><path d="M16.2 -1.3 L19 0 L16.2 1.3 Z" fill="${INK}"/></g>`;
    // 繪本（封面：小蘋果＋書名線）
    const book = `<g transform="translate(160 177) rotate(-12)">` +
      `<rect x="-17" y="-22" width="36" height="44" rx="4" fill="#FFFDF6" stroke="#C9A77E" stroke-width="2.4"/>` +
      `<path d="M15 -16 V18 M11.5 -16 V18" stroke="#E6D3B8" stroke-width="1"/>` +
      `<rect x="-20" y="-25" width="36" height="44" rx="4" fill="#A8E6B8" stroke="#4FA06A" stroke-width="3"/>` +
      `<rect x="-20" y="-25" width="8" height="44" rx="3" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.4"/>` +
      `<rect x="-8" y="-19" width="20" height="21" rx="4" fill="#FFF8EC"/>` +
      `<path d="M2 -14 Q-6 -16 -6 -8 Q-6 0 2 -1 Q10 0 10 -8 Q10 -16 2 -14 Z" fill="#FF8FA8" stroke="#D9557E" stroke-width="1.8" ${SW}/>` +
      `<path d="M2 -14 Q2 -17 4 -19" fill="none" stroke="#9B6B47" stroke-width="1.6" stroke-linecap="round"/><path d="M4 -16 Q8 -19 9 -15 Q6 -14 4 -16 Z" fill="#7DD39A"/>` +
      dot(-2.5, -10, 1.3, .85) +
      `<path d="M-7 8 H11 M-5 13 H9" stroke="#4FA06A" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
    return bearFriend({
      fur: F, line: L, inner: '#C99595', muzzle: '#E8C59C', muzzleLine: '#B48A60', nose: '#2A1F22', dark: true,
      earR: 21, earX: 52, earY: 46, muzzleRx: 23, muzzleRy: 16,
      // 胸前白色 V 字（台灣黑熊的招牌）
      bodyExtra: `<path d="M60 143 Q82 165 100 191 Q118 165 140 143 Q129 137 122 145 Q111 160 100 174 Q89 160 78 145 Q71 137 60 143 Z" fill="#FFF7EA" stroke="#E2D2BC" stroke-width="2.2" ${SW}/>` +
        `<path d="M70 146 Q84 160 96 176" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`,
      headExtra: glasses + pencil,
      front: book + `<circle cx="146" cy="190" r="10" fill="${F}" stroke="${L}" stroke-width="4"/>` + shine(143, 186, 3, 1.6, -30, .3),
    }, h);
  },
  // 小熊貓「小楓」：橘紅毛、白色臉部花紋與淚痕、尖耳朵、蓬蓬條紋尾巴；遊樂園樂隊指揮（樂隊帽＋制服＋指揮棒）
  maple(h) {
    const F = '#F59A62', L = '#B85F36', DK = '#5E3D36', DKL = '#3B2522', J = '#A9B8F4', JL = '#6E7DC6';
    const gd = uid('gd'), cp = uid('mj'), cp2 = uid('mj');
    // 尾巴：粗筆畫＋虛線做出一圈一圈的條紋
    const tail = 'M68 192 Q26 200 22 160 Q19 128 42 112';
    const back = `<path d="${tail}" fill="none" stroke="${L}" stroke-width="37" stroke-linecap="round"/>` +
      `<path d="${tail}" fill="none" stroke="${F}" stroke-width="30" stroke-linecap="round"/>` +
      `<path d="${tail}" fill="none" stroke="#FFDDBB" stroke-width="30" stroke-dasharray="9 13" stroke-dashoffset="-14"/>` +
      `<path d="M30 168 Q26 140 40 124" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".45"/>` +
      `<path d="M42 112 m-10 -4 q4 -6 10 -4 q6 -4 9 2" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`;
    // 尖耳朵：外圈白毛、裡面深紅棕（右耳＝左耳鏡像）
    const earL = `<path d="M33 70 Q26 32 47 19 Q66 14 80 42 Z" fill="#FFFFFF" stroke="${L}" stroke-width="5" ${SW}/>` +
      `<path d="M42 62 Q38 38 50 29 Q62 27 71 44 Z" fill="#8A4A38"/>`;
    const ears = earL + `<g transform="translate(200 0) scale(-1 1)">${earL}</g>`;
    // 臉部花紋：白眉毛點、白臉頰、深色淚痕
    const faceMarks =
      `<ellipse cx="74" cy="71" rx="9.5" ry="6.5" fill="#fff" transform="rotate(-12 74 71)"/><ellipse cx="126" cy="71" rx="9.5" ry="6.5" fill="#fff" transform="rotate(12 126 71)"/>` +
      `<path d="M34 104 Q38 90 55 92 Q68 95 70 110 Q69 130 55 136 Q40 134 34 120 Z" fill="#fff"/>` +
      `<path d="M166 104 Q162 90 145 92 Q132 95 130 110 Q131 130 145 136 Q160 134 166 120 Z" fill="#fff"/>` +
      `<path d="M78 104 Q76 117 75 130 M122 104 Q124 117 125 130" fill="none" stroke="#C25E38" stroke-width="6.5" stroke-linecap="round"/>`;
    // 樂隊帽（高筒帽＋金色帽帶＋星星徽章＋羽毛）
    const hat = `<g transform="rotate(-7 100 44)">` +
      `<path d="M100 16 C90 11 91 2 99 1.5 C107 2 110 10 100 16 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.2" ${SW}/><path d="M98 13 Q95 8 99 4" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>` +
      `<path d="M79 47 L82 16 Q100 10 118 16 L121 47 Q100 53 79 47 Z" fill="${J}" stroke="${JL}" stroke-width="3.4" ${SW}/>` +
      `<path d="M80.2 36 Q100 41 119.8 36 L120.6 45 Q100 50.5 79.4 45 Z" fill="url(#${gd})"/>` +
      `<path d="${star5(100, 27, 7, 3.2)}" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.6" ${SW}/>` +
      shine(87, 24, 2.4, 6, 0, .55) +
      `<path d="M75 47 Q100 59 125 47 Q100 52 75 47 Z" fill="#4E5486" stroke="#363A66" stroke-width="2.4" ${SW}/></g>`;
    // 制服（裁在身體橢圓內）：雙排金扣、金色繩飾、下擺金邊
    const jacket = `<defs>${goldGrad(gd)}<clipPath id="${cp}"><ellipse cx="100" cy="166" rx="54" ry="42"/></clipPath><clipPath id="${cp2}"><rect x="0" y="0" width="200" height="186"/></clipPath></defs>` +
      `<g clip-path="url(#${cp})"><path d="M40 118 H160 V184 Q100 200 40 184 Z" fill="${J}"/>` +
      `<path d="M40 184 Q100 200 160 184" fill="none" stroke="#E2B84E" stroke-width="4.5"/>` +
      `<path d="M100 150 V194" stroke="${JL}" stroke-width="2.2"/>` +
      `<path d="M58 152 Q64 172 60 190 M142 152 Q136 172 140 190" fill="none" stroke="#fff" stroke-width="2.4" opacity=".35" stroke-linecap="round"/></g>` +
      `<g clip-path="url(#${cp2})"><ellipse cx="100" cy="166" rx="54" ry="42" fill="none" stroke="${JL}" stroke-width="5"/></g>` +
      [160, 172, 184].map(y => `<path d="M90 ${y} H110" stroke="#FFE08A" stroke-width="2.6" stroke-linecap="round"/>` +
        `<circle cx="89" cy="${y}" r="3.3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.3"/><circle cx="111" cy="${y}" r="3.3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.3"/>`).join('');
    // 袖子（制服色）＋金色袖口＋肩章；右手高舉
    const sleeve = (cx, cy, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="14" ry="21" fill="${J}" stroke="${JL}" stroke-width="5" transform="rotate(${rot} ${cx} ${cy})"/>`;
    const armLeft = sleeve(50, 168, 24) +
      `<ellipse cx="45" cy="180" rx="11.5" ry="4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.6" transform="rotate(24 45 180)"/>` +
      `<circle cx="42" cy="187" r="9.5" fill="${DK}" stroke="${DKL}" stroke-width="4"/>` +
      `<path d="M47 152 Q58 141 70 151 Z" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.8" ${SW}/><path d="M50 152 V157 M55 151 V157 M60 151 V157 M65 151 V156" stroke="#E2B84E" stroke-width="1.8" stroke-linecap="round"/>`;
    const armRight = sleeve(154, 140, 38) +
      `<ellipse cx="162" cy="129" rx="11.5" ry="4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.6" transform="rotate(38 162 129)"/>` +
      `<path d="M130 151 Q140 140 153 147 Z" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.8" ${SW}/><path d="M134 150 V155 M139 148 V154 M144 147 V153 M149 147 V152" stroke="#E2B84E" stroke-width="1.8" stroke-linecap="round"/>`;
    // 指揮棒＋右手掌（畫在最前面）
    const baton = `<path d="M166 124 L189 84" stroke="#C98F1F" stroke-width="5.6" stroke-linecap="round"/><path d="M166 124 L189 84" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>` +
      `<circle cx="167" cy="122" r="4.6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>` +
      `<circle cx="166" cy="124" r="9.5" fill="${DK}" stroke="${DKL}" stroke-width="4"/>` +
      sparkleAt(190, 80, h ? 7 : 5, '#FFF6D8', '#E8C26A');
    const notes = noteAt(30, 76, 1, '#BBA8F2', '#7D68C2') + (h ? noteAt(176, 44, .8, '#FF9EB5', '#E0668A') + noteAt(16, 108, .7, '#8CCBEA', '#4F95C2') : '');
    return bearFriend({
      fur: F, line: L, limbFill: DK, limbLine: DKL, bodyFill: DK, bodyLine: DKL,
      muzzle: '#FFFFFF', muzzleLine: '#EBCFC0', nose: '#3A2622', muzzleRx: 22, muzzleRy: 15,
      back, ears, bodyExtra: jacket, armLeft, armRight, headExtra: faceMarks + hat,
      front: baton + notes,
    }, h);
  },
};

/** 小音符（中心約在符頭） */
function noteAt(x, y, s = 1, fill = '#BBA8F2', line = '#7D68C2') {
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M5 2 V-20 Q12 -16 15 -10" fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="3" rx="6.4" ry="5" fill="${fill}" stroke="${line}" stroke-width="2.4" transform="rotate(-20 0 3)"/>` +
    dot(-2, 1.4, 1.4, .9) + `</g>`;
}

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
  // 蠟筆彩虹香：彩虹拱門瓶（瓶裡有彩虹紋、兩腳踩著小雲朵）＋蠟筆瓶蓋＋蠟筆塗鴉
  p6(c) {
    const g = uid('pg'), cp = uid('pc'), D = deep(c, .35);
    const arch = `M24 110 Q18 110 18 104 L18 80 A32 32 0 0 1 82 80 L82 104 Q82 110 76 110 Z`;
    const bands = ['#FF9EB5', '#FFC48A', '#FFE27A', c, '#8CCBEA', '#C9A7F5'];
    const cloud = (x, flip) => `<g transform="translate(${x} 104) scale(${flip} 1)"><path d="M-12 8 Q-18 8 -17 2 Q-16 -4 -10 -3 Q-8 -10 0 -9 Q6 -12 10 -5 Q17 -5 16 2 Q16 8 10 8 Z" fill="#FFFFFF" stroke="#A9CFE6" stroke-width="2.4" ${SW}/>` +
      `<path d="M-9 -1 Q-6 -5 -1 -5" fill="none" stroke="#DDEFFB" stroke-width="2" stroke-linecap="round"/></g>`;
    return `<defs>${glassGrad(g, c)}<clipPath id="${cp}"><path d="${arch}"/></clipPath></defs>` + bottleShadow +
      `<path d="${arch}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})">` + bands.map((b, i) => `<path d="M${50 - 28 + i * 4.4} 96 A${28 - i * 4.4} ${28 - i * 4.4} 0 0 1 ${50 + 28 - i * 4.4} 96" fill="none" stroke="${b}" stroke-width="4.6" opacity=".72"/>`).join('') +
      `<path d="M0 96 Q25 90 50 96 Q75 102 100 96 L100 120 L0 120 Z" fill="${c}" opacity=".62"/></g>` +
      `<path d="${arch}" fill="none" stroke="${D}" stroke-width="4.4" ${SW}/>` +
      cloud(24, 1) + cloud(76, -1) +
      `<rect x="43" y="40" width="14" height="11" rx="3" fill="${light(c, .7)}" stroke="${D}" stroke-width="3"/>` +
      // 蠟筆瓶蓋：尖尖的筆頭＋鋸齒紙套
      `<path d="M41.5 25 L47 10 Q50 5.5 53 10 L58.5 25 Z" fill="${c}" stroke="${D}" stroke-width="2.8" ${SW}/>` +
      `<path d="M44.6 17 Q50 19.5 55.4 17" fill="none" stroke="${D}" stroke-width="1.6" opacity=".55"/>` +
      `<rect x="40" y="23" width="20" height="19" rx="3" fill="${c}" stroke="${D}" stroke-width="3"/>` +
      `<path d="M40.5 27 L43 25 L45.5 27 L48 25 L50.5 27 L53 25 L55.5 27 L58 25 L59.5 26.5 L59.5 38.5 L57 40.5 L54.5 38.5 L52 40.5 L49.5 38.5 L47 40.5 L44.5 38.5 L42 40.5 L40.5 38.5 Z" fill="#FFFDF6" stroke="${D}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M43 33 Q46 30 49 33 T55 33" fill="none" stroke="#FF9EB5" stroke-width="2" stroke-linecap="round"/>` +
      shine(46, 15, 1.4, 3, 20, .8) +
      // 蠟筆塗鴉
      `<path d="M8 46 L13 40 L16 46 L21 40 L24 46" fill="none" stroke="#FF9EB5" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M76 28 Q82 22 86 28 Q90 34 94 28" fill="none" stroke="#8CCBEA" stroke-width="2.6" stroke-linecap="round"/>` +
      `<path d="${star5(86, 46, 5, 2.3)}" fill="#FFE27A" stroke="#D9AE55" stroke-width="1.4" ${SW}/>` +
      `<path d="M27 82 Q28 66 38 58" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".85"/>` + dot(26, 90, 2, .85);
  },
  // 棉花糖樂園香：旋轉木馬瓶（條紋頂篷瓶蓋＋金色扭紋柱瓶頸＋圓筒瓶身裡的小木馬）＋棉花糖噴頭
  p7(c) {
    const g = uid('pg'), gd = uid('pd'), cp = uid('pc'), cc = uid('pc'), D = deep(c, .35);
    const body = `M20 66 A30 11 0 0 1 80 66 L80 98 A30 11 0 0 1 20 98 Z`;
    let canopy = `M50 12 L83 38`;
    for (let i = 0; i < 5; i++) { const x0 = 83 - i * 13.2, x1 = x0 - 13.2; canopy += ` Q${(x0 + x1) / 2} 47 ${x1} 38`; }
    canopy += ' Z';
    let stripes = '';
    for (let i = 0; i < 10; i++) stripes += `<path d="M50 12 L${14 + i * 7.2} 50 L${14 + (i + 1) * 7.2} 50 Z" fill="${i % 2 ? '#FFF6EE' : c}"/>`;
    let bulbs = '';
    for (let i = 1; i <= 7; i++) { const t = Math.PI * i / 8; bulbs += `<circle cx="${(50 - 30 * Math.cos(t)).toFixed(1)}" cy="${(66 + 11 * Math.sin(t)).toFixed(1)}" r="1.9" fill="#FFE27A" stroke="#E0A93A" stroke-width=".8"/>`; }
    const horse = `<g transform="translate(48 91) scale(1.45)">` +
      `<path d="M0 -24 V16" stroke="url(#${gd})" stroke-width="2.4"/>` +
      `<path d="M-7 -1 Q-11 -2 -11 4" fill="none" stroke="#FF9EB5" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="M-3 3 L-6 9 M-1 3 L-2 9 M3 3 L5 9 M5 2 L8 7" stroke="#C9735A" stroke-width="2" stroke-linecap="round"/>` +
      `<ellipse cx="0" cy="0" rx="7.6" ry="4.4" fill="#FFFFFF" stroke="#C9735A" stroke-width="1.5"/>` +
      `<path d="M4 -1 L6.5 -9 Q8 -11.5 11 -10 L13 -7.5 Q13 -5.6 11 -5.8 L9 -5.6 L7.6 1 Z" fill="#FFFFFF" stroke="#C9735A" stroke-width="1.5" ${SW}/>` +
      `<path d="M5.4 -6 Q4.6 -10 7.6 -11" fill="none" stroke="#FF9EB5" stroke-width="2" stroke-linecap="round"/><circle cx="9.6" cy="-8.4" r=".9" fill="${INK}"/>` +
      `<path d="M-3 -4.2 Q0 -6 3 -4.2" fill="none" stroke="#FF9EB5" stroke-width="2.2" stroke-linecap="round"/></g>`;
    return `<defs>${glassGrad(g, c)}${goldGrad(gd)}<clipPath id="${cp}"><path d="${body}"/></clipPath><clipPath id="${cc}"><path d="${canopy}"/></clipPath></defs>` + bottleShadow +
      // 棉花糖噴頭：管子從頂篷後面接出來
      `<path d="M66 32 Q80 30 85 40" fill="none" stroke="${D}" stroke-width="2.4" stroke-linecap="round"/>` +
      `<path d="M83 58 L89 58 L86 72 Z" fill="#FFF3E0" stroke="#D9AE55" stroke-width="1.6" ${SW}/><path d="M84.4 62 L87.6 62 M85 66 L87 66" stroke="#FF9EB5" stroke-width="1.4"/>` +
      `<g fill="#FFC6D8" stroke="#F08FB0" stroke-width="2" ${SW}><circle cx="81" cy="49" r="6.5"/><circle cx="91" cy="48" r="6.5"/><circle cx="86" cy="43" r="6.5"/><circle cx="86" cy="54" r="6"/></g>` +
      `<g fill="#FFC6D8"><circle cx="81" cy="49" r="5"/><circle cx="91" cy="48" r="5"/><circle cx="86" cy="43" r="5"/><circle cx="86" cy="54" r="4.5"/><circle cx="86" cy="49" r="5"/></g>` +
      dot(83, 43, 1.8, .9) + dot(89, 47, 1.2, .8) +
      // 瓶身：圓筒（旋轉木馬的台座）
      `<path d="${body}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><path d="M10 90 Q30 85 50 90 Q70 95 90 90 L90 120 L10 120 Z" fill="${c}" opacity=".58"/>${horse}</g>` +
      `<ellipse cx="50" cy="66" rx="30" ry="11" fill="${light(c, .55)}" opacity=".7"/>` +
      `<path d="M20 98 A30 11 0 0 0 80 98" fill="none" stroke="url(#${gd})" stroke-width="3.4"/>` + bulbs +
      `<path d="${body}" fill="none" stroke="${D}" stroke-width="4.2" ${SW}/><ellipse cx="50" cy="66" rx="30" ry="11" fill="none" stroke="${D}" stroke-width="2.6"/>` +
      // 金色扭紋柱瓶頸
      `<rect x="45" y="40" width="10" height="27" rx="3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="2.2"/>` +
      `<path d="M45.5 46 L54.5 42 M45.5 52 L54.5 48 M45.5 58 L54.5 54 M45.5 64 L54.5 60" stroke="#fff" stroke-width="1.6" opacity=".75"/>` +
      // 條紋頂篷瓶蓋＋小旗子
      `<path d="M50 12 L50 1.5" stroke="#C98F1F" stroke-width="1.6"/><path d="M50 1.5 L60 4.5 L50 7.5 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="1.2" ${SW}/>` +
      `<g clip-path="url(#${cc})">${stripes}</g>` +
      `<path d="${canopy}" fill="none" stroke="${D}" stroke-width="3" ${SW}/>` +
      [83, 69.8, 56.6, 43.4, 30.2, 17].map(x => `<circle cx="${x}" cy="38.5" r="2" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1"/>`).join('') +
      `<circle cx="50" cy="12" r="3.4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>` +
      shine(38, 26, 2.2, 6, 50, .55) +
      `<path d="M26 76 Q26 70 30 66" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>` +
      sparkleAt(12, 52, 4.5, '#fff', '#F3A6CB');
  },
  // 黃金丁噹香（困難模式限定）：寶石切面金瓶＋小翅膀＋珍珠鍊＋金鈴鐺瓶蓋（綁粉紅蝴蝶結）＋金色光暈
  p_gold(c) {
    const g = uid('pg'), gd = uid('pd'), cp = uid('pc'), halo = uid('ph'), bell = uid('pb');
    const gem = `M50 111 C29 105 17 92 18 76 C19 64 27 56 37 53 Q50 49 63 53 C73 56 81 64 82 76 C83 92 71 105 50 111 Z`;
    const wing = `<path d="M23 70 C13 58 3 56 4 64 C4.5 68 8 70 11 70.5 C4 73 4 79 10 79.5 C7 84 12 87.5 20 83 Z" fill="#FFFFFF" stroke="#E2B84E" stroke-width="2.2" ${SW}/>` +
      `<path d="M11 70.5 Q16 72 20 74 M10 79.5 Q15 79 20 78" fill="none" stroke="#EBCB7A" stroke-width="1.4" stroke-linecap="round"/>`;
    let pearls = '';
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = 36 + 28 * t, y = 52 + 7 * Math.sin(Math.PI * t); pearls += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.1" fill="#FFFDF6" stroke="#E2C9A6" stroke-width=".9"/>`; }
    return `<defs><radialGradient id="${halo}"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".85"/><stop offset=".6" stop-color="#FFE9A8" stop-opacity=".35"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${g}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#FFF6D6"/><stop offset=".55" stop-color="#F6D77E"/><stop offset="1" stop-color="#DDAE45"/></linearGradient>` +
      `<radialGradient id="${bell}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".55" stop-color="#F2C866"/><stop offset="1" stop-color="#C99230"/></radialGradient>` +
      `${goldGrad(gd)}<clipPath id="${cp}"><path d="${gem}"/></clipPath></defs>` +
      `<circle cx="50" cy="70" r="50" fill="url(#${halo})"/>` + bottleShadow +
      wing + `<g transform="translate(100 0) scale(-1 1)">${wing}</g>` +
      `<path d="${gem}" fill="url(#${g})"/>` +
      `<g clip-path="url(#${cp})"><path d="M10 92 Q30 86 50 92 Q70 98 90 92 L90 120 L10 120 Z" fill="${c}" opacity=".55"/>` +
      `<path d="M50 60 L68 80 L50 104 L32 80 Z M50 60 L50 50 M68 80 L84 76 M32 80 L16 76 M50 104 L50 114 M50 60 L32 80 M37 53 L32 80 M63 53 L68 80 M24 96 L32 80 M76 96 L68 80" fill="none" stroke="#fff" stroke-width="1.4" opacity=".6"/></g>` +
      `<path d="${gem}" fill="none" stroke="url(#${gd})" stroke-width="5.4" ${SW}/><path d="${gem}" fill="none" stroke="#B9861F" stroke-width="1.3" opacity=".7"/>` +
      // 正中央的粉紅愛心寶石
      `<path d="${heartPath(50, 80, 9)}" fill="#FFB0C4" stroke="#FFFFFF" stroke-width="2.6" ${SW}/><path d="${heartPath(50, 80, 9)}" fill="none" stroke="#E0668A" stroke-width="1" ${SW}/>` + dot(46.5, 76.5, 1.8, .9) +
      `<path d="M27 74 Q27 63 35 58" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>` +
      // 瓶頸＋珍珠鍊
      `<rect x="43" y="38" width="14" height="14" rx="3" fill="url(#${gd})" stroke="#B9861F" stroke-width="2.4"/>` + pearls +
      // 金鈴鐺瓶蓋（丁噹熊的鈴鐺）
      `<circle cx="50" cy="27" r="13.5" fill="url(#${bell})" stroke="#B9861F" stroke-width="2.6"/>` +
      `<path d="M36.8 24.5 Q50 30 63.2 24.5" fill="none" stroke="#B9861F" stroke-width="2"/><path d="M37.4 21.8 Q50 27 62.6 21.8" fill="none" stroke="#FFF1C2" stroke-width="1.3" opacity=".9"/>` +
      `<path d="M50 31.5 L50 38.5" stroke="#8E6414" stroke-width="2.2" stroke-linecap="round"/><circle cx="50" cy="31.5" r="2.6" fill="#8E6414"/>` +
      shine(44, 20, 3.4, 2, -25, .9) +
      bowAt(50, 13, '#FF9EB5', '#E0668A', .62) +
      sparkleAt(12, 30, 6, '#FFF6D8', '#E8C26A') + sparkleAt(89, 22, 5, '#FFF6D8', '#E8C26A') + sparkleAt(91, 100, 4.5, '#fff', '#F3A6CB') +
      sparkleAt(9, 98, 3.6, '#FFF6D8', '#E8C26A') + sparkleAt(80, 44, 3, '#fff', '#E8C26A');
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

  // =================== v1.2 第 5 章（熊熊上學去） ===================
  // 字母拼圖地墊（220×70）：6×2 片彩色泡棉拼圖，用梯形透視鋪在地上，有凸耳、厚度和字母
  f_rug_abc() {
    const cols = [['#FFB0C4', '#E0668A'], ['#A8E6B8', '#4FA06A'], ['#FFD36E', '#D99A2B'], ['#BBA8F2', '#7D68C2'], ['#9CD3F0', '#4F95C2'], ['#FFB59A', '#D9734E']];
    const N = 6, R = 2, TOP = 13, BOT = 55, TL = 28, TR = 192, BL = 7, BR = 213;
    // 透視：u 左→右、v 上→下（0–1）
    const P = (u, v) => [TL + (TR - TL) * u + ((BL + (BR - BL) * u) - (TL + (TR - TL) * u)) * v, TOP + (BOT - TOP) * v];
    const f1 = n => n.toFixed(1);
    const quad = (u0, v0, u1, v1) => { const a = P(u0, v0), b = P(u1, v0), c = P(u1, v1), d = P(u0, v1); return `M${f1(a[0])} ${f1(a[1])} L${f1(b[0])} ${f1(b[1])} L${f1(c[0])} ${f1(c[1])} L${f1(d[0])} ${f1(d[1])} Z`; };
    const col = (r, c) => cols[(c + r * 3) % 6];
    let thick = '', tiles = '', knobs = '', letters = '';
    for (let r = 0; r < R; r++) for (let c = 0; c < N; c++) {
      const u0 = c / N, u1 = (c + 1) / N, v0 = r / R, v1 = (r + 1) / R, [f, l] = col(r, c);
      if (r === R - 1) { const d = P(u0, 1), e = P(u1, 1); thick += `<path d="M${f1(d[0])} ${f1(d[1])} L${f1(e[0])} ${f1(e[1])} L${f1(e[0])} ${f1(e[1] + 4.5)} L${f1(d[0])} ${f1(d[1] + 4.5)} Z" fill="${l}"/>`; }
      tiles += `<path d="${quad(u0, v0, u1, v1)}" fill="${f}" stroke="${l}" stroke-width="2" stroke-linejoin="round"/>`;
      const h0 = P(u0 + .06, v0 + .2), h1 = P(u0 + .3, v0 + .2);
      tiles += `<path d="M${f1(h0[0])} ${f1(h0[1])} L${f1(h1[0])} ${f1(h1[1])}" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`;
      // 右邊凸耳（左右交錯）
      if (c < N - 1) {
        const out = (c + r) % 2 === 0, [ff, ll] = out ? [f, l] : col(r, c + 1), k = out ? 1 : -1, [mx, my] = P(u1, (v0 + v1) / 2);
        knobs += `<path d="M${f1(mx)} ${f1(my - 2.6)} C${f1(mx + 2 * k)} ${f1(my - 5.4)} ${f1(mx + 7.5 * k)} ${f1(my - 4.6)} ${f1(mx + 7.5 * k)} ${f1(my)} C${f1(mx + 7.5 * k)} ${f1(my + 4.6)} ${f1(mx + 2 * k)} ${f1(my + 5.4)} ${f1(mx)} ${f1(my + 2.6)}" fill="${ff}" stroke="${ll}" stroke-width="1.6"/>`;
      }
      // 下面凸耳（第一排往下）
      if (r === 0) {
        const [mx, my] = P((u0 + u1) / 2, v1);
        knobs += `<path d="M${f1(mx - 3.6)} ${f1(my)} C${f1(mx - 6.4)} ${f1(my + 1)} ${f1(mx - 5.4)} ${f1(my + 5)} ${f1(mx)} ${f1(my + 5)} C${f1(mx + 5.4)} ${f1(my + 5)} ${f1(mx + 6.4)} ${f1(my + 1)} ${f1(mx + 3.6)} ${f1(my)}" fill="${f}" stroke="${l}" stroke-width="1.6"/>`;
      }
      // 字母：壓扁＋依透視傾斜
      const [cx, cy] = P((u0 + u1) / 2, (v0 + v1) / 2), [tx] = P((u0 + u1) / 2, 0), [bx] = P((u0 + u1) / 2, 1);
      const sk = Math.atan((bx - tx) / (BOT - TOP)) * 180 / Math.PI;
      letters += `<g transform="translate(${f1(cx)} ${f1(cy)}) skewX(${sk.toFixed(1)}) scale(1 .7)"><text x="0" y="6" text-anchor="middle" ${ROUND_FONT} font-size="17" fill="#FFFFFF" stroke="${l}" stroke-width="3.6" stroke-linejoin="round" paint-order="stroke">${String.fromCharCode(65 + r * N + c)}</text></g>`;
    }
    return `<ellipse cx="110" cy="61" rx="108" ry="7" fill="#8A6A5E" opacity=".14"/>` + thick + tiles + knobs + letters;
  },
  // 小書桌（110×84）：木頭桌面＋薄荷色抽屜、愛心椅背小椅子、打開的繪本、筆筒、小蘋果
  f_table_desk() {
    return `<ellipse cx="58" cy="82" rx="52" ry="3" fill="#8A6A5E" opacity=".18"/>` +
      // 書桌
      `<path d="M34 58 L32 81 M96 58 L98 81" stroke="#B98552" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="34" y="42" width="64" height="18" rx="4" fill="#BFE8D2" stroke="#5FAF8A" stroke-width="2.4"/>` +
      `<path d="M66 42 V60" stroke="#5FAF8A" stroke-width="1.8"/><rect x="45" y="49" width="10" height="3.6" rx="1.8" fill="#FFF8EE" stroke="#5FAF8A" stroke-width="1.2"/><rect x="77" y="49" width="10" height="3.6" rx="1.8" fill="#FFF8EE" stroke="#5FAF8A" stroke-width="1.2"/>` +
      `<rect x="28" y="34" width="76" height="9" rx="3.5" fill="#F2D3A6" stroke="#B98552" stroke-width="2.6"/><path d="M33 37 H62" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>` +
      // 打開的繪本
      `<path d="M50 34 Q58 29 66 33 Q74 29 82 34 L82 36 L50 36 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="1.6" ${SW}/>` +
      `<path d="M52 33 Q59 26 66 31 L66 34 Q59 30 52 34 Z" fill="#FFFDF6" stroke="#C9A77E" stroke-width="1.4" ${SW}/>` +
      `<path d="M66 31 Q73 26 80 33 L80 34 Q73 30 66 34 Z" fill="#FFFDF6" stroke="#C9A77E" stroke-width="1.4" ${SW}/>` +
      `<circle cx="59" cy="30.4" r="1.6" fill="#FFD36E"/><path d="M70 31 L74 29 L77 31" fill="none" stroke="#7DD39A" stroke-width="1.2" stroke-linecap="round"/>` +
      // 筆筒＋鉛筆、蠟筆
      `<path d="M89 14 L87 28 M93 12 L93 28 M97 15 L99 28" stroke-width="3.4" stroke-linecap="round" stroke="#FFD36E"/>` +
      `<path d="M89 14 L89.6 10.4 M93 12 L93 8.4 M97 15 L96.4 11.4" stroke-width="2.4" stroke-linecap="round" stroke="#F7DDB8"/>` +
      `<path d="M93 12 L93 13" stroke="#FF9EB5" stroke-width="3.4" stroke-linecap="round"/><path d="M97 15 L97.2 16" stroke="#8CCBEA" stroke-width="3.4" stroke-linecap="round"/>` +
      `<rect x="86" y="21" width="15" height="14" rx="3" fill="#BBA8F2" stroke="#7D68C2" stroke-width="2"/><path d="${star5(93.5, 28, 3.2, 1.5)}" fill="#fff" opacity=".85"/>` +
      // 小蘋果
      `<path d="M40 25 Q34 23 34 29 Q34 35 40 34.4 Q46 35 46 29 Q46 23 40 25 Z" fill="#FF8FA8" stroke="#D9557E" stroke-width="1.8" ${SW}/>` +
      `<path d="M40 25 Q40 22 42 20" fill="none" stroke="#9B6B47" stroke-width="1.6" stroke-linecap="round"/><path d="M42 22 Q46 19 47 23 Q44 24 42 22 Z" fill="#7DD39A"/>` + dot(37.5, 27.5, 1.2, .85) +
      // 愛心椅背小椅子（在書桌前面）
      `<path d="M8 60 L6 81 M28 60 L30 81" stroke="#E8A0B4" stroke-width="3.6" stroke-linecap="round"/>` +
      `<path d="M10 58 V44 M26 58 V44" stroke="#E8A0B4" stroke-width="3.4" stroke-linecap="round"/>` +
      `<path d="${heartPath(18, 40, 9.5)}" fill="#FFB0C4" stroke="#E0668A" stroke-width="2.4" ${SW}/>` + dot(14.5, 37.5, 1.6, .85) +
      `<rect x="2" y="56" width="32" height="7" rx="3.5" fill="#FFB0C4" stroke="#E0668A" stroke-width="2.4"/>`;
  },
  // 地球儀吊燈（60×100）：金色經線環＋粉藍地球、薄荷綠陸地、愛心標著「家」
  f_lamp_globe() {
    const gl = uid('gl'), gs = uid('gs'), cp = uid('cp'), gd = uid('gd');
    return `<defs>${glow(gl, '#FFE7B8')}${goldGrad(gd)}<radialGradient id="${gs}" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#EAF7FF"/><stop offset="1" stop-color="#9CD3F0"/></radialGradient><clipPath id="${cp}"><circle cx="30" cy="62" r="20"/></clipPath></defs>` +
      `<circle cx="30" cy="64" r="30" fill="url(#${gl})"/>` +
      `<rect x="24" y="0" width="12" height="4" rx="2" fill="#B98A64"/><path d="M30 3 L30 36" stroke="#8A6A5A" stroke-width="2.2"/>` +
      `<circle cx="30" cy="62" r="20" fill="url(#${gs})" stroke="#4F95C2" stroke-width="3"/>` +
      `<g clip-path="url(#${cp})" transform="rotate(-18 30 62)">` +
      `<path d="M14 50 Q18 42 27 45 Q33 48 29 55 Q25 60 19 58 Q12 56 14 50 Z M33 62 Q40 56 47 61 Q50 70 43 76 Q36 79 34 72 Q31 67 33 62 Z M18 70 Q23 68 25 73 Q22 77 18 74 Z" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.4"/>` +
      `<ellipse cx="30" cy="62" rx="20" ry="6" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55"/><ellipse cx="30" cy="62" rx="8" ry="20" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55"/></g>` +
      heartAt(40, 66, 2.8, '#FF9EB5', '#E0668A', 1.2) +
      shine(22, 53, 4.4, 2.4, -35, .75) +
      // 金色經線環（半圈）
      `<path d="M30 38 A24 24 0 0 1 30 86" fill="none" stroke="url(#${gd})" stroke-width="3.6" transform="rotate(-18 30 62)"/>` +
      `<path d="M30 38 A24 24 0 0 1 30 86" fill="none" stroke="#C98F1F" stroke-width="1" opacity=".6" transform="rotate(-18 30 62)"/>` +
      `<circle cx="30" cy="38" r="3.4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>` +
      `<circle cx="30" cy="86" r="3" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/><path d="M28 89 L27 96 M30 89 L30 97 M32 89 L33 96" stroke="#FF9EB5" stroke-width="1.8" stroke-linecap="round"/>`;
  },
  // 小黑板（110×80）：木框＋粉筆綠板面，上面有 ABC、愛心、熊熊塗鴉、1+1=2，下面有粉筆槽和板擦
  f_wall_chalkboard() {
    const F = `font-family="'Arial Rounded MT Bold','Hiragino Maru Gothic ProN','Varela Round',sans-serif" font-weight="800"`;
    return `<circle cx="55" cy="4" r="2.6" fill="#B98A64"/><path d="M55 4 L22 15 M55 4 L88 15" stroke="#B98A64" stroke-width="1.6"/>` +
      `<rect x="9" y="12" width="92" height="58" rx="7" fill="#D9A877" stroke="#9B6B47" stroke-width="2.6"/>` +
      `<rect x="15" y="18" width="80" height="45" rx="3.5" fill="#5F927E"/>` +
      `<ellipse cx="66" cy="50" rx="18" ry="7" fill="#fff" opacity=".08"/>` +
      `<text x="20" y="36" ${F} font-size="14" fill="#FFFFFF" opacity=".93">ABC</text>` +
      `<path d="${heartPath(64, 30, 5)}" fill="none" stroke="#FFB0C4" stroke-width="1.8" ${SW}/>` +
      `<text x="20" y="56" ${F} font-size="10" fill="#FFE27A" opacity=".95">1+1=2</text>` +
      // 熊熊塗鴉
      `<g fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".92" stroke-linecap="round"><circle cx="78" cy="31" r="3"/><circle cx="90" cy="31" r="3"/><circle cx="84" cy="38" r="7"/></g>` +
      `<circle cx="81.5" cy="37" r=".9" fill="#fff"/><circle cx="86.5" cy="37" r=".9" fill="#fff"/><path d="M82.6 40.4 Q84 41.6 85.4 40.4" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>` +
      `<path d="${star5(70, 52, 4, 1.8)}" fill="none" stroke="#A8E6B8" stroke-width="1.4" ${SW}/>` +
      `<path d="M78 52 q3 -4 6 0 q3 4 6 0" fill="none" stroke="#9CD3F0" stroke-width="1.6" stroke-linecap="round"/>` +
      shine(20, 22, 4, 1.4, -20, .25) +
      // 粉筆槽＋粉筆＋板擦
      `<rect x="11" y="63" width="88" height="6" rx="2.5" fill="#C99560" stroke="#9B6B47" stroke-width="1.8"/>` +
      `<rect x="22" y="60.5" width="10" height="3.4" rx="1.5" fill="#FFFFFF"/><rect x="35" y="60.5" width="8" height="3.4" rx="1.5" fill="#FFB0C4"/><rect x="46" y="60.5" width="9" height="3.4" rx="1.5" fill="#FFE27A"/>` +
      `<rect x="70" y="57" width="17" height="7" rx="2" fill="#BBA8F2" stroke="#7D68C2" stroke-width="1.6"/><rect x="70" y="61.4" width="17" height="2.6" fill="#F3EEFF"/>` +
      bowAt(55, 13, '#FFB0C4', '#E0668A', .5);
  },

  // =================== v1.2 第 6 章（熊熊遊樂園） ===================
  f_curtain_circus() { return circusCurtain(); },
  // 旋轉木馬吊燈（60×100）：條紋頂篷＋燈泡、金色扭紋柱、兩隻小木馬、台座
  f_lamp_carousel() {
    const gl = uid('gl'), gd = uid('gd'), cc = uid('cp');
    let canopy = `M30 15 L57 38`;
    for (let i = 0; i < 4; i++) { const x0 = 57 - i * 13.5, x1 = x0 - 13.5; canopy += ` Q${(x0 + x1) / 2} 46 ${x1} 38`; }
    canopy += ' Z';
    let stripes = '';
    for (let i = 0; i < 9; i++) stripes += `<path d="M30 15 L${1 + i * 6.6} 48 L${1 + (i + 1) * 6.6} 48 Z" fill="${i % 2 ? '#FFF6EE' : '#FFB0C4'}"/>`;
    const pole = x => `<path d="M${x} 40 V82" stroke="url(#${gd})" stroke-width="2.6"/><path d="M${x} 44 V80" stroke="#fff" stroke-width="2.6" stroke-dasharray="1.6 4" opacity=".8"/>`;
    return `<defs>${glow(gl, '#FFE2B8')}${goldGrad(gd)}<clipPath id="${cc}"><path d="${canopy}"/></clipPath></defs>` +
      `<circle cx="30" cy="58" r="30" fill="url(#${gl})"/>` +
      `<rect x="24" y="0" width="12" height="4" rx="2" fill="#B98A64"/><path d="M30 3 L30 13" stroke="#8A6A5A" stroke-width="2.2"/>` +
      pole(10) + pole(30) + pole(50) +
      lampHorse(10, 62, 1, '#FFFFFF', '#FF9EB5') + lampHorse(50, 58, -1, '#FFFFFF', '#9CD3F0') +
      heartAt(30, 60, 4.4, '#FFD36E', '#D99A2B', 1.4) +
      // 台座
      `<path d="M4 82 Q30 90 56 82 L54 88 Q30 96 6 88 Z" fill="#BBA8F2" stroke="#7D68C2" stroke-width="2" ${SW}/>` +
      `<ellipse cx="30" cy="82" rx="26" ry="5" fill="#FFE4EB" stroke="url(#${gd})" stroke-width="2.4"/>` +
      [10, 20, 30, 40, 50].map((x, i) => `<circle cx="${x}" cy="${88.5 + (i === 2 ? 3.4 : i % 2 ? 2.4 : 0)}" r="1.5" fill="#FFE27A"/>`).join('') +
      `<path d="M30 93 L30 98" stroke="url(#${gd})" stroke-width="2"/><circle cx="30" cy="98" r="1.8" fill="url(#${gd})"/>` +
      // 條紋頂篷
      `<g clip-path="url(#${cc})">${stripes}</g><path d="${canopy}" fill="none" stroke="#E0668A" stroke-width="2.4" ${SW}/>` +
      [57, 43.5, 30, 16.5, 3].map(x => `<circle cx="${x}" cy="39" r="2" fill="#FFE27A" stroke="#E0A93A" stroke-width=".8"/>`).join('') +
      `<circle cx="30" cy="14" r="3.2" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.2"/>` +
      `<path d="M30 11 L30 5" stroke="#C98F1F" stroke-width="1.2"/><path d="M30 5 L37 7 L30 9 Z" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1" ${SW}/>` +
      shine(20, 28, 1.8, 5, 50, .55);
  },
  // 摩天輪掛畫（110×80）：粉紅畫框＋晚霞粉天空、摩天輪、雲朵、小山坡
  f_wall_ferris() {
    const gs = uid('gs'), cp = uid('cp');
    const C = [55, 42], R = 20;
    const cabs = ['#FFB0C4', '#A8E6B8', '#FFD36E', '#BBA8F2', '#9CD3F0', '#FFB59A', '#FFB0C4', '#A8E6B8'];
    let spokes = '', cab = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + .2, x = C[0] + Math.cos(a) * R, y = C[1] + Math.sin(a) * R;
      spokes += `M${C[0]} ${C[1]} L${x.toFixed(1)} ${y.toFixed(1)} `;
      cab += `<path d="M${(x - 3.6).toFixed(1)} ${(y + 1).toFixed(1)} H${(x + 3.6).toFixed(1)} L${(x + 3).toFixed(1)} ${(y + 6).toFixed(1)} Q${x.toFixed(1)} ${(y + 7.5).toFixed(1)} ${(x - 3).toFixed(1)} ${(y + 6).toFixed(1)} Z" fill="${cabs[i]}" stroke="${deep(cabs[i], .3)}" stroke-width="1.2" ${SW}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.4" fill="#fff" stroke="#9B87D9" stroke-width=".8"/>`;
    }
    return `<defs><linearGradient id="${gs}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE0EC"/><stop offset="1" stop-color="#DDEFFB"/></linearGradient><clipPath id="${cp}"><rect x="15" y="18" width="80" height="52" rx="3"/></clipPath></defs>` +
      `<circle cx="55" cy="4" r="2.6" fill="#B98A64"/><path d="M55 4 L24 14 M55 4 L86 14" stroke="#B98A64" stroke-width="1.6"/>` +
      `<rect x="8" y="11" width="94" height="66" rx="8" fill="#FFC4D3" stroke="#E0668A" stroke-width="2.6"/>` +
      `<rect x="15" y="18" width="80" height="52" rx="3" fill="url(#${gs})"/>` +
      `<g clip-path="url(#${cp})">` +
      `<path d="M22 32 q3 -6 9 -4 q4 -5 9 0 q5 0 4 5 h-20 q-4 0 -2 -1 Z" fill="#fff" opacity=".95"/><path d="M76 28 q3 -5 8 -3 q5 -2 6 3 q3 1 1 3 h-14 Z" fill="#fff" opacity=".9"/>` +
      `<path d="M10 70 Q30 58 55 64 Q80 70 100 60 V80 H10 Z" fill="#BFE8C8" stroke="#7DBF92" stroke-width="1.4"/>` +
      `<path d="M55 42 L44 66 M55 42 L66 66" stroke="#9B87D9" stroke-width="2.6" stroke-linecap="round"/>` +
      `<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="#BBA8F2" stroke-width="2.6"/><circle cx="${C[0]}" cy="${C[1]}" r="${R - 7}" fill="none" stroke="#D9CCFA" stroke-width="1.4"/>` +
      `<path d="${spokes}" stroke="#BBA8F2" stroke-width="1.2"/>` + cab +
      `<circle cx="${C[0]}" cy="${C[1]}" r="3.4" fill="#FFD36E" stroke="#D99A2B" stroke-width="1.2"/>` +
      `<path d="M84 58 Q86 52 84 48" fill="none" stroke="#B98A64" stroke-width=".8"/><ellipse cx="84" cy="45" rx="3.4" ry="4" fill="#FF9EB5" stroke="#E0668A" stroke-width="1"/>` +
      `<path d="M88 60 Q90 55 89 51" fill="none" stroke="#B98A64" stroke-width=".8"/><ellipse cx="89" cy="48" rx="3" ry="3.6" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1"/>` +
      `<path d="${star5(24, 46, 2.6, 1.2)}" fill="#FFF6D8"/><path d="${star5(32, 54, 1.8, .8)}" fill="#FFF6D8"/></g>` +
      `<rect x="15" y="18" width="80" height="52" rx="3" fill="none" stroke="#F29AB4" stroke-width="1.4"/>` +
      shine(14, 16, 4, 1.6, -30, .7) + bowAt(55, 11, '#FFFFFF', '#E0668A', .5);
  },
  // 氣球盆栽（52×92）：條紋花盆＋愛心、圓形、星星三顆氣球
  f_plant_balloon() {
    const cp = uid('cp');
    const pot = `M10 64 H42 L38 87 Q26 91 14 87 Z`;
    let st = '';
    for (let x = 4; x < 50; x += 8) st += `<rect x="${x}" y="60" width="4" height="32" fill="#FFB0C4"/>`;
    return `<defs><clipPath id="${cp}"><path d="${pot}"/></clipPath></defs><ellipse cx="26" cy="90" rx="18" ry="2.4" fill="#8A6A5E" opacity=".2"/>` +
      // 線
      `<path d="M24 60 Q18 48 15 36 M27 60 Q32 44 37 27 M28 60 Q34 54 34 48" fill="none" stroke="#B98A64" stroke-width="1.2"/>` +
      // 愛心氣球
      `<path d="${heartPath(14, 24, 11)}" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.4" ${SW}/><path d="M12 34.5 L15 34.5 L13.5 37 Z" fill="#E0668A"/>` + shine(8.5, 19, 2.2, 3.6, 30, .75) +
      // 圓形氣球
      `<ellipse cx="37" cy="14" rx="11" ry="12.5" fill="#A8E6B8" stroke="#4FA06A" stroke-width="2.4"/><path d="M35.5 26.4 L38.5 26.4 L37 29 Z" fill="#4FA06A"/>` + shine(33, 8.5, 2.4, 4, 30, .75) +
      // 星星氣球
      `<path d="${star5(33, 42, 10, 4.8)}" fill="#FFD36E" stroke="#D99A2B" stroke-width="2.2" ${SW}/>` + dot(30, 39, 1.6, .85) +
      // 葉子
      `<path d="M26 64 Q16 54 10 58 Q14 66 26 64 Z M26 64 Q36 54 42 58 Q38 66 26 64 Z" fill="#8FD9A6" stroke="#4FA06A" stroke-width="1.8" ${SW}/>` +
      // 條紋花盆
      `<path d="${pot}" fill="#FFF6EE"/><g clip-path="url(#${cp})">${st}</g><path d="${pot}" fill="none" stroke="#E0668A" stroke-width="2.6" ${SW}/>` +
      `<rect x="7" y="58" width="38" height="9" rx="3.5" fill="#BBA8F2" stroke="#7D68C2" stroke-width="2.6"/>` +
      [14, 22, 30, 38].map(x => `<circle cx="${x}" cy="62.5" r="1.3" fill="#FFE27A"/>`).join('');
  },

  // =================== v1.2 金色限定（困難模式第 3 章） ===================
  // 金色水晶吊燈（60×100）：金鍊、上下兩層彎臂＋燭台燈泡、水晶垂墜、珍珠串
  f_lamp_chandelier() {
    const gl = uid('gl'), gd = uid('gd'), cr = uid('cr');
    const G = `url(#${gd})`, GL = '#B9861F';
    let chain = '';
    for (let y = 3; y < 22; y += 5) chain += `<ellipse cx="30" cy="${y + 2}" rx="${(y / 5) % 2 < 1 ? 2 : 1.3}" ry="2.7" fill="none" stroke="${GL}" stroke-width="2.4"/><ellipse cx="30" cy="${y + 2}" rx="${(y / 5) % 2 < 1 ? 2 : 1.3}" ry="2.7" fill="none" stroke="${G}" stroke-width="1.4"/>`;
    const candle = (x, y) => `<path d="M${x - 5.6} ${y} Q${x} ${y + 5.6} ${x + 5.6} ${y} Z" fill="${G}" stroke="${GL}" stroke-width="1.8" ${SW}/>` +
      `<rect x="${x - 2.4}" y="${y - 8}" width="4.8" height="8" rx="1.2" fill="#FFFDF6" stroke="#D9BE96" stroke-width="1.3"/>` +
      `<path d="M${x} ${y - 15.5} Q${x + 3.6} ${y - 11} ${x} ${y - 8.4} Q${x - 3.6} ${y - 11} ${x} ${y - 15.5} Z" fill="#FFE59A" stroke="#EBA83A" stroke-width="1.3"/>`;
    const drop = (x, y, s = 1) => `<path d="M${x} ${y} Q${x + 3.4 * s} ${y + 5 * s} ${x} ${y + 8 * s} Q${x - 3.4 * s} ${y + 5 * s} ${x} ${y} Z" fill="url(#${cr})" stroke="#7FB3DA" stroke-width="1.4"/>` + dot(x - .8 * s, y + 4.6 * s, .9 * s, .9);
    return `<defs>${glow(gl, '#FFE29A')}${goldGrad(gd)}<linearGradient id="${cr}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#E4F4FF"/><stop offset="1" stop-color="#C9E4FA"/></linearGradient></defs>` +
      `<circle cx="30" cy="58" r="30" fill="url(#${gl})"/>` +
      `<rect x="24" y="0" width="12" height="4" rx="2" fill="${G}" stroke="${GL}" stroke-width="1"/>` + chain +
      `<path d="M22 22 Q30 29 38 22 Z" fill="${G}" stroke="${GL}" stroke-width="2" ${SW}/>` +
      // 下層彎臂（深金描邊＋金色）
      `<path d="M30 60 Q14 67 8 54 M30 60 Q46 67 52 54" fill="none" stroke="${GL}" stroke-width="7" stroke-linecap="round"/>` +
      `<path d="M30 60 Q14 67 8 54 M30 60 Q46 67 52 54" fill="none" stroke="${G}" stroke-width="4.4" stroke-linecap="round"/>` +
      // 上層彎臂
      `<path d="M30 46 Q19 51 17 40 M30 46 Q41 51 43 40" fill="none" stroke="${GL}" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M30 46 Q19 51 17 40 M30 46 Q41 51 43 40" fill="none" stroke="${G}" stroke-width="3.6" stroke-linecap="round"/>` +
      // 珍珠串
      `<path d="M8 57 Q30 76 52 57" fill="none" stroke="#D9BE96" stroke-width="4.4" stroke-dasharray="0 4.6" stroke-linecap="round"/>` +
      `<path d="M8 57 Q30 76 52 57" fill="none" stroke="#FFFDF6" stroke-width="3.2" stroke-dasharray="0 4.6" stroke-linecap="round"/>` +
      `<path d="M17 43 Q30 55 43 43" fill="none" stroke="#D9BE96" stroke-width="3.6" stroke-dasharray="0 4" stroke-linecap="round"/>` +
      `<path d="M17 43 Q30 55 43 43" fill="none" stroke="#FFFDF6" stroke-width="2.6" stroke-dasharray="0 4" stroke-linecap="round"/>` +
      // 中柱＋小皇冠
      `<path d="M30 26 V76" stroke="${GL}" stroke-width="6"/><path d="M30 26 V76" stroke="${G}" stroke-width="3.8"/>` +
      `<path d="M20.5 36.5 L21.5 27.5 L26 31.5 L30 25.5 L34 31.5 L38.5 27.5 L39.5 36.5 Z" fill="${G}" stroke="${GL}" stroke-width="2" ${SW}/>` +
      `<circle cx="22" cy="27.6" r="1.4" fill="#FFB0C4"/><circle cx="30" cy="25.6" r="1.6" fill="#FFB0C4"/><circle cx="38" cy="27.6" r="1.4" fill="#FFB0C4"/>` +
      `<ellipse cx="30" cy="53" rx="7.6" ry="8.6" fill="${G}" stroke="${GL}" stroke-width="2.2"/>` +
      `<path d="${heartPath(30, 53, 4)}" fill="#FFB0C4" stroke="#fff" stroke-width="1.1"/>` +
      `<ellipse cx="30" cy="70" rx="5.6" ry="4" fill="${G}" stroke="${GL}" stroke-width="2"/>` +
      candle(8, 54) + candle(52, 54) + candle(17, 40) + candle(43, 40) +
      drop(8, 58, 1.25) + drop(52, 58, 1.25) + drop(17, 44, .95) + drop(43, 44, .95) + drop(19, 64, 1) + drop(41, 64, 1) +
      `<path d="M30 74 V79" stroke="${GL}" stroke-width="2.2"/>` + drop(30, 79, 1.9) +
      `<path d="${sparkle(5, 78, 4.8)}" fill="#FFF6D8" stroke="#E8C26A" stroke-width="1"/>` +
      `<path d="${sparkle(55, 76, 3.8)}" fill="#FFF6D8" stroke="#E8C26A" stroke-width="1"/>` +
      `<path d="${sparkle(49, 22, 3.2)}" fill="#fff" stroke="#E8C26A" stroke-width="1"/>` +
      shine(28, 50, 1.4, 3, 0, .7);
  },
};

/** 旋轉木馬吊燈上的小木馬（面向右；f=-1 面向左） */
function lampHorse(x, y, f, c, mane) {
  return `<g transform="translate(${x} ${y}) scale(${f} 1)">` +
    `<path d="M-7 -1 Q-11 -2 -11 4" fill="none" stroke="${mane}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path d="M-3 3 L-6 8.5 M-1 3 L-1.6 9 M3 3 L5.5 8 M5 2 L8.6 5.4" stroke="#D98A6A" stroke-width="1.8" stroke-linecap="round"/>` +
    `<ellipse cx="0" cy="0" rx="7.6" ry="4.4" fill="${c}" stroke="#D98A6A" stroke-width="1.4"/>` +
    `<path d="M4 -1 L6.5 -9 Q8 -11.5 11 -10 L13 -7.5 Q13 -5.6 11 -5.8 L9 -5.6 L7.6 1 Z" fill="${c}" stroke="#D98A6A" stroke-width="1.4" ${SW}/>` +
    `<path d="M5.4 -6 Q4.6 -10 7.6 -11" fill="none" stroke="${mane}" stroke-width="2" stroke-linecap="round"/><circle cx="9.6" cy="-8.4" r=".9" fill="${INK}"/>` +
    `<path d="M-3.4 -4.2 Q0 -6.4 3.4 -4.2" fill="none" stroke="${mane}" stroke-width="2.4" stroke-linecap="round"/></g>`;
}

/** 條紋帳篷窗簾（138×130；窗戶在 (14,14)–(124,114)）：粉紅奶油直條紋、帳篷三角旗邊、金色繩結流蘇 */
function circusCurtain() {
  const gd = uid('gd'), cp = uid('cp');
  const left = `M4 12 H44 C40 42 30 68 25 86 C31 102 39 116 42 127 H4 Z`;
  const right = `M134 12 H94 C98 42 108 68 113 86 C107 102 99 116 96 127 H134 Z`;
  // 條紋順著收攏的布：上緣均分 → 綁帶處收窄 → 下緣散開
  let st = '';
  const K = 5;
  for (let i = 0; i < K; i++) {
    const t = (i + .5) / K;
    const xt = 4 + t * 40, xm = 15 + t * 15, xb = 4 + t * 38;
    st += `M${xt.toFixed(1)} 10 C${xt.toFixed(1)} 40 ${xm.toFixed(1)} 66 ${xm.toFixed(1)} 86 C${xm.toFixed(1)} 104 ${xb.toFixed(1)} 116 ${xb.toFixed(1)} 130 `;
  }
  const stripes = `<path d="${st}" fill="none" stroke="#FFB0C4" stroke-width="4.6"/>`;
  const flagsCol = [['#FFB0C4', '#E0668A'], ['#A8E6B8', '#4FA06A'], ['#FFD36E', '#D99A2B'], ['#BBA8F2', '#7D68C2']];
  let flags = '';
  const n = 8, w = 130 / n;
  for (let i = 0; i < n; i++) {
    const x0 = 4 + i * w, [f, l] = flagsCol[i % 4];
    flags += `<path d="M${x0.toFixed(1)} 22 L${(x0 + w).toFixed(1)} 22 L${(x0 + w / 2).toFixed(1)} 38 Z" fill="${f}" stroke="${l}" stroke-width="1.8" ${SW}/>` +
      `<circle cx="${(x0 + w / 2).toFixed(1)}" cy="39.5" r="2.2" fill="url(#${gd})" stroke="#C98F1F" stroke-width=".8"/>`;
  }
  const tie = (x, y) => `<path d="M${x - 14} ${y} Q${x} ${y + 6} ${x + 14} ${y}" fill="none" stroke="#C98F1F" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M${x - 14} ${y} Q${x} ${y + 6} ${x + 14} ${y}" fill="none" stroke="#FFE08A" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 2"/>` +
    `<circle cx="${x}" cy="${y + 3.4}" r="3.6" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.2"/>` +
    `<path d="M${x - 3} ${y + 6} L${x - 4} ${y + 15} M${x - 1} ${y + 6} L${x - 1.4} ${y + 16} M${x + 1} ${y + 6} L${x + 1.4} ${y + 16} M${x + 3} ${y + 6} L${x + 4} ${y + 15}" stroke="#E2B84E" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<defs>${goldGrad(gd)}<clipPath id="${cp}"><path d="${left}"/></clipPath></defs>` +
    `<path d="${left}" fill="#FFF7EC"/><g clip-path="url(#${cp})">${stripes}</g><path d="${left}" fill="none" stroke="#E0668A" stroke-width="2.4" ${SW}/>` +
    `<g transform="translate(138 0) scale(-1 1)"><path d="${left}" fill="#FFF7EC"/><g clip-path="url(#${cp})">${stripes}</g><path d="${left}" fill="none" stroke="#E0668A" stroke-width="2.4" ${SW}/></g>` +
    tie(25, 86) + tie(113, 86) +
    // 帳篷頂邊：條紋帶＋三角旗＋小燈泡
    `<rect x="4" y="9" width="130" height="14" fill="#FFF7EC" stroke="#E0668A" stroke-width="2.2"/>` +
    Array.from({ length: 13 }, (_, i) => `<rect x="${4 + i * 10}" y="9" width="5" height="14" fill="#FFB0C4"/>`).join('') +
    `<rect x="4" y="9" width="130" height="14" fill="none" stroke="#E0668A" stroke-width="2.2"/>` + flags +
    Array.from({ length: 9 }, (_, i) => `<circle cx="${8 + i * 15.25}" cy="16" r="2" fill="#FFE27A" stroke="#E0A93A" stroke-width=".8"/>`).join('') +
    `<rect x="2" y="5" width="134" height="5" rx="2.5" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>` +
    `<circle cx="4" cy="7.5" r="4.4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/><circle cx="134" cy="7.5" r="4.4" fill="url(#${gd})" stroke="#C98F1F" stroke-width="1.4"/>`;
}

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
  // v1.2
  f_lamp_globe:      { x: 180, y: 62, r: 120, c: '#FFD49A', core: '#FFF0CC' },
  f_lamp_carousel:   { x: 180, y: 58, r: 118, c: '#FFC79E', core: '#FFEACB', dots: [[207, 36], [193.5, 36], [180, 36], [166.5, 36], [153, 36], [162, 84], [180, 87], [198, 84]] },
  f_lamp_chandelier: { x: 180, y: 54, r: 142, c: '#FFD27A', core: '#FFF2C4', dots: [[158, 40], [202, 40], [167, 26], [193, 26], [180, 50]] },
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
  5: ['#FFF6DC', '#DDF0E4'], // 午後陽光教室
  6: ['#FFE6EE', '#E2E4FF'], // 彩燈遊樂園
};
const friendInfo = id => FRIENDS.find(f => f.id === id);
const MEET_PROPS = { 1: ['salmon', 'straw'], 2: ['bow', 'knitHat'], 3: ['cocoaMug', 'pillow'], 4: ['airBalloon', 'camera'], 5: ['book', 'crayon'], 6: ['cottonCandy', 'trumpet'] };

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
  // 黑糖：最會說故事 → 一疊繪本、打開的故事書、ABC 泡泡、小蘋果
  heitang: () =>
    [[16, 160, 60, '#A8E6B8', '#4FA06A'], [22, 148, 52, '#FFB0C4', '#E0668A'], [18, 136, 56, '#BBA8F2', '#7D68C2']].map(([x, y, w, c, l]) =>
      `<rect x="${x}" y="${y}" width="${w}" height="12" rx="3" fill="${c}" stroke="${l}" stroke-width="2.4"/><rect x="${x + w - 9}" y="${y + 2.5}" width="6" height="7" rx="1" fill="#FFFDF6"/><path d="M${x + 6} ${y + 6} H${x + w - 16}" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`).join('') +
    appleMini(44, 126, 1.1) +
    `<path d="M150 151 Q135 142 120 148 L120 181 Q135 175 150 183 Q165 175 180 181 L180 148 Q165 142 150 151 Z" fill="#FF9EB5" stroke="#E0668A" stroke-width="2.4" ${SW}/>` +
    `<path d="M150 148 Q137 140 124 145 L124 176 Q137 171 150 178 Z" fill="#FFFDF6" stroke="#C9A77E" stroke-width="1.8" ${SW}/>` +
    `<path d="M150 148 Q163 140 176 145 L176 176 Q163 171 150 178 Z" fill="#FFFDF6" stroke="#C9A77E" stroke-width="1.8" ${SW}/>` +
    ['#FF9EB5', '#FFE27A', '#8FD9B6', '#9CD3F0'].map((c, i) => `<path d="M${128 + i * 2.4} 168 A${9.6 - i * 2.4} ${9.6 - i * 2.4} 0 0 1 ${147.2 - i * 2.4} 168" fill="none" stroke="${c}" stroke-width="2.4"/>`).join('') +
    `<path d="M156 168 V160 L163 154 L170 160 V168 Z" fill="#FFE4EB" stroke="#E0668A" stroke-width="1.6" ${SW}/><rect x="161" y="162" width="4" height="6" fill="#FFB0C4"/><circle cx="168" cy="150" r="2.6" fill="#FFE27A"/>` +
    letterBubble(34, 50, 'A', '#FFB0C4', '#E0668A') + letterBubble(166, 46, 'B', '#9CD3F0', '#4F95C2') + letterBubble(176, 82, 'C', '#A8E6B8', '#4FA06A'),
  // 小楓：遊樂園樂隊 → 小鼓、小喇叭、音符、三角旗串
  maple: () => {
    const P0 = [24, 38], P1 = [100, 62], P2 = [176, 38];
    const at = t => [0, 1].map(i => (1 - t) ** 2 * P0[i] + 2 * t * (1 - t) * P1[i] + t * t * P2[i]);
    const cols = [['#FFB0C4', '#E0668A'], ['#FFE27A', '#D99A2B'], ['#A8E6B8', '#4FA06A'], ['#BBA8F2', '#7D68C2'], ['#9CD3F0', '#4F95C2']];
    let flags = '';
    for (let i = 0; i < 9; i++) {
      const t = (i + .5) / 9, [a1, b1] = at(t - .04), [a2, b2] = at(t + .04), [mx, my] = at(t), [f, l] = cols[i % 5];
      flags += `<path d="M${a1.toFixed(1)} ${b1.toFixed(1)} L${a2.toFixed(1)} ${b2.toFixed(1)} L${mx.toFixed(1)} ${(my + 15).toFixed(1)} Z" fill="${f}" stroke="${l}" stroke-width="1.6" ${SW}/>`;
    }
    return `<path d="M${P0} Q${P1} ${P2}" fill="none" stroke="#B98A64" stroke-width="1.6"/>` + flags +
      drumMini(42, 160, 1.15) + trumpetMini(156, 158, 1.15, -18) +
      noteAt(30, 104, 1, '#BBA8F2', '#7D68C2') + noteAt(170, 100, .9, '#FF9EB5', '#E0668A') + noteAt(180, 128, .7, '#9CD3F0', '#4F95C2');
  },
};

// ---- v1.2 貼紙小道具（自己畫，不依賴棋盤圖示） ----
const ROUND_FONT = `font-family="'Arial Rounded MT Bold','Hiragino Maru Gothic ProN','Varela Round',sans-serif" font-weight="800"`;
function bookMini(x, y, s = 1, rot = 0, c = '#9CD3F0', l = '#4F95C2') {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<rect x="-10" y="-12" width="24" height="28" rx="3" fill="#FFFDF6" stroke="#C9A77E" stroke-width="2"/>` +
    `<rect x="-13" y="-15" width="24" height="28" rx="3" fill="${c}" stroke="${l}" stroke-width="2.4"/>` +
    `<rect x="-13" y="-15" width="6" height="28" rx="2" fill="#FFB0C4" stroke="#E0668A" stroke-width="1.8"/>` +
    `<path d="${star5(2, -4, 5.4, 2.5)}" fill="#FFE27A" stroke="#D99A2B" stroke-width="1.2" ${SW}/>` +
    `<path d="M-3 6 H7" stroke="${l}" stroke-width="1.8" stroke-linecap="round"/></g>`;
}
function crayonMini(x, y, s = 1, rot = 0, c = '#FF9EB5', l = '#E0668A') {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M10 -4.6 L18 -1.2 Q19.6 0 18 1.2 L10 4.6 Z" fill="${c}" stroke="${l}" stroke-width="1.8" ${SW}/>` +
    `<rect x="-18" y="-5" width="29" height="10" rx="2.6" fill="${c}" stroke="${l}" stroke-width="2"/>` +
    `<path d="M-11 -5 L-9 -3 L-7 -5 L-5 -3 L-3 -5 L-1 -3 L1 -5 L3 -3 L5 -5 V5 L3 3 L1 5 L-1 3 L-3 5 L-5 3 L-7 5 L-9 3 L-11 5 Z" fill="#FFFDF6" stroke="${l}" stroke-width="1" stroke-linejoin="round"/>` +
    `<path d="M-15 -2.6 H-13" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></g>`;
}
function trumpetMini(x, y, s = 1, rot = 0) {
  const G = '#F6CF66', L = '#C98F1F';
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M-12 2 Q-12 9 -5 9 H3 Q8 9 8 3" fill="none" stroke="${L}" stroke-width="4.4"/><path d="M-12 2 Q-12 9 -5 9 H3 Q8 9 8 3" fill="none" stroke="${G}" stroke-width="2"/>` +
    `<rect x="-7" y="-9" width="3.4" height="8" rx="1.4" fill="${G}" stroke="${L}" stroke-width="1.2"/><rect x="-2" y="-9" width="3.4" height="8" rx="1.4" fill="${G}" stroke="${L}" stroke-width="1.2"/><rect x="3" y="-9" width="3.4" height="8" rx="1.4" fill="${G}" stroke="${L}" stroke-width="1.2"/>` +
    `<rect x="-20" y="-2" width="28" height="4.4" rx="2" fill="${G}" stroke="${L}" stroke-width="1.6"/>` +
    `<ellipse cx="-22" cy=".2" rx="1.8" ry="3.4" fill="${G}" stroke="${L}" stroke-width="1.2"/>` +
    `<path d="M6 -2.4 L18 -10 Q21 .2 18 10.4 L6 2.8 Z" fill="${G}" stroke="${L}" stroke-width="1.8" ${SW}/>` +
    `<ellipse cx="18.6" cy=".2" rx="2.8" ry="10" fill="#FFEDB3" stroke="${L}" stroke-width="1.6"/>` +
    `<path d="M-14 -1 H2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>` +
    bowAt(-12, 4, '#FF9EB5', '#E0668A', .4) + `</g>`;
}
function drumMini(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M-14 -24 L3 -9 M14 -26 L-2 -10" stroke="#C99A73" stroke-width="2.8" stroke-linecap="round"/><circle cx="-14" cy="-24" r="3" fill="#FF9EB5" stroke="#E0668A" stroke-width="1.4"/><circle cx="14" cy="-26" r="3" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.4"/>` +
    `<path d="M-20 -6 V12 Q0 20 20 12 V-6" fill="#FFB0C4" stroke="#E0668A" stroke-width="2.4"/>` +
    `<path d="M-17 -1 L-10 11 L-3 -1 L4 11 L11 -1 L17 9" fill="none" stroke="#FFF1C2" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M-20 11 Q0 19 20 11" fill="none" stroke="#F6CF66" stroke-width="3.2"/>` +
    `<ellipse cx="0" cy="-6" rx="20" ry="6" fill="#FFFDF6" stroke="#E0668A" stroke-width="2.4"/><ellipse cx="0" cy="-6" rx="17" ry="4.4" fill="none" stroke="#F6CF66" stroke-width="1.6"/></g>`;
}
function popcornMini(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<g fill="#FFF6D8" stroke="#E8C26A" stroke-width="1.6"><circle cx="-8" cy="-7" r="5"/><circle cx="-2" cy="-11" r="5"/><circle cx="5" cy="-9" r="5"/><circle cx="9" cy="-5" r="4.4"/><circle cx="1" cy="-5" r="4.6"/></g>` +
    `<path d="M-12 -5 L12 -5 L8.6 16 L-8.6 16 Z" fill="#FFFDF6" stroke="#E0668A" stroke-width="2.2" ${SW}/>` +
    `<path d="M-6.4 -5 L-4.6 16 M0 -5 V16 M6.4 -5 L4.6 16" stroke="#FF9EB5" stroke-width="3"/>` +
    `<path d="M-12 -5 L12 -5 L8.6 16 L-8.6 16 Z" fill="none" stroke="#E0668A" stroke-width="2.2" ${SW}/>` +
    `<path d="${star5(0, 5, 3.6, 1.6)}" fill="#FFE27A" stroke="#D99A2B" stroke-width=".8"/></g>`;
}
const appleMini = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">` +
  `<path d="M0 -5 Q-7 -8 -7 0 Q-7 8 0 7 Q7 8 7 0 Q7 -8 0 -5 Z" fill="#FF8FA8" stroke="#D9557E" stroke-width="2" ${SW}/>` +
  `<path d="M0 -5 Q0 -9 2 -11" fill="none" stroke="#9B6B47" stroke-width="1.8" stroke-linecap="round"/><path d="M2 -8.6 Q7 -12 8 -7 Q4 -6 2 -8.6 Z" fill="#7DD39A" stroke="#4FA06A" stroke-width=".8"/>` + dot(-3, -2, 1.4, .85) + `</g>`;
const letterBubble = (x, y, ch, c, l) => `<circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="${l}" stroke-width="2.2"/>` +
  `<text x="${x}" y="${y + 5}" text-anchor="middle" ${ROUND_FONT} font-size="14" fill="#fff" stroke="${l}" stroke-width="2.6" stroke-linejoin="round" paint-order="stroke">${ch}</text>` + dot(x - 5, y - 5, 1.6, .8);

function friendSticker(st) {
  const f = friendInfo(st.friend) || FRIENDS[0], ch = f.chapter, bg = CH_BG[ch] || CH_BG[1];
  if (st.kind === 'meet') {
    const inner = `<ellipse cx="100" cy="178" rx="100" ry="30" fill="${bg[1]}" opacity=".9"/>` +
      place(friendSVG(f.id, { expr: 'happy' }), 18, 46, 94, 103) +
      place(bearSVG({ expr: 'happy' }), 98, 54, 80, 95) +
      place(tileSVG((MEET_PROPS[ch] || MEET_PROPS[1])[0]), 62, 146, 28, 28) + place(tileSVG((MEET_PROPS[ch] || MEET_PROPS[1])[1]), 110, 148, 26, 26) +
      heartAt(100, 44, 9) + sparkleAt(46, 46, 6) + sparkleAt(160, 50, 5, '#FFF6D8', '#E8C26A') +
      `<path d="M28 86 Q22 80 26 74 M174 90 Q180 84 176 78" fill="none" stroke="#E8A0B4" stroke-width="2.4" stroke-linecap="round"/>`;
    return stickerShell(circleShape, inner, bg);
  }
  if (st.kind === 'like') {
    const inner = (LIKE_PROPS[f.id] ? LIKE_PROPS[f.id]() : '') + place(friendSVG(f.id, { expr: 'happy' }), 46, 34, 108, 119) +
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
  // 第 5 章：教室（黑板、書桌、繪本、蠟筆、蘋果）
  5: () => `<rect x="46" y="30" width="108" height="58" rx="7" fill="#D9A877" stroke="#9B6B47" stroke-width="3"/>` +
    `<rect x="52" y="36" width="96" height="46" rx="3.5" fill="#5F927E"/>` +
    `<text x="58" y="58" ${ROUND_FONT} font-size="17" fill="#FFFFFF" opacity=".93">ABC</text>` +
    `<text x="59" y="75" ${ROUND_FONT} font-size="10" fill="#FFE27A" opacity=".95">1+2=3</text>` +
    `<path d="${heartPath(134, 48, 6)}" fill="none" stroke="#FFB0C4" stroke-width="2" ${SW}/>` +
    `<path d="${star5(138, 70, 5, 2.2)}" fill="none" stroke="#A8E6B8" stroke-width="1.6" ${SW}/>` +
    `<rect x="48" y="87" width="104" height="5" rx="2.2" fill="#C99560" stroke="#9B6B47" stroke-width="1.8"/>` +
    `<rect x="58" y="84" width="11" height="3.6" rx="1.5" fill="#fff"/><rect x="72" y="84" width="8" height="3.6" rx="1.5" fill="#FFB0C4"/>` +
    // 書桌桌面
    `<path d="M0 154 Q100 148 200 154 V200 H0 Z" fill="#F2D3A6"/><path d="M0 154 Q100 148 200 154" fill="none" stroke="#B98552" stroke-width="3"/>` +
    `<path d="M0 164 Q100 158 200 164" fill="none" stroke="#E2BE8E" stroke-width="1.6"/>` +
    place(bearSVG({ expr: 'happy', outfit: { head: 'hat_schoolCap', clothes: 'cl_uniform' } }), 90, 62, 78, 91) +
    place(dogSVG({ expr: 'happy', outfit: { dogHead: 'dog_gradCap', collar: 'col_plaid' } }), 40, 104, 58, 54) +
    bookMini(70, 168, .9, -8, '#FFE27A', '#D99A2B') + crayonMini(112, 170, .85, -12, '#FF9EB5', '#E0668A') + crayonMini(132, 162, .75, 20, '#9CD3F0', '#4F95C2') +
    appleMini(146, 160, .95) +
    sparkleAt(36, 64, 5.5) + sparkleAt(166, 100, 5, '#FFF6D8', '#E8C26A'),
  // 第 6 章：遊樂園（摩天輪、串燈、條紋帳篷、棉花糖、爆米花）
  6: () => {
    const C = [142, 70], R = 38;
    const cabs = ['#FFB0C4', '#A8E6B8', '#FFD36E', '#BBA8F2', '#9CD3F0', '#FFB59A', '#FFB0C4', '#A8E6B8'];
    let spokes = '', cab = '';
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + .3, x = C[0] + Math.cos(a) * R, y = C[1] + Math.sin(a) * R;
      spokes += `M${C[0]} ${C[1]} L${x.toFixed(1)} ${y.toFixed(1)} `;
      cab += `<path d="M${(x - 7).toFixed(1)} ${(y + 2).toFixed(1)} H${(x + 7).toFixed(1)} L${(x + 6).toFixed(1)} ${(y + 11).toFixed(1)} Q${x.toFixed(1)} ${(y + 14).toFixed(1)} ${(x - 6).toFixed(1)} ${(y + 11).toFixed(1)} Z" fill="${cabs[i]}" stroke="${deep(cabs[i], .3)}" stroke-width="1.8" ${SW}/>`;
    }
    let lights = '';
    for (let i = 0; i <= 10; i++) { const t = i / 10, x = 10 + 180 * t, y = 26 + 116 * t * (1 - t); lights += `<circle cx="${x.toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="3" fill="${['#FFE27A', '#FF9EB5', '#A8E6B8', '#9CD3F0'][i % 4]}" stroke="#fff" stroke-width="1"/>`; }
    let tent = '';
    for (let i = 0; i < 6; i++) tent += `<path d="M44 52 L${18 + i * 9} 112 L${27 + i * 9} 112 Z" fill="${i % 2 ? '#FFF7EC' : '#FFB0C4'}"/>`;
    return `<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="none" stroke="#C9B8EE" stroke-width="4"/><circle cx="${C[0]}" cy="${C[1]}" r="${R - 12}" fill="none" stroke="#DCD0FA" stroke-width="2"/>` +
      `<path d="${spokes}" stroke="#C9B8EE" stroke-width="2"/>` + cab +
      `<path d="M142 70 L122 150 M142 70 L162 150" stroke="#9B87D9" stroke-width="4" stroke-linecap="round"/><circle cx="142" cy="70" r="5.4" fill="#FFD36E" stroke="#D99A2B" stroke-width="1.6"/>` +
      // 條紋帳篷
      tent + `<path d="M44 52 L18 112 H72 Z" fill="none" stroke="#E0668A" stroke-width="2.4" ${SW}/><path d="M44 52 V44" stroke="#C98F1F" stroke-width="1.8"/><path d="M44 44 L54 47 L44 50 Z" fill="#A8E6B8" stroke="#4FA06A" stroke-width="1.2" ${SW}/>` +
      `<path d="M36 112 Q44 96 52 112 Z" fill="#E0668A" opacity=".55"/>` +
      // 串燈
      `<path d="M10 26 Q100 84 190 26" fill="none" stroke="#B98A64" stroke-width="1.4"/>` + lights +
      // 地面
      `<path d="M0 150 Q100 138 200 150 V200 H0 Z" fill="#FFE4EB"/><path d="M0 150 Q100 138 200 150" fill="none" stroke="#F29AB4" stroke-width="2"/>` +
      [[30, 170], [70, 182], [120, 176], [170, 168]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff" opacity=".9"/>`).join('') +
      place(bearSVG({ expr: 'happy', outfit: { head: 'hat_parkHeadband', hand: 'hd_cottonCandy' } }), 62, 50, 82, 96) +
      place(dogSVG({ expr: 'lick', outfit: { dogHead: 'dog_partyHat', collar: 'col_bowtie' } }), 34, 108, 58, 54) +
      popcornMini(142, 158, .95, 8) +
      sparkleAt(170, 120, 5, '#FFF6D8', '#E8C26A') + sparkleAt(28, 84, 5);
  },
};

export function stickerSVG(stickerId) {
  const st = STICKERS.find(s => s.id === stickerId) || STICKERS[0];
  if (st.kind === 'bear') {
    const ch = BEAR_STICKER[st.chapter] ? st.chapter : 1;
    return svg(stickerShell(scallopShape(), BEAR_STICKER[ch](), CH_BG[st.chapter] || CH_BG[ch]), '0 0 200 200');
  }
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
