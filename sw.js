// Service worker（F 擁有）：網路優先、失敗（或 3 秒沒回應）才用快取，開發中不會卡舊檔；
// 筆電沒開伺服器時，iPhone 主畫面上的遊戲仍可用快取離線玩。
// ⚠ 新增遊戲檔案時，請把路徑加進 PRECACHE（沒加的檔案第一次載入後也會被執行期快取，但離線首次啟動可能缺檔）。
// ⚠ 改了快取策略或想強制清快取時，把 VERSION 加 1。
const VERSION = 'v4';   // v1.2（第 5、6 章＋困難模式）
const CACHE = `dior-bear-${VERSION}`;
const PRECACHE = [
  './', 'index.html', 'manifest.webmanifest',
  'css/base.css', 'css/chars.css', 'css/game.css', 'css/ui.css',
  'js/main.js', 'js/config.js', 'js/save.js', 'js/audio.js', 'js/timeOfDay.js',
  'js/data/items.js', 'js/data/levels.js', 'js/data/story.js',
  'js/art/common.js', 'js/art/sky.js', 'js/art/tiles.js', 'js/art/chars.js', 'js/art/collections.js',
  'js/engine/engine.js',
  'js/game/gameScreen.js', 'js/game/boardView.js', 'js/game/fx.js', 'js/game/sprites.js',
  'js/ui/charactersView.js', 'js/ui/dialog.js', 'js/ui/home.js', 'js/ui/map.js', 'js/ui/wardrobe.js',
  'js/ui/decorate.js', 'js/ui/perfume.js', 'js/ui/stickers.js', 'js/ui/settings.js',
  'js/ui/house.js', 'js/ui/uikit.js',
  'assets/sounds/bark.m4a', 'assets/sounds/CREDITS.txt',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // 逐一加入：某個檔案不存在也不會讓整個安裝失敗
    await Promise.all(PRECACHE.map(p => cache.add(new Request(p, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('dior-bear-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const res = await Promise.race([fetch(req, { cache: 'no-store' }), timeout(3000)]);
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const home = await cache.match('index.html') || await cache.match('./');
        if (home) return home;
      }
      throw err;
    }
  })());
});
