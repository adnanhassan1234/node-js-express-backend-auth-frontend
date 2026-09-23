const mongoose = require('mongoose');

/** Password terminal par na chhape -- URI ko chhupa kar dikhata hai */
const maskUri = (uri) => String(uri || '').replace(/\/\/[^@]*@/, '//<user>:<pass>@');

/**
 * MongoDB se connect karta hai.
 *
 * Pehle ye ek nakaam koshish par process.exit(1) kar deta tha -- yani network
 * me zara si rukawat aate hi poora server mar jata tha. Atlas se connection
 * kabhi kabhi TLS par fail ho jata hai (khaas taur par kamzor network par),
 * is liye ab:
 *
 *   - chand dafa dobara koshish karta hai (har dafa thora ziyada ruk kar)
 *   - phir bhi na ho to server ZINDA rehta hai, aur keepTrying() har 10
 *     second baad peechhe peechhe koshish karta rehta hai
 */
const connectDB = async (retries = 5) => {
  console.log('MongoDB:', maskUri(process.env.MONGO_URI));

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000,
      });

      console.log(' MongoDB connected with Mongoose');
      return;
    } catch (error) {
      console.error(
        ' MongoDB connection failed (koshish ' + attempt + '/' + retries + '): ' + error.message
      );

      if (attempt < retries) {
        const waitMs = attempt * 2000;
        console.log(' ' + waitMs / 1000 + ' second baad dobara koshish...');
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  // Yahan tak pohanchne ka matlab: abhi connect nahi hua -- magar server band NAHI karenge
  console.error(
    ' MongoDB abhi tak connect nahi hua. Server chal raha hai;' +
      ' peechhe peechhe koshish jaari rahegi.'
  );

  keepTrying();
};

/**
 * Saari koshishein nakaam ho jayen to peechhe peechhe koshish karta rehta hai.
 *
 * Ye zaroori hai: agar mongoose.connect() reject ho jaye to mongoose KHUD SE
 * dobara koshish nahi karta -- connection banta hi nahi. Is liye har 10 second
 * baad khud koshish karte hain, jab tak jur na jaye.
 */
let retryTimer = null;

const keepTrying = () => {
  if (retryTimer) return;                          // pehle se chal raha hai

  retryTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {    // jur gaya, ab bas
      clearInterval(retryTimer);
      retryTimer = null;
      return;
    }

    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
      console.log(' MongoDB aakhir kaar jur gaya');

      clearInterval(retryTimer);
      retryTimer = null;
    } catch (error) {
      console.warn(' MongoDB abhi bhi nahi jura: ' + error.message.slice(0, 120));
    }
  }, 10000);

  retryTimer.unref();                              // process ko zabardasti zinda na rakhe
};

/*
 * Connection ka haal nazar aata rahe -- magar sirf asal masle par.
 *
 * Mongoose pehle connect hone se pehle aur pool badalte waqt bhi 'disconnected'
 * bhejta hai. Wo asal masla nahi hota, is liye do shartein lagai hain:
 *   1. pehli dafa connect ho chuka ho
 *   2. 3 second baad bhi wapas na aaya ho
 */
let connectedOnce = false;
let warnedDisconnect = false;

mongoose.connection.on('connected', () => {
  connectedOnce = true;
});

mongoose.connection.on('disconnected', () => {
  if (!connectedOnce) return;

  setTimeout(() => {
    if (mongoose.connection.readyState !== 1) {
      warnedDisconnect = true;
      console.warn(' MongoDB disconnect ho gaya -- dobara jurne ki koshish jaari hai');
    }
  }, 3000).unref();
});

/* Sirf tab bolo jab humne waqai disconnect ki khabar di thi */
mongoose.connection.on('reconnected', () => {
  if (!warnedDisconnect) return;

  warnedDisconnect = false;
  console.log(' MongoDB dobara jur gaya');
});

module.exports = connectDB();


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