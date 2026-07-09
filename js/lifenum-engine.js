// 生命靈數 開運密碼：以身分證上的西元出生年月日為輸入的數字命理計算。
// 對照資料來源：C:\Users\aries\OneDrive\圖片\ClaudeCode\生命靈數\ 底下的課程 PPT（●生命靈數PPT-202506 (1).pptx）
// 逐頁核對出來的公式，PPT 裡用「西元出生年.月.日.三者之合.(化簡過程).生命密碼」這串數字，
// 在 1-9,0 的九宮格上分別用 圓圈(生日本身)／三角形(三者之合化簡過程，含中間值)／方框(生命密碼) 三種記號圈起來，
// 用這三種記號的「數量權重」（圓圈=1、三角形=2、方框=4）決定「影響最大的數」，沒被圈到的數字就是「補數」。

function lnDigitSum(n) {
  return String(Math.abs(n)).split("").reduce((s, c) => s + Number(c), 0);
}
function lnReduceToSingle(n) {
  let cur = Math.abs(n);
  while (cur >= 10) cur = lnDigitSum(cur);
  return cur;
}
// 三者之合的化簡過程：例如 38 -> 11 -> 2，chain=[38,11]，final=2（跟人格解碼的天賦數化簡邏輯一樣）
function lnReduceChain(raw) {
  const chain = [];
  let cur = raw;
  while (cur >= 10) {
    chain.push(cur);
    cur = lnDigitSum(cur);
  }
  return { chain, final: cur };
}

