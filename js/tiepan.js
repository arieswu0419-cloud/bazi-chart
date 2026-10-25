// ================= 命理諮詢「鐵版神數」（簡化推算版）=================
// 正統鐵版神數要先「考刻」再查一萬二千條原典條文，本系統沒有條文資料，改依鐵版神數所本的「河洛理數」起卦推算：
// 1. 八字八個字各取河圖數（甲己子午九、乙庚丑未八、丙辛寅申七、丁壬卯酉六、戊癸辰戌五、巳亥四），
//    奇數相加為天數、偶數相加為地數；天數以 25 除、地數以 30 除取餘，再取尾數配河圖五行成卦
//    （一六水坎、二七火離、三八木震巽、四九金乾兌、五十土艮坤；陽男陰女取陽卦，陰男陽女取陰卦）。
// 2. 先天卦：陽男陰女天數為上卦、地數為下卦，陰男陽女反之；元堂（主爻）依出生時支定位。
// 3. 後天卦：先天卦元堂之爻變，再上下卦互換。先天卦管前半生、後天卦管後半生；大運每爻陽管九年、陰管六年。
// 4. 流年：以虛歲找出值年之卦與爻，該爻變為之卦；流月（節氣月，立春起）依序逐爻推移，爻變之卦為月象。
// 解讀為規則式文字（64 卦卦義＋爻位吉凶），評估只用來排「大吉／吉／平／注意」。報告載明非原典條文。
(function () {
  const GAN = "甲乙丙丁戊己庚辛壬癸", ZHI = "子丑寅卯辰巳午未申酉戌亥";
  const NUM = { 甲: 9, 己: 9, 子: 9, 午: 9, 乙: 8, 庚: 8, 丑: 8, 未: 8, 丙: 7, 辛: 7, 寅: 7, 申: 7, 丁: 6, 壬: 6, 卯: 6, 酉: 6, 戊: 5, 癸: 5, 辰: 5, 戌: 5, 巳: 4, 亥: 4 };
  // 八卦：爻由下而上，1 陽 0 陰
  const TRI = { 乾: "111", 兌: "110", 離: "101", 震: "100", 巽: "011", 坎: "010", 艮: "001", 坤: "000" };
  const TRI_NAME = Object.fromEntries(Object.entries(TRI).map(([k, v]) => [v, k]));
  const TRI_IMG = { 乾: "天", 兌: "澤", 離: "火", 震: "雷", 巽: "風", 坎: "水", 艮: "山", 坤: "地" };
  const TRI_EL = { 乾: "金", 兌: "金", 離: "火", 震: "木", 巽: "木", 坎: "水", 艮: "土", 坤: "土" };
  // 尾數→卦（[陽卦, 陰卦]）
  const NUM_TRI = { 1: ["坎", "坎"], 6: ["坎", "坎"], 2: ["離", "離"], 7: ["離", "離"], 3: ["震", "巽"], 8: ["震", "巽"], 4: ["乾", "兌"], 9: ["乾", "兌"], 5: ["艮", "坤"], 10: ["艮", "坤"] };
  const YAO_NAME = ["初", "二", "三", "四", "五", "上"];

  // ---------- 64 卦文字庫（n 卦名、s 吉凶分 -2～2、t 總論、c 事業、w 財運、l 感情、h 健康）----------
  // key＝六爻由下而上（下卦三爻＋上卦三爻）
  const HEX = {
    "111111": { n: "乾為天", s: 2, t: "剛健進取、自強不息，是領導與開創之象", c: "有領導力，宜承擔重任、主動開創，但忌剛愎", w: "財運旺盛，正財為主，大進大出要有節制", l: "主導性強，需多體貼對方", h: "精力充沛，留意頭部、心血管與過勞" },
    "000000": { n: "坤為地", s: 1, t: "厚德載物、柔順包容，守成與配合之象", c: "宜輔佐、合作與穩健經營，不宜強出頭", w: "財來自積累與土地房產，宜守不宜攻", l: "溫順體貼，感情長久", h: "脾胃消化，注意疲倦與水腫" },
    "100010": { n: "水雷屯", s: -1, t: "萬物初生、艱難起步，須耐心等待時機", c: "創業或新職起步艱辛，先打基礎再求發展", w: "資金周轉緊，不宜擴張投資", l: "感情初起多波折，需耐心", h: "初期小病不斷，注意腎與神經" },
    "010001": { n: "山水蒙", s: -1, t: "蒙昧未明、需要學習與啟發之象", c: "多請教前輩、進修充實，不宜獨斷", w: "財務上容易受騙或判斷不清，謹慎為上", l: "彼此了解不足，多溝通", h: "注意眼睛、脾胃與腸道" },
    "111010": { n: "水天需", s: 0, t: "等待時機、蓄勢待發，不可躁進", c: "計畫需時間醞釀，守住崗位等待機會", w: "財運需等待，中後期轉好", l: "感情需要時間培養，急不得", h: "飲食節制，注意腎與泌尿" },
    "010111": { n: "天水訟", s: -2, t: "爭訟是非之象，宜和解退讓", c: "職場易有爭執、合約糾紛，少與人爭", w: "防財務糾紛、官司破財", l: "口角多，退一步海闊天空", h: "注意壓力、肝火與血壓" },
    "010000": { n: "地水師", s: 0, t: "統帥群眾、動員之象，需有紀律與正道", c: "適合帶領團隊、承擔責任，紀律是關鍵", w: "財運靠團隊與組織，防開銷大", l: "需為對方承擔，感情中有責任", h: "勞累奔波，注意腰腎" },
    "000010": { n: "水地比", s: 1, t: "親比和睦、互相扶持之象", c: "人和為貴，合作順利，宜結盟", w: "合夥求財有利，貴人助財", l: "感情和睦，適合結婚", h: "整體平順，注意腎水" },
    "111011": { n: "風天小畜", s: 0, t: "小有積蓄、暫時受阻，宜蓄養待時", c: "小成就可期，大計畫尚需時日", w: "小財可得，大財暫緩", l: "小有摩擦，很快化解", h: "小病小痛，注意呼吸道" },
    "110111": { n: "天澤履", s: 0, t: "履虎尾，謹慎前行則吉", c: "按規矩辦事、謹守分寸可免禍", w: "按部就班賺錢，不冒險", l: "以禮相待，感情穩定", h: "注意腳部與意外" },
    "111000": { n: "地天泰", s: 2, t: "天地交泰、通達亨通，大吉之象", c: "事業順遂、上下和合，宜積極推展", w: "財運亨通，投資置產皆宜", l: "情投意合，家庭和樂", h: "身心安泰，注意安逸過度" },
    "000111": { n: "天地否", s: -2, t: "閉塞不通，小人道長，宜守不宜進", c: "事業受阻、溝通不良，宜韜光養晦", w: "財路閉塞，守住現金不投資", l: "溝通阻塞，冷戰多", h: "氣血不暢，注意胸悶與情緒" },
    "101111": { n: "天火同人", s: 1, t: "與人和同、志同道合之象", c: "合作順利，宜結交志同道合者共事", w: "合作求財，公開透明有利", l: "有共同理想的伴侶，感情佳", h: "注意心火與眼睛" },
    "111101": { n: "火天大有", s: 2, t: "大有收穫、光明盛大之象", c: "事業豐收、名聲顯揚，宜謙虛守成", w: "財運大旺，收入豐厚", l: "感情豐盛，被人珍視", h: "精神旺盛，注意心臟與血壓" },
    "001000": { n: "地山謙", s: 1, t: "謙虛卑下而亨通，君子有終", c: "謙遜得人心，默默耕耘終有成", w: "財來平穩，不炫富則守得住", l: "謙和相處，感情長久", h: "平穩，注意脾胃" },
    "000100": { n: "雷地豫", s: 1, t: "和樂愉悅、順勢而動之象", c: "順勢推展，士氣高昂，防樂極生悲", w: "財運順暢，防享樂花費", l: "感情愉快，有喜事", h: "心情好，注意飲食過度" },
    "100110": { n: "澤雷隨", s: 1, t: "隨順時勢、隨和變通之象", c: "跟隨趨勢或貴人，靈活調整有利", w: "隨機應變可得財，忌盲從", l: "彼此隨和，感情順利", h: "注意腳部與消化" },
    "011001": { n: "山風蠱", s: -1, t: "積弊待整、撥亂反正之象", c: "需整頓舊問題，改革雖辛苦但必要", w: "舊帳與漏洞要清理，防財務腐蝕", l: "舊問題需面對處理", h: "慢性病與舊疾要調理" },
    "110000": { n: "地澤臨", s: 1, t: "居高臨下、監督管理，盛大將至", c: "受到重用、權責增加，前景看好", w: "財運漸旺，八月（下半年）防轉折", l: "感情親近，關係深化", h: "整體佳，注意口腔與脾胃" },
    "000011": { n: "風地觀", s: 0, t: "觀察省思、以身作則之象", c: "多觀察少躁動，適合規劃與學習", w: "暫時觀望，不急於投資", l: "需觀察對方真心，不躁進", h: "注意呼吸道與眼睛" },
    "100101": { n: "火雷噬嗑", s: 0, t: "咬合去障、明斷決行之象", c: "有障礙需果斷排除，法務合約留意", w: "財有阻礙，排除後可得", l: "有第三者或誤會，需明斷", h: "注意口腔牙齒與消化" },
    "101001": { n: "山火賁", s: 0, t: "文飾裝點、外表光鮮之象", c: "形象與包裝重要，但內涵更要充實", w: "表面風光，實際平平，防虛花", l: "浪漫美好，但需看重實質", h: "注意皮膚與外表相關" },
    "000001": { n: "山地剝", s: -2, t: "剝落衰退、小人得勢，宜靜守", c: "事業受剝削或裁減，守成避禍", w: "破財損耗，不投資不借貸", l: "感情剝離，防分手或背叛", h: "體力衰退，注意手術與外傷" },
    "100000": { n: "地雷復", s: 1, t: "一陽來復、否極泰來之象", c: "低谷回升，重新出發的時機", w: "財運回升，從小開始累積", l: "舊情復燃或關係修復", h: "病後康復，注意保養" },
    "100111": { n: "天雷無妄", s: 0, t: "無妄之災、順其自然，不妄為則吉", c: "按正道行事，不投機取巧", w: "意外得失皆有，不貪則安", l: "真誠相待，忌猜疑", h: "防意外之疾，不亂投醫" },
    "111001": { n: "山天大畜", s: 1, t: "大有積蓄、厚積薄發之象", c: "累積實力與資歷，大器晚成", w: "積蓄豐厚，宜長期投資", l: "感情深厚穩定", h: "注意飲食積滯" },
    "100001": { n: "山雷頤", s: 0, t: "頤養之道、謹言節食之象", c: "養精蓄銳，注意言語分寸", w: "量入為出，自食其力", l: "需彼此滋養照顧", h: "注意口腔、消化與飲食" },
    "011110": { n: "澤風大過", s: -1, t: "負荷過重、非常之時，需非常之行", c: "壓力超載，需果斷取捨", w: "負債或過度擴張，收縮為宜", l: "關係失衡，老少配或不對等", h: "過勞透支，注意腰背與心臟" },
    "010010": { n: "坎為水", s: -2, t: "重重險陷、困難重重，守信可渡", c: "事業陷入困境，誠信守正方可脫困", w: "財務危機，防詐騙與損失", l: "感情陷入低潮，多體諒", h: "注意腎、耳與憂鬱情緒" },
    "101101": { n: "離為火", s: 1, t: "光明附麗、文明昌盛，但需依附正道", c: "名聲顯揚，適合文化、藝術、公關", w: "財運光明但來去快", l: "熱情明亮，防忽冷忽熱", h: "注意眼睛、心臟與發炎" },
    "001110": { n: "澤山咸", s: 1, t: "感應交感、心意相通之象", c: "人際感應佳，合作與談判順利", w: "靠人緣得財", l: "兩情相悅，婚戀大吉", h: "注意手腳與感官" },
    "011100": { n: "雷風恆", s: 1, t: "恆久持守、常道不變之象", c: "堅持本業，穩定中求發展", w: "細水長流，穩定收入", l: "感情長久，適合長期關係", h: "規律作息，注意肝膽" },
    "001111": { n: "天山遯", s: -1, t: "退避隱遁、以退為進之象", c: "宜退守觀望，不宜爭進", w: "收手保本，不擴張", l: "保持距離，冷靜思考", h: "宜靜養，注意肺與骨" },
    "111100": { n: "雷天大壯", s: 1, t: "強盛壯大、聲勢浩大，忌恃強妄動", c: "實力強勁，宜守正道，忌魯莽", w: "財勢壯旺，防衝動投資", l: "強勢主導，防衝突", h: "精力旺，注意筋骨與衝動受傷" },
    "000101": { n: "火地晉", s: 2, t: "晉升前進、光明在上之象", c: "升遷有望，受上司賞識", w: "收入提升，名利雙收", l: "感情進展順利", h: "整體佳，注意眼睛與心火" },
    "101000": { n: "地火明夷", s: -2, t: "光明受傷、暗夜難行，宜晦養守正", c: "懷才不遇、小人當道，低調自保", w: "財運黯淡，防被陷害破財", l: "感情受傷，隱忍期", h: "注意眼疾、心臟與憂鬱" },
    "101011": { n: "風火家人", s: 1, t: "家道齊整、內外有別之象", c: "家庭事業並重，內部管理為要", w: "家庭財務穩定，開源節流", l: "家庭和睦，婚姻美滿", h: "整體平和，注意心火與呼吸" },
    "110101": { n: "火澤睽", s: -1, t: "乖離背反、意見相左之象", c: "團隊分歧，小事可為大事難成", w: "財務意見不合，防合夥糾紛", l: "彼此疏離、口角多", h: "注意眼睛與情緒" },
    "001010": { n: "水山蹇", s: -2, t: "艱難險阻、寸步難行，宜反求諸己", c: "阻礙重重，宜停下檢討，求助貴人", w: "財路受阻，守住本錢", l: "感情遇阻，需耐心", h: "注意足部、腎與關節" },
    "010100": { n: "雷水解", s: 1, t: "困難解除、春雷化雨之象", c: "難題迎刃而解，宜趁勢推進", w: "財務困境解除，有進帳", l: "誤會冰釋，關係改善", h: "病痛緩解，康復期" },
    "110001": { n: "山澤損", s: 0, t: "減損奉獻、先損後益之象", c: "先付出後收穫，暫時犧牲換長遠", w: "先破財後得利，捐助有福", l: "為對方付出，感情需投入", h: "注意虛損，宜補養" },
    "100011": { n: "風雷益", s: 2, t: "增益進取、利有攸往之象", c: "事業增長，宜積極行動與擴展", w: "財運增益，投資有利", l: "感情增進，有喜", h: "元氣充足，注意肝膽" },
    "111110": { n: "澤天夬", s: 0, t: "決斷去除、果決剛毅之象", c: "需果斷決策、清除障礙，防剛愎", w: "財有決斷之得，防衝動破財", l: "關係需明確決定", h: "注意頭部、口腔與血壓" },
    "011111": { n: "天風姤", s: -1, t: "不期而遇、陰長陽消，防小人", c: "意外機緣與小人並至，謹慎結交", w: "防女色、小人破財", l: "桃花多但不穩，防第三者", h: "注意感染與生殖系統" },
    "000110": { n: "澤地萃", s: 1, t: "薈萃聚集、人才聚會之象", c: "人氣聚集，適合集會、合作、招募", w: "財源匯聚，聚財有道", l: "人緣佳，感情聚合", h: "注意群聚傳染與腸胃" },
    "011000": { n: "地風升", s: 2, t: "上升發展、步步高升之象", c: "穩步升遷，南征（主動拓展）吉", w: "財運漸升，長期看好", l: "感情穩定上升", h: "注意肝膽與脾胃" },
    "010110": { n: "澤水困", s: -2, t: "困頓受限、進退兩難，守正待時", c: "事業困頓，資源不足，堅守信念", w: "財務拮据，防借貸困境", l: "感情受困，多體諒", h: "注意腎、泌尿與情緒低落" },
    "011010": { n: "水風井", s: 0, t: "井養不窮、本源穩定之象", c: "守住本業專長，源源不絕", w: "穩定收入，像井水不竭", l: "平淡而長久", h: "注意腎與飲水衛生" },
    "101110": { n: "澤火革", s: 0, t: "革故鼎新、變革之象，時機成熟則吉", c: "適合轉型、改革、換跑道", w: "財務結構調整，變中求財", l: "關係轉變，可能重新開始", h: "注意發炎與體質改變" },
    "011101": { n: "火風鼎", s: 2, t: "鼎新取新、穩重安定，大吉之象", c: "事業穩固、地位提升，宜培養人才", w: "財運穩健豐厚", l: "家庭穩定，感情成熟", h: "注意飲食與消化" },
    "100100": { n: "震為雷", s: 0, t: "震動奮起、驚而後安之象", c: "變動震盪多，臨危不亂可成", w: "財運起伏，防驚嚇破財", l: "感情波動，防爭吵", h: "注意肝膽、足部與驚嚇" },
    "001001": { n: "艮為山", s: -1, t: "止而不進、靜止修養之象", c: "宜停下腳步，不宜躁進", w: "財運停滯，守成為上", l: "感情停滯，需耐心", h: "注意關節、脾胃與靜養" },
    "001011": { n: "風山漸", s: 1, t: "循序漸進、穩步成長之象", c: "按部就班，穩定升遷", w: "財運穩步增加", l: "感情循序漸進，婚嫁吉", h: "逐漸好轉，注意肝膽" },
    "110100": { n: "雷澤歸妹", s: -1, t: "歸妹失序、始終不正，宜守本分", c: "職場位置不穩，不宜貪求", w: "財來不正或難守", l: "感情名分不正，防糾紛", h: "注意婦科、腳部" },
    "101100": { n: "雷火豐", s: 1, t: "豐盛光大、如日中天，防盛極轉衰", c: "事業豐盛，巔峰期宜謙守", w: "財運豐厚，防奢侈", l: "感情豐富，防猜疑", h: "注意心臟與眼睛" },
    "001101": { n: "火山旅", s: -1, t: "旅途漂泊、居無定所之象", c: "工作變動、出差外派多，不安定", w: "旅途花費多，財難聚", l: "聚少離多", h: "注意旅途安全與腸胃" },
    "011011": { n: "巽為風", s: 0, t: "順從謙遜、無孔不入之象", c: "靈活溝通、順勢而為，忌優柔寡斷", w: "財運隨風，進出不定", l: "感情柔順，防猶豫", h: "注意呼吸道與肝膽" },
    "110110": { n: "兌為澤", s: 1, t: "喜悅和說、口舌之象", c: "適合溝通、教學、業務，防口舌", w: "靠口才得財，防輕諾", l: "愉快和樂，防多言生事", h: "注意口腔、喉嚨與肺" },
    "010011": { n: "風水渙", s: 0, t: "渙散離散、散而後聚之象", c: "團隊渙散需重整，適合分散風險", w: "財務分散，防流失", l: "聚少離多，需凝聚", h: "注意腎與感冒" },
    "110010": { n: "水澤節", s: 1, t: "節制有度、守分適可而止之象", c: "量力而為，制度化管理有利", w: "節約理財，量入為出", l: "彼此有分寸，感情安穩", h: "飲食節制，注意腎與口腔" },
    "110011": { n: "風澤中孚", s: 1, t: "中心誠信、以誠感人之象", c: "以誠信立業，獲得信任", w: "信用帶來財富", l: "真誠相待，感情深厚", h: "注意胸肺與心理壓力" },
    "001100": { n: "雷山小過", s: -1, t: "小有過失、宜小事不宜大事", c: "小事可成，大事不宜，謹慎細節", w: "小財可得，大投資不宜", l: "小摩擦多，不宜大決定", h: "注意手腳小傷與筋骨" },
    "101010": { n: "水火既濟", s: 1, t: "事已完成、功德圓滿，防盛極而衰", c: "階段性成功，宜守成防鬆懈", w: "財運圓滿，守住成果", l: "感情圓滿，防倦怠", h: "整體平衡，注意心腎" },
    "010101": { n: "火水未濟", s: 0, t: "尚未完成、接近成功，需再努力", c: "事情未定，最後一哩路要謹慎", w: "財運未定，再努力可成", l: "感情未定，需時間", h: "注意心腎不交，失眠" }
  };
  // 爻位吉凶（初～上）與當位加分
  const YAO_POS = [
    { s: 0, t: "初爻為事之始，宜潛藏準備、打好基礎，不急於表現" },
    { s: 1, t: "二爻居下卦之中，得中守正，穩健可行，有貴人相助" },
    { s: -1, t: "三爻處進退之際，多勞多憂，謹慎為上，防口舌與挫折" },
    { s: 0, t: "四爻近君位，多懼多疑，宜守正配合、不爭功" },
    { s: 2, t: "五爻尊位得中，名位俱佳，最有利的發展位置" },
    { s: -1, t: "上爻物極必反，功成身退，宜收斂、不可戀棧" }
  ];
  const rate = (s) => (s >= 3 ? "大吉" : s >= 1 ? "吉" : s >= -1 ? "平" : "注意");

  // ---------- 卦工具 ----------
  const hexOf = (lower, upper) => TRI[lower] + TRI[upper];
  const flip = (key, i) => key.slice(0, i) + (key[i] === "1" ? "0" : "1") + key.slice(i + 1);
  const swap = (key) => key.slice(3) + key.slice(0, 3);
  const info = (key) => Object.assign({ key, lower: TRI_NAME[key.slice(0, 3)], upper: TRI_NAME[key.slice(3)] }, HEX[key]);
  const img = (h) => TRI_IMG[h.upper] + TRI_IMG[h.lower];
  const yaoLabel = (key, i) => YAO_NAME[i] + (key[i] === "1" ? "九" : "六");
  const inPlace = (key, i) => (key[i] === "1") === (i % 2 === 0); // 陽爻居陽位（初三五）、陰爻居陰位
  function yaoScore(key, i) { return YAO_POS[i].s + (inPlace(key, i) ? 0.5 : -0.5); }
  function yaoText(key, i) { return YAO_POS[i].t + (inPlace(key, i) ? "；此爻當位，所作合宜" : "；此爻不當位，宜調整步調"); }

  // ---------- 起卦 ----------
  function cast(chart) {
    const P = { 年: chart.pillars[3], 月: chart.pillars[2], 日: chart.pillars[1], 時: chart.pillars[0] };
    const chars = ["年", "月", "日", "時"].map((k) => ({ k, gan: P[k].gan.char, zhi: P[k].zhi.char }));
    const nums = chars.map((c) => ({ k: c.k, gan: c.gan, gn: NUM[c.gan], zhi: c.zhi, zn: NUM[c.zhi] }));
    let tian = 0, di = 0;
    nums.forEach((c) => { [c.gn, c.zn].forEach((v) => { if (v % 2) tian += v; else di += v; }); });
    const yangYear = GAN.indexOf(P.年.gan.char) % 2 === 0;
    const male = chart.gender === "male";
    const shun = (male && yangYear) || (!male && !yangYear); // 陽男陰女＝順
    const tail = (v, mod) => { const r = v % mod || mod; return r % 10 || 10; };
    const tianTail = tail(tian, 25), diTail = tail(di, 30);
    const tianTri = NUM_TRI[tianTail][shun ? 0 : 1], diTri = NUM_TRI[diTail][shun ? 0 : 1];
    const xian = shun ? hexOf(diTri, tianTri) : hexOf(tianTri, diTri); // 上卦在後三位
    // 元堂：時支子～巳配初～三爻／午～亥配四～上爻；陽男陰女由初爻順數，陰男陽女由上爻逆數
    const hIdx = ZHI.indexOf(P.時.zhi.char);
    const yuantang = shun ? hIdx % 6 : 5 - (hIdx % 6);
    const hou = swap(flip(xian, yuantang));
    // 大運：先天卦從元堂起、後天卦從同一位置起，順（陽男陰女）向上、逆向下；陽爻 9 年、陰爻 6 年
    const steps = [];
    let age = 1;
    [["先天", xian], ["後天", hou]].forEach(([name, key]) => {
      for (let n = 0; n < 6; n++) {
        const i = shun ? (yuantang + n) % 6 : (yuantang - n + 6) % 6;
        const yrs = key[i] === "1" ? 9 : 6;
        steps.push({ stage: name, key, i, from: age, to: age + yrs - 1 });
        age += yrs;
      }
    });
    return { nums, tian, di, tianTail, diTail, tianTri, diTri, shun, yangYear, male, xian: info(xian), hou: info(hou), yuantang, steps, lastAge: age - 1 };
  }

  // 節氣月（寅月起）：[{ m, zhi, jie, start, end }]，end＝下個節前一天
  const JIE = ["立春", "惊蛰", "清明", "立夏", "芒种", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "XIAO_HAN"];
  const JIE_T = ["立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];
  function solarMonths(year) {
    const t = Solar.fromYmd(year, 6, 1).getLunar().getJieQiTable();
    const next = Solar.fromYmd(year + 1, 6, 1).getLunar().getJieQiTable()["立春"];
    const toDate = (s) => new Date(s.getYear(), s.getMonth() - 1, s.getDay());
    const starts = JIE.map((k) => toDate(t[k])).concat([toDate(next)]);
    return JIE.map((k, i) => {
      const end = new Date(starts[i + 1]); end.setDate(end.getDate() - 1);
      return { m: i + 1, zhi: ZHI[(i + 2) % 12], jie: JIE_T[i], start: starts[i], end };
    });
  }
  const md = (d) => (d.getMonth() + 1) + "/" + d.getDate();

  function analyze(chart, o) {
    const C = cast(chart);
    const birthYear = Number(chart.solarText.slice(0, 4));
    const age = o.year - birthYear + 1; // 虛歲（以立春為界的年度）
    let step = C.steps.find((s) => age >= s.from && age <= s.to);
    if (!step) step = C.steps[C.steps.length - 1]; // 超過大運表以後天卦末爻續論
    const yearKey = step.key, yi = step.i;
    const yearZhi = info(flip(yearKey, yi));
    const yearScore = yaoScore(yearKey, yi) + (HEX[yearKey].s + yearZhi.s) / 2;
    // 流月：上半年（寅～未）在值年本卦上從值年爻起每月推一爻，下半年（申～丑）改在值年之卦上續推；
    // 順逆依陽男陰女，爻變之卦為該月月象
    const zhiKey = yearZhi.key;
    const months = solarMonths(o.year).map((mo, n) => {
      const base = n < 6 ? yearKey : zhiKey;
      const i = (((C.shun ? yi + n : yi - n) % 6) + 6) % 6;
      const hex = info(flip(base, i));
      const score = yaoScore(base, i) + hex.s;
      return Object.assign(mo, { i, base, hex, score: Math.round(score * 10) / 10, rating: rate(score) });
    });
    const gz = (() => { const l = Solar.fromYmd(o.year, 6, 1).getLunar(); return l.getYearInGanZhiExact ? l.getYearInGanZhiExact() : l.getYearInGanZhi(); })();
    return { C, chart, year: o.year, ganzhi: gz, age, step, yearKey, yearHex: info(yearKey), yi, yearZhi, yearScore: Math.round(yearScore * 10) / 10, yearRating: rate(yearScore), months };
  }

  // ---------- 版面（沿用 zr-* 樣式）----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const RATING_CLS = { 大吉: "zr-r-great", 吉: "zr-r-good", 平: "zr-r-flat", 注意: "zr-r-warn" };
  const RATING_BIG = { 大吉: "旺", 吉: "順", 平: "穩", 注意: "防" };
  function table(cols, rows, opt) {
    opt = opt || {};
    const head = "<tr>" + cols.map((c) => '<th style="width:' + c[1] + '%">' + esc(c[0]) + "</th>").join("") + "</tr>";
    const body = rows.map((r) => "<tr>" + r.map((v, i) => {
      if (opt.rating && i === r.length - 1) return '<td class="zr-rate ' + RATING_CLS[v] + '">' + v + "</td>";
      return "<td" + (i === 0 ? ' class="zr-first' + (opt.darkFirst ? " zr-first-dark" : "") + '"' : "") + ">" + v + "</td>";
    }).join("") + "</tr>").join("");
    return '<table class="zr-table"><thead>' + head + "</thead><tbody>" + body + "</tbody></table>";
  }
  const h1 = (num, text) => '<div class="zr-h1"><span class="zr-num">' + num + "</span>" + esc(text) + "</div>";
  const h2 = (text) => '<div class="zr-h2">' + esc(text) + "</div>";
  const callout = (html) => '<div class="zr-callout">' + html + "</div>";
  const ul = (items, cls) => '<ul class="' + (cls || "zr-list") + '">' + items.map((t) => "<li>" + t + "</li>").join("") + "</ul>";
  // 卦象圖：六爻由上而下畫，陽爻一橫、陰爻兩短橫，元堂／動爻標紅
  function hexFig(key, mark) {
    let s = '<div class="tp-hex">';
    for (let i = 5; i >= 0; i--) {
      s += '<div class="tp-yao' + (i === mark ? " tp-yao-mark" : "") + '">' + (key[i] === "1" ? '<span class="tp-yang"></span>' : '<span class="tp-yin"></span><span class="tp-yin"></span>') + "</div>";
    }
    return s + "</div>";
  }
  function hexCard(h, mark, label) {
    return '<div class="tp-hexcard">' + hexFig(h.key, mark) + '<div class="tp-hexinfo"><div class="tp-hexname">' + h.n + "</div><div class=\"tp-hexsub\">" + img(h) + "　上" + h.upper + "下" + h.lower +
      (mark != null ? "　" + label + "：" + yaoLabel(h.key, mark) : "") + "</div></div></div>";
  }
  const domainTable = (h) => table([["面向", 14], ["解讀", 86]], [["總論", h.t], ["事業", h.c], ["財運", h.w], ["感情", h.l], ["健康", h.h]]);

  function render(R) {
    const C = R.C, ch = R.chart;
    const root = document.createElement("div");
    root.className = "zr-report tp-report";
    const add = (html, pageBreak) => { const b = document.createElement("div"); b.className = "zr-block"; b.innerHTML = html; if (pageBreak) b.setAttribute("data-pdf-break-before", ""); root.appendChild(b); return b; };
    const genderText = ch.gender === "male" ? "男" : "女";
    const best = R.months.slice().sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.m - b.m);
    const low = R.months.slice().sort((a, b) => a.score - b.score).slice(0, 2).sort((a, b) => a.m - b.m);
    const mName = (mo) => mo.zhi + "月（" + mo.jie + "）";

    add('<div class="zr-kicker">鐵版神數　·　簡化推算版</div><div class="zr-title">' + R.year + " " + R.ganzhi + " 年命數報告</div>" +
      '<div class="zr-sub"><b>' + esc(ch.name) + "</b>　｜　" + (C.yangYear ? "陽" : "陰") + genderText + "・先天" + C.xian.n + "・後天" + C.hou.n + "・虛歲 " + R.age + "</div>" +
      '<div class="zr-rule"></div><div class="zr-cards">' +
      '<div class="zr-card"><div class="zr-card-label">本命先天卦</div><div class="zr-card-big" style="font-size:24px">' + C.xian.n + '</div><div class="zr-card-desc">' + C.xian.t + "</div></div>" +
      '<div class="zr-card"><div class="zr-card-label">' + R.year + ' 值年</div><div class="zr-card-big">' + RATING_BIG[R.yearRating] + '</div><div class="zr-card-desc">' + R.yearHex.n + "・" + yaoLabel(R.yearKey, R.yi) + "，之卦" + R.yearZhi.n + "</div></div>" +
      '<div class="zr-card"><div class="zr-card-label">' + R.year + ' 最旺月份</div><div class="zr-card-big" style="font-size:24px">' + best.map((x) => x.zhi + "月").join("・") + '</div><div class="zr-card-desc">需留意：' + low.map((x) => x.zhi + "月").join("、") + "</div></div></div>");

    // 01 命盤基本資料與河洛數
    add(h1("01", "命盤基本資料與河洛數") + callout("依八字八個字取河圖數：天數（奇數和）" + C.tian + "、地數（偶數和）" + C.di + "；天數除 25 餘尾數 " + C.tianTail + " 得" + C.tianTri + "卦、地數除 30 餘尾數 " + C.diTail + " 得" + C.diTri + "卦，" +
      (C.shun ? "陽男陰女順行，天數為上卦、地數為下卦" : "陰男陽女逆行，地數為上卦、天數為下卦") + "，成先天卦<b>" + C.xian.n + "</b>；元堂在" + yaoLabel(C.xian.key, C.yuantang) + "。"));
    add(table([["項目", 18], ["內容", 82]], [
      ["出生", "公元 " + esc(ch.solarText) + "（農曆" + esc(ch.lunarText) + "），" + genderText + "，生肖" + esc(ch.shengxiao)],
      ["四柱", C.nums.map((c) => c.gan + c.zhi + c.k).join("　")],
      ["河洛數", C.nums.map((c) => c.k + "柱 " + c.gan + c.gn + "・" + c.zhi + c.zn).join("　")],
      ["天數／地數", "天數 " + C.tian + "（餘 " + (C.tian % 25 || 25) + "，尾數 " + C.tianTail + "）／地數 " + C.di + "（餘 " + (C.di % 30 || 30) + "，尾數 " + C.diTail + "）"],
      ["先天卦", C.xian.n + "（" + img(C.xian) + "），元堂" + yaoLabel(C.xian.key, C.yuantang)],
      ["後天卦", C.hou.n + "（" + img(C.hou) + "），由先天卦元堂爻變、上下互換而得"],
      ["大運行度", "先天卦管 1–" + C.steps[5].to + " 歲，後天卦管 " + C.steps[6].from + "–" + C.lastAge + " 歲；陽爻九年、陰爻六年"]
    ], { darkFirst: true }));

    // 02 先天卦
    add(h1("02", "先天卦：" + C.xian.n + "（本命與前半生）") + hexCard(C.xian, C.yuantang, "元堂") + callout("<b>" + C.xian.n + "：</b>" + C.xian.t + "。先天卦是與生俱來的性情與前半生的格局，元堂" + yaoLabel(C.xian.key, C.yuantang) + "是本命的主爻：" + yaoText(C.xian.key, C.yuantang) + "。"));
    add(domainTable(C.xian));
    // 03 後天卦
    add(h1("03", "後天卦：" + C.hou.n + "（後運與後半生）") + hexCard(C.hou, C.yuantang, "元堂") + callout("<b>" + C.hou.n + "：</b>" + C.hou.t + "。後天卦主後半生的走向與努力後的結果，" + (C.hou.s > C.xian.s ? "後天優於先天，越走越順，中年後漸入佳境" : C.hou.s < C.xian.s ? "後天不及先天，中年後宜守成、重積累" : "先後天相當，一生格局平穩") + "。"));
    add(domainTable(C.hou));

    // 04 大運行度表
    add(h1("04", "大運行度（卦限）") + callout("先天卦從元堂起算，每爻陽管九年、陰管六年，" + (C.shun ? "由下往上順行" : "由上往下逆行") + "；先天六爻走完接後天卦。目前虛歲 " + R.age + "，行" + R.step.stage + "卦" + R.yearHex.n + yaoLabel(R.yearKey, R.yi) + "運。"));
    add(table([["階段", 10], ["卦", 16], ["爻", 10], ["虛歲", 14], ["運程解讀", 50]],
      C.steps.map((s) => [s.stage + (s === R.step ? "（現行）" : ""), HEX[s.key].n, yaoLabel(s.key, s.i), s.from + "–" + s.to + " 歲", esc(YAO_POS[s.i].t) + "；之卦" + HEX[flip(s.key, s.i)].n + "，" + HEX[flip(s.key, s.i)].t])));

    // 05 值年
    add(h1("05", R.year + " " + R.ganzhi + " 值年運勢") + hexCard(R.yearHex, R.yi, "值年爻") + callout("今年虛歲 " + R.age + "，值" + R.step.stage + "卦<b>" + R.yearHex.n + "</b>" + yaoLabel(R.yearKey, R.yi) + "，爻變之卦為<b>" + R.yearZhi.n + "</b>（" + R.yearZhi.t + "）。全年評估「" + R.yearRating + "」。"), true);
    add(ul([
      "<b>本卦" + R.yearHex.n + "：</b>" + R.yearHex.t + "，是今年的大環境與基調。",
      "<b>值年爻" + yaoLabel(R.yearKey, R.yi) + "：</b>" + yaoText(R.yearKey, R.yi) + "。",
      "<b>之卦" + R.yearZhi.n + "：</b>" + R.yearZhi.t + "，是今年努力後的走向。",
      "<b>事業：</b>" + R.yearZhi.c + "。", "<b>財運：</b>" + R.yearZhi.w + "。", "<b>感情：</b>" + R.yearZhi.l + "。", "<b>健康：</b>" + R.yearZhi.h + "。"
    ]));

    // 06 十二個月
    add(h1("06", R.year + " 十二個月運勢") + callout("流月以節氣月為準（立春起為寅月），上半年在本卦" + R.yearHex.n + "從值年爻" + yaoLabel(R.yearKey, R.yi) + "起每月推一爻，下半年在之卦" + R.yearZhi.n + "上續推，爻變之卦為該月月象。全年最旺是" + best.map(mName).join("、") + "，最需留意是" + low.map(mName).join("、") + "。"));
    add(table([["月份", 13], ["國曆", 13], ["動爻", 9], ["之卦（月象）", 15], ["重點", 41], ["評估", 9]],
      R.months.map((mo) => [mo.zhi + "月<br>" + mo.jie, md(mo.start) + "–" + md(mo.end), (mo.base === R.yearKey ? "" : "之卦") + yaoLabel(mo.base, mo.i), mo.hex.n, esc(mo.hex.t), mo.rating]), { rating: true }));
    R.months.forEach((mo) => {
      add(h2(R.year + " 年 " + mo.zhi + "月（" + mo.jie + " " + md(mo.start) + "–" + md(mo.end) + "）　" + mo.hex.n + "（" + mo.rating + "）") + ul([
        "<b>" + (mo.base === R.yearKey ? "本卦" + R.yearHex.n : "之卦" + R.yearZhi.n) + "動爻" + yaoLabel(mo.base, mo.i) + "：</b>" + yaoText(mo.base, mo.i) + "。",
        "<b>月象" + mo.hex.n + "：</b>" + mo.hex.t + "。",
        "<b>事業：</b>" + mo.hex.c + "；<b>財運：</b>" + mo.hex.w + "。",
        "<b>感情：</b>" + mo.hex.l + "；<b>健康：</b>" + mo.hex.h + "。"
      ]));
    });

    // 07 總結
    add(h1("07", "總結與提醒") + callout(R.year + " 年值" + R.yearHex.n + yaoLabel(R.yearKey, R.yi) + "，之卦" + R.yearZhi.n + "：" + R.yearZhi.t + "。把握" + best.map((x) => x.zhi + "月").join("、") + "，" + low.map((x) => x.zhi + "月").join("、") + "放慢腳步。"));
    add(ul(["本命" + C.xian.n + "：" + C.xian.c, "今年重點：" + R.yearZhi.c, "財務：" + R.yearZhi.w, "健康：" + R.yearZhi.h], "zr-check") +
      h2("說明") + ul([
        "本報告為「簡化推算版」：依鐵版神數所本的河洛理數，以八字起先天／後天卦與大運、流年、流月，解讀為卦義與爻位的規則式文字，<b>並非鐵版神數原典條文，亦未經考刻</b>。",
        "流年以立春為界、流月以節氣為界；不同派別起卦與元堂取法略有差異。",
        "命理為傳統文化的詮釋工具，適合用來自我反思與規劃；重要決定請以自身狀況與專業意見為準。"
      ]) + '<div class="zr-end">Aries 命理工作室　·　' + new Date().getFullYear() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getDate() + " 產生</div>");
    return root;
  }

  window.Tiepan = { cast, analyze, render, HEX };
})();
