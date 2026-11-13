// 收集品資料（主代理擁有）：換裝、大不溜造型、家具、香水、熊朋友、貼紙。
// 美術子代理依 id 畫圖；介面子代理依這裡的欄位做商店與解鎖。要改價格或加項目請在回報中提出。
// chapter：從第幾章開始在商店出現（玩家「已解鎖的最高章」>= chapter 才看得到）。
// price：星星。default:true 的是一開始就擁有、免費、預設穿著。
// v1.2：reward:{hardChapter:N} 的是困難模式第 N 章 10 關全破送的金色限定，price 為 null（不能買，達成就自動擁有，見 save.claimRewards）。

// ---------- 丁噹熊換裝 ----------
// 部位：head 頭上、ribbon 緞帶與鈴鐺、clothes 衣服、hand 左手拿的東西（右手固定拿香水瓶）
export const BEAR_SLOTS = [
  { id: 'head',    name: '頭上' },
  { id: 'ribbon',  name: '緞帶鈴鐺' },
  { id: 'clothes', name: '衣服' },
  { id: 'hand',    name: '手上' },
];
export const BEAR_ITEMS = [
  { id: 'hat_berryClip',   slot: 'head', name: '草莓髮夾', price: 2, chapter: 1 },
  { id: 'hat_beanie',      slot: 'head', name: '毛線帽',   price: 3, chapter: 2 },
  { id: 'hat_beret',       slot: 'head', name: '貝雷帽',   price: 4, chapter: 2 },
  { id: 'hat_flowerCrown', slot: 'head', name: '花圈',     price: 4, chapter: 3 },
  { id: 'hat_strawHat',    slot: 'head', name: '小草帽',   price: 3, chapter: 4 },
  { id: 'hat_schoolCap',   slot: 'head', name: '學生小黃帽', price: 4, chapter: 5 },
  { id: 'hat_parkHeadband', slot: 'head', name: '遊樂園髮箍', price: 4, chapter: 6 },
  { id: 'hat_goldTiara',   slot: 'head', name: '金色小皇冠', price: null, chapter: 1, reward: { hardChapter: 4 } },

  { id: 'rib_pink',     slot: 'ribbon', name: '粉紅緞帶',   price: 0, chapter: 1, default: true },
  { id: 'rib_mint',     slot: 'ribbon', name: '薄荷緞帶',   price: 1, chapter: 1 },
  { id: 'rib_lavender', slot: 'ribbon', name: '薰衣草緞帶', price: 1, chapter: 1 },
  { id: 'rib_honey',    slot: 'ribbon', name: '蜂蜜黃緞帶', price: 2, chapter: 2 },
  { id: 'rib_heartBell', slot: 'ribbon', name: '愛心鈴鐺',  price: 3, chapter: 2 },
  { id: 'rib_starBell', slot: 'ribbon', name: '星星鈴鐺',   price: 4, chapter: 3 },
  { id: 'rib_goldBell', slot: 'ribbon', name: '金色大鈴鐺', price: null, chapter: 1, reward: { hardChapter: 1 } },

  { id: 'cl_apron',      slot: 'clothes', name: '小圍裙',   price: 2, chapter: 1 },
  { id: 'cl_overalls',   slot: 'clothes', name: '吊帶褲',   price: 3, chapter: 2 },
  { id: 'cl_raincoat',   slot: 'clothes', name: '雨衣',     price: 3, chapter: 2 },
  { id: 'cl_pajamas',    slot: 'clothes', name: '睡衣',     price: 4, chapter: 3 },
  { id: 'cl_travelVest', slot: 'clothes', name: '旅行背心', price: 4, chapter: 4 },
  { id: 'cl_uniform',    slot: 'clothes', name: '水手服',   price: 5, chapter: 5 },

  { id: 'hd_honeySpoon', slot: 'hand', name: '蜂蜜湯匙', price: 1, chapter: 1 },
  { id: 'hd_bouquet',    slot: 'hand', name: '小花束',   price: 2, chapter: 2 },
  { id: 'hd_balloon',    slot: 'hand', name: '氣球',     price: 3, chapter: 3 },
  { id: 'hd_camera',     slot: 'hand', name: '相機',     price: 4, chapter: 4 },
  { id: 'hd_cottonCandy', slot: 'hand', name: '棉花糖',  price: 4, chapter: 6 },
];

