const express = require('express');
const router = express.Router();
const { analyse, getReports, getReport, deleteReport, getStats, exportCSV, health } = require('../controllers/govController');

router.get('/health',              health);
router.get('/stats',               getStats);
router.post('/analyse',            analyse);
router.get('/reports/export/csv',  exportCSV);   // must be before /reports/:id
router.get('/reports',             getReports);
router.get('/reports/:id',         getReport);
router.delete('/reports/:id',      deleteReport);

module.exports = router;
