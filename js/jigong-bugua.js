/* 濟公象棋卜卦系統引擎——移植自 https://adan3862936.github.io/bugua-system/（使用者指定畫面功能一模一樣）。
   除檔尾「Aries 站整合」區塊外，內容為該站 <script> 原封照抄（供 ５棋單卦／３２棋命卦／速查表 三頁籤）。 */
/* =========================================================================
   濟公象棋卜卦系統  v1.0
   個人學習用工具 — 依據課堂學習筆記整理之規則引擎
   ========================================================================= */

/* ===== 棋子定義 ===== */
const PIECES = {
  // 紅方
  '帥': {color:'red',   kind:'shuai', name:'帥', score:80, level:'天-上格', element:'金', persona:'皇帝、權力、講話有影響力。承擔責任易憂慮，喜掌控不喜親自操作。', organ:'肺、大腸、皮膚、鼻、呼吸系統', emotion:'憂傷肺（悲觀、自以為是）'},
  '仕': {color:'red',   kind:'shi',   name:'仕', score:60, level:'天-中格', element:'金', persona:'像行政院長，謀略、運籌帷幄、能文能武。重義氣有智慧，自以為是的想法多，需承擔大局成敗。', organ:'肺、大腸、皮膚、鼻、呼吸系統', emotion:'憂傷肺'},
  '相': {color:'red',   kind:'xiang', name:'相', score:40, level:'天-下格', element:'火', persona:'宰相般足智多謀，執行政策。親民慈悲、重禮節，但被動不積極，與宗教修行緣份較深。', organ:'心、小腸、血管、舌、血液循環', emotion:'喜傷心'},
  '俥': {color:'red',   kind:'che',   name:'俥', score:30, level:'人-上格', element:'木', persona:'帶領一群人的領導者，喜歡訂規矩、管事，不喜被約束。心軟但脾氣大、講話直接、性格衝。', organ:'肝、膽、筋、目、免疫系統', emotion:'怒傷肝（壓抑、浮燥）'},
  '傌': {color:'red',   kind:'ma',    name:'傌', score:20, level:'人-中格', element:'木', persona:'遊走人群之間，好管閒事、心軟嘴軟，察言觀色、口才好，常不在家。對情感有浪漫期待。', organ:'關節、筋絡（馬會跑來跑去，代表關節筋絡）', emotion:'怒傷肝'},
  '炮': {color:'red',   kind:'pao',   name:'炮', score:15, level:'人-下格', element:'水', persona:'團體裡較沒權力，靠小聰明善巧突破。直覺力強、人緣不錯、長相通常好。受威脅時內心常恐懼。', organ:'腎、膀胱、骨、耳、婦科、攝護腺、內分泌', emotion:'恐傷腎'},
  '兵': {color:'red',   kind:'bing',  name:'兵', score:10, level:'地-上格', element:'土', persona:'腳踏實地、討厭別人不守信用，有理想不投機。對「能不能落地執行」想很多，務實踏實。', organ:'脾、胃、肌肉、口、消化系統', emotion:'思傷胃（緊張焦慮）'},
  // 黑方
  '將': {color:'black', kind:'shuai', name:'將', score:80, level:'天-上格', element:'金', persona:'皇帝、權力、講話有影響力。承擔責任易憂慮，喜掌控不喜親自操作。', organ:'肺、大腸、皮膚、鼻、呼吸系統', emotion:'憂傷肺'},
  '士': {color:'black', kind:'shi',   name:'士', score:60, level:'天-中格', element:'金', persona:'像行政院長，謀略、運籌帷幄、能文能武。重義氣有智慧，自以為是的想法多，需承擔大局成敗。', organ:'肺、大腸、皮膚、鼻、呼吸系統', emotion:'憂傷肺'},
  '象': {color:'black', kind:'xiang', name:'象', score:40, level:'天-下格', element:'火', persona:'宰相般足智多謀，執行政策。親民慈悲、重禮節，但被動不積極，與宗教修行緣份較深。', organ:'心、小腸、血管、舌、血液循環', emotion:'喜傷心'},
  '車': {color:'black', kind:'che',   name:'車', score:30, level:'人-上格', element:'木', persona:'帶領一群人的領導者，喜歡訂規矩、管事，不喜被約束。心軟但脾氣大、講話直接、性格衝。', organ:'肝、膽、筋、目、免疫系統', emotion:'怒傷肝'},
  '馬': {color:'black', kind:'ma',    name:'馬', score:20, level:'人-中格', element:'木', persona:'遊走人群之間，好管閒事、心軟嘴軟，察言觀色、口才好，常不在家。對情感有浪漫期待。', organ:'關節、筋絡（馬會跑來跑去，代表關節筋絡）', emotion:'怒傷肝'},
  '包': {color:'black', kind:'pao',   name:'包', score:15, level:'人-下格', element:'水', persona:'團體裡較沒權力，靠小聰明善巧突破。直覺力強、人緣不錯、長相通常好。受威脅時內心常恐懼。', organ:'腎、膀胱、骨、耳、婦科、攝護腺、內分泌', emotion:'恐傷腎'},
  '卒': {color:'black', kind:'bing',  name:'卒', score:10, level:'地-下格', element:'土', persona:'腳踏實地、討厭別人不守信用，有理想不投機。對「能不能落地執行」想很多，務實踏實。', organ:'脾、胃、肌肉、口、消化系統', emotion:'思傷胃'},
};
const PIECE_ORDER = ['帥','仕','相','俥','傌','炮','兵','將','士','象','車','馬','包','卒'];

/* ===== 隨機抽棋（書版實體 32 顆棋子袋：紅方 16 + 黑方 16） ===== */
//   紅方：帥×1, 仕×2, 相×2, 俥×2, 傌×2, 炮×2, 兵×5 = 16
//   黑方：將×1, 士×2, 象×2, 車×2, 馬×2, 包×2, 卒×5 = 16
//   共 32 顆，模擬實體袋子搖一搖抽出來的卜卦過程
function buildPieceBag() {
  const bag = [];
  // 紅方
  bag.push('帥');
  for (let i = 0; i < 2; i++) bag.push('仕','相','俥','傌','炮');
  for (let i = 0; i < 5; i++) bag.push('兵');
  // 黑方
  bag.push('將');
  for (let i = 0; i < 2; i++) bag.push('士','象','車','馬','包');
  for (let i = 0; i < 5; i++) bag.push('卒');
  return bag;
}
// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// 抽 n 顆（不放回，模擬實體袋抽棋）
function drawRandomPieces(n) {
  return shuffleArray(buildPieceBag()).slice(0, n);
}

const POSITIONS = ['center','top','bottom','left','right'];
const POS_LABEL = {center:'中宮(自己)', top:'上(長輩/老闆/父母)', bottom:'下(晚輩/子女/下屬)', left:'左(女平輩/老婆)', right:'右(男平輩/老公)'};
const POS_NUM = {center:1, left:2, right:3, top:4, bottom:5};

/* ===== 規則引擎 ===== */
const HIERARCHY = {shuai:3, shi:2, xiang:1};

// 兩位置是否相鄰（中跟外圍才相鄰，外圍彼此不相鄰）
function isAdjacent(a, b) {
  if (a === b) return false;
  if (a === 'center' || b === 'center') return true;
  return false;
}
// 兩位置是否在同一直線上（含跨越中央）
function isStraightLine(a, b) {
  if (a === b) return false;
  if (isAdjacent(a, b)) return true;
  // 對面位置：上↔下、左↔右
  if ((a==='top' && b==='bottom') || (a==='bottom' && b==='top')) return true;
  if ((a==='left' && b==='right') || (a==='right' && b==='left')) return true;
  return false;
}
// 取得跨越中央時的「中間」位置
function getMiddle(a, b) {
  if ((a==='top' && b==='bottom') || (a==='bottom' && b==='top')) return 'center';
  if ((a==='left' && b==='right') || (a==='right' && b==='left')) return 'center';
  return null;
}
// 兵卒方向是否合法（v2.9.2 修正，2026-05-09 祥哥糾正）
//   蔡建安老師明確規則（disciple-lecture transcript 行 117-118, 137-139, 146-147, 194-195）：
//     「兵啊，只能前進，左右不能後退...往前衝，左右邊的敵人都可以攻，可是唯一不行的就是後退」
//     「兵呢只能一步一腳印往前走、往左右走，不能後退」
//     「卒只能往上跟左右」←（這句最關鍵，明確說卒也是「上、左、右」）
//   濟公象棋卜卦特殊規則：兵卒不分顏色，一律「上、左、右」可走，「下」=後退=禁止
//   （跟傳統象棋紅黑方向相反不一樣，這是書本明確規定）
//   ① 從上→中央 = 往下 = 後退 ✗
//   ② 從中央→下 = 往下 = 後退 ✗
//   ③ 從下→中央 = 往上 = 前進 ✓
//   ④ 從中央→上 = 往上 = 前進 ✓
//   ⑤ 左↔中央、右↔中央 = 平移 ✓
function bingDirOK(color, from, to) {
  // 兵卒一律不能往下（不分顏色）
  if (from === 'top' && to === 'center') return false;
  if (from === 'center' && to === 'bottom') return false;
  return true;
}

// 明君格擋住 將/帥 ↔ 兵/卒 互吃（書本 P75 明文）
//   書本 P75「⑧ 明君格」：
//     「將看得到兵，帥看得到卒，即為明君格」
//     「在明君格中，只有將與兵 / 帥與卒不會互吃，
//      其它棋子只要沒有保護或牽制或好朋友格，是會互吃的」
//   意涵：將/帥跟兵/卒就像「皇帝與身邊服侍他的太監（公公）」，
//        雙方互為依存，不會互相攻擊。
//   只擋「將↔兵」「帥↔卒」這兩種配對；不影響其他棋子（如 馬↔兵 仍正常互吃）。
function isMingjunBlocked(board, attackerPos, victimPos) {
  const a = board[attackerPos];
  const v = board[victimPos];
  if (!a || !v) return false;

  // 只擋 將↔兵 / 帥↔卒（雙向）
  const isJiangBing = (a.name === '將' && v.name === '兵') || (a.name === '兵' && v.name === '將');
  const isShuaiZu  = (a.name === '帥' && v.name === '卒') || (a.name === '卒' && v.name === '帥');
  if (!isJiangBing && !isShuaiZu) return false;

  // 「看得到」= 相鄰 OR 斜對（書本 P75 明君格成立條件）
  const sees = isAdjacent(attackerPos, victimPos) || isDiagonalPair(attackerPos, victimPos);
  return sees;
}

// 中央能否「過局往上吃」上一局任一對方棋（生死關「飛不出去」第 3 條件）
// 老師（吳慧琳）範例（書本 P31-32 配套規則）：
//   ▼ 局 7 中棋炮 → 能飛到上面過局往上吃 → 飛得出去 → 不構成生死關
//   ▼ 局 8 中棋馬 → 馬也出不去 → 飛不出去 → 構成生死關
//
// 規則：
//   ◎ 車/俥（直線飛山）→ 跨局能直接吃上一局任何對方棋 → 能飛出去
//   ◎ 炮/包（跳格吃）→ 跨局能跳格吃上一局任何對方棋 → 能飛出去
//   ◎ 馬/傌（走斜）→ 5 子盤無斜方向，永遠吃不到（跨局也一樣）→ 飛不出去
//   ◎ 將/帥、士/仕、象/相、兵/卒（相鄰限制）→ 跨局距離太遠，吃不到 → 飛不出去
function canEscapeUpward(currentLb, prevLb) {
  if (!prevLb || !currentLb || !currentLb.center) return false;
  const c = currentLb.center;
  if (c.kind === 'che' || c.kind === 'pao') {
    // 車/炮 能跨局飛山到上一局任何位置（書本/老師明確：炮可飛到上面過局往上吃）
    for (const p of POSITIONS) {
      const t = prevLb[p];
      if (t && t.color !== c.color) return true;
    }
  }
  return false;
}

// 核心：attacker 能否吃 victim
function canEat(board, attackerPos, victimPos) {
  const a = board[attackerPos];
  const v = board[victimPos];
  if (!a || !v) return false;
  if (a.color === v.color) return false;

  // 書本 P75 明君格規則：將/帥 ↔ 兵/卒 不會互吃
  // 這個守衛會自動傳播到 isProtected（用 canEat 模擬反殺）、
  // 通吃格判定（書本 P77「沒有格局的限制」自然成立）、
  // 抗衡/牽制/計分等所有依賴 canEat 的判定。
  if (isMingjunBlocked(board, attackerPos, victimPos)) return false;

  switch (a.kind) {
    case 'shuai': case 'shi': case 'xiang': {
      if (!isAdjacent(attackerPos, victimPos)) return false;
      // 大吃小或同階
      return HIERARCHY[a.kind] >= HIERARCHY[v.kind] || HIERARCHY[v.kind] === undefined ? true : HIERARCHY[a.kind] >= HIERARCHY[v.kind];
      // 小棋(車馬炮兵)沒有 hierarchy，大棋(將士象)能吃
    }
    case 'che': {
      // 車：直線到達，跨越中央時中央有棋也可吃（跳過自己人）
      if (isStraightLine(attackerPos, victimPos)) return true;
      return false;
    }
    case 'ma': {
      // 馬走斜（v2.9.6 修正，2026-06-07 祥哥+老師吳慧琳 AriesWu 糾正）
      //   書本 P75 明君格段落範例：「但馬可以把兵吃掉」+ 配圖證實馬↔兵斜對能吃
      //   老師明確：傌斜對能吃 上士、下車（在祥哥盤面）
      //
      // 規則：
      //   ▼ 中央↔外圍 = 相鄰，不是斜對 → 馬入中宮永遠吃不到（書本「有志難伸」物理意義保留）
      //   ▼ 外圍↔外圍 斜對位置（上↔左、上↔右、下↔左、下↔右）→ 馬走斜能吃
      //   ▼ 外圍↔外圍 對面（上↔下、左↔右）= 跨中央直線，不是斜對 → 馬不能吃
      if (attackerPos === 'center' || victimPos === 'center') return false;
      return isDiagonalPair(attackerPos, victimPos);
    }
    case 'pao': {
      // 炮：需跳板。中央↔周圍無中間，不能吃；周圍↔對面周圍中間是中央(有棋=跳板)，可以吃
      if (isAdjacent(attackerPos, victimPos)) return false;
      const mid = getMiddle(attackerPos, victimPos);
      if (mid && board[mid]) return true;
      return false;
    }
    case 'bing': {
      if (!isAdjacent(attackerPos, victimPos)) return false;
      return bingDirOK(a.color, attackerPos, victimPos);
    }
  }
  return false;
}

// victim 是否有保護（標準象棋保護概念，2026-05-05 修正）
//   定義：attacker 吃掉 victim 並移到 victim 的位置後，
//        是否有同色守衛能吃掉這個「佔據 victim 位置的 attacker」
//
//   範例（祥哥例子）：左紅仕 + 中紅兵 + 右黑相
//     1. 黑相能吃中央紅兵（相 40 大 > 兵 10）→ 黑相從右移到中央
//     2. 紅仕在左，相鄰中央 → 紅仕能吃中央的黑相（仕 60 大 > 相 40）
//     3. 紅兵被紅仕保護 → 兵被吃時分數減半
function isProtected(board, victimPos, attackerPos) {
  const v = board[victimPos];
  const a = board[attackerPos];
  if (!v || !a) return false;
  // 模擬：attacker 吃掉 victim 並移到 victim 位置
  const sim = {};
  for (const k of POSITIONS) sim[k] = board[k];
  sim[attackerPos] = null;
  sim[victimPos] = a;
  // 找同色守衛能吃到佔據 victim 位置的 attacker
  for (const p of POSITIONS) {
    if (p === victimPos || p === attackerPos) continue;
    const guard = sim[p];
    if (!guard) continue;
    if (guard.color !== v.color) continue;
    if (canEat(sim, p, victimPos)) return true;
  }
  return false;
}

// 兩棋是否同字異色配對（粗略判斷，不看位置）
function isFriendPair(p1, p2) {
  if (!p1 || !p2) return false;
  if (p1.color === p2.color) return false;
  return p1.kind === p2.kind;
}

// 兩個外圍位置是否「斜對相鄰」（上-左、上-右、下-左、下-右）
function isDiagonalPair(a, b) {
  const diagonals = [
    ['top','left'], ['top','right'],
    ['bottom','left'], ['bottom','right']
  ];
  return diagonals.some(([x,y]) =>
    (a===x && b===y) || (a===y && b===x)
  );
}

// 嚴格判定「好朋友格」（依棋種要求位置，2026-05-05 v3）
//   將/帥、仕/士、象/相、俥/車、兵/卒：中-外圍上下左右相鄰
//   馬/傌：要「斜相鄰」（外圍對外圍：上+左、上+右、下+左、下+右）
//   炮/包：要「中間隔一隻棋」（上+下且中央有棋 / 左+右且中央有棋）
function isFriendPairStrict(b, p1pos, p2pos) {
  const p1 = b[p1pos], p2 = b[p2pos];
  if (!isFriendPair(p1, p2)) return false;
  const kind = p1.kind;
  if (kind === 'ma') {
    // 馬要斜對相鄰（上-左、上-右、下-左、下-右）
    return isDiagonalPair(p1pos, p2pos);
  }
  if (kind === 'pao') {
    // 炮要中間隔一隻棋（上+下或左+右，且中央有棋當跳板）
    const mid = getMiddle(p1pos, p2pos);
    return mid !== null && b[mid] !== null;
  }
  // 將仕象車兵：中-外圍上下左右相鄰才是好朋友
  return isAdjacent(p1pos, p2pos);
}

// 好人緣格 = 同字異色但不是好朋友
function isGoodLuckPair(b, p1pos, p2pos) {
  if (!isFriendPair(b[p1pos], b[p2pos])) return false;
  return !isFriendPairStrict(b, p1pos, p2pos);
}

