const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// All routes here will be protected by requireAuth middleware in app.js
router.get('/', dashboardController.getIndex);

module.exports = router;
