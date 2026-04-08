export interface PwmWagesInput {
  sector?: string;
}

export interface PwmSector {
  sector: string;
  display_name: string;
  effective_date: string;
  job_levels: {
    level: string;
    gross_monthly_wage: number;
    description: string;
  }[];
  notes: string[];
}

const PWM_DATA: PwmSector[] = [
  {
    sector: "cleaning",
    display_name: "Cleaning Sector",
    effective_date: "2024-07-01",
    job_levels: [
      { level: "Basic (Outdoor cleaner)", gross_monthly_wage: 1412, description: "Entry-level outdoor cleaning roles" },
      { level: "Basic (Indoor cleaner)", gross_monthly_wage: 1412, description: "Entry-level indoor cleaning roles" },
      { level: "Intermediate (Dishwasher/Table cleaner)", gross_monthly_wage: 1612, description: "Roles requiring some experience or additional skills" },
      { level: "Senior (Machine operator/Team leader)", gross_monthly_wage: 1812, description: "Operate cleaning machines or lead a small team" },
      { level: "Supervisory (Supervisor)", gross_monthly_wage: 2162, description: "Supervise cleaning operations across a site" },
    ],
    notes: [
      "PWM wages are gross wages inclusive of employee CPF contributions",
      "Annual wage increases mandated - next increase on 1 July 2025",
      "Applies to all cleaning companies licensed under NEA",
      "Employers must also provide training under WSQ framework",
    ],
  },
  {
    sector: "security",
    display_name: "Security Sector",
    effective_date: "2024-09-01",
    job_levels: [
      { level: "Basic (Security officer)", gross_monthly_wage: 1546, description: "Licensed security officer performing basic guard duties" },
      { level: "Intermediate (Senior security officer)", gross_monthly_wage: 1846, description: "Security officer with additional responsibilities" },
      { level: "Senior (Security supervisor)", gross_monthly_wage: 2246, description: "Supervise security operations at a site" },
      { level: "Supervisory (Chief security officer)", gross_monthly_wage: 2746, description: "Manage overall security operations" },
    ],
    notes: [
      "Applies to all security agencies licensed under PLRD",
      "Security officers must hold valid PLRD license",
      "Progressive wage increments annually",
      "Includes basic wage - shift allowances are additional",
    ],
  },
  {
    sector: "landscape",
    display_name: "Landscape Sector",
    effective_date: "2024-07-01",
    job_levels: [
      { level: "Basic (Landscape worker)", gross_monthly_wage: 1518, description: "General landscape maintenance work" },
      { level: "Intermediate (Landscape technician)", gross_monthly_wage: 1768, description: "Specialized landscape tasks requiring technical skills" },
      { level: "Senior (Landscape supervisor)", gross_monthly_wage: 2168, description: "Supervise landscape maintenance operations" },
      { level: "Supervisory (Landscape manager)", gross_monthly_wage: 2668, description: "Manage landscape projects and teams" },
    ],
    notes: [
      "Applies to companies maintaining public and private landscapes",
      "Workers must have relevant WSQ certifications",
      "Covers arboriculture, horticulture, and turf management",
    ],
  },
  {
    sector: "retail",
    display_name: "Retail Sector",
    effective_date: "2024-09-01",
    job_levels: [
      { level: "Basic (Retail assistant)", gross_monthly_wage: 1441, description: "Entry-level retail roles including cashiers and sales associates" },
      { level: "Intermediate (Senior retail assistant)", gross_monthly_wage: 1641, description: "Experienced retail staff with product knowledge" },
      { level: "Senior (Assistant retail supervisor)", gross_monthly_wage: 1841, description: "Assist in supervising retail operations" },
      { level: "Supervisory (Retail supervisor)", gross_monthly_wage: 2141, description: "Full supervisory responsibilities in retail" },
    ],
    notes: [
      "Covers all retail establishments in Singapore",
      "Applies to both full-time and part-time workers (pro-rated for part-time)",
      "Employers must provide structured career progression",
    ],
  },
  {
    sector: "food_services",
    display_name: "Food Services Sector",
    effective_date: "2024-09-01",
    job_levels: [
      { level: "Basic (Food service assistant)", gross_monthly_wage: 1500, description: "Entry-level F&B roles including kitchen helpers" },
      { level: "Intermediate (Senior food service assistant)", gross_monthly_wage: 1700, description: "Experienced F&B staff - cooks, senior servers" },
      { level: "Senior (Food service supervisor)", gross_monthly_wage: 1950, description: "Supervise kitchen or front-of-house operations" },
      { level: "Supervisory (Food service manager)", gross_monthly_wage: 2300, description: "Manage overall restaurant or F&B operations" },
    ],
    notes: [
      "Covers all food establishments licensed by SFA",
      "Includes restaurants, cafes, food courts, and catering",
      "Food safety certification (WSQ) required",
    ],
  },
  {
    sector: "waste_management",
    display_name: "Waste Management Sector",
    effective_date: "2024-07-01",
    job_levels: [
      { level: "Basic (Waste collection worker)", gross_monthly_wage: 2210, description: "Collect and transport waste" },
      { level: "Intermediate (Waste collection driver)", gross_monthly_wage: 2510, description: "Drive waste collection vehicles" },
      { level: "Senior (Senior waste collection driver)", gross_monthly_wage: 2810, description: "Senior driver with additional responsibilities" },
      { level: "Supervisory (Waste collection supervisor)", gross_monthly_wage: 3210, description: "Supervise waste collection operations" },
    ],
    notes: [
      "Covers public waste collection and general waste management",
      "Higher base wages reflect physically demanding nature of work",
      "Licensed under NEA waste management licensing framework",
    ],
  },
  {
    sector: "administrator",
    display_name: "Administrator / Driver (Occupational PWM)",
    effective_date: "2024-03-01",
    job_levels: [
      { level: "Basic (Administrator)", gross_monthly_wage: 2645, description: "Entry-level admin roles across all sectors" },
      { level: "Intermediate (Senior administrator)", gross_monthly_wage: 2945, description: "Experienced admin staff with broader responsibilities" },
      { level: "Senior (Executive administrator)", gross_monthly_wage: 3345, description: "Executive-level administrative roles" },
      { level: "Basic (Driver)", gross_monthly_wage: 2645, description: "Professional drivers across all sectors" },
    ],
    notes: [
      "Occupational PWM applies across ALL sectors, not just specific industries",
      "Covers resident workers (Singapore citizens and PRs) in admin and driver roles",
      "Implemented from March 2024 onwards",
      "Applies regardless of which industry the employer is in",
    ],
  },
];

