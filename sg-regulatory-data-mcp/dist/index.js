var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/tools/levy-rates.ts
var LEVY_DATA = [
  {
    sector: "manufacturing",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 600, description: "Higher tier - exceeding basic DRC but within maximum" }
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 60, notes: "Up to 60% of total workforce can be Work Permit holders" },
      { category: "S Pass", ceiling_percent: 15, notes: "Up to 15% of total workforce can be S Pass holders" }
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Man-Year Entitlement (MYE) applies to Malaysian and NAS (Non-traditional sources) workers",
      "Higher-skilled workers (R1) attract Tier 1 rates"
    ]
  },
  {
    sector: "services",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 600, description: "Higher tier - exceeding basic DRC but within maximum" }
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 35, notes: "Up to 35% of total workforce can be Work Permit holders" },
      { category: "S Pass", ceiling_percent: 10, notes: "Up to 10% of total workforce can be S Pass holders" }
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Services sector has the most restrictive DRC",
      "Includes F&B, retail, and other service businesses"
    ]
  },
  {
    sector: "construction",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 700, description: "Higher tier - exceeding basic DRC but within maximum" }
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 87.5, notes: "Up to 87.5% of total workforce can be Work Permit holders (highest DRC among sectors)" }
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Construction sector has the highest DRC due to labor-intensive nature",
      "Man-Year Entitlement (MYE) system applies",
      "Higher-skilled (R1) workers attract lower levy"
    ]
  },
  {
    sector: "process",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 700, description: "Higher tier - exceeding basic DRC but within maximum" }
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 87.5, notes: "Up to 87.5% of total workforce can be Work Permit holders" }
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Process sector covers oil, gas, petrochemical industries",
      "Similar DRC structure to construction"
    ]
  },
  {
    sector: "marine_shipyard",
    tiers: [
      { tier: "Tier 1", monthly_levy: 300, description: "Basic tier - within dependency ratio ceiling" },
      { tier: "Tier 2", monthly_levy: 700, description: "Higher tier - exceeding basic DRC but within maximum" }
    ],
    dependency_ratio_ceiling: [
      { category: "Work Permit (Basic)", ceiling_percent: 87.5, notes: "Up to 87.5% of total workforce can be Work Permit holders" }
    ],
    notes: [
      "Levy rates effective from 1 January 2024",
      "Marine shipyard sector covers ship building and repair",
      "Similar DRC structure to construction and process sectors"
    ]
  }
];
function getLevyRates(input) {
  try {
    const sectorFilter = input.sector?.toLowerCase().replace(/[\s-]/g, "_");
    if (sectorFilter) {
      const matched = LEVY_DATA.filter(
        (s) => s.sector === sectorFilter || s.sector.includes(sectorFilter) || sectorFilter.includes(s.sector)
      );
      if (matched.length === 0) {
        return {
          sectors: LEVY_DATA,
          summary: `Sector "${input.sector}" not found. Returning all sectors. Available sectors: ${LEVY_DATA.map((s) => s.sector).join(", ")}`
        };
      }
      return {
        sectors: matched,
        summary: `Foreign worker levy rates for ${matched.map((s) => s.sector).join(", ")} sector(s). Data reflects MOM rates effective January 2024.`
      };
    }
    return {
      sectors: LEVY_DATA,
      summary: `Foreign worker levy rates for all ${LEVY_DATA.length} sectors. Data reflects MOM rates effective January 2024. Filter by sector for specific results.`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve levy rates: ${error instanceof Error ? error.message : String(error)}`);
  }
}
__name(getLevyRates, "getLevyRates");

// src/tools/filing-deadlines.ts
var FILING_DATA = [
  {
    entity_type: "private_limited",
    display_name: "Private Limited Company (Pte Ltd)",
    deadlines: [
      {
        requirement: "Annual General Meeting (AGM)",
        deadline: "Within 6 months after Financial Year End (FYE)",
        details: "First AGM must be held within 18 months of incorporation. Subsequent AGMs within 6 months of FYE and no more than 15 months apart.",
        penalty_for_late_filing: "Up to $5,000 fine and/or default penalty of $500 for every day the offence continues"
      },
      {
        requirement: "Annual Return (AR)",
        deadline: "Within 30 days after AGM",
        details: "Must be filed with ACRA via BizFile+ portal. Includes company particulars, financial statements summary, and shareholder information.",
        penalty_for_late_filing: "$300 late lodgment fee. Persistent non-filing may result in striking off."
      },
      {
        requirement: "Financial Statements (FS) Lodgment",
        deadline: "Within 30 days after AGM (filed together with AR)",
        details: "Small companies (meeting 2 of 3 criteria: revenue <= $10M, assets <= $10M, employees <= 50) may qualify for audit exemption.",
        penalty_for_late_filing: "$300 late lodgment fee as part of AR filing"
      },
      {
        requirement: "Corporate Tax Filing (Form C-S/C)",
        deadline: "30 November each year (for FYE in preceding year)",
        details: "E-filing deadline is 30 November. Paper filing deadline is 15 November. Form C-S for companies with revenue <= $5M.",
        penalty_for_late_filing: "IRAS may issue estimated Notice of Assessment (NOA). Penalties for late/non-filing apply."
      },
      {
        requirement: "GST Returns (if GST-registered)",
        deadline: "Within 1 month after end of each prescribed accounting period",
        details: "Typically quarterly returns. Companies with taxable turnover > $1M must register for GST.",
        penalty_for_late_filing: "$200 penalty for each completed month the return is outstanding, up to $10,000"
      }
    ],
    notes: [
      "Private companies may dispense with AGM if all members pass a resolution",
      "EPC (Exempt Private Company) with revenue <= $5M can file simplified accounts",
      "XBRL filing required for financial statements since 2007",
      "Dormant companies still need to file Annual Returns"
    ]
  },
  {
    entity_type: "public_limited",
    display_name: "Public Limited Company (Ltd)",
    deadlines: [
      {
        requirement: "Annual General Meeting (AGM)",
        deadline: "Within 4 months after Financial Year End (FYE) for listed companies; 6 months for unlisted",
        details: "Listed companies on SGX have stricter timelines. Cannot dispense with AGM.",
        penalty_for_late_filing: "Up to $5,000 fine and/or default penalty"
      },
      {
        requirement: "Annual Return (AR)",
        deadline: "Within 30 days after AGM",
        details: "Full financial statements must be filed with ACRA. No exemption from audit requirement.",
        penalty_for_late_filing: "$300 late lodgment fee. Company and directors may face prosecution."
      },
      {
        requirement: "Financial Statements (FS) Lodgment",
        deadline: "Within 30 days after AGM (filed together with AR)",
        details: "Full XBRL filing required. Must be audited - no audit exemption for public companies.",
        penalty_for_late_filing: "$300 late lodgment fee as part of AR filing"
      },
      {
        requirement: "Corporate Tax Filing (Form C)",
        deadline: "30 November each year",
        details: "Must file Form C (not C-S). E-filing deadline 30 November.",
        penalty_for_late_filing: "Estimated NOA and penalties for late/non-filing"
      }
    ],
    notes: [
      "Listed companies subject to additional SGX Listing Rules",
      "Continuous disclosure obligations apply",
      "Quarterly/semi-annual reporting may be required by SGX"
    ]
  },
  {
    entity_type: "llp",
    display_name: "Limited Liability Partnership (LLP)",
    deadlines: [
      {
        requirement: "Annual Declaration",
        deadline: "Within 15 months of registration date, then annually within 15 months of last declaration",
        details: "Declare solvency or insolvency of the LLP. Filed via BizFile+ portal.",
        penalty_for_late_filing: "$300 late lodgment fee. LLP may be struck off for non-compliance."
      },
      {
        requirement: "Income Tax Filing",
        deadline: "15 April each year (Form P)",
        details: "LLP itself is not taxed - income flows through to partners. Must file Form P to declare income allocation.",
        penalty_for_late_filing: "Penalties for late filing by IRAS"
      }
    ],
    notes: [
      "LLPs do not need to hold AGMs",
      "No requirement to file financial statements with ACRA",
      "Must maintain proper accounting records",
      "At least 2 partners required at all times",
      "Must have a registered office in Singapore"
    ]
  },
  {
    entity_type: "sole_proprietor",
    display_name: "Sole Proprietorship",
    deadlines: [
      {
        requirement: "Business Registration Renewal",
        deadline: "Every 1 to 3 years (selected at registration)",
        details: "Must renew before expiry date. Can renew via BizFile+ portal.",
        penalty_for_late_filing: "Business will be automatically terminated if not renewed"
      },
      {
        requirement: "Personal Income Tax Filing",
        deadline: "15 April each year (paper) / 18 April (e-filing)",
        details: "Business income declared as part of personal income tax return (Form B).",
        penalty_for_late_filing: "IRAS penalties for late filing. Estimated NOA may be issued."
      },
      {
        requirement: "GST Returns (if GST-registered)",
        deadline: "Within 1 month after end of each prescribed accounting period",
        details: "Must register for GST if taxable turnover exceeds $1M in past 12 months or expected to exceed in next 12 months.",
        penalty_for_late_filing: "$200 penalty per month outstanding, up to $10,000"
      }
    ],
    notes: [
      "No requirement to file annual returns with ACRA",
      "No audit requirement",
      "Must maintain proper records for at least 5 years",
      "Owner is personally liable for all debts"
    ]
  },
  {
    entity_type: "partnership",
    display_name: "General Partnership",
    deadlines: [
      {
        requirement: "Business Registration Renewal",
        deadline: "Every 1 to 3 years (selected at registration)",
        details: "Must renew before expiry date. Can renew via BizFile+ portal.",
        penalty_for_late_filing: "Business will be automatically terminated if not renewed"
      },
      {
        requirement: "Income Tax Filing (Form P)",
        deadline: "15 April each year",
        details: "Partnership files Form P to allocate income among partners. Each partner reports share in personal return.",
        penalty_for_late_filing: "IRAS penalties for late filing"
      }
    ],
    notes: [
      "Similar compliance requirements as sole proprietorship",
      "All partners are jointly and severally liable",
      "Must maintain proper accounting records",
      "Maximum 20 partners (except for professional partnerships)"
    ]
  }
];
function getFilingDeadlines(input) {
  try {
    const typeFilter = input.entity_type?.toLowerCase().replace(/[\s-]/g, "_");
    if (typeFilter) {
      const matched = FILING_DATA.filter(
        (e) => e.entity_type === typeFilter || e.entity_type.includes(typeFilter) || typeFilter.includes(e.entity_type) || e.display_name.toLowerCase().includes(typeFilter.replace(/_/g, " "))
      );
      if (matched.length === 0) {
        return {
          entities: FILING_DATA,
          summary: `Entity type "${input.entity_type}" not found. Returning all entity types. Available types: ${FILING_DATA.map((e) => e.entity_type).join(", ")}`
        };
      }
      return {
        entities: matched,
        summary: `ACRA filing deadlines for ${matched.map((e) => e.display_name).join(", ")}. Data reflects current ACRA requirements as of 2024-2025.`
      };
    }
    return {
      entities: FILING_DATA,
      summary: `ACRA filing deadlines for all ${FILING_DATA.length} entity types. Filter by entity_type for specific results. Available types: ${FILING_DATA.map((e) => e.entity_type).join(", ")}`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve filing deadlines: ${error instanceof Error ? error.message : String(error)}`);
  }
}
__name(getFilingDeadlines, "getFilingDeadlines");