// ---------- 大不溜造型（杜賓犬，沒有頭髮） ----------
export const DOG_SLOTS = [
  { id: 'dogHead', name: '頭上臉上' },
  { id: 'collar',  name: '項圈' },
];
export const DOG_ITEMS = [
  { id: 'dog_sunglasses', slot: 'dogHead', name: '小墨鏡',     price: 2, chapter: 1 },
  { id: 'dog_cap',        slot: 'dogHead', name: '反戴棒球帽', price: 3, chapter: 2 },
  { id: 'dog_bandana',    slot: 'dogHead', name: '頭巾',       price: 2, chapter: 3 },
  { id: 'dog_crown',      slot: 'dogHead', name: '小皇冠',     price: 5, chapter: 4 },
  { id: 'dog_gradCap',    slot: 'dogHead', name: '博士帽',     price: 4, chapter: 5 },
  { id: 'dog_partyHat',   slot: 'dogHead', name: '派對帽',     price: 4, chapter: 6 },
  { id: 'dog_goldShades', slot: 'dogHead', name: '金框墨鏡',   price: null, chapter: 1, reward: { hardChapter: 5 } },

  { id: 'col_pink',    slot: 'collar', name: '粉紅愛心項圈', price: 0, chapter: 1, default: true },
  { id: 'col_plaid',   slot: 'collar', name: '紅格紋項圈',   price: 1, chapter: 1 },
  { id: 'col_bowtie',  slot: 'collar', name: '蝴蝶結領結',   price: 2, chapter: 2 },
  { id: 'col_pearls',  slot: 'collar', name: '珍珠項鍊',     price: 3, chapter: 3 },
  { id: 'col_goldChain', slot: 'collar', name: '小金鍊',     price: 4, chapter: 4 },
  { id: 'col_goldBone',  slot: 'collar', name: '金骨頭項圈', price: null, chapter: 1, reward: { hardChapter: 2 } },
];

// ---------- 樹洞小屋 ----------
// 小屋場景座標系：viewBox 0 0 360 480（直向）。背牆 y 0–300，地板 300–480。
// 每個位置的家具 SVG 要畫成 viewBox="0 0 w h"，由介面放到 (x,y) 位置、大小 w×h。
// vanity（梳妝台）固定擺著、不能買，香水瓶由介面排在 VANITY_SHELF 範圍內。
// duo 是丁噹熊和大不溜站的位置。窗戶畫在背景裡，位置 WINDOW。
export const HOUSE_VIEWBOX = { w: 360, h: 480 };
export const WINDOW = { x: 210, y: 70, w: 110, h: 100 };
export const HOUSE_SLOTS = [
  { id: 'lamp',    name: '燈',       x: 150, y: 0,   w: 60,  h: 100 },
  { id: 'wall',    name: '牆上掛飾', x: 40,  y: 70,  w: 110, h: 80 },
  { id: 'curtain', name: '窗簾',     x: 196, y: 56,  w: 138, h: 130 },
  { id: 'bed',     name: '床',       x: 200, y: 196, w: 150, h: 134 },
  { id: 'table',   name: '桌椅',     x: 240, y: 346, w: 110, h: 84 },
  { id: 'rug',     name: '地毯',     x: 70,  y: 395, w: 220, h: 70 },
  { id: 'plant',   name: '植物',     x: 8,   y: 346, w: 52,  h: 92 },
];
export const VANITY = { x: 16, y: 190, w: 110, h: 140 };
export const VANITY_SHELF = { x: 26, y: 200, w: 90, h: 44 };
export const DUO_SPOT = { x: 110, y: 290, w: 140, h: 180 };

