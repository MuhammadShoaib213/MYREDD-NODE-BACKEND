const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
require('dotenv').config();


// Route imports
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customers');
const propertyRoutes = require('./routes/propertyRoutes');
const friendRoutes = require('./routes/friend');
const chatRoutes = require('./routes/chatRoutes'); // Import the module without invoking it here
const attendanceRoutes = require('./routes/attendanceRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const contactRoute = require('./routes/contact');
const friendshipRoutes = require('./routes/friendshipRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const noteRoutes = require('./routes/noteRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 6003;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.json());

// Static uploads directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route setup
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

app.get('/api/neighborhoods', async (req, res) => {
  const { latitude, longitude } = req.query;
  const apiKey = 'AIzaSyDVOjCkNrveTmwwBP5qbqkGAfarfSPAZbQ'; // Store your API key securely

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

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    const io = socketIo(server, {
      cors: {
        origin: '*',
        methods: ["GET", "POST"],
        credentials: true,
      }
    });

    // Initialize chat routes with the socket.io instance passed
    app.use('/api/messages', chatRoutes(io)); // Now chatRoutes are properly initialized with io
    console.log("Chat routes are set up.");

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

// // Axios interceptor to add token to request headers
// axios.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// }, error => {
//   return Promise.reject(error);
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});


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

// // Route imports
// const authRoutes = require('./routes/authRoutes');
// const customerRoutes = require('./routes/customers');
// const propertyRoutes = require('./routes/propertyRoutes');
// const friendRoutes = require('./routes/friend');
// const chatRoutes = require('./routes/chatRoutes'); // Import the module without invoking it here
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const subscriptionRoutes = require('./routes/subscriptionRoutes');
// const contactRoute = require('./routes/contact');
// const friendshipRoutes = require('./routes/friendshipRoutes');
// const friendsRoutes = require('./routes/friendsRoutes');
// const noteRoutes = require('./routes/noteRoutes');

// const app = express();
// const server = http.createServer(app);

// const PORT = process.env.PORT || 5000;

// // Replace with your MongoDB Atlas connection string
// const MONGODB_URI = process.env.MONGODB_URI;

// app.use(cors({
//   origin: '*',
//   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'], 
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
// }));

// app.use(bodyParser.json());
// app.use(express.json());

// // Static uploads directory
// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function(req, file, cb) {
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
//     app.use('/api/messages', chatRoutes(io)); // Now chatRoutes are properly initialized with io
//     console.log("Chat routes are set up.");
    
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

// axios.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });


// // const express = require('express');
// // const mongoose = require('mongoose');
// // const bodyParser = require('body-parser');
// // const cors = require('cors');
// // const http = require('http');
// // const socketIo = require('socket.io');
// // const multer = require('multer');
// // const path = require('path');
// // const axios = require('axios');
// // require('dotenv').config();

// // // Route imports
// // const authRoutes = require('./routes/authRoutes');
// // const customerRoutes = require('./routes/customers');
// // const propertyRoutes = require('./routes/propertyRoutes');
// // const friendRoutes = require('./routes/friend');
// // const chatRoutes = require('./routes/chatRoutes'); // Import the module without invoking it here
// // const attendanceRoutes = require('./routes/attendanceRoutes');
// // const subscriptionRoutes = require('./routes/subscriptionRoutes');
// // const contactRoute = require('./routes/contact');

// // const app = express();
// // const server = http.createServer(app);

// // const PORT = process.env.PORT || 5000;

// // // Replace with your MongoDB Atlas connection string
// // const MONGODB_URI = process.env.MONGODB_URI;

// // app.use(cors());
// // app.use(bodyParser.json());
// // app.use(express.json());

// // // Static uploads directory
// // const storage = multer.diskStorage({
// //     destination: function(req, file, cb) {
// //         cb(null, 'uploads/');
// //     },
// //     filename: function(req, file, cb) {
// //         cb(null, Date.now() + path.extname(file.originalname));
// //     }
// // });
// // const upload = multer({ storage: storage });
// // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // // Route setup
// // app.use('/api/auth', authRoutes);
// // app.use('/api/customers', customerRoutes);
// // app.use('/api/properties', propertyRoutes);
// // app.use('/api/friends', friendRoutes);
// // app.use('/api/attendance', attendanceRoutes);
// // app.use('/api', subscriptionRoutes);
// // app.use(bodyParser.json());
// // app.use('/api/contact', contactRoute);

// // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// //     .then(() => {
// //         console.log('Connected to MongoDB Atlas');
// //         server.listen(PORT, () => {
// //             console.log(`Server is running on http://localhost:${PORT}`);
// //         });

// //         const io = socketIo(server, {
// //             cors: {
// //                 origin: "http://localhost:3000",
// //                 methods: ["GET", "POST"],
// //                 credentials: true
// //             }
// //         });

// //         // Initialize chat routes with the socket.io instance passed
// //         app.use('/api/messages', chatRoutes(io)); // Now chatRoutes are properly initialized with io
// //         console.log("Chat routes are set up.");
        
// //         // Socket.io event handling
// //         io.on('connection', (socket) => {
// //             console.log('New client connected');

// //             socket.on('joinChat', (chatId) => {
// //                 socket.join(chatId);
// //                 console.log(`User joined chat: ${chatId}`);
// //             });

// //             socket.on('newMessage', (message) => {
// //                 io.to(message.chatId).emit('message', message);
// //                 console.log('Message sent to room:', message);
// //             });

// //             socket.on('disconnect', () => {
// //                 console.log('Client disconnected');
// //             });
// //         });
// //     })
// //     .catch((error) => {
// //         console.error('Error connecting to MongoDB Atlas:', error);
// //     });

// // axios.interceptors.request.use(config => {
// //     const token = localStorage.getItem('token');
// //     config.headers.Authorization = `Bearer ${token}`;
// //     return config;
// // });


// // // const express = require('express');
// // // const mongoose = require('mongoose');
// // // const bodyParser = require('body-parser');
// // // const cors = require('cors');
// // // const http = require('http');
// // // const socketIo = require('socket.io');
// // // const multer = require('multer');
// // // const path = require('path');
// // // const axios = require('axios');
// // // require('dotenv').config()

// // // // Route imports
// // // const authRoutes = require('./routes/authRoutes');
// // // const customerRoutes = require('./routes/customers');
// // // const propertyRoutes = require('./routes/propertyRoutes');
// // // const friendRoutes = require('./routes/friend');
// // // const chatRoutes = require('./routes/chatRoutes'); // Import the module without invoking it here
// // // const attendanceRoutes = require('./routes/attendanceRoutes');
// // // const subscriptionRoutes = require('./routes/subscriptionRoutes');
// // // const contactRoute = require('./routes/contact');


// // // const app = express();
// // // const server = http.createServer(app);

// // // const PORT = process.env.PORT || 5000;
// // // const MONGODB_URI = 'mongodb://localhost:27017/my_redd';

// // // app.use(cors());
// // // app.use(bodyParser.json());
// // // app.use(express.json());

// // // // Static uploads directory
// // // const storage = multer.diskStorage({
// // //     destination: function(req, file, cb) {
// // //         cb(null, 'uploads/');
// // //     },
// // //     filename: function(req, file, cb) {
// // //         cb(null, Date.now() + path.extname(file.originalname));
// // //     }
// // // });
// // // const upload = multer({ storage: storage });
// // // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // // // Route setup
// // // app.use('/api/auth', authRoutes);
// // // app.use('/api/customers', customerRoutes);
// // // app.use('/api/properties', propertyRoutes);
// // // app.use('/api/friends', friendRoutes);
// // // app.use('/api/attendance', attendanceRoutes);
// // // app.use('/api', subscriptionRoutes);
// // // app.use(bodyParser.json());
// // // app.use('/api/contact', contactRoute);



// // // // app.get('/chat', (req, res) => {
// // // //     res.send('MyRedd Chat Server is running');
// // // // });

// // // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// // //     .then(() => {
// // //         console.log('Connected to MongoDB');
// // //         server.listen(PORT, () => {
// // //             console.log(`Server is running on http://localhost:${PORT}`);
// // //         });

// // //         const io = socketIo(server, {
// // //             cors: {
// // //                 origin: "http://localhost:3000",
// // //                 methods: ["GET", "POST"],
// // //                 credentials: true
// // //             }
// // //         });

// // //         // Initialize chat routes with the socket.io instance passed
// // //         app.use('/api/messages', chatRoutes(io)); // Now chatRoutes are properly initialized with io
// // //         console.log("Chat routes are set up.");
// // //         // Socket.io event handling
// // //         io.on('connection', (socket) => {
// // //             console.log('New client connected');

// // //             socket.on('joinChat', (chatId) => {
// // //                 socket.join(chatId);
// // //                 console.log(`User joined chat: ${chatId}`);
// // //             });

// // //             socket.on('newMessage', (message) => {
// // //                 io.to(message.chatId).emit('message', message);
// // //                 console.log('Message sent to room:', message);
// // //             });

// // //             socket.on('disconnect', () => {
// // //                 console.log('Client disconnected');
// // //             });
// // //         });
// // //     })
// // //     .catch((error) => {
// // //         console.error('Error connecting to MongoDB:', error);
// // //     });

// // // axios.interceptors.request.use(config => {
// // //     const token = localStorage.getItem('token');
// // //     config.headers.Authorization = `Bearer ${token}`;
// // //     return config;
// // // });



// // // const express = require('express');
// // // const mongoose = require('mongoose');
// // // const bodyParser = require('body-parser');
// // // const cors = require('cors');
// // // const http = require('http');
// // // const socketIo = require('socket.io');
// // // const multer = require('multer');
// // // const path = require('path');
// // // const axios = require('axios');

// // // // Route imports
// // // const authRoutes = require('./routes/authRoutes');
// // // const customerRoutes = require('./routes/customers');
// // // const propertyRoutes = require('./routes/propertyRoutes');
// // // const friendRoutes = require('./routes/friend');
// // // const chatRoutes = require('./routes/chatRoutes')(io);   // Import chat routes

// // // const app = express();
// // // const server = http.createServer(app);
// // // const io = socketIo(server, {
// // //     cors: {
// // //         origin: "http://localhost:3000",
// // //         methods: ["GET", "POST"],
// // //         credentials: true
// // //     }
// // // });

// // // const PORT = process.env.PORT || 5000;
// // // const MONGODB_URI = 'mongodb://localhost:27017/my_redd';

// // // app.use(cors());
// // // app.use(bodyParser.json());
// // // app.use(express.json());

// // // // Static uploads directory
// // // const storage = multer.diskStorage({
// // //     destination: function(req, file, cb) {
// // //         cb(null, 'uploads/');
// // //     },
// // //     filename: function(req, file, cb) {
// // //         cb(null, Date.now() + path.extname(file.originalname));
// // //     }
// // // });
// // // const upload = multer({ storage: storage });
// // // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // // // Route setup
// // // app.use('/api/auth', authRoutes);
// // // app.use('/api/customers', customerRoutes);
// // // app.use('/api/properties', propertyRoutes);
// // // app.use('/api/friends', friendRoutes);
// // // app.use('/api/messages', chatRoutes);  
// // // chatRoutes(app, io);  // Initialize chat routes with the socket.io instance

// // // app.get('/chat', (req, res) => {
// // //     res.send('MyRedd Chat Server is running');
// // // });

// // // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// // //     .then(() => {
// // //         console.log('Connected to MongoDB');
// // //         server.listen(PORT, () => {
// // //             console.log(`Server is running on http://localhost:${PORT}`);
// // //         });

// // //         // Socket.io event handling
// // //         io.on('connection', (socket) => {
// // //             console.log('New client connected');

// // //             socket.on('joinChat', (chatId) => {
// // //                 socket.join(chatId);
// // //                 console.log(`User joined chat: ${chatId}`);
// // //             });

// // //             socket.on('newMessage', (message) => {
// // //                 io.to(message.chatId).emit('message', message);
// // //                 console.log('Message sent to room:', message);
// // //             });

// // //             socket.on('disconnect', () => {
// // //                 console.log('Client disconnected');
// // //             });
// // //         });
// // //     })
// // //     .catch((error) => {
// // //         console.error('Error connecting to MongoDB:', error);
// // //     });

// // // axios.interceptors.request.use(config => {
// // //     const token = localStorage.getItem('token');
// // //     config.headers.Authorization = `Bearer ${token}`;
// // //     return config;
// // // });







// // // const express = require('express');
// // // const mongoose = require('mongoose');
// // // const bodyParser = require('body-parser');
// // // const cors = require('cors');
// // // const http = require('http');
// // // const socketIo = require('socket.io');
// // // const multer = require('multer');
// // // const path = require('path');
// // // const axios = require('axios');

// // // const authRoutes = require('./routes/authRoutes');
// // // const customerRoutes = require('./routes/customers');
// // // const propertyRoutes = require('./routes/propertyRoutes');
// // // const friendRoutes = require('./routes/friend');

// // // const app = express();
// // // const server = http.createServer(app);
// // // const io = socketIo(server, {
// // //     cors: {
// // //         origin: "http://localhost:3000",
// // //         methods: ["GET", "POST"],
// // //         credentials: true
// // //     }
// // // });

// // // const PORT = process.env.PORT || 5000;
// // // const MONGODB_URI = 'mongodb://localhost:27017/my_redd';

// // // app.use(cors({
// // //     origin: 'http://localhost:3000',
// // //     methods: ['GET', 'POST', 'PUT', 'DELETE'],
// // //     credentials: true,
// // // }));

// // // const storage = multer.diskStorage({
// // //     destination: function(req, file, cb) {
// // //         cb(null, 'uploads/');
// // //     },
// // //     filename: function(req, file, cb) {
// // //         cb(null, Date.now() + path.extname(file.originalname));
// // //     }
// // // });

// // // const upload = multer({ storage: storage });
// // // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // // app.use(bodyParser.json());
// // // app.use(express.json());

// // // app.use((req, res, next) => {
// // //     console.log(`${req.method} ${req.path}`);
// // //     next();
// // // });

// // // app.use('/api/auth', authRoutes);
// // // app.use('/api/customers', customerRoutes);
// // // app.use('/api/properties', propertyRoutes);
// // // app.use('/api/friends', friendRoutes);

// // // app.use((req, res, next) => {
// // //     console.log("Headers:", req.headers); // Log all headers to see what's received
// // //     next();
// // // });


// // // app.get('/chat', (req, res) => {
// // //     res.send('MyRedd Chat Server is running');
// // // });

// // // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// // //     .then(() => {
// // //         console.log('Connected to MongoDB');
// // //         server.listen(PORT, () => {
// // //             console.log(`Server is running on http://localhost:${PORT}`);
// // //         });

// // //         io.on('connection', (socket) => {
// // //             console.log('New client connected');
// // //             socket.on('newMessage', (message) => {
// // //               console.log(`Received message from ${message.senderId}: ${message.text}`);
// // //                 io.to(message.receiverId).emit('notification', {
// // //                     type: 'newMessage',
// // //                     message: 'You have a new message',
// // //                     from: message.senderId,
// // //                     content: message.text
// // //                 });
// // //                 console.log(message);
// // //             });
// // //             socket.on('disconnect', () => {
// // //                 console.log('Client disconnected');
// // //             });
// // //         });
// // //     })
// // //     .catch((error) => {
// // //         console.error('Error connecting to MongoDB:', error);
// // //     });

// // //     axios.interceptors.request.use(config => {
// // //       const token = localStorage.getItem('token');
// // //       config.headers.Authorization = `Bearer ${token}`;
// // //       console.log('Sending request with headers:', config.headers);
// // //       return config;
// // //     });
// // // // const express = require('express');
// // // // const mongoose = require('mongoose');
// // // // const bodyParser = require('body-parser');
// // // // const authRoutes = require('./routes/authRoutes');
// // // // const cors = require('cors');
// // // // const customerRoutes = require('./routes/customers');
// // // // const multer = require('multer');
// // // // const path = require('path'); 
// // // // const propertyRoutes = require('./routes/propertyRoutes'); 
// // // // const socketIo = require('socket.io');



// // // // const app = express();
// // // // const PORT = process.env.PORT || 5000;
// // // // const MONGODB_URI = 'mongodb://localhost:27017/my_redd';

// // // // app.use(cors({
// // // //     origin: 'http://localhost:3000',
// // // //     methods: ['GET', 'POST', 'PUT', 'DELETE'],
// // // //     credentials: true,
// // // // }));

// // // // // Multer setup
// // // // const storage = multer.diskStorage({
// // // //     destination: function(req, file, cb) {
// // // //         cb(null, 'uploads/');
// // // //     },
// // // //     filename: function(req, file, cb) {
// // // //         cb(null, Date.now() + path.extname(file.originalname));
// // // //     }
// // // // });

// // // // const upload = multer({ storage: storage });


// // // // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // // // // Middleware
// // // // app.use(bodyParser.json());
// // // // app.use(express.json());

// // // // app.use((req, res, next) => {
// // // //   console.log(`${req.method} ${req.path}`);
// // // //   next();
// // // // });

// // // // // Routes
// // // // app.use('/api/auth', authRoutes);

// // // // app.use('/api/customers', customerRoutes);

// // // // app.use('/api/properties', propertyRoutes);

// // // // // Basic Route
// // // // app.get('/chat', (req, res) => {
// // // //   res.send('MyRedd Chat Server is running');
// // // // });





// // // // // Connect to MongoDB
// // // // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// // // //     .then(() => {
// // // //         console.log('Connected to MongoDB');
// // // //         // Start the server
// // // //          const server = app.listen(PORT, () => {
// // // //             console.log(`Server is running on http://localhost:${PORT}`);
// // // //         });
// // // //     })
// // // //     .catch((error) => {
// // // //         console.error('Error connecting to MongoDB:', error);
// // // //     });


// // // // // Setup Socket.io
// // // // const io = socketIo(server);
// // // // io.on('connection', (socket) => {
// // // //   console.log('New client connected');
// // // //   socket.on('disconnect', () => {
// // // //     console.log('Client disconnected');
// // // //   });
// // // // });