/* ===== 格局偵測 =====
   context（可選，命盤呼叫時傳入）：
     { isMingPan: true, layerNum: 1-8, ageStart, ageEnd, prevLayer? }
   不傳 context 時，書版「生死關」一律不觸發（單卦/年運/卜卦都不論生死關）。
*/
function detectPatterns(board, context) {
  context = context || null;
  const result = [];
  const presentPos = POSITIONS.filter(p => board[p]);
  const center = board.center;

  // 統計
  const colorCount = {red:0, black:0};
  const kindCount = {};
  const colorByKind = {}; // kindCount[kind][color]
  for (const p of presentPos) {
    const piece = board[p];
    colorCount[piece.color]++;
    kindCount[piece.kind] = (kindCount[piece.kind] || 0) + 1;
    if (!colorByKind[piece.kind]) colorByKind[piece.kind] = {red:0, black:0, positions:[]};
    colorByKind[piece.kind][piece.color]++;
    colorByKind[piece.kind].positions.push(p);
  }

  // 1. 好朋友格 / 好人緣格 / 困擾格（依棋種嚴格判定）
  const friendPairs = []; // 嚴格好朋友：將仕象車兵上下左右相鄰、炮跨中央隔空
  const goodLuckPairs = []; // 好人緣：同字異色但不符好朋友位置要求
  for (let i = 0; i < presentPos.length; i++) {
    for (let j = i+1; j < presentPos.length; j++) {
      const a = presentPos[i], bp = presentPos[j];
      if (!isFriendPair(board[a], board[bp])) continue;
      if (isFriendPairStrict(board, a, bp)) {
        friendPairs.push([a, bp]);
      } else {
        goodLuckPairs.push([a, bp]);
      }
    }
  }
  if (friendPairs.length > 0) {
    const detail = friendPairs.map(p => {
      const k = board[p[0]].kind;
      const tag = k === 'pao' ? '隔中央有跳板' : k === 'ma' ? '斜對相鄰' : '中-外圍相鄰';
      return `${board[p[0]].name}+${board[p[1]].name}(${tag})`;
    }).join('、');
    result.push({type:'good', name:'好朋友格', desc:`${friendPairs.length} 組（${detail}）。互相欣賞、有保護，整盤分數計算減半。`});
  }
  if (goodLuckPairs.length > 0) {
    const detail = goodLuckPairs.map(p => {
      const k = board[p[0]].kind;
      let tag = '';
      if (k === 'ma') {
        // 馬：非斜對的同字異色
        tag = '上下/左右相鄰(非斜)';
      } else if (k === 'pao') {
        // 炮：非跨中央有跳板的同字異色
        tag = '中-外圍 或 中央無跳板';
      } else {
        tag = '外圍對外圍';
      }
      return `${board[p[0]].name}+${board[p[1]].name}(${tag})`;
    }).join('、');
    result.push({type:'good', name:'好人緣格', desc:`${goodLuckPairs.length} 組（${detail}）。人緣不錯、間接幫助。`});
  }
  // 困擾格（書本第 6 章 p.73 — 修正：所有同字異色配對 ≥2 組都算）
  //     書本：「卦象同時有兩組黑紅同位階的棋子（2兵2卒也算），即為困擾格」
  //     ◎ 兩組都符合好朋友格 → 困擾能量最強
  //     ◎ 一組好朋友 + 一組好人緣 → 困擾能量居次
  //     ◎ 兩組分離格 → 困擾程度最輕微
  //     注意：兵卒「2兵2卒」也算困擾格（一組兵卒對一組兵卒）
  const totalFriendPairs = friendPairs.length + goodLuckPairs.length;
  // 兵卒特殊：2兵2卒 = 一組兵卒（兵紅+卒黑）兩組（如果兩組）
  // 但實際上 2兵2卒 配對方式：兵A+卒A、兵A+卒B、兵B+卒A、兵B+卒B → 4 種配對
  // 簡化判定：只要有 ≥2 組「同字異色」的不同配對即可
  if (totalFriendPairs >= 2) {
    const intensityNote = friendPairs.length >= 2 ? '（兩組都好朋友 → 困擾能量最強）'
                       : (friendPairs.length === 1 ? '（一組好朋友+一組好人緣 → 困擾能量居次）'
                       : '（兩組分離格/好人緣 → 困擾程度最輕微）');
    result.push({type:'warn', name:'困擾格', desc:`盤中 ${totalFriendPairs} 組同字異色配對 ${intensityNote} → 常有做選擇或下決定的困擾。`});
  }

  // 2. 互相欣賞格（書本第 6 章 p.68）
  //     書本：「有黑士紅俥或紅仕黑車相鄰或斜對（中間隔一隻不算），即為互相欣賞格」
  //     必須是 相鄰（中-外圍） OR 斜對（外圍對外圍斜方）
  //     跨中央被隔開（左↔右、上↔下）不算
  const shiCheParis = [];
  for (let i = 0; i < presentPos.length; i++) {
    for (let j = i+1; j < presentPos.length; j++) {
      const a = presentPos[i], bp = presentPos[j];
      const pa = board[a], pb = board[bp];
      // 檢查是否為（黑士+紅俥）或（紅仕+黑車）
      const isBlackShi_RedChe = (pa.name==='士' && pb.name==='俥') || (pa.name==='俥' && pb.name==='士');
      const isRedShi_BlackChe = (pa.name==='仕' && pb.name==='車') || (pa.name==='車' && pb.name==='仕');
      if (!isBlackShi_RedChe && !isRedShi_BlackChe) continue;
      // 檢查位置：相鄰 OR 斜對
      if (isAdjacent(a, bp) || isDiagonalPair(a, bp)) {
        shiCheParis.push([a, bp, pa.name, pb.name]);
      }
    }
  }
  if (shiCheParis.length > 0) {
    const detail = shiCheParis.map(([a, b, n1, n2]) => `${n1}+${n2}`).join('、');
    result.push({type:'good', name:'互相欣賞格', desc:`${detail}（相鄰或斜對）→ 彼此欣賞、有合作空間、感情有吸引、生意有共識。`});
  }

  // 3. 三人同心格（同字同色 ≥3 — 5子盤上只有兵卒可能 3 個）
  for (const kind in colorByKind) {
    if (colorByKind[kind].red >= 3 || colorByKind[kind].black >= 3) {
      const sameSideCenter = center && colorByKind[kind][center.color] >= 3;
      result.push({type:'good', name:'三人同心格', desc:`同字同色 3 隻 → ${sameSideCenter ? '與中宮同色：你已準備好' : '外在準備好、時機點對了'}。`});
    }
  }

  // 4. 消耗格（書本第 6 章 p.69 — 修正：恰好 2 隻同色才算，≥3 → 三人同心格）
  //     書本：「同時有兩隻同顏色的字，不論相鄰、斜對或分離，即為消耗格」
  //          「另三隻以上的卒或兵則代表另一種格局（三人同心格或皇帝格）」
  //     所以兵卒 ≥3 同色 → 三人同心格（不算消耗格）
  for (const kind in colorByKind) {
    for (const color of ['red','black']) {
      const count = colorByKind[kind][color];
      // 恰好 2 隻同色才是消耗格；≥3 是三人同心格（已在前面判定）
      if (count === 2) {
        const inner = center && color === center.color;
        const meaning = {
          shuai:'執著價值觀、想掌控',
          shi:'自以為是、憂慮、口角糾紛',
          xiang:'情緒起伏、火氣大、被動',
          che:'衝動、管太多、激進',
          ma:'靜不下來、優柔寡斷、心太軟',
          pao:'恐懼、不安、想改變但不知怎麼改',
          bing:'想太多、行動力弱、拖延、錢容易流失'
        }[kind] || '';
        // 書本：跟中間同顏色的，為自己消耗；跟中間不同顏色的，為對方消耗
        // 書本：黑棋的消耗表現出來比較明顯，紅棋比較不明顯
        const visibilityNote = color === 'black' ? '（黑色消耗表現明顯）' : '（紅色消耗表現不明顯）';
        result.push({type:'warn', name:`消耗格(${inner ? '自己' : '對方'})`, desc:`${color==='red'?'紅':'黑'}${PIECE_ORDER.find(n=>PIECES[n].kind===kind && PIECES[n].color===color)} × 2 → ${meaning}。${visibilityNote}`});
      }
    }
  }

  // 5. 破壞格（同字 1紅2黑 或 1黑2紅）
  for (const kind in colorByKind) {
    if ((colorByKind[kind].red === 1 && colorByKind[kind].black === 2) ||
        (colorByKind[kind].red === 2 && colorByKind[kind].black === 1)) {
      result.push({type:'warn', name:'破壞格', desc:`同字 ${kind} 有 1+2 配置 → 本身含消耗，整局有破壞。`});
    }
  }

  // 6. 通吃格 / 被通吃格（書本第 6 章 p.77-79）
  //     ◎ 通吃格：對方「所有棋子」沒有任何保護、牽制或格局限制 → 中央可以通吃
  //     ◎ 被通吃格：自己「所有棋子」沒保護被吃光，**或中間那隻被吃掉（即使其它棋子不會被吃）也算**
  //                 但若中間棋子可以吃外圍其它棋子而跑掉，或能與之抗衡，就不會被通吃
  if (center) {
    const enemies = presentPos.filter(p => p !== 'center' && board[p].color !== center.color);
    const noFriendPair = friendPairs.length === 0;

    // 通吃格：中央能吃所有對方棋 且 對方都無保護
    const allEatable = enemies.length >= 2 && enemies.every(e => canEat(board, 'center', e) && !isProtected(board, e, 'center'));
    if (allEatable && noFriendPair) {
      result.push({type:'warn', name:'通吃格', desc:'中央能吃光所有對方棋且對方無保護、無格局限制（書本 P77「沒有保護、牽制或格局的限制」，含明君格 P75）→ 一開始很有收穫、能量強、有主導權，但短期太強勢，最後可能歸零或重開。淨值×20%（書本 P77：原本應賺 100 萬→只賺 20 萬）。'});
    }

    // 被通吃格（書本明確）：
    //   1. 中間那隻可被吃（任意一個對方棋能吃中央）且中央無保護 → 被通吃
    //   2. 但若中央能吃外圍跑掉 OR 能跟攻擊者抗衡 → 不算被通吃
    if (enemies.length >= 1 && noFriendPair) {
      // 找出能吃中央且中央無保護的攻擊者
      const lethalAttackers = enemies.filter(e => canEat(board, e, 'center') && !isProtected(board, 'center', e));
      if (lethalAttackers.length > 0) {
        // 中央能跑掉嗎？（中央能吃任意外圍棋）
        const canRun = enemies.some(e => canEat(board, 'center', e));
        // 中央能跟所有致命攻擊者抗衡嗎？（中央能反吃每一個 lethalAttacker）
        const canCounterAll = lethalAttackers.every(a => canEat(board, 'center', a));
        if (!canRun && !canCounterAll) {
          result.push({type:'warn', name:'被通吃格', desc:'中央被吃且無保護，又無法跑掉或抗衡 → 大限／生死關／努力歸零。淨值×20%（書本 P78「收穫雖然多只有 20%，甚至負債」）。'});
        }
      }
    }
  }

  // 7. 雨傘格（上、左、右三隻同色，中央異色）
  if (center && board.top && board.left && board.right) {
    const c = center.color;
    const o = board.top.color;
    if (board.top.color === board.left.color && board.left.color === board.right.color && o !== c) {
      const desc = o === 'red' ? '紅雨傘 → 別人看好你' : '黑雨傘 → 別人不看好你';
      result.push({type:'info', name:'雨傘格', desc:`上左右三隻${o==='red'?'紅':'黑'}棋包圍中央 → 有天助、有人罩，也可能壓抑鬱悶。${desc}`});
    }
  }

  // 8. 勝利格（左、右、下三隻同色 V 字）
  if (board.left && board.right && board.bottom) {
    if (board.left.color === board.right.color && board.right.color === board.bottom.color) {
      result.push({type:'good', name:'勝利格', desc:`V 字三隻同色 → 想做的事容易成局、事情有利${center && center.color === board.bottom.color ? '（與你同色，更有支持）':''}。`});
    }
  }

  // 9. 富貴格：將/帥 + 仕/士 + 相/象（不限同色混色）
  const hasShuai = presentPos.some(p => board[p].kind==='shuai');
  const hasShi2 = presentPos.some(p => board[p].kind==='shi');
  const hasXiang = presentPos.some(p => board[p].kind==='xiang');
  if (hasShuai && hasShi2 && hasXiang) {
    result.push({type:'good', name:'富貴格', desc:'將+士+相 同盤 → 有天助、有指揮能力、有資源、有人幫忙。但好壞仍要看分數。'});
  }

  // 10. 明君格（書本第 6 章 p.75 — 修正：異色關係）
  //     書本：「將看得到兵，帥看得到卒，即為明君格」
  //     ◎ 黑將 + 紅兵（將跟兵異色，公公服侍皇帝）
  //     ◎ 紅帥 + 黑卒（帥跟卒異色）
  //     「看得到」 = 相鄰 OR 斜對（兵卒不能飛山，跨中央被隔不算看到）
  const redShuaiPos = presentPos.find(p => board[p].name==='帥');
  const redBingPos = presentPos.filter(p => board[p].name==='兵');
  const blackJiangPos = presentPos.find(p => board[p].name==='將');
  const blackZuPos = presentPos.filter(p => board[p].name==='卒');

  // 「看得到」判定：相鄰 OR 斜對
  function canSeePiece(posA, posB) {
    return isAdjacent(posA, posB) || isDiagonalPair(posA, posB);
  }

  // 黑將 + 紅兵 看得到 → 明君格
  if (blackJiangPos && redBingPos.length > 0) {
    const sees = redBingPos.some(bp => canSeePiece(blackJiangPos, bp));
    if (sees) {
      result.push({type:'good', name:'明君格', desc:'黑將看到紅兵（公公服侍皇帝）→ 有方向、有計畫、有領導能力，將/兵互為依存。'});
    }
  }
  // 紅帥 + 黑卒 看得到 → 明君格
  if (redShuaiPos && blackZuPos.length > 0) {
    const sees = blackZuPos.some(bp => canSeePiece(redShuaiPos, bp));
    if (sees) {
      result.push({type:'good', name:'明君格', desc:'紅帥看到黑卒（公公服侍皇帝）→ 有方向、有計畫、有領導能力，帥/卒互為依存。'});
    }
  }

  // 11. 暴動格（書本第 6 章 p.75 — 修正：異色關係，依跟中央同色判自己/外在）
  //     書本：「將看不到同一局或命盤上一局的兵，帥看不到同一局或命盤上一局的卒（隔山也代表看不到），即為暴動格」
  //     ◎ 自己暴動：將/帥跟中央同色 → 偏執認知、情緒起伏做錯決定
  //     ◎ 外在暴動：將/帥跟中央異色 → 外在變數或意外
  //     「看不到」 = 沒有對應異色的兵/卒  OR  異色兵/卒被中央隔開（跨中央上↔下、左↔右）
  if (center) {
    // 黑將存在 + 看不到紅兵 → 暴動格
    if (blackJiangPos) {
      const sees = redBingPos.some(bp => canSeePiece(blackJiangPos, bp));
      if (!sees) {
        const sameAsCenter = board[blackJiangPos].color === center.color;
        result.push({type:'warn', name: sameAsCenter ? '暴動格(自己)' : '暴動格(外在)',
          desc: sameAsCenter
            ? `黑將在${POS_LABEL[blackJiangPos].split('(')[0]}且跟中央同色（看不到紅兵）→ 自己的暴動：偏執認知、情緒起伏做錯決定。`
            : `黑將在${POS_LABEL[blackJiangPos].split('(')[0]}且跟中央異色（看不到紅兵）→ 外在的暴動：會有外在變數或意外。`});
      }
    }
    // 紅帥存在 + 看不到黑卒 → 暴動格
    if (redShuaiPos) {
      const sees = blackZuPos.some(bp => canSeePiece(redShuaiPos, bp));
      if (!sees) {
        const sameAsCenter = board[redShuaiPos].color === center.color;
        result.push({type:'warn', name: sameAsCenter ? '暴動格(自己)' : '暴動格(外在)',
          desc: sameAsCenter
            ? `紅帥在${POS_LABEL[redShuaiPos].split('(')[0]}且跟中央同色（看不到黑卒）→ 自己的暴動：偏執認知、情緒起伏做錯決定。`
            : `紅帥在${POS_LABEL[redShuaiPos].split('(')[0]}且跟中央異色（看不到黑卒）→ 外在的暴動：會有外在變數或意外。`});
      }
    }
  }

  // 12. 分離格（書本第 6 章 p.72 — 修正：只排除炮包，馬也算）
  //     書本：「好朋友被隔開（非炮包）為分離格」
  //     ◎ 將/仕/象/車/兵+馬：跨中央被隔開（上↔下、左↔右）= 分離格
  //     ◎ 炮/包：本來就要隔山才是好朋友，不算分離
  const splitChecks = [['top','bottom'],['left','right']];
  for (const [a, b] of splitChecks) {
    if (board[a] && board[b] && isFriendPair(board[a], board[b])) {
      const kind = board[a].kind;
      // 只排除炮包（本來就要隔山才是好朋友），其他都算分離格
      if (kind !== 'pao') {
        result.push({type:'warn', name:'分離格', desc:`${board[a].name}+${board[b].name} 同字異色被中央隔開 → 緣分較淺、關係容易斷、不易融合。`});
      }
    }
  }

  // 13. 桃花格（書本第 6 章 p.83-86 — 修正：包帥/炮將/炮包，無炮馬）
  //     書本：「卦象中位置②跟③，或④跟⑤，也就是相隔的位置為包帥、炮將、炮包，即為正桃花」
  //          「包帥、炮將、炮包在其它位置（相鄰或斜對）則為偏桃花」
  //     正桃花 = 包帥/炮將/炮包 在 跨中央相隔位置（②③橫線、④⑤縱線，中間有棋）
  //     偏桃花 = 包帥/炮將/炮包 在 相鄰或斜對位置
  //     爛桃花 = 對方炮/包吃到我們的將/帥
  for (let i = 0; i < presentPos.length; i++) {
    for (let j = i+1; j < presentPos.length; j++) {
      const a = presentPos[i], bp = presentPos[j];
      const pa = board[a], pb = board[bp];
      // 必須有炮包參與
      if (pa.kind !== 'pao' && pb.kind !== 'pao') continue;
      // 三種組合：炮+帥(異色)、包+將(異色)、炮+包(異色)
      const isPaoShuai = (pa.kind === 'pao' && pb.kind === 'shuai' && pa.color !== pb.color)
                     || (pb.kind === 'pao' && pa.kind === 'shuai' && pa.color !== pb.color);
      const isPaoPao = pa.kind === 'pao' && pb.kind === 'pao' && pa.color !== pb.color;
      if (!isPaoShuai && !isPaoPao) continue;

      // 判定位置
      const isJump = isStraightLine(a, bp) && getMiddle(a, bp) && board[getMiddle(a, bp)]; // 跨中央相隔（中間有棋）
      const isAdj = isAdjacent(a, bp);
      const isDiag = isDiagonalPair(a, bp);

      const pairName = `${pa.name}+${pb.name}`;
      if (isJump) {
        result.push({type:'info', name:'桃花格-正桃花', desc:`${pairName} 跨中央相隔（中間有棋）→ 正常、明面、較直接的感情互動。問姻緣有結婚機率（僅問感情卦適用）。`});
      } else if (isAdj || isDiag) {
        result.push({type:'info', name:'桃花格-偏桃花', desc:`${pairName} 相鄰或斜對 → 曖昧、不穩定、能量比正桃花弱，互相喜歡但交往機率低（僅問感情卦適用）。`});
      }
    }
  }

  // 14. 一枝獨秀格（書本第 6 章 p.93 — 修正：移除「不會被吃」多餘條件）
  //     書本：「一枝獨秀格也是四紅一黑或四黑一紅，唯一的顏色在旁邊（不是在中間）」
  //     書本內建規則：「唯一的顏色不會被吃，就算我們有能力吃掉它，也只能得到它一半的分數」
  //     所以一枝獨秀格的判定條件只有「四同色一異色，異色在外圍」即可，
  //     「不會被吃」是這個格局的內建效果，不是判定條件。
  if (presentPos.length === 5 && center) {
    if (colorCount.red === 4 && colorCount.black === 1 && center.color === 'red') {
      const oddPos = POSITIONS.find(p => board[p].color === 'black');
      // 異色在外圍（不在中央）
      if (oddPos !== 'center') {
        result.push({type:'info', name:'一枝獨秀格', desc:`唯一不同色 ${board[oddPos].name} 在 ${POS_LABEL[oddPos].split('(')[0]} → 獨樹一格，唯一顏色不會被吃，只能得它的半分。陰陽不協調，分數×50%。`});
      }
    } else if (colorCount.red === 1 && colorCount.black === 4 && center.color === 'black') {
      const oddPos = POSITIONS.find(p => board[p].color === 'red');
      if (oddPos !== 'center') {
        result.push({type:'info', name:'一枝獨秀格', desc:`唯一不同色 ${board[oddPos].name} 在 ${POS_LABEL[oddPos].split('(')[0]} → 獨樹一格，唯一顏色不會被吃，只能得它的半分。陰陽不協調，分數×50%。`});
      }
    }
  }

  // 15. 眾星拱月格 / 鬱卒格（中央唯一異色 — 書版 v2.0 命名）
  //     ◎ 中央=黑，外圍 4 紅 → 別人看好（眾星拱月）
  //     ◎ 中央=紅，外圍 4 黑 → 別人不看好（容易鬱卒）
  //     ◎ 兩者皆陰陽不協調，分數要乘以 50%
  if (center && presentPos.length === 5) {
    const sameAsCenter = POSITIONS.filter(p => p !== 'center' && board[p].color === center.color).length;
    const diff = POSITIONS.filter(p => p !== 'center' && board[p].color !== center.color).length;
    if (diff === 4 && sameAsCenter === 0) {
      const name = center.color === 'red' ? '鬱卒格' : '眾星拱月格';
      result.push({type:'info', name, desc:`中央 ${center.name} 是唯一${center.color==='red'?'紅':'黑'}色，四周${center.color==='red'?'黑':'紅'}色 → ${center.color==='red'?'外界不看好你，但事實上狀態挺好的，只是心情會悶（鬱卒）。' : '別人看你什麼都挺好，但事實上常常很鬱卒。'}陰陽不協調，分數×50%。`});
    }
  }

  // 16. 全紅/全黑（悔恨格）
  if (presentPos.length === 5 && (colorCount.red === 5 || colorCount.black === 5)) {
    const c = colorCount.red === 5 ? '紅' : '黑';
    result.push({type:'warn', name:`全${c}盤(悔恨格)`, desc:`整盤皆${c} → 沒有陰陽互動。在事件卦中代表問題沒問清楚或老天爺不答；命盤/年盤/月盤代表預期落差大、事與願違。`});
  }

  // 17. 陰陽不協調（4-1 或 5-0）
  if (presentPos.length === 5) {
    if (Math.abs(colorCount.red - colorCount.black) >= 3) {
      const more = colorCount.red > colorCount.black ? '紅' : '黑';
      const advice = more === '紅' ? '紅多 → 多踩土壤草地、接地氣' : '黑多 → 多曬太陽（尤其曬背）';
      result.push({type:'warn', name:'陰陽不協調', desc:`${more}方 ${Math.max(colorCount.red, colorCount.black)} 隻 → 顯化動能不足、情緒不平衡、想很多但動不了。建議：${advice}。`});
    }
  }

  // 18. 十字天助格（書版 v2.0.3 — 第 6 章 p.106 — 書版原文 + 祥哥糾正嚴格版）
  //
  //     書版定義：「卦象中 ①②③ 的位置 或 ①④⑤ 的位置 為同一個顏色，像十字架一樣」
  //
  //     祥哥糾正（書本第 106 頁三個範例完美驗證）：
  //     ◎ 橫向十字 = ①②③同色 AND ④⑤都跟中央異色（純粹十字架形狀）
  //     ◎ 縱向十字 = ①④⑤同色 AND ②③都跟中央異色（純粹十字架形狀）
  //
  //     書本範例驗證：
  //     1. 左盤(上俥紅/左士黑/中包黑/右卒黑/下兵紅)：①②③三黑同色 + ④⑤兩紅異色 → 橫向十字 ✓
  //     2. 中盤(上卒黑/左相紅/中馬黑/右仕紅/下象黑)：①④⑤三黑同色 + ②③兩紅異色 → 縱向十字 ✓
  //     3. 右盤(上傌紅/左車黑/中俥紅/右士黑/下兵紅)：①④⑤三紅同色 + ②③兩黑異色 → 縱向十字 ✓
  //
  //     若五子全同色 → 是「悔恨格」（已被獨立判定，不算十字天助格）
  //     若四同色一異色 → 是「雨傘格」/「眾星拱月」/「一枝獨秀」（已被獨立判定）
  //     真正的十字天助格嚴格要求：3 同色（在十字位置）+ 2 異色（在十字外）
  if (center) {
    // 縱向十字 = ①④⑤同色 AND ②③都跟中央異色
    const verticalAxisSame = board.top && board.bottom &&
      board.top.color === center.color && board.bottom.color === center.color;
    if (verticalAxisSame) {
      const leftDifferent = !board.left || board.left.color !== center.color;
      const rightDifferent = !board.right || board.right.color !== center.color;
      if (leftDifferent && rightDifferent) {
        result.push({type:'good', name:'十字天助格(縱)',
          desc:'①④⑤同色 + ②③異色（純粹縱向十字架形狀）→ 有天助、有老天看顧、時機點對了。'});
      }
    }
    // 橫向十字 = ①②③同色 AND ④⑤都跟中央異色
    const horizontalAxisSame = board.left && board.right &&
      board.left.color === center.color && board.right.color === center.color;
    if (horizontalAxisSame) {
      const topDifferent = !board.top || board.top.color !== center.color;
      const bottomDifferent = !board.bottom || board.bottom.color !== center.color;
      if (topDifferent && bottomDifferent) {
        result.push({type:'good', name:'十字天助格(橫)',
          desc:'①②③同色 + ④⑤異色（純粹橫向十字架形狀）→ 有天助、有老天看顧、時機點對了。'});
      }
    }
  }

  // ====================================================================
  // 書版 v2.0 新增格局（《改寫人生的象棋卜卦》）
  // ====================================================================

  // 19. 事業格（書版 v2.0 新增）
  //     卦象同時出現俥傌炮 / 車馬包（不論顏色），即為事業格
  //     代表會有像做事業那樣的認真態度，但好壞得看付出與收穫
  //     女性命盤總格出現事業格（且其中一隻在中間）→ 也代表有離婚的資料
  const hasChe = presentPos.some(p => board[p].kind === 'che');
  const hasMa = presentPos.some(p => board[p].kind === 'ma');
  const hasPaoForCareer = presentPos.some(p => board[p].kind === 'pao');
  if (hasChe && hasMa && hasPaoForCareer) {
    const careerInCenter = center && ['che','ma','pao'].includes(center.kind);
    result.push({type:'good', name:'事業格',
      desc:`同盤出現俥傌炮（車馬包）→ 會有「認真做事業」那種態度。${careerInCenter ? '其中一隻在中央，認真度更明顯。女性命盤總格出現此格代表有離婚的資料。' : ''}並非有事業格就是好卦，好壞得看付出與收穫。`});
  }

  // 20. 大師格（命盤總格專用 — 書版 v2.0 新增）
  //     中央①是任意非兵卒棋，②③④⑤都是兵卒（同色或混色）
  //     外圍兵卒圍繞，凸顯中央卦主的特性
  //     中央如為兵卒則進化為皇帝格（21）
  if (center && center.kind !== 'bing' && presentPos.length === 5) {
    const peripheryAllBing = ['top','bottom','left','right'].every(p => board[p] && board[p].kind === 'bing');
    if (peripheryAllBing) {
      const map = {
        shuai:'做任何行業都適合',
        shi:'適合從政、掌權',
        xiang:'一代宗師、宗教修行緣份深',
        che:'適合領導一群人',
        ma:'會有一群人跟著奔波',
        pao:'男的帥、女的美，適合偶像明星'
      };
      result.push({type:'good', name:'大師格',
        desc:`中央 ${center.name}（${map[center.kind] || ''}）+ 外圍四隻兵卒 → 凸顯卦主${center.name}的特質。（命盤總格專用）`});
    }
  }

  // 21. 皇帝格（命盤總格專用 — 書版 v2.0 新增）
  //     五子全為兵卒（同色或混色）
  //     五隻全地格，做事踏實只往上不往下，做什麼都容易成功
  if (presentPos.length === 5 && presentPos.every(p => board[p].kind === 'bing')) {
    result.push({type:'good', name:'皇帝格',
      desc:'五子全為兵卒 → 五隻都是地格，做事踏實只往上不往下，做什麼都容易成功。（命盤總格專用，單卦/年運則依個別狀態論）'});
  }

  // 22. 修行緣分格（命盤總格專用 — 書版 v2.0 新增）
  //     7 種狀況之一即成立
  if (center) {
    const sameColorMaPaoExists = ['top','bottom','left','right'].some(p =>
      board[p] && ['ma','pao'].includes(board[p].kind) && board[p].color === center.color);
    const xiuxingTrigs = [];
    // 1. 中央相/象 + 同色傌馬/炮包能吃對方
    if (center.kind === 'xiang' && sameColorMaPaoExists) {
      xiuxingTrigs.push('中央相/象 + 同色傌馬/炮包');
    }
    // 5. 中央位置是傌/馬/炮/包（體質敏感、直覺強）
    if (['ma','pao'].includes(center.kind)) {
      xiuxingTrigs.push('中央是傌馬/炮包：體質敏感、直覺強');
    }
    // 6. 對方傌馬/炮包吃我們棋子（容易卡陰，但帶天命）
    const enemyMaPaoEats = POSITIONS.some(p => {
      if (!board[p] || board[p].color === center.color) return false;
      if (!['ma','pao'].includes(board[p].kind)) return false;
      return POSITIONS.some(v => v !== p && board[v] && board[v].color === center.color && canEat(board, p, v));
    });
    if (enemyMaPaoEats) xiuxingTrigs.push('對方傌馬/炮包吃我方棋子：容易卡陰但帶天命');
    // 7. 有雨傘格或十字天助格
    if (result.some(r => r.name === '雨傘格' || r.name.includes('十字天助'))) {
      xiuxingTrigs.push('有雨傘格或十字天助格');
    }
    if (xiuxingTrigs.length > 0) {
      result.push({type:'good', name:'修行緣分格',
        desc:`修行緣分（${xiuxingTrigs.join(' / ')}）→ 有跟神明/高維連結的緣分，適合修行。（命盤總格適用）`});
    }
  }

  // 23. 生死關（書版 P31-P32 完整規則 — 限命盤十年運局 2-8）
  //     範圍硬擋：未傳 context、非命盤、或為總格（layerNum=1）→ 一律不觸發
  //     共 9 層（A 一般／B 50後／C 70後／D 81後／E 陰陽異常／F 死因器官／G 死因方式／H 避掉條件／I 範圍）
  if (center && context && context.isMingPan && context.layerNum >= 2) {
    const ageStart = context.ageStart || 0;
    const ageEnd   = context.ageEnd   || 0;

    // 死因對照（被吃中央棋）— 書版 P31
    const deathCauseByVictim = {
      shi:'呼吸系統、肺或大腸',
      xiang:'心血管疾病的因素',
      ma:'發生意外',
      pao:'腎臟或婦科的問題',
      bing:'脾胃、消化系統、免疫系統的問題',
      shuai:'重大關卡',
      che:'肝膽、行車相關'
    };
    // 死因對照（中央被誰吃）— 書版 P31
    const deathCauseByAttacker = {
      shuai:'很高機率因為意外，亦有其他可能性',
      shi:'刀關（開刀，或因爭執被人加害）',
      xiang:'跟心臟血管疾病有關',
      che:'跟心臟血管疾病有關',
      bing:'脾胃、消化系統、免疫系統的問題'
    };

    // 中央能否吃任何外圍（含同色／異色）→ 用於 A 條件「中央可不可以反吃」
    const centerCanEatAny = POSITIONS.some(p => p !== 'center' && board[p] && canEat(board, 'center', p));
    // 中央能否吃「異色」外圍 → 同盤反吃
    const centerCanFightBack = POSITIONS.some(p => p !== 'center' && board[p] && board[p].color !== center.color && canEat(board, 'center', p));
    // 中央能否「過局往上吃」上一局任一對方棋（書本「飛不出去」第 3 條件，v2.9.5 新增）
    //   老師（吳慧琳）範例：局 7 中棋炮能飛到上面過局往上吃 → 不生死關
    //                     局 8 中棋馬也出不去 → 生死關
    const canEscapeCrossLayer = canEscapeUpward(board, context.prevLb);
    // 整合：書本生死關「飛不出去」= 不能同盤反吃 且 不能過局往上吃
    //   = (!centerCanFightBack && !canEscapeCrossLayer) 才算「飛不出去」
    //   = 反過來「飛得出去」就是 centerCanFightBack || canEscapeCrossLayer
    const canEscape = centerCanFightBack || canEscapeCrossLayer;

    // 列出能吃中央的攻擊者（無保護）
    const attackers = [];
    for (const p of POSITIONS) {
      if (p === 'center' || !board[p]) continue;
      if (board[p].color === center.color) continue;
      if (canEat(board, p, 'center') && !isProtected(board, 'center', p)) {
        attackers.push({pos:p, piece:board[p]});
      }
    }
    // 81 歲後判定：含被保護的能吃中央者也算
    const attackersIgnoreProtect = [];
    for (const p of POSITIONS) {
      if (p === 'center' || !board[p]) continue;
      if (board[p].color === center.color) continue;
      if (canEat(board, p, 'center')) {
        attackersIgnoreProtect.push({pos:p, piece:board[p]});
      }
    }

    // 既有判讀：被通吃格已存在 → 已是嚴重訊號
    const isAllEatenPattern = result.some(r => r.name === '被通吃格');

    // 共用：建構死因敘述
    const buildCause = (att) => {
      const byVictim = deathCauseByVictim[center.kind] || '對應器官系統';
      const byAttacker = att && deathCauseByAttacker[att.piece.kind] ? `；被${att.piece.name}吃→${deathCauseByAttacker[att.piece.kind]}` : '';
      return `中央${center.name}被吃對應：${byVictim}${byAttacker}`;
    };

    // 收集觸發理由與觸發碼（A/B/C/D/D-friend/D-regret/E 對應書版 P31-P32 各層）
    const reasons = [];
    const triggers = [];
    let triggered = false;
    let mainAttacker = attackers[0] || null;

    // ▶ A：書本/老師生死關三條件（v2.9.5 完整對齊 — 老師吳慧琳 LINE 訊息：
    //       「生死觀有三個條件：一定被吃掉、沒人保護、也飛不出去」）
    //    ① 一定被吃掉：attackers.length > 0（外圍有對方棋能吃中央）
    //    ② 沒人保護：attackers 已過濾掉「被保護」的攻擊者
    //    ③ 飛不出去：!canEscape（不能同盤反吃 且 不能過局往上吃上一局棋）
    if (attackers.length > 0 && !canEscape) {
      const escapeNote = context.prevLb ? '（不能同盤反吃，也不能過局往上吃上一局對方棋）' : '（不能同盤反吃）';
      reasons.push(`A 一般原則：中央被吃、無保護、飛不出去${escapeNote}`);
      triggers.push('A');
      triggered = true;
    }

    // ▶ B：50 歲後特例 — 別色將/帥暴動可吃我方 + 中央雖可跑但人生不順（系統暫以「該局有暴動格 + 該局有被通吃跡象」近似判斷）
    if (ageStart >= 50) {
      const hasOpposingShuaiAttack = POSITIONS.some(p => {
        if (p === 'center' || !board[p]) return false;
        if (board[p].kind !== 'shuai') return false;
        if (board[p].color === center.color) return false;
        return canEat(board, p, 'center');
      });
      const hasBaodong = result.some(r => r.name && r.name.includes('暴動'));
      if (hasOpposingShuaiAttack && hasBaodong) {
        reasons.push('B 50歲後特例：別色將/帥暴動可吃中央');
        triggers.push('B');
        triggered = true;
      }
    }

    // ▶ C：70 歲後特例 — 出現分離格 → 壽魂想離開
    if (ageStart >= 70) {
      const hasSplit = result.some(r => r.name === '分離格');
      if (hasSplit) {
        reasons.push('C 70歲後特例：分離格 → 壽魂想離開的可能');
        triggers.push('C');
        triggered = true;
      }
    }

    // ▶ D：81 歲後特殊判定 — 不論保護，只要能被吃就算；但中央能反吃或過局往上吃 → 不算
    if (ageStart >= 81) {
      if (attackersIgnoreProtect.length > 0 && !canEscape) {
        reasons.push('D 81歲後特殊判定：中央可被吃且飛不出去（不論保護）');
        triggers.push('D');
        triggered = true;
        if (!mainAttacker) mainAttacker = attackersIgnoreProtect[0];
      }
      const hasFriendBoard = result.some(r => r.name && (r.name.includes('好朋友') || r.name === '好朋友格'));
      if (hasFriendBoard && attackersIgnoreProtect.length > 0) {
        reasons.push('D-friend 81歲後好朋友格被吃可能性大');
        triggers.push('D-friend');
      }
      const hasRegret = result.some(r => r.name && r.name.includes('悔恨'));
      if (hasRegret && attackersIgnoreProtect.length > 0) {
        reasons.push('D-regret 81歲後悔恨格也有機率構成');
        triggers.push('D-regret');
      }
    }

    // ▶ E：陰陽不協調／悔恨／兵卒消耗／包炮消耗 + 動能不足 → 「生死關可能性」（提示而非確定）
    const hasYinYangBad = result.some(r => r.name && (r.name.includes('一枝獨秀') || r.name.includes('眾星拱月') || r.name.includes('鬱卒') || r.name.includes('悔恨')));
    const hasConsume = result.some(r => r.name && r.name.includes('消耗'));
    const isPaoCenterWeak = (center.kind === 'pao') && !centerCanEatAny;
    const isBingCenterConsume = (center.kind === 'bing') && hasConsume;
    if ((hasYinYangBad || hasConsume) && (isPaoCenterWeak || isBingCenterConsume || isAllEatenPattern)) {
      reasons.push('E 陰陽不協調/消耗 + 中央動能不足 → 生死關「可能性」');
      triggers.push('E');
      // 這條只列「可能性」，若 A/B/C/D 沒觸發，也標一個提示但不當主觸發
      if (!triggered) {
        result.push({type:'warn', name:'生死關（可能性）', triggers:['E'],
          desc:`${reasons[reasons.length-1]}。建議做生死關的療癒淨化。${buildCause(null)}（命盤第${context.layerNum}局・${context.ageStart}-${context.ageEnd}歲）`});
      }
    }

    if (triggered) {
      // ▶ H：避掉生死關的可能性（4 條）
      const escapeReasons = [];
      const escapes = [];

      // (1) 30 歲前 + 總格（context.totalLayer）有象/相 → 天助
      if (ageEnd <= 30 && context.totalHasXiang) {
        escapeReasons.push('30歲前生死關，總格有象/相 → 可因天助而避過');
        escapes.push('H1');
      }
      // (2) 總格自己包/炮/馬/傌可吃別人 → 神明力量
      if (context.totalSelfPaoMaCanEat) {
        escapeReasons.push('總格自己包炮馬傌能吃對方 → 有神明力量可避過（仍建議清理）');
        escapes.push('H2');
      }
      // (3) 總格自己棋可吃不同色象/相 → 累世修行
      if (context.totalSelfCanEatXiang) {
        escapeReasons.push('總格自己棋可吃不同色象/相 → 累世修行可避過（仍建議清理）');
        escapes.push('H3');
      }
      // (4) 當局為雨傘格、十字天助格、或中央象/相
      const hasUmbrella = result.some(r => r.name && (r.name.includes('雨傘')));
      const hasCross    = result.some(r => r.name && (r.name.includes('十字天助') || r.name.includes('十字天柱')));
      if (hasUmbrella || hasCross || center.kind === 'xiang') {
        escapeReasons.push(`當局有${hasUmbrella?'雨傘格':''}${hasCross?'十字天助格':''}${center.kind==='xiang'?'中央為象/相':''} → 有機會避過（仍建議清理）`);
        escapes.push('H4');
      }

      const escapeText = escapeReasons.length > 0
        ? ` ｜避過可能性：${escapeReasons.join('；')}`
        : '';

      result.push({type:'warn', name:'生死關', triggers, escapes,
        desc:`命盤第${context.layerNum}局・${context.ageStart}-${context.ageEnd}歲：${reasons.join('；')}。${buildCause(mainAttacker)}${escapeText}（命盤十年運專用，總格/單卦/年運不論）`});
    }
  }

  // 24. 離婚格（女命盤總格專用 — 書版 v2.0 新增）
  //     6 種狀況累計（次數越多離越多次）
  //     注意：男命盤看不出來
  //     僅在「命盤總格 + 卜主性別=女」時觸發；其他情況不論
  const isFemaleNatalTotal = context && context.isMingPan && context.layerNum === 1 && context.gender === 'female';
  const divorceTrigs = isFemaleNatalTotal ? [] : null;
  if (isFemaleNatalTotal) {
  // 1. 第一隻是將、帥、黑士、黑車（紅仕、紅俥不算）
  if (center && (center.name === '將' || center.name === '帥' || center.name === '士' || center.name === '車')) {
    if (center.name === '士' || center.name === '車') {
      divorceTrigs.push(`第一隻是黑${center.name}（武氣強）`);
    } else {
      divorceTrigs.push(`第一隻是${center.name}（執著強）`);
    }
  }
  // 2. 有帥/將但不在中央位置（外在暴君50%離婚率，自己暴君更高）
  if ((redShuaiPos && redShuaiPos !== 'center') || (blackJiangPos && blackJiangPos !== 'center')) {
    divorceTrigs.push('有帥/將但不在中央：外在暴動，50%離婚率');
  } else if (center && (center.name === '帥' || center.name === '將')) {
    if (!POSITIONS.some(p => p !== 'center' && board[p] && board[p].kind === 'bing' && board[p].color === center.color)) {
      divorceTrigs.push('將/帥在中央且看不到同色兵卒：自己暴動，更高離婚率');
    }
  }
  // 3. 分離格（好朋友被隔開，炮包除外）
  if (result.some(r => r.name === '分離格')) {
    divorceTrigs.push('有分離格：價值觀不同、緣分淺');
  }
  // 4. 有事業格（俥傌炮/車馬包）且其中一隻在中間
  if (hasChe && hasMa && hasPaoForCareer && center && ['che','ma','pao'].includes(center.kind)) {
    divorceTrigs.push('事業格+中央俥傌炮：能量用在情感會婚姻不好');
  }
  // 5. 被通吃格（若是通吃對方的通吃格 → 50%）
  if (result.some(r => r.name === '被通吃格')) {
    divorceTrigs.push('被通吃格');
  } else if (result.some(r => r.name === '通吃格')) {
    divorceTrigs.push('通吃格（50%離婚率）');
  }
  // 6. 全紅或全黑的悔恨格
  if (result.some(r => r.name.includes('悔恨'))) {
    divorceTrigs.push('全紅/全黑悔恨格');
  }
  if (divorceTrigs.length > 0) {
    result.push({type:'warn', name:'離婚格(女命盤)',
      desc:`女性卜主命盤總格 → 累計 ${divorceTrigs.length} 項離婚劇情：${divorceTrigs.join('；')}。次數越多代表會經驗越多次離婚。`});
  }
  } // end if isFemaleNatalTotal

  return result;
}

/* ===== 收穫付出計算（書版 v2.0 — 含通吃/悔恨/陰陽不協調分數比例） ===== */
function computeScores(board) {
  const presentPos = POSITIONS.filter(p => board[p]);
  const center = board.center;

  // 整盤是否有「嚴格好朋友配對」 → 全盤計分減半
  let halfBoard = false;
  for (let i = 0; i < presentPos.length; i++) {
    for (let j = i+1; j < presentPos.length; j++) {
      if (isFriendPairStrict(board, presentPos[i], presentPos[j])) {
        halfBoard = true; break;
      }
    }
    if (halfBoard) break;
  }

  // 一枝獨秀格 / 眾星拱月格 / 鬱卒格 的「唯一顏色不被吃」內建規則
  //   書本 p.93：「一枝獨秀格唯一的顏色不會被吃，所以就算我們有能力吃掉它，也只能得到它一半的分數」
  //   書本 p.90：「眾星拱月格/鬱卒格唯一的顏色不會被吃掉（只需要付出好處）」
  let onlyOnePos = null; // 唯一顏色棋子的位置
  if (presentPos.length === 5) {
    const colorCount2 = {red:0, black:0};
    for (const p of presentPos) colorCount2[board[p].color]++;
    if (colorCount2.red === 4 && colorCount2.black === 1) {
      onlyOnePos = POSITIONS.find(p => board[p] && board[p].color === 'black');
    } else if (colorCount2.red === 1 && colorCount2.black === 4) {
      onlyOnePos = POSITIONS.find(p => board[p] && board[p].color === 'red');
    }
  }

  // 計分規則（書本第 6 章 p.65、p.50-53、p.93 — 統一「得到好處 = 半分」概念）
  //   書本：以下情境都屬於「不能真正吃掉，只能得到好處 = 半分」這同一個概念：
  //     ① 整盤好朋友格：所有棋子互利不互吃 → 半分（書本 p.65）
  //     ② 保護：被保護的棋子，攻擊者只得半分（書本 p.50-53）
  //     ③ 抗衡：被攻擊棋子能反吃攻擊者，攻擊者只得半分
  //     ④ 牽制：攻擊方 A 怕被反吃同色棋，A 只得半分
  //     ⑤ 一枝獨秀/眾星拱月：唯一顏色不會被吃，攻擊者只得半分（書本 p.93）
  //   修正（v2.5.5 — 祥哥糾正）：這 5 個條件互斥，**任一成立 → 半分**，不再疊加 /4 /8
  //   原本疊加會出現 X.25 / X.125 等不合理分數，書本沒有「半分再半分」的設計
  const eats = [];
  for (const aPos of presentPos) {
    for (const vPos of presentPos) {
      if (aPos === vPos) continue;
      if (canEat(board, aPos, vPos)) {
        let s = board[vPos].score;
        const friendPair = isFriendPairStrict(board, aPos, vPos);
        const protected_ = isProtected(board, vPos, aPos);
        // 抗衡（v2.9.6 擴充為雙向，依老師吳慧琳 AriesWu 計分規則）：
        //   中央 ↔ 對方雙方互吃時，兩個方向都標抗衡 → 兩邊都半分
        //   老師範例：俥吃象=抗衡-20（俥作攻擊，象能反殺）+ 象吃俥=抗衡+15（象作攻擊，俥能反殺）
        //   兩個方向都減半（雙方互怕對方反殺）
        const isCounter = (vPos === 'center' || aPos === 'center')
                          && canEat(board, vPos, aPos);
        // 牽制：攻擊方 A 能吃 X，但 X 能吃 A 同色的其他棋
        //       書本第 9 章馬先生範例：右馬要吃下炮，但炮能飛山吃同色的士 → 牽制
        //       書本第 5 章 p.53：「我能吃掉對方，但是如果我要吃他，我會怕他來吃我其它相同顏色的棋子」
        let isPin = false;
        const attackerColor = board[aPos].color;
        for (const p of POSITIONS) {
          if (p === aPos || p === vPos) continue;
          if (!board[p]) continue;
          if (board[p].color !== attackerColor) continue;
          if (canEat(board, vPos, p)) {
            isPin = true;
            break;
          }
        }
        // 一枝獨秀/眾星拱月：唯一顏色不會被吃 → 攻擊唯一棋子只得半分
        const isOnlyOneVictim = (onlyOnePos !== null && vPos === onlyOnePos);

        // 統一「得到好處 = 半分」：任一條件成立 → 半分（不疊加，避免出現 X.25 / X.125）
        // 5 個情境（halfBoard / 保護 / 抗衡 / 牽制 / 一枝獨秀唯一）都屬於同一個書本概念
        const isHalfScore = halfBoard || protected_ || isCounter || isPin || isOnlyOneVictim;
        if (isHalfScore) s = s / 2;

        // v2.9.6 標記吃法所屬類別（用於 UI 顯示與計分歸類）
        const isCenterAttacker = aPos === 'center';                                  // 中央攻擊 = 收穫
        const isAllyVictim = center && board[vPos].color === center.color;           // 我方被吃 = 付出
        eats.push({
          attackerPos: aPos, victimPos: vPos,
          attacker: board[aPos].name, victim: board[vPos].name,
          score: s,
          friendPair, protected_, halfBoard,
          isCounter, isPin, isOnlyOneVictim,
          // v2.9.6：類別標記（用於 UI 列出「收穫」「付出」分類）
          isCenterAttacker, isAllyVictim
        });
      }
    }
  }

  // v2.9.6 計分擴充（2026-06-07 老師吳慧琳 AriesWu 計分規則）：
  //   收穫 = 中央作為攻擊方吃對方棋的合計
  //   付出 = 任何我方棋（同色於中央，含中央自身）被對方吃的合計
  //         （不只算 centerLoss，也算 allyLoss — 旁觀我方棋被吃也算付出）
  //   依老師範例祥哥盤面：傌吃士保護-30、傌吃車保護-15 都算入付出
  let centerGain = 0, allyLoss = 0;
  if (center) {
    for (const e of eats) {
      // 收穫：中央作為攻擊方
      if (e.attackerPos === 'center') centerGain += e.score;
      // 付出：受害方是我方（同色於中央）
      const victimPiece = board[e.victimPos];
      if (victimPiece && victimPiece.color === center.color) {
        allyLoss += e.score;
      }
    }
  }
  // 沿用既有變數名 centerLoss 對外（內含中央被吃 + 我方非中央棋被吃）
  const centerLoss = allyLoss;

  // ====================================================================
  // 書版 v2.9.6 分數比例調整（2026-05-09 祥哥糾正後對齊書本原文）
  //
  // 書本原文依據：
  //   ▼ 通吃格 P77：「通吃格在計算所得的收穫時，依經驗大多只有 20%⋯⋯
  //                   如果原本可以賺 100 萬，會因為通吃格而可能賺 20 萬。」
  //                → 「所得」=「淨值（收穫-付出）」，整個淨值 ×20%（不是收穫 ×20%）
  //
  //   ▼ 被通吃格 P78：「⋯收穫雖然多只有 20%，甚至負債」
  //                → 同樣套淨值 ×20%（甚至允許負值，書版「甚至負債」）
  //
  //   ▼ 陰陽不協調 P91、P93：「眾星拱月格⋯⋯付出與收穫式都會有 50%」
  //                          「陰陽不協調包含：全黑全紅格、眾星拱月格、一枝獨秀格」
  //                → 收穫×50% + 付出×50%（注意悔恨格在書本歸類為陰陽不協調，是 ×50% 不是 ×20%）
  //
  // 重要修正（vs v2.0~v2.9.2 舊邏輯）：
  //   ① 通吃/被通吃從「收穫×20%」改為「淨值×20%」(若為正)
  //   ② 悔恨格從「收穫付出×20%」改為「收穫付出×50%」(歸類陰陽不協調)
  //   ③ 通吃/被通吃 與 陰陽不協調 互斥優先（書本 P79：「好朋友格不成立通吃格」「⋯就不能直接說被通吃」）
  // ====================================================================
  const patterns = detectPatterns(board);
  const isAllEat = patterns.some(p => p.name === '通吃格');
  const isAllEaten = patterns.some(p => p.name === '被通吃格');
  const isHuihen = patterns.some(p => p.name.includes('悔恨'));
  const isOneOnly = patterns.some(p => p.name === '一枝獨秀格');
  const isCrowdedMoon = patterns.some(p => p.name === '眾星拱月格' || p.name === '鬱卒格');
  // 陰陽不協調 = 一枝獨秀 + 眾星拱月 + 鬱卒 + 全紅全黑悔恨格（書本 P93 明文歸類）
  const isYinyangBad = isHuihen || isOneOnly || isCrowdedMoon;

  let scoreRatio = 1.0;       // 收穫/付出共用比例（陰陽不協調用）
  let netRatio = 1.0;         // 淨值比例（通吃/被通吃用）
  let scoreNote = '';
  let netNote = '';

  // ① 陰陽不協調 → 收穫付出皆 ×50%（書本 P91、P93）
  if (isYinyangBad) {
    scoreRatio = 0.50;
    if (isHuihen) {
      scoreNote = '陰陽不協調・全紅全黑悔恨格：收穫付出皆×50%';
    } else if (isOneOnly) {
      scoreNote = '陰陽不協調・一枝獨秀格：收穫付出皆×50%';
    } else {
      scoreNote = '陰陽不協調・眾星拱月／鬱卒格：收穫付出皆×50%';
    }
  }

  const adjustedGain = centerGain * scoreRatio;
  const adjustedLoss = centerLoss * scoreRatio;
  const baseNet = adjustedGain - adjustedLoss;  // 套陰陽不協調比例後的淨值

  // ② 通吃/被通吃 → 淨值 ×20%（書本 P77、P78「所得」=淨值）
  let finalNet = baseNet;
  if (isAllEat) {
    finalNet = baseNet * 0.20;
    netRatio = 0.20;
    netNote = '通吃格：淨值×20%（書本 P77「依經驗大多只有 20% 或歸零」，例：原本應賺 100 萬→只賺 20 萬）';
  } else if (isAllEaten) {
    finalNet = baseNet * 0.20;
    netRatio = 0.20;
    netNote = '被通吃格：淨值×20%（書本 P78「收穫雖然多只有 20%，甚至負債」）';
  }

  // 合併 note 顯示
  const combinedNote = [scoreNote, netNote].filter(Boolean).join('；');

  return {
    eats, centerGain, centerLoss, halfBoard,
    net: centerGain - centerLoss,
    adjustedGain, adjustedLoss,        // 套陰陽不協調 50% 後（如果有）
    baseNet,                           // 中間值：陰陽 50% 套完之後、通吃 20% 套之前
    adjustedNet: finalNet,             // 最終淨值（套完所有比例）
    scoreRatio,                        // 陰陽不協調比例
    netRatio,                          // 通吃/被通吃淨值比例
    isAllEat, isAllEaten, isYinyangBad,
    scoreNote: combinedNote,
    gainRatio: scoreRatio,             // 向後兼容（舊欄位）
  };
}

/* ===== 五行分布 ===== */
function analyzeFiveElements(board) {
  const elements = {金:0, 木:0, 水:0, 火:0, 土:0};
  for (const p of POSITIONS) {
    if (board[p]) elements[board[p].element]++;
  }
  const issues = [];
  const ELEMENT_ORGAN = {
    '金':'肺、大腸、皮膚、鼻、呼吸系統',
    '木':'肝、膽、筋、目、免疫系統',
    '水':'腎、膀胱、骨、耳、婦科、攝護腺、內分泌',
    '火':'心、小腸、血管、舌、血液循環',
    '土':'脾、胃、肌肉、口、消化系統',
  };
  for (const e in elements) {
    if (elements[e] === 0) issues.push({type:'warn', text:`缺${e} → 注意 ${ELEMENT_ORGAN[e]}`});
    if (elements[e] >= 3) issues.push({type:'warn', text:`${e}過多(${elements[e]}) → ${ELEMENT_ORGAN[e]} 系統壓力明顯`});
  }
  return {elements, issues};
}

/* ===== 健康分析（中央被誰吃 → 對應器官） ===== */
function analyzeHealth(board) {
  const center = board.center;
  if (!center) return [];
  const issues = [];
  // 中央受威脅
  for (const p of POSITIONS) {
    if (p === 'center' || !board[p]) continue;
    if (canEat(board, p, 'center')) {
      const protected_ = isProtected(board, 'center', p);
      issues.push({
        type: protected_ ? 'info' : 'warn',
        text:`${POS_LABEL[p]} 的 ${board[p].name} 威脅中央 → 注意 ${center.organ}${protected_ ? '（有保護，影響減半）':''}`
      });
    }
  }
  // 健康關鍵：中央自身的器官系統先天較弱（依五行對應）
  issues.push({type:'info', text:`中央 ${center.name} 的五行屬${center.element} → 先天對應：${center.organ}`});
  return issues;
}

/* ===== 人物互動論述 ===== */
function buildInteractionNarrative(board, scoreInfo) {
  const center = board.center;
  if (!center) return [];
  const lines = [];
  const POS_REL = {
    top: '長輩、父母、老闆、主管',
    bottom: '晚輩、子女、下屬',
    left: '女性平輩' + (center.color ? '/老婆' : ''),
    right: '男性平輩/老公'
  };
  for (const p of ['top','bottom','left','right']) {
    if (!board[p]) continue;
    const piece = board[p];
    const sameColor = piece.color === center.color;
    const centerEatsThem = canEat(board, 'center', p);
    const theyEatCenter = canEat(board, p, 'center');
    let line = `${POS_REL[p]}（${piece.name}）：`;
    if (sameColor) {
      line += '與你同色，是夥伴／自己人，互動上偏平和、沒有正面衝突。';
    } else if (centerEatsThem && theyEatCenter) {
      line += '互利互吃 → 有來有往，需要看分數判斷誰收穫多。';
    } else if (centerEatsThem) {
      line += '你能從這個關係收穫 → 開口要、提需求多半會給。';
    } else if (theyEatCenter) {
      const protected_ = isProtected(board, 'center', p);
      line += '對方會吃你 → ' + (protected_ ? '你會付出但有保護，傷害減半。' : '你會勞心勞力、破財、付出多。');
    } else {
      line += '雙方無吃法可達 → 沒有明顯互動，各走各的。';
    }
    lines.push(line);
  }
  return lines;
}

