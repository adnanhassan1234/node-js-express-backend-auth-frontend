const mongoose = require('mongoose');
const {
  linkedinBuyerSchema,
  askZainSchema,
  linkedinDaySchema,
  linkedinReportSchema,
} = require('../schema/linkedinSchemas');

/* Collections: linkedin_buyers, linkedin_askzain, linkedin_days, linkedin_reports */
const linkedinBuyerModel = mongoose.model('linkedin_buyers', linkedinBuyerSchema);
const askZainModel = mongoose.model('linkedin_askzain', askZainSchema);
const linkedinDayModel = mongoose.model('linkedin_days', linkedinDaySchema);
const linkedinReportModel = mongoose.model('linkedin_reports', linkedinReportSchema);

module.exports = {
  linkedinBuyerModel,
  askZainModel,
  linkedinDayModel,
  linkedinReportModel,
};
