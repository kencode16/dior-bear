// 天空裝飾（主代理擁有）：四個時段的太陽、雲、晚霞、月亮、星星。
// 回傳 HTML 字串，放進 .tod-layer（見 css/base.css 的 .tod-*）。裝飾用百分比定位，手機電腦都適用。
import { INK, uid } from './common.js';

const svg = (inner, vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${inner}</svg>`;

/** Q 版太陽：圓臉、瞇眼笑、腮紅、外圈光芒 */
function sunSVG({ glow = '#FFE9A6', body = '#FFD45C', edge = '#F2A93B', sleepy = false } = {}) {
  const g = uid('sun');
  let rays = '';
  for (let i = 0; i < 12; i++) {
    const a = i * 30;
    rays += `<path d="M100 14 L108 34 Q100 38 92 34 Z" fill="${body}" opacity=".85" transform="rotate(${a} 100 100)"/>`;
  }
  const eyes = sleepy
    ? `<path d="M78 98 Q84 104 90 98" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M110 98 Q116 104 122 98" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`
    : `<path d="M78 100 Q84 92 90 100" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M110 100 Q116 92 122 100" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
  return svg(
    `<defs><radialGradient id="${g}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#FFF6CF"/><stop offset=".55" stop-color="${body}"/><stop offset="1" stop-color="${edge}"/></radialGradient></defs>` +
    `<circle cx="100" cy="100" r="94" fill="${glow}" opacity=".35"/>` +
    `<g class="tod-rays">${rays}</g>` +
    `<circle cx="100" cy="100" r="56" fill="url(#${g})" stroke="${edge}" stroke-width="4"/>` +
    `<ellipse cx="82" cy="78" rx="14" ry="9" fill="#fff" opacity=".55" transform="rotate(-30 82 78)"/>` +
    eyes +
    `<ellipse cx="72" cy="114" rx="9" ry="5.5" fill="#FF7D8F" opacity=".45"/><ellipse cx="128" cy="114" rx="9" ry="5.5" fill="#FF7D8F" opacity=".45"/>` +
    `<path d="M93 112 Q100 120 107 112" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>`,
    '0 0 200 200');
}

/** Q 版彎月：睡覺的臉＋小睡帽 */
function moonSVG() {
  const g = uid('moon');
  return svg(
    `<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#FFF8D8"/><stop offset="1" stop-color="#FFE08A"/></radialGradient></defs>` +
    `<circle cx="100" cy="100" r="92" fill="#FFF3C4" opacity=".16"/>` +
    `<path d="M128 30 A72 72 0 1 0 150 150 A58 58 0 1 1 128 30 Z" fill="url(#${g})" stroke="#E9B95A" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M76 98 Q82 104 88 98" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<ellipse cx="74" cy="112" rx="8" ry="5" fill="#FF8FA3" opacity=".45"/>` +
    `<path d="M84 122 Q90 126 96 121" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    // 小睡帽
    `<path d="M70 52 Q92 22 128 30 Q112 40 108 58 Z" fill="#9C8BE0" stroke="#7463C2" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M66 56 Q88 46 110 60" fill="none" stroke="#FFF" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="130" cy="30" r="7" fill="#FFF" stroke="#D7D0F2" stroke-width="2"/>`,
    '0 0 200 200');
}

function cloudSVG(fill, edge) {
  return svg(
    `<path d="M30 70 Q14 70 14 56 Q14 42 30 42 Q32 22 54 22 Q70 8 88 22 Q112 16 118 38 Q136 40 136 56 Q136 70 120 70 Z" fill="${fill}" stroke="${edge}" stroke-width="3" stroke-linejoin="round"/>` +
    `<ellipse cx="48" cy="40" rx="12" ry="6" fill="#fff" opacity=".6"/>`,
    '0 0 150 80');
}