/* ===== 命格選單對照（自動生成劇情敘述） ===== */
function buildLifeNarratives(board, patterns, scoreInfo, fiveInfo) {
  const center = board.center;
  if (!center) return [];
  const out = [];

  // 中央個性
  const centerNarrative = {
    'shuai': '能力很好，但人生容易經驗：很想有所突破與擴展，但無法如願得到所期待的突破與擴展的劇情。\n會有：執著某些價值觀與想法、想掌控的狀態。',
    'shi':   '能力好，但個性上容易有：許多自以為是的想法，常活在過去的認知與憂慮未來的狀態。\n運籌帷幄能力強，可成就大事業，但容易憂鬱。',
    'xiang': '個性容易有：情緒起伏大、被動的狀態。慈悲、重禮節，與宗教修行緣份深。\n做事比較慢、被動，但執行力穩。',
    'che':   '個性上容易：許多主觀的做人做事道理、容易管太多、較衝動。\n領導特質強、心軟但脾氣大、講話直接。',
    'ma':    '人生容易有：意念靜不下來、方向不定、心太軟的困擾。\n口才好、人脈廣、常不在家。',
    'pao':   '內在常會有恐懼與擔憂的感覺。直覺力強、人緣好、長相好。\n做事需要平台、跳板、媒介、時機。',
    'bing':  '人生容易：因為想太多、障礙行動、錯失機會、錢容易流失的劇情。\n務實、有理想、不投機、一步一腳印。'
  };
  out.push({title:`${center.name}（中宮自己）的個性與特質`, content: centerNarrative[center.kind]});

  // 馬入中宮 / 炮入中宮
  if (center.kind === 'ma' && !POSITIONS.some(p => p !== 'center' && board[p] && canEat(board, 'center', p))) {
    out.push({title:'馬入中宮警示', content:'馬本要走斜衝出去，被卡在中央吃不到任何人 → 有志難伸、想做想衝但現實不配合。'});
  }
  if (center.kind === 'pao' && !POSITIONS.some(p => p !== 'center' && board[p] && canEat(board, 'center', p))) {
    out.push({title:'炮入中宮警示', content:'炮需要跳板才能發揮，被卡在中央沒有媒介 → 有能力但沒有平台、難以發揮。'});
  }

  // 收穫付出評估
  if (scoreInfo.net > 0) {
    out.push({title:'整體收穫付出', content:`收穫 ${scoreInfo.centerGain} 分 / 付出 ${scoreInfo.centerLoss} 分 → 淨 +${scoreInfo.net} 分。${scoreInfo.halfBoard ? '（整盤有好朋友，已減半計算）' : ''}\n40 分約 1000 萬。這次卦象偏向「有收穫」。`});
  } else if (scoreInfo.net < 0) {
    out.push({title:'整體收穫付出', content:`收穫 ${scoreInfo.centerGain} 分 / 付出 ${scoreInfo.centerLoss} 分 → 淨 ${scoreInfo.net} 分。${scoreInfo.halfBoard ? '（整盤有好朋友，已減半計算）' : ''}\n這次卦象偏向「付出」，付出可能是錢、勞心勞力、應賺未賺到。`});
  } else if (scoreInfo.eats.length > 0) {
    out.push({title:'整體收穫付出', content:`收穫 = 付出 = ${scoreInfo.centerGain} 分 → 互利共存。`});
  }

  // 顯化建議
  const advice = [];
  if (patterns.some(p => p.name.includes('消耗格'))) advice.push('• 顯化淨化：清掉消耗的資料庫，連續做 7 天。');
  if (patterns.some(p => p.name.includes('破壞格'))) advice.push('• 顯化淨化：破壞格本身含消耗，做療癒淨化。');
  if (patterns.some(p => p.name.includes('困擾格'))) advice.push('• 寫話：「顯化某某某與某某某關係的貴人與可能性」。');
  if (patterns.some(p => p.name === '陰陽不協調')) {
    const colorCount = {red:0, black:0};
    for (const p of POSITIONS) if (board[p]) colorCount[board[p].color]++;
    if (colorCount.red > colorCount.black) advice.push('• 陰陽調整：脫鞋踩土壤、踩草地、接地氣 ≥ 15 分鐘。');
    else advice.push('• 陰陽調整：曬太陽，尤其曬背。');
  }
  if (patterns.some(p => p.name === '通吃格')) advice.push('• 通吃格短期很強但易歸零 → 做寫話「請留一線給人，迴向給眾生」。');
  if (patterns.some(p => p.name === '被通吃格')) advice.push('• 被通吃 → 嚴重時對應大限/重大關卡，需立即做療癒淨化＋顯化貴人。');
  // 健康警示
  if (fiveInfo.issues.length > 0) {
    advice.push('• 健康警示：' + fiveInfo.issues.map(i=>i.text).join('；'));
  }
  // 中央被吃且無保護 → 車關/官司
  for (const p of POSITIONS) {
    if (p === 'center' || !board[p]) continue;
    if (canEat(board, p, 'center') && !isProtected(board, 'center', p)) {
      const k = board[p].kind;
      if (k === 'che') advice.push('• ⚠ 車關警示：車吃中央且無保護 → 注意交通安全、被撞、車禍。');
      if (k === 'shi') advice.push('• ⚠ 官司／血光警示：士吃中央 → 注意糾紛、名譽受損、官司、血光之災。');
      if (k === 'ma') advice.push('• ⚠ 卡陰／犯小人警示：馬吃中央 → 注意絆腳石、無形干擾、現實小人。');
      if (k === 'pao') advice.push('• ⚠ 卡陰警示：炮吃中央 → 可能有無形界干擾或祖先議題，建議拆題追問來源。');
    }
  }
  if (advice.length > 0) {
    out.push({title:'建議與療癒淨化方向', content: advice.join('\n')});
  }
  return out;
}

/* ===== 書版五段式解盤敘述（v2.0 — 狀態→互動→格局→付出收穫→健康） ===== */
function buildCaiJiananNarrative(board, patterns, scoreInfo, fiveInfo, qContext) {
  const center = board.center;
  if (!center) return [];
  const out = [];
  const sections = [];
  const presentPos = POSITIONS.filter(p => board[p]);
  const isMale = qContext?.gender === 'male';
  const isFemale = qContext?.gender === 'female';
  const isMarried = qContext?.married === 'yes';
  // 卜主代名詞
  const subj = qContext?.gender ? (isMale ? '他' : '她') : '你';
  const subjPossessive = qContext?.gender ? (isMale ? '他的' : '她的') : '你的';
  const me = qContext?.gender ? subj : '你';

  // ① 狀態 — 從中央以及與中央同色的棋子論卦主特質
  const sameColorPositions = POSITIONS.filter(p => p !== 'center' && board[p] && board[p].color === center.color);
  let statePart = `**中央是${center.name}**，${center.persona}`;
  if (sameColorPositions.length > 0) {
    const sameColorNames = sameColorPositions.map(p => board[p].name).join('、');
    statePart += `\n\n${subj}同時擁有「${sameColorNames}」的特質：`;
    sameColorPositions.forEach(p => {
      const piece = board[p];
      const trait = {
        shuai:'有皇帝氣勢、講話有影響力',
        shi:'帶名聲、有智慧、運籌帷幄',
        xiang:'重禮節、慈悲心、跟修行有緣',
        che:'敢衝、領導力強',
        ma:'人脈廣、口才好',
        pao:'直覺強、有善巧',
        bing:'務實、踏實，一步一腳印'
      }[piece.kind] || '';
      statePart += `\n　• ${piece.name}（${POS_LABEL[p].split('(')[0]}）→ ${trait}`;
    });
  }
  // 中央 + 馬入中宮 / 炮入中宮
  if (center.kind === 'ma' && !POSITIONS.some(p => p !== 'center' && board[p] && canEat(board, 'center', p))) {
    statePart += `\n\n⚠ 馬入中宮：馬本來要走斜衝出去，現在卡在中央吃不到任何人 → 想做想衝，但現實不容易配合，容易做沒效率的事。建議${subj}做療癒淨化，清掉「想很多卻動不起來」的資料。`;
  }
  if (center.kind === 'pao' && !POSITIONS.some(p => p !== 'center' && board[p] && canEat(board, 'center', p))) {
    statePart += `\n\n⚠ 炮入中宮：炮需要跳板才能發揮，現在卡在中央沒有媒介 → 有能力但缺平台，容易好高騖遠。建議${subj}做顯化，請出協助${subjPossessive}有所突破的貴人與可能性。`;
  }
  sections.push({title:'① 狀態（中央＋同色棋子論卦主特質）', content: statePart});

  // ② 互動關係 — 跟身邊的人的互動關係
  const POS_REL_GENERIC = {
    top: '長輩、上司、年齡大十歲以上的朋友',
    bottom: '晚輩、下屬、子女、年齡小十歲以下的朋友',
    left: isMarried && isMale ? '妻子、女性平輩朋友、同事' :
          isMarried && isFemale ? '兄弟姊妹、女性平輩朋友、同事' :
          isFemale ? '姊妹、女性平輩朋友、同事' :
          isMale ? '姊妹、女朋友、女性平輩朋友、同事' :
          '女性平輩、姊妹、女友/老婆',
    right: isMarried && isMale ? '兄弟、男性平輩朋友、同事' :
          isMarried && isFemale ? '丈夫、男性平輩朋友、同事' :
          isFemale ? '兄弟、男朋友、男性平輩朋友、同事' :
          isMale ? '兄弟、男性平輩朋友、同事' :
          '男性平輩、兄弟、男友/老公'
  };
  let interactPart = '';
  for (const p of ['top','bottom','left','right']) {
    if (!board[p]) continue;
    const piece = board[p];
    const sameColor = piece.color === center.color;
    const centerEatsThem = canEat(board, 'center', p);
    const theyEatCenter = canEat(board, p, 'center');
    const protectedFromCenter = sameColor ? false : isProtected(board, p, 'center');
    const protectedToCenter = sameColor ? false : isProtected(board, 'center', p);

    let line = `\n• **${POS_REL_GENERIC[p]}**（${piece.name}${sameColor?'，同色':'，異色'}）：`;
    if (sameColor) {
      line += `跟${subj}是同邊的，是夥伴/自己人。互動上比較和氣、不會正面衝突。`;
    } else if (centerEatsThem && theyEatCenter) {
      line += `互利互吃，這個位置的人有來有往。需要看分數判斷誰收穫多。`;
    } else if (centerEatsThem) {
      const halfNote = protectedFromCenter ? '（對方有保護，只能得到一半好處）' : '';
      line += `${subj}可以從這個關係得到好處 → 開口要、提需求多半會給。${halfNote}`;
    } else if (theyEatCenter) {
      line += protectedToCenter
        ? `對方會吃${subj}，但${subj}有保護，只需付出一半。`
        : `對方會吃${subj} → ${subj}會勞心勞力、破財、付出多。建議要為這個關係做療癒淨化。`;
    } else {
      line += '雙方無吃法，沒有明顯互動，各走各的。';
    }
    interactPart += line;
  }
  sections.push({title:'② 互動關係', content: interactPart || '（盤上只有中央，無外圍互動可論。）'});

  // ③ 格局及需注意的狀態
  let patternPart = '';
  const importantPatterns = patterns.filter(p =>
    !p.name.includes('好人緣') && !p.name.includes('十字天助') // 太通用的略過
  );
  if (importantPatterns.length === 0) {
    patternPart = '本盤沒有特殊格局，主要看付出與收穫的分數判讀。';
  } else {
    patternPart += '本盤主要格局：\n';
    for (const p of importantPatterns) {
      const icon = p.type === 'good' ? '✓' : p.type === 'warn' ? '⚠' : '○';
      patternPart += `\n${icon} **${p.name}**：${p.desc}`;
    }
  }
  // 暴動格的人體部位提示
  for (const p of POSITIONS) {
    if (!board[p]) continue;
    if (board[p].kind !== 'shuai') continue;
    if (board[p].color === center.color) continue; // 同色不威脅
    if (!POSITIONS.some(bp => board[bp] && board[bp].kind === 'bing' && board[bp].color === board[p].color)) {
      // 暴動的將/帥
      const bodyMap = {
        center:'脖子以下、肚臍以上（軀幹中央）',
        left:'身體右側（鏡像）',
        right:'身體左側（鏡像）',
        top:'頭部',
        bottom:'肚臍以下、下肢'
      };
      patternPart += `\n\n💢 暴動的${board[p].name}在${POS_LABEL[p].split('(')[0]} → 對應${subjPossessive}${bodyMap[p]}氣血循環會比較不順暢，建議做清理。`;
    }
  }
  sections.push({title:'③ 格局及需注意的狀態', content: patternPart});

  // ④ 付出與收穫
  let scorePart = `${subj}這次卦象的收穫與付出：\n`;
  scorePart += `\n　原始計算：收穫 ${scoreInfo.centerGain} 分／付出 ${scoreInfo.centerLoss} 分／淨${scoreInfo.net >= 0 ? '收穫' : '付出'} ${Math.abs(scoreInfo.net)} 分`;
  if (scoreInfo.halfBoard) {
    scorePart += '\n　（盤中有好朋友格，已減半計算）';
  }
  if (scoreInfo.scoreNote) {
    scorePart += `\n\n⚠ **${scoreInfo.scoreNote}**`;
    // 陰陽不協調（含悔恨）→ 顯示收穫付出皆 ×50% 後的結果
    if (scoreInfo.isYinyangBad) {
      scorePart += `\n　收穫付出皆×50%：收穫 ${scoreInfo.adjustedGain.toFixed(1)} 分／付出 ${scoreInfo.adjustedLoss.toFixed(1)} 分／淨${scoreInfo.baseNet >= 0 ? '收穫' : '付出'} ${Math.abs(scoreInfo.baseNet).toFixed(1)} 分`;
    }
    // 通吃/被通吃 → 顯示淨值 ×20% 後的最終結果
    if (scoreInfo.isAllEat || scoreInfo.isAllEaten) {
      const baseNetForDisplay = scoreInfo.isYinyangBad ? scoreInfo.baseNet : scoreInfo.net;
      scorePart += `\n　淨值×20%：${baseNetForDisplay >= 0 ? '+' : ''}${baseNetForDisplay.toFixed(1)} × 20% = 最終淨${scoreInfo.adjustedNet >= 0 ? '收穫' : '付出'} ${Math.abs(scoreInfo.adjustedNet).toFixed(1)} 分`;
    }
  }
  // 用書版的「40分≈1000萬」金額換算
  if (Math.abs(scoreInfo.adjustedNet) >= 10) {
    const equivMillion = (Math.abs(scoreInfo.adjustedNet) / 40 * 1000).toFixed(0);
    scorePart += `\n\n💰 以「40分≈1000萬」換算 → 約 ${equivMillion} 萬規模${scoreInfo.adjustedNet < 0 ? '的付出/應賺未賺' : '的收穫'}。（僅供量化參考，金額實際視題目論定）`;
  }
  sections.push({title:'④ 付出與收穫', content: scorePart});

  // ⑤ 健康
  let healthPart = '';
  // 中央受威脅 = 最明顯
  const centerThreats = POSITIONS.filter(p => p !== 'center' && board[p] && canEat(board, p, 'center'));
  if (centerThreats.length > 0) {
    healthPart += `中央 ${center.name}（${center.element}行）對應${center.organ}。\n`;
    for (const p of centerThreats) {
      const protected_ = isProtected(board, 'center', p);
      const piece = board[p];
      const meaning = {
        shi:'容易有名譽受損、糾紛、官司，或血光、開刀',
        che:'容易有車關、交通意外，肝膽免疫系統壓力',
        ma:'容易有意外受傷、卡陰、犯小人',
        pao:'容易卡陰、有無形干擾，腎/泌尿/婦科/攝護腺較弱',
        shuai:'重大關卡',
        xiang:'心血管、血液循環',
        bing:'消化系統、脾胃壓力'
      }[piece.kind] || '';
      healthPart += `\n　⚠ ${POS_LABEL[p].split('(')[0]} ${piece.name} 威脅中央 → ${meaning}${protected_ ? '（有保護，影響減半）' : ''}`;
    }
  } else {
    healthPart += `中央沒有受到威脅，主要看消耗格與五行平衡。\n`;
  }
  // 五行警示
  for (const issue of fiveInfo.issues) healthPart += `\n　🌿 ${issue.text}`;
  // 暴動格、消耗格附身體影響
  if (patterns.some(p => p.name.includes('暴動'))) {
    healthPart += `\n　💢 有暴動格 → 整體氣血循環、情緒穩定度都較不順。`;
  }
  // 陰陽不協調建議
  const colorCount = {red:0, black:0};
  for (const p of POSITIONS) if (board[p]) colorCount[board[p].color]++;
  if (Math.abs(colorCount.red - colorCount.black) >= 3) {
    if (colorCount.red > colorCount.black) {
      healthPart += `\n　🌱 紅多 → 建議${subj}多踩踩草地、泥土地，把身上多餘的能量釋放出來。`;
    } else {
      healthPart += `\n　☀️ 黑多 → 建議${subj}多曬太陽（尤其曬背），補充能量。`;
    }
  }
  sections.push({title:'⑤ 健康', content: healthPart});

  // 結語：療癒淨化建議
  const closing = [];
  closing.push(`\n📿 **整體建議（書版心法）**`);
  closing.push(`卦象只是讓我們看到我們意識資料庫裡有這樣的資料，只要運用我們所教的方式來做清理，就可以改變這些狀態。`);
  closing.push(`\n建議${subj}針對以下狀態做療癒淨化：`);
  if (patterns.some(p => p.name.includes('消耗'))) closing.push('• 消耗格 → 清掉消耗的資料庫');
  if (patterns.some(p => p.name === '通吃格')) closing.push('• 通吃格 → 做寫話「請留一線給人，迴向給眾生」，避免最後歸零');
  if (patterns.some(p => p.name === '被通吃格')) closing.push('• 被通吃格 → 立即做療癒淨化＋顯化貴人');
  if (patterns.some(p => p.name.includes('困擾'))) closing.push('• 困擾格 → 做顯化「某某某與某某某關係的貴人與可能性」');
  if (patterns.some(p => p.name === '分離格')) closing.push('• 分離格 → 清掉跟對方價值觀不同的資料');
  if (patterns.some(p => p.name.includes('暴動'))) closing.push('• 暴動格 → 清掉偏執認知和情緒的資料');
  if (patterns.some(p => p.name === '生死關')) closing.push('• ⚠ 生死關 → 必須做療癒淨化＋被通吃格的資料清理，不可忽視');
  if (patterns.some(p => p.name === '修行緣分格')) closing.push(`• 修行緣分 → ${subj}有跟神明連結的緣分，可以多做修行功課`);
  if (Math.abs(colorCount.red - colorCount.black) >= 3) closing.push('• 陰陽不協調 → 多做療癒淨化清理意識資料庫，再操作下載補充能量');
  // 對方馬包吃我方棋 → 卡陰、犯小人（書本第 9 章馬先生範例 + 第 8 章命盤要點）
  let hasMaPaoEatOurs = false;
  for (const p of POSITIONS) {
    if (p === 'center' || !board[p]) continue;
    if (board[p].color === center.color) continue; // 同色
    if (!['ma','pao'].includes(board[p].kind)) continue;
    // 對方馬/包能吃我方棋（中央或同色外圍）？
    if (canEat(board, p, 'center')) { hasMaPaoEatOurs = true; break; }
    for (const op of POSITIONS) {
      if (op === 'center' || op === p || !board[op]) continue;
      if (board[op].color === center.color && canEat(board, p, op)) {
        hasMaPaoEatOurs = true; break;
      }
    }
    if (hasMaPaoEatOurs) break;
  }
  if (hasMaPaoEatOurs) closing.push('• ⚠ 對方傌馬/炮包吃到我方棋 → 容易卡陰、犯小人、做錯決定。建議做療癒淨化清理「卡陰、犯小人、做錯決定而損失」的資料');
  closing.push(`\n別忘了：「${subjPossessive}本質是完美的、健康的、豐盛的，只是資料庫裡有些什麼，所以才會經驗這樣的劇情。」清掉這些資料，人生劇情就會改善。`);
  sections.push({title:'結語', content: closing.join('\n')});

  return sections;
}

/* ===== UI ===== */
let pickedPiece = null;
let board = {center:null, top:null, bottom:null, left:null, right:null};

let pickedPieceNatal = null;
let natalBoard = new Array(32).fill(null);

let pickedPiecePL = null;
let plBoard = {center:null, top:null, bottom:null, left:null, right:null};

function renderPicker(targetId, callback, currentVar) {
  const grid = document.getElementById(targetId);
  grid.innerHTML = '';
  for (const name of PIECE_ORDER) {
    const piece = PIECES[name];
    const btn = document.createElement('button');
    btn.className = 'pick-btn ' + piece.color;
    btn.textContent = name;
    btn.title = `${piece.name} (${piece.color==='red'?'紅':'黑'} / ${piece.element} / ${piece.score}分)`;
    btn.onclick = () => callback(name);
    grid.appendChild(btn);
  }
}

function renderBoard(boardId, b) {
  const slots = document.querySelectorAll(`#${boardId} .slot`);
  slots.forEach(slot => {
    const pos = slot.dataset.pos;
    const piece = b[pos];
    slot.classList.remove('red','black','empty');
    if (piece) {
      slot.classList.add(piece.color);
      slot.textContent = piece.name;
    } else {
      slot.classList.add('empty');
      slot.textContent = pos === 'center' ? '中宮' : ({top:'上',bottom:'下',left:'左',right:'右'})[pos];
    }
  });
}

/* ===== 卦種定義與自動偵測（書本第 9 章 15 個情境） ===== */
const Q_TYPE_LABELS = {
  auto:'🤖 自動判讀', event:'📋 事件卦', love:'❤️ 感情卦', career:'💼 事業/工作卦',
  business:'🤝 合作/生意卦', health:'🏥 健康卦', wealth:'💰 財運卦',
  property:'🏠 買賣房子卦', recruit:'✅ 錄取/考試卦', decision:'🤔 決策卦', fortune:'🔮 運勢卦',
  achieve:'🎯 會不會成（達到/做到）', lostitem:'🔍 失物找回', moneyback:'💸 錢能拿回', doctor:'👨‍⚕️ 選擇醫生/保健品', healing:'🧘 療癒淨化效果', pastlife:'🌀 前世關係'
};

function detectQuestionType(text) {
  const t = (text || '').toLowerCase();
  if (!t.trim()) return 'event';
  // 書本第 9 章特殊情境（優先判讀）
  if (/前世|上一世|上輩子|累世/.test(t)) return 'pastlife';
  if (/療癒|淨化|顯化|下載|清理.*資料/.test(t)) return 'healing';
  if (/失物|找回|遺失|丟掉|不見了|遺失|尋回/.test(t)) return 'lostitem';
  if (/錢能不能拿回|錢拿得回|借錢|被詐騙|要回錢/.test(t)) return 'moneyback';
  if (/選擇醫生|哪個醫生|健康食品|保健品|這個醫生|那個醫生/.test(t)) return 'doctor';
  if (/會不會成|會不會升官|會不會當選|會不會生|官司會不會贏|可不可以用.*買到|達到.*目標|做到/.test(t)) return 'achieve';
  if (/感情|對象|男友|女友|另一半|追|喜歡|愛|分手|曖昧|交往|結婚|離婚|姻緣|桃花|外遇|小三|心動/.test(t)) return 'love';
  if (/錄取|考試|備取|報名|徵選|甄選|考上|及格|過關|榜單|放榜|雅思|托福|證照/.test(t)) return 'recruit';
  if (/買房|賣房|房子|房屋|房地產|物件|買賣|成交|看屋|簽約|交屋|社區|建案|預售/.test(t)) return 'property';
  if (/合作|合夥|簽約|生意|交易|談合作|合約|提案|案子|報價|對方/.test(t)) return 'business';
  if (/工作|事業|職場|老闆|主管|同事|公司|轉職|升遷|加薪|裁員|離職|面試|求職|創業/.test(t)) return 'career';
  if (/身體|健康|生病|手術|症狀|療程|醫生|吃藥|治療|疾病|腫瘤|血壓|手痛|腰痛|頭痛/.test(t)) return 'health';
  if (/財運|錢|收入|投資|報酬|賺|獲利|存錢|破財|花費|股票|基金|加密|比特|理財/.test(t)) return 'wealth';
  if (/這個月|這禮拜|這週|今年|本週|今天|明天|月運|周運|年運|運勢|命運|流年/.test(t)) return 'fortune';
  if (/開心|難過|快樂|決定|選擇|該不該|要不要|值不值/.test(t)) return 'decision';
  return 'event';
}