// 【人生功課】計算方式：日基數與月基數相減，所得的數字（月/日各自先化簡到個位數，再相減取絕對值）
// 用課程 PPT／人生功課.pdf 裡 9 筆逐月逐日的實測資料核對一致（缺憾數 0~8 共 9 種全部核對過）
const LIFE_LESSON_TEXT = {
  0: "你將擁有許多很好的機會，你應該好好的處理它。以個人自我為中心的追求，的確為你帶來一些個人的成就，但是你真正的幸福，是必須要為大我貢獻才能得到的，只有在為人類服務之後，你才會覺得你自己亦是這個世界的一部分。對擁有缺憾數字０的人來說，有一件事必須做到，那就是對任何事都不能心存偏見，這樣一來，你就有機會與各行各業的人交往。",
  1: "你必須學習獨立、站穩腳步。你常會遇到自己的意見與他人的需求有所不同的情況，你需要經過一番奮鬥掙扎之後才能了解到自己的意志力。你將必須堅持、信賴自己的判斷；別盲目從眾，要肯定自己。因此，你將歷經很多試煉及錯誤，有時甚至無法控制自己的情況。有時內心充滿了挫折及憤怒，一直到你內心的天賦才能有辦法處裡為止。你將會有一套自己的價值觀，你會發展成最具原創性改革性的自我。",
  2: "你太敏感且太了解別人對你的期望。你會壓抑自己別太惹人注目，又會因自我意識過強而不知所措。你亦恐懼別人對你閒言閒語，因此你會變得過度壓抑自我。這一切都是肇因於你太過於將自己的獨特性壓抑的結果，而你又總是希望自己能和大眾融合。你的感情及情緒在你的生活中扮演很大的角色，你的高度緊張會引起恐懼、膽怯、缺少自信，你將經歷一些不必要的恐懼及情緒波濤。一點小事你有時就會覺得很難克服，而且那些事可能就會使你裹足不前。你會因嫉妒而引起痛苦及誤解。你擁有許多正面的特色，比如你有精確的認知力及直覺。你是別人內心感情的觸媒，在別人說出口之前，你就已經了解到他們內心的感覺了。你依著你的情緒感覺行事，但這個缺憾會使你了解並同情他人。對他人內心的波濤，你往往有很大的移情作用，所以你願意為別人解決情緒問題。",
  3: "你嘗試自己的批評者，因而容易壓抑自己的創造力及自我。每次做事之前你就懷疑自我，且在事後你又無情地批評自我，你對自我的批評往往比別人對你的批評還要嚴苛。因此，為了安全，你總是只在事物的表面上處裡，很少表達你內心的思想。相反地，你總是以幽默及敷衍的言行隱藏你內心的情感。你常覺得孤寂，社會上一些交互作用常使你在言行上感到緊張，所以你往往會想藉很多笑話來鬆弛心情。你可藉由寫作、繪畫、唱歌或舞蹈來作為感情的發洩。你要努力帶出真實的自我，並學習看重自己的價值。你自己的創意絕對高過別人的判斷力，這是一個你可憑藉它而變成完整個體的過程，你會更獨立，不用再附和他人。",
  4: "你有缺少組織及規律的傾向，有時會不切實際，會幻想一些不可能或是幾乎沒什麼價值的計劃。你要學著去了解什麼是可能、什麼是不可能的。如果眼界不清，就會有完成計畫的困難，也不知眼前的路該如何走。你絕對擁有實際及組織的能力，但你首先必須培養組織及實際的特質，這樣一來，你便能與每天的生活切合，並且擁有成功的籌碼。你的缺憾便是要為自己的人生建造一個長久的基石，你需要毅力及不斷的努力。想迅速致富會引起不好的結果，不斷的努力才是你成功的關鍵。",
  5: "你會有變成「滾石」的狀態。你想經歷各式各樣的生活、你需要自由、想嘗試很多事，並想去任何地方。小心別太沉溺於酒精、食物、藥與性之中。你必須更有耐性一點，要多了解他人，以建立且維持長久的關係，這可以幫助你結交更好的朋友。你要能處理一些不符你要求的情況，但也要學習冒險的精神。",
  6: "你的理想太高、不真實，會使得生活對你及他人來講較為困難。有一段時間你對自己做的事及別人做的事都感到不滿，有時缺少感謝之心，會使你看不見生活中的美感。有些僵硬的思想亦會使你無法有清楚的透視力，很可惜，因為這些清楚的透視力或許能幫助你從已接受之事中得到一些啟示。其實，這個缺憾數字要談的是你眼睛上的障礙物，障礙物會讓你無法看見更寬廣的視野，因此你會覺得自己就是一切，如此你便無法接收到對你有幫助的相關資訊。非常想要為人服務的你，有時會使你看不見自己內心發展的真正需要。你可能會傲慢且正直，常常告訴別人什麼是對的，什麼是錯的。你要學會在你的理想旨意及個人成長的障礙間尋求平衡。",
  7: "你對於任何尚未證明的事都抱持懷疑的態度，特別是懷疑那些與精神層面有關的事，因此內心較不易尋求出個人的哲學來平靜地面對你的人生。你壓抑了許多內心自然的愛好，因為它們並不合於你理性的思考，你內心童稚似的天性亦被你壓抑住了。每一個人生命中一些不合理或哲學方面的整體思考，如精神、幽默、逗趣、直覺等特色都時常會被你排拒在外。建議要參與一些哲學團體，而在其間你可以得到另一層面的視野，也因此能將你內心潛藏的特性表現出來；否則你會有孤寂一生的危機。學習信仰，當你了解生活是由不可見的思緒、情緒、洞察力及愛組成時，你就會了解事實上你的感官所能主導的只是生活中的一小部分而已。",
  8: "你的人生會因賺錢或奪得權力而冒險，有時對財富的欲望會使得你的個性及精神層面相形失色，亦影響了其他你做的每一件事。不要嘗試著想把一切轉變成財富，這會使你因此而必須承受孤獨，且將面臨精神的考驗，亦將會了解：人不是光靠麵包就可以活著，如果你能克服這個困難，便能達到物質與精神間的平衡。學習讓自己變成一條有力、涓涓不息的河流，如此你便能無窮盡地將養分帶給大家。一旦你了解你的缺點，你就能克服它；若你不知道自己的缺點，你就成了自己的受害者。而你的缺點就存在於你已感滿足的生活與你的自我之間。"
};