// src/tools/pwm-wages.ts
var PWM_DATA = [
  {
    sector: "cleaning",
    display_name: "Cleaning Sector",
    effective_date: "2024-07-01",
    job_levels: [
      { level: "Basic (Outdoor cleaner)", gross_monthly_wage: 1412, description: "Entry-level outdoor cleaning roles" },
      { level: "Basic (Indoor cleaner)", gross_monthly_wage: 1412, description: "Entry-level indoor cleaning roles" },
      { level: "Intermediate (Dishwasher/Table cleaner)", gross_monthly_wage: 1612, description: "Roles requiring some experience or additional skills" },
      { level: "Senior (Machine operator/Team leader)", gross_monthly_wage: 1812, description: "Operate cleaning machines or lead a small team" },
      { level: "Supervisory (Supervisor)", gross_monthly_wage: 2162, description: "Supervise cleaning operations across a site" }
    ],
    notes: [
      "PWM wages are gross wages inclusive of employee CPF contributions",
      "Annual wage increases mandated - next increase on 1 July 2025",
      "Applies to all cleaning companies licensed under NEA",
      "Employers must also provide training under WSQ framework"
    ]
  },
  {
    sector: "security",
    display_name: "Security Sector",
    effective_date: "2024-09-01",
    job_levels: [
      { level: "Basic (Security officer)", gross_monthly_wage: 1546, description: "Licensed security officer performing basic guard duties" },
      { level: "Intermediate (Senior security officer)", gross_monthly_wage: 1846, description: "Security officer with additional responsibilities" },
      { level: "Senior (Security supervisor)", gross_monthly_wage: 2246, description: "Supervise security operations at a site" },
      { level: "Supervisory (Chief security officer)", gross_monthly_wage: 2746, description: "Manage overall security operations" }
    ],
    notes: [
      "Applies to all security agencies licensed under PLRD",
      "Security officers must hold valid PLRD license",
      "Progressive wage increments annually",
      "Includes basic wage - shift allowances are additional"
    ]
  },
  {
    sector: "landscape",
    display_name: "Landscape Sector",
    effective_date: "2024-07-01",
    job_levels: [
      { level: "Basic (Landscape worker)", gross_monthly_wage: 1518, description: "General landscape maintenance work" },
      { level: "Intermediate (Landscape technician)", gross_monthly_wage: 1768, description: "Specialized landscape tasks requiring technical skills" },
      { level: "Senior (Landscape supervisor)", gross_monthly_wage: 2168, description: "Supervise landscape maintenance operations" },
      { level: "Supervisory (Landscape manager)", gross_monthly_wage: 2668, description: "Manage landscape projects and teams" }
    ],
    notes: [
      "Applies to companies maintaining public and private landscapes",
      "Workers must have relevant WSQ certifications",
      "Covers arboriculture, horticulture, and turf management"
    ]
  },
  {
    sector: "retail",
    display_name: "Retail Sector",
    effective_date: "2024-09-01",
    job_levels: [
      { level: "Basic (Retail assistant)", gross_monthly_wage: 1441, description: "Entry-level retail roles including cashiers and sales associates" },
      { level: "Intermediate (Senior retail assistant)", gross_monthly_wage: 1641, description: "Experienced retail staff with product knowledge" },
      { level: "Senior (Assistant retail supervisor)", gross_monthly_wage: 1841, description: "Assist in supervising retail operations" },
      { level: "Supervisory (Retail supervisor)", gross_monthly_wage: 2141, description: "Full supervisory responsibilities in retail" }
    ],
    notes: [
      "Covers all retail establishments in Singapore",
      "Applies to both full-time and part-time workers (pro-rated for part-time)",
      "Employers must provide structured career progression"
    ]
  },
  {
    sector: "food_services",
    display_name: "Food Services Sector",
    effective_date: "2024-09-01",
    job_levels: [
      { level: "Basic (Food service assistant)", gross_monthly_wage: 1500, description: "Entry-level F&B roles including kitchen helpers" },
      { level: "Intermediate (Senior food service assistant)", gross_monthly_wage: 1700, description: "Experienced F&B staff - cooks, senior servers" },
      { level: "Senior (Food service supervisor)", gross_monthly_wage: 1950, description: "Supervise kitchen or front-of-house operations" },
      { level: "Supervisory (Food service manager)", gross_monthly_wage: 2300, description: "Manage overall restaurant or F&B operations" }
    ],
    notes: [
      "Covers all food establishments licensed by SFA",
      "Includes restaurants, cafes, food courts, and catering",
      "Food safety certification (WSQ) required"
    ]
  },
  {
    sector: "waste_management",
    display_name: "Waste Management Sector",
    effective_date: "2024-07-01",
    job_levels: [
      { level: "Basic (Waste collection worker)", gross_monthly_wage: 2210, description: "Collect and transport waste" },
      { level: "Intermediate (Waste collection driver)", gross_monthly_wage: 2510, description: "Drive waste collection vehicles" },
      { level: "Senior (Senior waste collection driver)", gross_monthly_wage: 2810, description: "Senior driver with additional responsibilities" },
      { level: "Supervisory (Waste collection supervisor)", gross_monthly_wage: 3210, description: "Supervise waste collection operations" }
    ],
    notes: [
      "Covers public waste collection and general waste management",
      "Higher base wages reflect physically demanding nature of work",
      "Licensed under NEA waste management licensing framework"
    ]
  },
  {
    sector: "administrator",
    display_name: "Administrator / Driver (Occupational PWM)",
    effective_date: "2024-03-01",
    job_levels: [
      { level: "Basic (Administrator)", gross_monthly_wage: 2645, description: "Entry-level admin roles across all sectors" },
      { level: "Intermediate (Senior administrator)", gross_monthly_wage: 2945, description: "Experienced admin staff with broader responsibilities" },
      { level: "Senior (Executive administrator)", gross_monthly_wage: 3345, description: "Executive-level administrative roles" },
      { level: "Basic (Driver)", gross_monthly_wage: 2645, description: "Professional drivers across all sectors" }
    ],
    notes: [
      "Occupational PWM applies across ALL sectors, not just specific industries",
      "Covers resident workers (Singapore citizens and PRs) in admin and driver roles",
      "Implemented from March 2024 onwards",
      "Applies regardless of which industry the employer is in"
    ]
  }
];
function getPwmWages(input) {
  try {
    const sectorFilter = input.sector?.toLowerCase().replace(/[\s-]/g, "_");
    if (sectorFilter) {
      const matched = PWM_DATA.filter(
        (s) => s.sector === sectorFilter || s.sector.includes(sectorFilter) || sectorFilter.includes(s.sector) || s.display_name.toLowerCase().includes(sectorFilter.replace(/_/g, " "))
      );
      if (matched.length === 0) {
        return {
          sectors: PWM_DATA,
          summary: `Sector "${input.sector}" not found. Returning all sectors. Available sectors: ${PWM_DATA.map((s) => s.sector).join(", ")}`
        };
      }
      return {
        sectors: matched,
        summary: `Progressive Wage Model (PWM) minimum wages for ${matched.map((s) => s.display_name).join(", ")}. Rates effective as of indicated dates in 2024.`
      };
    }
    return {
      sectors: PWM_DATA,
      summary: `Progressive Wage Model (PWM) minimum wages for all ${PWM_DATA.length} covered sectors/occupations. Filter by sector for specific results.`
    };
  } catch (error) {
    throw new Error(`Failed to retrieve PWM wages: ${error instanceof Error ? error.message : String(error)}`);
  }
}
__name(getPwmWages, "getPwmWages");

