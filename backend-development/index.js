// const express = require('express');
// const path = require('path');
// const userController = require('./controller/userController');
// const userData = require('./user.json');
// const { MongoClient, ObjectId } = require('mongodb');
// const app = express();

// app.use(express.json());

// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// const MONGO_URI = 'mongodb://localhost:27017';
// const DB_NAME = 'school';
// const client = new MongoClient(MONGO_URI);

//  Connect to MongoDB

//  async function connectDB() {
//    try {
//      // const client = new MongoClient(MONGO_URI);
//      await client.connect();
//      const db = client.db(DB_NAME);
//      console.log('MongoDB connected successfully');
//      const students = await db.collection('students').find().toArray();
//      console.log('Students list:', students);
//    } catch (error) {
//      console.error('MongoDB connection failed:', error);
//      process.exit(1);
//    }
//  }

// // connectDB();

// client.connect().then(() => {
//   const db = client.db(DB_NAME);
//   app.get('/api/students', async (req, res) => {
//     try {
//       const students = await db.collection('students').find().toArray();
//       res.status(200).send(students);
//     } catch (error) {
//       console.error('Error fetching students:', error);
//       res.status(500).send('Internal server error');
//     }
//   });
//   app.get('/api/students/:id', async (req, res) => {
//     try {
//       const id = req.params.id;
//       const student = await db.collection('students').findOne({ _id: new ObjectId(id) });
//       if (!student) {
//         return res.status(404).send('Student not found');
//       }
//       res.status(200).send(student);
//     } catch (error) {
//       console.error('Error fetching student:', error);
//       res.status(500).send('Internal server error');
//     }
//   });
//   app.post('/api/students', async (req, res) => {
//     try {
//       const payload = req.body;
//       if (!payload.name || !payload.age || !payload.email) {
//         return res.status(400).json({
//           message: 'Name, age, and email are required',
//           success: false,
//         });
//       }

//       const result = await db.collection('students').insertOne(payload);
//       res
//         .status(201)
//         .send({ message: 'Student added successfully', success: true, id: result.insertedId });
//     } catch (error) {
//       console.error('Error adding student:', error);
//       res.status(500).send('Internal server error');
//     }
//   });
//   app.put('/api/students/:id', async (req, res) => {
//     try {
//       const id = req.params.id;
//       const payload = req.body;
//       const result = await db
//         .collection('students')
//         .updateOne({ _id: new ObjectId(id) }, { $set: payload });
//       if (result.matchedCount === 0) {
//         return res.status(404).send('Student not found');
//       }
//       res.status(200).send({ message: 'Student updated successfully', success: true });
//     } catch (error) {
//       console.error('Error updating student:', error);
//       res.status(500).send('Internal server error');
//     }
//   });
//   app.delete('/api/students/:id', async (req, res) => {
//     try {
//       const id = req.params.id;
//       const result = await db.collection('students').deleteOne({ _id: new ObjectId(id) });
//       if (result.deletedCount === 0) {
//         return res.status(404).send('Student not found');
//       }
//       res.status(200).send({ message: 'Student deleted successfully', success: true });
//     } catch (error) {
//       console.error('Error deleting student:', error);
//       res.status(500).send('Internal server error');
//     }
//   });
// });

// app.get('/', async (req, res) => {
//   try {
//     const client = new MongoClient(MONGO_URI);
//     await client.connect();
//     const db = client.db(DB_NAME);
//     console.log('MongoDB connected successfully');
//     const students = await db.collection('students').find().toArray();
//     res.status(200).send(students);
//   } catch (error) {
//     console.error('MongoDB connection failed:', error);
//     process.exit(1);
//   }
// });

// app.get('/users', userController.getUsers);

// app.get('/products', (req, res) => {
//   res.status(200).send(userData);
// });

// app.get('/products/:id', (req, res) => {
//   const id = req.params.id;
//   const product = userData.find((item) => item.id == id);
//   if (!product) {
//     return res.status(404).send('Product not found');
//   }
//   res.status(200).send(product);
// });
// app.get('/username/:name', (req, res) => {
//   const name = req.params.name;
//   const user = userData.find((item) => item.name.toLowerCase() == name.toLowerCase());
//   if (!user) {
//     return res.status(404).send('User not found');
//   }
//   res.status(200).send(user);
// });
// // Start server
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// mongoose ==========================import express from 'express';// 1. Sabse upar dotenv rakhen taake baki saare modules ko variables mil sakenrequire('dotenv').config();
require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const connectDB = require('./config/db');

const stripePaymentController = require('./controller/stripePaymentController');
const StudentRouter = require('./routes/studentRoutes');
const AuthRouter = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);

const io = socketIO(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3000;

/* ================= STRIPE WEBHOOK (FIRST) ================= */
app.post(
  '/stripe-webhook',
  express.raw({ type: 'application/json' }),
  stripePaymentController.handleWebhook
);

/* ================= NORMAL MIDDLEWARES ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= SWAGGER ================= */
app.use('/swagger-api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ================= ROUTES ================= */
app.use(AuthRouter);
app.use(StudentRouter);

/* ================= DataBase ================= */
connectDB();

/* ================= SOCKET ================= */
io.on('connection', (socket) => {
  socket.on('chat message', (payload) => {
    io.emit('chat message', payload);
  });

  const interval = setInterval(() => {
    socket.emit('notification', {
      message: 'New message from server',
      time: new Date().toLocaleTimeString(),
    });
  }, 10000);

  socket.on('disconnect', () => clearInterval(interval));
});

/* ================= SERVER ================= */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/swagger-api-docs`);
});
