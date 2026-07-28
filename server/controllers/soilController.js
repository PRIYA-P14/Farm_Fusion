const SoilReport = require('../models/SoilReport');
const { runSoilAnalysis } = require('../utils/soilEngine');
const { getGroqAnalysis } = require('../utils/groqAgent');

// POST /api/reports — Create & analyse (with Gemini AI)
exports.createReport = async (req, res) => {
  try {
    const data = req.body;

    // Step 1: Rule-based structured analysis
    const engineResult = runSoilAnalysis(data);

    // Step 2: Groq AI narrative (Llama 3.3 70B)
    const aiNarrative = await getGroqAnalysis(data, engineResult);

    const analysis = { ...engineResult, aiNarrative };
    const report = await SoilReport.create({
      ...data,
      analysis,
      healthScore:  engineResult.healthScore.overall,
      healthGrade:  engineResult.healthScore.grade,
    });

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/reports — List all (with search & filter)
exports.getReports = async (req, res) => {
  try {
    const { search, state, season, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) query.$or = [
      { farmerName: { $regex: search, $options: 'i' } },
      { village: { $regex: search, $options: 'i' } },
      { crop: { $regex: search, $options: 'i' } },
    ];
    if (state)  query.state  = { $regex: state, $options: 'i' };
    if (season) query.season = season;

    const total = await SoilReport.countDocuments(query);
    const reports = await SoilReport.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('farmerName soilType soilColour crop season soilImageUrl createdAt healthScore healthGrade analysis.healthScore');

    res.json({ success: true, data: reports, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/:id — Single report
exports.getReport = async (req, res) => {
  try {
    const report = await SoilReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/reports/:id
exports.deleteReport = async (req, res) => {
  try {
    const report = await SoilReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reports/analyse — Analyse without saving (preview)
exports.analyseOnly = async (req, res) => {
  try {
    const engineResult = runSoilAnalysis(req.body);
    const aiNarrative = await getGroqAnalysis(req.body, engineResult);
    res.json({ success: true, data: { ...engineResult, aiNarrative } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/reports/export/csv — Export all as CSV
exports.exportCSV = async (req, res) => {
  try {
    const reports = await SoilReport.find().sort({ createdAt: -1 }).select('-analysis -__v');
    const fields = Object.keys(reports[0]?.toObject() || {});
    const csv = [
      fields.join(','),
      ...reports.map(r => fields.map(f => `"${r[f] ?? ''}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=soil_reports.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/agent/soil-context/:id — Multi-agent JSON context
exports.getAgentContext = async (req, res) => {
  try {
    const report = await SoilReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    res.json({
      success: true,
      agentContext: {
        reportId: report._id,
        farmer: { name: report.farmerName, location: `${report.village}, ${report.district}, ${report.state}` },
        soil: { ph: report.soilPH, ec: report.electricalConductivity, oc: report.organicCarbon, n: report.nitrogen, p: report.phosphorus, k: report.potassium },
        crop: report.crop,
        season: report.season,
        healthScore: report.analysis?.healthScore,
        suitableCrops: report.analysis?.cropSuitability?.suitable?.map(c => c.crop),
        risks: report.analysis?.risks,
        aiSummary: report.analysis?.aiNarrative?.soilStory || null,
        readyForAgents: ['weather-agent', 'market-agent', 'scheme-agent', 'disease-agent'],
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
