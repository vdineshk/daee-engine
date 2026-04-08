export interface LevyRatesInput {
  sector?: string;
}

export interface LevySector {
  sector: string;
  tiers: {
    tier: string;
    monthly_levy: number;
    description: string;
  }[];
  dependency_ratio_ceiling: {
    category: string;
    ceiling_percent: number;
    notes: string;
  }[];
  notes: string[];
}

const LEVY_DATA: LevySector[] = [
  {
    sector: "manufacturing",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 600, description: "Higher tier - exceeding basic DRC but within maximum" },
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 60, notes: "Up to 60% of total workforce can be Work Permit holders" },
      { category: "S Pass", ceiling_percent: 15, notes: "Up to 15% of total workforce can be S Pass holders" },
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Man-Year Entitlement (MYE) applies to Malaysian and NAS (Non-traditional sources) workers",
      "Higher-skilled workers (R1) attract Tier 1 rates",
    ],
  },
  {
    sector: "services",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 600, description: "Higher tier - exceeding basic DRC but within maximum" },
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 35, notes: "Up to 35% of total workforce can be Work Permit holders" },
      { category: "S Pass", ceiling_percent: 10, notes: "Up to 10% of total workforce can be S Pass holders" },
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Services sector has the most restrictive DRC",
      "Includes F&B, retail, and other service businesses",
    ],
  },
  {
    sector: "construction",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 700, description: "Higher tier - exceeding basic DRC but within maximum" },
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 87.5, notes: "Up to 87.5% of total workforce can be Work Permit holders (highest DRC among sectors)" },
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Construction sector has the highest DRC due to labor-intensive nature",
      "Man-Year Entitlement (MYE) system applies",
      "Higher-skilled (R1) workers attract lower levy",
    ],
  },
  {
    sector: "process",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 700, description: "Higher tier - exceeding basic DRC but within maximum" },
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 87.5, notes: "Up to 87.5% of total workforce can be Work Permit holders" },
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Process sector covers oil, gas, petrochemical industries",
      "Similar DRC structure to construction",
    ],
  },
  {
    sector: "marine_shipyard",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 700, description: "Higher tier - exceeding basic DRC but within maximum" },
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 87.5, notes: "Up to 87.5% of total workforce can be Work Permit holders" },
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Marine shipyard sector covers ship building and repair",
      "Similar DRC structure to construction and process sectors",
    ],
  },
];

export function getLevyRates(input: LevyRatesInput): { sectors: LevySector[]; summary: string } {
  try {
    const sectorFilter = input.sector?.toLowerCase().replace(/[\s-]/g, "_");

    if (sectorFilter) {
      const matched = LEVY_DATA.filter(
        (s) =>
          s.sector === sectorFilter ||
          s.sector.includes(sectorFilter) ||
          sectorFilter.includes(s.sector)
      );

      if (matched.length === 0) {
        return {
          sectors: LEVY_DATA,
          summary: `Sector "${input.sector}" not found. Returning all sectors. Available sectors: ${LEVY_DATA.map((s) => s.sector).join(", ")}`,
        };
      }

      return {
        sectors: matched,
        summary: `Foreign worker levy rates for ${matched.map((s) => s.sector).join(", ")} sector(s). Data reflects MOM rates effective January 2024.`,
      };
    }

    return {
      sectors: LEVY_DATA,
      summary: `Foreign worker levy rates for all ${LEVY_DATA.length} sectors. Data reflects MOM rates effective January 2024. Filter by sector for specific results.`,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve levy rates: ${error instanceof Error ? error.message : String(error)}`);
  }
}