export function getPwmWages(input: PwmWagesInput): { sectors: PwmSector[]; summary: string } {
  try {
    const sectorFilter = input.sector?.toLowerCase().replace(/[\s-]/g, "_");

    if (sectorFilter) {
      const matched = PWM_DATA.filter(
        (s) =>
          s.sector === sectorFilter ||
          s.sector.includes(sectorFilter) ||
          sectorFilter.includes(s.sector) ||
          s.display_name.toLowerCase().includes(sectorFilter.replace(/_/g, " "))
      );

      if (matched.length === 0) {
        return {
          sectors: PWM_DATA,
          summary: `Sector "${input.sector}" not found. Returning all sectors. Available sectors: ${PWM_DATA.map((s) => s.sector).join(", ")}`,
        };
      }

      return {
        sectors: matched,
        summary: `Progressive Wage Model (PWM) minimum wages for ${matched.map((s) => s.display_name).join(", ")}. Rates effective as of indicated dates in 2024.`,
      };
    }

    return {
      sectors: PWM_DATA,
      summary: `Progressive Wage Model (PWM) minimum wages for all ${PWM_DATA.length} covered sectors/occupations. Filter by sector for specific results.`,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve PWM wages: ${error instanceof Error ? error.message : String(error)}`);
  }
}
