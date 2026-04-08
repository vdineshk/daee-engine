var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/data.ts
var RCEP_MEMBERS = [
  "AU",
  "BN",
  "KH",
  "CN",
  "ID",
  "JP",
  "KR",
  "LA",
  "MY",
  "MM",
  "NZ",
  "PH",
  "SG",
  "TH",
  "VN"
];
var CPTPP_MEMBERS = [
  "AU",
  "BN",
  "CA",
  "CL",
  "JP",
  "MY",
  "MX",
  "NZ",
  "PE",
  "SG",
  "GB",
  "VN"
];
var ASEAN_MEMBERS = [
  "BN",
  "KH",
  "ID",
  "LA",
  "MY",
  "MM",
  "PH",
  "SG",
  "TH",
  "VN"
];
var SG_BILATERAL_FTAS = {
  US: { name: "USSFTA", partner: "US", year: 2004 },
  EU: { name: "EUSFTA", partner: "EU", year: 2019 },
  KR: { name: "KSFTA", partner: "KR", year: 2006 },
  JP: { name: "JSEPA", partner: "JP", year: 2002 },
  CN: { name: "CSFTA", partner: "CN", year: 2009 },
  IN: { name: "CECA", partner: "IN", year: 2005 },
  PA: { name: "PSFTA", partner: "PA", year: 2006 },
  NZ: { name: "ANZSCEP", partner: "NZ", year: 2001 },
  AU: { name: "SAFTA", partner: "AU", year: 2003 },
  TW: { name: "ASTEP", partner: "TW", year: 2014 }
};
var COUNTRY_ALIASES = {
  australia: "AU",
  singapore: "SG",
  malaysia: "MY",
  thailand: "TH",
  indonesia: "ID",
  vietnam: "VN",
  philippines: "PH",
  japan: "JP",
  china: "CN",
  "south korea": "KR",
  korea: "KR",
  "new zealand": "NZ",
  brunei: "BN",
  cambodia: "KH",
  laos: "LA",
  myanmar: "MM",
  canada: "CA",
  chile: "CL",
  mexico: "MX",
  peru: "PE",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  us: "US",
  usa: "US",
  india: "IN",
  taiwan: "TW",
  panama: "PA",
  eu: "EU",
  "european union": "EU"
};
var HS_CATEGORIES = [
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
  { chapters: "90-97", name: "Instruments & Miscellaneous", rcep: "immediate_elimination", cptpp: "immediate_elimination", sensitivity: "low" }
];
var MFN_RATES = {
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
  MM: { avg_mfn: 5, pref_rcep: 2, pref_cptpp: 0 }
};
var DOCUMENTATION = {
  RCEP: {
    certificate: "Certificate of Origin (Form RCEP)",
    certification_type: "Third-party certification, approved exporter self-certification, or origin declaration (consignments under USD 200)",
    form: "Form RCEP",
    notes: [
      "CO issued by authorized body in exporting country",
      "Self-certification available for approved exporters",
      "Origin declaration for consignments valued under USD 200",
      "Back-to-back CO available for goods transshipped through third RCEP country"
    ],
    general_docs: ["Commercial invoice", "Packing list", "Bill of lading / Airway bill", "Import permit (if applicable)"]
  },
  CPTPP: {
    certificate: "Origin declaration (self-certification)",
    certification_type: "Self-certification by importer, exporter, or producer",
    form: "No mandatory form \u2014 origin declaration on commercial invoice or separate document",
    notes: [
      "No mandatory Certificate of Origin form",
      "Importer, exporter, or producer can self-certify",
      "Declaration must include specified data elements",
      "Records must be kept for minimum 5 years"
    ],
    general_docs: ["Commercial invoice with origin declaration", "Packing list", "Bill of lading / Airway bill", "Import permit (if applicable)"]
  },
  AFTA: {
    certificate: "Certificate of Origin Form D",
    certification_type: "Third-party certification by authorized government body",
    form: "Form D (ATIGA Certificate of Origin)",
    notes: [
      "e-ATIGA Form D available for electronic submission",
      "Issued by authorized body in exporting ASEAN country",
      "Must be presented within 12 months of issue",
      "Back-to-back Form D available for third-country invoicing"
    ],
    general_docs: ["Commercial invoice", "Packing list", "Bill of lading / Airway bill", "ASEAN Trade in Goods Agreement declaration"]
  },
  USSFTA: {
    certificate: "Origin declaration (self-certification)",
    certification_type: "Self-certification",
    form: "No mandatory form \u2014 declaration on invoice",
    notes: ["Importer or exporter self-certifies", "No prescribed form required"],
    general_docs: ["Commercial invoice", "Packing list", "Bill of lading"]
  },
  EUSFTA: {
    certificate: "EUR.1 Movement Certificate or origin declaration",
    certification_type: "Third-party (EUR.1) or approved exporter self-certification",
    form: "EUR.1 or origin declaration by approved exporter",
    notes: [
      "EUR.1 issued by Singapore Customs",
      "Approved exporters may issue origin declarations",
      "REX system registration for consignments over EUR 6,000"
    ],
    general_docs: ["Commercial invoice", "EUR.1 or origin declaration", "Packing list", "Bill of lading"]
  }
};
var SG_SPECIFIC_DOCS = {
  tradenet: "All imports/exports must be declared via Singapore Customs TradeNet system",
  permits: "Import permits required for controlled goods (strategic goods, food, pharmaceuticals)",
  back_to_back_co: "For re-exports: Singapore Customs can issue back-to-back CO if goods maintain ASEAN origin",
  gsp: "Singapore does not grant GSP preferences (developed country status)"
};

