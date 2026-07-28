const multer     = require('multer');
const SoilReport = require('../models/SoilReport');
const { analyseImageWithVision } = require('../utils/visionAgent');
const { runSoilAnalysis }        = require('../utils/soilEngine');
const { getGroqAnalysis }        = require('../utils/groqAgent');

// ── Multer ────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype))
      cb(null, true);
    else
      cb(new Error('Only JPG, PNG, WEBP images are supported'));
  },
}).single('image');

// ── STEP 1: Upload image → visual analysis only ───────────────────────────────
// POST /api/reports/upload-image
// Returns: detected visual properties (colour, texture, moisture, organicMatter, soilType)
// Does NOT run rule engine or save to DB
exports.uploadImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err)       return res.status(400).json({ success: false, detail: err.message });
    if (!req.file) return res.status(400).json({ success: false, detail: 'No image uploaded' });

    try {
      const vision = await analyseImageWithVision(req.file.buffer);

      if (!vision.available) {
        return res.status(500).json({
          success: false,
          detail:  vision.reason || 'Image analysis failed. Please try a clearer soil photo.',
        });
      }

      res.json({
        success:         true,
        visionAvailable: true,
        imageData:       req.file.buffer.toString('base64'),
        mimeType:        req.file.mimetype,
        imageAnalysis: {
          available:          true,
          soilColour:         vision.soilColour,
          colourHex:          vision.colourHex,
          colourConfidence:   vision.colourConfidence,
          texture:            vision.texture,
          textureConfidence:  vision.textureConfidence,
          moisture:           vision.moisture,
          moistureConfidence: vision.moistureConfidence,
          organicMatter:      vision.organicMatter,
          organicConfidence:  vision.organicConfidence,
          estimatedSoilType:  vision.estimatedSoilType,
          soilTypeConfidence: vision.soilTypeConfidence,
          surfaceCondition:   vision.surfaceCondition,
          brightnessLevel:    vision.brightnessLevel,
          visualObservations: vision.visualObservations,
          confidence:         vision.confidence,
        },
      });

    } catch (e) {
      console.error('[uploadImage] error:', e.message);
      res.status(500).json({ success: false, detail: e.message });
    }
  });
};

// ── STEP 2: Combine vision data + manual lab values → full analysis + save ────
// POST /api/reports/analyse-with-image
// Body (JSON): { imageData, mimeType, imageAnalysis, farmerName, ..., soilPH, nitrogen, ... }
exports.analyseWithImage = async (req, res) => {
  try {
    const {
      imageData, mimeType,
      imageAnalysis,
      // Farmer / farm context
      farmerName, mobileNumber, state, district, village,
      farmSize, crop, previousCrop, irrigationType, season, notes,
      // Manual lab values
      soilPH, electricalConductivity, organicCarbon, nitrogen, phosphorus, potassium,
      // Weather (optional — use defaults if not provided)
      temperature, humidity, rainfall,
    } = req.body;

    // Build soil data for rule engine — use detected soil type from vision
    const soilData = {
      farmerName:             farmerName             || 'Farmer',
      mobileNumber:           mobileNumber           || '0000000000',
      state:                  state                  || 'Unknown',
      district:               district               || 'Unknown',
      village:                village                || 'Unknown',
      farmSize:               parseFloat(farmSize)   || 1,
      crop:                   crop                   || 'Rice',
      previousCrop:           previousCrop           || 'Wheat',
      soilType:               imageAnalysis?.estimatedSoilType || 'Loamy',
      soilColour:             imageAnalysis?.soilColour        || 'Brown',
      irrigationType:         irrigationType         || 'Drip',
      season:                 season                 || 'Kharif',
      soilPH:                 parseFloat(soilPH),
      electricalConductivity: parseFloat(electricalConductivity),
      organicCarbon:          parseFloat(organicCarbon),
      nitrogen:               parseFloat(nitrogen),
      phosphorus:             parseFloat(phosphorus),
      potassium:              parseFloat(potassium),
      temperature:            parseFloat(temperature) || 28,
      humidity:               parseFloat(humidity)    || 65,
      rainfall:               parseFloat(rainfall)    || 800,
      notes:                  notes || '',
      // Visual fields from image analysis — used in health score bonus
      moisture:               imageAnalysis?.moisture      || '',
      organicMatter:          imageAnalysis?.organicMatter || '',
      texture:                imageAnalysis?.texture       || '',
    };

    // Rule engine
    const engineResult = runSoilAnalysis(soilData);

    // Groq AI narrative — pass image analysis context too
    const aiNarrative = await getGroqAnalysis(soilData, engineResult, imageAnalysis);

    // Build soilImageUrl from base64
    const soilImageUrl = imageData && mimeType
      ? `data:${mimeType};base64,${imageData}`
      : '';

    const analysis = { ...engineResult, aiNarrative, imageAnalysis };

    const report = await SoilReport.create({
      ...soilData,
      soilImageUrl,
      imageAnalysis: imageAnalysis || {},
      analysis,
      healthScore:  engineResult.healthScore.overall,
      healthGrade:  engineResult.healthScore.grade,
      userId: req.user?._id || null,
    });

    res.status(201).json({ success: true, data: report });

  } catch (e) {
    console.error('[analyseWithImage] error:', e.message);
    res.status(400).json({ success: false, detail: e.message });
  }
};