/* ===== 針對問題的解讀 ===== */
function buildQuestionAnswer(b, patterns, scoreInfo, fiveInfo, qType, qText) {
  const center = b.center;
  if (!center) return null;

  const enemies = POSITIONS.filter(p => p !== 'center' && b[p] && b[p].color !== center.color);
  const centerEatsAny = enemies.some(e => canEat(b, 'center', e));
  const beingEatenBy = enemies.filter(e => canEat(b, e, 'center'));
  const beingEatenUnprotected = beingEatenBy.filter(e => !isProtected(b, 'center', e));
  const hasFriendPair = patterns.some(p => p.name === '好朋友格');
  const hasGoodLuck = patterns.some(p => p.name === '好人緣格');
  const hasMutualLove = patterns.some(p => p.name === '互相欣賞格');
  const isWin = patterns.some(p => p.name === '勝利格');
  const isAllEat = patterns.some(p => p.name === '通吃格');
  const isAllEaten = patterns.some(p => p.name === '被通吃格');
  const isHardship = patterns.some(p => p.name.includes('陰陽不協調') || p.name.includes('悔恨'));
  const isSplit = patterns.some(p => p.name === '分離格');
  const isExhaust = patterns.some(p => p.name.includes('消耗格'));
  const isBroken = patterns.some(p => p.name === '破壞格');
  const isTangle = patterns.some(p => p.name === '困擾格');
  const isMing = patterns.some(p => p.name === '明君格');
  const isTyrant = patterns.some(p => p.name === '暴君格');
  const isWealth = patterns.some(p => p.name === '富貴格');
  const isUmbrella = patterns.some(p => p.name === '雨傘格');
  const isCross = patterns.some(p => p.name.includes('十字天柱'));
  const isThreeMind = patterns.some(p => p.name === '三人同心格');
  const正桃 = patterns.find(p => p.name.includes('正桃花'));
  const偏桃 = patterns.find(p => p.name.includes('偏桃花'));

  // 通用「能不能成」判定
  const isYesByFriendPair = hasFriendPair;
  const netPositive = scoreInfo.net > 0;
  const netStrongPositive = scoreInfo.net >= 30;
  const netNegative = scoreInfo.net < 0;

  let verdictBadge = '';
  let verdictText = '';
  let analysis = [];
  let suggestions = [];

  switch (qType) {
    case 'love': {
      // 感情卦
      if (正桃 || hasMutualLove) {
        verdictBadge = '<span class="badge badge-good">有戲</span>';
        verdictText = '感情面有正向能量。';
        if (正桃) analysis.push(`✓ 出現${正桃.name} → 有正常、明面、直接的感情互動潛能。`);
        if (hasMutualLove) analysis.push('✓ 互相欣賞格 → 彼此欣賞、有吸引、有交集。');
      } else if (偏桃) {
        verdictBadge = '<span class="badge badge-warn">小心</span>';
        verdictText = '出現偏桃花 → 曖昧、不穩定、可能小三或非正式關係。';
        analysis.push(`⚠ ${偏桃.name} → 不是正常感情線；要小心對象的真實意圖。`);
      } else if (isSplit) {
        verdictBadge = '<span class="badge badge-warn">緣薄</span>';
        verdictText = '分離格 → 緣分較淺、關係容易斷、不易融合。';
      } else if (isTyrant) {
        verdictBadge = '<span class="badge badge-warn">易離</span>';
        verdictText = '暴君格（女命盤）→ 強勢、自我，關係失衡，易離婚劇情。';
      } else if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-good">姻緣有</span>';
        verdictText = '好朋友格 → 有結婚正緣，但不一定是好姻緣，要看分數綜合判斷。';
      } else if (centerEatsAny && netPositive) {
        verdictBadge = '<span class="badge badge-good">有機會</span>';
        verdictText = '中央能吃別人 + 收穫 > 付出 → 主動權在你，有發展機會。';
      } else if (beingEatenUnprotected.length > 0) {
        verdictBadge = '<span class="badge badge-warn">付出多</span>';
        verdictText = '中央被吃且無保護 → 你會勞心勞力、單方付出多。';
      } else {
        verdictBadge = '<span class="badge badge-info">平淡</span>';
        verdictText = '無強烈感情徵兆 → 此次卦象偏中性，可能是普通關係或還沒進展到曖昧。';
      }
      // 桃花格說明
      if (center.kind === 'ma') analysis.push('💭 中央是馬/傌 → 你對感情有浪漫期待，但「馬」入中宮表示想衝但不一定能成。');
      if (center.kind === 'pao') analysis.push('💭 中央是炮/包 → 你需要「平台/媒介」才能促成感情，要主動找場合認識。');
      if (中央被(beingEatenBy, b, 'pao')) analysis.push('⚠ 被炮/包吃 → 對方可能對你有「想發生關係」的意圖，注意對方真實意圖。');
      // 建議
      if (!正桃 && !hasMutualLove && !hasFriendPair) {
        suggestions.push('做寫話「顯化 [姓名] 的好姻緣與正緣的貴人與可能性」，連續 7 天。');
      }
      if (偏桃) suggestions.push('避免曖昧不清的關係，做淨化清掉桃花債的劇情。');
      if (isSplit) suggestions.push('分離格 → 多踩土壤接地氣（紅多）或曬背（黑多），加強自身能量。');
      break;
    }

    case 'career': {
      // 事業/工作卦
      const hasEvent = patterns.some(p => p.name.includes('車馬炮')) || ['che','ma','pao'].includes(center.kind);
      if (isWealth || isMing) {
        verdictBadge = '<span class="badge badge-good">大利事業</span>';
        verdictText = (isWealth ? '富貴格' : '') + (isWealth && isMing ? '+' : '') + (isMing ? '明君格' : '') + ' → 有天助、有方向、有領導力。';
      } else if (isTyrant) {
        verdictBadge = '<span class="badge badge-warn">缺下屬</span>';
        verdictText = '暴君格 → 想做事但缺下屬配合，需自己親力親為或顯化貴人。';
      } else if (isAllEat) {
        verdictBadge = '<span class="badge badge-warn">短利</span>';
        verdictText = '通吃格 → 短期看似一片大好，但最後可能歸零。需留善念給人。';
      } else if (isAllEaten) {
        verdictBadge = '<span class="badge badge-warn">大關卡</span>';
        verdictText = '被通吃格 → 努力可能白費、可能破產或被外在勢力控制。';
      } else if (centerEatsAny && netPositive) {
        verdictBadge = '<span class="badge badge-good">有收穫</span>';
        verdictText = '中央能吃別人 + 淨收穫 +' + scoreInfo.net + '分 → 工作上有實際進展。';
      } else if (netNegative) {
        verdictBadge = '<span class="badge badge-warn">付出多</span>';
        verdictText = `淨付出 ${scoreInfo.net} 分 → 這段時間勞心勞力、應賺未賺。`;
      } else if (isExhaust && center.color === b[POSITIONS.find(p => p !== 'center' && b[p] && b[p].color === center.color && b[p].kind === center.kind)]?.color) {
        verdictBadge = '<span class="badge badge-warn">內耗</span>';
        verdictText = '內耗格 → 自己想太多、行動力弱拖延，建議釐清目標再動手。';
      } else {
        verdictBadge = '<span class="badge badge-info">中性</span>';
        verdictText = '無明顯吉凶 → 工作平穩，看分數加減做評估。';
      }
      // 缺天/人/地格警示
      const hasTian = POSITIONS.some(p => b[p] && ['shuai','shi','xiang'].includes(b[p].kind));
      const hasRen = POSITIONS.some(p => b[p] && ['che','ma','pao'].includes(b[p].kind));
      const hasDi = POSITIONS.some(p => b[p] && b[p].kind === 'bing');
      if (!hasTian) analysis.push('⚠ 缺天格（將士相）→ 缺天助、時機不對。');
      if (!hasRen) analysis.push('⚠ 缺人格（車馬炮）→ 缺貴人、缺人幫忙。');
      if (!hasDi) analysis.push('⚠ 缺地格（兵卒）→ 缺財庫、留不住錢、基礎不足。');
      // 中央個性
      if (center.kind === 'ma' && !centerEatsAny) analysis.push('💭 馬入中宮 → 想衝但有志難伸，現實不配合。');
      if (center.kind === 'pao' && !centerEatsAny) analysis.push('💭 炮入中宮 → 有能力但缺平台/跳板，需要主動建立資源。');
      // 建議
      if (!hasRen) suggestions.push('做寫話「顯化 [姓名] 工作上的貴人與可能性」，連續 7 天。');
      if (netNegative) suggestions.push('檢視是否有應拒絕的工作/合作 → 不要硬接賠錢的單。');
      if (isAllEat) suggestions.push('通吃格短期賺，留 10–20% 給合作夥伴，避免最後歸零。');
      break;
    }

    case 'business': {
      // 合作/生意卦
      if (hasMutualLove) {
        verdictBadge = '<span class="badge badge-good">有共識</span>';
        verdictText = '互相欣賞格 → 雙方有合作空間、有共識，生意可成。';
      } else if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-good">可成</span>';
        verdictText = '好朋友格 → 有合作機會，但需補顯化（透過顯化或溝通把資料庫補起來）。';
      } else if (centerEatsAny && netPositive) {
        verdictBadge = '<span class="badge badge-good">有利</span>';
        verdictText = `主動權在你 + 收穫 +${scoreInfo.net} 分 → 對方會接受你的條件。`;
      } else if (beingEatenUnprotected.length > 0 && netNegative) {
        verdictBadge = '<span class="badge badge-warn">吃虧</span>';
        verdictText = `對方吃定你 + 淨付出 ${scoreInfo.net} 分 → 不建議簽，會被佔便宜。`;
      } else if (isSplit) {
        verdictBadge = '<span class="badge badge-warn">難成</span>';
        verdictText = '分離格 → 雙方價值觀差異大、緣分淺，合作易中斷。';
      } else if (isTangle) {
        verdictBadge = '<span class="badge badge-warn">糾纏</span>';
        verdictText = '困擾格 → 兩組好朋友 → 關係牽連太多，會勞心勞力。';
      } else {
        verdictBadge = '<span class="badge badge-info">平局</span>';
        verdictText = `淨值 ${scoreInfo.net >= 0 ? '+' : ''}${scoreInfo.net} 分 → 合作普通，沒有特別吉凶。`;
      }
      if (中央被(beingEatenBy, b, 'shi')) analysis.push('⚠ 被士/仕吃 → 注意糾紛、合約陷阱、官司風險。');
      if (中央被(beingEatenBy, b, 'che')) analysis.push('⚠ 被車/俥吃 → 對方很強勢、會主導局面。');
      if (!hasFriendPair && netNegative) suggestions.push('簽約前再三審約，避免簽下不利條款。');
      if (centerEatsAny && netPositive) suggestions.push('主動出擊談判 → 你的條件對方接受度高。');
      break;
    }

    case 'health': {
      // 健康卦
      if (beingEatenUnprotected.length > 0) {
        verdictBadge = '<span class="badge badge-warn">需注意</span>';
        verdictText = '中央被吃且無保護 → 對應器官有警示。';
        for (const e of beingEatenUnprotected) {
          const k = b[e].kind;
          const map = {
            shi:'血光、糾紛、官司或開刀',
            che:'車關、交通意外、肝膽免疫',
            ma:'卡陰、犯小人、肝膽筋',
            pao:'卡陰、無形干擾、腎/婦科/攝護腺',
            shuai:'重大關卡',
            xiang:'心臟血管',
            bing:'消化系統、脾胃'
          }[k] || '對應系統';
          analysis.push(`⚠ ${POS_LABEL[e]} ${b[e].name} 吃中央 → ${map}`);
        }
      } else if (centerEatsAny) {
        verdictBadge = '<span class="badge badge-good">向好</span>';
        verdictText = '中央能吃別人 → 治療有效、身體會好轉。';
      } else if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-info">穩定</span>';
        verdictText = '好朋友格 → 健康有保護，目前狀況穩定。';
      } else {
        verdictBadge = '<span class="badge badge-info">平穩</span>';
        verdictText = '無明顯威脅，但要看五行分布。';
      }
      // 五行警示
      for (const issue of fiveInfo.issues) analysis.push(`🌿 ${issue.text}`);
      // 中央自身對應器官
      analysis.push(`💭 中央 ${center.name}（${center.element}行）對應器官：${center.organ}`);
      suggestions.push('做寫話「顯化 [姓名] [症狀] 可被治癒的貴人與可能性」，連續 7 天。');
      if (isHardship) suggestions.push('陰陽不協調 → 紅多踩土壤；黑多曬背。');
      break;
    }

    case 'wealth': {
      // 財運卦
      if (netStrongPositive) {
        verdictBadge = '<span class="badge badge-good">大利財</span>';
        verdictText = `淨收穫 +${scoreInfo.net} 分 ≈ ${(scoreInfo.net/40*1000).toFixed(0)} 萬規模 → 財運強。`;
      } else if (netPositive) {
        verdictBadge = '<span class="badge badge-good">有財</span>';
        verdictText = `淨收穫 +${scoreInfo.net} 分 → 有小財進帳。`;
      } else if (netNegative) {
        verdictBadge = '<span class="badge badge-warn">破財</span>';
        verdictText = `淨付出 ${scoreInfo.net} 分 → 可能破財或應賺未賺。`;
      } else if (isAllEat) {
        verdictBadge = '<span class="badge badge-warn">短利後空</span>';
        verdictText = '通吃格 → 一開始很賺，最後可能歸零。';
      } else {
        verdictBadge = '<span class="badge badge-info">平平</span>';
        verdictText = '財運平平，沒有大進大出。';
      }
      const hasDi = POSITIONS.some(p => b[p] && b[p].kind === 'bing');
      if (!hasDi) analysis.push('⚠ 缺地格（兵卒）→ 缺財庫、錢留不住、基礎不足。');
      if (中央被(beingEatenBy, b, 'che')) analysis.push('⚠ 被車吃 → 注意意外破財或被強勢扣款。');
      if (netNegative) suggestions.push('做寫話「顯化 [姓名] 財富累積的貴人與可能性」，避開高風險投資。');
      break;
    }

    case 'property': {
      // 買賣房子卦
      if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-good">可成</span>';
        verdictText = '好朋友格 → 有成交機會（最強指標）。';
      } else if (centerEatsAny && netPositive) {
        verdictBadge = '<span class="badge badge-good">有利</span>';
        verdictText = '中央能吃別人 + 收穫多 → 你掌握主動權，可成交。';
      } else if (beingEatenUnprotected.length > 0) {
        verdictBadge = '<span class="badge badge-warn">吃虧</span>';
        verdictText = '被吃且無保護 → 對方會壓你價格或附帶條件不利。';
      } else if (isHardship) {
        verdictBadge = '<span class="badge badge-warn">難成</span>';
        verdictText = '陰陽不協調或全紅/全黑 → 老天爺不答這個問題，可能成交價格、時間或條件需要再調整。';
      } else if (netNegative) {
        verdictBadge = '<span class="badge badge-warn">不利</span>';
        verdictText = `淨付出 ${scoreInfo.net} 分 → 不建議照原條件成交，會吃虧。`;
      } else {
        verdictBadge = '<span class="badge badge-info">中性</span>';
        verdictText = '中性局面，可能要換問法（精確金額或日期）再問。';
      }
      analysis.push('💡 房屋卦最佳問法：「我會不會在 X 月 X 日前以 X 元成交 [地址]？」精確金額/日期才會準。');
      if (!hasFriendPair && netNegative) suggestions.push('改問法或換成交條件再卜一次（這算新的問題，不是重複問）。');
      break;
    }

    case 'recruit': {
      // 錄取/考試卦（書本 P233「⑦ 會不會考上或錄取」完整重寫，v2.9.4）
      //
      // 書本 P233 原文：
      //   ▼ 單向（書面考試／學校／職位／證照）：
      //     「就一定要吃到對方（非得到好處）才能考上。
      //      若有好朋友格，代表有機會，但需要操作顯化。」
      //   ▼ 雙向（甄試／應徵／申請）：
      //     「不管是能吃對方（主動可成）或被對方吃（被動可成），都會錄取。
      //      若卦象有好朋友格，代表有錄取的機會，一樣需要操作顯化。」
      //   ▼ 共同規則：「這類問題無需考量天人地。」
      //
      // 「非得到好處」對應書本 5 種半分情境：
      //   好朋友格(halfBoard)、保護、抗衡、牽制、一枝獨秀唯一

      // 依問題文字判定單向/雙向
      const qStr = qText || '';
      const isOneWayExam = /考試|考上|考得上|學校|科系|大學|高中|國中|證照|執照|雅思|托福|多益|榜單|筆試|統測|學測|指考|會考|高普考|律師|醫師執照/.test(qStr);
      const isTwoWayApp  = /甄試|應徵|面試|申請|徵選|甄選|招募|找工作|職缺/.test(qStr);
      const examMode = (isTwoWayApp && !isOneWayExam) ? 'two-way' : 'one-way';

      // 「真吃」= 中央作為攻擊方且該吃法無任何減半條件
      const centerRealEats = scoreInfo.eats.filter(e =>
        e.attackerPos === 'center' &&
        !e.protected_ && !e.isCounter && !e.isPin && !e.isOnlyOneVictim && !e.halfBoard
      );
      const centerHalfEats = scoreInfo.eats.filter(e =>
        e.attackerPos === 'center' &&
        (e.protected_ || e.isCounter || e.isPin || e.isOnlyOneVictim || e.halfBoard)
      );
      const centerRealEatsAny = centerRealEats.length > 0;

      if (examMode === 'one-way') {
        // 單向（書面考試）：必須「真吃」才能考上
        if (centerRealEatsAny) {
          verdictBadge = '<span class="badge badge-good">能考上</span>';
          const eatList = centerRealEats.map(e => `${POS_LABEL[e.victimPos].split('(')[0]}${e.victim}(${e.score}分)`).join('、');
          verdictText = `書本 P233：書面考試「必須吃到對方（非得到好處）才能考上」→ 中央真吃到 ${centerRealEats.length} 隻對方棋（${eatList}）→ ✅ 能考上。`;
        } else if (hasFriendPair) {
          verdictBadge = '<span class="badge badge-info">有機會</span>';
          verdictText = '書本 P233：有好朋友格 → 有考上機會，但要操作顯化補資料庫加強動能。';
        } else if (centerHalfEats.length > 0) {
          const halfReasons = [...new Set(centerHalfEats.map(e =>
            e.halfBoard ? '整盤好朋友格' : e.protected_ ? '被保護' : e.isCounter ? '抗衡' : e.isPin ? '牽制' : '一枝獨秀唯一不被吃'
          ))].join('、');
          verdictBadge = '<span class="badge badge-warn">非真吃</span>';
          verdictText = `書本 P233：書面考試必須「非得到好處」才能考上。中央吃法只有「得到好處」（${halfReasons}），不能直接論考上 → 需顯化補加強。`;
        } else if (isHardship) {
          verdictBadge = '<span class="badge badge-warn">不利</span>';
          verdictText = '陰陽不協調 → 顯化動能不足，需要顯化加強。';
        } else {
          verdictBadge = '<span class="badge badge-warn">難考上</span>';
          verdictText = '書本 P233：書面考試「能吃才能考上」，中央吃不到對方 → 本盤不利。可做顯化加強動能。';
        }
      } else {
        // 雙向（甄試／應徵／申請）：能吃 OR 被吃都會錄取
        if (centerEatsAny && beingEatenBy.length > 0) {
          verdictBadge = '<span class="badge badge-good">雙向錄取</span>';
          verdictText = '書本 P233：雙向錄取「能吃或被吃都會錄取」→ 中央既能吃也被吃 → ✅ 必錄取（主動+被動兼具）。';
        } else if (centerEatsAny) {
          verdictBadge = '<span class="badge badge-good">主動錄取</span>';
          verdictText = '書本 P233：雙向「能吃對方=主動可成（正選）」→ ✅ 主動錄取。';
        } else if (beingEatenBy.length > 0) {
          verdictBadge = '<span class="badge badge-good">被動錄取</span>';
          verdictText = '書本 P233：雙向「被對方吃=被動可成（可能是備選／候補名單）」→ ✅ 被動錄取。';
        } else if (hasFriendPair) {
          verdictBadge = '<span class="badge badge-info">有機會</span>';
          verdictText = '書本 P233：有好朋友格 → 有錄取機會，但要操作顯化加強動能。';
        } else if (isHardship) {
          verdictBadge = '<span class="badge badge-warn">不利</span>';
          verdictText = '陰陽不協調 → 顯化動能不足，需要顯化加強。';
        } else {
          verdictBadge = '<span class="badge badge-info">普通</span>';
          verdictText = '中央吃不到、也沒被吃 → 機會普通，靠實力決定。';
        }
      }

      // 書本 P233 明文：「這類問題無需考量天人地」→ 移除舊版「缺地格警告」
      analysis.push('💡 書本 P233：錄取/考試卦「無需考量天人地」（不需擔心五行/天人地缺）。');
      analysis.push(`📚 問題判定為「${examMode === 'one-way' ? '單向書面考試' : '雙向甄試／應徵／申請'}」依書本 P233 規則判讀。`);
      suggestions.push('做寫話「顯化 [姓名][考試名/職位] 錄取的貴人與可能性」，連續 7 天，考前每天噴。');
      break;
    }

    case 'decision': {
      // 決策卦（會不會讓我開心）
      if (netStrongPositive) {
        verdictBadge = '<span class="badge badge-good">會開心</span>';
        verdictText = `淨收穫 +${scoreInfo.net} 分 → 這個決定會讓你滿足、開心。`;
      } else if (netPositive) {
        verdictBadge = '<span class="badge badge-good">小開心</span>';
        verdictText = `淨收穫 +${scoreInfo.net} 分 → 整體偏開心，有小確幸。`;
      } else if (netNegative) {
        verdictBadge = '<span class="badge badge-warn">會難過</span>';
        verdictText = `淨付出 ${scoreInfo.net} 分 → 這個決定會讓你勞累、不開心。`;
      } else if (isAllEat) {
        verdictBadge = '<span class="badge badge-warn">短樂後悔</span>';
        verdictText = '通吃格 → 短期開心，最後可能後悔。';
      } else if (isAllEaten) {
        verdictBadge = '<span class="badge badge-warn">大損失</span>';
        verdictText = '被通吃格 → 大損失、會努力歸零。';
      } else {
        verdictBadge = '<span class="badge badge-info">平淡</span>';
        verdictText = '決定後沒有特別開心或難過，平淡。';
      }
      if (netNegative) suggestions.push('考慮換個方式做這件事，或乾脆不做。');
      break;
    }

    case 'fortune': {
      // 運勢卦
      analysis.push(`💭 中央 ${center.name}（${center.color === 'red' ? '紅' : '黑'} / ${center.element}行）→ 這段時間你呈現的核心狀態。`);
      if (netPositive) {
        verdictBadge = '<span class="badge badge-good">有收穫</span>';
        verdictText = `淨收穫 +${scoreInfo.net} 分 → 整體運勢偏上，是有所得的時段。`;
      } else if (netNegative) {
        verdictBadge = '<span class="badge badge-warn">付出多</span>';
        verdictText = `淨付出 ${scoreInfo.net} 分 → 這段時間勞心勞力、付出多。`;
      } else {
        verdictBadge = '<span class="badge badge-info">平穩</span>';
        verdictText = '運勢平穩，沒有大起大落。';
      }
      if (isCross) analysis.push('✓ 十字天助格 → 天時對了、有老天助力。');
      if (isUmbrella) analysis.push('☂ 雨傘格 → 有人罩，但可能壓抑。');
      if (isExhaust) analysis.push('⚠ 消耗格 → 想太多、自己內耗，需要清理。');
      if (isHardship) {
        const colorCount = {red:0, black:0};
        for (const p of POSITIONS) if (b[p]) colorCount[b[p].color]++;
        suggestions.push(colorCount.red > colorCount.black ? '🟢 紅多 → 多踩土壤、踩草地、接地氣 ≥ 15 分鐘' : '🟢 黑多 → 多曬太陽，尤其曬背');
      }
      // 健康警示
      for (const issue of fiveInfo.issues) suggestions.push('🏥 ' + issue.text);
      // 車關官司
      if (中央被(beingEatenBy, b, 'che')) suggestions.push('⚠ 車關警示 → 注意交通安全、開車小心。');
      if (中央被(beingEatenBy, b, 'shi')) suggestions.push('⚠ 官司/血光警示 → 注意糾紛、爭執、合約。');
      break;
    }

    case 'achieve': {
      // 會不會成（達到/做到）— 書本第 9 章 p.232-233
      // 「只要我們能夠吃掉對方的棋子（非得到好處），就代表可以成」
      // 牽制 → 因考量不一定會成
      // 兵卒/炮包消耗 → 想太多不去行動
      // 好朋友格 → 有可能性需要顯化
      const hasPin = scoreInfo.eats.some(e => e.attackerPos === 'center' && e.isPin);
      const hasOnlyHalfEat = centerEatsAny && scoreInfo.eats.filter(e => e.attackerPos === 'center')
        .every(e => e.protected_ || e.isCounter || e.isPin || e.isOnlyOneVictim || e.halfBoard);
      const hasSelfBingPaoExhaust = patterns.some(p => p.name.includes('消耗格(自己)'));

      if (centerEatsAny && !hasOnlyHalfEat && !hasPin) {
        verdictBadge = '<span class="badge badge-good">會成</span>';
        verdictText = '中央能完整吃掉對方棋子 → 這件事會成。';
      } else if (hasPin) {
        verdictBadge = '<span class="badge badge-warn">不一定成</span>';
        verdictText = '牽制 → 因考量某些因素，不一定會成。建議做療癒淨化。';
        analysis.push('⚠ 有牽制：你能吃對方但怕對方反過來吃你同色棋');
      } else if (hasSelfBingPaoExhaust && centerEatsAny) {
        verdictBadge = '<span class="badge badge-warn">想太多不行動</span>';
        verdictText = '中央有自己的兵卒/炮包消耗 → 雖然能吃，但會因想太多、恐懼擔憂而不去行動。';
      } else if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-info">需顯化</span>';
        verdictText = '好朋友格 → 有可能性，但因為無法完整吃掉對方，需要操作顯化才會成。';
      } else if (!centerEatsAny && !hasFriendPair) {
        verdictBadge = '<span class="badge badge-warn">機率極低</span>';
        verdictText = '吃不到也沒好朋友格 → 機率極低，療癒淨化後再操作顯化或許有可能。';
      } else if (hasOnlyHalfEat) {
        verdictBadge = '<span class="badge badge-warn">只得好處</span>';
        verdictText = '只能「得好處」（半分）不算完整吃到 → 不算會成。';
      }
      // 困擾/分離/暴動的提醒
      if (isTangle) analysis.push('💭 困擾格 → 過程會有些困擾');
      if (isSplit) analysis.push('💭 分離格 → 跟所預期的會有落差或不一樣');
      if (patterns.some(p => p.name.includes('暴動'))) analysis.push('💭 暴動格 → 會出現自己或外在不可控的狀況');
      if (isTangle || isSplit || patterns.some(p => p.name.includes('暴動'))) {
        suggestions.push('做清理讓這件事「更順暢的成」。');
      }
      break;
    }

    case 'lostitem': {
      // 失物找回（書本第 9 章 p.235）
      const hasOnlyHalfEat2 = centerEatsAny && scoreInfo.eats.filter(e => e.attackerPos === 'center')
        .every(e => e.protected_ || e.isCounter || e.isPin || e.isOnlyOneVictim || e.halfBoard);
      if (centerEatsAny && !hasOnlyHalfEat2) {
        verdictBadge = '<span class="badge badge-good">找得到</span>';
        verdictText = '中央能吃對方 → 失物能找得回來。';
      } else if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-info">沒丟</span>';
        verdictText = '好朋友格 → 東西沒有丟掉，有機會找到，但需要顯化才知道何時找到。';
      } else {
        verdictBadge = '<span class="badge badge-warn">難找回</span>';
        verdictText = '吃不到對方 → 找不回來。可操作顯化和跨實相試試。';
      }
      break;
    }

    case 'moneyback': {
      // 錢能不能拿回（書本第 9 章 p.235）
      const halfGet = scoreInfo.eats.some(e => e.attackerPos === 'center' && (e.protected_ || e.halfBoard || e.isOnlyOneVictim));
      if (centerEatsAny && !halfGet) {
        verdictBadge = '<span class="badge badge-good">拿得回</span>';
        verdictText = '中央能完整吃對方 → 錢能拿得回來。';
      } else if (centerEatsAny && halfGet) {
        verdictBadge = '<span class="badge badge-warn">部分拿回</span>';
        verdictText = '只能得好處（半分）→ 可以拿回來一部分。';
      } else {
        verdictBadge = '<span class="badge badge-warn">拿不回</span>';
        verdictText = '吃不到也沒好處 → 拿不回來。';
      }
      suggestions.push('💡 不論能不能拿回，這代表卦主有「破財的資料」，建議療癒淨化避免重複發生。不要批判對方是加害者。');
      break;
    }

    case 'doctor': {
      // 選擇醫生/吃健康食品（書本第 9 章 p.248）
      // 看「收穫>付出」，地格 = 處理到病因，不需考量天人格、陰陽
      const hasDi = POSITIONS.some(p => b[p] && b[p].kind === 'bing');
      if (scoreInfo.net > 0 && hasDi) {
        verdictBadge = '<span class="badge badge-good">適合且治本</span>';
        verdictText = `收穫 +${scoreInfo.net} 分 + 有地格（兵卒）→ 適合，且能處理到病因（治本）。`;
      } else if (scoreInfo.net > 0) {
        verdictBadge = '<span class="badge badge-good">適合但治標</span>';
        verdictText = `收穫 +${scoreInfo.net} 分 → 適合，但缺地格可能只能治標。`;
      } else if (scoreInfo.net < 0) {
        verdictBadge = '<span class="badge badge-warn">不適合</span>';
        verdictText = `付出 ${scoreInfo.net} 分 → 不適合，建議換另一位/另一種試試。`;
      } else {
        verdictBadge = '<span class="badge badge-info">普通</span>';
        verdictText = '收穫等於付出 → 效果普通，可考慮其他選擇。';
      }
      // 扣分項
      const negFactors = [];
      if (isExhaust) negFactors.push('消耗格');
      if (isBroken) negFactors.push('破壞格');
      if (isSplit) negFactors.push('分離格');
      if (isTangle) negFactors.push('困擾格');
      if (patterns.some(p => p.name.includes('暴動'))) negFactors.push('暴動格');
      if (negFactors.length > 0) analysis.push(`⚠ 扣分格局：${negFactors.join('、')}（會降低效果）`);
      break;
    }

    case 'pastlife': {
      // 前世關係判定（書本第 9 章 p.240-244）
      const c = center.color === 'red' ? '男性' : '女性';
      const role = {
        shuai:'君王、元帥、高層級的領袖或領導人',
        shi:'官職、教師、將軍、將士',
        xiang:'修行人、宰相、員外',
        che:'團隊領導人、老闆',
        ma:'業務、講師、顧問、謀士',
        pao:'帥哥美女、演藝或風雅人士、商人',
        bing:'工人、農民、士兵、小生意人'
      }[center.kind] || '一般人';
      verdictBadge = '<span class="badge badge-info">前世</span>';
      verdictText = `上輩子卦主是「${c}」（中央${center.name}屬${center.color === 'red' ? '陽' : '陰'}），角色：${role}。`;
      analysis.push('💡 詳細前世關係請參考速查表「前世關係判定」段落（依棋種+位置對應）');
      break;
    }

    case 'healing': {
      // 療癒淨化效果卦（書本第 10 章 p.260-261）
      // 「只看有沒有得吃或有沒有收穫，不算付出」
      const hasBingFriend = patterns.some(p => {
        if (p.name !== '好朋友格') return false;
        return p.desc.includes('兵') && p.desc.includes('卒');
      });
      const hasOtherFriend = hasFriendPair && !hasBingFriend;
      const hasAdjacentMing = isMing && patterns.some(p => p.name === '明君格' && p.desc);
      const score = scoreInfo.centerGain;

      let healingScore;
      if (hasBingFriend) {
        if (score <= 10) healingScore = 80;
        else if (score <= 30) healingScore = 85;
        else healingScore = 90;
        verdictText = `兵卒好朋友格 → 方法正確且已清理到真正根源。療癒成效約 ${healingScore} 分。`;
        verdictBadge = '<span class="badge badge-good">已到根源</span>';
      } else if (hasOtherFriend || hasAdjacentMing) {
        if (score <= 10) healingScore = 70;
        else if (score <= 30) healingScore = 75;
        else if (score <= 50) healingScore = 80;
        else if (score <= 70) healingScore = 85;
        else healingScore = 90;
        verdictText = `${hasBingFriend?'':''}好朋友格／相鄰明君格 → 方法跟方向是正確的。療癒成效約 ${healingScore} 分。`;
        verdictBadge = '<span class="badge badge-good">方向正確</span>';
      } else if (isHardship && Math.abs(colorCount.red - colorCount.black) === 5) {
        verdictBadge = '<span class="badge badge-warn">重新卜</span>';
        verdictText = '五支全黑或全紅 → 建議重新卜一卦。';
      } else {
        if (score < 20) healingScore = '需調整';
        else if (score < 40) healingScore = 60;
        else if (score < 60) healingScore = 65;
        else if (score < 80) healingScore = 70;
        else if (score < 100) healingScore = 75;
        else if (score < 120) healingScore = 80;
        else if (score < 140) healingScore = 85;
        else healingScore = 90;
        verdictText = `沒有好朋友格／相鄰明君格 → 方向方法可再調整。療癒成效約 ${healingScore} 分。`;
        verdictBadge = '<span class="badge badge-info">可調整</span>';
      }
      // 扣分項
      let deduction = 0;
      const dedItems = [];
      if (isExhaust) { deduction += 2; dedItems.push('消耗格'); }
      if (isTangle) { deduction += 2; dedItems.push('困擾格'); }
      if (patterns.some(p => p.name.includes('暴動'))) { deduction += 2; dedItems.push('暴動格'); }
      if (isSplit) { deduction += 2; dedItems.push('分離格'); }
      if (isAllEaten) { deduction += 2; dedItems.push('被通吃格'); }
      if (patterns.some(p => p.name === '一枝獨秀格')) { deduction += 2; dedItems.push('一枝獨秀格'); }
      if (patterns.some(p => p.name.includes('眾星拱月') || p.name === '鬱卒格')) { deduction += 2; dedItems.push('眾星拱月/鬱卒'); }
      if (deduction > 0) analysis.push(`⚠ 扣分項：${dedItems.join('、')}（每項-2，共扣 ${deduction} 分）`);
      suggestions.push('💡 最高 90 分（人的侷限）。建議每項目至少用掉 2-4 支噴瓶後再卜卦看效果。提醒：勿過於執著療癒淨化的分數。');
      break;
    }

    default: { // event 一般事件卦
      if (hasFriendPair) {
        verdictBadge = '<span class="badge badge-good">可成</span>';
        verdictText = '好朋友格 → 此事有機會成（最直接的 yes 訊號）。';
      } else if (centerEatsAny && netPositive) {
        verdictBadge = '<span class="badge badge-good">有利</span>';
        verdictText = `主動可達 + 收穫 +${scoreInfo.net} 分 → 此事對你有利。`;
      } else if (beingEatenUnprotected.length > 0 && netNegative) {
        verdictBadge = '<span class="badge badge-warn">不利</span>';
        verdictText = `被吃且無保護 + 付出 ${scoreInfo.net} 分 → 此事不利。`;
      } else if (isHardship) {
        verdictBadge = '<span class="badge badge-warn">老天不答</span>';
        verdictText = '陰陽不協調或全紅/全黑 → 問題可能不夠精確，建議換個問法重問。';
      } else {
        verdictBadge = '<span class="badge badge-info">中性</span>';
        verdictText = '中性局面，看格局與分數綜合判斷。';
      }
    }
  }

  return {
    qType, qText,
    typeLabel: Q_TYPE_LABELS[qType] || '事件卦',
    verdictBadge, verdictText, analysis, suggestions,
    summary: `${verdictText}（淨值 ${scoreInfo.net >= 0 ? '+' : ''}${scoreInfo.net} 分）`
  };
}

// 輔助：判斷中央是否被某類棋子吃
function 中央被(beingEatenBy, b, kind) {
  return beingEatenBy.some(p => b[p] && b[p].kind === kind);
}

function renderAnalysis(b) {
  const target = document.getElementById('analysis-single');
  if (!b.center) {
    target.innerHTML = '<div class="empty-msg">請先放上中宮（自己）的棋。</div>';
    return;
  }
  const patterns = detectPatterns(b);
  const scoreInfo = computeScores(b);
  const fiveInfo = analyzeFiveElements(b);
  const healthInfo = analyzeHealth(b);
  const interactionNarrative = buildInteractionNarrative(b, scoreInfo);
  const lifeNarratives = buildLifeNarratives(b, patterns, scoreInfo, fiveInfo);

  // 取得問題、卦種、卜主資訊（書版 v2.0）
  const qText = (document.getElementById('question-text')?.value || '').trim();
  let qType = document.getElementById('question-type')?.value || 'auto';
  if (qType === 'auto') qType = detectQuestionType(qText);
  const qContext = {
    gender: document.getElementById('querent-gender')?.value || '',
    married: document.getElementById('querent-married')?.value || ''
  };
  const answer = buildQuestionAnswer(b, patterns, scoreInfo, fiveInfo, qType, qText);

  // 書版五段式解盤敘述（v2.0）
  const caiSections = buildCaiJiananNarrative(b, patterns, scoreInfo, fiveInfo, qContext);

  let html = '';

  // 🎯 針對問題的解讀（最重要、放最上面）
  if (answer && qText) {
    html += '<div class="section" style="background:#fff8e0;padding:14px;border-radius:8px;border-left:5px solid #ff8c00;">';
    html += `<div class="section-title">🎯 針對問題的解讀</div>`;
    html += `<div class="item info"><b>問題</b>：${qText.replace(/</g,'&lt;')}</div>`;
    html += `<div class="item info"><b>卦種</b>：${answer.typeLabel}</div>`;
    html += `<div class="item" style="font-size:16px;background:#fff;border-left:4px solid #c8102e;padding:10px;">`;
    html += `${answer.verdictBadge} <b>${answer.verdictText}</b>`;
    html += `</div>`;
    if (answer.analysis.length > 0) {
      html += `<div style="margin-top:8px;font-size:13px;color:#6b3410;font-weight:600;">📊 分析依據</div>`;
      for (const a of answer.analysis) html += `<div class="item">${a}</div>`;
    }
    if (answer.suggestions.length > 0) {
      html += `<div style="margin-top:8px;font-size:13px;color:#6b3410;font-weight:600;">💡 建議行動</div>`;
      for (const s of answer.suggestions) html += `<div class="item good">${s}</div>`;
    }
    html += '</div>';
  } else if (!qText) {
    html += '<div class="section" style="background:#faf3e8;padding:10px;border-radius:8px;border-left:3px solid #d4b896;">';
    html += '<div class="item muted">💡 在上方填入問題後，這裡會出現「🎯 針對問題的解讀」。</div>';
    html += '</div>';
  }

  // 🌸 書版五段式解盤（v2.0）
  html += '<div class="section" style="background:linear-gradient(135deg,#fff8e0,#fce8d0);padding:14px;border-radius:8px;border-left:5px solid #c8102e;margin-top:14px;">';
  html += `<div class="section-title" style="color:#6b3410;font-size:16px;">🌸 書版五段式解盤（v2.6）</div>`;
  html += `<div style="font-size:12px;color:#888;margin-bottom:10px;">採用《改寫人生的象棋卜卦》第 7 章標準解盤順序：狀態→互動→格局→付出收穫→健康</div>`;
  for (const sec of caiSections) {
    html += `<div style="margin-top:12px;padding:10px;background:#fff;border-radius:6px;border-left:3px solid #d4b896;">`;
    html += `<div style="font-weight:600;color:#6b3410;margin-bottom:6px;">${sec.title}</div>`;
    html += `<div style="white-space:pre-line;line-height:1.7;font-size:14px;color:#333;">${sec.content}</div>`;
    html += `</div>`;
  }
  html += '</div>';

  // 卦象結構
  html += '<div class="section"><div class="section-title">卦象結構</div>';
  html += `<div class="item info"><b>中宮</b>：${b.center.name}（${b.center.color==='red'?'紅':'黑'} / ${b.center.element} / ${b.center.level} / ${b.center.score}分）</div>`;
  for (const p of ['top','bottom','left','right']) {
    if (b[p]) html += `<div class="item">${POS_LABEL[p]}：${b[p].name}</div>`;
  }
  html += '</div>';

  // 格局
  html += '<div class="section"><div class="section-title">格局判讀</div>';
  if (patterns.length === 0) {
    html += '<div class="item muted">無特殊格局。</div>';
  } else {
    for (const pt of patterns) {
      const cls = pt.type === 'good' ? 'badge-good' : (pt.type === 'warn' ? 'badge-warn' : 'badge-info');
      html += `<div class="item ${pt.type==='warn'?'warn':(pt.type==='good'?'good':'info')}"><span class="badge ${cls}">${pt.name}</span> ${pt.desc}</div>`;
    }
  }
  html += '</div>';

  // 吃法
  html += '<div class="section"><div class="section-title">吃法與分數</div>';
  if (scoreInfo.eats.length === 0) {
    html += '<div class="item muted">沒有任何可吃關係。</div>';
  } else {
    for (const e of scoreInfo.eats) {
      const note = [];
      if (e.friendPair) note.push('好朋友配對');
      if (e.protected_) note.push('被保護');
      if (e.halfBoard) note.push('整盤好朋友');
      const tag = e.attackerPos === 'center' ? '🟢 我吃' : (e.victimPos === 'center' ? '🔴 我被吃' : '⚪ 旁觀');
      html += `<div class="item ${e.attackerPos==='center'?'good':(e.victimPos==='center'?'warn':'')}">${tag}：${POS_LABEL[e.attackerPos]} ${e.attacker} → 吃 → ${POS_LABEL[e.victimPos]} ${e.victim} = <b>${e.score}分</b>${note.length?`（${note.join('、')}）`:''}</div>`;
    }
  }
  if (b.center) {
    html += `<div class="stat-row"><span>收穫</span><b>+${scoreInfo.centerGain} 分</b></div>`;
    html += `<div class="stat-row"><span>付出</span><b>-${scoreInfo.centerLoss} 分</b></div>`;
    html += `<div class="stat-row"><span>淨值</span><b>${scoreInfo.net >= 0 ? '+' : ''}${scoreInfo.net} 分（40分≈1000萬）</b></div>`;
  }
  html += '</div>';

  // 人物互動
  if (interactionNarrative.length > 0) {
    html += '<div class="section"><div class="section-title">人物互動（上下左右）</div>';
    for (const line of interactionNarrative) html += `<div class="item">${line}</div>`;
    html += '</div>';
  }

  // 五行
  html += '<div class="section"><div class="section-title">五行分布</div>';
  html += `<div class="item">金 ${fiveInfo.elements.金} ／ 木 ${fiveInfo.elements.木} ／ 水 ${fiveInfo.elements.水} ／ 火 ${fiveInfo.elements.火} ／ 土 ${fiveInfo.elements.土}</div>`;
  for (const i of fiveInfo.issues) html += `<div class="item warn">${i.text}</div>`;
  html += '</div>';

  // 健康
  html += '<div class="section"><div class="section-title">健康判讀</div>';
  for (const i of healthInfo) html += `<div class="item ${i.type==='warn'?'warn':'info'}">${i.text}</div>`;
  html += '</div>';

  // 解盤敘述
  html += '<div class="section"><div class="section-title">解盤敘述</div>';
  for (const n of lifeNarratives) {
    html += `<div class="item info"><b>${n.title}</b><div class="narrative-block">${n.content}</div></div>`;
  }
  html += '</div>';

  // 顯化淨化建議（單卦模式 — 書版命格選單觸發劇情自動產出咒輪紙與念誦）
  // 重用 buildPurificationGuide 函數，傳入 isSingle:true 旗標
  html += buildPurificationGuide({
    isSingle: true,
    layers: [{idx:1, lb:b, patterns, scoreInfo, fiveInfo, ageStart:0, ageEnd:0}]
  }, '');

  target.innerHTML = html;
}

/* ===== 單卦事件 ===== */
function setupSingle() {
  renderPicker('picker-single', name => {
    pickedPiece = name;
    document.getElementById('cur-pick').textContent = `${name}（${PIECES[name].color==='red'?'紅':'黑'}）`;
  });
  document.querySelectorAll('#board-single .slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const pos = slot.dataset.pos;
      if (pickedPiece) {
        board[pos] = PIECES[pickedPiece];
      } else {
        board[pos] = null;
      }
      renderBoard('board-single', board);
      renderAnalysis(board);
    });
  });
  document.getElementById('btn-clear-single').onclick = () => {
    board = {center:null, top:null, bottom:null, left:null, right:null};
    renderBoard('board-single', board);
    renderAnalysis(board);
  };
  // 🎲 隨機抽 5 子（書版實體 32 顆袋抽 5 不放回）
  document.getElementById('btn-random-single').onclick = () => {
    const drawn = drawRandomPieces(5);
    board = {
      center: PIECES[drawn[0]],
      left:   PIECES[drawn[1]],
      right:  PIECES[drawn[2]],
      top:    PIECES[drawn[3]],
      bottom: PIECES[drawn[4]],
    };
    renderBoard('board-single', board);
    renderAnalysis(board);
  };
  // 🎲 抽下一顆（從袋中抽 1 顆放下一個空格，順序：中→左→右→上→下）
  document.getElementById('btn-random-next-single').onclick = () => {
    const order = ['center','left','right','top','bottom'];
    const nextEmpty = order.find(p => !board[p]);
    if (!nextEmpty) {
      alert('盤面已滿，請先清空再抽。');
      return;
    }
    // 從袋中扣除已放上盤面的棋子（模擬實體不放回）
    const usedNames = order.filter(p => board[p]).map(p => board[p].name);
    const remainingBag = buildPieceBag().filter(name => {
      const idx = usedNames.indexOf(name);
      if (idx >= 0) { usedNames.splice(idx, 1); return false; }
      return true;
    });
    const drawn = shuffleArray(remainingBag)[0];
    board[nextEmpty] = PIECES[drawn];
    renderBoard('board-single', board);
    renderAnalysis(board);
  };
  document.getElementById('btn-print').onclick = () => exportPDF('single');

  // 問題輸入即時更新
  const qText = document.getElementById('question-text');
  const qType = document.getElementById('question-type');
  const qHint = document.getElementById('question-hint');
  const updateHint = () => {
    const text = qText.value.trim();
    const sel = qType.value;
    if (sel === 'auto' && text) {
      const detected = detectQuestionType(text);
      qHint.innerHTML = `🤖 自動判讀為：<b style="color:#8b4513;">${Q_TYPE_LABELS[detected]}</b>（不準的話可手動切換右側下拉選單）`;
    } else if (text) {
      qHint.textContent = '';
    } else {
      qHint.innerHTML = '<span style="color:#aaa;">提示：問題以「自己」為主體，含人事時地物五要素最準。</span>';
    }
    renderAnalysis(board);
  };
  qText.addEventListener('input', updateHint);
  qType.addEventListener('change', updateHint);
  // 卜主性別 / 婚姻狀態變化也重新渲染
  document.getElementById('querent-gender')?.addEventListener('change', () => renderAnalysis(board));
  document.getElementById('querent-married')?.addEventListener('change', () => renderAnalysis(board));
  updateHint();
}

/* ===== 命盤 ===== */
// 命盤版面：依書版「象棋數理」表（8 個開門見山十字直向串接）排列。
// 每列 [棋號, row, col]（col 1=左 2=中 3=右）。棋號 1-32 對應 natalBoard[棋號-1]；
// 第 4 支同時出現在最上（局1的上）與最下（局8的下＝閉環），兩處同棋連動。
const NATAL_VISUAL = [
  [4, 1, 2],
  [2, 2, 1], [1, 2, 2], [3, 2, 3],
  [5, 3, 2],
  [7, 4, 1], [6, 4, 2], [8, 4, 3],
  [9, 5, 2],
  [11, 6, 1], [10, 6, 2], [12, 6, 3],
  [13, 7, 2],
  [15, 8, 1], [14, 8, 2], [16, 8, 3],
  [17, 9, 2],
  [19, 10, 1], [18, 10, 2], [20, 10, 3],
  [21, 11, 2],
  [23, 12, 1], [22, 12, 2], [24, 12, 3],
  [25, 13, 2],
  [27, 14, 1], [26, 14, 2], [28, 14, 3],
  [29, 15, 2],
  [31, 16, 1], [30, 16, 2], [32, 16, 3],
  [4, 17, 2]
];
function renderNatalGrid() {
  const grid = document.getElementById('natal-grid');
  grid.innerHTML = '';
  NATAL_VISUAL.forEach(function (v) {
    const num = v[0], i = num - 1;
    const slot = document.createElement('div');
    slot.className = 'natal-slot';
    slot.dataset.num = num.toString();
    slot.style.gridRow = v[1];
    slot.style.gridColumn = v[2];
    const piece = natalBoard[i];
    if (piece) {
      slot.classList.add(piece.color);
      slot.textContent = piece.name;
    }
    slot.addEventListener('click', function () {
      natalBoard[i] = pickedPieceNatal ? PIECES[pickedPieceNatal] : null;
      renderNatalGrid();
    });
    grid.appendChild(slot);
  });
}

// 命盤拆分為 8 個五子局（每局重疊一支「上=前一局的下」） — 書版 IMG_0819 公式
//   局 1（總格／1-10歲＋81-90歲）：中=1, 左=2, 右=3, 上=4, 下=5
//   局 2（學習格／11-20歲）：中=6, 左=7, 右=8, 上=5, 下=9
//   局 3（情感格／21-30歲）：中=10, 左=11, 右=12, 上=9, 下=13
//   局 4（事業格／31-40歲）：中=14, 左=15, 右=16, 上=13, 下=17
//   局 5（41-50歲）：中=18, 左=19, 右=20, 上=17, 下=21
//   局 6（51-60歲）：中=22, 左=23, 右=24, 上=21, 下=25
//   局 7（61-70歲）：中=26, 左=27, 右=28, 上=25, 下=29
//   局 8（71-80歲）：中=30, 左=31, 右=32, 上=29, 下=4（接回總格的「上」=第4支，閉環）
// 規律：每局新增 4 支（中/左/右/下），「上」取自前一局「下」；最後一局「下」=總格的「上」(第 4 支)。
const NATAL_LAYERS = [
  {idx:1, name:'總格',     range:'1-10歲／81-90歲', age:'1-10/81-90'},
  {idx:2, name:'學習格',   range:'11-20歲',         age:'11-20'},
  {idx:3, name:'情感格',   range:'21-30歲',         age:'21-30'},
  {idx:4, name:'事業格',   range:'31-40歲',         age:'31-40'},
  {idx:5, name:'第五局',   range:'41-50歲',         age:'41-50'},
  {idx:6, name:'第六局',   range:'51-60歲',         age:'51-60'},
  {idx:7, name:'第七局',   range:'61-70歲',         age:'61-70'},
  {idx:8, name:'第八局',   range:'71-80歲',         age:'71-80'},
];

// layerNum: 1-8（書版正確公式）
function getLayerBoard(layerNum) {
  let cIdx, lIdx, rIdx, tIdx, bIdx;
  if (layerNum === 1) {
    cIdx = 0; lIdx = 1; rIdx = 2; tIdx = 3; bIdx = 4;
  } else {
    const base = (layerNum - 1) * 4;       // 4, 8, 12, 16, 20, 24, 28
    cIdx = base + 1;                       // 中
    lIdx = base + 2;                       // 左
    rIdx = base + 3;                       // 右
    tIdx = base;                           // 上 = 前一局「下」
    // 下；局 8（base=28）→ 接回總格的「上」=第 4 支（idx=3）；其他局 = base+4
    bIdx = (layerNum === 8) ? 3 : (base + 4);
  }
  return {
    center: natalBoard[cIdx],
    left:   natalBoard[lIdx],
    right:  natalBoard[rIdx],
    top:    natalBoard[tIdx],
    bottom: natalBoard[bIdx],
    _idx:   { center:cIdx, left:lIdx, right:rIdx, top:tIdx, bottom:bIdx }
  };
}

// 跨局財富分析（車炮跳格往上吃）— 簡化：計算每一局中央往上一局可達吃法
function analyzeCrossLayer() {
  const found = [];
  for (let i = 1; i < NATAL_LAYERS.length; i++) {
    const cur = getLayerBoard(NATAL_LAYERS[i].idx);
    const prev = getLayerBoard(NATAL_LAYERS[i-1].idx);
    if (!cur.center) continue;
    // 中央往上局直線吃（車）或隔空吃（炮）
    const c = cur.center;
    if (c.kind === 'che') {
      // 車可以上下左右直線往上局吃
      for (const pos of POSITIONS) {
        const target = prev[pos];
        if (target && target.color !== c.color) {
          found.push({layer: NATAL_LAYERS[i], from:'中央車', to:`${POS_LABEL[pos]} ${target.name}`, gain: target.score, sameColor: target.color === c.color, age: NATAL_LAYERS[i].age});
        }
      }
    } else if (c.kind === 'pao') {
      // 炮跳格吃
      for (const pos of POSITIONS) {
        const target = prev[pos];
        if (target && target.color !== c.color) {
          found.push({layer: NATAL_LAYERS[i], from:'中央炮', to:`${POS_LABEL[pos]} ${target.name}`, gain: target.score, sameColor: false, age: NATAL_LAYERS[i].age});
        }
      }
    }
  }
  return found;
}

