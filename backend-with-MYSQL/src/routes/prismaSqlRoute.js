const express = require('express');
const prismaSqlController = require('../controllers/prismaSqlController');

const router = express.Router();

router.get('/orders', prismaSqlController.gettALlOrders);
router.get('/orders/:id', prismaSqlController.getSingleOrder);
router.post('/orders', prismaSqlController.addOrder);
router.put('/orders/:id', prismaSqlController.updateOrder);
router.delete('/orders/:id', prismaSqlController.deleteOrder);

// teacher create
router.get('/teachers', prismaSqlController.gettALlTeachers);
router.post('/teachers', prismaSqlController.addTeacher);
router.post('/blog', prismaSqlController.addBlog);

// =========== many to many    ================
router.get('/all-student/', prismaSqlController.getAllStudent);
router.get('/all-course/', prismaSqlController.getAllCourse);
router.post('/add-student', prismaSqlController.addStudent);
router.post('/add-course', prismaSqlController.addCourse);
router.post('/assign-course', prismaSqlController.assignCourseToStudent);
router.get('/all-assign-course/:id', prismaSqlController.getAllAssignCourse);


module.exports = router;
