const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const studentSequelizeSqlModel = sequelize.define(
  'admin_student',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name cannot be empty',
        },
      },
    },
    age: {
      type: DataTypes.INTEGER,
      unique: true,
    },

    city: {
      type: DataTypes.STRING(100),
    },
  },
  {
    tableName: 'admin_student',
    timestamps: false,
  }
);

module.exports = studentSequelizeSqlModel;