export const FURNITURE = [
  { id: 'f_rug_round',  slot: 'rug', name: '圓形編織地毯', price: 1, chapter: 1 },
  { id: 'f_rug_heart',  slot: 'rug', name: '愛心地毯',     price: 2, chapter: 2 },
  { id: 'f_rug_quilt',  slot: 'rug', name: '菱格絎縫地毯', price: 3, chapter: 3 },
  { id: 'f_rug_abc',    slot: 'rug', name: '字母拼圖地墊', price: 3, chapter: 5 },

  { id: 'f_bed_leaf',   slot: 'bed', name: '葉子小床',   price: 2, chapter: 1 },
  { id: 'f_bed_canopy', slot: 'bed', name: '公主床幔床', price: 3, chapter: 3 },
  { id: 'f_bed_cloud',  slot: 'bed', name: '雲朵床',     price: 4, chapter: 4 },

  { id: 'f_table_stump',  slot: 'table', name: '樹墩桌椅', price: 1, chapter: 1 },
  { id: 'f_table_picnic', slot: 'table', name: '野餐桌',   price: 2, chapter: 2 },
  { id: 'f_table_round',  slot: 'table', name: '圓桌下午茶', price: 3, chapter: 3 },
  { id: 'f_table_desk',   slot: 'table', name: '小書桌',     price: 3, chapter: 5 },

  { id: 'f_curtain_gingham', slot: 'curtain', name: '格紋窗簾', price: 1, chapter: 2 },
  { id: 'f_curtain_lace',    slot: 'curtain', name: '蕾絲窗簾', price: 2, chapter: 3 },
  { id: 'f_curtain_circus',  slot: 'curtain', name: '條紋帳篷窗簾', price: 4, chapter: 6 },

  { id: 'f_lamp_mushroom', slot: 'lamp', name: '蘑菇燈', price: 1, chapter: 1 },
  { id: 'f_lamp_moon',     slot: 'lamp', name: '月亮燈', price: 2, chapter: 3 },
  { id: 'f_lamp_string',   slot: 'lamp', name: '星星串燈', price: 3, chapter: 4 },
  { id: 'f_lamp_globe',    slot: 'lamp', name: '地球儀吊燈', price: 4, chapter: 5 },
  { id: 'f_lamp_carousel', slot: 'lamp', name: '旋轉木馬吊燈', price: 5, chapter: 6 },
  { id: 'f_lamp_chandelier', slot: 'lamp', name: '金色水晶吊燈', price: null, chapter: 1, reward: { hardChapter: 3 } },

  { id: 'f_wall_frame',   slot: 'wall', name: '全家福相框', price: 1, chapter: 1 },
  { id: 'f_wall_garland', slot: 'wall', name: '三角旗串',   price: 2, chapter: 2 },
  { id: 'f_wall_map',     slot: 'wall', name: '旅行地圖',   price: 3, chapter: 4 },
  { id: 'f_wall_chalkboard', slot: 'wall', name: '小黑板',   price: 3, chapter: 5 },
  { id: 'f_wall_ferris',  slot: 'wall', name: '摩天輪掛畫', price: 4, chapter: 6 },

  { id: 'f_plant_pot',       slot: 'plant', name: '小盆栽',   price: 1, chapter: 1 },
  { id: 'f_plant_sunflower', slot: 'plant', name: '向日葵',   price: 2, chapter: 3 },
  { id: 'f_plant_balloon',   slot: 'plant', name: '氣球盆栽', price: 3, chapter: 6 },
];

