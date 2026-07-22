const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// All routes here will be protected by requireAuth middleware in app.js
router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.post('/:id/edit', transactionController.updateTransaction);
router.post('/:id/delete', transactionController.deleteTransaction);

module.exports = router;
