const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudent, validateId } = require('../middlewares/validate');
const { uploadPhoto, uploadCsv } = require('../middlewares/upload');

// Import CSV — must come before /:id routes
router.post('/import', uploadCsv, studentController.importCsv);

router.get('/', studentController.getAll);
router.get('/:id', validateId, studentController.getOne);
router.post('/', validateStudent, studentController.create);
router.put('/:id', validateId, validateStudent, studentController.update);
router.delete('/:id', validateId, studentController.remove);

// Photo upload
router.post('/:id/photo', validateId, uploadPhoto, studentController.uploadPhoto);

module.exports = router;
