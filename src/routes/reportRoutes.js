const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// All routes here will be protected by requireAuth middleware in app.js
router.get('/', reportController.getReports);

module.exports = router;
