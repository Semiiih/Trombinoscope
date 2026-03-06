const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { validateClass, validateId } = require('../middlewares/validate');

router.get('/', classController.getAll);
router.get('/:id', validateId, classController.getOne);
router.post('/', validateClass, classController.create);
router.put('/:id', validateId, validateClass, classController.update);
router.delete('/:id', validateId, classController.remove);

module.exports = router;
