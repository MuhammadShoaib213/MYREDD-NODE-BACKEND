// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

// Route imports
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customers');
const propertyRoutes = require('./routes/propertyRoutes');
const friendRoutes = require('./routes/friend');
const chatRoutes = require('./routes/chatRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const contactRoute = require('./routes/contact');
const friendshipRoutes = require('./routes/friendshipRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const noteRoutes = require('./routes/noteRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const sharedLeadRoutes = require('./routes/sharedLeadRoutes');
const addressRoutes = require('./routes/addressRoutes');
const customerInviteRoutes = require('./routes/customerInviteRoutes');
const placesRouter = require('./routes/places');
const adminRoutes = require('./routes/adminRoutes');  

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 6003;
const MONGODB_URI = process.env.MONGODB_URI;

// ====== 1) Refined CORS Configuration ======
app.use(cors({
  origin: true,
  credentials: true
}));


// ====== 2) Parse Request Bodies ======
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// (bodyParser.json() is redundant with express.json() and has been removed)

// ====== 3) Block Access to Hidden Files/Directories ======
// This middleware denies access to any route that includes a "/." (e.g., .hg, .git)
app.use((req, res, next) => {
  if (req.path.match(/\/\.[^\/]+/)) {
    return res.status(404).send('Not Found');
  }
  next();
});

// ====== 4) Mongo Sanitize & Helmet (with updated CSP, frameguard, nosniff) ======
app.use(mongoSanitize());

// Configure Helmet to address reported issues:
// Simplified Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "http://195.179.231.102"],
      scriptSrc: ["'self'", "http://195.179.231.102"],
      styleSrc: ["'self'", "'unsafe-inline'", "http://195.179.231.102"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http://195.179.231.102", "ws:", "wss:"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ====== 5) Static Uploads Directory ======
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'deny', // Ensure that dotfiles (e.g., .hg) are not served from the uploads directory
}));

// ====== 6) Route Setup ======
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api/contact', contactRoute);
app.use('/api/friends', friendshipRoutes);
app.use('/api/friend', friendsRoutes);
app.use('/api', noteRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/shared-leads', sharedLeadRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/CustomerInvites', customerInviteRoutes);
app.use('/api/places', placesRouter);
app.use('/api/admin', adminRoutes);

// Example route for neighborhoods (Google Maps API)
app.get('/api/neighborhoods', async (req, res) => {
  const { latitude, longitude } = req.query;
  const apiKey = process.env.GOOGLE_API_KEY;

  console.log('Received request to /api/neighborhoods');
  console.log(`Query parameters - Latitude: ${latitude}, Longitude: ${longitude}`);

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=25000&type=neighborhood&key=${apiKey}`;
  console.log(`Constructed URL: ${url}`);

  try {
    console.log('Fetching data from Google Maps API...');
    const response = await axios.get(url);
    console.log('Response received from API');
    const data = response.data;
    console.log('Data successfully parsed from API response');

    res.json(data);
    console.log('Response sent to client');
  } catch (error) {
    console.error('Error fetching neighborhoods:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch neighborhoods' });
  }
});

// File upload route example
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file received' });
  }
  // Construct a public URL
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  return res.json({ url: publicUrl });
});

// ====== 7) Connect to MongoDB & Start the Server ======
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    server.listen(PORT, () => {
      console.log(`Server is running on ${PORT}`);
    });

    // ====== 8) Socket.io Setup ======
    const io = socketIo(server, {
      cors: {
        origin: 'http://195.179.231.102', // Restrict socket.io connections to the allowed front-end
        methods: ["GET", "POST"],
        credentials: true,
      }
    });

    // Initialize chat routes with the socket.io instance
    app.use('/api/messages', chatRoutes(io));

    // Socket.io event handling
    io.on('connection', (socket) => {
      console.log('New client connected');

      socket.on('joinChat', (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat: ${chatId}`);
      });

      socket.on('newMessage', (message) => {
        io.to(message.chatId).emit('message', message);
        console.log('Message sent to room:', message);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB Atlas:', error);
  });

// ====== 9) Global Error Handling Middleware ======
app.use((err, req, res, next) => {
  console.error(err.stack);
  // In production, consider logging the error to a file or external logging service
  res.status(500).json({ error: 'Internal server error' });
});


app.get('/', (req, res) => {
  res.send('myredd backed running');
});



