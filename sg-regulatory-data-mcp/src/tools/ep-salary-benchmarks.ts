export interface EpSalaryBenchmarksInput {
  sector?: string;
  age?: number;
}

interface SectorBenchmark {
  sector: string;
  qualifying_salary: number;
  qualifying_salary_financial_services: number | null;
  notes: string;
}

const EP_BENCHMARKS: SectorBenchmark[] = [
  {
    sector: "general",
    qualifying_salary: 5600,
    qualifying_salary_financial_services: null,
    notes: "Minimum qualifying salary for EP applications across all sectors (except financial services). Effective 1 January 2026.",
  },
  {
    sector: "financial_services",
    qualifying_salary: 6200,
    qualifying_salary_financial_services: 6200,
    notes: "Higher qualifying salary for financial services sector. Effective 1 January 2026.",
  },
];

// Age-based salary adjustments: +$200 per year above age 23
function getAgeAdjustedSalary(baseSalary: number, age: number): number {
  if (age <= 23) return baseSalary;
  const yearsAbove23 = Math.min(age - 23, 22); // capped increment
  return baseSalary + yearsAbove23 * 200;
}

export function getEpSalaryBenchmarks(input: EpSalaryBenchmarksInput): {
  benchmarks: Record<string, unknown>[];
  compass_exempt_salary: number;
  summary: string;
} {
  const age = input.age || 23;
  const sectorFilter = input.sector?.toLowerCase().replace(/[\s-]/g, "_");

  const generalBase = 5600;
  const fsBase = 6200;
  const compassExempt = 22500;

  const generalAdjusted = getAgeAdjustedSalary(generalBase, age);
  const fsAdjusted = getAgeAdjustedSalary(fsBase, age);

  const benchmarks = [
    {
      sector: "general",
      base_qualifying_salary: generalBase,
      age_adjusted_qualifying_salary: generalAdjusted,
      age_used: age,
      age_adjustment_note: age > 23 ? `+$${(age - 23) * 200} for age ${age} (${age - 23} years above 23)` : "No age adjustment (age 23 or below)",
      effective_date: "2026-01-01",
    },
    {
      sector: "financial_services",
      base_qualifying_salary: fsBase,
      age_adjusted_qualifying_salary: fsAdjusted,
      age_used: age,
      age_adjustment_note: age > 23 ? `+$${(age - 23) * 200} for age ${age} (${age - 23} years above 23)` : "No age adjustment (age 23 or below)",
      effective_date: "2026-01-01",
    },
  ];

  const filtered = sectorFilter
    ? benchmarks.filter(
        (b) =>
          b.sector === sectorFilter ||
          b.sector.includes(sectorFilter) ||
          sectorFilter.includes(b.sector)
      )
    : benchmarks;

  return {
    benchmarks: filtered.length > 0 ? filtered : benchmarks,
    compass_exempt_salary: compassExempt,
    summary: `EP qualifying salary (age ${age}): General $${generalAdjusted}/month, Financial Services $${fsAdjusted}/month. COMPASS-exempt at $${compassExempt}/month. Effective Jan 2026.`,
  };
}
