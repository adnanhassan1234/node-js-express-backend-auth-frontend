require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
require('./src/config/db');
// require('./src/models/sequelizeSqlModel');
const SequelizeAdminUserRoute = require('./src/routes/sequelizeSqlRoute');
const PrismaOrderRoute = require('./src/routes/prismaSqlRoute');
const AdminSQLUserRoute = require('./src/routes/mySQLAdminRoute');
const sequelize = require('./src/config/sequelize');
const sportsSeqModel = require('./src/models/sportsSeqModel');

const app = express();
const server = http.createServer(app);

// await sequelize.sync();
// console.log("Normal sync done");

sequelize
  .sync({ alter: false })
  .then(() => console.log('✅ Tables synced'))
  .catch((err) => console.error(err));

/* ========= NORMAL MIDDLEWARES ========== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// test route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'User routes are working' });
});

/* =========== ROUTES ============ */

// app.use(AdminSQLUserRoute);
app.use(SequelizeAdminUserRoute);
// app.use(PrismaOrderRoute);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