// ---------- 香水（香水櫃，靠章節進度解鎖，不用星星） ----------
// unlock：start＝一開始就有；level:N＝第一次通過第 N 關；hardChapter:N＝困難模式第 N 章 10 關全破（v1.2）。
// color 是香霧與香水瓶道具的主色。
export const PERFUMES = [
  { id: 'p0', name: '丁噹熊的第一瓶', color: '#FF9EB5', unlock: { start: true } },
  { id: 'p1', name: '蜂蜜莓果香',     color: '#FFC94D', unlock: { level: 10 } },
  { id: 'p2', name: '衣櫥玫瑰香',     color: '#F27CA0', unlock: { level: 20 } },
  { id: 'p3', name: '暖暖可可香',     color: '#C98B62', unlock: { level: 30 } },
  { id: 'p4', name: '旅行的風',       color: '#8CCBEA', unlock: { level: 40 } },
  { id: 'p5', name: '丁噹熊的招牌香水', color: '#C9A7F5', unlock: { level: 40 } },
  { id: 'p6', name: '蠟筆彩虹香',     color: '#8FD9B6', unlock: { level: 50 } },
  { id: 'p7', name: '棉花糖樂園香',   color: '#FFB38A', unlock: { level: 60 } },
  { id: 'p_gold', name: '黃金丁噹香', color: '#E2B84E', unlock: { hardChapter: 6 } },
];

// ---------- 熊朋友 ----------
export const FRIENDS = [
  { id: 'snowball', name: '雪球', species: '北極熊', chapter: 1, like: '最愛吃鮭魚' },
  { id: 'sesame',   name: '芝麻', species: '貓熊',   chapter: 2, like: '愛漂亮的裁縫師' },
  { id: 'cocoa',    name: '可可', species: '馬來熊', chapter: 3, like: '愛泡熱可可的木工師傅' },
  { id: 'bobo',     name: '波波', species: '眼鏡熊', chapter: 4, like: '旅行攝影師' },
  { id: 'heitang',  name: '黑糖', species: '台灣黑熊', chapter: 5, like: '熊熊學校的老師，最會說故事' },
  { id: 'maple',    name: '小楓', species: '小熊貓',   chapter: 6, like: '遊樂園樂隊指揮，尾巴蓬蓬的' },
];

// ---------- 圖鑑貼紙（v1.2：16 → 24 張） ----------
// unlock：{level:N} 第一次通過第 N 關；{chapterStars:{ch,min}} 該章累積星數 >= min。
export const STICKERS = [
  ...FRIENDS.flatMap(f => [
    { id: `st_${f.id}_meet`,  friend: f.id, kind: 'meet',  name: `認識${f.name}的那天`, unlock: { level: f.chapter * 10 } },
    { id: `st_${f.id}_like`,  friend: f.id, kind: 'like',  name: `${f.name}最喜歡的東西`, unlock: { chapterStars: { ch: f.chapter, min: 20 } } },
    { id: `st_${f.id}_photo`, friend: f.id, kind: 'photo', name: `和${f.name}的合照`, unlock: { chapterStars: { ch: f.chapter, min: 26 } } },
  ]),
  ...[1, 2, 3, 4, 5, 6].map(ch => ({ id: `st_bear_ch${ch}`, friend: null, kind: 'bear', chapter: ch, name: `丁噹熊和大不溜・第 ${ch} 章特別照`, unlock: { chapterStars: { ch, min: 30 } } })),
];

export const ALL_SHOP_ITEMS = [...BEAR_ITEMS, ...DOG_ITEMS, ...FURNITURE];
/** v1.2：困難模式金色限定（換裝、大不溜造型、家具、香水，共 6 件），依 hardChapter 排序 */
export const HARD_REWARDS = [...ALL_SHOP_ITEMS.filter(i => i.reward), ...PERFUMES.filter(p => p.unlock.hardChapter)]
  .sort((a, b) => (a.reward?.hardChapter || a.unlock?.hardChapter) - (b.reward?.hardChapter || b.unlock?.hardChapter));
export const itemById = id => ALL_SHOP_ITEMS.find(i => i.id === id) || PERFUMES.find(p => p.id === id);
