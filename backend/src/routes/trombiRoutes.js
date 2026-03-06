const express = require('express');
const router = express.Router();
const trombiController = require('../controllers/trombiController');

router.get('/', trombiController.generate);

module.exports = router;
