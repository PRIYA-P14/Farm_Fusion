const GovReport = require('../models/GovReport');
const { runGovAnalysis } = require('../utils/govEngine');

const toClient = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  obj.id = obj._id;
  return obj;
};

// POST /api/government/analyse
exports.analyse = async (req, res) => {
  try {
    const farmer = req.body;
    const analysis = runGovAnalysis(farmer);
    const report = await GovReport.create({ ...farmer, ...analysis });
    res.status(201).json({ success: true, data: toClient(report) });
  } catch (err) {
    res.status(400).json({ success: false, detail: err.message });
  }
};

// GET /api/government/reports
exports.getReports = async (req, res) => {
  try {
    const { q, search, state, farmer_type, page = 1, limit = 10 } = req.query;
    const term = q || search || '';
    const query = {};
    if (term) query.$or = [
      { farmer_name: { $regex: term, $options: 'i' } },
      { district:    { $regex: term, $options: 'i' } },
      { crop:        { $regex: term, $options: 'i' } },
    ];
    if (state && state !== 'All')        query.state       = { $regex: state, $options: 'i' };
    if (farmer_type && farmer_type !== 'All') query.farmer_type = farmer_type;

    const total = await GovReport.countDocuments(query);
    const reports = await GovReport.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-ineligible_schemes -ai_details');

    res.json({ success: true, data: reports.map(toClient), total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, detail: err.message });
  }
};

// GET /api/government/reports/:id
exports.getReport = async (req, res) => {
  try {
    const report = await GovReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, detail: 'Report not found' });
    res.json({ success: true, data: toClient(report) });
  } catch (err) {
    res.status(500).json({ success: false, detail: err.message });
  }
};

// DELETE /api/government/reports/:id
exports.deleteReport = async (req, res) => {
  try {
    const report = await GovReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ success: false, detail: 'Report not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, detail: err.message });
  }
};

// GET /api/government/stats
exports.getStats = async (req, res) => {
  try {
    const [agg] = await GovReport.aggregate([{
      $group: {
        _id: null,
        total_reports: { $sum: 1 },
        total_subsidy: { $sum: '$total_subsidy' },
        avg_subsidy:   { $avg: '$total_subsidy' },
      }
    }]);
    res.json({ success: true, data: agg || { total_reports: 0, total_subsidy: 0, avg_subsidy: 0 } });
  } catch (err) {
    res.status(500).json({ success: false, detail: err.message });
  }
};

// GET /api/government/reports/export/csv
exports.exportCSV = async (req, res) => {
  try {
    const reports = await GovReport.find().sort({ created_at: -1 })
      .select('-eligible_schemes -ineligible_schemes -ai_details -__v');
    const fields = ['farmer_name', 'age', 'state', 'district', 'crop', 'farmer_type', 'annual_income', 'farm_size', 'total_subsidy', 'total_loan', 'has_insurance', 'eligibility_score', 'created_at'];
    const csv = [
      fields.join(','),
      ...reports.map(r => fields.map(f => `"${r[f] ?? ''}"`).join(',')),
    ].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=government_reports.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, detail: err.message });
  }
};

// GET /api/government/health
exports.health = (req, res) => res.json({ status: 'ok', agent: 'Government Scheme Agent', schemes_loaded: 12 });