// 開創數~智慧數 1-9：固定 3x3 九宮格說明（跟每個人的生日無關，是課程 PPT／講義的固定表格）
const LIFENUM_TYPE_DESC = {
  1: "強烈自我，勇往直前的大男人", 2: "溫柔細心，合作順從的小女人", 3: "創意點子，活力充沛的小頑童",
  4: "穩重行事，規劃組織的執行者", 5: "無拘無束，能量四射的自由鬥士", 6: "熱愛生命，關懷朋友的人道主義者",
  7: "分析質疑，探求真理的研究者", 8: "老闆格局，向成功看齊的實踐家", 9: "慈悲愛心，付出不求回報的完美主義者"
};
const LIFENUM_TYPE_BOX = [
  { n: 1, name: "開創數", color: "red" }, { n: 2, name: "溝通數", color: "orange" }, { n: 3, name: "創意數", color: "yellow" },
  { n: 4, name: "執著數", color: "green" }, { n: 5, name: "自由數", color: "blue" }, { n: 6, name: "關懷數", color: "indigo" },
  { n: 7, name: "真理數", color: "purple" }, { n: 8, name: "務實數", color: "pink" }, { n: 9, name: "智慧數", color: "gold" }
].map((t) => ({ ...t, desc: LIFENUM_TYPE_DESC[t.n] }));

// 底部逐一展開的生命密碼 1-9 個性解讀（(+)/(-)兩面），取自課程講義 page -1-/-2-
const LIFENUM_TRAITS = {
  1: { title: "先問我", plus: ["擁有無中生有的創造力，獨立性強，外向而積極", "勇於表達自己的意見，有主見，有擔當能力", "有群眾魅力，是個天生的領導者"], minus: ["固執，好勝心強，重面子"] },
  2: { title: "你決定就好", plus: ["適應力強，順從性佳，與人合作溝通協調能力佳", "溫和細心，重視細節，可以看到別人看不到的", "有能力看出事情的問題，分析能力佳"], minus: ["無主見，依賴，不喜歡獨處，為反對而反對"] },
  3: { title: "我知道我要什麼", plus: ["有創意，點子王，樂觀進取，喜歡分享，溝通能力強", "容易帶給人快樂，有其獨特的價值觀，理想化求完美"], minus: ["小孩的任性，遇事退縮，不務實，缺乏整合的智慧", "無法完整地表達，期待別人變成自己想要的模樣"] },
  4: { title: "眼見為憑", plus: ["四平八穩，重安全感，行事有規劃，組織能力強", "理財好手，重視金錢與物質，誠實而值得信賴"], minus: ["缺乏安全感，保守，內向，情緒化，害怕冒險"] },
  5: { title: "再看看吧", plus: ["能量從中間向四方放射，喜歡變化，嘗新，愛好自由", "善於觀察市場動向，創意十足，能言善道，5號與3號都是很好的講師，是業務行銷的高手，直覺力強"], minus: ["害怕不自由，以致缺乏責任感，不喜歡被約束", "可能會因為某些因素而封閉自己不與人互動"] },
  6: { title: "沒辦法說不", plus: ["很有同情、愛心、耐心，熱愛生命關懷他人", "很會照顧別人，敏感性高，善於分析，修理東西", "很適合當醫護人員與治療師"], minus: ["若濫用同情心與愛心，不但會覺得自己受傷", "而且會覺得別人虧欠他，當過度犧牲→需要被治療"] },
  7: { title: "真的嗎", plus: ["LUCKY 7：上帝的左右手，只要願意用點心就有天助", "分析判斷質疑的能力很強（律師特質）～不要欺騙他", "天生好奇，探求真理的能力很強"], minus: ["因願意用點心就有天助，所以容易懶惰，守株待兔", "質疑他人的同時也容易質疑自己"] },
  8: { title: "好處在哪裡", plus: ["老闆、格局大，財經專家，洞悉分析利潤，決策果決", "會想無私地培育人才，個性剛強，但表現在外比較溫順"], minus: ["有控制的慾望，會因為投機而不誠實，拖延", "會因為不喜歡得罪別人而掩飾自己的真正感受"] },
  9: { title: "沒問題", plus: ["很有慈悲心與愛心，願意助人，付出不求回報，服務高手", "學習能力很強，博學多聞，多才多藝，想像力很豐富", "是個天生的夢想家，既理性又感性，既剛強又溫柔"], minus: ["夢想多，理想大，有時較不務實而缺乏執行力", "在乎別人的感受，不重視自己的利益，容易受人利用"] }
};

