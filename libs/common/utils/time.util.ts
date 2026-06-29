import { DEFAULT_TIMEZONE } from '@libs/common/constants/time.constants';

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** 유저 TZ 기준 오늘의 UTC 시작·끝 반환 */
export function localDayBounds(timezone: string): { start: Date; end: Date } {
  const tz = resolveTimezone(timezone);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = formatter.format(new Date());
  const tzOffsetMs = getTzOffsetMs(tz, new Date());

  return {
    start: new Date(Date.UTC(...parseDateParts(dateStr), 0, 0, 0, 0) - tzOffsetMs),
    end: new Date(Date.UTC(...parseDateParts(dateStr), 23, 59, 59, 999) - tzOffsetMs),
  };
}

/** 유저 TZ 기준 오늘 날짜 문자열 (캐시 키용) e.g. "2024-01-02" */
export function localDateKey(timezone: string): string {
  const tz = resolveTimezone(timezone);
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

/** "HH:mm" + timezone → 오늘 해당 시각의 UTC Date */
export function hhmmToUtcDate(hhmm: string, timezone: string): Date {
  const tz = resolveTimezone(timezone);
  const [hoursStr, minutesStr] = hhmm.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const minutes = parseInt(minutesStr ?? '0', 10);
  const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
  const tzOffsetMs = getTzOffsetMs(tz, new Date());

  return new Date(Date.UTC(...parseDateParts(dateStr), hours, minutes, 0, 0) - tzOffsetMs);
}

/** null / undefined / "" 를 DEFAULT_TIMEZONE 으로 fallback */
export function resolveTimezone(tz: string | null | undefined): string {
  return tz || DEFAULT_TIMEZONE;
}

function parseDateParts(dateStr: string): [number, number, number] {
  const [year, month, day] = dateStr.split('-').map(Number);
  return [year ?? 0, (month ?? 1) - 1, day ?? 1];
}

function getTzOffsetMs(timezone: string, date: Date): number {
  const utcStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const localStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const toMs = (parts: Intl.DateTimeFormatPart[]) => {
    const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
    return Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
  };

  return toMs(utcStr) - toMs(localStr);
}
