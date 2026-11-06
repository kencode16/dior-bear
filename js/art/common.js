// 共用繪圖小工具（主代理擁有，取自 style/index_v2.html 風格試作）。所有美術模組共用，畫風才一致。
// 慣例：物件圖示 viewBox 0 0 100 100；描邊用同色系較深色、不用純黑；臉用 face()；左上加 shine() 亮面。
export const INK = '#5A3A2E';
export const SW = 'stroke-linejoin="round" stroke-linecap="round"';

/** Q 版小臉：豆豆眼＋眼睛亮點＋腮紅＋小嘴。(x,y) 是兩眼中點，s 是縮放 */
export function face(x, y, s = 1) {
  const ex = 10 * s, rx = 4.2 * s, ry = 5.2 * s, h = 1.6 * s;
  return `<g class="eyes"><ellipse cx="${x - ex}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/><ellipse cx="${x + ex}" cy="${y}" rx="${rx}" ry="${ry}" fill="${INK}"/>` +
    `<circle cx="${x - ex + 1.4 * s}" cy="${y - 1.9 * s}" r="${h}" fill="#fff"/><circle cx="${x + ex + 1.4 * s}" cy="${y - 1.9 * s}" r="${h}" fill="#fff"/></g>` +
    `<ellipse cx="${x - 16.5 * s}" cy="${y + 6 * s}" rx="${5.4 * s}" ry="${3.3 * s}" fill="#FF6F92" opacity=".45"/>` +
    `<ellipse cx="${x + 16.5 * s}" cy="${y + 6 * s}" rx="${5.4 * s}" ry="${3.3 * s}" fill="#FF6F92" opacity=".45"/>` +
    `<path d="M${x - 3.6 * s} ${y + 5.4 * s} Q${x} ${y + 9.6 * s} ${x + 3.6 * s} ${y + 5.4 * s}" fill="none" stroke="${INK}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
}
export const shine = (cx, cy, rx, ry, rot = 0, op = .62) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
export const dot = (cx, cy, r, op = .8) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity="${op}"/>`;
export const shadow = (cx = 50, cy = 94, rx = 27) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="4.2" fill="#B98A64" opacity=".2"/>`;
export function sparkle(cx, cy, R) {
  const k = R * .2;
  return `M${cx} ${cy - R} Q${cx + k} ${cy - k} ${cx + R} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + R} Q${cx - k} ${cy + k} ${cx - R} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - R} Z`;
}
export function star5(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); }
  return d + 'Z';
}
export function hexPath(cx, cy, R) {
  let d = '';
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * R).toFixed(1) + ' ' + (cy + Math.sin(a) * R).toFixed(1); }
  return d + 'Z';
}
/** 愛心路徑，(cx,cy) 中心、s 大小 */
export function heartPath(cx, cy, s) {
  return `M${cx} ${cy + s * .9} C${cx - s * 1.4} ${cy} ${cx - s * .9} ${cy - s * 1.1} ${cx} ${cy - s * .35} C${cx + s * .9} ${cy - s * 1.1} ${cx + s * 1.4} ${cy} ${cx} ${cy + s * .9} Z`;
}
/** 包成完整 SVG 字串 */
export const svg = (inner, vb = '0 0 100 100', extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${extra}>${inner}</svg>`;

/** 每個 SVG 內的漸層 id 必須唯一（同頁多個 SVG 會互相覆蓋）。用這個產生 */
let _uid = 0;
export const uid = (p = 'g') => `${p}${++_uid}`;
