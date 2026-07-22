const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

// All routes here will be protected by requireAuth middleware in app.js
router.get('/', budgetController.getBudgets);
router.post('/', budgetController.saveBudget);
router.post('/:id/delete', budgetController.deleteBudget);

module.exports = router;