/* ===== 詳細版批命盤解說（書版第 8 章 P170 — 命盤解說：詳細版）=====
   依不同局產出不同主題段落：
   - 局 1 總格：特質／互動關係／格局／付出收穫／健康／天人地
   - 局 2 學習格(11-20)：學習能力／效率／運／格局／當期運勢
   - 局 3 情感格(21-30)：情感特質／人際和諧／期待如願／收穫付出／當期運勢
   - 局 4 事業格(31-40)：做事能力／效率／賺錢運／當期運勢
   - 局 5-8 (41-80歲)：特質／互動／格局／付出收穫／過局往上吃／健康
*/
function buildDetailedNarrative(layer, lb, prevLb, patterns, scoreInfo, fiveInfo, querentCtx) {
  const c = lb.center;
  if (!c) return '';

  // 卜主性別+婚姻狀態 → ②③位置代表角色（書本第 8 章 P171 範例 + 系統 v2.0 規則）
  // 男未婚：②姊妹/女友 ③兄弟｜男已婚：②妻子 ③兄弟（兄弟不變）
  // 女未婚：②姊妹 ③兄弟/男友｜女已婚：②兄弟姊妹 ③丈夫（姊妹不變）
  const gender = querentCtx?.gender || '';
  const married = querentCtx?.married === 'yes';
  const roleByPos = (() => {
    const r = {top:'長輩(父母/上司)', bottom:'晚輩(子女/下屬)'};
    if (gender === 'male') {
      r.left  = married ? '妻子/女性平輩' : '姊妹/女友/女性平輩';
      r.right = '兄弟/男性平輩';
    } else if (gender === 'female') {
      r.left  = married ? '兄弟姊妹/女性平輩' : '姊妹/女性平輩';
      r.right = married ? '丈夫/男性平輩'     : '兄弟/男友/男性平輩';
    } else {
      r.left  = '左方人物（女平輩）';
      r.right = '右方人物（男平輩）';
    }
    return r;
  })();
  const POS_LABEL = {center:'中央', left:`左(${roleByPos.left})`, right:`右(${roleByPos.right})`, top:`上(${roleByPos.top})`, bottom:`下(${roleByPos.bottom})`};
  const myColor = c.color;

  const sameColor = ['left','right','top','bottom']
    .filter(p => lb[p] && lb[p].color === myColor)
    .map(p => ({pos:p, piece:lb[p]}));

  const centerEats = [];
  for (const p of ['left','right','top','bottom']) {
    if (lb[p] && lb[p].color !== myColor && canEat(lb, 'center', p)) {
      centerEats.push({pos:p, piece:lb[p]});
    }
  }
  const centerEaten = [];
  for (const p of ['left','right','top','bottom']) {
    if (lb[p] && lb[p].color !== myColor && canEat(lb, p, 'center') && !isProtected(lb, 'center', p)) {
      centerEaten.push({pos:p, piece:lb[p]});
    }
  }

  // 過局往上吃（中央能吃前一局任一異色棋）
  const crossUp = [];
  if (prevLb && prevLb.center) {
    for (const p of ['left','center','right','top','bottom']) {
      const target = prevLb[p];
      if (target && target.color !== myColor && canEat(prevLb, 'center', p)) {
        crossUp.push({pos:p, piece:target});
      }
    }
  }

  const sameKinds = sameColor.map(s => s.piece.kind);
  const has = (kind) => sameKinds.includes(kind);
  const personaOf = (k) => ({
    shuai:'掌權、領導', shi:'聰明、執著、有自己的價值觀', xiang:'守護、家庭、學習',
    che:'走直線、行動力強', ma:'活躍、走斜、人緣好、四處奔波',
    pao:'感性、跳躍式思考、有爆發力', bing:'踏實、實踐、地基穩固'
  })[k] || '';

  const sections = [];
  const idx = layer.idx;

  // ===== 局 1 總格 =====
  if (idx === 1) {
    let traitText = `卦主中央是 <b>${c.name}</b>（${personaOf(c.kind)}）。`;
    if (sameColor.length > 0) {
      traitText += `身上同時帶有 ${sameColor.map(s => s.piece.name).join('、')} 的特質：`;
      traitText += sameColor.map(s => `${s.piece.name}=${personaOf(s.piece.kind)}`).join('；') + '。';
    } else {
      traitText += `沒有同色棋輔助 → 中央 ${c.name} 的特質會被孤立放大呈現。`;
    }
    sections.push({h:'◎ 特質', b:traitText});

    const interactions = [];
    if (centerEats.length > 0)
      interactions.push(`中央可以吃 ${centerEats.map(e => `${POS_LABEL[e.pos]} ${e.piece.name}`).join('、')} → 該位置代表的人事物會為卦主付出、聽卦主的話。`);
    if (centerEaten.length > 0)
      interactions.push(`${centerEaten.map(e => `${POS_LABEL[e.pos]} ${e.piece.name}`).join('、')} 可以吃中央 → 卦主需要為他們付出，或會受其影響、威脅。`);
    if (interactions.length === 0)
      interactions.push('中央與外圍無直接吃法 → 互不直接干涉，需看格局與保護。');
    sections.push({h:'◎ 互動關係', b:interactions.join('<br>')});

    if (patterns.length > 0)
      sections.push({h:'◎ 格局及需注意的狀態', b:patterns.map(p => `<b>${p.name}</b>：${p.desc}`).join('<br>')});

    sections.push({h:'◎ 付出與收穫',
      b:`收穫 +${scoreInfo.centerGain}／付出 -${scoreInfo.centerLoss}／淨 ${scoreInfo.net>=0?'+':''}${scoreInfo.net}分。${scoreInfo.note ? '（' + scoreInfo.note + '）' : ''}`});

    let healthText = '';
    if (fiveInfo.issues.length > 0) healthText = fiveInfo.issues.map(i => i.text).join('；');
    if (centerEaten.length > 0) {
      const causeMap = {shi:'呼吸/肺/大腸', xiang:'心血管', ma:'意外/筋骨', pao:'腎/泌尿/婦科', bing:'脾胃/消化/免疫', che:'肝膽/筋目/免疫', shuai:'整體大關卡'};
      healthText += (healthText ? '；' : '') + `中央被吃 → 注意 ${causeMap[c.kind] || '對應器官'}。`;
    }
    if (!healthText) healthText = '中央有保護或可反吃 → 健康無立即威脅。';
    sections.push({h:'◎ 健康', b:healthText});

    const heaven = (['shuai','shi','xiang'].includes(c.kind)) || sameColor.some(s => ['shuai','shi','xiang'].includes(s.piece.kind));
    const man    = (['che','ma','pao'].includes(c.kind))     || sameColor.some(s => ['che','ma','pao'].includes(s.piece.kind));
    const earth  = c.kind === 'bing'                          || has('bing');
    const tra = [];
    if (heaven && man && earth) tra.push('✓ 同時具備天、人、地三格 → 陰陽協調、做事完整。');
    else {
      if (!heaven) tra.push('缺天格（將/帥/士/仕/相/象）→ 缺乏理想／規劃／方向感。');
      if (!man)    tra.push('缺人格（俥/車/傌/馬/炮/包）→ 缺乏行動力／人脈／執行管道。');
      if (!earth)  tra.push('缺地格（兵/卒）→ 缺乏踏實基礎，做事容易浮。');
    }
    sections.push({h:'◎ 是否具備天人地', b:tra.join('<br>')});
  }

  // ===== 局 2 學習格 =====
  else if (idx === 2) {
    const learnKinds = ['shuai','shi','xiang','che'];
    const learnSupports = [c, ...sameColor.map(s => s.piece)].filter(p => learnKinds.includes(p.kind));
    let abilityText;
    if (learnSupports.length > 0) {
      abilityText = `學習特質的棋有：${learnSupports.map(p => p.name).join('、')} → 學習能力不錯。`;
    } else {
      abilityText = `中央和同色棋沒有將/帥/士/仕/相/象/俥/車這類學習特質 → 學習能力不特別突出。`;
    }
    if (has('ma')) abilityText += ' 同色有馬 → 喜歡學習、好動好問。';
    if (has('bing') || c.kind === 'bing') abilityText += ' 有兵卒 → 學習踏實、肯讀書。';
    if (c.kind === 'pao' && (has('ma') || has('bing'))) abilityText += ' 中央是包/炮 + 同色有馬或兵卒 → 喜歡學習但抓不到重點，較無法學以致用。';
    sections.push({h:'◎ 學習能力', b:abilityText});

    let effText = `淨 ${scoreInfo.net>=0?'+':''}${scoreInfo.net}分（收穫 +${scoreInfo.centerGain}／付出 -${scoreInfo.centerLoss}）→ `;
    if (scoreInfo.net > 0) effText += '學習效率不錯，付出能換到收穫。';
    else if (scoreInfo.net < 0) effText += '付出比收穫多，學習要花較多力氣才有成果。';
    else effText += '收支平衡，學習效率中等。';
    if (centerEats.length > 0) effText += ` 中央能吃 ${centerEats.map(e => e.piece.name).join('、')} → 善巧地汲取知識。`;
    sections.push({h:'◎ 學習效率', b:effText});

    let luckText;
    if (crossUp.length > 0) {
      luckText = `中央可往上一局（總格）吃 ${crossUp.map(e => `${POS_LABEL[e.pos]||''}${e.piece.name}`).join('、')} → 學習運不錯，能延伸學習成果到一輩子的素養。`;
    } else {
      luckText = '中央無法過局往上吃 → 學習運平淡，需要靠當局自己努力。';
    }
    sections.push({h:'◎ 學習運', b:luckText});

    if (patterns.length > 0)
      sections.push({h:'◎ 格局與狀態', b:patterns.map(p => `<b>${p.name}</b>：${p.desc}`).join('<br>')});

    let ageText = `中央 ${c.name}（${personaOf(c.kind)}）在 11-20 歲讀書階段呈現的狀態。`;
    if (lb.top && lb.top.color !== myColor && centerEaten.some(e => e.pos === 'top'))
      ageText += ' 上方（父母/師長）為異色且能吃中央 → 該時期父母師長對卦主管教較嚴、容易有衝突。';
    else if (lb.top && lb.top.color === myColor)
      ageText += ' 上方同色 → 父母師長對卦主較友善、放手不太管。';
    if (lb.bottom && centerEaten.some(e => e.pos === 'bottom'))
      ageText += ' 下方（弟妹/同儕）異色能吃中央 → 同儕關係要小心。';
    sections.push({h:'◎ 11-20歲的運勢', b:ageText});
  }

  // ===== 局 3 情感格 =====
  else if (idx === 3) {
    const hasMaPaoSame = sameColor.some(s => ['ma','pao'].includes(s.piece.kind));
    let emoText = `中央是 <b>${c.name}</b>。`;
    if (['ma','pao'].includes(c.kind) || hasMaPaoSame) {
      emoText += ' 中央或同色帶有傌/馬/炮/包 → 對情感較主動、浪漫、行動力強。';
    } else {
      emoText += ' 中央和同色都沒有傌/馬/炮/包 → 對情感比較被動、不浪漫，少了一些期待。';
    }
    sections.push({h:'◎ 情感特質', b:emoText});

    let harmonyText = `同色棋共 ${sameColor.length} 隻 → `;
    if (sameColor.length >= 2) harmonyText += '人際關係中有同伴，深交時較不孤單。';
    else harmonyText += '深交時容易感到孤單，需要多陪伴自己。';
    if (patterns.some(p => p.name && p.name.includes('消耗'))) harmonyText += ' 有消耗格 → 行動力被牽制，與人深交容易內耗想太多、行動力弱。';
    if (patterns.some(p => p.name && p.name.includes('一枝獨秀'))) harmonyText += ' 有一枝獨秀格 → 偏執認知，容易堅持自己的看法。';
    sections.push({h:'◎ 人際是否和諧', b:harmonyText});

    let expectText = '';
    if (scoreInfo.net > 0) expectText = `淨 +${scoreInfo.net}分 → 情感中能得到回報，期待較能如願。`;
    else if (scoreInfo.net < 0) expectText = `淨 ${scoreInfo.net}分 → 情感中付出多於收穫，期待容易落空。`;
    else expectText = '收支平衡 → 情感中得失互補，需要學會平常心。';
    if (!hasMaPaoSame && c.kind !== 'ma' && c.kind !== 'pao') expectText += ' 沒有同色傌馬炮包 → 對浪漫的期待本就較少。';
    sections.push({h:'◎ 期待是否能如願', b:expectText});

    sections.push({h:'◎ 收穫與付出',
      b:`收穫 +${scoreInfo.centerGain}／付出 -${scoreInfo.centerLoss}／淨 ${scoreInfo.net>=0?'+':''}${scoreInfo.net}分。${scoreInfo.note ? '（' + scoreInfo.note + '）' : ''}`});

    let ageText = `21-30 歲是建立深度人際關係的階段，中央 ${c.name} 主導這個時期的情感模式。`;
    if (patterns.length > 0) ageText += ` 含 ${patterns.map(p => p.name).join('、')} 等格局，會影響感情走向。`;
    sections.push({h:'◎ 21-30歲的運勢', b:ageText});
  }

  // ===== 局 4 事業格 =====
  else if (idx === 4) {
    const workKinds = ['shuai','che','ma','pao'];
    const workSupports = [c, ...sameColor.map(s => s.piece)].filter(p => workKinds.includes(p.kind));
    let workText;
    if (workSupports.length > 0) workText = `具備行動特質的棋：${workSupports.map(p => p.name).join('、')} → 做事能力強、行動力夠。`;
    else workText = '中央和同色棋偏文（士/相/兵）→ 做事偏穩重而非衝勁型，靠思考與規劃取勝。';
    sections.push({h:'◎ 做事的能力', b:workText});

    let effText = `淨 ${scoreInfo.net>=0?'+':''}${scoreInfo.net}分 → `;
    if (scoreInfo.net > 5) effText += '事業有成、付出能換得明顯回報。';
    else if (scoreInfo.net > 0) effText += '基本能賺，但要付出對等的努力。';
    else if (scoreInfo.net === 0) effText += '收支平衡，事業需要找到突破點。';
    else effText += '付出多於收穫，要小心做白工或被消耗。';
    sections.push({h:'◎ 做事的效率', b:effText});

    let moneyText;
    if (crossUp.length > 0 && (c.kind === 'che' || c.kind === 'pao')) {
      moneyText = `中央 ${c.name} 可過局往上吃 ${crossUp.map(e => e.piece.name).join('、')} → 有跨局財富延伸的機會，事業可以拉動更早期累積的資源。`;
    } else if (crossUp.length > 0) {
      moneyText = `可過局往上吃但中央非俥車炮包 → 跨局財富影響有限。`;
    } else {
      moneyText = '無法過局往上吃 → 賺錢偏靠現局，需要紮實做事不能靠投機。';
    }
    sections.push({h:'◎ 賺錢的運', b:moneyText});

    let ageText = `31-40 歲是事業衝刺期，本局中央 ${c.name} 主導這十年的職場模式。`;
    if (patterns.length > 0) ageText += ` 含 ${patterns.map(p => p.name).join('、')} 等格局，會影響事業走向。`;
    sections.push({h:'◎ 31-40歲的運勢', b:ageText});
  }

  // ===== 局 5-8：41-80 歲 =====
  else {
    let traitText = `中央是 <b>${c.name}</b>（${personaOf(c.kind)}）。`;
    if (sameColor.length > 0) traitText += `同色帶有 ${sameColor.map(s => s.piece.name).join('、')} 的特質。`;
    else traitText += '沒有同色棋輔助。';
    sections.push({h:`◎ ${layer.range}的特質`, b:traitText});

    const interactions = [];
    if (centerEats.length > 0) interactions.push(`中央可吃 ${centerEats.map(e => `${POS_LABEL[e.pos]} ${e.piece.name}`).join('、')} → 在這時期有掌握權與收穫機會。`);
    if (centerEaten.length > 0) interactions.push(`${centerEaten.map(e => `${POS_LABEL[e.pos]} ${e.piece.name}`).join('、')} 可吃中央 → 該位置代表的人事物會威脅或消耗卦主，要特別留意。`);
    if (interactions.length === 0) interactions.push('中央與外圍無直接吃法 → 該時期較平穩。');
    sections.push({h:`◎ ${layer.range}的互動`, b:interactions.join('<br>')});

    if (patterns.length > 0) sections.push({h:'◎ 該局格局', b:patterns.map(p => `<b>${p.name}</b>：${p.desc}`).join('<br>')});

    sections.push({h:'◎ 付出與收穫',
      b:`收穫 +${scoreInfo.centerGain}／付出 -${scoreInfo.centerLoss}／淨 ${scoreInfo.net>=0?'+':''}${scoreInfo.net}分。${scoreInfo.note ? '（' + scoreInfo.note + '）' : ''}`});

    if (crossUp.length > 0) {
      sections.push({h:'◎ 過局往上吃（補運）', b:`中央可往上一局吃 ${crossUp.map(e => `${POS_LABEL[e.pos]||''}${e.piece.name}`).join('、')} → 有跨局延伸的機會。`});
    }

    let healthText = '';
    if (fiveInfo.issues.length > 0) healthText = fiveInfo.issues.map(i => i.text).join('；');
    if (centerEaten.length > 0) {
      const causeMap = {shi:'呼吸/肺/大腸', xiang:'心血管', ma:'意外/筋骨', pao:'腎/泌尿/婦科', bing:'脾胃/消化/免疫', che:'肝膽/筋目/免疫', shuai:'整體大關卡'};
      healthText += (healthText ? '；' : '') + `中央被吃 → 注意 ${causeMap[c.kind] || '對應器官'}。`;
    }
    if (!healthText) healthText = '中央有保護或可反吃 → 健康無立即威脅。';
    sections.push({h:'◎ 健康', b:healthText});
  }

  let html = `<div class="narrative-section">`;
  for (const s of sections) {
    html += `<div class="nh">${s.h}</div><div class="nb">${s.b}</div>`;
  }
  html += `</div>`;
  return html;
}

/* ===== 命格選單分析總表（書版命格選單對照，學習自命格選單.zip 16 頁） ===== */
// 為每一局建立 minge context（給命格選單條目判定用）
function buildMingeContext(lb, patterns, scoreInfo, fiveInfo) {
  const c = lb.center;
  if (!c) return null;
  const sameColor = ['left','right','top','bottom']
    .filter(p => lb[p] && lb[p].color === c.color)
    .map(p => ({pos:p, piece:lb[p]}));
  const sameKinds = sameColor.map(s => s.piece.kind);
  const has = (k) => sameKinds.includes(k);
  // 同字消耗：同色（含中央）此 kind 共 ≥ 2 隻
  const consume = (k) => {
    let n = sameColor.filter(s => s.piece.kind === k).length;
    if (c.kind === k) n += 1;
    return n >= 2;
  };
  // 攻擊者：可吃中央且無保護
  const attackers = [];
  for (const p of ['left','right','top','bottom']) {
    if (lb[p] && lb[p].color !== c.color && canEat(lb, p, 'center') && !isProtected(lb, 'center', p)) {
      attackers.push({pos:p, piece:lb[p]});
    }
  }
  const attackerKinds = attackers.map(a => a.piece.kind);
  // 中央能吃哪些
  const centerEats = [];
  for (const p of ['left','right','top','bottom']) {
    if (lb[p] && lb[p].color !== c.color && canEat(lb, 'center', p)) {
      centerEats.push({pos:p, piece:lb[p]});
    }
  }
  // 上左右下哪些位置會吃我們同色
  const posWeakerThanThem = (positions, kinds) => {
    return positions.some(p => {
      if (!lb[p] || lb[p].color === c.color) return false;
      if (!kinds.includes(lb[p].kind)) return false;
      return canEat(lb, p, 'center');
    });
  };
  // 哪些位置付出大於收穫（簡化：該位置同色且被中央吃 = 為我付出；異色且能吃中央 = 我為它付出）
  const posCostsMore = (p) => {
    if (!lb[p]) return false;
    // 該位置異色且能吃中央 → 為它付出
    if (lb[p].color !== c.color && canEat(lb, p, 'center')) return true;
    return false;
  };
  // 該位置棋種對中央造成威脅
  const posThreatBy = (p, kinds) => {
    if (!lb[p] || lb[p].color === c.color) return false;
    if (!kinds.includes(lb[p].kind)) return false;
    return canEat(lb, p, 'center') || canEat(lb, 'center', p);
  };
  // 圖案匹配
  const has_pattern = (...names) => patterns.some(p => p.name && names.some(n => p.name.includes(n)));
  // 顏色統計
  const colorCount = {red:0, black:0};
  for (const p of ['left','right','top','bottom','center']) if (lb[p]) colorCount[lb[p].color]++;
  // 天人地缺
  const heavenKinds = ['shuai','shi','xiang'];
  const manKinds = ['che','ma','pao'];
  const earthKinds = ['bing'];
  const hasHeaven = heavenKinds.includes(c.kind) || sameKinds.some(k => heavenKinds.includes(k));
  const hasMan    = manKinds.includes(c.kind)    || sameKinds.some(k => manKinds.includes(k));
  const hasEarth  = c.kind === 'bing'             || has('bing');

  return {
    lb, c, sameColor, sameKinds, has, consume, attackers, attackerKinds, centerEats,
    posWeakerThanThem, posCostsMore, posThreatBy,
    has_pattern, patterns, scoreInfo, fiveInfo, colorCount,
    hasHeaven, hasMan, hasEarth,
  };
}

// 命格選單條目資料（書版命格選單.zip 學習提煉）
// 每筆：{text:描述, src:觸發條件文字, cond:(ctx)=>bool}
const MINGE_TOTAL_TRAIT = [
  {text:'能力好，但人生容易經驗：很想有所突破與擴展，但無法如願得到所期待的突破與擴展的劇情。', src:'傌/馬/炮/包在中間', cond:c=>['ma','pao'].includes(c.c.kind)},
  {text:'人生容易經驗：犯小人、卡到陰、做錯決定而損失或少賺可以賺到的錢的劇情。', src:'被傌/馬/炮/包吃', cond:c=>c.attackerKinds.some(k=>['ma','pao'].includes(k))},
  {text:'內在常會有恐懼和擔憂的感覺。', src:'中間的炮/包受威脅', cond:c=>c.c.kind==='pao' && c.attackers.length>0},
  {text:'人生容易經驗：內在常有恐懼擔憂，想改變，但不知道如何有效改變與突破的劇情。', src:'自己的炮/包消耗', cond:c=>c.consume('pao')},
  {text:'人生容易會有：意念靜不下來、方向不定、心太軟的困擾。', src:'自己的傌/馬消耗', cond:c=>c.consume('ma')},
  {text:'人生容易經驗：會因為想太多、障礙行動、錯失機會、錢容易流失的劇情。', src:'自己的兵/卒消耗', cond:c=>c.consume('bing')},
  {text:'個性上容易會有：許多主觀的做人做事道理，容易管太多、較衝動的狀態。', src:'自己的俥/車消耗', cond:c=>c.consume('che')},
  {text:'個性上容易會有：情緒起伏大的困擾。', src:'自己的相/象消耗', cond:c=>c.consume('xiang')},
  {text:'能力好，但個性上容易會有：許多自以為是的想法，常有活在過去的認知和憂慮未來的狀態。', src:'自己的仕/士消耗', cond:c=>c.consume('shi')},
  {text:'個性上容易會有：執著某些價值觀與想法的狀態。', src:'中間是將/帥/明君/士/車', cond:c=>['shuai','shi','che'].includes(c.c.kind)},
  {text:'人生容易經驗：會有偏執的想法、情緒起伏大、有時會有一些變數～而造成損失的劇情。', src:'自己中間或四周自己的帥/將暴動格', cond:c=>c.has_pattern('自己暴動','自己暴君')},
  {text:'人生容易經驗：會因為一些外在的變數，而造成損失的劇情。', src:'外在的帥/將暴動格', cond:c=>c.has_pattern('外在暴動','外在暴君')},
  {text:'人生容易經驗：常會有糾紛、名譽受損，甚至於官司的劇情。', src:'自己的仕/士被吃，被仕/士威脅', cond:c=>(c.c.kind==='shi' && c.attackers.length>0) || c.attackerKinds.includes('shi')},
  {text:'人生容易經驗：常會有車關的劇情。', src:'自己的俥/車被吃，被俥/車威脅', cond:c=>(c.c.kind==='che' && c.attackers.length>0) || c.attackerKinds.includes('che')},
];

