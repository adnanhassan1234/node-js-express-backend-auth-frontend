const mongoose = require('mongoose');

const connectDB = async () => {
    console.log("Current URI:", process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(' MongoDB connected with Mongoose');
  } catch (error) {
    console.error(' MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;


// const mongoose = require('mongoose');

// const connectDB = async () => {
//   // Agar Docker mein hai toh 'mongo' use karega, warna 'localhost'
//   const dbUri = process.env.MONGO_URI || "mongodb://localhost:27017/school";
  
//   console.log("Attempting to connect to:", dbUri);

//   try {
//     await mongoose.connect(dbUri);
//     console.log('✅ MongoDB connected successfully');
//   } catch (error) {
//     console.error('❌ MongoDB connection failed:', error.message);
    
//     if (error.message.includes('ENOTFOUND mongo')) {
//       console.log('💡 Tip: It looks like you are running the app locally. Change "mongo" to "localhost" in your .env file.');
//     }
    
//     process.exit(1);
//   }
// };

// module.exports = connectDB;