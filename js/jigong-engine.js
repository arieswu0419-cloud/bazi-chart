// 濟公棋卦・前世因果：5 子卦盤，依中宮第一支棋判斷前世性別／身分，並比對中宮與其餘 4 個位置
// 是否為同一棋種家族，據此解讀前世關係。規則來源：書版《改寫人生的象棋卜卦》格局說明章節，
// 並用官方參考網站 https://adan3862936.github.io/bugua-system/ 速查表 + 前世因果頁面多組實際案例互動測試交叉驗證。

// 14 支棋：紅方 帥仕相俥傌炮兵／黑方 將士象車馬包卒。同一個字（如帥／將）屬於同一個「棋種家族」，
// 家族才是判斷前世身分／關係的依據；顏色只用來判斷前世性別，以及配對時是「同字同色」還是「同字異色」。
const JIGONG_PIECES = [
  { char: "帥", color: "red", family: "將帥" },
  { char: "仕", color: "red", family: "士仕" },
  { char: "相", color: "red", family: "象相" },
  { char: "俥", color: "red", family: "車俥" },
  { char: "傌", color: "red", family: "馬傌" },
  { char: "炮", color: "red", family: "包炮" },
  { char: "兵", color: "red", family: "卒兵" },
  { char: "將", color: "black", family: "將帥" },
  { char: "士", color: "black", family: "士仕" },
  { char: "象", color: "black", family: "象相" },
  { char: "車", color: "black", family: "車俥" },
  { char: "馬", color: "black", family: "馬傌" },
  { char: "包", color: "black", family: "包炮" },
  { char: "卒", color: "black", family: "卒兵" }
];

// 前世身分（依中宮第一支棋的家族）：文字採書版《改寫人生的象棋卜卦》格局說明章節原文
const JIGONG_IDENTITY_BY_FAMILY = {
  "將帥": "君王、元帥、高層級的領袖或領導人",
  "士仕": "官職、教師、將軍、將士",
  "象相": "修行人、宰相、員外",
  "車俥": "團隊領導人、老闆",
  "馬傌": "業務、講師、顧問、謀士",
  "包炮": "帥哥美女、演藝或風塵人士、商人",
  "卒兵": "工人、農民、士兵、小生意人"
};

// 前世關係：5 個位置兩兩配對共 10 組，只有同家族異色才判讀。每組依相對位置歸到 5 種類別之一
// （書版《改寫人生的象棋卜卦》格局說明章節原文）：
//   adjacentLR：中與左、中與右（1與2、1與3）
//   adjacentUD：中與上、中與下（1與4、1與5）
//   oppositeUD：上與下（4與5，隔代／師公徒孫／祖孫）
//   oppositeLR：左與右（2與3，非直接／非同師父／堂表兄弟姊妹）
//   diagonal：左上、左下、右上、右下（2與4、2與5、3與4、3與5）
// 卒兵家族的 adjacentLR 比較特別：文字依「兵」「卒」誰在中宮、誰在左／右而不同（見 jigongZubingAdjacentText），
// 不是單純同家族就給固定文字。將帥家族「考證上有太多不同可能性」，不下判斷，只給提示文字。
const JIGONG_RELATION_RULES = {
  "卒兵": {
    adjacentLR: null, // 見 jigongZubingAdjacentText
    adjacentUD: "父母、子女",
    oppositeUD: "祖父母與孫子",
    oppositeLR: "堂、表兄弟姊妹",
    diagonal: "叔叔、伯父、阿姨、嬸嬸與姪子、姪女"
  },
  "包炮": {
    adjacentLR: "短暫的情人（上下左右相鄰）",
    adjacentUD: "短暫的情人（上下左右相鄰）",
    oppositeUD: "外遇的對象、情人或小妾（包炮隔山）",
    oppositeLR: "外遇的對象、情人或小妾（包炮隔山）",
    diagonal: "有情愫但沒有真正交流的對象（包炮斜對）"
  },
  "馬傌": {
    adjacentLR: "短暫的情人",
    adjacentUD: "有感情、情愫的長輩晚輩",
    oppositeUD: "喜歡但沒有真正交流的對象（馬傌分開）",
    oppositeLR: "喜歡但沒有真正交流的對象（馬傌分開）",
    diagonal: "長時間的情人（馬傌斜對）"
  },
  "車俥": {
    adjacentLR: "合作的工作或事業夥伴",
    adjacentUD: "職場的上司、下屬或上下游廠商",
    oppositeUD: "隔代職場的上司、下屬",
    oppositeLR: "非直接合作的夥伴",
    diagonal: "非直接合作的上司、下屬"
  },
  "象相": {
    adjacentLR: "同學、同修",
    adjacentUD: "師父、徒弟",
    oppositeUD: "師公、徒孫",
    oppositeLR: "非同師父之同學",
    diagonal: "非直接之師父、徒弟（師叔、師伯）"
  },
  "士仕": {
    adjacentLR: "同僚",
    adjacentUD: "官場的上司、下屬",
    oppositeUD: "隔代的上司、下屬",
    oppositeLR: "非直屬之同僚",
    diagonal: "非直屬之上司、下屬"
  },
  "將帥": { adjacentLR: null, adjacentUD: null, oppositeUD: null, oppositeLR: null, diagonal: null }
};
const JIGONG_JIANGSHUAI_NOTE = "將／帥實際案例太多不同可能性，建議另外再起一卦細看。";
const JIGONG_SAME_COLOR_NOTE = "同字同色（偏向消耗格，不屬於典型前世關係，建議另外起卦細看）";
const JIGONG_NO_MATCH_NOTE = "5 個位置之間沒有同字配對 → 可能是新緣分、無前世累積。";

