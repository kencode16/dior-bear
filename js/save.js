// 存檔（主代理擁有）。資料放 localStorage；Safari 讀寫可能丟例外，全部包 try/catch。
import { TOTAL_LEVELS, LEVELS_PER_CHAPTER, chapterOfLevel } from './config.js';
import { BEAR_ITEMS, DOG_ITEMS, FURNITURE, PERFUMES, STICKERS, itemById } from './data/items.js';

const KEY = 'dior-bear-save-v1';

function fresh() {
  const equipped = {};
  for (const it of [...BEAR_ITEMS, ...DOG_ITEMS]) if (it.default) equipped[it.slot] = it.id;
  return {
    v: 1,
    levels: {},                 // { [levelId]: { stars: 0-3, best: 分數 } }，只記錄通過的關
    spent: 0,                   // 已花掉的星星
    owned: [...BEAR_ITEMS, ...DOG_ITEMS, ...FURNITURE].filter(i => i.default).map(i => i.id),
    equipped,                   // { head, ribbon, clothes, hand, dogHead, collar }：值為 item id 或 undefined
    house: {},                  // { [slotId]: furniture id }
    perfume: 'p0',              // 今天噴的香水
    seen: {},                   // 看過的劇情 / 新解鎖提示：{ ch1_intro: true, ... }
    settings: { sfx: true, music: true },
  };
}

let data = fresh();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) data = { ...fresh(), ...JSON.parse(raw) };
} catch (e) { /* 讀不到就用新存檔 */ }

const listeners = new Set();
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 無痕模式等 */ }
  listeners.forEach(fn => { try { fn(data); } catch (e) { console.error(e); } });
}

export const save = {
  get: () => data,
  update(fn) { fn(data); persist(); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  // ---- 關卡與星星 ----
  levelStars: id => data.levels[id]?.stars || 0,
  levelBest: id => data.levels[id]?.best || 0,
  isCleared: id => (data.levels[id]?.stars || 0) > 0,
  /** 回報一關結果；回傳 { firstClear, newStars（本次多拿的星星數）, newBest } */
  recordLevel(id, stars, score) {
    const prev = data.levels[id] || { stars: 0, best: 0 };
    const res = { firstClear: prev.stars === 0 && stars > 0, newStars: Math.max(0, stars - prev.stars), newBest: score > prev.best };
    if (stars > 0) data.levels[id] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, score) };
    persist();
    return res;
  },
  starsEarned: () => Object.values(data.levels).reduce((s, l) => s + l.stars, 0),
  starsSpent: () => data.spent,
  starsAvailable: () => save.starsEarned() - data.spent,
  chapterStars(ch) {
    let s = 0;
    for (let i = (ch - 1) * LEVELS_PER_CHAPTER + 1; i <= ch * LEVELS_PER_CHAPTER; i++) s += save.levelStars(i);
    return s;
  },
  /** 目前可以玩的最高關（通過的最高關 + 1，最多 40） */
  unlockedLevel() {
    let n = 1;
    while (n < TOTAL_LEVELS && save.isCleared(n)) n++;
    return n;
  },
  maxChapter: () => chapterOfLevel(save.unlockedLevel()),

  // ---- 商店 ----
  isOwned: id => data.owned.includes(id),
  canBuy(id) {
    const it = itemById(id);
    return !!it && it.price != null && !save.isOwned(id) && it.chapter <= save.maxChapter() && save.starsAvailable() >= it.price;
  },
  /** 買東西；成功回傳 true */
  buy(id) {
    if (!save.canBuy(id)) return false;
    data.spent += itemById(id).price;
    data.owned.push(id);
    persist();
    return true;
  },
  /** 換裝：slot 為 head/ribbon/clothes/hand/dogHead/collar；id 為 null 表示脫掉（ribbon、collar 不能脫） */
  equip(slot, id) {
    if (id && !save.isOwned(id)) return false;
    if (!id && (slot === 'ribbon' || slot === 'collar')) return false;
    data.equipped[slot] = id || undefined;
    persist();
    return true;
  },
  equipped: () => ({ ...data.equipped }),
  /** 擺家具：id 為 null 表示收起來 */
  place(slot, id) {
    if (id && !save.isOwned(id)) return false;
    data.house[slot] = id || undefined;
    persist();
    return true;
  },
  house: () => ({ ...data.house }),

  // ---- 香水與圖鑑 ----
  perfumeUnlocked: p => !!(p.unlock.start || (p.unlock.level && save.isCleared(p.unlock.level))),
  perfumesUnlocked: () => PERFUMES.filter(save.perfumeUnlocked).map(p => p.id),
  setPerfume(id) { if (save.perfumesUnlocked().includes(id)) { data.perfume = id; persist(); } },
  perfume: () => data.perfume,
  stickerUnlocked(st) {
    const u = st.unlock;
    if (u.level) return save.isCleared(u.level);
    if (u.chapterStars) return save.chapterStars(u.chapterStars.ch) >= u.chapterStars.min;
    return false;
  },
  stickersUnlocked: () => STICKERS.filter(save.stickerUnlocked).map(s => s.id),

  // ---- 其他 ----
  seen: key => !!data.seen[key],
  markSeen(key) { data.seen[key] = true; persist(); },
  settings: () => data.settings,
  setSetting(k, v) { data.settings[k] = v; persist(); },

  /** 備份碼：JSON → UTF-8 → base64 */
  exportCode() {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
    return btoa(bin);
  },
  importCode(code) {
    try {
      const bin = atob(String(code).trim());
      const obj = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
      if (!obj || obj.v !== 1 || typeof obj.levels !== 'object') return false;
      data = { ...fresh(), ...obj };
      persist();
      return true;
    } catch (e) { return false; }
  },
  reset() { data = fresh(); persist(); },
};
