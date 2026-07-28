const mongoose = require('mongoose');

const soilReportSchema = new mongoose.Schema({
  // Farmer Info
  farmerName: { type: String, required: true, trim: true },
  mobileNumber: { type: String, required: true, trim: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  village: { type: String, required: true },
  farmSize: { type: Number, required: true },
  crop: { type: String, required: true },
  previousCrop: { type: String, required: true },
  soilType: { type: String, required: true },
  soilColour: { type: String, required: true },
  irrigationType: { type: String, required: true },
  season: { type: String, required: true },

  // Soil Parameters
  soilPH: { type: Number, required: true },
  electricalConductivity: { type: Number, required: true },
  organicCarbon: { type: Number, required: true },
  nitrogen: { type: Number, required: true },
  phosphorus: { type: Number, required: true },
  potassium: { type: Number, required: true },

  // User ID (optional — set when auth middleware is present)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Weather
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  rainfall: { type: Number, required: true },

  // Image Analysis (from AI Vision)
  imageAnalysis: {
    soilColour:        { type: String, default: '' },
    colourHex:         { type: String, default: '' },
    texture:           { type: String, default: '' },
    moisture:          { type: String, default: '' },
    organicMatter:     { type: String, default: '' },
    estimatedSoilType: { type: String, default: '' },
    surfaceCondition:  { type: String, default: '' },
    visualObservations:{ type: String, default: '' },
    confidence:        { type: Number, default: 0 },
  },

  // Optional
  notes: { type: String, default: '' },
  soilImageUrl: { type: String, default: '' },

  // Top-level score fields (available in list queries without loading analysis)
  healthScore: { type: Number, default: 0 },
  healthGrade: { type: String, default: '' },

  // AI Analysis Result
  analysis: { type: mongoose.Schema.Types.Mixed, default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SoilReport', soilReportSchema);
