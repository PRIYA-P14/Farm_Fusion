const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/soilController');
const { uploadImage, analyseWithImage } = require('../controllers/imageController');

router.post('/upload-image', uploadImage);
router.post('/analyse-with-image', analyseWithImage);
router.post('/analyse', ctrl.analyseOnly);
router.post('/', ctrl.createReport);
router.get('/export/csv', ctrl.exportCSV);
router.get('/', ctrl.getReports);
router.get('/:id', ctrl.getReport);
router.delete('/:id', ctrl.deleteReport);

module.exports = router;