// src/tools/compliance-status.ts
function checkComplianceStatus(input) {
  try {
    const checklist = [];
    const applicableRegulations = [];
    const filingData = getFilingDeadlines({ entity_type: input.entity_type });
    for (const entity of filingData.entities) {
      applicableRegulations.push(`ACRA Filing Requirements (${entity.display_name})`);
      for (const deadline of entity.deadlines) {
        checklist.push({
          category: "ACRA Filing",
          requirement: deadline.requirement,
          deadline: deadline.deadline,
          details: deadline.details,
          penalty: deadline.penalty_for_late_filing,
          priority: deadline.requirement.includes("AGM") || deadline.requirement.includes("Annual Return") ? "high" : deadline.requirement.includes("Tax") ? "high" : "medium"
        });
      }
    }
    if (input.incorporation_date) {
      const incDate = new Date(input.incorporation_date);
      if (!isNaN(incDate.getTime())) {
        const entityType2 = input.entity_type?.toLowerCase().replace(/[\s-]/g, "_");
        if (entityType2 === "private_limited" || entityType2 === "public_limited") {
          const firstAgmDeadline = new Date(incDate);
          firstAgmDeadline.setMonth(firstAgmDeadline.getMonth() + 18);
          checklist.push({
            category: "First AGM",
            requirement: "First Annual General Meeting",
            deadline: `By ${firstAgmDeadline.toISOString().split("T")[0]} (18 months from incorporation)`,
            details: `Incorporated on ${input.incorporation_date}. First AGM must be held within 18 months of incorporation.`,
            penalty: "Up to $5,000 fine",
            priority: "high"
          });
        }
      }
    }
    if (input.financial_year_end) {
      const fyeMonth = parseInt(input.financial_year_end.split("-")[1], 10);
      const fyeDay = parseInt(input.financial_year_end.split("-")[2], 10);
      if (!isNaN(fyeMonth) && !isNaN(fyeDay)) {
        const now = /* @__PURE__ */ new Date();
        let nextFye = new Date(now.getFullYear(), fyeMonth - 1, fyeDay);
        if (nextFye < now) {
          nextFye = new Date(now.getFullYear() + 1, fyeMonth - 1, fyeDay);
        }
        const agmDeadline = new Date(nextFye);
        agmDeadline.setMonth(agmDeadline.getMonth() + 6);
        const arDeadline = new Date(agmDeadline);
        arDeadline.setDate(arDeadline.getDate() + 30);
        checklist.push({
          category: "Upcoming Deadline",
          requirement: "Next Financial Year End",
          deadline: nextFye.toISOString().split("T")[0],
          details: `Financial year ends on ${nextFye.toISOString().split("T")[0]}. AGM due by ${agmDeadline.toISOString().split("T")[0]}. AR due by ${arDeadline.toISOString().split("T")[0]}.`,
          penalty: "See individual filing penalties",
          priority: "high"
        });
        checklist.push({
          category: "Upcoming Deadline",
          requirement: "Corporate Tax Filing (ECI)",
          deadline: `Within 3 months after FYE (${new Date(nextFye.getTime() + 90 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0]})`,
          details: "Estimated Chargeable Income (ECI) must be filed within 3 months after financial year end.",
          penalty: "IRAS penalties for late filing",
          priority: "high"
        });
      }
    }
    if (input.has_foreign_workers) {
      applicableRegulations.push("MOM Foreign Worker Levy Requirements");
      applicableRegulations.push("Work Permit / S Pass Conditions");
      checklist.push({
        category: "Foreign Worker Compliance",
        requirement: "Monthly Foreign Worker Levy Payment",
        deadline: "14th of each month",
        details: "Levy is auto-deducted via GIRO on the 14th of each month. Ensure sufficient funds in designated bank account.",
        penalty: "Late payment penalty. Persistent non-payment may result in work permit revocation.",
        priority: "high"
      });
      checklist.push({
        category: "Foreign Worker Compliance",
        requirement: "Dependency Ratio Ceiling (DRC) Compliance",
        deadline: "Ongoing - monitored continuously",
        details: "Must not exceed the sector-specific dependency ratio ceiling for foreign workers.",
        penalty: "Unable to hire new foreign workers. Existing permits may not be renewed.",
        priority: "high"
      });
      checklist.push({
        category: "Foreign Worker Compliance",
        requirement: "Security Bond",
        deadline: "Before work permit issuance",
        details: "Security bond of $5,000 (non-Malaysian) required for each Work Permit holder.",
        penalty: "Forfeiture of bond for non-compliance with repatriation obligations.",
        priority: "medium"
      });
      if (input.sector) {
        const levyData = getLevyRates({ sector: input.sector });
        for (const sector of levyData.sectors) {
          checklist.push({
            category: "Levy Rates",
            requirement: `Foreign Worker Levy - ${sector.sector} sector`,
            deadline: "Monthly payment",
            details: `Tier 1: $${sector.tiers[0]?.monthly_levy}/month, Tier 2: $${sector.tiers[1]?.monthly_levy}/month. DRC: ${sector.dependency_ratio_ceiling.map((d) => `${d.category}: ${d.ceiling_percent}%`).join(", ")}`,
            penalty: "Late payment penalties apply",
            priority: "medium"
          });
        }
      }
    }
    if (input.sector) {
      const pwmData = getPwmWages({ sector: input.sector });
      if (pwmData.sectors.length > 0 && !pwmData.summary.includes("not found")) {
        applicableRegulations.push("Progressive Wage Model (PWM) Requirements");
        for (const sector of pwmData.sectors) {
          const lowestWage = sector.job_levels.reduce(
            (min, jl) => jl.gross_monthly_wage < min ? jl.gross_monthly_wage : min,
            Infinity
          );
          checklist.push({
            category: "PWM Compliance",
            requirement: `Progressive Wage Model - ${sector.display_name}`,
            deadline: `Effective from ${sector.effective_date}`,
            details: `Minimum gross monthly wage starts at $${lowestWage}. ${sector.job_levels.length} job levels defined. Workers must be paid at or above PWM rates.`,
            penalty: "Non-compliance may result in inability to hire foreign workers and debarment from government contracts.",
            priority: "high"
          });
        }
      }
    }
    const entityType = input.entity_type?.toLowerCase().replace(/[\s-]/g, "_");
    if (entityType === "private_limited" || entityType === "public_limited") {
      applicableRegulations.push("Companies Act (Cap 50) Requirements");
      checklist.push({
        category: "General Compliance",
        requirement: "Maintain Registered Office",
        deadline: "Ongoing",
        details: "Must maintain a registered office address in Singapore that is open and accessible to the public during business hours.",
        penalty: "Company may be struck off the register",
        priority: "medium"
      });
      checklist.push({
        category: "General Compliance",
        requirement: "Company Secretary Appointment",
        deadline: "Within 6 months of incorporation",
        details: "Must appoint a qualified company secretary who is a natural person ordinarily resident in Singapore.",
        penalty: "Up to $5,000 fine for the company and every officer in default",
        priority: "high"
      });
      checklist.push({
        category: "General Compliance",
        requirement: "Maintain Statutory Registers",
        deadline: "Ongoing",
        details: "Must maintain register of members, register of directors, register of charges, and other statutory registers.",
        penalty: "Up to $5,000 fine",
        priority: "medium"
      });
    }
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    checklist.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return {
      entity_type: input.entity_type,
      checklist,
      applicable_regulations: applicableRegulations,
      summary: `Compliance checklist for ${input.entity_type} entity with ${checklist.length} items across ${applicableRegulations.length} regulatory areas. ${checklist.filter((c) => c.priority === "high").length} high-priority items identified.`
    };
  } catch (error) {
    throw new Error(
      `Failed to check compliance status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
__name(checkComplianceStatus, "checkComplianceStatus");

// src/tools/sg-holidays.ts
var HOLIDAYS_DATA = {
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
    { date: "2025-12-25", name: "Christmas Day", day_of_week: "Thursday" }
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
    { date: "2026-12-25", name: "Christmas Day", day_of_week: "Friday" }
  ]
};
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}
__name(isWeekend, "isWeekend");
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
__name(formatDate, "formatDate");
function calculateBusinessDays(startDateStr, numDays) {
  const startDate = /* @__PURE__ */ new Date(startDateStr + "T00:00:00Z");
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid start_date: ${startDateStr}`);
  }
  const year = startDate.getFullYear();
  const holidaySet = /* @__PURE__ */ new Set();
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
  const holidaysInRange = [];
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
    (currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1e3)
  );
  return {
    end_date: formatDate(currentDate),
    calendar_days: calendarDays,
    holidays_in_range: holidaysInRange,
    weekends_in_range: weekendsCount
  };
}
__name(calculateBusinessDays, "calculateBusinessDays");
function getSgHolidays(input) {
  try {
    const year = input.year || 2025;
    const holidays = HOLIDAYS_DATA[year];
    if (!holidays) {
      const availableYears = Object.keys(HOLIDAYS_DATA).join(", ");
      return {
        year,
        holidays: [],
        total_holidays: 0,
        summary: `Holiday data for year ${year} is not available. Available years: ${availableYears}. Defaulting to empty result.`
      };
    }
    const result = {
      year,
      holidays,
      total_holidays: holidays.length,
      summary: `Singapore has ${holidays.length} gazetted public holidays in ${year}.`
    };
    if (input.start_date && input.num_business_days && input.num_business_days > 0) {
      const calc = calculateBusinessDays(input.start_date, input.num_business_days);
      result.business_day_calculation = {
        start_date: input.start_date,
        num_business_days: input.num_business_days,
        end_date: calc.end_date,
        calendar_days: calc.calendar_days,
        holidays_in_range: calc.holidays_in_range,
        weekends_in_range: calc.weekends_in_range
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
__name(getSgHolidays, "getSgHolidays");

// src/index.ts
var SERVICE_NAME = "sg-regulatory-data-mcp";
var SERVICE_VERSION = "1.0.0";
var UPGRADE_URL = "https://daee-sg-regulatory.vercel.app";
var FREE_TIER_DAILY_LIMIT = 5;
var FREE_TIER_DELAY_MS = 3e3;
var TOOLS = [
  {
    name: "get_levy_rates",
    description: "Current foreign worker levy rates by sector, tier, and dependency ratio ceiling. Use this tool when you need Singapore foreign worker levy information for workforce cost calculations, hiring decisions, or compliance checks.",
    inputSchema: {
      type: "object",
      properties: {
        sector: {
          type: "string",
          description: "Filter by sector: manufacturing, services, construction, process, marine_shipyard. Leave empty for all sectors."
        }
      }
    }
  },
  {
    name: "get_filing_deadlines",
    description: "ACRA filing deadlines for any entity type with penalty amounts. Use this tool when you need to check annual return, AGM, or financial statement filing deadlines for Singapore companies.",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: {
          type: "string",
          description: "Filter by entity type: private_limited, public_limited, llp, sole_proprietor, partnership. Leave empty for all types."
        }
      }
    }
  },
  {
    name: "get_pwm_wages",
    description: "Progressive Wage Model minimum wages by sector and job level. Use this tool when you need minimum wage requirements for cleaning, security, landscape, retail, food services, or waste management sectors in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        sector: {
          type: "string",
          description: "Filter by sector: cleaning, security, landscape, retail, food_services, waste_management, administrator. Leave empty for all sectors."
        }
      }
    }
  },
  {
    name: "check_compliance_status",
    description: "Given a company profile, return all active regulatory deadlines and requirements. Use this tool when you need a comprehensive compliance checklist for a Singapore business.",
    inputSchema: {
      type: "object",
      properties: {
        entity_type: {
          type: "string",
          description: "Company entity type: private_limited, public_limited, llp, sole_proprietor, partnership."
        },
        incorporation_date: {
          type: "string",
          description: "Date of incorporation in YYYY-MM-DD format. Used to calculate first-AGM deadlines."
        },
        financial_year_end: {
          type: "string",
          description: "Financial year end date in YYYY-MM-DD format. Used to calculate upcoming filing deadlines."
        },
        sector: {
          type: "string",
          description: "Business sector. Used to check PWM and levy applicability."
        },
        has_foreign_workers: {
          type: "boolean",
          description: "Whether the company employs foreign workers on Work Permits or S Passes."
        }
      },
      required: ["entity_type"]
    }
  },
  {
    name: "get_sg_holidays",
    description: "Singapore public holidays with business day calculations. Use this tool when you need to calculate business days or check holiday dates in Singapore.",
    inputSchema: {
      type: "object",
      properties: {
        year: {
          type: "number",
          description: "Year to retrieve holidays for (2025 or 2026). Defaults to 2025."
        },
        start_date: {
          type: "string",
          description: "Start date for business day calculation in YYYY-MM-DD format."
        },
        num_business_days: {
          type: "number",
          description: "Number of business days to count forward from start_date."
        }
      }
    }
  }
];
function buildMeta(tier, callsRemainingToday) {
  return {
    tier,
    calls_remaining_today: callsRemainingToday,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    source: SERVICE_NAME,
    version: SERVICE_VERSION,
    upgrade_url: UPGRADE_URL,
    pricing: {
      starter: "$29/month - 1,000 calls/month",
      pro: "$99/month - 10,000 calls/month",
      enterprise: "$299/month - unlimited calls"
    },
    related_tools: {
      "sg-company-lookup": "https://sg-company-lookup-mcp.workers.dev",
      "asean-trade-rules": "https://asean-trade-rules-mcp.workers.dev"
    }
  };
}
__name(buildMeta, "buildMeta");
function getTodayKey(ip) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return `rate:${ip}:${today}`;
}
__name(getTodayKey, "getTodayKey");
async function checkRateLimit(env, ip) {
  try {
    const key = getTodayKey(ip);
    const raw = await env.RATE_LIMIT.get(key);
    const callsUsed = raw ? parseInt(raw, 10) : 0;
    const callsRemaining = Math.max(0, FREE_TIER_DAILY_LIMIT - callsUsed);
    return {
      allowed: callsUsed < FREE_TIER_DAILY_LIMIT,
      callsUsed,
      callsRemaining
    };
  } catch {
    return { allowed: true, callsUsed: 0, callsRemaining: FREE_TIER_DAILY_LIMIT };
  }
}
__name(checkRateLimit, "checkRateLimit");
async function incrementRateLimit(env, ip) {
  try {
    const key = getTodayKey(ip);
    const raw = await env.RATE_LIMIT.get(key);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    await env.RATE_LIMIT.put(key, String(next), { expirationTtl: 86400 });
    return Math.max(0, FREE_TIER_DAILY_LIMIT - next);
  } catch {
    return 0;
  }
}
__name(incrementRateLimit, "incrementRateLimit");
async function validateApiKey(env, key) {
  try {
    if (!key.startsWith("daee_sk_")) {
      return false;
    }
    const value = await env.API_KEYS.get(key);
    return value !== null;
  } catch {
    return false;
  }
}
__name(validateApiKey, "validateApiKey");
function jsonRpcSuccess(id, result) {
  return { jsonrpc: "2.0", id, result };
}
__name(jsonRpcSuccess, "jsonRpcSuccess");
function jsonRpcError(id, code, message, data) {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}
__name(jsonRpcError, "jsonRpcError");
function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      ...headers
    }
  });
}
__name(jsonResponse, "jsonResponse");
function executeTool(toolName, args) {
  switch (toolName) {
    case "get_levy_rates": {
      const input = { sector: args.sector };
      const result = getLevyRates(input);
      return { data: result, summary: result.summary };
    }
    case "get_filing_deadlines": {
      const input = { entity_type: args.entity_type };
      const result = getFilingDeadlines(input);
      return { data: result, summary: result.summary };
    }
    case "get_pwm_wages": {
      const input = { sector: args.sector };
      const result = getPwmWages(input);
      return { data: result, summary: result.summary };
    }
    case "check_compliance_status": {
      const input = {
        entity_type: args.entity_type,
        incorporation_date: args.incorporation_date,
        financial_year_end: args.financial_year_end,
        sector: args.sector,
        has_foreign_workers: args.has_foreign_workers
      };
      const result = checkComplianceStatus(input);
      return { data: result, summary: result.summary };
    }
    case "get_sg_holidays": {
      const input = {
        year: args.year,
        start_date: args.start_date,
        num_business_days: args.num_business_days
      };
      const result = getSgHolidays(input);
      return { data: result, summary: result.summary };
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
__name(executeTool, "executeTool");
function handleInitialize(id) {
  return jsonRpcSuccess(id, {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {}
    },
    serverInfo: {
      name: SERVICE_NAME,
      version: SERVICE_VERSION
    }
  });
}
__name(handleInitialize, "handleInitialize");
function handleToolsList(id) {
  return jsonRpcSuccess(id, { tools: TOOLS });
}
__name(handleToolsList, "handleToolsList");
async function handleToolCall(id, params, env, request) {
  const toolName = params.name;
  const toolArgs = params.arguments || {};
  if (!toolName) {
    return {
      response: jsonRpcError(id, -32602, "Missing tool name in params.name"),
      status: 400
    };
  }
  const toolExists = TOOLS.some((t) => t.name === toolName);
  if (!toolExists) {
    return {
      response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}. Available tools: ${TOOLS.map((t) => t.name).join(", ")}`),
      status: 400
    };
  }
  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  let tier = "free";
  let callsRemaining = 0;
  if (apiKey && await validateApiKey(env, apiKey)) {
    tier = "paid";
    callsRemaining = -1;
  } else {
    const rateCheck = await checkRateLimit(env, clientIp);
    if (!rateCheck.allowed) {
      const meta = buildMeta("free", 0);
      return {
        response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier allows 5 calls/day. Upgrade for unlimited access.", {
          meta,
          upgrade_url: UPGRADE_URL
        }),
        status: 429
      };
    }
    await new Promise((r) => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }
  try {
    const { data, summary } = executeTool(toolName, toolArgs);
    const meta = buildMeta(tier, callsRemaining);
    return {
      response: jsonRpcSuccess(id, {
        content: [
          {
            type: "text",
            text: JSON.stringify({ data, meta }, null, 2)
          }
        ],
        _meta: { summary }
      }),
      status: 200
    };
  } catch (error) {
    const meta = buildMeta(tier, callsRemaining);
    return {
      response: jsonRpcError(id, -32603, error instanceof Error ? error.message : String(error), { meta }),
      status: 500
    };
  }
}
__name(handleToolCall, "handleToolCall");
function handleHealth() {
  return jsonResponse({
    status: "ok",
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
__name(handleHealth, "handleHealth");
function handleDiscovery() {
  return jsonResponse({
    name: SERVICE_NAME,
    version: SERVICE_VERSION,
    description: "MCP server exposing structured Singapore regulatory data to AI agents. Covers foreign worker levies, ACRA filing deadlines, Progressive Wage Model rates, compliance checklists, and public holidays.",
    protocol: "mcp",
    protocol_version: "2024-11-05",
    endpoint: "/mcp",
    capabilities: {
      tools: TOOLS.map((t) => ({ name: t.name, description: t.description }))
    },
    authentication: {
      type: "bearer",
      description: "Include API key as Bearer token for paid tier access. Free tier: 5 calls/day with 3-second delay."
    },
    pricing: {
      free: "5 calls/day with 3-second delay",
      starter: "$29/month - 1,000 calls/month",
      pro: "$99/month - 10,000 calls/month",
      enterprise: "$299/month - unlimited calls"
    },
    upgrade_url: UPGRADE_URL
  });
}
__name(handleDiscovery, "handleDiscovery");
function handleIndex() {
  return jsonResponse({
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    description: "Singapore Regulatory Data MCP Server - Structured regulatory data for AI agents. Covers foreign worker levies (MOM), ACRA filing deadlines, Progressive Wage Model (PWM) rates, compliance checklists, and SG public holidays.",
    endpoints: {
      "GET /": "This info page",
      "GET /health": "Health check",
      "GET /.well-known/mcp.json": "MCP discovery metadata",
      "POST /mcp": "MCP JSON-RPC 2.0 endpoint"
    },
    tools: TOOLS.map((t) => t.name),
    documentation: UPGRADE_URL,
    free_tier: "5 calls/day with 3-second delay. No API key required.",
    paid_tier: "Unlimited calls, no delay. Include Authorization: Bearer daee_sk_xxxxx header."
  });
}
__name(handleIndex, "handleIndex");
async function handleMcp(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(jsonRpcError(null, -32700, "Parse error: invalid JSON"), 400);
  }
  if (body.jsonrpc !== "2.0") {
    return jsonResponse(
      jsonRpcError(body.id ?? null, -32600, "Invalid request: jsonrpc must be '2.0'"),
      400
    );
  }
  const id = body.id ?? null;
  const method = body.method;
  const params = body.params || {};
  switch (method) {
    case "initialize": {
      return jsonResponse(handleInitialize(id));
    }
    case "notifications/initialized": {
      return jsonResponse(jsonRpcSuccess(id, {}));
    }
    case "tools/list": {
      return jsonResponse(handleToolsList(id));
    }
    case "tools/call": {
      const { response, status } = await handleToolCall(id, params, env, request);
      return jsonResponse(response, status);
    }
    default: {
      return jsonResponse(
        jsonRpcError(id, -32601, `Method not found: ${method}`),
        400
      );
    }
  }
}
__name(handleMcp, "handleMcp");
var index_default = {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
          }
        });
      }
      const url = new URL(request.url);
      const path = url.pathname;
      if (request.method === "GET" && path === "/health") {
        return handleHealth();
      }
      if (request.method === "GET" && path === "/.well-known/mcp.json") {
        return handleDiscovery();
      }
      if (request.method === "POST" && path === "/mcp") {
        return await handleMcp(request, env);
      }
      if (request.method === "GET" && path === "/") {
        return handleIndex();
      }
      return jsonResponse(
        {
          error: "Not found",
          available_endpoints: ["/", "/health", "/.well-known/mcp.json", "/mcp"]
        },
        404
      );
    } catch (error) {
      return jsonResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
          service: SERVICE_NAME,
          version: SERVICE_VERSION,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        },
        500
      );
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
