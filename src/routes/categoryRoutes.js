const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// All routes here will be protected by requireAuth middleware in app.js
router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.post('/:id/edit', categoryController.updateCategory);
router.post('/:id/delete', categoryController.deleteCategory);

module.exports = router;
