const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { redirectIfAuth } = require('../middlewares/authMiddleware');

// Guest routes (redirected if already logged in)
router.get('/register', redirectIfAuth, authController.showRegister);
router.post('/register', redirectIfAuth, authController.register);
router.get('/login', redirectIfAuth, authController.showLogin);
router.post('/login', redirectIfAuth, authController.login);

// Logout route
router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
