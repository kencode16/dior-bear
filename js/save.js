// 存檔（主代理擁有）。資料放 localStorage；Safari 讀寫可能丟例外，全部包 try/catch。
import { TOTAL_LEVELS, LEVELS_PER_CHAPTER, HARD_UNLOCK_LEVEL, chapterOfLevel } from './config.js';
import { BEAR_ITEMS, DOG_ITEMS, FURNITURE, PERFUMES, STICKERS, ALL_SHOP_ITEMS, itemById } from './data/items.js';

const KEY = 'dior-bear-save-v1';

function fresh() {
  const equipped = {};
  for (const it of [...BEAR_ITEMS, ...DOG_ITEMS]) if (it.default) equipped[it.slot] = it.id;
  return {
    v: 1,
    levels: {},                 // { [levelId]: { stars: 0-3, best: 分數 } }，只記錄通過的關
    hard: {},                   // v1.2 困難模式：格式同 levels
    rewarded: [],               // v1.2 已發過的金色限定 id
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

// v1.2：困難模式金色限定。已在 data.rewarded 記過的不重複提示
function claimRewards() {
  if (!data.rewarded) data.rewarded = [];
  const got = [];
  for (const it of [...ALL_SHOP_ITEMS.filter(i => i.reward), ...PERFUMES.filter(p => p.unlock.hardChapter)]) {
    if (data.rewarded.includes(it.id) || !save.rewardEarned(it)) continue;
    data.rewarded.push(it.id);
    if (it.reward && !data.owned.includes(it.id)) data.owned.push(it.id);
    got.push(it.id);
  }
  return got;
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
  // v1.2：困難模式拿到的星星也可以拿去買東西
  starsEarned: () => [...Object.values(data.levels), ...Object.values(data.hard || {})].reduce((s, l) => s + l.stars, 0),
  starsSpent: () => data.spent,
  starsAvailable: () => save.starsEarned() - data.spent,
  chapterStars(ch) {
    let s = 0;
    for (let i = (ch - 1) * LEVELS_PER_CHAPTER + 1; i <= ch * LEVELS_PER_CHAPTER; i++) s += save.levelStars(i);
    return s;
  },
  /** 目前可以玩的最高關（通過的最高關 + 1，最多 TOTAL_LEVELS） */
  unlockedLevel() {
    let n = 1;
    while (n < TOTAL_LEVELS && save.isCleared(n)) n++;
    return n;
  },
  maxChapter: () => chapterOfLevel(save.unlockedLevel()),

  // ---- 困難模式（v1.2）：普通版第 HARD_UNLOCK_LEVEL 關過關後開放；第 N 關困難版要「普通版第 N 關已過」且「困難版第 N−1 關已過」 ----
  hardUnlocked: () => save.isCleared(HARD_UNLOCK_LEVEL),
  hardStars: id => data.hard[id]?.stars || 0,
  hardBest: id => data.hard[id]?.best || 0,
  isHardCleared: id => (data.hard[id]?.stars || 0) > 0,
  canPlayHard: id => save.hardUnlocked() && id >= 1 && id <= TOTAL_LEVELS && save.isCleared(id) && (id === 1 || save.isHardCleared(id - 1)),
  /** 困難模式目前進行到第幾關（第一個還沒過的困難關；全過回傳 TOTAL_LEVELS） */
  unlockedHardLevel() {
    let n = 1;
    while (n < TOTAL_LEVELS && save.isHardCleared(n)) n++;
    return n;
  },
  hardChapterStars(ch) {
    let s = 0;
    for (let i = (ch - 1) * LEVELS_PER_CHAPTER + 1; i <= ch * LEVELS_PER_CHAPTER; i++) s += save.hardStars(i);
    return s;
  },
  hardChapterCleared(ch) {
    for (let i = (ch - 1) * LEVELS_PER_CHAPTER + 1; i <= ch * LEVELS_PER_CHAPTER; i++) if (!save.isHardCleared(i)) return false;
    return true;
  },
  /** 回報困難版結果；回傳 { firstClear, newStars, newBest, rewards:[新拿到的金色限定 id] } */
  recordHard(id, stars, score) {
    const prev = data.hard[id] || { stars: 0, best: 0 };
    const res = { firstClear: prev.stars === 0 && stars > 0, newStars: Math.max(0, stars - prev.stars), newBest: score > prev.best };
    if (stars > 0) data.hard[id] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, score) };
    res.rewards = claimRewards();
    persist();
    return res;
  },
  /** 金色限定是否已達成（香水看 unlock.hardChapter，其他看 reward.hardChapter） */
  rewardEarned: it => !!(it && (it.reward?.hardChapter || it.unlock?.hardChapter) && save.hardChapterCleared(it.reward?.hardChapter || it.unlock?.hardChapter)),
  /** 把已達成的金色限定加進擁有清單；回傳這次新加的 id（香水不進 owned，由 perfumeUnlocked 判斷，但也會回傳給畫面提示） */
  claimRewards: () => { const r = claimRewards(); if (r.length) persist(); return r; },

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
  perfumeUnlocked: p => !!(p.unlock.start || (p.unlock.level && save.isCleared(p.unlock.level)) || (p.unlock.hardChapter && save.hardChapterCleared(p.unlock.hardChapter))),
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
      claimRewards();
      persist();
      return true;
    } catch (e) { return false; }
  },
  reset() { data = fresh(); persist(); },
};
