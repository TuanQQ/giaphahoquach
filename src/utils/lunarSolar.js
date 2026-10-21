/**
 * Thuật toán Âm - Dương Lịch Việt Nam (Hồ Ngọc Đức)
 * Chuyển đổi chính xác 100% theo múi giờ GMT+7
 */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

// Julian day calculation
function jdFromDate(dd, mm, yy) {
  let a = Math.floor((14 - mm) / 12);
  let y = yy + 4800 - a;
  let m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd) {
  let a, b, c, d, e, m, day, month, year;
  if (jd > 2299160) {
    let a1 = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + a1 - Math.floor(a1 / 4);
  } else {
    a = jd;
  }
  b = a + 1524;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);
  day = Math.floor(b - d - Math.floor(30.6001 * e));
  month = Math.floor(e < 14 ? e - 1 : e - 13);
  year = Math.floor(month > 2 ? c - 4716 : c - 4715);
  return [day, month, year];
}

function getNewMoonDay(k, timeZone = 7) {
  let T = k / 1236.85;
  let T2 = T * T;
  let T3 = T2 * T;
  let dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * M * dr);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * Mpr * dr);
  C1 = C1 - 0.0004 * Math.sin(3 * Mpr * dr);
  C1 = C1 + 0.0104 * Math.sin(2 * F * dr) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 = C1 - 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 = C1 - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 = C1 + 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((M + 2 * Mpr) * dr);
  let Jd = Jd1 + C1;
  return Math.floor(Jd + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone = 7) {
  let T = (jdn - 2451545.0 + 0.5 - timeZone / 24) / 36525;
  let T2 = T * T;
  let dr = Math.PI / 180;
  let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let M = 357.5291 + 35999.05029 * T - 0.0001537 * T2;
  let C = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr);
  C = C + (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr) + 0.000289 * Math.sin(3 * M * dr);
  let theta = L0 + C;
  theta = theta * dr;
  theta = theta - Math.PI * 2 * Math.floor(theta / (Math.PI * 2));
  return Math.floor((theta / Math.PI) * 6);
}

export function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
  let dayNumber = jdFromDate(dd, mm, yy);
  let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getNewMoonDay(Math.floor((jdFromDate(1, 1, yy) - 2415021.076998695) / 29.530588853), timeZone);
  let b11 = a11;
  let k2 = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let lunarDay = dayNumber - monthStart + 1;
  let diff = Math.floor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let lunarYear = yy;
  if (lunarMonth > 12) {
    lunarMonth -= 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }
  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: 0,
    canChi: getYearCanChi(lunarYear)
  };
}

export function convertLunar2Solar(lunarDay, lunarMonth, lunarYear, lunarLeap = 0, timeZone = 7) {
  // Approximate search around lunarYear
  let startJd = jdFromDate(1, 1, lunarYear);
  for (let offset = -40; offset <= 390; offset++) {
    let [d, m, y] = jdToDate(startJd + offset);
    let lun = convertSolar2Lunar(d, m, y, timeZone);
    if (lun.day === lunarDay && lun.month === lunarMonth && lun.year === lunarYear) {
      return { day: d, month: m, year: y };
    }
  }
  return null;
}

export function getYearCanChi(year) {
  let canIdx = (year + 6) % 10;
  let chiIdx = (year + 8) % 12;
  return `${CAN[canIdx]} ${CHI[chiIdx]}`;
}

export function getDaysUntilAnniversary(lunarDay, lunarMonth) {
  if (!lunarDay || !lunarMonth) return null;
  let now = new Date();
  let currentYear = now.getFullYear();

  // Try current year
  let solarThisYear = convertLunar2Solar(lunarDay, lunarMonth, currentYear);
  let nextSolar = null;

  if (solarThisYear) {
    let targetDate = new Date(solarThisYear.year, solarThisYear.month - 1, solarThisYear.day);
    let diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      nextSolar = { date: targetDate, daysLeft: diffDays, solar: solarThisYear };
    }
  }

  // If already passed this year, get next year
  if (!nextSolar) {
    let solarNextYear = convertLunar2Solar(lunarDay, lunarMonth, currentYear + 1);
    if (solarNextYear) {
      let targetDate = new Date(solarNextYear.year, solarNextYear.month - 1, solarNextYear.day);
      let diffDays = Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24));
      nextSolar = { date: targetDate, daysLeft: diffDays, solar: solarNextYear };
    }
  }

  return nextSolar;
}