function starSVG(fill) {
  return svg(`<path d="M20 2 Q23 17 38 20 Q23 23 20 38 Q17 23 2 20 Q17 17 20 2 Z" fill="${fill}"/>`, '0 0 40 40');
}

function birdsSVG() {
  return svg(`<path d="M4 14 Q12 4 20 12 Q28 4 36 14" fill="none" stroke="#8E5A6A" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M44 6 Q50 0 56 5 Q62 0 68 6" fill="none" stroke="#8E5A6A" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`, '0 0 72 20');
}

// 固定位置的星星（不用亂數，每次畫面一樣）
const STARS = [[6, 8, 1], [18, 22, .7], [30, 6, .8], [44, 16, .6], [58, 4, 1], [70, 18, .7], [86, 10, .9], [94, 26, .6],
  [10, 34, .6], [26, 44, .8], [52, 30, .5], [78, 38, .7], [90, 48, .6], [4, 58, .7], [38, 60, .5], [64, 54, .6], [84, 66, .5], [16, 76, .6], [50, 82, .5], [92, 86, .6]];

/** 某個時段的天空內容（不含底色漸層，漸層由 CSS 依 data-period 給） */
export function skyLayerHTML(period) {
  const at = (cls, css, inner) => `<div class="${cls}" style="${css}">${inner}</div>`;
  switch (period) {
    case 'morning':
      return at('tod-sun', 'right:5%;top:2%;width:clamp(96px,26vw,190px)', sunSVG()) +
        at('tod-cloud', 'left:4%;top:10%;width:clamp(70px,20vw,150px)', cloudSVG('#FFFFFF', '#F1E2CF')) +
        at('tod-cloud slow', 'left:52%;top:24%;width:clamp(50px,14vw,110px);opacity:.85', cloudSVG('#FFFFFF', '#F1E2CF'));
    case 'day':
      return at('tod-sun', 'right:9%;top:7%;width:clamp(76px,20vw,150px)', sunSVG({ glow: '#FFF3C9' })) +
        at('tod-cloud', 'left:2%;top:6%;width:clamp(80px,24vw,170px)', cloudSVG('#FFFFFF', '#D6E6F2')) +
        at('tod-cloud slow', 'left:40%;top:18%;width:clamp(60px,17vw,130px)', cloudSVG('#FFFFFF', '#D6E6F2')) +
        at('tod-cloud', 'right:2%;top:30%;width:clamp(50px,13vw,100px);opacity:.8', cloudSVG('#FFFFFF', '#D6E6F2'));
    case 'dusk':
      return at('tod-glow', 'left:-10%;top:-6%;width:70%;height:42%', '') +
        at('tod-sun dusk', 'left:6%;top:6%;width:clamp(90px,24vw,180px)', sunSVG({ glow: '#FFC59A', body: '#FFA66B', edge: '#E9774A', sleepy: true })) +
        at('tod-cloud', 'right:6%;top:8%;width:clamp(76px,22vw,160px)', cloudSVG('#FFD3DD', '#E9A2B6')) +
        at('tod-cloud slow', 'left:44%;top:22%;width:clamp(56px,15vw,120px)', cloudSVG('#FFE0C8', '#EDB28E')) +
        at('tod-birds', 'right:24%;top:24%;width:clamp(40px,10vw,70px)', birdsSVG());
    case 'night':
    default:
      return STARS.map(([x, y, s], i) => at(`tod-star${i % 3 === 0 ? ' t2' : i % 3 === 1 ? ' t3' : ''}`,
        `left:${x}%;top:${y}%;width:${Math.round(10 + s * 12)}px`, starSVG(i % 4 === 0 ? '#FFF3B8' : '#FFFFFF'))).join('') +
        at('tod-moon', 'right:6%;top:3%;width:clamp(86px,24vw,170px)', moonSVG()) +
        at('tod-cloud slow', 'left:6%;top:16%;width:clamp(60px,18vw,130px);opacity:.35', cloudSVG('#8D86C9', '#6E67AE'));
  }
}