// 九宮連線密碼：固定 13 條線（3 者之合、補數等欄位共用同一個「數字池」判斷是否命中）
const LIFENUM_CODE_LINES = [
  { nums: [1, 2, 3], name: "藝術線．獨立線" }, { nums: [1, 4, 7], name: "安全線．錢財線" },
  { nums: [3, 5, 7], name: "人緣線．溝通線" }, { nums: [4, 5, 6], name: "組織線．完美主義線" },
  { nums: [2, 5, 8], name: "感情表達線" }, { nums: [1, 5, 9], name: "事業線．工作狂線" },
  { nums: [7, 8, 9], name: "權力線．貴人線" }, { nums: [3, 6, 9], name: "創意線．想像線" },
  { nums: [1, 5, 9, 0], name: "自然．宗教因緣線" }, { nums: [2, 4], name: "靈巧變通線" },
  { nums: [2, 6], name: "公平正義線" }, { nums: [4, 8], name: "工作模範線" }, { nums: [6, 8], name: "誠實親切線" }
];

// 九星五行：民國出生年（西元-1911）依性別代入固定公式，對照課程講義的表格核對一致
// 男：((17-民國年) mod 9)，餘 0 記為 9；女：((民國年-2) mod 9)，餘 0 記為 9
// 「5」這個星在表上是併入其他星顯示（男併入 2、女併入 8），沒有獨立的第五星
function lnMod9(n) {
  const r = ((n % 9) + 9) % 9;
  return r === 0 ? 9 : r;
}
function lnStarNumber(year, gender) {
  const roc = year - 1911;
  let r = gender === "female" ? lnMod9(roc - 2) : lnMod9(17 - roc);
  if (r === 5) r = gender === "female" ? 8 : 2;
  return r;
}

const LIFENUM_STAR_INFO = {
  1: { trigram: "坎", wuxing: "水", nature: "水", planet: "海王星", type: "智慧型",
    desc: "思考力強、聰明智力優秀，典型的天才型人物。基本個性就像水，溫和卻帶點優柔寡斷，屬於外柔內剛的一型。具親和力，有很大的包容性，是最好的團隊合作人選。表面沉穩，內在深沉謀略，能自己找出解決事情的方式是他們聰明過人之處。同時也擅長游走在各個社交小圈圈裏，容易隱藏自己的真正感覺。",
    health: "慎防腎臟、膀胱、婦科、骨及耳朵方面的疾病。" },
  2: { trigram: "坤", wuxing: "土", nature: "地", planet: "土星", type: "保守型",
    desc: "如大地般沉穩，是所有星數裡面最具有母愛的一群人。第一印象給人乖巧、謙恭有禮、中規中矩的感覺，不擅計較的個性，喜歡穩定與保守的人際關係，體貼、細心、有耐心，總是習慣無怨無悔、任勞任怨的付出，有堅持到底的特性，做事向來不拖延，堪稱是言出必行的表率。",
    health: "慎防消化系統、脾胃方面的疾病，呼吸系統也要留心。" },
  3: { trigram: "震", wuxing: "木", nature: "雷", planet: "木星", type: "機動型",
    desc: "生命力旺盛、積極進取、急性子、好奇心求知慾強，屬機動性的個性，不喜歡拐彎抹角，感情起伏大。本性活潑，有很強的活動力，膽識過人，在眾人中有擔任首領的條件。是直線條、單一思考的人，心慈性急，有口無心，易刺傷他人而不自知。",
    health: "慎防肝膽、神經及手足等病變所造成的不適。" },
  4: { trigram: "巽", wuxing: "木", nature: "風", planet: "水星", type: "隨和型",
    desc: "適應力好，內心柔和、仁慈，具有親和力，像風一樣靈巧多變，天生具有卓越的邏輯分析技巧，善於察言觀色，具有優秀的洞察能力。人情壓力排名第一，優柔寡斷，沒有固定的原則性，常容易陷於緊要關頭驚慌失措的窘境。",
    health: "特別注意肝膽、腎臟、呼吸及神經系統方面的疾病。" },
  6: { trigram: "乾", wuxing: "金", nature: "天", planet: "天王星", type: "正直型",
    desc: "不擅長運用交際奉承的手段，看不慣高談闊論，是屬實力派、以工作取勝的人，極端的聰明，又有先見之明，樂於主導掌控，非常重視自我的尊嚴以及形象。具有傲上善下的氣質，一旦說出口的承諾，很少會讓自己有做不到的時候，是個相當守信用的人。",
    health: "留意呼吸系統及血液循環方面的毛病。" },
  7: { trigram: "兌", wuxing: "金", nature: "澤", planet: "金星", type: "交際型",
    desc: "思想自然率真，天性充滿開朗喜悅的個性，有它們在的場合總是氣氛活絡。口才伶俐人緣頗佳，辯才無礙，是個天生有公關手腕的人才，屬交際型的人，追求浪漫優雅活潑多彩的生活。財運甚佳，但必須到中年，財運方能穩固，年輕時必須較辛苦，接受磨練。",
    health: "肺部、骨骼與大腸較弱，要多加小心。" },
  8: { trigram: "艮", wuxing: "土", nature: "山", planet: "冥王星", type: "內斂型",
    desc: "內柔外剛，待人柔和，堅持自己的信念行事，是令人相當信任的合作對象，對人脈的掌握與運用十分不錯，因為個性如山般的穩固不可動搖，處事較沉著冷靜、穩健樸實、默默耕耘、勤勉工作。不善於表達內心的情感，內心如火的熱情需要鼓勵和激發，方敢表露出來。",
    health: "在神經與消化系統方面易出現病痛，要小心慎防。" },
  9: { trigram: "離", wuxing: "火", nature: "火", planet: "火星", type: "敏捷型",
    desc: "個性熱情如火，先天有著積極的熱情因子，行動力強，遇事斷然處之，積極又敢挑戰，是事業的急先鋒。做事有時因較沒有計畫性，常是憑一時的熱忱，若能在事前有周詳細密的計畫，凡事就有勢如破竹的大勝利與成功。有願意付出心力照顧、關心他人的個性。",
    health: "要注意心臟、血液、眼睛及小腸方面容易產生病變。" }
};

