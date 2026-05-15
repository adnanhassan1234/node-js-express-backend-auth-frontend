const db = require('../config/db');

// GET ALL ADMIN USER
const gettALlAminUser = async (req, res) => {
  try {
    let { page, limit, sortField, order, name } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;
    const offset = (page - 1) * limit;

    const allowedSortFields = ['id', 'name', 'gender', 'age', 'email', 'created_at'];
    sortField = allowedSortFields.includes(sortField) ? sortField : 'id';

    order = order === 'asc' ? 'ASC' : 'DESC';

    const searchName = name ? `%${name}%` : '%';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM admin_user
      WHERE name LIKE ?
    `;

    const dataQuery = `
      SELECT * FROM admin_user
      WHERE name LIKE ?
      ORDER BY ${sortField} ${order}
      LIMIT ? OFFSET ?
    `;
   
    const [countResult] = await db.query(countQuery, [searchName]);
    const total = countResult[0].total;

    const [rows] = await db.query(dataQuery, [searchName, limit, offset]);

    res.status(200).json({
      message: 'Admin users fetched successfully',
      totalRecords: total,
      perPage: limit,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      sort: {
        field: sortField,
        order: order.toLowerCase(),
      },
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin user',
      error: error.message,
    });
  }
};

// GET SINGLE ADMIN USER
const getSingleAminUser = async (req, res) => {
  try {
    const id = req.params.id;

    const sql = `SELECT * FROM admin_user WHERE id = ?`;
    const [rows] = await db.query(sql, [id]);
    const len = rows.length;
    if (len === 0) return res.status(404).json({ error: 'Admin user not found' });

    res.json({ message: 'Single Admin user data fetched successfully', data: rows });
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin user',
      error: error.message,
    });
  }
};

//add admin_user
const addAminUser = async (req, res) => {
  try {
    const { name, email, gender, date_of_birth, salary, age, address, phone, city } = req.body;

    const sql = `
      INSERT INTO admin_user
      (name, email, gender, date_of_birth, salary, age, address, phone, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      name,
      email,
      gender,
      date_of_birth,
      salary,
      age,
      address,
      phone,
      city,
    ]);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      insertId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: err.message,
    });
  }
};

// update admin_user
const updateAminUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, gender, date_of_birth, salary, age, address, phone, city } = req.body;

    const sql = `
    UPDATE admin_user
    SET name = ?, email = ?, gender = ?, date_of_birth = ?, salary = ?, age = ?, address = ?, phone = ?, city = ?
    WHERE id = ?    
  `;

    const [result] = await db.query(sql, [
      name,
      email,
      gender,
      date_of_birth,
      salary,
      age,
      address,
      phone,
      city,
      id,
    ]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Admin user not found' });
    res.status(200).json({
      success: true,
      message: 'Admin user updated successfully',
      insertId: result.insertId,
      data: {
        name,
        email,
        gender,
        date_of_birth,
        salary,
        age,
        address,
        phone,
        city,
      },
    });
  } catch (err) {
    console.error('Error updating admin user:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin user',
      error: err.message,
    });
  }
};

// delete admin_user
const deleteAminUser = async (req, res) => {
  try {
    const id = req.params.id;

    const sql = `
    DELETE FROM admin_user
    WHERE id = ?
  `;

    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Admin user not found' });
    res.status(200).json({
      success: true,
      message: 'Admin user deleted successfully',
      insertId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin user',
      error: err.message,
    });
  }
};

module.exports = {
  gettALlAminUser,
  getSingleAminUser,
  addAminUser,
  updateAminUser,
  deleteAminUser,
};
