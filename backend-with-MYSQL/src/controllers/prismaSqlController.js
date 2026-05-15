const prisma = require('../config/prisma');

const gettALlOrders = async (req, res) => {
  try {
    const { status, productId } = req.query;

    const whereClause = {};

    if (status) whereClause.status = status;
    if (productId) whereClause.productId = Number(productId);

    const orders = await prisma.orders.findMany({
      where: whereClause,
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingOrder = await prisma.orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = await prisma.orders.findUnique({
      where: {
        id,
      },
    });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addOrder = async (req, res) => {
  try {
    // const { userId, productId, quantity, totalPrice } = req.body;
    const order = await prisma.orders.create({
      data: { ...req.body },
    });
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingOrder = await prisma.orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: req.body,
    });
    res
      .status(200)
      .json({ success: true, message: 'Order updated successfully', data: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existingOrder = await prisma.orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const order = await prisma.orders.delete({
      where: {
        id,
      },
    });
    res.status(200).json({ success: true, message: 'Order deleted successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// teacher routes =============
const gettALlTeachers = async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        blog: true,
      },
    });

    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addTeacher = async (req, res) => {
  try {
    const teacher = await prisma.teacher.create({
      data: { ...req.body },
    });
    res.status(201).json({ success: true, message: 'Teacher created successfully', data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const addBlog = async (req, res) => {
  try {
    const blog = await prisma.blog.create({
      data: { ...req.body },
    });

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getAllStudent = async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getAllCourse = async (req, res) => {
  try {
    const courses = await prisma.course.findMany();
    res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const addStudent = async (req, res) => {
  try {
    const student = await prisma.student.create({
      data: { ...req.body },
    });
    res.status(201).json({ success: true, message: 'Student created successfully', data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const addCourse = async (req, res) => {
  try {
    const course = await prisma.course.create({
      data: { ...req.body },
    });
    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const assignCourseToStudent = async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const relation = await prisma.studentcourse.create({
      data: {
        studentId: Number(studentId),
        courseId: Number(courseId),
      },
    });

    res.json({
      success: true,
      relation,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllAssignCourse = async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        studentcourse: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  gettALlOrders,
  getSingleOrder,
  addOrder,
  updateOrder,
  deleteOrder,
  addTeacher,
  gettALlTeachers,
  addBlog,
  assignCourseToStudent,
  addStudent,
  addCourse,
  getAllStudent,
  getAllCourse,
  getAllAssignCourse,
};