// 卒兵家族「中與左」「中與右」的文字要看兵／卒誰在中宮、誰在左或右（其他家族的 adjacentLR 不用管這個）
function jigongZubingAdjacentText(centerChar, otherPos) {
  if (centerChar === "兵") return otherPos === "left" ? "對方是你的妻子" : "對方是你的親兄弟姊妹";
  return otherPos === "right" ? "對方是你的老公" : "對方是你的親兄弟姊妹";
}

// 位置固定角色標籤（前世因果頁面沒有婚姻狀態欄位，左右一律顯示「老婆／老公」，跟參考網站實測一致）
const JIGONG_POSITION_LABEL = {
  center: "中宮（自己）",
  left: "左（女平輩／老婆）",
  right: "右（男平輩／老公）",
  top: "上（長輩／老闆）",
  bottom: "下（晚輩／子女）"
};

// 5 個位置兩兩配對，共 10 組；category 決定套用哪一種關係文字
const JIGONG_POSITION_PAIRS = [
  { a: "center", b: "left", category: "adjacentLR" },
  { a: "center", b: "right", category: "adjacentLR" },
  { a: "center", b: "top", category: "adjacentUD" },
  { a: "center", b: "bottom", category: "adjacentUD" },
  { a: "top", b: "bottom", category: "oppositeUD" },
  { a: "left", b: "right", category: "oppositeLR" },
  { a: "left", b: "top", category: "diagonal" },
  { a: "left", b: "bottom", category: "diagonal" },
  { a: "right", b: "top", category: "diagonal" },
  { a: "right", b: "bottom", category: "diagonal" }
];

function jigongFindPiece(char) {
  return JIGONG_PIECES.find((p) => p.char === char) || null;
}

function calculateJigongPastLife(pieces) {
  const centerChar = pieces.center;
  if (!centerChar) return null;
  const centerPiece = jigongFindPiece(centerChar);
  if (!centerPiece) return null;

  const pastLifeGender = centerPiece.color === "red" ? "男" : "女";
  const identity = JIGONG_IDENTITY_BY_FAMILY[centerPiece.family] || "";

  const relations = [];
  JIGONG_POSITION_PAIRS.forEach(({ a, b, category }) => {
    const charA = pieces[a];
    const charB = pieces[b];
    if (!charA || !charB) return;
    const pieceA = jigongFindPiece(charA);
    const pieceB = jigongFindPiece(charB);
    if (!pieceA || !pieceB || pieceA.family !== pieceB.family) return;

    const family = pieceA.family;
    const labelA = JIGONG_POSITION_LABEL[a];
    const labelB = JIGONG_POSITION_LABEL[b];
    if (family === "將帥") {
      relations.push({ a, b, labelA, labelB, charA, charB, text: JIGONG_JIANGSHUAI_NOTE });
      return;
    }
    const sameColor = pieceA.color === pieceB.color;
    let text;
    if (sameColor) {
      text = JIGONG_SAME_COLOR_NOTE;
    } else if (family === "卒兵" && category === "adjacentLR") {
      // adjacentLR 這個分類在 JIGONG_POSITION_PAIRS 裡固定是 a="center"、b="left"/"right"，
      // 所以 charA 一定是中宮那支棋，b 就是左或右
      text = jigongZubingAdjacentText(charA, b);
    } else {
      text = JIGONG_RELATION_RULES[family][category];
    }
    if (!text) return;
    relations.push({ a, b, labelA, labelB, charA, charB, sameColor, text });
  });

  return {
    centerChar,
    centerColor: centerPiece.color,
    centerFamily: centerPiece.family,
    pastLifeGender,
    identity,
    relations,
    noMatchNote: relations.length ? null : JIGONG_NO_MATCH_NOTE
  };
}
