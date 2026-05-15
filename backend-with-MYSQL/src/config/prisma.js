//  const { PrismaClient } = require('../generated/prisma/client.ts');
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
