// ---------------------------------------------------------------------------
// ASEAN Trade Rules — Static Data
// ---------------------------------------------------------------------------

export const RCEP_MEMBERS = [
  "AU", "BN", "KH", "CN", "ID", "JP", "KR", "LA", "MY", "MM", "NZ", "PH", "SG", "TH", "VN"
];

export const CPTPP_MEMBERS = [
  "AU", "BN", "CA", "CL", "JP", "MY", "MX", "NZ", "PE", "SG", "GB", "VN"
];

export const ASEAN_MEMBERS = [
  "BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "VN"
];

export const SG_BILATERAL_FTAS: Record<string, { name: string; partner: string; year: number }> = {
  US: { name: "USSFTA", partner: "US", year: 2004 },
  EU: { name: "EUSFTA", partner: "EU", year: 2019 },
  KR: { name: "KSFTA", partner: "KR", year: 2006 },
  JP: { name: "JSEPA", partner: "JP", year: 2002 },
  CN: { name: "CSFTA", partner: "CN", year: 2009 },
  IN: { name: "CECA", partner: "IN", year: 2005 },
  PA: { name: "PSFTA", partner: "PA", year: 2006 },
  NZ: { name: "ANZSCEP", partner: "NZ", year: 2001 },
  AU: { name: "SAFTA", partner: "AU", year: 2003 },
  TW: { name: "ASTEP", partner: "TW", year: 2014 },
};

export const COUNTRY_ALIASES: Record<string, string> = {
  australia: "AU", singapore: "SG", malaysia: "MY", thailand: "TH",
  indonesia: "ID", vietnam: "VN", philippines: "PH", japan: "JP",
  china: "CN", "south korea": "KR", korea: "KR", "new zealand": "NZ",
  brunei: "BN", cambodia: "KH", laos: "LA", myanmar: "MM",
  canada: "CA", chile: "CL", mexico: "MX", peru: "PE",
  "united kingdom": "GB", uk: "GB", "united states": "US", us: "US", usa: "US",
  india: "IN", taiwan: "TW", panama: "PA",
  eu: "EU", "european union": "EU",
};

export interface HsCategory {
  chapters: string;
  name: string;
  rcep: string;
  cptpp: string;
  sensitivity: string;
}

