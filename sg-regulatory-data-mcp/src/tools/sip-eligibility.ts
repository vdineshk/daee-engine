export interface SipEligibilityInput {
  entity_type?: string;
  total_liabilities?: number;
  annual_revenue?: number;
  num_employees?: number;
  num_creditors?: number;
}

interface SipTrack {
  track: string;
  description: string;
  eligibility_criteria: string[];
  process_duration: string;
  key_features: string[];
}

const SIP_TRACKS: SipTrack[] = [
  {
    track: "Track D (Dissolution)",
    description: "Simplified dissolution for micro and small companies with no assets or minimal assets and debts that can be resolved.",
    eligibility_criteria: [
      "Company must be a Singapore-incorporated company",
      "Total liabilities do not exceed $150,000",
      "Company has no more than 30 creditors",
      "Company is not listed on any securities exchange",
      "Company is not regulated by MAS",
    ],
    process_duration: "Approximately 90 days from application",
    key_features: [
      "No requirement to appoint liquidator",
      "ACRA-administered process",
      "Lower cost compared to formal winding up",
      "Automatic dissolution if no objections",
      "Directors remain responsible for company obligations during process",
    ],
  },
  {
    track: "Track R (Restructuring)",
    description: "Simplified restructuring for small companies seeking to reach a compromise with creditors.",
    eligibility_criteria: [
      "Company must be a Singapore-incorporated company",
      "Annual revenue does not exceed $10 million",
      "Total liabilities do not exceed $2 million",
      "Company has no more than 50 creditors and 30 employees",
      "Company is not listed on any securities exchange",
      "Company is not regulated by MAS",
    ],
    process_duration: "Approximately 90 to 120 days from application",
    key_features: [
      "Automatic moratorium on legal proceedings upon application",
      "Restructuring advisor appointed (instead of full insolvency practitioner)",
      "Lower professional fees compared to formal schemes of arrangement",
      "Creditor vote requires 2/3 by value and majority by number",
      "Court approval binds all creditors if approved",
    ],
  },
];

export function getSipEligibility(input: SipEligibilityInput): {
  tracks: Record<string, unknown>[];
  eligibility_assessment: Record<string, unknown> | null;
  summary: string;
} {
  const totalLiabilities = input.total_liabilities;
  const annualRevenue = input.annual_revenue;
  const numEmployees = input.num_employees;
  const numCreditors = input.num_creditors;

  const tracks = SIP_TRACKS.map((t) => ({
    track: t.track,
    description: t.description,
    eligibility_criteria: t.eligibility_criteria,
    process_duration: t.process_duration,
    key_features: t.key_features,
  }));

  let eligibilityAssessment: Record<string, unknown> | null = null;

  if (totalLiabilities !== undefined || numCreditors !== undefined) {
    const trackDEligible =
      (totalLiabilities === undefined || totalLiabilities <= 150000) &&
      (numCreditors === undefined || numCreditors <= 30);

    const trackREligible =
      (totalLiabilities === undefined || totalLiabilities <= 2000000) &&
      (annualRevenue === undefined || annualRevenue <= 10000000) &&
      (numEmployees === undefined || numEmployees <= 30) &&
      (numCreditors === undefined || numCreditors <= 50);

    eligibilityAssessment = {
      input_provided: {
        total_liabilities: totalLiabilities ?? "not provided",
        annual_revenue: annualRevenue ?? "not provided",
        num_employees: numEmployees ?? "not provided",
        num_creditors: numCreditors ?? "not provided",
      },
      track_d_dissolution: {
        likely_eligible: trackDEligible,
        blockers: [
          ...(totalLiabilities !== undefined && totalLiabilities > 150000 ? [`Total liabilities $${totalLiabilities} exceeds $150,000 limit`] : []),
          ...(numCreditors !== undefined && numCreditors > 30 ? [`${numCreditors} creditors exceeds 30-creditor limit`] : []),
        ],
      },
      track_r_restructuring: {
        likely_eligible: trackREligible,
        blockers: [
          ...(totalLiabilities !== undefined && totalLiabilities > 2000000 ? [`Total liabilities $${totalLiabilities} exceeds $2,000,000 limit`] : []),
          ...(annualRevenue !== undefined && annualRevenue > 10000000 ? [`Annual revenue $${annualRevenue} exceeds $10,000,000 limit`] : []),
          ...(numEmployees !== undefined && numEmployees > 30 ? [`${numEmployees} employees exceeds 30-employee limit`] : []),
          ...(numCreditors !== undefined && numCreditors > 50 ? [`${numCreditors} creditors exceeds 50-creditor limit`] : []),
        ],
      },
      disclaimer: "This is a preliminary assessment only. Actual eligibility depends on additional factors including MAS regulation status and exchange listing status. Consult a qualified insolvency practitioner.",
    };
  }

  const summaryParts = ["SIP 2.0 (Simplified Insolvency Programme) launched 29 January 2026."];
  if (eligibilityAssessment) {
    const dStatus = (eligibilityAssessment.track_d_dissolution as Record<string, unknown>).likely_eligible ? "likely eligible" : "likely NOT eligible";
    const rStatus = (eligibilityAssessment.track_r_restructuring as Record<string, unknown>).likely_eligible ? "likely eligible" : "likely NOT eligible";
    summaryParts.push(`Track D: ${dStatus}. Track R: ${rStatus}.`);
  } else {
    summaryParts.push("Two tracks available: Track D (Dissolution) for liabilities up to $150K, Track R (Restructuring) for liabilities up to $2M.");
  }

  return {
    tracks,
    eligibility_assessment: eligibilityAssessment,
    summary: summaryParts.join(" "),
  };
}
