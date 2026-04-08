export interface FilingDeadlinesInput {
  entity_type?: string;
}

export interface EntityDeadlines {
  entity_type: string;
  display_name: string;
  deadlines: {
    requirement: string;
    deadline: string;
    details: string;
    penalty_for_late_filing: string;
  }[];
  notes: string[];
}

const FILING_DATA: EntityDeadlines[] = [
  {
    entity_type: "private_limited",
    display_name: "Private Limited Company (Pte Ltd)",
    deadlines: [
      {
        requirement: "Annual General Meeting (AGM)",
        deadline: "Within 6 months after Financial Year End (FYE)",
        details: "First AGM must be held within 18 months of incorporation. Subsequent AGMs within 6 months of FYE and no more than 15 months apart.",
        penalty_for_late_filing: "Up to $5,000 fine and/or default penalty of $500 for every day the offence continues",
      },
      {
        requirement: "Annual Return (AR)",
        deadline: "Within 30 days after AGM",
        details: "Must be filed with ACRA via BizFile+ portal. Includes company particulars, financial statements summary, and shareholder information.",
        penalty_for_late_filing: "$300 late lodgment fee. Persistent non-filing may result in striking off.",
      },
      {
        requirement: "Financial Statements (FS) Lodgment",
        deadline: "Within 30 days after AGM (filed together with AR)",
        details: "Small companies (meeting 2 of 3 criteria: revenue <= $10M, assets <= $10M, employees <= 50) may qualify for audit exemption.",
        penalty_for_late_filing: "$300 late lodgment fee as part of AR filing",
      },
      {
        requirement: "Corporate Tax Filing (Form C-S/C)",
        deadline: "30 November each year (for FYE in preceding year)",
        details: "E-filing deadline is 30 November. Paper filing deadline is 15 November. Form C-S for companies with revenue <= $5M.",
        penalty_for_late_filing: "IRAS may issue estimated Notice of Assessment (NOA). Penalties for late/non-filing apply.",
      },
      {
        requirement: "GST Returns (if GST-registered)",
        deadline: "Within 1 month after end of each prescribed accounting period",
        details: "Typically quarterly returns. Companies with taxable turnover > $1M must register for GST.",
        penalty_for_late_filing: "$200 penalty for each completed month the return is outstanding, up to $10,000",
      },
    ],
    notes: [
      "Private companies may dispense with AGM if all members pass a resolution",
      "EPC (Exempt Private Company) with revenue <= $5M can file simplified accounts",
      "XBRL filing required for financial statements since 2007",
      "Dormant companies still need to file Annual Returns",
    ],
  },
  {
    entity_type: "public_limited",
    display_name: "Public Limited Company (Ltd)",
    deadlines: [
      {
        requirement: "Annual General Meeting (AGM)",
        deadline: "Within 4 months after Financial Year End (FYE) for listed companies; 6 months for unlisted",
        details: "Listed companies on SGX have stricter timelines. Cannot dispense with AGM.",
        penalty_for_late_filing: "Up to $5,000 fine and/or default penalty",
      },
      {
        requirement: "Annual Return (AR)",
        deadline: "Within 30 days after AGM",
        details: "Full financial statements must be filed with ACRA. No exemption from audit requirement.",
        penalty_for_late_filing: "$300 late lodgment fee. Company and directors may face prosecution.",
      },
      {
        requirement: "Financial Statements (FS) Lodgment",
        deadline: "Within 30 days after AGM (filed together with AR)",
        details: "Full XBRL filing required. Must be audited - no audit exemption for public companies.",
        penalty_for_late_filing: "$300 late lodgment fee as part of AR filing",
      },
      {
        requirement: "Corporate Tax Filing (Form C)",
        deadline: "30 November each year",
        details: "Must file Form C (not C-S). E-filing deadline 30 November.",
        penalty_for_late_filing: "Estimated NOA and penalties for late/non-filing",
      },
    ],
    notes: [
      "Listed companies subject to additional SGX Listing Rules",
      "Continuous disclosure obligations apply",
      "Quarterly/semi-annual reporting may be required by SGX",
    ],
  },
  {
    entity_type: "llp",
    display_name: "Limited Liability Partnership (LLP)",
    deadlines: [
      {
        requirement: "Annual Declaration",
        deadline: "Within 15 months of registration date, then annually within 15 months of last declaration",
        details: "Declare solvency or insolvency of the LLP. Filed via BizFile+ portal.",
        penalty_for_late_filing: "$300 late lodgment fee. LLP may be struck off for non-compliance.",
      },
      {
        requirement: "Income Tax Filing",
        deadline: "15 April each year (Form P)",
        details: "LLP itself is not taxed - income flows through to partners. Must file Form P to declare income allocation.",
        penalty_for_late_filing: "Penalties for late filing by IRAS",
      },
    ],
    notes: [
      "LLPs do not need to hold AGMs",
      "No requirement to file financial statements with ACRA",
      "Must maintain proper accounting records",
      "At least 2 partners required at all times",
      "Must have a registered office in Singapore",
    ],
  },
  {
    entity_type: "sole_proprietor",
    display_name: "Sole Proprietorship",
    deadlines: [
      {
        requirement: "Business Registration Renewal",
        deadline: "Every 1 to 3 years (selected at registration)",
        details: "Must renew before expiry date. Can renew via BizFile+ portal.",
        penalty_for_late_filing: "Business will be automatically terminated if not renewed",
      },
      {
        requirement: "Personal Income Tax Filing",
        deadline: "15 April each year (paper) / 18 April (e-filing)",
        details: "Business income declared as part of personal income tax return (Form B).",
        penalty_for_late_filing: "IRAS penalties for late filing. Estimated NOA may be issued.",
      },
      {
        requirement: "GST Returns (if GST-registered)",
        deadline: "Within 1 month after end of each prescribed accounting period",
        details: "Must register for GST if taxable turnover exceeds $1M in past 12 months or expected to exceed in next 12 months.",
        penalty_for_late_filing: "$200 penalty per month outstanding, up to $10,000",
      },
    ],
    notes: [
      "No requirement to file annual returns with ACRA",
      "No audit requirement",
      "Must maintain proper records for at least 5 years",
      "Owner is personally liable for all debts",
    ],
  },
  {
    entity_type: "partnership",
    display_name: "General Partnership",
    deadlines: [
      {
        requirement: "Business Registration Renewal",
        deadline: "Every 1 to 3 years (selected at registration)",
        details: "Must renew before expiry date. Can renew via BizFile+ portal.",
        penalty_for_late_filing: "Business will be automatically terminated if not renewed",
      },
      {
        requirement: "Income Tax Filing (Form P)",
        deadline: "15 April each year",
        details: "Partnership files Form P to allocate income among partners. Each partner reports share in personal return.",
        penalty_for_late_filing: "IRAS penalties for late filing",
      },
    ],
    notes: [
      "Similar compliance requirements as sole proprietorship",
      "All partners are jointly and severally liable",
      "Must maintain proper accounting records",
      "Maximum 20 partners (except for professional partnerships)",
    ],
  },
];