export const HS_CATEGORIES: HsCategory[] = [
  { chapters: "01-24", name: "Agriculture & Food", rcep: "phased_reduction", cptpp: "phased_reduction", sensitivity: "sensitive" },
  { chapters: "25-27", name: "Minerals & Fuels", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
  { chapters: "28-38", name: "Chemicals", rcep: "phased_reduction", cptpp: "immediate_elimination", sensitivity: "medium" },
  { chapters: "39-40", name: "Plastics & Rubber", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
  { chapters: "41-43", name: "Leather & Hides", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
  { chapters: "44-49", name: "Wood & Paper", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
  { chapters: "50-63", name: "Textiles & Apparel", rcep: "phased_reduction", cptpp: "phased_reduction", sensitivity: "sensitive" },
  { chapters: "64-67", name: "Footwear & Headgear", rcep: "phased_reduction", cptpp: "immediate_elimination", sensitivity: "medium" },
  { chapters: "68-71", name: "Stone, Glass & Precious Metals", rcep: "phased_reduction", cptpp: "phased_reduction", sensitivity: "medium" },
  { chapters: "72-83", name: "Base Metals", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
  { chapters: "84-85", name: "Machinery & Electronics", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
  { chapters: "86-89", name: "Vehicles & Transport", rcep: "phased_reduction", cptpp: "phased_reduction", sensitivity: "sensitive" },
  { chapters: "90-97", name: "Instruments & Miscellaneous", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" },
];

export const MFN_RATES: Record<string, { avg_mfn: number; pref_rcep: number; pref_cptpp: number }> = {
  SG: { avg_mfn: 0, pref_rcep: 0, pref_cptpp: 0 },
  MY: { avg_mfn: 7, pref_rcep: 2, pref_cptpp: 1 },
  TH: { avg_mfn: 11, pref_rcep: 3, pref_cptpp: 0 },
  ID: { avg_mfn: 9, pref_rcep: 3, pref_cptpp: 0 },
  VN: { avg_mfn: 10, pref_rcep: 3, pref_cptpp: 1 },
  PH: { avg_mfn: 7, pref_rcep: 2, pref_cptpp: 0 },
  CN: { avg_mfn: 8, pref_rcep: 3, pref_cptpp: 0 },
  JP: { avg_mfn: 5, pref_rcep: 1, pref_cptpp: 0 },
  AU: { avg_mfn: 4.5, pref_rcep: 0, pref_cptpp: 0 },
  NZ: { avg_mfn: 3, pref_rcep: 0, pref_cptpp: 0 },
  KR: { avg_mfn: 8, pref_rcep: 2, pref_cptpp: 0 },
  CA: { avg_mfn: 4, pref_rcep: 0, pref_cptpp: 0 },
  MX: { avg_mfn: 7, pref_rcep: 0, pref_cptpp: 2 },
  PE: { avg_mfn: 4, pref_rcep: 0, pref_cptpp: 0 },
  CL: { avg_mfn: 6, pref_rcep: 0, pref_cptpp: 0 },
  GB: { avg_mfn: 4, pref_rcep: 0, pref_cptpp: 0 },
  BN: { avg_mfn: 3, pref_rcep: 0, pref_cptpp: 0 },
  KH: { avg_mfn: 12, pref_rcep: 4, pref_cptpp: 0 },
  LA: { avg_mfn: 10, pref_rcep: 3, pref_cptpp: 0 },
  MM: { avg_mfn: 5, pref_rcep: 2, pref_cptpp: 0 },
};

export const DOCUMENTATION: Record<string, { certificate: string; certification_type: string; form: string; notes: string[]; general_docs: string[] }> = {
  RCEP: {
    certificate: "Certificate of Origin (Form RCEP)",
    certification_type: "Third-party certification, approved exporter self-certification, or origin declaration (consignments under USD 200)",
    form: "Form RCEP",
    notes: [
      "CO issued by authorized body in exporting country",
      "Self-certification available for approved exporters",
      "Origin declaration for consignments valued under USD 200",
      "Back-to-back CO available for goods transshipped through third RCEP country",
    ],
    general_docs: ["Commercial invoice", "Packing list", "Bill of lading / Airway bill", "Import permit (if applicable)"],
  },
  CPTPP: {
    certificate: "Origin declaration (self-certification)",
    certification_type: "Self-certification by importer, exporter, or producer",
    form: "No mandatory form — origin declaration on commercial invoice or separate document",
    notes: [
      "No mandatory Certificate of Origin form",
      "Importer, exporter, or producer can self-certify",
      "Declaration must include specified data elements",
      "Records must be kept for minimum 5 years",
    ],
    general_docs: ["Commercial invoice with origin declaration", "Packing list", "Bill of lading / Airway bill", "Import permit (if applicable)"],
  },
  AFTA: {
    certificate: "Certificate of Origin Form D",
    certification_type: "Third-party certification by authorized government body",
    form: "Form D (ATIGA Certificate of Origin)",
    notes: [
      "e-ATIGA Form D available for electronic submission",
      "Issued by authorized body in exporting ASEAN country",
      "Must be presented within 12 months of issue",
      "Back-to-back Form D available for third-country invoicing",
    ],
    general_docs: ["Commercial invoice", "Packing list", "Bill of lading / Airway bill", "ASEAN Trade in Goods Agreement declaration"],
  },
  USSFTA: {
    certificate: "Origin declaration (self-certification)",
    certification_type: "Self-certification",
    form: "No mandatory form — declaration on invoice",
    notes: ["Importer or exporter self-certifies", "No prescribed form required"],
    general_docs: ["Commercial invoice", "Packing list", "Bill of lading"],
  },
  EUSFTA: {
    certificate: "EUR.1 Movement Certificate or origin declaration",
    certification_type: "Third-party (EUR.1) or approved exporter self-certification",
    form: "EUR.1 or origin declaration by approved exporter",
    notes: [
      "EUR.1 issued by Singapore Customs",
      "Approved exporters may issue origin declarations",
      "REX system registration for consignments over EUR 6,000",
    ],
    general_docs: ["Commercial invoice", "EUR.1 or origin declaration", "Packing list", "Bill of lading"],
  },
};

export const SG_SPECIFIC_DOCS = {
  tradenet: "All imports/exports must be declared via Singapore Customs TradeNet system",
  permits: "Import permits required for controlled goods (strategic goods, food, pharmaceuticals)",
  back_to_back_co: "For re-exports: Singapore Customs can issue back-to-back CO if goods maintain ASEAN origin",
  gsp: "Singapore does not grant GSP preferences (developed country status)",
};
