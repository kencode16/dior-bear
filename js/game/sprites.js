// 圖像快取（C 擁有）：把美術模組的 SVG 字串轉成點陣圖（offscreen canvas），棋盤每幀只做 drawImage。
// 快取鍵＝key＋像素大小；尺寸改變（旋轉、縮放）時會自動重新點陣化。

const cache = new Map();      // `${key}@${w}x${h}` → { canvas, ready, promise }

function withSize(svgStr, w, h) {
  let s = String(svgStr).trim();
  if (!/xmlns=/.test(s.slice(0, 200))) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  // Safari 要有明確的 width/height 才會照大小點陣化
  s = s.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    attrs = attrs.replace(/\s(width|height)="[^"]*"/g, '');
    return `<svg${attrs} width="${w}" height="${h}">`;
  });
  return s;
}

/**
 * 取得某個圖的點陣版本。factory() 回傳 SVG 字串（只在第一次需要時呼叫）。
 * 回傳 { canvas, ready }；ready 為 false 時畫面應該畫替代圖形。
 */
export function sprite(key, factory, w, h = w) {
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  const ck = `${key}@${w}x${h}`;
  let e = cache.get(ck);
  if (e) return e;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  e = { canvas, ready: false, promise: null };
  cache.set(ck, e);
  let svgStr = '';
  try { svgStr = factory(); } catch (err) { console.error('美術產生失敗', key, err); }
  e.promise = new Promise(resolve => {
    if (!svgStr) { resolve(e); return; }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      try {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        e.ready = true;
      } catch (err) { console.error('點陣化失敗', key, err); }
      resolve(e);
    };
    img.onerror = () => { console.error('SVG 載入失敗', key); resolve(e); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(withSize(svgStr, w, h));
  });
  return e;
}

/** 等一批圖都點陣化好 */
export function whenReady(entries) {
  return Promise.all(entries.map(e => e.promise));
}

/** 尺寸改變後丟掉舊快取，避免記憶體越長越大 */
export function purgeExcept(sizeTag) {
  for (const k of cache.keys()) if (!k.endsWith(sizeTag)) cache.delete(k);
}

/** SVG 字串 → 可放進 DOM 的元素（HUD 小圖示用） */
export function svgEl(svgStr, cls = '') {
  const span = document.createElement('span');
  if (cls) span.className = cls;
  span.innerHTML = svgStr;
  return span;
}
