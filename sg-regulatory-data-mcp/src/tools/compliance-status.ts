import { getLevyRates } from "./levy-rates";
import { getFilingDeadlines } from "./filing-deadlines";
import { getPwmWages } from "./pwm-wages";

export interface ComplianceStatusInput {
  entity_type: string;
  incorporation_date?: string;
  financial_year_end?: string;
  sector?: string;
  has_foreign_workers?: boolean;
}

export interface ComplianceItem {
  category: string;
  requirement: string;
  deadline: string;
  details: string;
  penalty: string;
  priority: "high" | "medium" | "low";
}

export interface ComplianceResult {
  entity_type: string;
  checklist: ComplianceItem[];
  applicable_regulations: string[];
  summary: string;
}

export function checkComplianceStatus(input: ComplianceStatusInput): ComplianceResult {
  try {
    const checklist: ComplianceItem[] = [];
    const applicableRegulations: string[] = [];

    // 1. Filing deadlines based on entity type
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
          priority: deadline.requirement.includes("AGM") || deadline.requirement.includes("Annual Return")
            ? "high"
            : deadline.requirement.includes("Tax")
              ? "high"
              : "medium",
        });
      }
    }

    // 2. If incorporation_date provided, calculate specific deadlines
    if (input.incorporation_date) {
      const incDate = new Date(input.incorporation_date);
      if (!isNaN(incDate.getTime())) {
        const entityType = input.entity_type?.toLowerCase().replace(/[\s-]/g, "_");
        if (entityType === "private_limited" || entityType === "public_limited") {
          const firstAgmDeadline = new Date(incDate);
          firstAgmDeadline.setMonth(firstAgmDeadline.getMonth() + 18);
          checklist.push({
            category: "First AGM",
            requirement: "First Annual General Meeting",
            deadline: `By ${firstAgmDeadline.toISOString().split("T")[0]} (18 months from incorporation)`,
            details: `Incorporated on ${input.incorporation_date}. First AGM must be held within 18 months of incorporation.`,
            penalty: "Up to $5,000 fine",
            priority: "high",
          });
        }
      }
    }

    // 3. If financial_year_end provided, calculate next deadlines
    if (input.financial_year_end) {
      const fyeMonth = parseInt(input.financial_year_end.split("-")[1], 10);
      const fyeDay = parseInt(input.financial_year_end.split("-")[2], 10);
      if (!isNaN(fyeMonth) && !isNaN(fyeDay)) {
        const now = new Date();
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
          priority: "high",
        });

        // Tax filing deadline
        checklist.push({
          category: "Upcoming Deadline",
          requirement: "Corporate Tax Filing (ECI)",
          deadline: `Within 3 months after FYE (${new Date(nextFye.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]})`,
          details: "Estimated Chargeable Income (ECI) must be filed within 3 months after financial year end.",
          penalty: "IRAS penalties for late filing",
          priority: "high",
        });
      }
    }

    // 4. If has_foreign_workers, add levy requirements
    if (input.has_foreign_workers) {
      applicableRegulations.push("MOM Foreign Worker Levy Requirements");
      applicableRegulations.push("Work Permit / S Pass Conditions");

      checklist.push({
        category: "Foreign Worker Compliance",
        requirement: "Monthly Foreign Worker Levy Payment",
        deadline: "14th of each month",
        details: "Levy is auto-deducted via GIRO on the 14th of each month. Ensure sufficient funds in designated bank account.",
        penalty: "Late payment penalty. Persistent non-payment may result in work permit revocation.",
        priority: "high",
      });

      checklist.push({
        category: "Foreign Worker Compliance",
        requirement: "Dependency Ratio Ceiling (DRC) Compliance",
        deadline: "Ongoing - monitored continuously",
        details: "Must not exceed the sector-specific dependency ratio ceiling for foreign workers.",
        penalty: "Unable to hire new foreign workers. Existing permits may not be renewed.",
        priority: "high",
      });

      checklist.push({
        category: "Foreign Worker Compliance",
        requirement: "Security Bond",
        deadline: "Before work permit issuance",
        details: "Security bond of $5,000 (non-Malaysian) required for each Work Permit holder.",
        penalty: "Forfeiture of bond for non-compliance with repatriation obligations.",
        priority: "medium",
      });

      // Add sector-specific levy info
      if (input.sector) {
        const levyData = getLevyRates({ sector: input.sector });
        for (const sector of levyData.sectors) {
          checklist.push({
            category: "Levy Rates",
            requirement: `Foreign Worker Levy - ${sector.sector} sector`,
            deadline: "Monthly payment",
            details: `Tier 1: $${sector.tiers[0]?.monthly_levy}/month, Tier 2: $${sector.tiers[1]?.monthly_levy}/month. DRC: ${sector.dependency_ratio_ceiling.map((d) => `${d.category}: ${d.ceiling_percent}%`).join(", ")}`,
            penalty: "Late payment penalties apply",
            priority: "medium",
          });
        }
      }
    }

    // 5. If sector provided, check PWM applicability
    if (input.sector) {
      const pwmData = getPwmWages({ sector: input.sector });
      if (pwmData.sectors.length > 0 && !pwmData.summary.includes("not found")) {
        applicableRegulations.push("Progressive Wage Model (PWM) Requirements");
        for (const sector of pwmData.sectors) {
          const lowestWage = sector.job_levels.reduce(
            (min, jl) => (jl.gross_monthly_wage < min ? jl.gross_monthly_wage : min),
            Infinity
          );
          checklist.push({
            category: "PWM Compliance",
            requirement: `Progressive Wage Model - ${sector.display_name}`,
            deadline: `Effective from ${sector.effective_date}`,
            details: `Minimum gross monthly wage starts at $${lowestWage}. ${sector.job_levels.length} job levels defined. Workers must be paid at or above PWM rates.`,
            penalty: "Non-compliance may result in inability to hire foreign workers and debarment from government contracts.",
            priority: "high",
          });
        }
      }
    }

    // 6. Common compliance items for all companies
    const entityType = input.entity_type?.toLowerCase().replace(/[\s-]/g, "_");
    if (entityType === "private_limited" || entityType === "public_limited") {
      applicableRegulations.push("Companies Act (Cap 50) Requirements");

      checklist.push({
        category: "General Compliance",
        requirement: "Maintain Registered Office",
        deadline: "Ongoing",
        details: "Must maintain a registered office address in Singapore that is open and accessible to the public during business hours.",
        penalty: "Company may be struck off the register",
        priority: "medium",
      });

      checklist.push({
        category: "General Compliance",
        requirement: "Company Secretary Appointment",
        deadline: "Within 6 months of incorporation",
        details: "Must appoint a qualified company secretary who is a natural person ordinarily resident in Singapore.",
        penalty: "Up to $5,000 fine for the company and every officer in default",
        priority: "high",
      });

      checklist.push({
        category: "General Compliance",
        requirement: "Maintain Statutory Registers",
        deadline: "Ongoing",
        details: "Must maintain register of members, register of directors, register of charges, and other statutory registers.",
        penalty: "Up to $5,000 fine",
        priority: "medium",
      });
    }

    // Sort checklist by priority
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    checklist.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return {
      entity_type: input.entity_type,
      checklist,
      applicable_regulations: applicableRegulations,
      summary: `Compliance checklist for ${input.entity_type} entity with ${checklist.length} items across ${applicableRegulations.length} regulatory areas. ${checklist.filter((c) => c.priority === "high").length} high-priority items identified.`,
    };
  } catch (error) {
    throw new Error(
      `Failed to check compliance status: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
