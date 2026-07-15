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

// 前世關係（中宮 vs 其餘 4 個位置，只有同家族異色才判讀）：位置分成「左右」（橫向）跟「上下」（縱向）
// 兩組。卒兵家族實測左右／上下文字相同；其餘家族左右／上下文字不同。將帥家族「考證上有太多不同可能性」，
// 不下判斷，只給提示文字。
const JIGONG_RELATION_BY_FAMILY = {
  "卒兵": { lr: "六親、家人、祖孫、父母子女", ud: "六親、家人、祖孫、父母子女" },
  "包炮": { lr: "短暫的情人（上下左右相鄰）", ud: "短暫的情人（上下左右相鄰）" },
  "馬傌": { lr: "短暫的情人", ud: "有感情、情愫的長輩晚輩" },
  "車俥": { lr: "合作的工作或事業夥伴", ud: "職場的上司、下屬或上下游廠商" },
  "象相": { lr: "同學、同修", ud: "師父、徒弟" },
  "士仕": { lr: "同僚", ud: "官場的上司、下屬" },
  "將帥": { lr: null, ud: null }
};
const JIGONG_JIANGSHUAI_NOTE = "將／帥實際案例太多不同可能性，建議另外再起一卦細看。";
const JIGONG_SAME_COLOR_NOTE = "同字同色（偏向消耗格，不屬於典型前世關係，建議另外起卦細看）";
const JIGONG_NO_MATCH_NOTE = "中央與其他位置沒有同字配對 → 可能是新緣分、無前世累積。";

// 位置固定角色標籤（前世因果頁面沒有婚姻狀態欄位，左右一律顯示「老婆／老公」，跟參考網站實測一致）
const JIGONG_POSITION_LABEL = {
  center: "中宮（自己）",
  left: "左（女平輩／老婆）",
  right: "右（男平輩／老公）",
  top: "上（長輩／老闆）",
  bottom: "下（晚輩／子女）"
};

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
  ["left", "right", "top", "bottom"].forEach((pos) => {
    const char = pieces[pos];
    if (!char) return;
    const piece = jigongFindPiece(char);
    if (!piece || piece.family !== centerPiece.family) return;

    const roleLabel = JIGONG_POSITION_LABEL[pos];
    if (centerPiece.family === "將帥") {
      relations.push({ position: pos, roleLabel, piece: char, text: JIGONG_JIANGSHUAI_NOTE });
      return;
    }
    const sameColor = piece.color === centerPiece.color;
    const isLR = pos === "left" || pos === "right";
    const text = sameColor ? JIGONG_SAME_COLOR_NOTE : JIGONG_RELATION_BY_FAMILY[centerPiece.family][isLR ? "lr" : "ud"];
    relations.push({ position: pos, roleLabel, piece: char, sameColor, text });
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
