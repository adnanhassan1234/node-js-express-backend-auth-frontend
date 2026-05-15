const express = require('express');
const sequelizeSqlController = require('../controllers/sequelizeSqlController');

const router = express.Router();

router.get('/admin_user', sequelizeSqlController.gettALlAminUser);
router.get('/admin_user/:id', sequelizeSqlController.getSingleAminUser);
router.post('/admin_user', sequelizeSqlController.addAminUser);
router.put('/admin_user/:id', sequelizeSqlController.updateAminUser);
router.delete('/admin_user/:id', sequelizeSqlController.deleteAminUser);

// for student ==============
router.get('/admin_student', sequelizeSqlController.gettALlAminStudent);
// router.get('/admin_student/:id', sequelizeSqlController.getSingleAminStudent);
router.post('/admin_student', sequelizeSqlController.addAminStudent);
// router.put('/admin_student/:id', sequelizeSqlController.updateAminStudent);
// router.delete('/admin_student/:id', sequelizeSqlController.deleteAminStudent);

module.exports = router;
