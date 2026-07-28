const express = require('express');
const router = express.Router();
const { register, login, profile, googleLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/profile', profile);

module.exports = router;
