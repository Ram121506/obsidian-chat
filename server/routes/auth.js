const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', require('../controllers/googleController').googleLogin);
router.get('/users', authController.getUsers);

module.exports = router;
