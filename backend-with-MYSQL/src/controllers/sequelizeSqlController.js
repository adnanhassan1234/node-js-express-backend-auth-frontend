const { userSchema } = require('../middleware/userValidate');
const AdminUser = require('../models/sequelizeSqlModel');
const studentSequelizeSqlModel = require('../models/studentSDequelizeSqlModel');

const gettALlAminUser = async (req, res) => {
  try {
    let { page, limit, sortField, order } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;

    const offset = (page - 1) * limit;

    const allowedSortFields = ['name', 'gender', 'age', 'email', 'created_at'];
    sortField = allowedSortFields.includes(sortField) ? sortField : 'id';

    order = order === 'asc' ? 'ASC' : 'DESC';

    const { count, rows } = await AdminUser.findAndCountAll({
      limit,
      offset,
      order: [[sortField, order]],
    });

    //   const { count, rows } = await AdminUser.findAndCountAll({
    //   where: {
    //    age:{
    //     [Op.in]: [25, 30, 35],
    //    },
    //   },
    // });

    res.status(200).json({
      success: true,
      totalRecords: count,
      perPage: limit,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      sort: {
        field: sortField,
        order: order.toLowerCase(),
      },
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getSingleAminUser = async (req, res) => {
  try {
    const adminUser = await AdminUser.findByPk(req.params.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    res.status(200).json(adminUser);
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addAminUser = async (req, res) => {
  // const { email } = req.body;
  try {
    // const existingUser = await AdminUser.findOne({ where: { email } });

    // if (existingUser) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Email already exists',
    //   });
    // }

    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const adminUser = await AdminUser.create(req.body);

    res.status(201).json({ data: adminUser, message: 'Admin user added successfully' });
  } catch (error) {
    // if (error.name === 'SequelizeUniqueConstraintError') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Email already exists',
    //   });
    // }
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;

      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    console.error('Error adding admin user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAminUser = async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const adminUser = await AdminUser.findByPk(req.params.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    await adminUser.update(req.body);
    res.status(200).json({ data: adminUser, message: 'Admin user updated successfully' });
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAminUser = async (req, res) => {
  try {
    const adminUser = await AdminUser.findByPk(req.params.id);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }
    await adminUser.destroy();
    res.status(200).json({ message: 'Admin user deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//  ============  student studentSequelizeSqlModel ==============

const gettALlAminStudent = async (req, res) => {
  try {
    const adminStudents = await studentSequelizeSqlModel.findAll();
    res.status(200).json(adminStudents);
  } catch (error) {
    console.error('Error fetching admin students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addAminStudent = async (req, res) => {
  try {
    const adminStudent = await studentSequelizeSqlModel.create(req.body);

    res.status(201).json({ data: adminStudent, message: 'Admin student added successfully' });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path;

      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }
    console.error('Error adding admin student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  gettALlAminUser,
  getSingleAminUser,
  addAminUser,
  updateAminUser,
  deleteAminUser,
  gettALlAminStudent,
  addAminStudent,
};
