const studentModel = require('../model/studentModel');
const bookingModel = require('../model/bookingModel');
const nodemailer = require('nodemailer');

const getAllStudent = async (req, res) => {
  try {
    let { page, limit, sortField, order, name } = req.query;
    page = page || 1;
    limit = limit || 10;
    const skip = (page - 1) * limit;
    const totalRecords = await studentModel.countDocuments();

    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    const query = name ? { name: { $regex: name, $options: 'i' } } : {};

    const studentMoelData = await studentModel.find(query).limit(limit).skip(skip).sort(sort);
    return res.status(200).send({
      success: true,
      totalRecords,
      perPage: limit,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page,
      sort: {
        field: sortField,
        order: sortOrder === 1 ? 'asc' : 'desc',
      },
      data: studentMoelData,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const id = req.params.id;
    const student = await studentModel.findById(id);
    if (!student) {
      return res.status(404).send({
        success: false,
        message: 'Student not found',
      });
    }
    res.status(200).send(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const searchStudent = async (req, res) => {
  try {
    const { name, age } = req.query;

    if (!name && !age) {
      return res.status(400).json({
        success: false,
        message: 'Name or age query is required',
      });
    }

    let query = {};

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (age) {
      query.age = Number(age);
    }

    const students = await studentModel.find(query);

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const searchStudentByName = async (req, res) => {
  try {
    const name = req.query.name;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name query is required',
      });
    }
    const students = await studentModel.find({ name: { $regex: name, $options: 'i' } });
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }
    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const addStudent = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.name || !payload.age || !payload.email) {
      return res.status(400).json({
        message: 'Name, age, and email are required',
        success: false,
      });
    }

    const result = await studentModel.create(payload);
    res.status(201).send({ message: 'Student added successfully', success: true, id: result._id });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).send('Internal server error');
  }
};
const getStudentUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body;
    const result = await studentModel.updateOne({ _id: id }, { $set: payload });
    if (result.matchedCount === 0) {
      return res.status(404).send('Student not found');
    }
    res.status(200).send({ message: 'Student updated successfully', success: true });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).send('Internal server error');
  }
};
const deleteStudent = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await studentModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).send('Student not found');
    }
    res.status(200).send({ message: 'Student deleted successfully', success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).send('Internal server error');
  }
};

// const studentUploadFile = (req, res, next) => {
//   const file = req.file;

//   if (!file) {
//     const error = new Error('Please upload a file');
//     error.status = 400;
//     res.status(400).json({
//       message: 'Please upload a file',
//       success: false,
//     });
//     return next(error);
//   }

//   res.status(200).json({
//     message: 'File uploaded successfully',
//     fileName: file.originalname,
//   });
// };
const studentUploadFile = (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({
      message: 'Please upload at least one file',
      success: false,
    });
  }

  if (files.length > 3) {
    return res.status(400).json({
      message: 'Maximum 3 files are allowed',
      success: false,
    });
  }

  const uploadedFiles = files.map((file) => ({
    originalName: file.originalname,
    fileName: file.filename,
    size: file.size,
  }));

  res.status(200).json({
    message: 'Files uploaded successfully',
    success: true,
    files: uploadedFiles,
  });
};

const sendEmail = async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email sending failed',
      error: error.message,
    });
  }
};

const allBooking = async (req, res) => {
  try {
    const studentMoelData = await studentModel.aggregate([
      // {
      //   $group: {
      //     _id: '$name',
      //     email: { $first: "$email" },
      //     totalAmount: { $sum: '$totalAmount' },
      //     totalAvg: { $avg: '$totalAmount' },
      //     totalPaid: { $sum: { $cond: [{ $eq: ['$paid', true] }, 1, 0] } },
      //     totalUnpaid: { $sum: { $cond: [{ $eq: ['$paid', false] }, 1, 0] } },

      //   },
      // },
      {
        $lookup: {
          from: 'bookings',
          localField: 'student_id',
          foreignField: 'booking_id',
          as: 'booking_details',
        },
      },

      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ['$$ROOT', { $arrayElemAt: ['$booking_details', 0] }],
          },
        },
      },

      {
        $addFields: {
          tottalQuantity: { $sum: '$items.quantity' },
          totalNitAmount: { $sum: '$items.unit_amount' },
        },
      },
      {
        $project: {
          items: 0,
          '__v': 0,
          // 'booking_details.name': 0,
          // 'booking_details.email': 0,
          // 'booking_details.items': 0,
          booking_details: 0,
        },
      },
      // {
      //   $unwind: '$booking_details',
      // }
      // {
      //   $project: {
      //     email: 1,
      //     name: 1,
      //     items: 1,
      //   },
      // },
      // { $limit: 2 }
      // { $match: { name: 'Adnan Hassan' } },
      // {
      //   $addFields: {
      //     avgGrade: { $avg: '$totalAmount' },
      //     tottalQuantity: { $sum: '$items.quantity' },
      //   },
      // },
      // {
      //   $count: 'totalBooking',
      // },
      // {
      //   $lookup: {
      //     from: 'users',
      //     localField: '_id',
      //     foreignField: 'name',
      //     as: 'user_details',
      //   },
      // },
      // {
      //   $match: { name: 'Adnan Hassan' },
      // },
    ]);
    return res.status(200).send({
      success: true,
      data: studentMoelData,
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllStudent,
  getStudentById,
  addStudent,
  getStudentUpdate,
  deleteStudent,
  studentUploadFile,
  sendEmail,
  searchStudent,
  searchStudentByName,
  allBooking,
};
