export interface SgHolidaysInput {
  year?: number;
  start_date?: string;
  num_business_days?: number;
}

export interface PublicHoliday {
  date: string;
  name: string;
  day_of_week: string;
  observed_date?: string;
  observed_note?: string;
}

export interface SgHolidaysResult {
  year: number;
  holidays: PublicHoliday[];
  total_holidays: number;
  business_day_calculation?: {
    start_date: string;
    num_business_days: number;
    end_date: string;
    calendar_days: number;
    holidays_in_range: string[];
    weekends_in_range: number;
  };
  summary: string;
}

const HOLIDAYS_DATA: Record<number, PublicHoliday[]> = {
  2025: [
    { date: "2025-01-01", name: "New Year's Day", day_of_week: "Wednesday" },
    { date: "2025-01-29", name: "Chinese New Year (Day 1)", day_of_week: "Wednesday" },
    { date: "2025-01-30", name: "Chinese New Year (Day 2)", day_of_week: "Thursday" },
    { date: "2025-03-31", name: "Hari Raya Puasa", day_of_week: "Monday" },
    { date: "2025-04-18", name: "Good Friday", day_of_week: "Friday" },
    { date: "2025-05-01", name: "Labour Day", day_of_week: "Thursday" },
    { date: "2025-05-12", name: "Vesak Day", day_of_week: "Monday" },
    { date: "2025-06-07", name: "Hari Raya Haji", day_of_week: "Saturday", observed_date: "2025-06-09", observed_note: "Observed on Monday 9 June as 7 June falls on Saturday" },
    { date: "2025-08-09", name: "National Day", day_of_week: "Saturday", observed_date: "2025-08-11", observed_note: "Observed on Monday 11 August as 9 August falls on Saturday" },
    { date: "2025-10-20", name: "Deepavali", day_of_week: "Monday" },
    { date: "2025-12-25", name: "Christmas Day", day_of_week: "Thursday" },
  ],
  2026: [
    { date: "2026-01-01", name: "New Year's Day", day_of_week: "Thursday" },
    { date: "2026-02-17", name: "Chinese New Year (Day 1)", day_of_week: "Tuesday" },
    { date: "2026-02-18", name: "Chinese New Year (Day 2)", day_of_week: "Wednesday" },
    { date: "2026-03-20", name: "Hari Raya Puasa", day_of_week: "Friday" },
    { date: "2026-04-03", name: "Good Friday", day_of_week: "Friday" },
    { date: "2026-05-01", name: "Labour Day", day_of_week: "Friday" },
    { date: "2026-05-31", name: "Vesak Day", day_of_week: "Sunday", observed_date: "2026-06-01", observed_note: "Observed on Monday 1 June as 31 May falls on Sunday" },
    { date: "2026-05-27", name: "Hari Raya Haji", day_of_week: "Wednesday" },
    { date: "2026-08-09", name: "National Day", day_of_week: "Sunday", observed_date: "2026-08-10", observed_note: "Observed on Monday 10 August as 9 August falls on Sunday" },
    { date: "2026-11-08", name: "Deepavali", day_of_week: "Sunday", observed_date: "2026-11-09", observed_note: "Observed on Monday 9 November as 8 November falls on Sunday" },
    { date: "2026-12-25", name: "Christmas Day", day_of_week: "Friday" },
  ],
};

function getDayOfWeek(date: Date): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getHolidayDatesSet(year: number): Set<string> {
  const holidays = HOLIDAYS_DATA[year] || [];
  const dateSet = new Set<string>();
  for (const h of holidays) {
    // Use observed date if available (the actual day off), otherwise use the holiday date
    const effectiveDate = h.observed_date || h.date;
    dateSet.add(effectiveDate);
    // Also add the original date if it differs from observed
    dateSet.add(h.date);
  }
  return dateSet;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function calculateBusinessDays(
  startDateStr: string,
  numDays: number
): {
  end_date: string;
  calendar_days: number;
  holidays_in_range: string[];
  weekends_in_range: number;
} {
  const startDate = new Date(startDateStr + "T00:00:00Z");
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start_date: ${startDateStr}`);
  }

  const year = startDate.getFullYear();
  const holidaySet = new Set<string>();
  // Merge holidays for the year and next year to handle year boundaries
  for (const y of [year, year + 1]) {
    const holidays = HOLIDAYS_DATA[y] || [];
    for (const h of holidays) {
      const effectiveDate = h.observed_date || h.date;
      holidaySet.add(effectiveDate);
    }
  }

  let businessDaysCounted = 0;
  let currentDate = new Date(startDate);
  let weekendsCount = 0;
  const holidaysInRange: string[] = [];

  while (businessDaysCounted < numDays) {
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    const dateStr = formatDate(currentDate);

    if (isWeekend(currentDate)) {
      weekendsCount++;
      continue;
    }

    if (holidaySet.has(dateStr)) {
      holidaysInRange.push(dateStr);
      continue;
    }

    businessDaysCounted++;
  }

  const calendarDays = Math.round(
    (currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
  );

  return {
    end_date: formatDate(currentDate),
    calendar_days: calendarDays,
    holidays_in_range: holidaysInRange,
    weekends_in_range: weekendsCount,
  };
}

export function getSgHolidays(input: SgHolidaysInput): SgHolidaysResult {
  try {
    const year = input.year || 2025;

    const holidays = HOLIDAYS_DATA[year];
    if (!holidays) {
      const availableYears = Object.keys(HOLIDAYS_DATA).join(", ");
      return {
        year,
        holidays: [],
        total_holidays: 0,
        summary: `Holiday data for year ${year} is not available. Available years: ${availableYears}. Defaulting to empty result.`,
      };
    }

    const result: SgHolidaysResult = {
      year,
      holidays,
      total_holidays: holidays.length,
      summary: `Singapore has ${holidays.length} gazetted public holidays in ${year}.`,
    };

    // Business day calculation if requested
    if (input.start_date && input.num_business_days && input.num_business_days > 0) {
      const calc = calculateBusinessDays(input.start_date, input.num_business_days);
      result.business_day_calculation = {
        start_date: input.start_date,
        num_business_days: input.num_business_days,
        end_date: calc.end_date,
        calendar_days: calc.calendar_days,
        holidays_in_range: calc.holidays_in_range,
        weekends_in_range: calc.weekends_in_range,
      };
      result.summary += ` Business day calculation: ${input.num_business_days} business days from ${input.start_date} ends on ${calc.end_date} (${calc.calendar_days} calendar days, ${calc.weekends_in_range} weekend days, ${calc.holidays_in_range.length} holidays skipped).`;
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to retrieve SG holidays: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