// // index.js
// const express = require('express');
// const mongoose = require('mongoose');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const http = require('http');
// const socketIo = require('socket.io');
// const multer = require('multer');
// const path = require('path');
// const axios = require('axios');
// require('dotenv').config();
// const mongoSanitize = require('express-mongo-sanitize');
// const helmet = require('helmet');

// // Route imports
// const authRoutes = require('./routes/authRoutes');
// const customerRoutes = require('./routes/customers');
// const propertyRoutes = require('./routes/propertyRoutes');
// const friendRoutes = require('./routes/friend');
// const chatRoutes = require('./routes/chatRoutes');
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const subscriptionRoutes = require('./routes/subscriptionRoutes');
// const contactRoute = require('./routes/contact');
// const friendshipRoutes = require('./routes/friendshipRoutes');
// const friendsRoutes = require('./routes/friendsRoutes');
// const noteRoutes = require('./routes/noteRoutes');
// const scheduleRoutes = require('./routes/scheduleRoutes');
// const sharedLeadRoutes = require('./routes/sharedLeadRoutes');
// const addressRoutes = require('./routes/addressRoutes'); // New address routes
// const customerInviteRoutes = require('./routes/customerInviteRoutes');
// const placesRouter = require('./routes/places');  

// const app = express();
// const server = http.createServer(app);

// const PORT = process.env.PORT || 6003;
// const MONGODB_URI = process.env.MONGODB_URI;



// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(bodyParser.json());
// app.use(express.json());

// app.use(mongoSanitize());

// app.use(helmet());
// // Static uploads directory
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   }
// });
// const upload = multer({ storage: storage });
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Route setup
// app.use('/api/auth', authRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/properties', propertyRoutes);
// app.use('/api/friends', friendRoutes);
// app.use('/api/attendance', attendanceRoutes);
// app.use('/api', subscriptionRoutes);
// app.use('/api/contact', contactRoute);
// app.use('/api/friends', friendshipRoutes);
// app.use('/api/friend', friendsRoutes);
// app.use('/api', noteRoutes);
// app.use('/api/schedules', scheduleRoutes);
// app.use('/api/shared-leads', sharedLeadRoutes);
// app.use('/api/address', addressRoutes);
// app.use('/api/CustomerInvites', customerInviteRoutes);
// app.use('/api/places', placesRouter);

// app.get('/api/neighborhoods', async (req, res) => {
//   const { latitude, longitude } = req.query;
//   const apiKey = process.env.GOOGLE_API_KEY;

//   console.log('Received request to /api/neighborhoods');
//   console.log(`Query parameters - Latitude: ${latitude}, Longitude: ${longitude}`);

//   const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=25000&type=neighborhood&key=${apiKey}`;
//   console.log(`Constructed URL: ${url}`);

//   try {
//     console.log('Fetching data from Google Maps API...');
//     const response = await axios.get(url);
//     console.log('Response received from API');
//     const data = response.data;
//     console.log('Data successfully parsed from API response');

//     res.json(data);
//     console.log('Response sent to client');
//   } catch (error) {
//     console.error('Error fetching neighborhoods:', error.message);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({ error: 'Failed to fetch neighborhoods' });
//   }
// });



// app.post('/api/upload', upload.single('file'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ error: 'No file received' });
//   }
//   // Construct a public URL assuming you serve the uploads folder statically
//   const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
//   return res.json({ url: publicUrl });
// });

// // Serve static files from uploads folder
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // Connect to MongoDB
// mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     console.log('Connected to MongoDB Atlas');
//     server.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });

//     const io = socketIo(server, {
//       cors: {
//         origin: '*',
//         methods: ["GET", "POST"],
//         credentials: true,
//       }
//     });

//     // Initialize chat routes with the socket.io instance passed
//     app.use('/api/messages', chatRoutes(io));

//     // Socket.io event handling
//     io.on('connection', (socket) => {
//       console.log('New client connected');

//       socket.on('joinChat', (chatId) => {
//         socket.join(chatId);
//         console.log(`User joined chat: ${chatId}`);
//       });

//       socket.on('newMessage', (message) => {
//         io.to(message.chatId).emit('message', message);
//         console.log('Message sent to room:', message);
//       });

//       socket.on('disconnect', () => {
//         console.log('Client disconnected');
//       });
//     });
//   })
//   .catch((error) => {
//     console.error('Error connecting to MongoDB Atlas:', error);
//   });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: 'Internal server error' });
// });