// 加分顏色：依五行「生我／同屬／我生」三組，取自課程講義 page -18-
const LIFENUM_WUXING_COLORS = {
  水: [
    { relation: "生我（金生水）", wuxing: "金", colors: ["白色系", "銀色", "淺灰色"] },
    { relation: "同屬（水）", wuxing: "水", colors: ["黑色", "極深藍", "深灰色"] },
    { relation: "我生（水生木）", wuxing: "木", colors: ["綠色系", "藍色系"] }
  ],
  土: [
    { relation: "生我（火生土）", wuxing: "火", colors: ["紅色系", "紫色系", "紅橘色"] },
    { relation: "同屬（土）", wuxing: "土", colors: ["黃色系", "棕色系", "黃橘色"] },
    { relation: "我生（土生金）", wuxing: "金", colors: ["白色系", "銀色", "淺灰色"] }
  ],
  木: [
    { relation: "生我（水生木）", wuxing: "水", colors: ["黑色", "極深藍", "深灰色"] },
    { relation: "同屬（木）", wuxing: "木", colors: ["綠色系", "藍色系"] },
    { relation: "我生（木生火）", wuxing: "火", colors: ["紅色系", "紫色系", "紅橘色"] }
  ],
  金: [
    { relation: "生我（土生金）", wuxing: "土", colors: ["黃色系", "棕色系", "黃橘色"] },
    { relation: "同屬（金）", wuxing: "金", colors: ["白色系", "銀色", "淺灰色"] },
    { relation: "我生（金生水）", wuxing: "水", colors: ["黑色", "極深藍", "深灰色"] }
  ],
  火: [
    { relation: "生我（木生火）", wuxing: "木", colors: ["綠色系", "藍色系"] },
    { relation: "同屬（火）", wuxing: "火", colors: ["紅色系", "紫色系", "紅橘色"] },
    { relation: "我生（火生土）", wuxing: "土", colors: ["黃色系", "棕色系", "黃橘色"] }
  ]
};

