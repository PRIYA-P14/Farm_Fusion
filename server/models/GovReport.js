const mongoose = require('mongoose');

const govReportSchema = new mongoose.Schema({
  // Farmer inputs
  farmer_name:            { type: String, required: true },
  age:                    { type: Number, required: true },
  gender:                 { type: String, default: 'Male' },
  mobile:                 { type: String, default: '' },
  state:                  { type: String, required: true },
  district:               { type: String, required: true },
  village:                { type: String, default: '' },
  category:               { type: String, default: 'General' },
  annual_income:          { type: Number, required: true },
  farm_size:              { type: Number, required: true },
  land_ownership:         { type: String, default: 'Owned' },
  crop:                   { type: String, default: 'Rice' },
  irrigation_type:        { type: String, default: 'Drip' },
  farmer_type:            { type: String, default: 'Small' },
  pm_kisan_registered:    { type: Boolean, default: false },
  aadhaar_available:      { type: Boolean, default: true },
  bank_account_available: { type: Boolean, default: true },
  cibil_score:            { type: Number, default: 0 },
  userId:                 { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Flat analysis fields (what the dashboard reads)
  eligible_schemes:  { type: mongoose.Schema.Types.Mixed, default: [] },
  ineligible_schemes:{ type: mongoose.Schema.Types.Mixed, default: [] },
  total_subsidy:     { type: Number, default: 0 },
  total_loan:        { type: Number, default: 0 },
  has_insurance:     { type: Boolean, default: false },
  eligibility_score: { type: Number, default: 0 },
  income_group:      { type: String, default: '' },
  ai_details:        { type: mongoose.Schema.Types.Mixed, default: null },

  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GovReport', govReportSchema);
