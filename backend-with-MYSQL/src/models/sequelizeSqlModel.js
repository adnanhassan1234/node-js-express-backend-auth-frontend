const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const AdminSuquelizeUser = sequelize.define(
  'admin_user',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
    },
    gender: {
      type: DataTypes.STRING(10),
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
    },
    salary: {
      type: DataTypes.STRING(20),
    },
    age: {
      type: DataTypes.INTEGER,
      validate: {
        customValidator(value) {
          if (value < 13) {
            throw new Error('Age must be at least 13');
          }
        }
      },
    },
    address: {
      type: DataTypes.STRING(255),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    city: {
      type: DataTypes.STRING(100),
    },
    name: {
      type: DataTypes.STRING,
      set(value) {
        this.setDataValue('name', value + ' ' + `Pakistan`);
      },
    },
    virtualContent: {
      type: DataTypes.VIRTUAL,
      get() {
        return `Name is : ${this.name}, Email is : ${this.email}, Gender is : ${this.gender}, Date of Birth is : ${this.date_of_birth}, Salary is : ${this.salary}`;
      },
    },
  },
  {
    tableName: 'admin_user',
    timestamps: false,
  }
);

module.exports = AdminSuquelizeUser;