const MINGE_TOTAL_PEOPLE = [
  {text:'與父母、長輩相處時～彼此都容易有暴動情緒、起伏大、管太多、想太多的困擾。', src:'上方暴動/相相消耗/俥俥消耗/兵兵消耗', cond:c=>(c.lb.top && (c.has_pattern('暴動') || c.consume('xiang') || c.consume('che') || c.consume('bing')))},
  {text:'與兄弟姐妹、夫妻、平輩在互動相處時，容易會有價值觀不同、緣分較淺的狀態。', src:'分離格在左右', cond:c=>c.patterns.some(p=>p.name==='分離格' && p.desc && /左|右/.test(p.desc))},
  {text:'與父母、長輩以及兒女、晚輩在互動相處時，容易會有價值觀不同、緣分較淺的狀態。', src:'分離格在上下', cond:c=>c.patterns.some(p=>p.name==='分離格' && p.desc && /上|下/.test(p.desc))},
  {text:'人生容易經驗：需為父母、長輩 → 勞心、付出多的劇情。', src:'與上的位置付出遠大於收穫', cond:c=>c.posCostsMore('top')},
  {text:'人生容易經驗：需為女性平輩、老婆 → 勞心、付出多的劇情。', src:'與左的位置付出遠大於收穫', cond:c=>c.posCostsMore('left')},
  {text:'人生容易經驗：需為男性平輩、老公 → 勞心、付出多的劇情。', src:'與右的位置付出遠大於收穫', cond:c=>c.posCostsMore('right')},
  {text:'人生容易經驗：需為兒女、晚輩 → 勞心、付出多的劇情。', src:'與下的位置付出遠大於收穫', cond:c=>c.posCostsMore('bottom')},
  {text:'與父母、長輩互動相處時，會有壓力大及他們對我意見多的劇情。', src:'上方帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('top',['shuai','shi','che'])},
  {text:'與女性平輩、老婆互動相處時，會有壓力大及她們對我意見多的劇情。', src:'左方帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('left',['shuai','shi','che'])},
  {text:'與男性平輩、老公互動相處時，會有壓力大及他們對我意見多的劇情。', src:'右方帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('right',['shuai','shi','che'])},
  {text:'與兒女、晚輩互動相處時，會有壓力大及他們對我意見多的劇情。', src:'下方帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('bottom',['shuai','shi','che'])},
];

const MINGE_TOTAL_OVERALL = [
  {text:'人生容易經驗：一開始不錯，但最後容易歸零、需要重來的劇情（收穫只有原本的 20%）。', src:'通吃格', cond:c=>c.has_pattern('通吃格') && !c.has_pattern('被通吃')},
  {text:'人生容易經驗：會因為某些外在的人、事、物、境而歸零，讓努力白費的劇情（收穫低於 20% 甚至負的）。', src:'被通吃格', cond:c=>c.has_pattern('被通吃')},
  {text:'人生不管做什麼，常會有結果與預期不同或落差大的狀況。', src:'全黑全紅格', cond:c=>c.has_pattern('悔恨')},
  {text:'人生容易經驗：意識顯化動能不足、情緒穩定度不高的劇情（收穫只有原本的 50%）。', src:'陰陽不協調', cond:c=>c.has_pattern('一枝獨秀','眾星拱月','鬱卒')},
  {text:'人生容易經驗：因某些人、事、物、境而造成困擾的劇情。', src:'困擾格', cond:c=>c.has_pattern('困擾')},
  {text:'人生容易經驗：夫妻感情困擾，甚至於離婚的劇情。', src:'離婚格（女）', cond:c=>c.has_pattern('離婚')},
  {text:'人生容易經驗：會有付出大於收穫的劇情。', src:'付出大於收穫', cond:c=>c.scoreInfo && c.scoreInfo.net < 0},
  {text:'人生容易經驗：總是在為別人付出的劇情。', src:'為兩個位置以上付出很多', cond:c=>['top','left','right','bottom'].filter(p=>c.posCostsMore(p)).length>=2},
  {text:'人生容易會有：天助比較少的狀態。', src:'總格缺天格', cond:c=>!c.hasHeaven},
  {text:'人生容易會有：人助比較少、人和比較弱、知心朋友較少的狀態。', src:'總格缺人格', cond:c=>!c.hasMan},
  {text:'人生容易經驗：缺乏踏實感、錢比較留不下來的劇情。', src:'總格缺地格', cond:c=>!c.hasEarth},
];

const MINGE_TOTAL_HEALTH = [
  {text:'頭部 / 身體左側 / 身體右側 / 下半身 氣血循環不好的劇情。', src:'暴動格', cond:c=>c.has_pattern('暴動','暴君')},
  {text:'氣血循環不好的劇情。', src:'陰陽不協調', cond:c=>c.has_pattern('一枝獨秀','眾星拱月','鬱卒')},
  {text:'支氣管、大腸的劇情。', src:'仕/士消耗或被吃', cond:c=>c.consume('shi') || c.attackerKinds.includes('shi')},
  {text:'心血管不好的劇情。', src:'相/象消耗或被吃', cond:c=>c.consume('xiang') || c.attackerKinds.includes('xiang')},
  {text:'肝膽、眼睛不好的劇情。', src:'俥/車消耗或被吃', cond:c=>c.consume('che') || c.attackerKinds.includes('che')},
  {text:'關節、筋絡不好的劇情。', src:'傌/馬消耗或被吃', cond:c=>c.consume('ma') || c.attackerKinds.includes('ma')},
  {text:'腎臟、婦科、攝護腺、骨頭、耳朵不好的劇情。', src:'炮/包消耗或被吃', cond:c=>c.consume('pao') || c.attackerKinds.includes('pao')},
  {text:'脾胃不好的劇情。', src:'兵/卒消耗或被吃', cond:c=>c.consume('bing') || c.attackerKinds.includes('bing')},
];

const MINGE_STUDY = [
  {text:'學習時：常會以執著的已知，來核對老師所說或書本所寫的，所以有時容易解讀錯誤而影響學習的成效。', src:'帥/將（明君）在中間', cond:c=>c.c.kind==='shuai'},
  {text:'學習時：會因偏執的認知或情緒起伏而障礙學習的成效。', src:'自己的暴動格', cond:c=>c.has_pattern('自己暴動','自己暴君')},
  {text:'喜歡學習，但學習時會有學以致用的障礙。', src:'傌/馬/炮/包在中間', cond:c=>['ma','pao'].includes(c.c.kind)},
  {text:'學習時：容易會因為某些外在因素而影響學習的成效。', src:'被傌/馬/炮/包吃到', cond:c=>c.attackerKinds.some(k=>['ma','pao'].includes(k))},
  {text:'學習時：會有學習的效率比較不好的困擾。', src:'付出大於收穫', cond:c=>c.scoreInfo && c.scoreInfo.net < 0},
  {text:'學習時：容易因為自以為是的想法而影響學習的成效。', src:'仕仕/士士消耗', cond:c=>c.consume('shi')},
  {text:'學習時：容易因為情緒起伏大、比較被動而影響學習的成效。', src:'相相/象象消耗', cond:c=>c.consume('xiang')},
  {text:'學習時：容易因為過於主觀與激進而影響學習的成效。', src:'俥俥/車車消耗', cond:c=>c.consume('che')},
  {text:'學習時：容易因為意念靜不下來、方向不定而影響學習的成效。', src:'傌傌/馬馬消耗', cond:c=>c.consume('ma')},
  {text:'學習時：容易因為怕學不好、不知如何有效學習而影響學習的成效。', src:'炮炮/包包消耗', cond:c=>c.consume('pao')},
  {text:'學習時：容易因為想太多、比較懶得學習而影響學習的成效。', src:'兵兵/卒卒消耗', cond:c=>c.consume('bing')},
  {text:'學習上：會有不容易學到適合自己的東西的困擾。', src:'分離格', cond:c=>c.has_pattern('分離')},
  {text:'學習時：容易經驗會有學習困擾的狀態。', src:'困擾格', cond:c=>c.has_pattern('困擾')},
  {text:'學習時：會經驗學到的東西，用了一段時間之後就不用、無法累積所學的劇情。', src:'通吃格', cond:c=>c.has_pattern('通吃格') && !c.has_pattern('被通吃')},
  {text:'學習時：容易會有因為某些外境或外在的人事物，而中斷學習，或所學被否定的狀況。', src:'被通吃格', cond:c=>c.has_pattern('被通吃')},
  {text:'學習時：會有意識顯化動能不足的狀態。', src:'陰陽不協調', cond:c=>c.has_pattern('一枝獨秀','眾星拱月','鬱卒')},
  {text:'學習時：會經驗所學的結果與預期不同的劇情。', src:'全黑全紅', cond:c=>c.has_pattern('悔恨')},
  {text:'學習時：會有學習壓力大的困擾。', src:'被帥/將/仕/士/俥/車威脅', cond:c=>c.attackerKinds.some(k=>['shuai','shi','che'].includes(k))},
];

const MINGE_EMOTION = [
  {text:'面對情感時：會因為有許多執著的認知與道理，想要掌控、會期待別人變成你想要的樣子。', src:'中間是帥/將（明君）', cond:c=>c.c.kind==='shuai'},
  {text:'面對情感時：會因為有許多偏執的認知、想要掌控、情緒不穩定且張力大。', src:'自己的帥/將暴動格', cond:c=>c.has_pattern('自己暴動','自己暴君')},
  {text:'面對情感時：會因為有許多做人做事的道理，會期待別人變成你想要的樣子。', src:'中間是士/車', cond:c=>['shi','che'].includes(c.c.kind)},
  {text:'面對情感時：會因為比較被動而影響情感的交流。', src:'中間是相/象', cond:c=>c.c.kind==='xiang'},
  {text:'對情感會有所期待，但無法如願得到所期待的情感關係。', src:'傌/馬/炮/包在中間', cond:c=>['ma','pao'].includes(c.c.kind)},
  {text:'面對情感時：容易會有犯小人而造成損失的困擾。', src:'被傌/馬/炮/包吃到', cond:c=>c.attackerKinds.some(k=>['ma','pao'].includes(k))},
  {text:'情感本應該是浪漫的，但面對情感時：卻少了對浪漫情感的期待。', src:'沒有同色的傌/馬/炮/包', cond:c=>!c.has('ma') && !c.has('pao') && !['ma','pao'].includes(c.c.kind)},
  {text:'面對情感時：容易因自己的自以為是～而影響情感的交流。', src:'自己的仕仕/士士消耗', cond:c=>c.consume('shi')},
  {text:'面對情感時：容易因情緒起伏大、比較被動～而影響情感的交流。', src:'自己的相相/象象消耗', cond:c=>c.consume('xiang')},
  {text:'面對情感時：容易因自己過於主觀、管太多～而影響情感的交流。', src:'自己的俥俥/車車消耗', cond:c=>c.consume('che')},
  {text:'面對情感時：會有意念靜不下來、優柔寡斷或不知如何有效地與對方相處的困擾。', src:'自己的傌傌/馬馬消耗', cond:c=>c.consume('ma')},
  {text:'面對情感時：容易會有擔憂、恐懼、害怕失去或不知如何與對方相處的困擾。', src:'自己的炮炮/包包消耗', cond:c=>c.consume('pao')},
  {text:'面對情感時：容易想很多，會有懶得與人互動、過於務實的狀態。', src:'自己的兵兵/卒卒消耗', cond:c=>c.consume('bing')},
  {text:'與人談感情的時候，容易經驗因某些人事物或考量而有困擾的劇情。', src:'困擾格', cond:c=>c.has_pattern('困擾')},
  {text:'面對情感時：與所談感情的對象 → 常會有價值觀不同、緣分較淺的困擾。', src:'分離格', cond:c=>c.has_pattern('分離')},
  {text:'面對情感時：會有因太認真，造成對方壓力大而影響情感交流的狀況。', src:'俥傌炮/車馬包混色事業格', cond:c=>c.has_pattern('事業格')},
  {text:'與人談感情時，容易經驗：一開始互動不錯，但最後就沒聯絡，人脈資源無法累積的劇情。', src:'通吃格', cond:c=>c.has_pattern('通吃格') && !c.has_pattern('被通吃')},
  {text:'與人談感情時，容易經驗：因某些外境或外在的人事物而失去已建立的情感關係的劇情。', src:'被通吃格', cond:c=>c.has_pattern('被通吃')},
  {text:'面對情感時：會有意識顯化動能不足、情緒穩定度不高的狀態。', src:'陰陽不協調', cond:c=>c.has_pattern('一枝獨秀','眾星拱月','鬱卒')},
  {text:'與人談感情時：常會出現所得到的情感關係與預期不同的狀態。', src:'全黑全紅', cond:c=>c.has_pattern('悔恨')},
  {text:'與人談感情時：會有付出大於收穫的狀態。', src:'付出大於收穫', cond:c=>c.scoreInfo && c.scoreInfo.net < 0},
];

const MINGE_CAREER = [
  {text:'在工作與經營事業時，容易經驗：很想有所突破與擴展，但比較無法如願得到所期待的突破與擴展的劇情。', src:'傌/馬/炮/包在中間', cond:c=>['ma','pao'].includes(c.c.kind)},
  {text:'在工作與經營事業時，容易經驗：犯小人、做錯決定而損失或錯失本來可以賺到的錢的劇情。', src:'被傌/馬/炮/包吃到', cond:c=>c.attackerKinds.some(k=>['ma','pao'].includes(k))},
  {text:'在工作與經營事業時，會有做事效率比較不好、容易付出大於收穫的狀態。', src:'事業格付出大於收穫', cond:c=>c.scoreInfo && c.scoreInfo.net < 0},
  {text:'做事的時候，容易因為自以為是的認知～而影響做事的效率與產值。', src:'自己的仕仕/士士消耗', cond:c=>c.consume('shi')},
  {text:'做事的時候，容易經驗因為情緒起伏大、比較被動，而影響做事的效率與產值的劇情。', src:'自己的相相/象象消耗', cond:c=>c.consume('xiang')},
  {text:'做事的時候，容易經驗因為過於主觀、太激進、管太多，而影響做事效率與產值的劇情。', src:'自己的俥俥/車車消耗', cond:c=>c.consume('che')},
  {text:'做事的時候，容易經驗因為意念靜不下來、方向不定、心太軟，而影響做事效率與產值的劇情。', src:'自己的傌傌/馬馬消耗', cond:c=>c.consume('ma')},
  {text:'做事的時候，容易因為恐懼擔憂、想要突破卻不知如何突破，而影響做事的效率與產值。', src:'自己的炮炮/包包消耗', cond:c=>c.consume('pao')},
  {text:'做事的時候，容易因為想太多、行動力較弱，而影響做事的效率與產值。', src:'自己的兵兵/卒卒消耗', cond:c=>c.consume('bing')},
  {text:'工作與事業上，容易經驗：常有糾紛、名聲受損，甚至官司的劇情。', src:'我們的仕/士被吃，仕/士吃到我們', cond:c=>(c.c.kind==='shi' && c.attackers.length>0) || c.attackerKinds.includes('shi')},
  {text:'做事的時候，容易會出現與自己的價值觀或想要的不同的困擾。', src:'分離格', cond:c=>c.has_pattern('分離')},
  {text:'做事的時候，容易因為某些因素或想法而造成工作上的困擾。', src:'困擾格', cond:c=>c.has_pattern('困擾')},
  {text:'做事的時候，容易經驗：因為自己的偏執認知、情緒起伏大、常有變數～而造成損失的劇情。', src:'自己的暴動格', cond:c=>c.has_pattern('自己暴動','自己暴君')},
  {text:'工作與事業上，容易經驗：因外在的變數～而造成損失的劇情。', src:'外在的暴動格', cond:c=>c.has_pattern('外在暴動','外在暴君')},
  {text:'工作與事業上，容易經驗：一開始不錯，但最後容易歸零、得要重來的劇情。', src:'通吃格', cond:c=>c.has_pattern('通吃格') && !c.has_pattern('被通吃')},
  {text:'做事的時候，容易經驗：因某些外境或外在的人事物而歸零的劇情。', src:'被通吃格', cond:c=>c.has_pattern('被通吃')},
  {text:'做事的時候，容易經驗：意識顯化動能不足、情緒穩定度不高的劇情。', src:'陰陽不協調', cond:c=>c.has_pattern('一枝獨秀','眾星拱月','鬱卒')},
  {text:'做事的時候，容易經驗：結果與預期不同的劇情。', src:'全黑全紅格', cond:c=>c.has_pattern('悔恨')},
];

// 運勢用條目（每條對所有 layers 2-8 跑判定，列出觸發的十年區間）
const MINGE_DESTINY = [
  {text:'容易經驗：很想有所突破與擴展，但無法如願得到所期待的突破與擴展的劇情', src:'傌/馬/炮/包在中間', cond:c=>['ma','pao'].includes(c.c.kind)},
  {text:'容易經驗：犯小人、卡到陰（無形的干擾）、做錯決定而損失或錯失本來可以賺到的錢的劇情', src:'被傌/馬/炮/包吃到', cond:c=>c.attackerKinds.some(k=>['ma','pao'].includes(k))},
  {text:'容易經驗：有糾紛、名譽受損，甚至於官司的劇情', src:'自己當局或過局的仕/士被吃，被仕/士威脅', cond:c=>(c.c.kind==='shi' && c.attackers.length>0) || c.attackerKinds.includes('shi')},
  {text:'容易經驗：因為自己有自以為是的認知，而障礙運勢的劇情', src:'自己的仕仕/士士消耗', cond:c=>c.consume('shi')},
  {text:'容易經驗：因為自己情緒起伏大、比較被動而障礙運勢的劇情', src:'自己的相相/象象消耗', cond:c=>c.consume('xiang')},
  {text:'容易經驗：因為自己過於主觀、太激進、管太多而障礙運勢的劇情', src:'自己的俥俥/車車消耗', cond:c=>c.consume('che')},
  {text:'容易經驗：因為自己意念靜不下來、方向不定而障礙運勢的劇情', src:'自己的傌傌/馬馬消耗', cond:c=>c.consume('ma')},
  {text:'容易經驗：因為自己恐懼、擔憂、想要突破不知如何突破的劇情', src:'自己的炮炮/包包消耗', cond:c=>c.consume('pao')},
  {text:'容易經驗：內在常會有恐懼與擔憂的感覺', src:'中間的炮/包受威脅', cond:c=>c.c.kind==='pao' && c.attackers.length>0},
  {text:'容易經驗：因為自己想太多、行動力弱、錢容易流失的劇情', src:'自己的兵兵/卒卒消耗', cond:c=>c.consume('bing')},
  {text:'容易經驗：有意外事故的劇情', src:'中間的傌/馬被威脅', cond:c=>c.c.kind==='ma' && c.attackers.length>0},
  {text:'容易經驗：有車關的劇情', src:'中間的棋子被車/俥威脅', cond:c=>c.attackerKinds.includes('che')},
  {text:'容易經驗：有血光之災的劇情', src:'中間的棋子被仕/士威脅', cond:c=>c.attackerKinds.includes('shi')},
  {text:'容易經驗：會為父母、長輩、上司勞心、付出多或因他們而有所損失的劇情', src:'與上的位置付出遠大於收穫', cond:c=>c.posCostsMore('top')},
  {text:'容易經驗：會為平輩女性付出多或因他們而有所損失的劇情', src:'與左的位置付出遠大於收穫（男已婚=老婆）', cond:c=>c.posCostsMore('left')},
  {text:'容易經驗：會為平輩男性付出多或因他們而有所損失的劇情', src:'與右的位置付出遠大於收穫（女已婚=老公）', cond:c=>c.posCostsMore('right')},
  {text:'容易經驗：會為晚輩付出多或因他們而有所損失的劇情', src:'與下的位置付出遠大於收穫', cond:c=>c.posCostsMore('bottom')},
  {text:'容易經驗：與父母、長輩、上司相處時，他們會對我很有意見的劇情', src:'上面的帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('top',['shuai','shi','che'])},
  {text:'容易經驗：與平輩女性相處時，她們會對我很有意見的劇情', src:'左邊的帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('left',['shuai','shi','che'])},
  {text:'容易經驗：與男性平輩相處時，他們會對我很有意見的劇情', src:'右邊的帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('right',['shuai','shi','che'])},
  {text:'容易經驗：與晚輩相處時，他們會對我很有意見的劇情', src:'下面的帥/將/仕/士/俥/車會威脅我們', cond:c=>c.posThreatBy('bottom',['shuai','shi','che'])},
  {text:'容易經驗：常會因為某些因素、想法而造成困擾的劇情', src:'困擾格', cond:c=>c.has_pattern('困擾')},
  {text:'容易經驗：因自己偏執的認知與變數，而造成損失的劇情', src:'自己暴動格', cond:c=>c.has_pattern('自己暴動','自己暴君')},
  {text:'容易經驗：因外在的變數，而造成損失的劇情', src:'外在的暴動格', cond:c=>c.has_pattern('外在暴動','外在暴君')},
  {text:'容易經驗：一開始不錯，但最後容易歸零、得要重來的劇情', src:'通吃格', cond:c=>c.has_pattern('通吃格') && !c.has_pattern('被通吃')},
  {text:'容易經驗：因為某些外境或外在的人事物而歸零的劇情', src:'被通吃格', cond:c=>c.has_pattern('被通吃')},
  {text:'容易經驗：與父母兒女、長輩晚輩、上司下屬之間，有價值觀不同或緣分較淺、聚少離多的劇情', src:'上下分離格', cond:c=>c.patterns.some(p=>p.name==='分離格' && p.desc && /上|下/.test(p.desc))},
  {text:'容易經驗：與兄弟姊妹、夫妻、平輩之間，有價值觀不同或緣分較淺、聚少離多的劇情', src:'左右分離格', cond:c=>c.patterns.some(p=>p.name==='分離格' && p.desc && /左|右/.test(p.desc))},
  {text:'容易經驗：意識顯化動能不足、情緒起伏大的劇情', src:'陰陽不協調', cond:c=>c.has_pattern('一枝獨秀','眾星拱月','鬱卒')},
  {text:'容易經驗：事與願違，所得到的結果與預期不同的劇情', src:'全黑全紅', cond:c=>c.has_pattern('悔恨')},
  // ▼ 生死關（書本第 8 章 P31-P32 完整 5 觸發層）— 涵蓋 A 一般 / B 50後 / C 70後 / D 81後 / E 陰陽異常
  {text:'容易經驗：可能有生死關的劇情（A 一般原則：中央無法反吃外圍且無保護被吃）',
    src:'生死關 A 一般原則：中央無路+無保護+至少一支可吃中央',
    cond:c=>c.patterns.some(p=>p.name==='生死關' && p.triggers && p.triggers.includes('A'))},
  {text:'容易經驗：50 歲後可能有生死關的劇情（別色將/帥暴動可吃我們，人生不順時更明顯）',
    src:'生死關 B 50歲後特例：別色將/帥可吃中央 + 同盤暴動格',
    cond:c=>c.patterns.some(p=>p.name==='生死關' && p.triggers && p.triggers.includes('B'))},
  {text:'容易經驗：70 歲後可能有生死關的劇情（壽魂想離開的可能）',
    src:'生死關 C 70歲後特例：分離格 → 壽魂想離開',
    cond:c=>c.patterns.some(p=>p.name==='生死關' && p.triggers && p.triggers.includes('C'))},
  {text:'容易經驗：81 歲後可能有生死關的劇情（不論有無保護，只要中央可被吃即算）',
    src:'生死關 D 81歲後特殊判定：不論保護能被吃即算',
    cond:c=>c.patterns.some(p=>p.name==='生死關' && p.triggers && p.triggers.includes('D'))},
  {text:'容易經驗：81 歲後好朋友格被吃的劇情（生死關可能性大）',
    src:'生死關 D 衍生：81歲後+好朋友格被吃',
    cond:c=>c.patterns.some(p=>p.name==='生死關' && p.triggers && p.triggers.includes('D-friend'))},
  {text:'容易經驗：81 歲後悔恨格構成生死關的劇情',
    src:'生死關 D 衍生：81歲後+悔恨格也有機率構成',
    cond:c=>c.patterns.some(p=>p.name==='生死關' && p.triggers && p.triggers.includes('D-regret'))},
  {text:'容易經驗：陰陽不協調、悔恨格、兵卒/包炮消耗+包炮飛出去動能不足 → 有生死關「可能性」（建議做療癒淨化）',
    src:'生死關 E 陰陽異常：陰陽不協調/消耗 + 中央動能不足 → 可能性',
    cond:c=>c.patterns.some(p=>p.triggers && p.triggers.includes('E'))},
  {text:'生死關當局有避過可能性：30 歲前生死關+總格有象/相 → 因天助而避過',
    src:'生死關 H1 避過：30歲前+總格象相天助',
    cond:c=>c.patterns.some(p=>p.escapes && p.escapes.includes('H1'))},
  {text:'生死關當局有避過可能性：總格自己的包/炮/馬/傌可吃別人 → 因神明力量避過（仍建議清理）',
    src:'生死關 H2 避過：總格自己包炮馬傌可吃別人',
    cond:c=>c.patterns.some(p=>p.escapes && p.escapes.includes('H2'))},
  {text:'生死關當局有避過可能性：總格自己的棋可吃不同色象/相 → 因累世修行避過（仍建議清理）',
    src:'生死關 H3 避過：總格自己可吃不同色象相',
    cond:c=>c.patterns.some(p=>p.escapes && p.escapes.includes('H3'))},
  {text:'生死關當局有避過可能性：當局為雨傘格、十字天助格、或中央為象/相 → 有機會避過（仍建議清理）',
    src:'生死關 H4 避過：當局雨傘/十字天助/中央象相',
    cond:c=>c.patterns.some(p=>p.escapes && p.escapes.includes('H4'))},
];

// 渲染命格選單分析總表
function buildMingeTable(layerData) {
  // layerData = {layers: [{idx, lb, patterns, scoreInfo, fiveInfo, ageStart, ageEnd}, ...]}
  // 建立各局 minge context
  const ctxByIdx = {};
  for (const ld of layerData.layers) {
    ctxByIdx[ld.idx] = buildMingeContext(ld.lb, ld.patterns, ld.scoreInfo, ld.fiveInfo);
  }
  const totalCtx  = ctxByIdx[1];
  const studyCtx  = ctxByIdx[2];
  const emotionCtx= ctxByIdx[3];
  const careerCtx = ctxByIdx[4];

  let html = `<div class="layer-card minge-table">`;
  html += `<div class="layer-title">📋 命格選單分析總表（書版命格選單對照）</div>`;
  html += `<div class="item info">系統依書版命格選單自動勾選命主可能經驗的劇情。只列出已觸發項目；未列出 = 該劇情在此命盤不易呈現。</div>`;

  const renderCheckedList = (items, ctx) => {
    if (!ctx) return `<div class="minge-empty">該局尚未排盤</div>`;
    const triggered = items.filter(it => { try { return it.cond(ctx); } catch(e){ return false; } });
    if (triggered.length === 0) return `<div class="minge-empty">此區無已觸發項目（此命盤該主題狀態相對平穩）</div>`;
    return triggered.map(it =>
      `<div class="minge-yes">✓ ${it.text}<br><span class="minge-src">（觸發條件：${it.src}）</span></div>`
    ).join('');
  };

  // 1. 總格
  html += `<div class="minge-cat">1️⃣ 總格 — 一輩子整體呈現的狀態（1-10 歲 / 81-90 歲）</div>`;
  html += `<div class="minge-subcat">【自己的個性與特質容易呈現的狀態】</div>`;
  html += renderCheckedList(MINGE_TOTAL_TRAIT, totalCtx);
  html += `<div class="minge-subcat">【與身邊的人相處互動時容易呈現的狀態】</div>`;
  html += renderCheckedList(MINGE_TOTAL_PEOPLE, totalCtx);
  html += `<div class="minge-subcat">【整體人生容易呈現的狀態】</div>`;
  html += renderCheckedList(MINGE_TOTAL_OVERALL, totalCtx);
  html += `<div class="minge-subcat">【健康上容易呈現的困擾】</div>`;
  html += renderCheckedList(MINGE_TOTAL_HEALTH, totalCtx);

  // 2. 學習格
  html += `<div class="minge-cat">2️⃣ 學習格 — 一輩子學習狀態（11-20 歲）</div>`;
  html += renderCheckedList(MINGE_STUDY, studyCtx);

  // 3. 情感格
  html += `<div class="minge-cat">3️⃣ 情感格 — 一輩子深交（搏感情）狀態（21-30 歲）</div>`;
  html += renderCheckedList(MINGE_EMOTION, emotionCtx);

  // 4. 事業格
  html += `<div class="minge-cat">4️⃣ 事業格 — 一輩子工作經營事業的狀態（31-40 歲）</div>`;
  html += renderCheckedList(MINGE_CAREER, careerCtx);

  // 5. 運勢（每十年運勢，每條目跑 layers 2-8）
  html += `<div class="minge-cat">5️⃣ 運勢 — 各十年運勢容易經驗的劇情</div>`;
  html += `<div class="item info">每條後標示在哪個十年區間觸發；未標示=該劇情在所有十年皆未觸發。</div>`;
  for (const item of MINGE_DESTINY) {
    const ages = [];
    for (let idx = 2; idx <= 8; idx++) {
      const ctx = ctxByIdx[idx];
      if (!ctx) continue;
      try {
        if (item.cond(ctx)) {
          const ld = layerData.layers.find(l => l.idx === idx);
          ages.push(`${ld.ageStart}-${ld.ageEnd}`);
        }
      } catch(e) {}
    }
    if (ages.length > 0) {
      html += `<div class="minge-destiny-row">
        <div>✓ ${item.text}<br><span class="minge-src">（觸發條件：${item.src}）</span></div>
        <div class="minge-ages">${ages.join('｜')} 歲</div>
      </div>`;
    }
  }

  html += `</div>`;
  return html;
}

/* ===== 生死關警示專區（書版 P31-P32 + IMG_0819 學習） =====
   整合命盤各十年運局（2-8 局）的生死關判定，明確列出：
   - 觸發年紀區間（例如 41-50 歲）
   - 觸發類型（A 一般／B 50後／C 70後／D 81後／E 陰陽異常）+ 完整原因
   - 死因器官（被吃中央棋對應）+ 死因方式（被誰吃對應）
   - 避過條件（H1/H2/H3/H4）+ 機率說明
   書版範圍硬擋：總格（1-10／81-90 歲）一律不判生死關。
   未觸發 → 顯示「✓ 各十年運局未觸發生死關」綠色提示。
*/
function buildDeathPassWarning(allLayersData) {
  const TRIGGER_LABEL = {
    'A': 'A 一般原則',
    'B': 'B 50 歲後特例',
    'C': 'C 70 歲後特例',
    'D': 'D 81 歲後特殊判定',
    'D-friend': 'D 衍生（81 歲後好朋友格被吃）',
    'D-regret': 'D 衍生（81 歲後悔恨格構成）',
    'E': 'E 陰陽異常（可能性）'
  };
  const TRIGGER_DETAIL = {
    'A': '中央無法反吃外圍 + 至少一支可吃中央且無保護',
    'B': '別色將/帥可吃中央 + 同盤有暴動格',
    'C': '同盤出現分離格 → 壽魂想離開的可能',
    'D': '不論保護，只要中央可被吃即算（中央能反吃 → 不算）',
    'D-friend': '當局是好朋友格 + 中央可被吃 → 機率大',
    'D-regret': '當局是悔恨格 + 中央可被吃 → 有機率',
    'E': '陰陽不協調/悔恨/兵卒消耗/包炮消耗 + 動能不足'
  };
  const ESCAPE_LABEL = {
    'H1': 'H1：30 歲前 + 總格有象/相 → 天助避過',
    'H2': 'H2：總格自己包/炮/馬/傌 可吃別人 → 神明力量避過',
    'H3': 'H3：總格自己棋可吃不同色象/相 → 累世修行避過',
    'H4': 'H4：當局有雨傘格 / 十字天助格 / 中央為象/相 → 有機會避過'
  };

  // 收集所有生死關觸發
  const triggered = [];
  for (const ld of allLayersData) {
    const dpItems = ld.patterns.filter(p => p.name === '生死關' || p.name === '生死關（可能性）');
    for (const pt of dpItems) {
      triggered.push({
        idx: ld.idx,
        ageStart: ld.ageStart,
        ageEnd: ld.ageEnd,
        layerName: NATAL_LAYERS.find(l => l.idx === ld.idx)?.name || `第${ld.idx}局`,
        center: ld.lb.center,
        pattern: pt
      });
    }
  }

  let html = `<div class="layer-card death-pass-warning">`;
  html += `<div class="dp-title">⚠️ 生死關警示專區（書版 P31-P32 ｜ IMG_0819）</div>`;
  html += `<div class="dp-summary">書版規定生死關判定僅限<b>命盤十年運（11-80 歲，第 2-8 局）</b>，總格（1-10／81-90 歲）一律不判。<br>` +
          `<span class="dp-sub">死因器官：仕→呼吸/肺/大腸；相→心血管；馬→意外；炮→腎/婦科；兵→脾胃/免疫；俥→肝膽/行車。死因方式：被將/帥→意外；被士仕→刀關；被車相→心血管；被卒兵→脾胃免疫。</span></div>`;

  if (triggered.length === 0) {
    html += `<div class="dp-none">✓ 命盤各十年運局（11-80 歲）<b>未觸發生死關</b>。<br>` +
            `<span style="color:#666;font-size:12px;">系統依書版 P31-P32 完整 5 觸發層（A/B/C/D/E）逐局比對皆未滿足；總格依書版範圍硬擋不判。</span></div>`;
    html += `</div>`;
    return html;
  }

  // 摘要
  const ageList = triggered.map(t => `${t.ageStart}-${t.ageEnd}歲（${t.layerName}）`).join('、');
  html += `<div class="dp-summary" style="background:#fef0eb;border-left-color:#c0392b;">` +
          `命盤共 <b style="color:#c0392b;font-size:15px;">${triggered.length}</b> 個年紀區間觸發生死關：${ageList}。<br>` +
          `<span class="dp-sub">書版說「卦象只是讓我們看到我們意識資料庫裡有這樣的資料」 — 觸發不等於必然發生，必須做療癒淨化＋資料清理。</span></div>`;

  // 每個觸發區間獨立卡片
  for (const t of triggered) {
    const isPossibility = t.pattern.name === '生死關（可能性）';
    const triggers = t.pattern.triggers || [];
    const escapes = t.pattern.escapes || [];

    html += `<div class="dp-card${isPossibility ? ' dp-possible' : ''}">`;
    html += `<div class="dp-age">${isPossibility ? '🟡' : '⚠️'} ${t.ageStart}-${t.ageEnd} 歲（第 ${t.idx} 局・${t.layerName}）${isPossibility ? '【可能性】' : ''}</div>`;

    // 中央棋資訊
    if (t.center) {
      html += `<div class="dp-section"><b>中央：</b>${t.center.name}（${t.center.color === 'red' ? '紅' : '黑'}方）</div>`;
    }

    // 觸發原因（A/B/C/D/E + 細節）
    if (triggers.length > 0) {
      html += `<div class="dp-section"><b>觸發原因：</b></div>`;
      for (const code of triggers) {
        const label = TRIGGER_LABEL[code] || code;
        const detail = TRIGGER_DETAIL[code] || '';
        html += `<div class="dp-trigger-line">▸ <b>${label}</b>${detail ? '：' + detail : ''}</div>`;
      }
    }

    // 死因（從 desc 抽取或自行計算）
    if (t.center && !isPossibility) {
      const deathCauseByVictim = {
        shi:'呼吸系統、肺或大腸',
        xiang:'心血管疾病',
        ma:'意外',
        pao:'腎臟或婦科',
        bing:'脾胃、消化系統、免疫系統',
        shuai:'重大關卡',
        che:'肝膽、行車相關'
      };
      const cause = deathCauseByVictim[t.center.kind] || '對應器官系統';
      html += `<div class="dp-section dp-cause">💊 <b>死因器官對應：</b>中央 ${t.center.name} → ${cause}</div>`;
    }

    // 避過條件（H1-H4）
    if (escapes.length > 0) {
      html += `<div class="dp-section"><b>✦ 避過可能性（H 條件，命中越多風險越低）：</b></div>`;
      for (const code of escapes) {
        const label = ESCAPE_LABEL[code] || code;
        html += `<div class="dp-escape">▸ ${label}</div>`;
      }
    } else {
      html += `<div class="dp-noescape">⚠ 此局無避過條件加持（H1-H4 皆未滿足），務必嚴肅看待，建議盡快做完整療癒淨化。</div>`;
    }

    html += `</div>`;
  }

  // 統一行動指引
  html += `<div class="dp-cta">📿 <b>建議行動：</b>下方「顯化淨化建議」區塊已自動依命盤觸發劇情產出對應的療癒淨化操作步驟（咒輪紙文字＋下定義＋交託＋噴瓶念誦＋火化）。書版強調：清理意識資料庫的劇情就有機會改寫人生軌跡。</div>`;
  html += `</div>`;
  return html;
}

/* ===== 顯化淨化建議（書本第 10 章 P22-P29 + 療癒淨化與顯化資料夾 8 張範本學習） =====
   依命盤觸發劇情自動產出：
   1. 咒輪紙內容（多張，依主題分類：總格/學習/情感/事業/運勢逐十年）
   2. 完整療癒淨化操作步驟（5 步：寫咒輪紙→下定義→做交託→噴瓶+念誦+迴向→火化）
   3. 顯化操作步驟（5 步：寫咒輪紙→下定義→做交託→噴瓶顯化念誦→火化）
   4. 陰陽協調建議（依總格顏色判讀）
   5. 注意事項與效果評估
*/
function buildPurificationGuide(layerData, querentName) {
  const ctxByIdx = {};
  for (const ld of layerData.layers) {
    ctxByIdx[ld.idx] = buildMingeContext(ld.lb, ld.patterns, ld.scoreInfo, ld.fiveInfo);
  }
  const totalCtx = ctxByIdx[1];
  if (!totalCtx) return '';

  const NAME = querentName || '○○○';
  const isSingle = !!layerData.isSingle;

  // 收集已觸發的劇情，依主題分類
  // 單卦模式：使用通用條目（總格特質/整體/健康 + 學習/情感/事業/運勢條目作為「個人狀態」共池）
  //          因為單卦反映當下狀態，所以四大主題的條目都可能適用
  const triggered = {
    'total-trait':   MINGE_TOTAL_TRAIT.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} }),
    'total-people':  MINGE_TOTAL_PEOPLE.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} }),
    'total-overall': MINGE_TOTAL_OVERALL.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} }),
    'total-health':  MINGE_TOTAL_HEALTH.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} }),
    'study':   isSingle ? MINGE_STUDY.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} })
                        : (ctxByIdx[2] ? MINGE_STUDY.filter(it => { try { return it.cond(ctxByIdx[2]); } catch(e){return false;} }) : []),
    'emotion': isSingle ? MINGE_EMOTION.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} })
                        : (ctxByIdx[3] ? MINGE_EMOTION.filter(it => { try { return it.cond(ctxByIdx[3]); } catch(e){return false;} }) : []),
    'career':  isSingle ? MINGE_CAREER.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} })
                        : (ctxByIdx[4] ? MINGE_CAREER.filter(it => { try { return it.cond(ctxByIdx[4]); } catch(e){return false;} }) : []),
  };
  // 運勢逐十年（命盤專用）— 單卦模式不跑
  const destinyByLayer = {};
  if (!isSingle) {
    for (let idx = 2; idx <= 8; idx++) {
      const ctx = ctxByIdx[idx];
      if (!ctx) continue;
      destinyByLayer[idx] = MINGE_DESTINY.filter(it => { try { return it.cond(ctx); } catch(e){return false;} });
    }
  }
  // 單卦模式 → 把 destiny 條目當「事件相關劇情」一起跑（事件單卦會經驗的）
  const singleDestinyTriggered = isSingle
    ? MINGE_DESTINY.filter(it => { try { return it.cond(totalCtx); } catch(e){return false;} })
    : [];

  // 統計
  const totalCount = Object.values(triggered).reduce((a,b)=>a+b.length, 0)
                    + Object.values(destinyByLayer).reduce((a,b)=>a+b.length, 0)
                    + singleDestinyTriggered.length;

  // 陰陽協調判定（總格顏色）
  const c = totalCtx.colorCount;
  let yinyangAdvice = null;
  if (c.red === 0 && c.black === 5)  yinyangAdvice = {type:'五黑',  text:'五黑：意識顯化的動能不足 → 多曬太陽、觀想光（補陽）'};
  else if (c.red === 1 && c.black === 4) yinyangAdvice = {type:'四黑一紅', text:'四黑一紅：陰多陽少 → 多曬太陽、觀想光（補陽）'};
  else if (c.red === 5 && c.black === 0) yinyangAdvice = {type:'五紅',  text:'五紅：意識顯化的動能不足 → 多踩泥土地、觀想日出+夕陽+大地（補陰／接地）'};
  else if (c.red === 4 && c.black === 1) yinyangAdvice = {type:'四紅一黑', text:'四紅一黑：陽多陰少 → 多踩泥土地、觀想日出+夕陽+大地（補陰／接地）'};

  // 沒有任何觸發 → 不顯示這個區塊（避免空白雜訊）
  if (totalCount === 0) {
    return '';
  }

  let html = `<div class="layer-card purification-card">`;
  const titleSuffix = isSingle ? '依單卦觸發劇情自動產出' : '依命盤觸發劇情自動產出';
  html += `<div class="purif-title">📿 顯化淨化建議（${titleSuffix}）</div>`;
  const sourceLabel = isSingle ? '單卦' : '命盤';
  html += `<div class="item info">系統依書本第 10 章 P22-P29 與療癒淨化資料學習，把${sourceLabel}已觸發的 ${totalCount} 項劇情整理成可直接寫在咒輪紙上的內容，並附完整療癒淨化／顯化念誦步驟。`;
  html += ` 注意事項：每張咒輪紙建議 <b>2-4 支甘露</b>淨化（個人想做到的程度）；每唸一句、停留 1-2 秒，讓頻率跟上那句話再唸下一句。</div>`;

  // ▼▼▼ 第 1 區：療癒淨化（清理已觸發劇情）▼▼▼
  html += `<div class="purif-section">`;
  html += `<div class="purif-h">▼ 一、療癒淨化（清理已觸發的劇情）</div>`;

  // 步驟 1：咒輪紙內容
  html += `<div class="purif-h"><span class="purif-step-num">1</span>步驟一：寫咒輪紙（依下列已觸發劇情，每張一個主題）</div>`;
  const renderZhuluen = (tag, items, layerName) => {
    if (!items || items.length === 0) return;
    // 把多條合併成一個咒輪紙文字（取每條的核心關鍵字）
    const lines = items.map(it => {
      // 從 text 中提取核心劇情（截短、去開頭的「人生容易經驗：」「面對情感時：」等贅詞）
      let core = it.text
        .replace(/^(人生容易經驗[:：]?|人生容易會有[:：]?|人生容易[:：]?|個性上容易會有[:：]?|個性上容易[:：]?|內在常會有[:：]?|學習時[:：]?|學習上[:：]?|面對情感時[:：]?|與人談感情[時的]*[:：]?|與人談感情時[:：]?|做事的時候[:：]?|在工作與經營事業時[,，]?[:：]?|工作與事業上[,，]?[:：]?|與父母[、,，]長輩以及兒女[、,，]晚輩在互動相處時[,，]?|與兄弟姐妹[、,，]夫妻[、,，]平輩在互動相處時[,，]?|容易經驗[:：]?|容易會有[:：]?|容易因為.+?而[:：]?)/g, '')
        .replace(/[，。、]+$/, '')
        .replace(/的劇情$/, '');
      return core;
    });
    html += `<div class="purif-zhuluen">`;
    html += `<div class="zl-tag">${tag}</div>`;
    html += `${layerName ? layerName + ' — ' : ''}${NAME}<br>`;
    html += `人生容易經驗：<br>`;
    html += lines.slice(0, 3).map(l => `「${l}」`).join('<br>');
    if (lines.length > 3) html += `<br><span style="color:#888;font-size:11px;">⋯（共 ${lines.length} 項，可分多張咒輪紙寫）</span>`;
    html += `<br>的劇情`;
    html += `</div>`;
  };
  // 單卦模式 vs 命盤模式：標籤不同
  if (isSingle) {
    // 單卦：把所有觸發劇情當「事件相關劇情」整合呈現
    if (triggered['total-trait'].length)   renderZhuluen('個性與特質',   triggered['total-trait']);
    if (triggered['total-people'].length)  renderZhuluen('與人互動',     triggered['total-people']);
    if (triggered['total-overall'].length) renderZhuluen('整體狀態',     triggered['total-overall']);
    if (triggered['total-health'].length)  renderZhuluen('健康',         triggered['total-health']);
    if (triggered['study'].length)         renderZhuluen('學習相關',     triggered['study']);
    if (triggered['emotion'].length)       renderZhuluen('情感／人際',   triggered['emotion']);
    if (triggered['career'].length)        renderZhuluen('事業／工作',   triggered['career']);
    if (singleDestinyTriggered.length)     renderZhuluen('運勢／事件',   singleDestinyTriggered);
  } else {
    // 命盤：依書版分類（總格 4 子分類 + 學習/情感/事業 + 運勢逐十年）
    if (triggered['total-trait'].length)   renderZhuluen('總格・特質',   triggered['total-trait']);
    if (triggered['total-people'].length)  renderZhuluen('總格・互動',   triggered['total-people']);
    if (triggered['total-overall'].length) renderZhuluen('總格・整體',   triggered['total-overall']);
    if (triggered['total-health'].length)  renderZhuluen('總格・健康',   triggered['total-health']);
    if (triggered['study'].length)         renderZhuluen('學習格 11-20歲', triggered['study']);
    if (triggered['emotion'].length)       renderZhuluen('情感格 21-30歲', triggered['emotion']);
    if (triggered['career'].length)        renderZhuluen('事業格 31-40歲', triggered['career']);
    for (const idx of Object.keys(destinyByLayer)) {
      const items = destinyByLayer[idx];
      const ld = layerData.layers.find(l => l.idx === Number(idx));
      if (!items.length || !ld) continue;
      renderZhuluen(`運勢 ${ld.ageStart}-${ld.ageEnd}歲`, items, `第 ${idx} 局`);
    }
  }

  // 步驟 2：下定義
  html += `<div class="purif-h"><span class="purif-step-num">2</span>步驟二：下定義（拿著寫好的咒輪紙慢慢念）</div>`;
  html += `<div class="purif-quote">我清楚地知道：當我把眼前的劇情～寫下這張咒輪紙上，
就能夠透過這些殊勝的符＋連結意識界諸佛菩薩
的高頻意識能量～來達到清理資料的作用。</div>`;

  // 步驟 3：做交託（三選一）
  html += `<div class="purif-h"><span class="purif-step-num">3</span>步驟三：做交託（依信仰三選一）</div>`;
  html += `<div class="purif-quote">為什麼我的人生會經驗這樣的劇情？
我清楚地知道：只是因為我的意識資料～如此而已～就讓我把這個資料：

<b>【佛教】</b>　交託給～可照十方圖、無有障礙的無量光～南無阿彌陀佛
<b>【基督徒】</b>交託給～聖靈、上帝主的聖光、聖父、聖子、聖靈，感謝主、讚美主、哈利路亞
<b>【無特定宗教信仰】</b>交託給～純粹的光與愛</div>`;

  // 步驟 4：噴瓶療癒淨化念誦
  html += `<div class="purif-h"><span class="purif-step-num">4</span>步驟四：噴瓶療癒淨化（往四周噴，邊噴邊念）</div>`;
  html += `<div class="purif-quote"><b>【宣告】</b>
我知道～本質的我是：完美的／健康的／豐盛的⋯
我只是資料庫裡有些什麼，所以才會經驗這樣的劇情。

<b>【邊噴邊念】（重複 3-5 遍）</b>
呼請來到 ${NAME} 資料的那些還在其他時空，
有著無明執著與傷痛經驗的 ${NAME} 跟他的祖先，
呼請你們過去這邊，我來藉由諸佛菩薩的願力，
來幫助你們得到清淨解脫，嗡啷哼！
呼請你們過去這邊，我來藉由諸佛菩薩的願力，
來幫助你們得到清淨跟解脫，嗡啷哼！

<b>【迴向】</b>
願以此功德，供養十方諸佛菩薩，迴向十方法界一切眾生；
願以此功德，迴向給因相同劇情而苦的眾生；
願以此功德，迴向給過去世的 ${NAME} 跟他的祖先，
嗡啷哼，嗡啷哼，嗡啷哼⋯
願以此功德，迴向給所有為相同劇情而苦的眾生。</div>`;

  // 步驟 5：火化咒輪紙
  html += `<div class="purif-h"><span class="purif-step-num">5</span>步驟五：將咒輪紙火化（念以下內容）</div>`;
  html += `<div class="purif-quote">我知道《火》可以幫助我做資料庫的清理與顯化
感恩諸佛菩薩慈悲～協助我做淨化與顯化</div>`;
  html += `</div>`;
  // ▲▲▲ 第 1 區結束 ▲▲▲

  // ▼▼▼ 第 2 區：顯化（為自己與他人帶來身心安頓的貴人與可能性）▼▼▼
  html += `<div class="purif-section">`;
  html += `<div class="purif-h">▼ 二、顯化（為 ${NAME} 帶來身心安頓的貴人與可能性）</div>`;

  // 步驟 1：顯化咒輪紙範例（依命盤主題建議）
  html += `<div class="purif-h"><span class="purif-step-num">1</span>步驟一：寫顯化咒輪紙（依需求自選一項或多項）</div>`;
  const showXianhua = (label, target) => {
    html += `<div class="purif-zhuluen">`;
    html += `<div class="zl-tag" style="background:#5b8c3e;">顯化・${label}</div>`;
    html += `顯化<br>可以幫助 ${NAME}<br>${target}<br>的貴人與可能性`;
    html += `</div>`;
  };
  // 依命盤觸發狀況自動建議顯化方向
  const xianhuaSuggestions = [];
  if (triggered['total-overall'].some(it => it.text.includes('歸零') || it.text.includes('白費')))
    xianhuaSuggestions.push({label:'事業財富', target:'事業有效擴展、財富有效擴展、解決財務困境'});
  if (triggered['career'].length > 0)
    xianhuaSuggestions.push({label:'事業', target:'事業順利擴展、貴人相助、人際關係愈來愈好'});
  if (triggered['emotion'].length > 0)
    xianhuaSuggestions.push({label:'情感', target:'感情關係愈來愈好、家人支持認同、陪伴一生的伴侶'});
  if (triggered['study'].length > 0)
    xianhuaSuggestions.push({label:'學習', target:'學習效率提升、順利通過考試／證照、找到熱情投入的方向'});
  if (triggered['total-health'].length > 0)
    xianhuaSuggestions.push({label:'健康', target:'身心安頓、健康狀態恢復、找到合適的醫療資源'});
  // 運勢有觸發的也加上對應建議
  if (Object.values(destinyByLayer).some(arr => arr.length > 0))
    xianhuaSuggestions.push({label:'運勢', target:'解決事件／官司圓滿善了、人際關係愈來愈好、活出更快樂更棒的自己'});

  if (xianhuaSuggestions.length === 0) {
    showXianhua('身心安頓', '身心安頓、活出更快樂更棒的自己');
  } else {
    for (const s of xianhuaSuggestions) showXianhua(s.label, s.target);
  }

  html += `<div class="purif-tip">參考清單：① 活出更快樂更棒的自己 ② 工作更順利 ③ 順利成交／順利完成 ④ 家人支持認同 ⑤ 半年內有 N 萬進帳 ⑥ 一年內解決 N 萬負債 ⑦ 買到會獲利的股票 ⑧ 帶來更多元的收入 ⑨ 人際關係愈來愈好 ⑩ 兒子機械熱情學習 ⑪ 順利通過考試／證照 ⑫ 老公接觸遇見學課程 ⑬ 陪伴共度一生的伴侶。可依個人需求改寫。</div>`;

  // 步驟 2-3：下定義 + 交託（同療癒淨化）
  html += `<div class="purif-h"><span class="purif-step-num">2</span>步驟二：下定義</div>`;
  html += `<div class="purif-quote">我清楚地知道：當我把想要顯化的貴人與可能性～寫在這張咒輪紙上，
就能夠透過這些殊勝的符＋連結意識界諸佛菩薩
的高頻意識能量～來達到顯化的作用。</div>`;

  html += `<div class="purif-h"><span class="purif-step-num">3</span>步驟三：做交託（依信仰三選一，同療癒淨化）</div>`;
  html += `<div class="purif-quote">我知道共同意識資料庫裡（這個世界上），
本來就存在著⋯的貴人與可能性，就讓我把這些貴人與可能性：

<b>【佛教】</b>　交託給～可照十方圖、無有障礙的無量光～南無阿彌陀佛
<b>【基督徒】</b>交託給～慈愛的上帝主耶穌⋯感謝主、讚美主、哈利路亞
<b>【無特定宗教信仰】</b>交託給～純淨的光與愛</div>`;

  // 步驟 4：操作噴瓶顯化
  html += `<div class="purif-h"><span class="purif-step-num">4</span>步驟四：操作噴瓶顯化（往上噴，邊噴邊念）</div>`;
  html += `<div class="purif-quote">我知道共同意識資料庫裡（這個世界上），
本來就存在著⋯的貴人與可能性，我要透過這個可以連結意識界的情境，
讓這些貴人與可能性，示現到我的生命裡，嗡啷哼！

（重複 3-5 遍）</div>`;

  // 步驟 5：火化
  html += `<div class="purif-h"><span class="purif-step-num">5</span>步驟五：將咒輪紙火化（同療癒淨化最後步驟）</div>`;
  html += `<div class="purif-quote">我知道《火》可以幫助我做資料庫的清理與顯化
感恩諸佛菩薩慈悲～協助我做淨化與顯化</div>`;
  html += `</div>`;
  // ▲▲▲ 第 2 區結束 ▲▲▲

  // ▼▼▼ 第 3 區：陰陽協調建議 ▼▼▼
  if (yinyangAdvice) {
    html += `<div class="purif-section">`;
    html += `<div class="purif-h">▼ 三、陰陽協調建議（依命盤總格顏色）</div>`;
    html += `<div class="purif-quote"><b>${yinyangAdvice.type}</b>：${yinyangAdvice.text}

陰陽不協調 → 生命的動能會不足。
建議透過上述「曬太陽／踩泥土地」+ 顯化淨化操作，把意識資料庫裡欠缺的動能補回來。

從共同意識資料庫下載到我的個別意識資料庫
～把他們填寫的動能顯化在我夢想意識界的情境裡。</div>`;
    html += `</div>`;
  }

  // ▼▼▼ 第 4 區：注意事項與效果評估 ▼▼▼
  html += `<div class="purif-section">`;
  html += `<div class="purif-h">▼ 四、注意事項與效果評估</div>`;
  html += `<div class="purif-quote"><b>注意事項：</b>
　• 無論交託、定義、噴瓶淨化、顯化，都要慢慢念→唸進去那些句子的理解裡。
　• 技巧：每唸一句、停留 1-2 秒，讓頻率跟上那句話再唸下一句。
　• 每張咒輪紙建議 2-4 支甘露淨化（視個人想做到的程度）。

<b>效果評估：</b>
　• 現在正在經驗的困擾劇情（例如：疾病、個性、情感關係） → 會看到狀況的改善！
　• 如果沒看到明顯的改變 → 可卜卦釐清《卡點》。
　• 非現在正在經驗的困擾（例如：命盤呈現未來會發生的事）或不容易馬上看到效果的模式（犯小人、錢留不下來）
　　→ 可透過象棋卜卦來釐清療癒淨化的《成效》。

<b>清理後的「彩蛋」：</b>
　當代清理掉那些障礙的模式與過去原來發生的事，那些曾經因而造成的損失或錯失機會所少賺的錢，會以各式各樣的方式回來。
　例如：統一發票中獎、額外的賺錢機會、超越原有財力資源的業務擴展。

<b>清理未來會發生的事：</b>
　可以避免那些事件所造成的遺憾。</div>`;
  html += `</div>`;

  html += `</div>`; // end purification-card
  return html;
}

