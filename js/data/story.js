// 劇情文字（F 擁有）。每句 { who, expr, text }，text ≤ 30 字（手機對話框放得下）。
// who：bear 丁噹熊、dog 大不溜、snowball 雪球、sesame 芝麻、cocoa 可可、bobo 波波
// expr：熊 normal happy squint worried pout surprised wink；狗 smug happy bark lick sneeze sad；朋友 normal happy

const L = (who, expr, text) => ({ who, expr, text });

export const STORY = {
  prologue: [
    L('bear', 'happy', '叮噹～早安！我是丁噹熊！'),
    L('bear', 'wink', '我最喜歡的事，就是噴香水！'),
    L('dog', 'lick', '汪！（舔）'),
    L('bear', 'squint', '大不溜，好癢啦～'),
    L('bear', 'normal', '我有一個小小的夢想……'),
    L('bear', 'happy', '要調出「全世界最香的味道」！'),
    L('bear', 'happy', '森林裡一定藏著好多香香的材料。'),
    L('dog', 'bark', '汪汪！'),
    L('bear', 'wink', '大不溜也要一起來？那就出發吧！'),
  ],

  // ---------- 第 1 章 森林早餐 ----------
  ch1_intro: [
    L('bear', 'surprised', '咦？風裡有甜甜的味道……'),
    L('bear', 'happy', '是蜂蜜和莓果！好想做成香水！'),
    L('dog', 'smug', '汪。（嗅嗅）'),
    L('bear', 'normal', '先來準備一頓森林早餐吧！'),
    L('bear', 'happy', '蜂蜜、鮭魚、草莓，全部收集起來！'),
    L('dog', 'bark', '汪汪！'),
    L('bear', 'wink', '偷吃鮭魚的話，就不分你喔。'),
    L('dog', 'sad', '嗚～'),
  ],
  ch1_outro: [
    L('snowball', 'normal', '哇，這裡怎麼這麼香？'),
    L('bear', 'surprised', '你是誰呀？'),
    L('snowball', 'happy', '我是北極熊雪球！聞到鮭魚就跑來了。'),
    L('bear', 'happy', '剛好！「蜂蜜莓果香」調好了！'),
    L('bear', 'wink', '噴一下～（噗咻）'),
    L('snowball', 'happy', '好香！像吃了一整盤早餐！'),
    L('dog', 'sneeze', '哈啾！'),
    L('snowball', 'happy', '我們做朋友吧！下次一起吃早餐！'),
  ],

  // ---------- 第 2 章 熊熊衣櫥 ----------
  ch2_intro: [
    L('bear', 'worried', '糟糕，衣櫥亂成一團了……'),
    L('dog', 'smug', '汪。（叼著一隻襪子）'),
    L('bear', 'pout', '大不溜！那是我的襪子啦！'),
    L('bear', 'normal', '整理衣服的時候，聞到了玫瑰香。'),
    L('bear', 'surprised', '原來衣服晾在玫瑰花旁邊！'),
    L('bear', 'wink', '這次就調一瓶「衣櫥玫瑰香」吧！'),
    L('dog', 'bark', '汪汪！'),
  ],
  ch2_outro: [
    L('sesame', 'normal', '嗨～這條圍巾好可愛！'),
    L('bear', 'surprised', '你好！你是……貓熊？'),
    L('sesame', 'happy', '我是芝麻，在森林開裁縫店。'),
    L('sesame', 'happy', '你的衣服配色好有品味呢！'),
    L('bear', 'happy', '謝謝！聞聞看「衣櫥玫瑰香」～'),
    L('sesame', 'happy', '好優雅！我也想要一瓶！'),
    L('dog', 'lick', '（舔芝麻）汪！'),
    L('sesame', 'happy', '哈哈，大不溜好熱情！'),
  ],

  // ---------- 第 3 章 樹洞小屋 ----------
  ch3_intro: [
    L('bear', 'squint', '呼～下雨天最適合待在家了。'),
    L('bear', 'normal', '枕頭、毛毯、熱可可……'),
    L('bear', 'happy', '家的味道，也好想裝進瓶子裡！'),
    L('dog', 'smug', '汪。（窩進毛毯裡）'),
    L('bear', 'pout', '大不溜，那是我的位子啦！'),
    L('bear', 'wink', '整理好小屋，調「暖暖可可香」！'),
    L('dog', 'bark', '汪汪！'),
  ],
  ch3_outro: [
    L('cocoa', 'normal', '叩叩～不好意思，我來躲個雨。'),
    L('bear', 'surprised', '請進請進！你全身都濕了！'),
    L('cocoa', 'happy', '我是馬來熊可可，是個木工師傅。'),
    L('bear', 'happy', '來，喝杯熱可可暖暖身子。'),
    L('bear', 'wink', '再噴一點「暖暖可可香」～'),
    L('cocoa', 'happy', '好溫暖，像回到自己家一樣。'),
    L('cocoa', 'happy', '謝謝你！我幫你把門修一修吧！'),
    L('dog', 'happy', '汪！（猛搖尾巴）'),
  ],

  // ---------- 第 4 章 熊熊去旅行 ----------
  ch4_intro: [
    L('bear', 'happy', '香水一瓶一瓶，越來越多了！'),
    L('bear', 'worried', '可是「最香的味道」還差一點……'),
    L('bear', 'surprised', '對了！去旅行，聞聞遠方的風！'),
    L('dog', 'bark', '汪汪！'),
    L('bear', 'wink', '背包、地圖、相機，都帶齊了。'),
    L('dog', 'smug', '汪。（戴上小墨鏡）'),
    L('bear', 'happy', '大不溜，出發囉！'),
  ],
  ch4_outro: [
    L('bobo', 'normal', '喀嚓！拍到一張好照片～'),
    L('bear', 'surprised', '咦？你在拍我們嗎？'),
    L('bobo', 'happy', '我是眼鏡熊波波，旅行攝影師！'),
    L('bobo', 'happy', '你們笑得好開心，忍不住就拍了。'),
    L('bear', 'happy', '聞聞看，這是「旅行的風」！'),
    L('bobo', 'happy', '是湖水和陽光的味道！'),
    L('dog', 'lick', '（舔鏡頭）汪！'),
    L('bobo', 'happy', '哈哈，鏡頭被舔得霧霧的啦！'),
  ],

  // ---------- 完結 ----------
  finale: [
    L('bear', 'happy', '蜂蜜、玫瑰、可可、旅行的風……'),
    L('bear', 'normal', '把四種香氣，全部加在一起……'),
    L('bear', 'surprised', '咦？好像還少了一樣？'),
    L('dog', 'lick', '汪！（舔）'),
    L('bear', 'squint', '我知道了！是大家在一起的味道！'),
    L('bear', 'happy', '「丁噹熊的招牌香水」完成！'),
    L('snowball', 'happy', '大家都來了！真的好香喔！'),
    L('bobo', 'happy', '來拍一張全家福吧！喀嚓！'),
    L('bear', 'wink', '謝謝大家～明天也一起玩吧！'),
  ],
};

