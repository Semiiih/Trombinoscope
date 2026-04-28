const express = require('express');
const router = express.Router();
const trombiController = require('../controllers/trombiController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, trombiController.generate);

module.exports = router;
