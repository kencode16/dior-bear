// 全域設定（主代理擁有）。其他模組只讀不改；要加欄位請在回報中提出。
export const GAME_NAME = 'DIOR熊漂';
export const VERSION = '0.1.0';

export const BOARD_MAX = 9;          // 棋盤最大 9×9，預設 8×8
export const LEVELS_PER_CHAPTER = 10;
export const TOTAL_LEVELS = 40;

// 特殊道具（無顏色，點一下或和相鄰任何物件交換即發動，各算一步）
export const SPECIALS = {
  pawH:    { name: '橫掃熊掌', note: '橫向 4 連得到，消掉整列' },
  pawV:    { name: '直掃熊掌', note: '直向 4 連得到，消掉整行' },
  bomb:    { name: '蜂巢炸彈', note: 'L 形或 T 形得到，炸掉周圍 3×3' },
  perfume: { name: '香水瓶',   note: '5 連一直線得到，噴掉棋盤上同一種物件' },
};

// 障礙物
export const OBSTACLES = {
  snow:  { name: '雪塊',     note: '鋪在格子底下，在上面消除一次融化一層（1–2 層）' },
  crate: { name: '木箱',     note: '佔一格不能動，旁邊消除或被道具打到少一層（1–3 層）' },
  yarn:  { name: '毛線團',   note: '纏住物件不能交換，旁邊消除就解開' },
  honey: { name: '蜂蜜黏黏', note: '黏住物件不能交換；這一步沒清到任何蜂蜜，就往旁邊擴散一格' },
};

// 四章。items 的順序就是關卡 colors 數量取用的順序（colors:5 取前 5 種）。
// hue 是給美術的色系提示，同一章 6 種顏色＋剪影都要明顯不同。
export const CHAPTERS = [
  {
    id: 1, name: '森林早餐', theme: '食', bg: '晨光森林野餐墊',
    items: [
      { id: 'honey',  name: '蜂蜜罐', hue: '蜂蜜黃' },
      { id: 'salmon', name: '鮭魚',   hue: '蜜桃橘' },
      { id: 'straw',  name: '草莓',   hue: '粉紅' },
      { id: 'blue',   name: '藍莓',   hue: '薰衣草紫' },
      { id: 'acorn',  name: '橡果',   hue: '奶茶棕' },
      { id: 'apple',  name: '青蘋果', hue: '薄荷綠' },
    ],
    obstacles: ['snow', 'crate'], friend: 'snowball', perfume: 'p1',
  },
  {
    id: 2, name: '熊熊衣櫥', theme: '衣', bg: '粉色裁縫小店',
    items: [
      { id: 'bow',       name: '蝴蝶結', hue: '粉紅' },
      { id: 'knitHat',   name: '毛線帽', hue: '薰衣草紫' },
      { id: 'scarf',     name: '圍巾',   hue: '薄荷綠' },
      { id: 'boots',     name: '小雨靴', hue: '蜂蜜黃' },
      { id: 'dungarees', name: '吊帶褲', hue: '天空藍' },
      { id: 'apron',     name: '小圍裙', hue: '蜜桃橘' },
    ],
    obstacles: ['yarn'], friend: 'sesame', perfume: 'p2',
  },
  {
    id: 3, name: '樹洞小屋', theme: '住', bg: '暖燈樹洞內部',
    items: [
      { id: 'pillow',  name: '枕頭',     hue: '天空藍' },
      { id: 'blanket', name: '毛毯',     hue: '粉紅' },
      { id: 'nightLamp', name: '小夜燈', hue: '蜂蜜黃' },
      { id: 'cocoaMug', name: '熱可可杯', hue: '可可棕' },
      { id: 'plant',   name: '盆栽',     hue: '薄荷綠' },
      { id: 'clock',   name: '鬧鐘',     hue: '蜜桃橘' },
    ],
    obstacles: ['honey'], friend: 'cocoa', perfume: 'p3',
  },
  {
    id: 4, name: '熊熊去旅行', theme: '行', bg: '夕陽湖畔與天空',
    items: [
      { id: 'airBalloon', name: '熱氣球', hue: '粉紅' },
      { id: 'bicycle',  name: '腳踏車',   hue: '薄荷綠' },
      { id: 'backpack', name: '背包',     hue: '蜜桃橘' },
      { id: 'boat',     name: '小船',     hue: '天空藍' },
      { id: 'map',      name: '地圖',     hue: '蜂蜜黃' },
      { id: 'camera',   name: '相機',     hue: '薰衣草紫' },
    ],
    obstacles: ['snow', 'crate', 'yarn', 'honey'], friend: 'bobo', perfume: 'p4',
  },
];

export const ITEM_NAME = Object.fromEntries(CHAPTERS.flatMap(ch => ch.items.map(it => [it.id, it.name])));
export const chapterOfLevel = id => Math.ceil(id / LEVELS_PER_CHAPTER);
export const chapterById = id => CHAPTERS[id - 1];