// 香水小卡：前調／中調／後調＋丁噹熊的一句話
export const PERFUME_CARDS = {
  p0: { top: '水蜜桃', mid: '棉花糖', base: '香草', line: '我的第一瓶香水，每天都要噴一下！' },
  p1: { top: '草莓', mid: '森林蜂蜜', base: '烤橡果', line: '聞起來像一頓幸福的早餐。' },
  p2: { top: '曬過太陽的棉布', mid: '玫瑰', base: '薰衣草', line: '穿上新衣服前，先噴一下！' },
  p3: { top: '熱可可', mid: '肉桂', base: '木頭小屋', line: '下雨天的味道，暖呼呼的。' },
  p4: { top: '湖水', mid: '青草', base: '陽光', line: '想念旅行的時候，就噴一下吧。' },
  p5: { top: '蜂蜜莓果', mid: '玫瑰與可可', base: '大家的笑容', line: '這就是全世界最香的味道！' },
};

// 圖鑑貼紙說明
export const STICKER_CAPTIONS = {
  st_snowball_meet: '雪球循著鮭魚香跑來，從此成了早餐好夥伴。',
  st_snowball_like: '雪球最愛剛抓到的鮭魚，一口氣能吃三條！',
  st_snowball_photo: '野餐墊上的合照，大不溜偷偷咬走了一塊鮭魚。',
  st_sesame_meet: '在裁縫店門口相遇，芝麻一眼就看上丁噹熊的蝴蝶結。',
  st_sesame_like: '芝麻最喜歡蕾絲和碎花布，連眼圈都很時髦。',
  st_sesame_photo: '試穿新衣服的合照，大不溜被包成了小禮物。',
  st_cocoa_meet: '雨天來躲雨的可可，帶著一身木頭香。',
  st_cocoa_like: '可可最愛一邊喝熱可可，一邊做小木椅。',
  st_cocoa_photo: '暖爐旁的合照，大不溜霸佔了最暖的毛毯。',
  st_bobo_meet: '湖畔的一聲「喀嚓」，認識了攝影師波波。',
  st_bobo_like: '波波最愛夕陽，相機裡存了一千張晚霞。',
  st_bobo_photo: '熱氣球上的合照，大不溜的耳朵被風吹翻了。',
  st_bear_ch1: '吃飽飽的早晨，丁噹熊和大不溜一起睡回籠覺。',
  st_bear_ch2: '換上新衣服的丁噹熊，和戴著領結的大不溜。',
  st_bear_ch3: '小屋布置好了！丁噹熊和大不溜窩在沙發上。',
  st_bear_ch4: '旅行的最後一天，一起看著湖上的夕陽。',
};

// 關卡前教學提示
export const LEVEL_TIPS = {
  swap: '滑動相鄰的兩個物件交換位置，3 個一樣的連成一線就會消除！',
  special: '4 個連線做出熊掌、L 或 T 形做出蜂巢炸彈、5 個連線做出香水瓶！點一下或交換就能發動。',
  combo: '把兩個特殊道具互相交換，會發動超強的組合技！',
  snow: '雪塊鋪在格子底下，在上面消除物件就能讓它融化。',
  crate: '木箱不會移動，在旁邊消除或用道具打它，就能打破。',
  yarn: '被毛線團纏住的物件不能交換，在旁邊消除就能解開。',
  honey: '蜂蜜黏黏會擴散！每一步都盡量清掉一點蜂蜜。',
  baby: '把熊寶寶一路往下送到底下的小門，牠就能回家囉！',
};