// src/index.ts
var SERVICE_NAME = "asean-trade-rules-mcp";
var SERVICE_VERSION = "1.0.0";
var UPGRADE_URL = "https://daee-asean-trade.vercel.app";
var FREE_TIER_DAILY_LIMIT = 5;
var FREE_TIER_DELAY_MS = 3e3;
function normalizeCountry(input) {
  const trimmed = input.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  return COUNTRY_ALIASES[trimmed.toLowerCase()] || trimmed.toUpperCase().slice(0, 2);
}
__name(normalizeCountry, "normalizeCountry");
function getHsChapter(hsCode) {
  const cleaned = hsCode.replace(/[.\-\s]/g, "");
  return parseInt(cleaned.slice(0, 2), 10);
}
__name(getHsChapter, "getHsChapter");
function getHsCategory(chapter) {
  for (const cat of HS_CATEGORIES) {
    const [start, end] = cat.chapters.split("-").map(Number);
    if (chapter >= start && chapter <= end) return cat;
  }
  return null;
}
__name(getHsCategory, "getHsCategory");
function getApplicableFtas(origin, destination) {
  const ftas = [];
  if (RCEP_MEMBERS.includes(origin) && RCEP_MEMBERS.includes(destination)) {
    ftas.push({ name: "RCEP", type: "multilateral", members: 15 });
  }
  if (CPTPP_MEMBERS.includes(origin) && CPTPP_MEMBERS.includes(destination)) {
    ftas.push({ name: "CPTPP", type: "multilateral", members: 12 });
  }
  if (ASEAN_MEMBERS.includes(origin) && ASEAN_MEMBERS.includes(destination)) {
    ftas.push({ name: "AFTA/ATIGA", type: "regional", members: 10 });
  }
  if (origin === "SG" && SG_BILATERAL_FTAS[destination]) {
    const b = SG_BILATERAL_FTAS[destination];
    ftas.push({ name: b.name, type: "bilateral", members: 2, year: b.year });
  } else if (destination === "SG" && SG_BILATERAL_FTAS[origin]) {
    const b = SG_BILATERAL_FTAS[origin];
    ftas.push({ name: b.name, type: "bilateral", members: 2, year: b.year });
  }
  return ftas;
}
__name(getApplicableFtas, "getApplicableFtas");
var TOOLS = [
  {
    name: "check_fta_eligibility",
    description: "Given HS code + origin + destination, return applicable FTAs with tariff rates. Use this tool when you need to determine which free trade agreements apply to a product traded in Asia-Pacific.",
    inputSchema: {
      type: "object",
      properties: {
        hs_code: { type: "string", description: "HS code (2-10 digits)" },
        origin_country: { type: "string", description: "Country of origin (ISO 2-letter code or name)" },
        destination_country: { type: "string", description: "Destination country (ISO 2-letter code or name)" }
      },
      required: ["hs_code", "origin_country", "destination_country"]
    }
  },
  {
    name: "get_rules_of_origin",
    description: "Product-specific rules for qualifying under each FTA. Use this tool when you need to verify whether a product meets origin requirements for preferential tariffs.",
    inputSchema: {
      type: "object",
      properties: {
        hs_code: { type: "string", description: "HS code (2-10 digits)" },
        fta: { type: "string", description: "FTA name: RCEP, CPTPP, AFTA, USSFTA, EUSFTA, etc." }
      },
      required: ["hs_code", "fta"]
    }
  },
  {
    name: "calculate_tariff_savings",
    description: "Compare MFN rate vs preferential rate for a product-route. Use this tool when you need to quantify the financial benefit of using a free trade agreement.",
    inputSchema: {
      type: "object",
      properties: {
        hs_code: { type: "string", description: "HS code (2-10 digits)" },
        origin_country: { type: "string", description: "Country of origin" },
        destination_country: { type: "string", description: "Destination country" },
        shipment_value_usd: { type: "number", description: "Shipment value in USD" }
      },
      required: ["hs_code", "origin_country", "destination_country", "shipment_value_usd"]
    }
  },
  {
    name: "get_documentation_requirements",
    description: "Required certificates and forms for each FTA. Use this tool when you need to know what paperwork is required to claim preferential tariff treatment.",
    inputSchema: {
      type: "object",
      properties: {
        fta: { type: "string", description: "FTA name: RCEP, CPTPP, AFTA, USSFTA, EUSFTA" },
        origin_country: { type: "string", description: "Country of origin (optional, for SG-specific guidance)" }
      },
      required: ["fta"]
    }
  }
];
function executeTool(name, args) {
  switch (name) {
    case "check_fta_eligibility":
      return toolCheckFtaEligibility(args);
    case "get_rules_of_origin":
      return toolGetRulesOfOrigin(args);
    case "calculate_tariff_savings":
      return toolCalculateTariffSavings(args);
    case "get_documentation_requirements":
      return toolGetDocumentation(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
__name(executeTool, "executeTool");
function toolCheckFtaEligibility(args) {
  const hsCode = (args.hs_code || "").replace(/[.\-\s]/g, "");
  const origin = normalizeCountry(args.origin_country || "");
  const dest = normalizeCountry(args.destination_country || "");
  if (!hsCode || hsCode.length < 2) throw new Error("hs_code must be at least 2 digits");
  const chapter = getHsChapter(hsCode);
  const category = getHsCategory(chapter);
  const ftas = getApplicableFtas(origin, dest);
  const ftaDetails = ftas.map((fta) => ({
    ...fta,
    tariff_treatment: category ? fta.name === "CPTPP" ? category.cptpp : category.rcep : "unknown",
    product_category: category?.name || "Unknown",
    sensitivity: category?.sensitivity || "unknown"
  }));
  return {
    data: {
      hs_code: hsCode,
      hs_chapter: chapter,
      origin,
      destination: dest,
      product_category: category?.name || "Unknown HS chapter",
      applicable_ftas: ftaDetails,
      fta_count: ftas.length,
      recommendation: ftas.length > 0 ? `${ftas.length} FTA(s) available. ${ftas.some((f) => f.name === "CPTPP") ? "CPTPP generally offers deepest tariff cuts (99% elimination)." : "RCEP covers 92% tariff lines over 20 years."}` : "No FTA coverage found between these countries for preferential tariff treatment."
    },
    summary: `HS ${hsCode} from ${origin} to ${dest}: ${ftas.length} FTA(s) applicable \u2014 ${ftas.map((f) => f.name).join(", ") || "none"}.`
  };
}
__name(toolCheckFtaEligibility, "toolCheckFtaEligibility");
function toolGetRulesOfOrigin(args) {
  const hsCode = (args.hs_code || "").replace(/[.\-\s]/g, "");
  const fta = (args.fta || "").toUpperCase();
  const chapter = getHsChapter(hsCode);
  const category = getHsCategory(chapter);
  const isTextile = chapter >= 50 && chapter <= 63;
  const isAuto = chapter === 87;
  const isElectronics = chapter >= 84 && chapter <= 85;
  let rules;
  if (fta === "RCEP") {
    rules = {
      fta: "RCEP",
      general_rule: "Regional Value Content (RVC) >= 40% OR Change in Tariff Classification (CTC) at HS 4-digit level",
      rvc_threshold: "40%",
      rvc_method: "Build-up or Build-down",
      ctc_level: "Change in Tariff Heading (CTH) \u2014 4-digit level",
      cumulation: "Full cumulation among all 15 RCEP members",
      de_minimis: "10% of FOB value for non-originating materials",
      special_rules: isTextile ? { note: "Textiles (HS 50-63): Specific Product-Specific Rules apply. Generally requires processing from yarn stage within RCEP." } : isAuto ? { note: "Automotive (HS 87): RVC 40% initially, rising to 50% after 15 years for some parties. Product-specific rules apply." } : isElectronics ? { note: "Electronics (HS 84-85): CTC at 4-digit or RVC 40%. Most electronics qualify easily." } : null
    };
  } else if (fta === "CPTPP") {
    rules = {
      fta: "CPTPP",
      general_rule: "RVC >= 45% (build-up) or >= 35% (build-down) OR CTC varies by product",
      rvc_build_up: "45%",
      rvc_build_down: "35%",
      ctc_level: "Varies by product \u2014 check Annex 3-D of CPTPP",
      cumulation: "Full cumulation among CPTPP members",
      de_minimis: "10% of transaction value",
      special_rules: isTextile ? { note: "Textiles (HS 50-63): 'Yarn-forward' rule \u2014 yarn must be formed in a CPTPP country. Short supply list exceptions available." } : isAuto ? { note: "Automotive (HS 87): RVC 75% for vehicles. Phased in over time. Steel/aluminum requirements apply." } : isElectronics ? { note: "Electronics (HS 84-85): Generally CTC at 4-digit or RVC 45%. Most ITA products already duty-free." } : null
    };
  } else if (fta === "AFTA" || fta === "ATIGA") {
    rules = {
      fta: "AFTA/ATIGA",
      general_rule: "RVC >= 40% OR CTC at HS 4-digit level",
      rvc_threshold: "40%",
      ctc_level: "Change in Tariff Heading (CTH) \u2014 4-digit level",
      cumulation: "ASEAN cumulation \u2014 materials from any ASEAN member count as originating",
      de_minimis: "10% of FOB value",
      special_rules: isAuto ? { note: "Automotive: ASEAN members maintain varying exclusion lists. Check national schedules." } : null
    };
  } else {
    rules = {
      fta,
      note: `Specific rules for ${fta} not in database. Common FTAs: RCEP, CPTPP, AFTA, USSFTA, EUSFTA.`,
      general_guidance: "Most FTAs use RVC 35-45% or CTC at 4-digit level as general qualifying criteria."
    };
  }
  return {
    data: { hs_code: hsCode, hs_chapter: chapter, product_category: category?.name || "Unknown", rules_of_origin: rules },
    summary: `Rules of origin for HS ${hsCode} under ${fta}: ${fta === "RCEP" ? "RVC>=40% or CTC" : fta === "CPTPP" ? "RVC>=45%/35% or CTC" : "RVC>=40% or CTC"}.`
  };
}
__name(toolGetRulesOfOrigin, "toolGetRulesOfOrigin");
function toolCalculateTariffSavings(args) {
  const hsCode = (args.hs_code || "").replace(/[.\-\s]/g, "");
  const origin = normalizeCountry(args.origin_country || "");
  const dest = normalizeCountry(args.destination_country || "");
  const value = args.shipment_value_usd || 0;
  if (value <= 0) throw new Error("shipment_value_usd must be positive");
  const destRates = MFN_RATES[dest];
  if (!destRates) throw new Error(`No tariff data for destination: ${dest}. Available: ${Object.keys(MFN_RATES).join(", ")}`);
  const ftas = getApplicableFtas(origin, dest);
  const mfnDuty = value * (destRates.avg_mfn / 100);
  const savings = ftas.map((fta) => {
    const prefRate = fta.name === "CPTPP" ? destRates.pref_cptpp : destRates.pref_rcep;
    const prefDuty = value * (prefRate / 100);
    const saved = mfnDuty - prefDuty;
    return {
      fta: fta.name,
      preferential_rate_pct: prefRate,
      preferential_duty_usd: Math.round(prefDuty * 100) / 100,
      savings_usd: Math.round(saved * 100) / 100,
      savings_pct: Math.round(saved / Math.max(mfnDuty, 0.01) * 1e4) / 100
    };
  });
  const bestFta = savings.reduce((best, s) => s.savings_usd > best.savings_usd ? s : best, savings[0] || { fta: "none", savings_usd: 0 });
  return {
    data: {
      hs_code: hsCode,
      origin,
      destination: dest,
      shipment_value_usd: value,
      mfn_rate_pct: destRates.avg_mfn,
      mfn_duty_usd: Math.round(mfnDuty * 100) / 100,
      fta_comparisons: savings,
      best_option: bestFta.fta !== "none" ? { fta: bestFta.fta, savings_usd: bestFta.savings_usd } : null,
      note: dest === "SG" ? "Singapore is a free port with 0% MFN on nearly all goods. No FTA savings applicable." : void 0
    },
    summary: bestFta.fta !== "none" ? `Best FTA: ${bestFta.fta} saves USD ${bestFta.savings_usd} on USD ${value} shipment (${dest} MFN ${destRates.avg_mfn}%).` : `No FTA coverage for ${origin} to ${dest}. MFN duty: USD ${Math.round(mfnDuty * 100) / 100}.`
  };
}
__name(toolCalculateTariffSavings, "toolCalculateTariffSavings");
function toolGetDocumentation(args) {
  const fta = (args.fta || "").toUpperCase();
  const origin = args.origin_country ? normalizeCountry(args.origin_country) : null;
  const docs = DOCUMENTATION[fta];
  if (!docs) {
    return {
      data: { fta, available_ftas: Object.keys(DOCUMENTATION), note: `Documentation for ${fta} not in database.` },
      summary: `No documentation data for ${fta}. Available: ${Object.keys(DOCUMENTATION).join(", ")}.`
    };
  }
  const result = {
    fta,
    ...docs,
    singapore_specific: origin === "SG" || !origin ? SG_SPECIFIC_DOCS : void 0
  };
  return {
    data: result,
    summary: `${fta} requires: ${docs.certificate}. Certification: ${docs.certification_type}.`
  };
}
__name(toolGetDocumentation, "toolGetDocumentation");
function buildMeta(tier, callsRemainingToday) {
  return {
    tier,
    calls_remaining_today: callsRemainingToday,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    source: SERVICE_NAME,
    version: SERVICE_VERSION,
    upgrade_url: UPGRADE_URL,
    pricing: { starter: "$29/month - 1,000 calls/month", pro: "$99/month - 10,000 calls/month", enterprise: "$299/month - unlimited calls" },
    related_tools: { "sg-regulatory-data": "https://sg-regulatory-data-mcp.workers.dev", "sg-company-lookup": "https://sg-company-lookup-mcp.workers.dev" }
  };
}
__name(buildMeta, "buildMeta");
function getTodayKey(ip) {
  return `rate:${ip}:${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`;
}
__name(getTodayKey, "getTodayKey");
async function checkRateLimit(env, ip) {
  try {
    const raw = await env.RATE_LIMIT.get(getTodayKey(ip));
    const used = raw ? parseInt(raw, 10) : 0;
    return { allowed: used < FREE_TIER_DAILY_LIMIT, callsUsed: used, callsRemaining: Math.max(0, FREE_TIER_DAILY_LIMIT - used) };
  } catch {
    return { allowed: true, callsUsed: 0, callsRemaining: FREE_TIER_DAILY_LIMIT };
  }
}
__name(checkRateLimit, "checkRateLimit");
async function incrementRateLimit(env, ip) {
  try {
    const key = getTodayKey(ip);
    const next = (await env.RATE_LIMIT.get(key) ? parseInt(await env.RATE_LIMIT.get(key), 10) : 0) + 1;
    await env.RATE_LIMIT.put(key, String(next), { expirationTtl: 86400 });
    return Math.max(0, FREE_TIER_DAILY_LIMIT - next);
  } catch {
    return 0;
  }
}
__name(incrementRateLimit, "incrementRateLimit");
async function validateApiKey(env, key) {
  try {
    if (!key.startsWith("daee_sk_")) return false;
    return await env.API_KEYS.get(key) !== null;
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
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
}
__name(jsonResponse, "jsonResponse");
async function handleToolCall(id, params, env, request) {
  const toolName = params.name;
  const toolArgs = params.arguments || {};
  if (!toolName || !TOOLS.some((t) => t.name === toolName)) return { response: jsonRpcError(id, -32602, `Unknown tool: ${toolName}`), status: 400 };
  const authHeader = request.headers.get("Authorization") || "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
  let tier = "free";
  let callsRemaining = 0;
  if (apiKey && await validateApiKey(env, apiKey)) {
    tier = "paid";
    callsRemaining = -1;
  } else {
    const rc = await checkRateLimit(env, clientIp);
    if (!rc.allowed) return { response: jsonRpcError(id, 429, "Rate limit exceeded. Free tier: 5 calls/day.", { meta: buildMeta("free", 0) }), status: 429 };
    await new Promise((r) => setTimeout(r, FREE_TIER_DELAY_MS));
    callsRemaining = await incrementRateLimit(env, clientIp);
  }
  try {
    const { data, summary } = executeTool(toolName, toolArgs);
    return { response: jsonRpcSuccess(id, { content: [{ type: "text", text: JSON.stringify({ data, meta: buildMeta(tier, callsRemaining) }, null, 2) }], _meta: { summary } }), status: 200 };
  } catch (error) {
    return { response: jsonRpcError(id, -32603, error instanceof Error ? error.message : String(error), { meta: buildMeta(tier, callsRemaining) }), status: 500 };
  }
}
__name(handleToolCall, "handleToolCall");
var index_default = {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400" } });
      const path = new URL(request.url).pathname;
      if (request.method === "GET" && path === "/health") return jsonResponse({ status: "ok", service: SERVICE_NAME, version: SERVICE_VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      if (request.method === "GET" && path === "/.well-known/mcp.json") return jsonResponse({ name: SERVICE_NAME, version: SERVICE_VERSION, description: "MCP server for ASEAN trade rules \u2014 RCEP, CPTPP, AFTA FTA eligibility, rules of origin, tariff savings, and documentation requirements.", protocol: "mcp", protocol_version: "2024-11-05", endpoint: "/mcp", capabilities: { tools: TOOLS.map((t) => ({ name: t.name, description: t.description })) }, authentication: { type: "bearer" }, pricing: { free: "5 calls/day", starter: "$29/month", pro: "$99/month", enterprise: "$299/month" }, upgrade_url: UPGRADE_URL });
      if (request.method === "POST" && path === "/mcp") {
        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse(jsonRpcError(null, -32700, "Parse error"), 400);
        }
        if (body.jsonrpc !== "2.0") return jsonResponse(jsonRpcError(body.id ?? null, -32600, "jsonrpc must be '2.0'"), 400);
        const id = body.id ?? null;
        switch (body.method) {
          case "initialize":
            return jsonResponse(jsonRpcSuccess(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: SERVICE_NAME, version: SERVICE_VERSION } }));
          case "notifications/initialized":
            return jsonResponse(jsonRpcSuccess(id, {}));
          case "tools/list":
            return jsonResponse(jsonRpcSuccess(id, { tools: TOOLS }));
          case "tools/call": {
            const { response, status } = await handleToolCall(id, body.params || {}, env, request);
            return jsonResponse(response, status);
          }
          default:
            return jsonResponse(jsonRpcError(id, -32601, `Method not found: ${body.method}`), 400);
        }
      }
      if (request.method === "GET" && path === "/") return jsonResponse({ service: SERVICE_NAME, version: SERVICE_VERSION, description: "ASEAN Trade Rules MCP Server \u2014 FTA eligibility checks, rules of origin, tariff savings calculations, and documentation requirements for RCEP, CPTPP, AFTA and Singapore bilateral FTAs.", endpoints: { "GET /": "Info", "GET /health": "Health check", "GET /.well-known/mcp.json": "MCP discovery", "POST /mcp": "MCP JSON-RPC 2.0" }, tools: TOOLS.map((t) => t.name) });
      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      return jsonResponse({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }, 500);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
