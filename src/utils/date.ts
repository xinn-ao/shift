
const WEEK_JP = ["日", "月", "火", "水", "木", "金", "土"];

const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "元日",
  "2026-01-12": "成人の日",
  "2026-02-11": "建国記念の日",
  "2026-02-23": "天皇誕生日",
  "2026-03-20": "春分の日",
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
};

export interface DateItem {
  date: Date;
  year: number;
  month: number;
  day: number;
  week: string | undefined;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  dateStr: string;
}

export interface StaffInfo{
    role: string, 
    name: string, 
    id: string, 
    restDay?: Number, 
    restDayHighlight: boolean, 
    setting?: Number, 
    restDays?:{
        allDays?:number[],
        morningHalf?:number[],
        afternoonHalf?:number[],
        [key: string]: number[] | undefined,
    },
    isSupport?: true, 
    supportDays?:number[], 
    shopCode?: string, 
    shopName?: string
}
/**
 * 日付のフォーマット
 * @param d 
 * @returns 
 */
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 休日かの判断
 * @param d 
 * @returns 
 */
function isRedDay(d: Date): string | undefined {
  return HOLIDAYS_2026[fmtDate(d)];
}

/**
 * 
 * @returns カレンダーの作成（今日から、1月間のカレンダー）
 */
export function getJpDateRange(): DateItem[] {
  const result: DateItem[] = [];
  const today = new Date();
  const currYear = today.getFullYear();
  const currMonth = today.getMonth();
  const currDay = today.getDate();

  let nextMonth = currMonth + 1;
  let targetYear = currYear;
  if (nextMonth > 11) {
    nextMonth = 0;
    targetYear += 1;
  }
  let nextSameDay = new Date(targetYear, nextMonth, currDay);
  if (nextSameDay.getMonth() !== nextMonth) {
    nextSameDay = new Date(targetYear, nextMonth + 1, 0);
  }

  const endDate = new Date(nextSameDay);
  endDate.setDate(endDate.getDate() - 1);

  const loop = new Date(today);
  while (loop <= endDate) {
    const weekIdx = loop.getDay();
    const holidayName = isRedDay(loop);
    const isWeekend = weekIdx === 0 || weekIdx === 6;
    const isHoliday = !!holidayName || weekIdx === 0;

    result.push({
      date: new Date(loop),
      year: loop.getFullYear(),
      month: loop.getMonth() + 1,
      day: loop.getDate(),
      week: WEEK_JP[weekIdx],
      isWeekend,
      isHoliday,
      holidayName,
      dateStr: fmtDate(loop),
    });

    loop.setDate(loop.getDate() + 1);
  }
  return result;
}