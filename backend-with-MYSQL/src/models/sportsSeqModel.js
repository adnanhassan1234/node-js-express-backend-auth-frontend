const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const sportsSeqModel = sequelize.define(
  'sports',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    player_name: {
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
    number: {
      type: DataTypes.STRING(100),
    },
    country: {
      type: DataTypes.STRING(100),
    },
  },
  {
    tableName: 'sports',
    timestamps: false,
  }
);

module.exports = sportsSeqModel;
