const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { validateClass, validateId } = require('../middlewares/validate');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.get('/', authenticate, classController.getAll);
router.get('/:id', authenticate, validateId, classController.getOne);
router.post('/', authenticate, requireAdmin, validateClass, classController.create);
router.put('/:id', authenticate, requireAdmin, validateId, validateClass, classController.update);
router.delete('/:id', authenticate, requireAdmin, validateId, classController.remove);

module.exports = router;
