// 國曆→農曆轉換：演算法與 1900-2100 潤大小資訊表沿用自公開的 JJonline 農曆演算法
// （這是華文開源社群長年廣泛使用、驗證過的標準寫法，非自行推算），這裡只保留計算
// 農曆年/月/日需要的最小部分（不含生肖／干支／節氣等這次用不到的欄位）。
// 已用已知農曆新年日期核對過：2024-02-10、2025-01-29、2000-02-05 均正確對應正月初一。
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520
];
const SOLAR_MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function lunarLeapMonth(y) {
  return LUNAR_INFO[y - 1900] & 0xf;
}
function lunarLeapDays(y) {
  if (lunarLeapMonth(y)) {
    return LUNAR_INFO[y - 1900] & 0x10000 ? 30 : 29;
  }
  return 0;
}
function lunarMonthDays(y, m) {
  if (m > 12 || m < 1) return -1;
  return LUNAR_INFO[y - 1900] & (0x10000 >> m) ? 30 : 29;
}
function lunarYearDays(y) {
  let sum = 348;
  const info = LUNAR_INFO[y - 1900];
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += info & i ? 1 : 0;
  }
  return sum + lunarLeapDays(y);
}
function solarDays(y, m) {
  if (m > 12 || m < 1) return -1;
  if (m === 2) {
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
  }
  return SOLAR_MONTH_DAYS[m - 1];
}

// 國曆 y/m/d → 農曆 {lYear, lMonth, lDay, isLeap}，範圍 1900/1/31 ~ 2100/12/1
function solarToLunar(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d);
  if (!y || !m || !d) return { error: "請輸入正確的西元出生年月日" };
  if (y < 1900 || y > 2100) return { error: "農曆換算僅支援西元1900年～2100年" };
  if (y === 1900 && m === 1 && d < 31) return { error: "農曆換算僅支援西元1900年1月31日之後" };
  if (m < 1 || m > 12) return { error: "月份請輸入1～12" };
  const maxDay = solarDays(y, m);
  if (d < 1 || d > maxDay) return { error: "日期不正確" };

  const objDate = new Date(Date.UTC(y, m - 1, d));
  let offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;

  let i, temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lunarYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  const lYear = i;
  const leapMonth = lunarLeapMonth(lYear);
  let isLeap = false;

  for (i = 1; i < 13 && offset > 0; i++) {
    if (leapMonth > 0 && i === leapMonth + 1 && isLeap === false) {
      --i;
      isLeap = true;
      temp = lunarLeapDays(lYear);
    } else {
      temp = lunarMonthDays(lYear, i);
    }
    if (isLeap === true && i === leapMonth + 1) {
      isLeap = false;
    }
    offset -= temp;
  }
  if (offset === 0 && leapMonth > 0 && i === leapMonth + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }
  if (offset < 0) {
    offset += temp;
    --i;
  }
  const lMonth = i;
  const lDay = offset + 1;
  return { lYear, lMonth, lDay, isLeap };
}