function checkDaXian(layerBoard) {
  const c = layerBoard.center;
  if (!c) return null;
  // 大限：中央被吃 + 無保護
  for (const p of POSITIONS) {
    if (p === 'center' || !layerBoard[p]) continue;
    if (canEat(layerBoard, p, 'center') && !isProtected(layerBoard, 'center', p)) {
      const k = layerBoard[p].kind;
      const note = {
        shi:'血光之災／官司',
        che:'車關／交通意外',
        shuai:'重大關卡',
      }[k] || '中央被吃且無保護';
      return {bad: true, note: note + ` ← ${layerBoard[p].name}吃中央`};
    }
  }
  // 不好走：四紅一黑/四黑一紅 + 中央被吃
  const colorCount = {red:0, black:0};
  for (const p of POSITIONS) if (layerBoard[p]) colorCount[layerBoard[p].color]++;
  if (Math.abs(colorCount.red - colorCount.black) >= 3) {
    return {bad: true, note: '陰陽不協調 + 可能不好走（拖、住院、止痛、急救）'};
  }
  return null;
}

function renderNatalAnalysis() {
  const target = document.getElementById('natal-output');
  if (natalBoard.filter(x => x).length === 0) {
    target.innerHTML = '<div class="empty-msg">請先輸入 32 支棋。</div>';
    return;
  }

  // 讀取卜主性別＋婚姻狀態（影響②③位置代表角色 + 女命盤離婚格判定）
  const natalGender = document.getElementById('natal-querent-gender')?.value || '';
  const natalMarried = document.getElementById('natal-querent-married')?.value || '';

  // 先行計算「總格」的避掉條件（書版 H 條：總格有象相、總格自己包炮馬傌可吃別人、總格自己棋可吃不同色象相）
  const totalLayer = getLayerBoard(1);
  let totalHasXiang = false, totalSelfPaoMaCanEat = false, totalSelfCanEatXiang = false;
  if (totalLayer.center) {
    // 1) 總格有象/相（自己或別人皆算）
    totalHasXiang = POSITIONS.some(p => totalLayer[p] && totalLayer[p].kind === 'xiang');
    // 2) 總格自己（同色於中央）的包/炮/馬/傌可以吃到任意異色棋
    const myColor = totalLayer.center.color;
    totalSelfPaoMaCanEat = POSITIONS.some(p => {
      if (!totalLayer[p] || totalLayer[p].color !== myColor) return false;
      if (!['pao','ma'].includes(totalLayer[p].kind)) return false;
      return POSITIONS.some(q => q !== p && totalLayer[q] && totalLayer[q].color !== myColor && canEat(totalLayer, p, q));
    });
    // 3) 總格自己的棋可以吃到不同色的象/相
    totalSelfCanEatXiang = POSITIONS.some(p => {
      if (!totalLayer[p] || totalLayer[p].color !== myColor) return false;
      return POSITIONS.some(q => q !== p && totalLayer[q] && totalLayer[q].kind === 'xiang' && totalLayer[q].color !== myColor && canEat(totalLayer, p, q));
    });
  }

  // 解析年齡範圍 → ageStart, ageEnd（總格特殊：1-10/81-90）
  const parseAge = (age) => {
    if (age === '1-10/81-90') return {start:1, end:10};
    const m = age.match(/^(\d+)-(\d+)$/);
    return m ? {start:+m[1], end:+m[2]} : {start:0, end:0};
  };

  let html = '';
  // 收集所有局資料供命格選單分析總表使用
  const allLayersData = [];
  // 每局獨立分析
  for (const layer of NATAL_LAYERS) {
    const lb = getLayerBoard(layer.idx);
    if (!lb.center) continue;
    const ageR = parseAge(layer.age);
    // 計算前一局棋盤（v2.9.5 新增 — 用於生死關「過局往上吃」判定）
    //   局 2 的上一局 = 局 1（總格）
    //   局 8 的上一局 = 局 7
    //   局 1 沒有上一局（也不會判生死關，因為總格不論）
    const prevLb = layer.idx > 1 ? getLayerBoard(layer.idx - 1) : null;
    const context = {
      isMingPan: true,
      layerNum: layer.idx,
      ageStart: ageR.start,
      ageEnd: ageR.end,
      totalHasXiang, totalSelfPaoMaCanEat, totalSelfCanEatXiang,
      gender: natalGender,
      married: natalMarried,
      prevLb  // v2.9.5 新增：前一局棋盤，供 canEscapeUpward 用
    };
    const patterns = detectPatterns(lb, context);
    const scoreInfo = computeScores(lb);
    const fiveInfo = analyzeFiveElements(lb);
    const daXian = checkDaXian(lb);
    allLayersData.push({idx:layer.idx, lb, patterns, scoreInfo, fiveInfo, ageStart:ageR.start, ageEnd:ageR.end});
    html += `<div class="layer-card">`;
    html += `<div class="layer-header">`;
    html += `<div><div class="layer-title">第${layer.idx}局・${layer.name}（${layer.range}）</div></div>`;
    // 五子棋盤十字陣形：中、左、右、上、下
    html += `<div class="layer-mini-board">`;
    for (const p of ['top','left','center','right','bottom']) {
      const pp = lb[p];
      if (pp) {
        html += `<div class="mini-piece pos-${p} ${pp.color}">${pp.name}</div>`;
      } else {
        html += `<div class="mini-piece pos-${p} empty">空</div>`;
      }
    }
    html += `</div></div>`;

    // 格局摘要
    html += '<div style="margin:6px 0;">';
    for (const pt of patterns) {
      const cls = pt.type === 'good' ? 'badge-good' : (pt.type === 'warn' ? 'badge-warn' : 'badge-info');
      html += `<span class="badge ${cls}">${pt.name}</span>`;
    }
    html += '</div>';
    html += `<div class="item">收穫 +${scoreInfo.centerGain}／付出 -${scoreInfo.centerLoss}／淨 ${scoreInfo.net>=0?'+':''}${scoreInfo.net}分</div>`;
    if (fiveInfo.issues.length > 0) {
      html += `<div class="item warn">健康：${fiveInfo.issues.map(i=>i.text).join('；')}</div>`;
    }
    if (daXian) {
      html += `<div class="item warn">⚠ ${daXian.note}</div>`;
    }
    // 中央個性
    html += `<div class="piece-meta"><b>中央 ${lb.center.name}</b>：${lb.center.persona}</div>`;

    // 詳細版批命盤解說（書版 P170 — 命盤解說：詳細版）
    // 重用上方已宣告的 prevLb（v2.9.5 起合併計算，避免重複宣告）
    html += buildDetailedNarrative(layer, lb, prevLb, patterns, scoreInfo, fiveInfo, {gender:natalGender, married:natalMarried});

    html += `</div>`;
  }

  // 跨局財富分析
  const cross = analyzeCrossLayer();
  if (cross.length > 0) {
    html += `<div class="layer-card" style="border-left-color:#5b8c3e;">`;
    html += `<div class="layer-title">📈 跨局財富分析（車／炮 過局往上吃）</div>`;
    for (const f of cross) {
      const isGain = f.sameColor;
      html += `<div class="item ${isGain?'good':'warn'}">${f.age}歲 ${f.from} → ${f.to} = ${f.gain}分（${isGain?'賺得到':'應賺未賺/勞心勞力付出'}）</div>`;
    }
    html += `</div>`;
  }

  // 生死關警示專區（書版 P31-P32 + IMG_0819）— 整合各局生死關判定，明確列出年紀+原因
  if (allLayersData.length > 0) {
    html += buildDeathPassWarning(allLayersData);
  }

  // 命格選單分析總表（書版命格選單對照，學習自命格選單.zip 16 頁）
  if (allLayersData.length > 0) {
    html += buildMingeTable({layers: allLayersData});
    // 顯化淨化建議（書本第 10 章 P22-P29 + 療癒淨化與顯化資料夾學習）
    html += buildPurificationGuide({layers: allLayersData}, '');
  }

  target.innerHTML = html;
}

function setupNatal() {
  renderPicker('picker-natal', name => {
    pickedPieceNatal = name;
    document.getElementById('cur-pick-natal').textContent = `${name}（${PIECES[name].color==='red'?'紅':'黑'}）`;
  });
  renderNatalGrid();
  document.getElementById('btn-clear-natal').onclick = () => {
    natalBoard = new Array(32).fill(null);
    renderNatalGrid();
    document.getElementById('natal-output').innerHTML = '<div class="empty-msg">請先輸入 32 支棋並按「產出命盤分析」。</div>';
  };
  // 🎲 隨機抽 32 子（書版實體 32 顆袋全部摸完，模擬命盤摸棋過程）
  document.getElementById('btn-random-natal').onclick = () => {
    if (!confirm('將清空目前命盤並重新隨機抽 32 子？')) return;
    const drawn = drawRandomPieces(32);
    natalBoard = drawn.map(name => PIECES[name]);
    renderNatalGrid();
    renderNatalAnalysis();
  };
  // 🎲 抽下一顆（依 1→32 順序填下一個空格，模擬實體袋逐顆摸）
  document.getElementById('btn-random-next-natal').onclick = () => {
    const nextIdx = natalBoard.findIndex(x => !x);
    if (nextIdx === -1) {
      alert('命盤已滿 32 子，請先清空再抽。');
      return;
    }
    // 從袋中扣除已用棋子（模擬實體不放回）
    const usedNames = natalBoard.filter(x => x).map(x => x.name);
    const remainingBag = buildPieceBag().filter(name => {
      const idx = usedNames.indexOf(name);
      if (idx >= 0) { usedNames.splice(idx, 1); return false; }
      return true;
    });
    if (remainingBag.length === 0) {
      alert('袋子已空（理論上不會發生）。');
      return;
    }
    const drawn = shuffleArray(remainingBag)[0];
    natalBoard[nextIdx] = PIECES[drawn];
    renderNatalGrid();
    // 若已填滿 32 子才自動分析；否則只更新格子顯示
    if (natalBoard.filter(x => x).length === 32) {
      renderNatalAnalysis();
    }
  };
  document.getElementById('btn-analyze-natal').onclick = renderNatalAnalysis;
  document.getElementById('btn-print-natal').onclick = () => {
    // 自動先產出分析（如果還沒）
    if (natalBoard.filter(x => x).length > 0) {
      renderNatalAnalysis();
    }
    setTimeout(() => exportPDF('natal'), 100);
  };
  // 卜主性別/婚姻狀態變更 → 已有分析時重新渲染（影響②③位置代表角色與離婚格判定）
  const reanalyzeIfHasBoard = () => {
    if (natalBoard.filter(x => x).length > 0) renderNatalAnalysis();
  };
  document.getElementById('natal-querent-gender')?.addEventListener('change', reanalyzeIfHasBoard);
  document.getElementById('natal-querent-married')?.addEventListener('change', reanalyzeIfHasBoard);
}

/* ===== 前世因果 ===== */
function renderPLAnalysis() {
  const target = document.getElementById('analysis-pl');
  if (!plBoard.center) {
    target.innerHTML = '<div class="empty-msg">請先放上中宮第一支棋。</div>';
    return;
  }
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const c = plBoard.center;
  let html = '';

  // 前世性別
  // 男生摸到黑 → 前世女；女生摸到紅 → 前世男；同色 → 前世同性
  let pastGender;
  if (gender === 'male') {
    pastGender = c.color === 'black' ? '女' : '男';
  } else {
    pastGender = c.color === 'red' ? '男' : '女';
  }

  // 前世身分
  const PAST_IDENTITY = {
    'xiang': '修行人、宰相、員外、有宅子或有地位的人',
    'bing':  '小兵、農民、工人、小生意人、基層人物',
    'pao':   '帥哥美女、演藝人員、商人',
    'che':   '老闆、領導者',
    'shuai': '高官、將軍、有威望的老師',
    'shi':   '高官、將軍、有威望的老師',
    'ma':    '遊歷的旅人、走方郎中、傳訊使者'
  };
  html += '<div class="section"><div class="section-title">前世自身（依中宮第一支棋）</div>';
  html += `<div class="item info"><b>前世性別</b>：${pastGender}（現在${gender==='male'?'男':'女'}＋第一支${c.color==='red'?'紅':'黑'}棋反推）</div>`;
  html += `<div class="item info"><b>前世身分</b>：${PAST_IDENTITY[c.kind] || '一般人'}</div>`;
  html += '</div>';

  // 前世關係（看每對位置組合）
  const RELATION_TABLE = {
    'shuai_shuai': '複雜因果 / 好朋友 / 權力關係 / 冤親債主',
    'shi_shi':     '複雜因果 / 同階謀士',
    'xiang_xiang': '師徒關係',
    'che_che':     '工作合作、上司下屬',
    'ma_ma':       '同行旅人、共事者',
    'pao_pao':     '曖昧、情人、小妾、外遇對象',
    'bing_bing':   '六親、家人、祖孫、父母子女'
  };
  // 盤上其他 4 支棋，各與中央配對檢查
  html += '<div class="section"><div class="section-title">前世關係（中央 vs 各位置）</div>';
  let hasRel = false;
  for (const p of ['top','bottom','left','right']) {
    if (!plBoard[p]) continue;
    const piece = plBoard[p];
    const sameKindKey = `${piece.kind}_${c.kind}`;
    if (piece.kind === c.kind) {
      hasRel = true;
      const rel = RELATION_TABLE[`${piece.kind}_${piece.kind}`] || '同類關係';
      html += `<div class="item info">${POS_LABEL[p]} ${piece.name} ↔ 中央 ${c.name}（同字${piece.color===c.color?'同色':'異色'}）→ <b>${rel}</b>${piece.color!==c.color?'（異色：六親或好朋友類）':''}</div>`;
    }
  }
  if (!hasRel) {
    html += '<div class="item muted">中央與其他位置沒有同字配對 → 可能是新緣分、無前世累積。</div>';
  }
  html += '</div>';

  // 一枝獨秀分靈警示
  const colorCount = {red:0, black:0};
  for (const p of POSITIONS) if (plBoard[p]) colorCount[plBoard[p].color]++;
  if (POSITIONS.filter(p => plBoard[p]).length === 5 &&
      Math.abs(colorCount.red - colorCount.black) === 4 &&
      ['shuai'].includes(c.kind)) {
    html += `<div class="section"><div class="section-title">特殊判讀</div>`;
    html += `<div class="item warn"><b>一枝獨秀＋將/帥</b>：可能是「同一個靈體分離出來」(同卵雙胞胎特質) → 你跟對方是分靈出來各自投胎。</div></div>`;
  }

  // 提醒
  html += `<div class="section"><div class="section-title">提醒</div>`;
  html += `<div class="item">今生關係 ≠ 前世關係。今生是夫妻，前世可能是家人、合作伙伴、上司下屬，甚至是新緣分。</div></div>`;

  target.innerHTML = html;
}

function setupPastLife() {
  renderPicker('picker-pl', name => {
    pickedPiecePL = name;
    document.getElementById('cur-pick-pl').textContent = `${name}（${PIECES[name].color==='red'?'紅':'黑'}）`;
  });
  document.querySelectorAll('#board-pastlife .slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const pos = slot.dataset.pos;
      if (pickedPiecePL) plBoard[pos] = PIECES[pickedPiecePL];
      else plBoard[pos] = null;
      renderBoard('board-pastlife', plBoard);
      renderPLAnalysis();
    });
  });
  document.getElementById('btn-clear-pl').onclick = () => {
    plBoard = {center:null, top:null, bottom:null, left:null, right:null};
    renderBoard('board-pastlife', plBoard);
    renderPLAnalysis();
  };
  // 🎲 隨機抽 5 子（書版實體 32 顆袋抽 5 不放回）
  document.getElementById('btn-random-pl').onclick = () => {
    const drawn = drawRandomPieces(5);
    plBoard = {
      center: PIECES[drawn[0]],
      left:   PIECES[drawn[1]],
      right:  PIECES[drawn[2]],
      top:    PIECES[drawn[3]],
      bottom: PIECES[drawn[4]],
    };
    renderBoard('board-pastlife', plBoard);
    renderPLAnalysis();
  };
  // 🎲 抽下一顆（依空格順序中→左→右→上→下逐顆抽，不放回）
  document.getElementById('btn-random-next-pl').onclick = () => {
    const order = ['center','left','right','top','bottom'];
    const nextEmpty = order.find(p => !plBoard[p]);
    if (!nextEmpty) {
      alert('盤面已滿，請先清空再抽。');
      return;
    }
    // 從袋中扣除已用棋子（模擬實體不放回）
    const usedNames = order.filter(p => plBoard[p]).map(p => plBoard[p].name);
    const remainingBag = buildPieceBag().filter(name => {
      const idx = usedNames.indexOf(name);
      if (idx >= 0) { usedNames.splice(idx, 1); return false; }
      return true;
    });
    const drawn = shuffleArray(remainingBag)[0];
    plBoard[nextEmpty] = PIECES[drawn];
    renderBoard('board-pastlife', plBoard);
    renderPLAnalysis();
  };
  document.querySelectorAll('input[name="gender"]').forEach(r => {
    r.addEventListener('change', renderPLAnalysis);
  });
}

/* ===== 速查表 ===== */
function renderReference() {
  const target = document.getElementById('reference-content');
  let html = '';

  html += '<div class="section"><div class="section-title">棋子分數 & 五行對應</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:8px;">';
  for (const name of PIECE_ORDER) {
    const p = PIECES[name];
    html += `<div class="item ${p.color==='red'?'':'muted'}" style="border-left:4px solid ${p.color==='red'?'#c8102e':'#1a1a1a'};">
      <b style="font-size:18px;color:${p.color==='red'?'#c8102e':'#1a1a1a'};">${name}</b> ${p.score}分・${p.element}・${p.level}<br>
      <small>${p.persona}</small><br>
      <small style="color:#666;">器官：${p.organ}</small>
    </div>`;
  }
  html += '</div></div>';

  // 書版 v2.9.6 — 象棋走法（祥哥 2026-05-09 糾正後新增）
  html += `<div class="section"><div class="section-title">象棋走法速查（書版 v2.9.6 — 第 5 章基本概念）</div>
    <div class="item">📌 <b>將／帥</b>：上下左右相鄰可吃（不論異色比它大的也吃不到，一樣大互吃）。<small>蔡老師：「將最大、帥最大，將跟帥都是」</small></div>
    <div class="item">📌 <b>士／仕</b>：上下左右相鄰可吃。比士小的可吃（將不能吃）。同階互吃。</div>
    <div class="item">📌 <b>象／相</b>：上下左右相鄰可吃。比相小的可吃（將/士不能吃）。同階互吃。</div>
    <div class="item">📌 <b>俥／車</b>：直線上下左右皆可吃，<b>跨越中央時中央有棋也能吃</b>（飛山）。書本：「車也可以隔位吃，中間是空的也可以吃」</div>
    <div class="item warn">📌 <b>傌／馬</b>：<b>只能走斜的</b>（日字步），5 子盤無斜方向可吃任何外圍棋 → <b>馬永遠吃不到</b>。馬入中宮 = 有志難伸無法伸展。</div>
    <div class="item warn">📌 <b>炮／包</b>：<b>必須隔山跳一格才能吃</b>，中間要有棋當跳板。中央↔外圍無中間 → 不能吃。外圍↔對面外圍中間是中央（有棋=跳板可吃）。炮入中宮也吃不到。</div>
    <div class="item" style="border-left:5px solid #c8102e;background:#fff8e8;">📌 <b>兵／卒（v2.9.2 修正重點）</b>：<b>只能往「上、左、右」走，「下」=後退=禁止</b>。<br>
      <small style="color:#c8102e;"><b>⚠ 重要：兵卒不分顏色一律相同規則</b>（這是濟公象棋卜卦特色，跟傳統象棋紅黑方向相反不同）：</small><br>
      <small>✓ 從下→中央 = 往上 = 前進可吃</small><br>
      <small>✓ 從中央→上 = 往上 = 前進可吃</small><br>
      <small>✓ 左↔中央、右↔中央 = 平移可吃</small><br>
      <small>✗ <b>從上→中央 = 往下 = 後退禁止</b>（即使顏色不同也不能吃）</small><br>
      <small>✗ <b>從中央→下 = 往下 = 後退禁止</b></small><br>
      <small style="color:#666;">蔡老師原話：「兵啊，只能前進，左右不能後退...卒只能往上跟左右」「兵呢只能一步一腳印往前走、往左右走，不能後退」</small></div>
    <div class="item">📌 <b>同色不能互吃</b>。同階異色可互吃（如將↔帥、象↔相、士↔仕）。</div>
    <div class="item">📌 <b>保護判定</b>：當 attacker 移到 victim 位置後，是否有同色守衛能反吃這個 attacker → 有=被保護，分數減半。</div>
  </div>`;

  html += `<div class="section"><div class="section-title">26 格局速查（書版 v2.9.6 — 《改寫人生的象棋卜卦》）</div>
    <div class="item">📌 <b>① 好朋友格</b>：同字異色配對（將仕象車兵=中外圍相鄰／馬=斜對／炮=跨中央有跳板）→ 互相欣賞，整盤分數減半</div>
    <div class="item">📌 <b>② 好人緣格</b>：同字異色但不符好朋友位置（看得到=相鄰或斜對；炮包除外）→ 人緣不錯，可互吃</div>
    <div class="item">📌 <b>③ 互相欣賞格</b>：黑士+紅俥 / 紅仕+黑車 → 彼此欣賞，能降低威脅能量</div>
    <div class="item warn">📌 <b>④ 消耗格</b>：兩隻同色同字（不論相鄰、斜對、分離）強度：相鄰>斜對>分離；內耗=同中央色／外耗=異色</div>
    <div class="item warn">📌 <b>⑤ 破壞格</b>：同字 1+2 配置 → 本身含消耗，破壞彼此關係</div>
    <div class="item warn">📌 <b>⑥ 分離格</b>：好朋友被中央隔開（炮包除外）→ 價值觀不同、想法相牴觸</div>
    <div class="item warn">📌 <b>⑦ 困擾格</b>：兩組好朋友（含 2 兵 2 卒）→ 困擾能量強；常有做選擇/下決定的困擾</div>
    <div class="item good">📌 <b>⑧ 明君格</b>：將看到卒 或 帥看到兵 → 將不吃兵卒，公公服侍皇帝。隔山看不到=暴動格</div>
    <div class="item warn">📌 <b>⑨ 暴動格</b>：將/帥看不到同色兵卒。中央=自己暴動（偏執做錯決定）；非中央=外在暴動（外在變數）</div>
    <div class="item warn">📌 <b>⑩ 通吃格</b>：對方所有棋無保護/牽制/格局限制，可被通吃 → <b>淨值×20%</b>（書本 P77：「依經驗大多只有 20% 或歸零」，例：原本應賺 100 萬→只賺 20 萬）</div>
    <div class="item warn">📌 <b>⑪ 被通吃格</b>：自己所有棋被吃光（中央被吃也算）→ <b>淨值×20%</b>（書本 P78「收穫雖然多只有 20%，甚至負債」，可能變淨負值）</div>
    <div class="item">📌 <b>⑫ 事業格</b>（書版新）：俥傌炮/車馬包同盤 → 認真做事業的態度。女命盤總格+中央俥傌炮=有離婚資料</div>
    <div class="item good">📌 <b>⑬ 富貴格</b>：將+士+相 同盤（不論顏色）→ 不管做什麼都有人來幫</div>
    <div class="item">📌 <b>⑭ 桃花格</b>：炮帥/包將相鄰=偏桃花；隔山=正桃花。對方炮包吃我們將/帥=爛桃花</div>
    <div class="item warn">📌 <b>⑮ 全黑全紅格／悔恨格</b>：5 子全同色 → 陰陽不協調、顯化動能不足，<b>收穫付出皆×50%</b>（書本 P93 明文歸類「陰陽不協調包含：全黑全紅格、眾星拱月格、一枝獨秀格」）。事件卦=老天不答可換問法重卜</div>
    <div class="item warn">📌 <b>⑯ 離婚格</b>（女命盤總格）：6 種狀況累計（黑士黑車為首/暴動/分離/事業格/被通吃/悔恨）次數=離婚次數</div>
    <div class="item warn">📌 <b>⑰ 眾星拱月格／鬱卒格</b>：唯一不同色在中間。中央黑+外圍紅=眾星拱月（外好內鬱）；中央紅+外圍黑=鬱卒（外不看好）。陰陽不協調 <b>×50%</b></div>
    <div class="item">📌 <b>⑱ 一枝獨秀格</b>：唯一不同色在外圍（不會被吃）→ 獨樹一格。陰陽不協調 <b>×50%</b>。+好朋友格=雙生火焰</div>
    <div class="item good">📌 <b>⑲ 三人同心格</b>：3 隻同色同字（限兵卒）→ 同色=自己準備好；異色=外在準備好</div>
    <div class="item good">📌 <b>⑳ 大師格</b>（命盤總格）：中央非兵卒+外圍4兵卒 → 凸顯卦主特質。中央兵卒則進化為皇帝格</div>
    <div class="item good">📌 <b>㉑ 皇帝格</b>（命盤總格）：5 子全為兵卒 → 五隻地格踏實，做什麼都容易成功</div>
    <div class="item good">📌 <b>㉒ 勝利格</b>：②③⑤同色（V 字）→ 想做的事容易成局；同色=靠自己；好朋友=靠人助</div>
    <div class="item">📌 <b>㉓ 雨傘格</b>：②③④同色 → 有天助（撐傘看不到天，心情會悶）。命盤最後一局=這輩子是輪迴最後一世</div>
    <div class="item good">📌 <b>㉔ 十字天助格</b>：①②③同色 + ④⑤異色（橫向）<b>或</b> ①④⑤同色 + ②③異色（縱向）→ 純粹十字架形狀，有天助、有老天看顧、時機對了。注意：另外兩支必須跟中央異色，否則就變成雨傘格/眾星拱月/悔恨格</div>
    <div class="item good">📌 <b>㉕ 修行緣分格</b>（命盤）：中央相象+同色傌馬炮包/中央傌馬炮包/有雨傘十字天助 → 跟神明有連結</div>
    <div class="item warn">📌 <b>㉖ 生死關</b>（書版 P31-P32 + IMG_0819 + 老師吳慧琳 AriesWu 整理三條件，僅限命盤十年運 2-8 局，總格 1-10／81-90 歲不論）<br>
      <b>📅 年紀對應</b>：第2局 11-20歲（學習格）｜第3局 21-30歲（情感格）｜第4局 31-40歲（事業格）｜第5局 41-50歲｜第6局 51-60歲｜第7局 61-70歲｜第8局 71-80歲<br>
      <b>🔑 書本/老師三條件（v2.9.5 完整對齊）</b>：① <b>一定被吃掉</b>（外圍有對方棋能吃中央）② <b>沒人保護</b>（中央同色無守衛能反殺攻擊者）③ <b>飛不出去</b>（中央不能同盤反吃外圍對方棋，<b>也不能過局往上吃上一局棋</b>）—— 三條件全部成立才算生死關。<br>
      <b>📖 老師範例</b>：局 7 中棋炮 → 能飛到上面過局往上吃 → <b>飛得出去 = 不構成生死關</b>｜局 8 中棋馬 → 馬走斜，5 子盤永遠吃不到，跨局也一樣 → <b>飛不出去 = 構成生死關</b><br>
      <b>🚨 5 觸發層</b>：A. 三條件全成立（一定被吃+無保護+飛不出去）｜B. 50歲後別色將/帥暴動可吃 ｜C. 70歲後出現分離格 ｜D. 81歲後不論保護只要能被吃就算（含好朋友/悔恨格機率大）｜E. 陰陽不協調/消耗+包炮動能不足 → 可能性<br>
      <b>💊 死因器官</b>：仕→呼吸/肺/大腸 ｜相→心血管 ｜馬→意外 ｜炮→腎/婦科 ｜兵→脾胃/免疫 ｜俥→肝膽/行車 ｜帥/將→重大關卡<br>
      <b>⚔️ 死因方式（被誰吃）</b>：被將/帥吃→意外 ｜被士/仕吃→刀關 ｜被車/相吃→心血管 ｜被卒/兵吃→脾胃免疫<br>
      <b>✦ 4 避過條件 H1-H4</b>：H1. 30歲前+總格有象/相→天助 ｜H2. 總格自己包炮馬傌可吃別人→神明力量 ｜H3. 總格自己可吃不同色象/相→累世修行 ｜H4. 當局雨傘格/十字天助/中央象相→有機會<br>
      <b>📿 觸發後</b>：書版說「卦象只是讓我們看到意識資料庫裡有這樣的資料」 — 觸發≠必然發生，必須做完整療癒淨化（咒輪紙+下定義+交託+噴瓶+火化）清理該年紀的劇情。命盤頁會自動產出「⚠️ 生死關警示專區」明確列出年紀+原因+避過條件。</div>
  </div>`;

  // 書版 v2.9.6 — 生命靈數＋後天五行＋九星五行對照表
  html += `<div class="section"><div class="section-title">生命靈數・後天五行・九星五行對照表（書版 v2.9.6 — 《生命靈數開運密碼・九星 X 五行》）</div>
    <div class="item">📌 <b>計算規則</b>：把西元出生年月日的所有數字疊加，反覆相加直到單位數（1-9）= 靈數。<br>例：1983/04/04 → 1+9+8+3+0+4+0+4 = 29 → 2+9 = 11 → 1+1 = 2（土）。</div>
    <div class="item">📌 <b>先天五行 vs 後天五行</b>：先天=【命】（與生俱來的稟賦），後天=【運】。透過風水、中醫、命理（能量礦石、開運顏色）等可調整後天五行，達到趨吉避凶的作用。本系統算的是<b>後天五行</b>。</div>
    <div class="item">📌 <b>1-9 對照速查</b>（五行・八卦・自然・九星・五德・個性類型）：<br>
      <b>1【水】</b> 坎・水・海王星《智》智慧型｜健康注意：腎、膀胱、婦科、骨、耳<br>
      <b>2【土】</b> 坤・地・土星《信》保守型｜健康注意：脾胃、支氣管、大腸、消化系統<br>
      <b>3【木】</b> 震・雷・木星《仁》機動型｜健康注意：肝膽、心血管、手足關節、神經<br>
      <b>4【木】</b> 巽・風・水星《仁》隨型｜健康注意：肝、神經、呼吸、手足<br>
      <b>5【土】</b> 中宮・土・中宮土《信》中宮型｜健康注意：消化、脾胃、整體免疫<br>
      <b>6【金】</b> 乾・天・天王星《義》正直型｜健康注意：呼吸、血液循環、支氣管、大腸<br>
      <b>7【金】</b> 兌・澤・金星《義》浪漫型｜健康注意：濕氣、肺、骨骼、大腸、腎<br>
      <b>8【土】</b> 艮・山・冥王星《信》內斂型｜健康注意：神經、消化系統<br>
      <b>9【火】</b> 離・火・火星《禮》敏捷型｜健康注意：心臟、血液、眼睛、小腸</div>
    <div class="item good">📌 <b>開運顏色（隨身物品＋床單被套＋能量礦石）</b>：<br>
      <b>1 水</b>：◎最佳 白/銀/金 ｜其次 黑/深藍/綠/藍 ｜✗黃/棕/紅/紫<br>
      <b>2 土</b>：◎最佳 紅/紫 ｜其次 黃/棕/白/銀 ｜✗綠/藍/黑/深藍<br>
      <b>3-4 木</b>：◎最佳 黑/深藍 ｜其次 綠/藍/紅/紫 ｜✗白/銀/黃/棕<br>
      <b>5 土</b>：◎最佳 紅/紫 ｜其次 黃/棕/白/銀 ｜✗綠/藍/黑<br>
      <b>6-7 金</b>：◎最佳 黃/棕 ｜其次 白/銀/黑/深藍 ｜✗紅/紫/綠/藍<br>
      <b>8 土</b>：◎最佳 紅/紫 ｜其次 黃/棕/白/銀 ｜✗綠/藍/黑<br>
      <b>9 火</b>：◎最佳 綠/藍 ｜其次 紅/紫/黃/棕 ｜✗黑/深藍/白/銀</div>
    <div class="item">📌 <b>五行生克</b>：金生水、水生木、木生火、火生土、土生金（生＝補）；金克木、木克土、土克水、水克火、火克金（克＝傷）。能量不足→補生我者；能量過剛→洩我生者；長期避免接觸克我者。</div>
  </div>`;

  // 書版 v2.0 — 問事 5 規則
  html += `<div class="section"><div class="section-title">問事 5 規則（書版 v2.9.6）</div>
    <div class="item warn">📌 <b>規則一：命盤限本人抓棋，問事單卦只能問自己或直系血親</b><br>例外：卦主不便時可說「允許某某代我抓棋」（僅限問事單卦，年運/命盤不可）</div>
    <div class="item">📌 <b>規則二：可與其它占卜搭配</b>（生命靈數、後天五行等互補）</div>
    <div class="item warn">📌 <b>規則三：問題問得越明確越好</b><br>❌ 差：跟著朋友投資房地產會不會賺錢？<br>✅ 好：朋友跟我說的「那個房地產項目」，我投資的話會不會賺錢？</div>
    <div class="item">📌 <b>規則四：視情況需設時間</b><br>例：我做這個行業，一年之內有沒有辦法讓我賺到 100 萬？<br>但有些題目（如統一 7-11 第八年才賺錢）設時間反而會侷限</div>
    <div class="item">📌 <b>規則五：選擇題需同時卜幾個卦做比較</b><br>選項 ≤3 個：棋子可不放回直接拿下一組<br>選項 ≥4 個：先記錄前兩個，把棋子放回再問後兩個</div>
  </div>`;

  // 書版 v2.0 — 問法善巧
  html += `<div class="section"><div class="section-title">問法善巧（書版 v2.9.6 — 取代「要不要做」式問法）</div>
    <div class="item warn">❌ 不精準問法：要不要做這件事？／他愛不愛我？／某人會不會選上？</div>
    <div class="item good">✅ 善巧問法：<br>　• 我去做這件事好不好？<br>　• 我做這件事會呈現什麼狀態？<br>　• 我做這件事有沒有什麼要注意的？<br>　• 我會不會跟某某結婚？／某某的決定對我是否有好影響？<br>　• 配偶/兄弟姐妹改成「他做的事會不會讓我開心」這種延伸到自己身上的問法</div>
    <div class="item info">書版心法：「卜卦的定位不是在幫別人算命，而是在幫助一個人『認識自己』」</div>
  </div>`;

  // 書版 v2.0 — 標準解卦五段式順序
  html += `<div class="section"><div class="section-title">標準解卦五段式順序（書版 v2.9.6）</div>
    <div class="item">① <b>狀態</b>：從中央以及與中央同色的棋子論卦主特質</div>
    <div class="item">② <b>互動關係</b>：跟身邊的人的互動（吃、被吃、影響力）</div>
    <div class="item">③ <b>格局及需注意的狀態</b>：含犯小人、做錯決定、需留意的意外</div>
    <div class="item">④ <b>付出與收穫</b>：含保護、抗衡、牽制、特殊格局比例（通吃20%/悔恨20%/陰陽不協調50%）</div>
    <div class="item">⑤ <b>健康</b>：1.中央受威脅最明顯 2.消耗格、暴動格 3.陰陽是否協調</div>
  </div>`;

  html += `<div class="section"><div class="section-title">問題寫法善巧（不能問什麼？怎麼改寫？）</div>
    <div class="item warn">❌ 他愛不愛我？／某人會不會選上？／我先生今天會怎樣？</div>
    <div class="item good">✅ 改成：這件事會不會讓我開心？／我會不會跟某某結婚？／某某的決定對我是否有好影響？／某地址房子在 X 月 X 日前用 X 元是否能成交？</div>
    <div class="item warn">❌ 配偶、兄弟姐妹不能直接代問。</div>
    <div class="item good">✅ 改成「他做的事會不會讓我開心」這種延伸到自己身上的問法。</div>
    <div class="item">✅ 例外：父母臥病/植物人、子女嬰兒可以代摸。</div>
  </div>`;

  html += `<div class="section"><div class="section-title">起卦標準流程</div>
    <div class="item">1. 棋子用酒精擦乾淨、洗手、心要靜</div>
    <div class="item">2. 默念恭請（濟公菩薩／觀音菩薩／地藏王菩薩／指導靈）</div>
    <div class="item">3. 報自己姓名、生肖、出生年月日、住址</div>
    <div class="item">4. 把問題完整講出來（人事時地物五要素）</div>
    <div class="item">5. 洗牌 → 本人摸棋 → 按順序排（中→左→右→上→下）</div>
    <div class="item">6. 線上：必須開視訊看到本人，卜卦者排棋成 4×8 顆，被問者報「第 N 排第 N 支」</div>
    <div class="item warn">7. 棋具裂、缺角、破損 → 整副換，先感謝它「謝謝陪我卜卦，緣分到此」</div>
  </div>`;

  html += `<div class="section"><div class="section-title">顯化／淨化／噴瓶 SOP</div>
    <div class="item info"><b>噴瓶配方</b>：乾淨飲用水 + 兩張作文符號卡放入瓶內。卡片顏色變淡到看不清 → 換新卡。</div>
    <div class="item good"><b>顯化（要好的東西出現）</b>：寫「顯化 [姓名][某件事] 的貴人與可能性」，一張紙一件事，原子筆，不能錯字（錯一字整張作廢）。<br>連續做 7 天（七的倍數）。可在家做。</div>
    <div class="item warn"><b>淨化（清不好的）</b>：句型「我知道[名字]的本質是完美的、豐盛的、健康的。父祖留下資料的那些...請你們過來這邊。我藉由諸佛菩薩的願力來幫助你們得到清淨與解脫。唵啊吽×3」<br>呼請祖先/卡陰類務必在<b>陽台、頂樓或戶外</b>做。</div>
    <div class="item info"><b>迴向</b>（每次必做）：「願以此功德供養十方諸佛菩薩，迴向十方法界一切眾生。願以此功德迴向給所有為相同劇情而苦的眾生。願以此功德迴向給[對象]與他的祖先。唵啊吽×3」</div>
    <div class="item">🔥 燒寫話：寫好的話放馬克杯燒掉，邊燒邊念「我知道火可以幫助我做資料庫的清理跟顯化，感恩佛祖協助。」</div>
    <div class="item">🌞 陰陽不協調調整：紅多→脫鞋踩土壤草地15分鐘以上；黑多→曬太陽尤其曬背</div>
    <div class="item warn">⚠ 卡陰拆題：1.有沒有卡陰？2.是現實小人嗎？3.是無形界？4.是祖先？5.是媽媽那邊（外公外婆）？6.是爸爸那邊（爺爺奶奶）？分開問</div>
  </div>`;

  html += `<div class="section"><div class="section-title">卦種用途</div>
    <div class="item">📅 <b>周卦</b> 看 3-7 天 ／ 月卦看一個月 ／ 年卦看一整年方向</div>
    <div class="item">🔮 <b>命盤</b> 看一輩子，32 支棋拆 8 局（每局重疊「上=前局下」），一輩子只能摸一次（除非顯化淨化過）</div>
    <div class="item">❓ <b>事件卦</b> 問具體事，全紅全黑 = 老天爺不答可換問法重來</div>
    <div class="item">🔄 <b>前世因果</b> 看前世身分、跟某人的前世關係</div>
    <div class="item info">🆕 <b>療癒淨化效果卦</b>（書版 v2.9.6）：問「我療癒淨化的效果如何？」只看收穫不算付出</div>
    <div class="item warn">⚠ 一事一卦，不準也不能重複問同件事（除非設定期間如「3個月後再卜」或療癒淨化後）</div>
    <div class="item info">🆕 <b>命盤重排判定</b>：療癒淨化後想重排命盤，先卜單卦，中央=兵卒+乾淨好朋友格 → 可重排</div>
  </div>`;

  // 書版 v2.0 — 吃與被吃棋子的衍伸解釋表
  html += `<div class="section"><div class="section-title">吃與被吃棋子的衍伸解釋表（書版 v2.9.6 — 第7章）</div>
    <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead style="background:#fce8d0;color:#6b3410;">
        <tr><th style="padding:8px;border:1px solid #d4b896;text-align:left;">棋子</th><th style="padding:8px;border:1px solid #d4b896;text-align:left;">吃到（有收穫）</th><th style="padding:8px;border:1px solid #d4b896;text-align:left;">被吃（要付出）</th></tr>
      </thead>
      <tbody>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>帥/將</b></td><td style="padding:6px;border:1px solid #d4b896;">無（將帥不吃兵卒）</td><td style="padding:6px;border:1px solid #d4b896;">身邊的人易執著、外在有較大壓力</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>仕/士</b></td><td style="padding:6px;border:1px solid #d4b896;">得到名聲、權力、文憑</td><td style="padding:6px;border:1px solid #d4b896;">名譽受損、糾紛、官司、違規。我們的仕/士被吃：常需處理人的紛爭。被仕/士吃：易血光之災</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;" rowspan="2"><b>仕/士</b><br>（命盤）</td><td style="padding:6px;border:1px solid #d4b896;" colspan="2">命盤過局往上：我們的炮/包過局往上吃到仕/士 → 有出國讀書的機會</td></tr>
        <tr><td colspan="2"></td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>相/象</b></td><td style="padding:6px;border:1px solid #d4b896;">有置產的機會、有宗教或修行的機緣</td><td style="padding:6px;border:1px solid #d4b896;">會有火氣大的問題</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>俥/車</b></td><td style="padding:6px;border:1px solid #d4b896;">得到名聲、權力</td><td style="padding:6px;border:1px solid #d4b896;">行車糾紛、車關（被俥車吃 或 我們的俥車被吃皆同）</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>傌/馬</b></td><td style="padding:6px;border:1px solid #d4b896;">人脈擴展、許多善巧、創意、點子</td><td style="padding:6px;border:1px solid #d4b896;">被傌/馬吃：意外受傷、卡陰、犯小人、投資失利。我們的傌/馬被吃：意外受傷</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>傌/馬</b>主動</td><td style="padding:6px;border:1px solid #d4b896;" colspan="2">我們的傌/馬吃對方任何棋子：透過創意、善巧、資源整合而獲利</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>炮/包</b></td><td style="padding:6px;border:1px solid #d4b896;">受人喜歡，有許多善巧、創意、點子</td><td style="padding:6px;border:1px solid #d4b896;">被炮/包吃：卡陰、犯小人、投資失利</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>炮/包</b>主動</td><td style="padding:6px;border:1px solid #d4b896;" colspan="2">我們的炮/包吃對方任何棋子：透過創意、善巧、投資而獲利</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>炮/包</b>桃花</td><td style="padding:6px;border:1px solid #d4b896;" colspan="2">被炮/包吃到我們的將/帥 → 容易爛桃花，因談感情對象而損失</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;" colspan="3"><b>炮/包過局往上（命盤）</b>：我們的炮/包過局往上吃對方包/炮或將/帥 → 投資獲利機會（已婚→外遇）；對方炮/包過局往上吃我們將/帥 → 做錯投資+爛桃花</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#ffe6e6;"><b>兵/卒</b></td><td style="padding:6px;border:1px solid #d4b896;">無</td><td style="padding:6px;border:1px solid #d4b896;">無</td></tr>
      </tbody>
    </table>
    </div>
  </div>`;

  // 書版 v2.0 — 前世關係判定表
  html += `<div class="section"><div class="section-title">前世關係判定（書版 v2.9.6 — 第9章）</div>
    <div class="item info">前世卦看「卦主-對象」二棋的位置與棋種對應</div>
    <div class="item"><b>🔴 兵卒（直系血親較多）</b><br>　• ①兵+②卒：對方是你的妻子｜①兵+③卒：對方是兄弟姊妹<br>　• ①卒+③兵：對方是你的老公｜①卒+②兵：對方是兄弟姊妹<br>　• ①+④（中與上）：父母｜①+⑤（中與下）：子女<br>　• ④+⑤（上與下）：祖父母與孫子｜②+③（左右）：非直系血親兄弟姊妹<br>　• 斜對（②④/②⑤/③④/③⑤）：叔伯、姑嬸、舅舅、阿姨、姪子姪女</div>
    <div class="item"><b>🟣 炮包（情人類）</b><br>　• 炮包相鄰／偏桃花（①②/①③/①④/①⑤）：短暫的情人<br>　• 炮包隔山／正桃花（②③/④⑤）：外遇對象、情人或小妾<br>　• 炮包斜對／偏桃花（②④/②⑤/③④/③⑤）：有情慾但沒有真正交流的對象</div>
    <div class="item"><b>🟢 傌馬</b><br>　• 相鄰（①②/①③）：短暫的情人<br>　• 上下（①④/①⑤）：有感情、情愫的長輩晚輩<br>　• 斜對（②④/②⑤/③④/③⑤）：長時間的情人<br>　• 分開（②③/④⑤）：喜歡但沒有真正交流的對象</div>
    <div class="item"><b>🔵 俥車（事業類）</b><br>　• 相鄰（①②/①③）：工作或事業合作夥伴<br>　• 上下（①④/①⑤）：職場上司、下屬或上下游廠商<br>　• 上下②③：職場隔代上司下屬／非直接合作夥伴<br>　• 斜對：非直接合作的上司、下屬</div>
    <div class="item"><b>🟡 相象（修行類）</b><br>　• 相鄰（①②/①③）：同學、同修<br>　• 上下（①④/①⑤）：師父、徒弟<br>　• ④+⑤：師公、徒孫｜②+③：非同師父之同學<br>　• 斜對：非直接之師父（師叔、師伯）與徒弟</div>
    <div class="item"><b>🟠 仕士（官場類）</b><br>　• 相鄰：同僚<br>　• 上下：官場的上司、下屬<br>　• ④+⑤：隔代上司下屬｜②+③：非直屬同僚<br>　• 斜對：非直屬上司、下屬</div>
    <div class="item"><b>🌟 帥將</b>：實際案例太多不同可能，可另外再起一個卦</div>
    <div class="item info">🌀 <b>一枝獨秀格 + 好朋友格 = 雙生火焰</b>：同一個靈體，分靈投胎來的。但雙生火焰並非靈魂伴侶。常見特點：很多特質相似但互動時常互看不順眼。</div>
  </div>`;

  // 書版 v2.0 — 暴動格人體部位對照
  html += `<div class="section"><div class="section-title">暴動格人體部位對應（書版 v2.9.6 — 鏡像）</div>
    <div class="item info">棋盤位置 ↔ 人體部位（卦象的位置與人體左右剛好相反，因為棋盤是「面對我們的人」）</div>
    <div class="item">① 中央 → 脖子以下、肚臍以上（軀幹中央氣血循環）</div>
    <div class="item">② 左 → 身體<b>右側</b>（鏡像）</div>
    <div class="item">③ 右 → 身體<b>左側</b>（鏡像）</div>
    <div class="item">④ 上 → 頭部</div>
    <div class="item">⑤ 下 → 肚臍以下、下肢</div>
    <div class="item warn">命盤十年運中如果有暴動 → 像有顆地雷，可能引爆在家庭、事業、健康或財富，可看上一局兵卒情況輕重</div>
  </div>`;

  // 書版 v2.0 — 療癒淨化效果判定表
  html += `<div class="section"><div class="section-title">療癒淨化效果判定表（書版 v2.9.6 — 第10章）</div>
    <div class="item info">問法：「<b>我療癒淨化／刪除資料的效果如何？</b>」<br>解卦：<b>只看「有沒有得吃」或「有沒有收穫」，不算付出</b></div>
    <div class="item">📌 <b>兵卒好朋友格</b>：方法正確且已清理到真正根源</div>
    <div class="item">📌 <b>其他好朋友格 / 相鄰明君格</b>：方法跟方向是正確的</div>
    <div class="item">📌 <b>沒有好朋友格 / 沒有相鄰明君格</b>：方向方法可再調整。但分數很高也可看到改善</div>
    <div class="item warn">📌 <b>五支全黑或全紅</b>：重新卜一卦</div>
    <div style="overflow-x:auto;margin-top:8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead style="background:#fce8d0;color:#6b3410;">
        <tr><th style="padding:6px;border:1px solid #d4b896;">情境</th><th style="padding:6px;border:1px solid #d4b896;">象棋得分</th><th style="padding:6px;border:1px solid #d4b896;">療癒成效</th></tr>
      </thead>
      <tbody>
        <tr><td style="padding:6px;border:1px solid #d4b896;" rowspan="8">無好朋友格<br>無相鄰明君格</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">未達 20</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">需調整</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">20</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">60 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">40</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">65 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">60</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">70 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">80</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">75 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">100</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">80 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">120</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">85 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">140 以上</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">90 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;" rowspan="5">好朋友格（非兵卒）<br>相鄰明君格</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">10 以下</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">70 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">30</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">75 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">50</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">80 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">70</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">85 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">90 以上</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">90 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;background:#e8f5e8;" rowspan="4">兵卒好朋友格</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">10 以下</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">80 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">30</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">85 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">50</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">90 分</td></tr>
        <tr><td style="padding:6px;border:1px solid #d4b896;text-align:center;">全兵卒混色</td><td style="padding:6px;border:1px solid #d4b896;text-align:center;">90 分</td></tr>
      </tbody>
    </table>
    </div>
    <div class="item warn" style="margin-top:8px;">⚠ <b>扣分項</b>：消耗格(內外)、困擾格、暴動格、分離格、被通吃格、一枝獨秀格、眾星拱月/鬱卒格、有傌馬/炮包吃到或得到我們好處 → 每出現一項扣 2 分（<b>通吃格不扣</b>）</div>
    <div class="item info">💡 最高 90 分（人的侷限）。建議每項目至少用掉 2-4 支噴瓶後再卜卦看效果。提醒：勿過於執著療癒淨化的分數</div>
  </div>`;

  // 書版 v2.0 — 卦象中不同位置代表的角色（依卜主性別+婚姻狀態）
  html += `<div class="section"><div class="section-title">位置代表的角色（書版 v2.9.6 — 第5章）</div>
    <div class="item info">通用：①中=自己／④上=長輩(年齡>10歲)／⑤下=晚輩(年齡<10歲)<br>口訣：左手比較沒力 → ②左=女生；右手比較有力 → ③右=男生</div>
    <div class="item"><b>👨 男性卜主</b><br>　• 未婚：②姊妹/女朋友/女性平輩｜③兄弟/男性平輩<br>　• 已婚：②妻子/女性平輩｜③兄弟/男性平輩<br>　• 男性結婚前後跟兄弟關係不變，但跟姊妹會不一樣</div>
    <div class="item"><b>👩 女性卜主</b><br>　• 未婚：②姊妹/女性平輩｜③兄弟/男朋友/男性平輩<br>　• 已婚：②兄弟姊妹/女性平輩｜③丈夫/男性平輩<br>　• 女性結婚前後跟姊妹關係不變，但跟兄弟會不一樣（看法位置從③改看②）</div>
    <div class="item warn">⚠ 在系統的單卦面板上方「卜主性別」「婚姻狀態」下拉選擇後，五段式解盤的「② 互動關係」會自動套用對應的角色</div>
  </div>`;

  target.innerHTML = html;
}