function calculateLifeNumber({ year, month, day, gender, name }) {
  const yStr = String(year);
  const mStr = String(month).padStart(2, "0");
  const dStr = String(day).padStart(2, "0");

  // 三者之合／生命密碼：西元年月日「所有數位」（含月/日補零後的 0）加總，逐步化簡到個位數
  // chain 本身已經含原始加總值（例如 raw=38 時 chain=[38,11]），不用再把 raw 疊加一次
  const raw = lnDigitSum(yStr) + lnDigitSum(mStr) + lnDigitSum(dStr);
  const { chain, final: lifeCode } = lnReduceChain(raw);
  const sanZheDisplay = chain.length ? chain.concat(lifeCode).join(".") : String(lifeCode);

  // 人生功課：月／日各自化簡到個位數後相減取絕對值，範圍固定 0~8
  const lifeLesson = Math.abs(lnReduceToSingle(month) - lnReduceToSingle(day));

  // 別人眼中的你：日期本身（不補零）化簡到個位數
  const otherSideView = lnReduceToSingle(day);

  // 圈記號權重：生日年/月(補零)/日(補零)＝圓圈(1)；三者之合的化簡過程（含原始值，不含最終生命密碼）＝三角形(2)；
  // 生命密碼本身＝方框(4)。同一個數字被圈到多次就把權重加總。
  const weights = {};
  const addDigits = (str, mult) => {
    String(str).split("").forEach((ch) => {
      const d = Number(ch);
      weights[d] = (weights[d] || 0) + mult;
    });
  };
  addDigits(yStr, 1);
  addDigits(mStr, 1);
  addDigits(dStr, 1);
  chain.forEach((v) => addDigits(v, 2));
  addDigits(lifeCode, 4);

  const allNums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  const complementNumbers = allNums.filter((d) => !weights[d]).sort((a, b) => a - b);
  const maxWeight = Math.max(0, ...Object.values(weights));
  const mostInfluential = allNums.filter((d) => (weights[d] || 0) === maxWeight && maxWeight > 0);

  const gridMarks = {};
  allNums.forEach((d) => {
    gridMarks[d] = { circle: false, triangle: 0, square: false };
  });
  String(yStr + mStr + dStr).split("").forEach((ch) => { gridMarks[Number(ch)].circle = true; });
  chain.forEach((v) => String(v).split("").forEach((ch) => { gridMarks[Number(ch)].triangle += 1; }));
  String(lifeCode).split("").forEach((ch) => { gridMarks[Number(ch)].square = true; });

  const digitSet = new Set(Object.keys(weights).map(Number));
  const codeLines = LIFENUM_CODE_LINES.map((line) => ({
    nums: line.nums,
    name: line.name,
    matched: line.nums.every((d) => digitSet.has(d))
  }));

  // 九星五行：依民國出生年＋性別代入公式；農曆生日在中秋(8/15)後者一生有兩個五行，40歲後轉換到下一個
  const starNum = gender ? lnStarNumber(year, gender) : null;
  let star = null;
  if (starNum) {
    const solar = Solar.fromYmdHms(year, month, day, 0, 0, 0);
    const lunar = solar.getLunar();
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();
    const bornAfterMidAutumn = lunarMonth > 8 || (lunarMonth === 8 && lunarDay >= 16);
    const info = LIFENUM_STAR_INFO[starNum];
    star = { number: starNum, ...info, hasSecond: bornAfterMidAutumn, secondNumber: null, secondInfo: null };
    if (bornAfterMidAutumn) {
      let r2 = gender === "female" ? lnMod9((year - 1911 + 1) - 2) : lnMod9(17 - (year - 1911 + 1));
      if (r2 === 5) r2 = gender === "female" ? 8 : 2;
      star.secondNumber = r2;
      star.secondInfo = LIFENUM_STAR_INFO[r2];
    }
  }

  const colorGroups = star ? LIFENUM_WUXING_COLORS[star.wuxing] : null;

  return {
    name,
    year, month, day,
    sanZheDisplay,
    sanZheRaw: raw,
    lifeCode,
    lifeLesson,
    lifeLessonText: LIFE_LESSON_TEXT[lifeLesson],
    complementNumbers,
    mostInfluential,
    otherSideView,
    gridMarks,
    codeLines,
    star,
    colorGroups,
    trait: LIFENUM_TRAITS[lifeCode]
  };
}