export function getFilingDeadlines(input: FilingDeadlinesInput): { entities: EntityDeadlines[]; summary: string } {
  try {
    const typeFilter = input.entity_type?.toLowerCase().replace(/[\s-]/g, "_");

    if (typeFilter) {
      const matched = FILING_DATA.filter(
        (e) =>
          e.entity_type === typeFilter ||
          e.entity_type.includes(typeFilter) ||
          typeFilter.includes(e.entity_type) ||
          e.display_name.toLowerCase().includes(typeFilter.replace(/_/g, " "))
      );

      if (matched.length === 0) {
        return {
          entities: FILING_DATA,
          summary: `Entity type "${input.entity_type}" not found. Returning all entity types. Available types: ${FILING_DATA.map((e) => e.entity_type).join(", ")}`,
        };
      }

      return {
        entities: matched,
        summary: `ACRA filing deadlines for ${matched.map((e) => e.display_name).join(", ")}. Data reflects current ACRA requirements as of 2024-2025.`,
      };
    }

    return {
      entities: FILING_DATA,
      summary: `ACRA filing deadlines for all ${FILING_DATA.length} entity types. Filter by entity_type for specific results. Available types: ${FILING_DATA.map((e) => e.entity_type).join(", ")}`,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve filing deadlines: ${error instanceof Error ? error.message : String(error)}`);
  }
}