/* ===== PDF 匯出 v2.9（html2pdf.js 直接 DOM → Canvas → PDF 下載）=====
   不再走 window.print() 觸發瀏覽器列印對話框（避開 iOS Safari 印表機驅動 paginate bug），
   改用 html2pdf.js 純 JS DOM 截圖直接生成 PDF 檔下載。
   優點：① 不依賴印表機 ② 內容跟螢幕看到的一致 ③ 自動分頁 ④ iOS/Android/桌面都能用
*/
const PDF_PANEL_MAP = {
  'single':    { panel:'panel-single',    name:'單卦解盤' },
  'natal':     { panel:'panel-natal',     name:'命盤解盤' },
  'pastlife':  { panel:'panel-pastlife',  name:'前世因果解盤' },
  'lingshu':   { panel:'panel-lingshu',   name:'生命靈數' },
  'reference': { panel:'panel-reference', name:'速查表' }
};

async function exportPDF(mode) {
  const config = PDF_PANEL_MAP[mode];
  if (!config) { alert('未知的匯出模式：' + mode); return; }
  const panel = document.getElementById(config.panel);
  if (!panel) { alert('找不到面板：' + config.panel); return; }

  // 確認 html2pdf.js 已載入
  if (typeof html2pdf === 'undefined') {
    alert('PDF 工具還在載入中，請稍待 2-3 秒再試。');
    return;
  }

  // 防止重複點擊
  const btn = document.activeElement;
  const oldBtnText = btn && btn.textContent;
  if (btn && btn.tagName === 'BUTTON') {
    btn.disabled = true;
    btn.textContent = '⏳ 產出 PDF 中...';
  }
  const restoreBtn = () => {
    if (btn && btn.tagName === 'BUTTON') {
      btn.disabled = false;
      btn.textContent = oldBtnText;
    }
  };

  // ===== v2.9.1 改：直接在原 panel 上 mutate（不用 cloneNode + off-screen wrapper）
  // 原因：html2canvas 在 iOS Safari 對「fixed left:-9999px」off-screen 元素會截成空白。
  // 改成：暫時隱藏 panel 內的互動元件 + 暫時 prepend 標題 → 截 panel → 還原。

  // 1. 暫存被隱藏元素的 inline display（之後還原）
  const hiddenEls = [];
  panel.querySelectorAll('.picker, .picker-actions, .help, button').forEach(el => {
    hiddenEls.push({ el, originalDisplay: el.style.display });
    el.style.display = 'none';
  });

  // 2. 暫時 prepend 標題到 panel 最前面（含產出時間）
  const today = new Date();
  const dateStr = today.toLocaleString('zh-TW', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
  const titleDiv = document.createElement('div');
  titleDiv.id = '__pdf_title_temp__';
  titleDiv.style.cssText = 'text-align:center;margin-bottom:18px;border-bottom:2px solid #6b3410;padding-bottom:12px;';
  titleDiv.innerHTML = `
    <h2 style="font-size:22px;color:#6b3410;margin:0 0 4px 0;font-weight:700;">濟公象棋卜卦系統</h2>
    <div style="font-size:15px;color:#8b4513;font-weight:600;">${config.name}</div>
    <div style="font-size:11px;color:#888;margin-top:4px;">產出時間：${dateStr}</div>
  `;
  panel.insertBefore(titleDiv, panel.firstChild);

  // 3. 確保 panel 是 active（按鈕能按理論上 panel 一定 active，但保險起見）
  const wasActive = panel.classList.contains('active');
  if (!wasActive) panel.classList.add('active');

  // 還原函數
  const restorePanel = () => {
    if (titleDiv.parentNode) titleDiv.remove();
    hiddenEls.forEach(({el, originalDisplay}) => { el.style.display = originalDisplay; });
    if (!wasActive) panel.classList.remove('active');
  };

  try {
    // 等中文字體渲染完成
    await new Promise(r => setTimeout(r, 200));

    const filename = `${config.name}_${today.toISOString().slice(0,10)}.pdf`;
    const opts = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        avoid: ['.layer-card', '.section', '.board-card', '.minge-table', '.death-pass-warning', '.purification-card']
      }
    };

    // 直接從 active panel 截圖（panel 在使用者視野內，html2canvas 能正常渲染）
    await html2pdf().set(opts).from(panel).save();
    restorePanel();
    restoreBtn();
  } catch (err) {
    console.error('PDF 生成失敗:', err);
    alert('PDF 生成失敗：' + err.message + '\n\n備援：請使用瀏覽器內建的「列印 → 儲存為 PDF」功能。');
    restorePanel();
    restoreBtn();
  }
}

/* ===== 生命靈數＋後天五行＋九星五行 =====
   學習源：書本《生命靈數開運密碼・九星 X 五行》第 1-4 頁後天五行 + 九星五行 PDF 8 頁
   計算規則：把出生年月日所有數字疊加 → 反覆相加到單位數（1-9）= 靈數
   1-9 對應：水/土/木/木/中宮土/金/金/土/火 + 八卦 + 九星 + 五德
*/
const LINGSHU_DATA = {
  1: { element:'水', bagua:'坎', symbol:'水', star:'海王星', virtue:'智',
       type:'智慧型',
       persona:'有許多善巧聰明，會比較欣賞有才華的人。相親魅力，有很大的包容性、待人處事就像水一般。面對壓力，能夠自己找到解決事情的方式、冷靜化解。內在常有一些恐懼擔憂，容易隱藏自己的真正感受。',
       health:'腎臟、膀胱、婦科、攝護腺、骨、耳朵方面的疾病',
       best:['白色','銀色','淺灰色','金色'],
       second:['黑色','深灰色','極深藍','綠色系','藍色系'],
       avoid:['黃色系','棕色系','紅色系','紫色系'] },
  2: { element:'土', bagua:'坤', symbol:'地', star:'土星', virtue:'信',
       type:'保守型',
       persona:'很有母愛，會比較容易想很多。個性溫和、親切、柔順、體貼、細心、有耐性、不計較。喜歡穩定與保守的人際關係，善體人意、喜歡照顧別人。總是習慣無怨無悔、任勞任怨的付出。只要是答應別人的事，都會盡全力去做到，不喜歡不守信用的人。',
       health:'脾胃、支氣管、大腸方面的疾病；消化系統與呼吸系統易留心',
       best:['紅色系','紫色系'],
       second:['黃色系','棕色系','白色','銀色','淺灰色'],
       avoid:['綠色系','藍色系','黑色','深灰色','極深藍'] },
  3: { element:'木', bagua:'震', symbol:'雷', star:'木星', virtue:'仁',
       type:'機動型',
       persona:'積極進取、急性子、好奇心、求知欲強。屬機動性的個性，不喜歡拐彎抹角、好惡分明，情緒起伏較大。不喜歡擔任首領的條件，但對自己的表現相當在意，會問了面子去盡力完成答應的事，算是言出必行的實踐者。是直線條、單一思考的人，太老實又不懂得耍一點善意的說話技巧，心急性急，有口無心。',
       health:'肝膽、心血管、手足關節、神經系統方面的疾病',
       best:['黑色','深灰色','極深藍'],
       second:['綠色系','藍色系','紅色系','紫色系'],
       avoid:['白色','銀色','淺灰色','黃色系','棕色系'] },
  4: { element:'木', bagua:'巽', symbol:'風', star:'水星', virtue:'仁',
       type:'隨型',
       persona:'適應力好，內心柔和、仁慈、有親和力。具有卓越的邏輯分析技巧、洞察能力與深入的分析精神。靈巧多變，口才不錯，會隨著對象、環境、時間而調整與人的應對，頗擅長人際關係。善於解決問題，是眾人眼光的焦點。在人群中容易冒出頭，加上好聖心強，注重面子問題，所以人情壓力排名第一，心很軟，要盡量避免做一個濫好人，才能避免答應太多而做不到。',
       health:'肝臟、神經、呼吸系統、手足、神經系統方面的疾病',
       best:['黑色','深灰色','極深藍'],
       second:['綠色系','藍色系','紅色系','紫色系'],
       avoid:['白色','銀色','淺灰色','黃色系','棕色系'] },
  5: { element:'土', bagua:'中宮', symbol:'土（中央）', star:'中宮土', virtue:'信',
       type:'中宮型',
       persona:'5 為中宮，居中協調的個性，集八方氣場於一身，個性兼具其他八數特質。中宮土屬於後天五行的核心位置，需特別注意能量的平衡與外溢。',
       health:'消化系統、脾胃、整體免疫力',
       best:['紅色系','紫色系'],
       second:['黃色系','棕色系','白色','銀色'],
       avoid:['綠色系','藍色系','黑色','深灰色','極深藍'] },
  6: { element:'金', bagua:'乾', symbol:'天', star:'天王星', virtue:'義',
       type:'正直型',
       persona:'不喜歡阿諛、奉承、諂媚，屬實力派，以工作取勝的人。心思聰明、有先見之明、處世成熟。重義氣，有顆熱忱的心，是個標準的大善人，具有能上善下的氣質。是屬天～君主的格局，一旦說出口的承諾，如同「君無戲言」，很少會讓自己有做不到的時候，朋友對您也是很信任。',
       health:'呼吸系統、血液循環方面的毛病；支氣管、大腸、腎臟、婦科、攝護腺也要留心',
       best:['黃色系','棕色系'],
       second:['白色','銀色','淺灰色','黑色','深灰色','極深藍'],
       avoid:['紅色系','紫色系','綠色系','藍色系'] },
  7: { element:'金', bagua:'兌', symbol:'澤', star:'金星', virtue:'義',
       type:'浪漫型',
       persona:'思想自然率真、口才伶俐、重義氣。有很好的人緣與說服力。不喜歡呆板單一的生活與工作。較喜歡追求浪漫、優雅、活潑、多彩的生活。財運佳，但大多要到中年，財運才能穩固。年輕時通常需較辛苦、接受磨練。',
       health:'身體濕氣重、肺部、骨骼、大腸、腎臟、婦科、攝護腺、骨、耳朵方面的疾病',
       best:['黃色系','棕色系'],
       second:['白色','銀色','淺灰色','黑色','深灰色','極深藍'],
       avoid:['紅色系','紫色系','綠色系','藍色系'] },
  8: { element:'土', bagua:'艮', symbol:'山', star:'冥王星', virtue:'信',
       type:'內斂型',
       persona:'外柔內剛、待人柔和、堅持自己的信念行事。個性上有一定程度的擇善固執，做人做事的道理比較多、討厭人不守信用。服務熱誠，會用實際的關心、體貼的動作待人。不善於表達內心的情感，內心如火的熱情，需要鼓勵和激發，才會表露出來。',
       health:'神經系統與消化系統方面的疾病',
       best:['紅色系','紫色系'],
       second:['黃色系','棕色系','白色','銀色','淺灰色'],
       avoid:['綠色系','藍色系','黑色','深灰色','極深藍'] },
  9: { element:'火', bagua:'離', symbol:'火', star:'火星', virtue:'禮',
       type:'敏捷型',
       persona:'個性熱情如火，先天有著積極的熱情因子。行動力強，遇事斷然處之，積極又敢挑戰，是事業的急先鋒，辦事迅速解決效率良好。但做事有時固執又沒計劃性，常是憑一時的熱忱。若能在事前有周詳縝密的計劃，而非只憑一時的熱誠，就能有大成就。有願意付出心力照顧、關心他人的個性，對親近的朋友與家人往往特別累積了相當多的良好人脈資源。討厭被人潑冷水。',
       health:'心臟、血液、眼睛、小腸方面的疾病',
       best:['綠色系','藍色系'],
       second:['紅色系','紫色系','黃色系','棕色系'],
       avoid:['黑色','深灰色','極深藍','白色','銀色','淺灰色'] }
};

// 五行生克
const FIVE_GENERATE      = { '木':'火','火':'土','土':'金','金':'水','水':'木' }; // 我生（洩）
const FIVE_GENERATED_BY  = { '木':'水','火':'木','土':'火','金':'土','水':'金' }; // 生我（補）
const FIVE_OVERCOME      = { '木':'土','火':'金','土':'水','金':'木','水':'火' }; // 我克（耗）
const FIVE_OVERCOME_BY   = { '木':'金','火':'水','土':'木','金':'火','水':'土' }; // 克我（傷）

// 計算靈數：把日期所有數字反覆相加直到單位數
function calcLingshu(year, month, day) {
  const digits = `${year}${String(month).padStart(2,'0')}${String(day).padStart(2,'0')}`.split('').map(Number);
  const sum0 = digits.reduce((a,b)=>a+b, 0);
  const steps = [{stage:'初始相加', value:digits.join('+'), sum:sum0}];
  let n = sum0;
  while (n >= 10) {
    const ds = String(n).split('').map(Number);
    const next = ds.reduce((a,b)=>a+b, 0);
    steps.push({stage:'再相加', value:ds.join('+'), sum:next});
    n = next;
  }
  return { lingshu:n, steps, sum0 };
}

function setupLingshu() {
  const btnCalc = document.getElementById('btn-calc-lingshu');
  const btnClear = document.getElementById('btn-clear-lingshu');
  const btnPrint = document.getElementById('btn-print-lingshu');
  if (!btnCalc || !btnClear) return;
  btnCalc.onclick = () => analyzeLingshu();
  btnClear.onclick = () => {
    document.getElementById('lingshu-name').value = '';
    document.getElementById('lingshu-year').value = '';
    document.getElementById('lingshu-month').value = '';
    document.getElementById('lingshu-day').value = '';
    document.getElementById('analysis-lingshu').innerHTML = '<div class="empty-msg">請輸入西元出生年月日，按「📊 計算生命靈數」即可分析。</div>';
  };
  if (btnPrint) {
    btnPrint.onclick = () => {
      // 若分析還沒跑過，先自動算一次再列印
      const target = document.getElementById('analysis-lingshu');
      const hasAnalysis = target && !target.querySelector('.empty-msg');
      if (!hasAnalysis) {
        analyzeLingshu();
        // 確認分析有跑出來才印（沒輸入年月日的話會顯示警告，不該印）
        const after = target.querySelector('.empty-msg');
        if (after) return;
      }
      setTimeout(() => exportPDF('lingshu'), 100);
    };
  }
  ['lingshu-year','lingshu-month','lingshu-day','lingshu-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keypress', e => { if (e.key === 'Enter') analyzeLingshu(); });
  });
}

function renderLingshuColorRow(label, colors, accent, bg) {
  return `<div style="margin:8px 0;padding:8px 12px;background:${bg};border-left:3px solid ${accent};border-radius:4px;font-size:13.5px;line-height:1.7;color:#333;"><b>${label}：</b>${colors.join('、')}</div>`;
}

function analyzeLingshu() {
  const name = (document.getElementById('lingshu-name').value || '').trim();
  const year = parseInt(document.getElementById('lingshu-year').value);
  const month = parseInt(document.getElementById('lingshu-month').value);
  const day = parseInt(document.getElementById('lingshu-day').value);
  const target = document.getElementById('analysis-lingshu');

  if (!year || year < 1900 || year > 2100) { target.innerHTML = '<div class="empty-msg" style="color:#c0392b;">⚠ 請輸入有效的西元出生年（1900-2100）。</div>'; return; }
  if (!month || month < 1 || month > 12) { target.innerHTML = '<div class="empty-msg" style="color:#c0392b;">⚠ 請輸入有效的月份（1-12）。</div>'; return; }
  if (!day || day < 1 || day > 31) { target.innerHTML = '<div class="empty-msg" style="color:#c0392b;">⚠ 請輸入有效的日（1-31）。</div>'; return; }

  const result = calcLingshu(year, month, day);
  const data = LINGSHU_DATA[result.lingshu];
  const subj = name || '您';
  const me = data.element;
  const generates = FIVE_GENERATE[me];
  const generatedBy = FIVE_GENERATED_BY[me];
  const overcomes = FIVE_OVERCOME[me];
  const overcomeBy = FIVE_OVERCOME_BY[me];

  let html = '';

  // 結果摘要
  html += `<div class="layer-card" style="border-left-color:#9b59b6;background:linear-gradient(to right,#faf3fb,#f3e8f5);">`;
  html += `<div class="layer-title" style="color:#7d3c98;font-size:18px;">🔮 ${subj}的生命靈數結果</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:12px 0;">`;
  html += `<div style="background:#fff;padding:10px;border-radius:6px;border-left:3px solid #9b59b6;text-align:center;"><div style="font-size:11px;color:#888;">出生</div><div style="font-size:14px;font-weight:600;color:#333;">${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')}</div></div>`;
  html += `<div style="background:#fff;padding:10px;border-radius:6px;border-left:3px solid #c0392b;text-align:center;"><div style="font-size:11px;color:#888;">三者之合（靈數）</div><div style="font-size:24px;font-weight:700;color:#c0392b;">${result.lingshu}</div></div>`;
  html += `<div style="background:#fff;padding:10px;border-radius:6px;border-left:3px solid #d4a574;text-align:center;"><div style="font-size:11px;color:#888;">後天五行</div><div style="font-size:24px;font-weight:700;color:#8b4513;">${data.element}</div></div>`;
  html += `<div style="background:#fff;padding:10px;border-radius:6px;border-left:3px solid #5b8c3e;text-align:center;"><div style="font-size:11px;color:#888;">八卦・自然</div><div style="font-size:14px;font-weight:600;color:#333;">${data.bagua}・${data.symbol}</div></div>`;
  html += `<div style="background:#fff;padding:10px;border-radius:6px;border-left:3px solid #2980b9;text-align:center;"><div style="font-size:11px;color:#888;">九星五行</div><div style="font-size:14px;font-weight:600;color:#333;">${data.star}</div></div>`;
  html += `<div style="background:#fff;padding:10px;border-radius:6px;border-left:3px solid #e67e22;text-align:center;"><div style="font-size:11px;color:#888;">五德</div><div style="font-size:24px;font-weight:700;color:#e67e22;">《${data.virtue}》</div></div>`;
  html += `</div>`;
  // 計算過程
  html += `<div style="background:#fff;padding:10px 12px;border-radius:5px;font-size:13px;color:#555;line-height:1.8;border:1px dashed #d4a574;">`;
  html += `<b>計算過程</b>：${year}/${String(month).padStart(2,'0')}/${String(day).padStart(2,'0')} → ${result.steps[0].value} = <b>${result.steps[0].sum}</b>`;
  for (let i = 1; i < result.steps.length; i++) {
    html += ` → ${result.steps[i].value} = <b>${result.steps[i].sum}</b>`;
  }
  html += ` → 靈數 <b style="color:#c0392b;font-size:16px;">${result.lingshu}</b>（${data.element}・${data.bagua}）`;
  html += `</div></div>`;

  // 9 宮格示意圖
  html += `<div class="layer-card"><div class="layer-title">📊 1-9 宮格示意（紅框＝您所在位置）</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(3,80px);grid-gap:6px;justify-content:center;margin:14px auto;max-width:280px;">`;
  for (let i = 1; i <= 9; i++) {
    const isMe = (i === result.lingshu);
    const cellData = LINGSHU_DATA[i];
    html += `<div style="background:${isMe?'#fef0eb':'#f9f5ee'};border:${isMe?'3px':'1px'} solid ${isMe?'#c0392b':'#d4b896'};border-radius:6px;padding:8px 4px;text-align:center;${isMe?'box-shadow:0 2px 6px rgba(192,57,43,0.2);':''}">`;
    html += `<div style="font-size:24px;font-weight:700;color:${isMe?'#c0392b':'#8b4513'};">${i}</div>`;
    html += `<div style="font-size:11px;color:#666;line-height:1.3;">${cellData.element}・${cellData.bagua}</div>`;
    html += `<div style="font-size:10px;color:#888;">《${cellData.virtue}》</div>`;
    html += `</div>`;
  }
  html += `</div></div>`;

  // 個性與表現
  html += `<div class="layer-card" style="border-left-color:#5b8c3e;">`;
  html += `<div class="layer-title">🌱 ${subj}的後天五行：屬${result.lingshu}【${data.element}】《${data.virtue}》</div>`;
  html += `<div style="background:#fff8f0;padding:10px 12px;border-radius:5px;margin:10px 0;font-size:13.5px;line-height:1.8;color:#555;border-left:3px solid #d4a574;">`;
  html += `<b>《${data.type}》的個性：</b>${data.persona}`;
  html += `</div></div>`;

  // 健康提醒
  html += `<div class="layer-card" style="border-left-color:#c0392b;background:linear-gradient(to right,#fff8f5,#fef0eb);">`;
  html += `<div class="layer-title" style="color:#c0392b;">💊 健康提醒</div>`;
  html += `<div style="background:#fff;padding:10px 12px;border-radius:5px;font-size:13.5px;line-height:1.7;color:#8b3a1a;border-left:3px solid #c0392b;">`;
  html += `※ ${subj}健康上要注意：<b>${data.health}</b>`;
  html += `</div></div>`;

  // 開運顏色
  html += `<div class="layer-card" style="border-left-color:#d4a574;background:#fffbf3;">`;
  html += `<div class="layer-title" style="color:#8b4513;">🎨 開運顏色（床單被套與隨身物品／能量礦石）</div>`;
  html += renderLingshuColorRow('◎ 最佳的顏色', data.best, '#27ae60', '#f0f9f0');
  html += renderLingshuColorRow('◎ 其次的顏色', data.second, '#2980b9', '#e8f4f9');
  html += renderLingshuColorRow('※ 不適合的顏色', data.avoid, '#c0392b', '#fdecea');
  html += `</div>`;

  // 五行生克分析
  html += `<div class="layer-card" style="border-left-color:#2980b9;">`;
  html += `<div class="layer-title">☯ 五行生克分析（${subj}屬${data.element}）</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin:10px 0;">`;
  html += `<div style="background:#f0f9f0;padding:10px;border-radius:5px;border-left:3px solid #27ae60;font-size:13px;line-height:1.6;"><b style="color:#1e6e3a;">生我者（補）：${generatedBy}</b><br>${generatedBy} 生 ${data.element}，${generatedBy} 是您的<b>母親五行</b>，補您的能量。</div>`;
  html += `<div style="background:#fef9f0;padding:10px;border-radius:5px;border-left:3px solid #d4a574;font-size:13px;line-height:1.6;"><b style="color:#8b4513;">同我者（旺）：${data.element}</b><br>相同五行為「比和」，能量同向加強。</div>`;
  html += `<div style="background:#fef9f5;padding:10px;border-radius:5px;border-left:3px solid #e67e22;font-size:13px;line-height:1.6;"><b style="color:#a85814;">我生者（洩）：${generates}</b><br>${data.element} 生 ${generates}，您的能量會流向 ${generates}，過多會洩氣。</div>`;
  html += `<div style="background:#f5f5fa;padding:10px;border-radius:5px;border-left:3px solid #8e44ad;font-size:13px;line-height:1.6;"><b style="color:#6c3483;">我克者（耗）：${overcomes}</b><br>${data.element} 克 ${overcomes}，您能制約 ${overcomes}，但需耗能。</div>`;
  html += `<div style="background:#fdecea;padding:10px;border-radius:5px;border-left:3px solid #c0392b;font-size:13px;line-height:1.6;"><b style="color:#922b1c;">克我者（傷）：${overcomeBy}</b><br>${overcomeBy} 克 ${data.element}，${overcomeBy} 會壓制您，需避免。</div>`;
  html += `</div></div>`;

  // 整體建議
  html += `<div class="layer-card" style="border-left-color:#7d3c98;background:#faf3fb;">`;
  html += `<div class="layer-title" style="color:#7d3c98;">🌟 整體建議</div>`;
  html += `<div style="background:#fff;padding:10px 12px;border-radius:5px;font-size:13.5px;line-height:1.8;color:#555;">`;
  html += `<b>1. 先天五行 vs 後天五行：</b>先天五行是【命】（與生俱來的稟賦），後天五行是【運】。透過風水（家中顏色配置）、中醫（飲食調理）、命理（能量礦石、開運物品）等可調整後天五行，以達趨吉避凶的作用。<br><br>`;
  html += `<b>2. 隨身物品建議：</b>戴上「最佳顏色」系的能量礦石，避免「不適合顏色」系的物品。床單被套也以最佳顏色為主。<br><br>`;
  html += `<b>3. 五行能量平衡：</b>當您能量不足時，多接觸「生我者（${generatedBy}）」的元素；當您能量過剛時，可透過「我生者（${generates}）」洩出；避免長期接觸「克我者（${overcomeBy}）」的元素。<br><br>`;
  html += `<b>4. 健康調理：</b>請特別留意 ${data.health}，可透過中醫調理或日常保養加強。`;
  html += `</div></div>`;

  target.innerHTML = html;
}

/* ===== Tab 切換 ===== */

/* ===== Aries 站整合（append）：濟公棋卦頁籤切換與啟動 =====
   前世因果＝本站原功能（jigongPanelPastlife）；５棋單卦／３２棋命卦／速查表＝上方移植引擎。
   引擎程式碼原封照抄（含 setupPastLife/lingshu 等未使用函式，不呼叫即惰性），只加本段整合碼。 */
let jigongBuguaStarted = false;
function startJigongBugua() {
  if (jigongBuguaStarted) return;
  jigongBuguaStarted = true;
  setupSingle();
  setupNatal();
  renderReference();
  renderBoard('board-single', board);
}
(function setupJigongBuguaTabs() {
  document.querySelectorAll('#jigongTabs .tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#jigongTabs .tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const w = tab.dataset.tab;
      const past = (w === 'pastlife');
      document.getElementById('jigongPanelPastlife').style.display = past ? '' : 'none';
      document.getElementById('jigongPanelBugua').style.display = past ? 'none' : '';
      if (!past) {
        startJigongBugua();
        document.querySelectorAll('#jigongPanelBugua .panel').forEach((p) =>
          p.classList.toggle('active', p.id === 'panel-' + w));
      }
    });
  });
})();
