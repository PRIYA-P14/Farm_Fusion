// Returns true if farmer provided a CIBIL score AND it is below the minimum
function cibilFails(f, min) {
  return f.cibil_score > 0 && f.cibil_score < min;
}

const SCHEMES = [
  {
    id: 'pm_kisan',
    name: 'PM-KISAN',
    fullName: 'Pradhan Mantri Kisan Samman Nidhi',
    type: 'Central', category: 'Income Support',
    description: 'Direct income support of ₹6,000 per year to all landholding farmer families.',
    benefits: '₹6,000/year in 3 instalments of ₹2,000 directly to bank account via DBT.',
    subsidy_amount: 6000, loan_amount: 0, insurance: false, priority: 1,
    income_limit: 200000, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Bank Passbook', 'Land Records (Patta/Chitta)', 'Mobile Number'],
    application_process: 'Register at pmkisan.gov.in or visit nearest CSC centre with documents.',
    official_website: 'https://pmkisan.gov.in',
    check: (f) => {
      if (f.pm_kisan_registered)       return { eligible: false, reason: 'Already registered in PM-KISAN' };
      if (!f.aadhaar_available)         return { eligible: false, reason: 'Aadhaar card required' };
      if (!f.bank_account_available)    return { eligible: false, reason: 'Bank account required' };
      if (f.land_ownership !== 'Owned') return { eligible: false, reason: 'Land must be owned (not leased)' };
      if (f.annual_income > 200000)     return { eligible: false, reason: `Income ₹${(f.annual_income/1000).toFixed(0)}K exceeds ₹2L limit for PM-KISAN` };
      return { eligible: true, reason: `Income ₹${(f.annual_income/1000).toFixed(0)}K is within ₹2L limit — eligible for PM-KISAN` };
    },
  },
  {
    id: 'pmfby',
    name: 'PMFBY',
    fullName: 'Pradhan Mantri Fasal Bima Yojana',
    type: 'Central', category: 'Crop Insurance',
    description: 'Comprehensive crop insurance scheme for crop loss due to natural calamities, pests, and diseases.',
    benefits: 'Crop insurance with premium as low as 1.5% for Rabi, 2% for Kharif, 5% for commercial crops.',
    subsidy_amount: 5000, loan_amount: 0, insurance: true, priority: 1,
    income_limit: 0, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Bank Account', 'Land Records', 'Sowing Certificate'],
    application_process: 'Apply at nearest bank branch or online at pmfby.gov.in before the cut-off date.',
    official_website: 'https://pmfby.gov.in',
    check: (f) => {
      if (!f.aadhaar_available)      return { eligible: false, reason: 'Aadhaar required' };
      if (!f.bank_account_available) return { eligible: false, reason: 'Bank account required' };
      return { eligible: true, reason: 'All farmers with notified crops are eligible for PMFBY' };
    },
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card',
    fullName: 'Kisan Credit Card Scheme',
    type: 'Central', category: 'Agriculture Loan',
    description: 'Affordable credit for crop cultivation, post-harvest expenses, and allied activities.',
    benefits: 'Short-term credit up to ₹3 lakh at 4% interest rate (with 2% interest subvention).',
    subsidy_amount: 0, loan_amount: 300000, insurance: false, priority: 1,
    income_limit: 0, cibil_required: 650,
    required_documents: ['Aadhaar Card', 'PAN Card', 'Land Records', 'Passport Photo', 'Bank Account'],
    application_process: 'Apply at any nationalised bank, cooperative bank, or RRB with land documents.',
    official_website: 'https://www.nabard.org/content1.aspx?id=572',
    check: (f) => {
      if (!f.aadhaar_available)      return { eligible: false, reason: 'Aadhaar required' };
      if (!f.bank_account_available) return { eligible: false, reason: 'Bank account required' };
      if (f.age < 18 || f.age > 75)  return { eligible: false, reason: 'Age must be between 18–75 years' };
      if (cibilFails(f, 650))        return { eligible: false, reason: `CIBIL ${f.cibil_score} is below minimum 650 required for KCC — improve score by ${650 - f.cibil_score} points` };
      return { eligible: true, reason: `CIBIL ${f.cibil_score || 'not provided'} meets KCC requirement of 650+` };
    },
  },
  {
    id: 'mudra_kishore',
    name: 'MUDRA Kishore Loan',
    fullName: 'Pradhan Mantri MUDRA Yojana – Kishore',
    type: 'Central', category: 'Agriculture Loan',
    description: 'Collateral-free loans to small farmers and agri-entrepreneurs for farm equipment and agri-business.',
    benefits: 'Loan from ₹50,000 to ₹5 lakh at subsidised interest rates with no collateral required.',
    subsidy_amount: 0, loan_amount: 500000, insurance: false, priority: 2,
    income_limit: 500000, cibil_required: 600,
    required_documents: ['Aadhaar Card', 'PAN Card', 'Bank Account', 'Business/Farm Plan'],
    application_process: 'Apply at any bank, MFI, or NBFC. Also available at mudra.org.in.',
    official_website: 'https://www.mudra.org.in',
    check: (f) => {
      if (!f.bank_account_available) return { eligible: false, reason: 'Bank account required' };
      if (f.annual_income > 500000)  return { eligible: false, reason: `Income ₹${(f.annual_income/1000).toFixed(0)}K exceeds ₹5L limit for MUDRA Kishore` };
      if (cibilFails(f, 600))        return { eligible: false, reason: `CIBIL ${f.cibil_score} is below minimum 600 for MUDRA loan — improve score by ${600 - f.cibil_score} points` };
      return { eligible: true, reason: `Income ₹${(f.annual_income/1000).toFixed(0)}K and CIBIL ${f.cibil_score || 'not provided'} qualify for MUDRA Kishore` };
    },
  },
  {
    id: 'agri_infra_fund',
    name: 'Agriculture Infrastructure Fund',
    fullName: 'Agriculture Infrastructure Fund (AIF)',
    type: 'Central', category: 'Agriculture Loan',
    description: 'Medium to long-term debt financing for post-harvest management and community farming assets.',
    benefits: 'Loan up to ₹2 crore with 3% interest subvention and credit guarantee coverage.',
    subsidy_amount: 0, loan_amount: 2000000, insurance: false, priority: 3,
    income_limit: 0, cibil_required: 700,
    required_documents: ['Aadhaar Card', 'PAN Card', 'Land Records', 'Bank Account', 'Project Report'],
    application_process: 'Apply at agriinfra.dac.gov.in or visit nearest bank with project proposal.',
    official_website: 'https://agriinfra.dac.gov.in',
    check: (f) => {
      if (f.farm_size < 1)           return { eligible: false, reason: 'Minimum 1 acre farm required' };
      if (!f.bank_account_available) return { eligible: false, reason: 'Bank account required' };
      if (cibilFails(f, 700))        return { eligible: false, reason: `CIBIL ${f.cibil_score} is below minimum 700 for AIF loan — improve score by ${700 - f.cibil_score} points` };
      return { eligible: true, reason: `CIBIL ${f.cibil_score || 'not provided'} meets AIF requirement of 700+` };
    },
  },
  {
    id: 'nabard_rig',
    name: 'NABARD Rural Infrastructure',
    fullName: 'NABARD Rural Infrastructure Development Fund',
    type: 'Central', category: 'Agriculture Loan',
    description: 'Long-term low-interest loans for rural infrastructure including irrigation, storage, and farm roads.',
    benefits: 'Loans at 5.5–6% interest for rural infrastructure projects. Repayment up to 7 years.',
    subsidy_amount: 0, loan_amount: 1000000, insurance: false, priority: 3,
    income_limit: 0, cibil_required: 720,
    required_documents: ['Aadhaar Card', 'PAN Card', 'Land Records', 'Bank Account', 'Project DPR'],
    application_process: 'Apply through State Government or directly at NABARD district office.',
    official_website: 'https://www.nabard.org',
    check: (f) => {
      if (f.farm_size < 2)           return { eligible: false, reason: 'Minimum 2 acres required for NABARD infrastructure loan' };
      if (!f.bank_account_available) return { eligible: false, reason: 'Bank account required' };
      if (cibilFails(f, 720))        return { eligible: false, reason: `CIBIL ${f.cibil_score} is below minimum 720 for NABARD loan — improve score by ${720 - f.cibil_score} points` };
      return { eligible: true, reason: `CIBIL ${f.cibil_score || 'not provided'} meets NABARD requirement of 720+` };
    },
  },
  {
    id: 'soil_health_card',
    name: 'Soil Health Card',
    fullName: 'Soil Health Card Scheme',
    type: 'Central', category: 'Soil & Fertilizer',
    description: 'Provides every farmer a Soil Health Card with crop-wise nutrient and fertilizer recommendations.',
    benefits: 'Free soil testing and personalised fertilizer recommendations to improve yield and reduce input costs.',
    subsidy_amount: 0, loan_amount: 0, insurance: false, priority: 2,
    income_limit: 0, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Land Details'],
    application_process: 'Visit nearest Krishi Vigyan Kendra or register at soilhealth.dac.gov.in.',
    official_website: 'https://soilhealth.dac.gov.in',
    check: () => ({ eligible: true, reason: 'Available to all farmers free of cost — no income or CIBIL requirement' }),
  },
  {
    id: 'pm_kusum',
    name: 'PM-KUSUM',
    fullName: 'Pradhan Mantri Kisan Urja Suraksha evam Utthan Mahabhiyan',
    type: 'Central', category: 'Solar & Energy',
    description: 'Provides solar pumps and grid-connected solar power plants to reduce dependence on diesel.',
    benefits: 'Up to 60% subsidy on solar pump installation. Farmers can also sell surplus power to grid.',
    subsidy_amount: 90000, loan_amount: 0, insurance: false, priority: 2,
    income_limit: 0, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Electricity Bill'],
    application_process: 'Apply at State Agriculture Department or register at pmkusum.mnre.gov.in.',
    official_website: 'https://pmkusum.mnre.gov.in',
    check: (f) => {
      if (f.irrigation_type === 'Rainfed') return { eligible: false, reason: 'Requires existing or planned irrigation setup' };
      if (f.farm_size < 0.5)               return { eligible: false, reason: 'Minimum 0.5 acres farm required' };
      return { eligible: true, reason: 'Eligible for solar pump subsidy under PM-KUSUM — no CIBIL requirement' };
    },
  },
  {
    id: 'drip_subsidy',
    name: 'Drip/Sprinkler Subsidy',
    fullName: 'Per Drop More Crop (PMKSY-PDMC)',
    type: 'Central', category: 'Irrigation',
    description: 'Promotes micro-irrigation to improve water use efficiency and increase crop productivity.',
    benefits: 'Up to 55% subsidy for small/marginal farmers and 45% for other farmers on drip/sprinkler systems.',
    subsidy_amount: 27500, loan_amount: 0, insurance: false, priority: 2,
    income_limit: 0, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Quotation from approved supplier'],
    application_process: 'Apply at State Horticulture Department or visit pmksy.gov.in for online registration.',
    official_website: 'https://pmksy.gov.in',
    check: (f) => {
      if (!['Drip', 'Sprinkler'].includes(f.irrigation_type))
        return { eligible: false, reason: 'Must use or plan drip/sprinkler irrigation' };
      return { eligible: true, reason: 'Eligible for micro-irrigation subsidy — no CIBIL requirement' };
    },
  },
  {
    id: 'nfsm',
    name: 'NFSM',
    fullName: 'National Food Security Mission',
    type: 'Central', category: 'Seed & Input Subsidy',
    description: 'Increases production of rice, wheat, pulses, and coarse cereals through productivity enhancement.',
    benefits: 'Subsidised certified seeds, fertilizers, farm equipment, and training for food crop farmers.',
    subsidy_amount: 15000, loan_amount: 0, insurance: false, priority: 2,
    income_limit: 0, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Land Records', 'Bank Account'],
    application_process: 'Contact District Agriculture Officer or Block Agriculture Office for registration.',
    official_website: 'https://nfsm.gov.in',
    check: (f) => {
      const foodCrops = ['Rice', 'Wheat', 'Maize', 'Pulses', 'Jowar', 'Bajra', 'Ragi'];
      if (!foodCrops.includes(f.crop))
        return { eligible: false, reason: 'NFSM covers food crops only (Rice, Wheat, Maize, Pulses, Millets)' };
      return { eligible: true, reason: `${f.crop} is a covered NFSM food crop — no CIBIL requirement` };
    },
  },
  {
    id: 'pkvy',
    name: 'PKVY',
    fullName: 'Paramparagat Krishi Vikas Yojana',
    type: 'Central', category: 'Organic Farming',
    description: 'Promotes organic farming through cluster approach with financial assistance for organic inputs.',
    benefits: '₹50,000/hectare over 3 years for organic farming transition, certification, and marketing support.',
    subsidy_amount: 50000, loan_amount: 0, insurance: false, priority: 3,
    income_limit: 0, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Land Records', 'Bank Account', 'Farmer Group Registration'],
    application_process: 'Form a cluster of 50 farmers and apply through District Agriculture Office.',
    official_website: 'https://pgsindia-ncof.gov.in',
    check: (f) => {
      if (f.farm_size < 0.5) return { eligible: false, reason: 'Minimum 0.5 acres required for organic farming scheme' };
      return { eligible: true, reason: 'Eligible for organic farming support under PKVY — no CIBIL requirement' };
    },
  },
  {
    id: 'pmkmy',
    name: 'PM Kisan Maandhan Yojana',
    fullName: 'Pradhan Mantri Kisan Maandhan Yojana',
    type: 'Central', category: 'Farmer Welfare',
    description: 'Voluntary pension scheme for small and marginal farmers to provide social security after age 60.',
    benefits: 'Minimum assured pension of ₹3,000/month after age 60. Government contributes equal amount.',
    subsidy_amount: 36000, loan_amount: 0, insurance: false, priority: 2,
    income_limit: 200000, cibil_required: 0,
    required_documents: ['Aadhaar Card', 'Bank Account', 'Land Records'],
    application_process: 'Enrol at nearest CSC centre or maandhan.in with Aadhaar and bank details.',
    official_website: 'https://maandhan.in',
    check: (f) => {
      if (f.age < 18 || f.age > 40)  return { eligible: false, reason: 'Age must be 18–40 years for enrolment' };
      if (!['Small', 'Marginal'].includes(f.farmer_type)) return { eligible: false, reason: 'Only Small and Marginal farmers eligible' };
      if (!f.bank_account_available) return { eligible: false, reason: 'Bank account required' };
      if (f.annual_income > 200000)  return { eligible: false, reason: `Income ₹${(f.annual_income/1000).toFixed(0)}K exceeds ₹2L limit for PM Kisan Maandhan` };
      return { eligible: true, reason: `Income ₹${(f.annual_income/1000).toFixed(0)}K within ₹2L limit — eligible for Maandhan pension` };
    },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function cibilBand(score) {
  if (!score || score === 0) return null;
  if (score >= 750) return { label: 'Excellent', color: 'green' };
  if (score >= 700) return { label: 'Good',      color: 'blue' };
  if (score >= 650) return { label: 'Fair',       color: 'yellow' };
  if (score >= 600) return { label: 'Poor',       color: 'orange' };
  return               { label: 'Very Poor',  color: 'red' };
}

function incomeBand(income) {
  if (income <= 100000) return 'Low Income (≤ ₹1L)';
  if (income <= 200000) return 'Lower Middle (₹1L–₹2L)';
  if (income <= 300000) return 'Middle Income (₹2L–₹3L)';
  if (income <= 600000) return 'Upper Middle (₹3L–₹6L)';
  return                       'High Income (> ₹6L)';
}

// What loan schemes are blocked purely by CIBIL
function getCibilBlockedLoans(farmer, ineligible) {
  return ineligible.filter(s =>
    s.cibil_required > 0 &&
    farmer.cibil_score > 0 &&
    farmer.cibil_score < s.cibil_required
  );
}

// What income-gated schemes are blocked purely by income
function getIncomeBlockedSchemes(farmer, ineligible) {
  return ineligible.filter(s =>
    s.income_limit > 0 &&
    farmer.annual_income > s.income_limit
  );
}

// ── AI Details ────────────────────────────────────────────────────────────────

function buildAiDetails(farmer, eligible, ineligible) {
  const topScheme      = eligible.find(s => s.priority === 1) || eligible[0];
  const cb             = cibilBand(farmer.cibil_score);
  const incomeDesc     = incomeBand(farmer.annual_income);
  const loanSchemes    = eligible.filter(s => s.loan_amount > 0);
  const maxLoan        = loanSchemes.reduce((m, s) => Math.max(m, s.loan_amount), 0);
  const cibilBlocked   = getCibilBlockedLoans(farmer, ineligible);
  const incomeBlocked  = getIncomeBlockedSchemes(farmer, ineligible);

  const summary = eligible.length > 0
    ? `Based on your profile (${incomeDesc}${cb ? `, CIBIL: ${farmer.cibil_score} — ${cb.label}` : ''}), you qualify for ${eligible.length} scheme${eligible.length > 1 ? 's' : ''} worth ₹${(eligible.reduce((s, e) => s + e.subsidy_amount, 0) / 1000).toFixed(0)}K in subsidies${maxLoan > 0 ? ` and ₹${(maxLoan / 100000).toFixed(1)}L in loans` : ''}.`
    : `No schemes matched your current profile. Improve your CIBIL score and documentation to unlock more benefits.`;

  const top_priority = topScheme
    ? `${topScheme.fullName} — ${topScheme.benefits} Apply at: ${topScheme.application_process}`
    : null;

  // Income insight — explain exactly what income opens/closes
  let income_insight;
  if (farmer.annual_income <= 100000) {
    income_insight = `Your income of ₹${(farmer.annual_income/1000).toFixed(0)}K (Low Income) qualifies you for all income-gated schemes including PM-KISAN (≤₹2L) and PM Kisan Maandhan (≤₹2L). You also qualify for MUDRA Kishore loan (≤₹5L).`;
  } else if (farmer.annual_income <= 200000) {
    income_insight = `Your income of ₹${(farmer.annual_income/1000).toFixed(0)}K qualifies you for PM-KISAN and PM Kisan Maandhan (both require ≤₹2L). You also qualify for MUDRA Kishore loan (≤₹5L).`;
  } else if (farmer.annual_income <= 500000) {
    income_insight = `Your income of ₹${(farmer.annual_income/1000).toFixed(0)}K exceeds the ₹2L limit — PM-KISAN and PM Kisan Maandhan are not available. However, you qualify for MUDRA Kishore loan (≤₹5L) and all other non-income-gated schemes.`;
  } else {
    income_insight = `Your income of ₹${(farmer.annual_income/1000).toFixed(0)}K exceeds ₹5L — PM-KISAN, PM Kisan Maandhan, and MUDRA Kishore are not available. You are eligible for AIF, NABARD, and infrastructure loans (subject to CIBIL score).`;
  }

  // CIBIL insight — explain exactly what score opens/closes
  let cibil_insight;
  if (!farmer.cibil_score || farmer.cibil_score === 0) {
    cibil_insight = `No CIBIL score provided. Loan schemes (KCC, MUDRA, AIF, NABARD) are shown as potentially eligible. Provide your score for accurate loan eligibility.`;
  } else if (farmer.cibil_score < 600) {
    cibil_insight = `CIBIL ${farmer.cibil_score} (Very Poor) — All loan schemes are blocked. Need 600+ for MUDRA, 650+ for KCC, 700+ for AIF, 720+ for NABARD. Focus on clearing existing debts to improve your score.`;
  } else if (farmer.cibil_score < 650) {
    cibil_insight = `CIBIL ${farmer.cibil_score} (Poor) — Only MUDRA Kishore loan (600+) is accessible. Need ${650 - farmer.cibil_score} more points for KCC, ${700 - farmer.cibil_score} for AIF, ${720 - farmer.cibil_score} for NABARD.`;
  } else if (farmer.cibil_score < 700) {
    cibil_insight = `CIBIL ${farmer.cibil_score} (Fair) — KCC and MUDRA loans are accessible. Need ${700 - farmer.cibil_score} more points for AIF (₹2Cr loan), ${720 - farmer.cibil_score} for NABARD (₹10L loan).`;
  } else if (farmer.cibil_score < 720) {
    cibil_insight = `CIBIL ${farmer.cibil_score} (Good) — KCC, MUDRA, and AIF loans are all accessible. Need ${720 - farmer.cibil_score} more points to unlock NABARD Rural Infrastructure loan (₹10L).`;
  } else {
    cibil_insight = `CIBIL ${farmer.cibil_score} (${cb.label}) — Excellent! All loan schemes are unlocked: KCC (₹3L), MUDRA (₹5L), AIF (₹2Cr), NABARD (₹10L). You have maximum loan access.`;
  }

  const warning = !farmer.aadhaar_available
    ? 'Aadhaar card is required for most schemes. Getting one will unlock significantly more benefits.'
    : !farmer.bank_account_available
    ? 'A bank account is required for direct benefit transfers. Open a Jan Dhan account at your nearest bank.'
    : cibilBlocked.length > 0
    ? `${cibilBlocked.length} loan scheme${cibilBlocked.length > 1 ? 's are' : ' is'} blocked by your CIBIL score: ${cibilBlocked.map(s => `${s.name} (needs ${s.cibil_required}+)`).join(', ')}.`
    : incomeBlocked.length > 0
    ? `${incomeBlocked.length} scheme${incomeBlocked.length > 1 ? 's are' : ' is'} blocked by income limit: ${incomeBlocked.map(s => s.name).join(', ')}.`
    : null;

  const scheme_tips = eligible.slice(0, 3).map(s => ({
    scheme: s.name,
    why_eligible: s.reason || s.fullName,
    key_benefit: s.benefits,
    first_step: s.application_process.slice(0, 80),
  }));

  const application_guidance =
    `Start with ${topScheme ? topScheme.name : 'the highest priority scheme'} as it provides immediate support. ` +
    `Gather your Aadhaar, land records, and bank passbook before visiting the application centre. ` +
    (farmer.cibil_score >= 650 ? `Your CIBIL score unlocks credit schemes — apply for KCC at your nearest bank. ` : '') +
    `Apply during the Kharif/Rabi season window for crop insurance schemes.`;

  const motivational_message = `You are taking the right step — knowing your entitlements is the first step to a better harvest season! 🌾`;

  return { summary, top_priority, warning, cibil_insight, income_insight, scheme_tips, application_guidance, motivational_message };
}

// ── Main Export ───────────────────────────────────────────────────────────────

function runGovAnalysis(farmer) {
  const eligible   = [];
  const ineligible = [];

  for (const scheme of SCHEMES) {
    const result = scheme.check(farmer);
    const { check, ...schemeData } = scheme;
    const entry = { ...schemeData, reason: result.reason };
    if (result.eligible) eligible.push(entry);
    else ineligible.push(entry);
  }

  const total_subsidy     = eligible.reduce((s, e) => s + e.subsidy_amount, 0);
  const total_loan        = eligible.reduce((s, e) => s + e.loan_amount, 0);
  const has_insurance     = eligible.some(e => e.insurance);
  const eligibility_score = Math.round((eligible.length / SCHEMES.length) * 100);
  const income_group      = incomeBand(farmer.annual_income);
  const cibil_band        = cibilBand(farmer.cibil_score);
  const ai_details        = buildAiDetails(farmer, eligible, ineligible);

  return { eligible_schemes: eligible, ineligible_schemes: ineligible, total_subsidy, total_loan, has_insurance, eligibility_score, income_group, cibil_band, ai_details };
}

module.exports = { runGovAnalysis };
