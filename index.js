// index.js  (complete, updated 24-Apr-2025)

require('dotenv').config();

const express       = require('express');
const http          = require('http');
const path          = require('path');
const mongoose      = require('mongoose');
const cors          = require('cors');
const multer        = require('multer');
const axios         = require('axios');
const mongoSanitize = require('express-mongo-sanitize');
const helmet        = require('helmet');
const stripe        = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ────────────────────────────────────────────────────────── */
/* 1) core app + socket.io                                    */
/* ────────────────────────────────────────────────────────── */
const app    = express();          // declare app **before** server
const server = http.createServer(app);
const io     = require('./sockets')(server);   // returns shared instance

/* attach io to every req so REST routes can emit */
app.use((req, _res, next) => { req.io = io; next(); });

/* ────────────────────────────────────────────────────────── */
/* 2) security & body-parsing                                */
/* ────────────────────────────────────────────────────────── */

/* raw-body exception – Stripe needs the raw bytes */
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') return next();   // skip json parser
  express.json()(req, res, next);                      // normal JSON
});

app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));
app.use(mongoSanitize());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc : ["'self'"],
        scriptSrc  : ["'self'"],
        styleSrc   : ["'self'", "'unsafe-inline'"],
        imgSrc     : ["'self'", 'data:', 'http://localhost:5000'],
        connectSrc : ["'self'", 'ws:', 'wss:'],
        objectSrc  : ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

/* block hidden files/dirs */
app.use((req, res, next) => {
  if (req.path.match(/\/\.[^\/]+/)) return res.status(404).send('Not Found');
  next();
});

/* ────────────────────────────────────────────────────────── */
/* 3) file uploads                                            */
/* ────────────────────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, 'uploads/'),
  filename   : (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },           // 10 MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/', 'application/pdf'].some(p => file.mimetype.startsWith(p));
    cb(null, ok);
  },
});

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny' })
);

/* ────────────────────────────────────────────────────────── */
/* 4) routes                                                  */
/* ────────────────────────────────────────────────────────── */
const authRoutes           = require('./routes/authRoutes');
const customerRoutes       = require('./routes/customers');
const propertyRoutes       = require('./routes/propertyRoutes');
const friendRoutes         = require('./routes/friend');
const attendanceRoutes     = require('./routes/attendanceRoutes');
const subscriptionRoutes   = require('./routes/subscriptionRoutes');
const contactRoute         = require('./routes/contact');
const friendshipRoutes     = require('./routes/friendshipRoutes');
const friendsRoutes        = require('./routes/friendsRoutes');
const noteRoutes           = require('./routes/noteRoutes');
const scheduleRoutes       = require('./routes/scheduleRoutes');
const sharedLeadRoutes     = require('./routes/sharedLeadRoutes');
const addressRoutes        = require('./routes/addressRoutes');
const customerInviteRoutes = require('./routes/customerInviteRoutes');
const placesRouter         = require('./routes/places');
const adminRoutes          = require('./routes/adminRoutes');
const notificationRoutes   = require('./routes/notification');
const conversationRoutes   = require('./routes/conversationRoutes');

app.use('/api/auth',          authRoutes);
app.use('/api/customers',     customerRoutes);
app.use('/api/properties',    propertyRoutes);
app.use('/api/friends',       friendRoutes);        // be sure paths don't overlap
app.use('/api/attendance',    attendanceRoutes);
app.use('/api',               subscriptionRoutes);
app.use('/api/contact',       contactRoute);
app.use('/api/friends',       friendshipRoutes);
app.use('/api/friend',        friendsRoutes);
app.use('/api',               noteRoutes);
app.use('/api/schedules',     scheduleRoutes);
app.use('/api/shared-leads',  sharedLeadRoutes);
app.use('/api/address',       addressRoutes);
app.use('/api/CustomerInvites', customerInviteRoutes);
app.use('/api/places',        placesRouter);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/conversations', conversationRoutes);

/* example external data – nearby neighbourhoods */
app.get('/api/neighborhoods', async (req, res) => {
  const { latitude, longitude } = req.query;
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
                `?location=${latitude},${longitude}&radius=25000&type=neighborhood` +
                `&key=${process.env.GOOGLE_API_KEY}`;
    const { data } = await axios.get(url);
    res.json(data);
  } catch (err) {
    console.error('Error fetching neighborhoods:', err.message);
    res.status(500).json({ error: 'Failed to fetch neighborhoods' });
  }
});

/* upload helper */
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: publicUrl });
});

/* ────────────────────────────────────────────────────────── */
/* 5) Stripe checkout & webhook                               */
/* ────────────────────────────────────────────────────────── */
app.post('/api/create-checkout-session', async (req, res) => {
  const { quantity = 1, leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'Missing leadId' });

  const UNIT_AMOUNT = 1000 * 100; // 1000 PKR → paisa
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode       : 'payment',
      line_items : [{
        price_data: {
          currency    : 'pkr',
          product_data: { name: 'Broadcast Inquiry' },
          unit_amount : UNIT_AMOUNT,
        },
        quantity,
      }],
      success_url:
        `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}` +
        `&leadId=${encodeURIComponent(leadId)}`,
      cancel_url : `${process.env.CLIENT_URL}/cancel`,
      metadata   : { leadId, quantity: quantity.toString() },
    });

    // res.json({ sessionId: session.id });
     res.json({
     sessionId: session.id,   // existing field (kept for compatibility)
    url      : session.url   // <-- add this line
    });
  } catch (err) {
    console.error('Stripe error creating session:', err);
    res.status(500).json({ error: err.raw?.message || err.message });
  }
});

app.get('/api/verify-checkout-session', async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json({ id: session.id, status: session.payment_status, metadata: session.metadata });
  } catch (err) {
    console.error('Error retrieving session:', err);
    res.status(500).json({ error: err.message });
  }
});

/* raw body parser used here */
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const { leadId } = event.data.object.metadata || {};
    if (leadId) {
      axios.post(
        `${process.env.API_URL}/shared-leads/share-lead`,
        { leadId, shareWithAll: true },
        {
          headers: {
            Authorization: `Bearer ${process.env.WEBHOOK_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      ).catch(err => console.error('Error sharing lead via webhook:', err.response?.data || err.message));
    }
  }

  res.json({ received: true });
});

/* ────────────────────────────────────────────────────────── */
/* 6) health & start-up                                       */
/* ────────────────────────────────────────────────────────── */
app.get('/', (_req, res) => res.send('myredd backend running'));

const PORT        = process.env.PORT || 6003;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser   : true,
  useUnifiedTopology: true,
})
  .then(() => {
    server.listen(PORT, () => console.log(`🚀  API & Socket.io running on :${PORT}`));
  })
  .catch(err => console.error('Mongo connection error:', err));


// // index.js (fixed order – app declared before server)

// const express = require('express');
// const app = express();                 // ← declare app first

// const mongoose = require('mongoose');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const axios = require('axios');
// require('dotenv').config();
// const mongoSanitize = require('express-mongo-sanitize');
// const helmet = require('helmet');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// // HTTP + Socket.io wrapper (after app)
// const http   = require('http');
// const server = http.createServer(app);
// require('./sockets')(server);   


// // Route imports
// const authRoutes = require('./routes/authRoutes');
// const customerRoutes = require('./routes/customers');
// const propertyRoutes = require('./routes/propertyRoutes');
// const friendRoutes = require('./routes/friend');
// const attendanceRoutes = require('./routes/attendanceRoutes');
// const subscriptionRoutes = require('./routes/subscriptionRoutes');
// const contactRoute = require('./routes/contact');
// const friendshipRoutes = require('./routes/friendshipRoutes');
// const friendsRoutes = require('./routes/friendsRoutes');
// const noteRoutes = require('./routes/noteRoutes');
// const scheduleRoutes = require('./routes/scheduleRoutes');
// const sharedLeadRoutes = require('./routes/sharedLeadRoutes');
// const addressRoutes = require('./routes/addressRoutes');
// const customerInviteRoutes = require('./routes/customerInviteRoutes');
// const placesRouter = require('./routes/places');
// const adminRoutes = require('./routes/adminRoutes');
// const notificationRoutes = require('./routes/notification');
// const conversationRoutes  = require('./routes/conversationRoutes');

// const PORT = process.env.PORT || 6003;
// const MONGODB_URI = process.env.MONGODB_URI;

// // ===== 1) CORS =====
// app.use(cors({ origin: true, credentials: true }));

// // ===== 2) Body parsers =====
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // ===== 3) Block access to hidden files/dirs =====
// app.use((req, res, next) => {
//   if (req.path.match(/\/\.[^\/]+/)) return res.status(404).send('Not Found');
//   next();
// });

// // ===== 4) Security middle‑wares =====
// app.use(mongoSanitize());
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'"],
//         imgSrc: ["'self'", 'data:', 'http://localhost:5000'],
//         connectSrc: ["'self'", 'ws:', 'wss:'],
//         objectSrc: ["'none'"],
//       },
//     },
//     crossOriginResourcePolicy: { policy: 'cross-origin' },
//   })
// );

// // ===== 5) Static uploads directory =====
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, 'uploads/'),
//   filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
// });
// const upload = multer({ storage });
// app.use(
//   '/uploads',
//   express.static(path.join(__dirname, 'uploads'), { dotfiles: 'deny' })
// );

// // ===== 6) Routes =====
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
// app.use('/api/admin', adminRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/conversations',  conversationRoutes);

// // ===== Example neighborhoods endpoint =====
// app.get('/api/neighborhoods', async (req, res) => {
//   const { latitude, longitude } = req.query;
//   const apiKey = process.env.GOOGLE_API_KEY;
//   const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=25000&type=neighborhood&key=${apiKey}`;

//   try {
//     const { data } = await axios.get(url);
//     res.json(data);
//   } catch (err) {
//     console.error('Error fetching neighborhoods:', err.message);
//     res.status(500).json({ error: 'Failed to fetch neighborhoods' });
//   }
// });

// // ===== File upload endpoint =====
// app.post('/api/upload', upload.single('file'), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'No file received' });
//   const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
//   res.json({ url: publicUrl });
// });

// // ===== Raw body parser exception for Stripe webhooks =====
// app.use((req, res, next) => {
//   if (req.originalUrl === '/webhook') return next();
//   express.json()(req, res, next);
// });

// // ===== Stripe checkout session =====
// app.post('/create-checkout-session', async (req, res) => {
//   const { quantity = 1, leadId } = req.body;
//   if (!leadId) return res.status(400).json({ error: 'Missing leadId' });

//   const UNIT_AMOUNT = 1000 * 100; // 1000 PKR in paisa
//   try {
//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       mode: 'payment',
//       line_items: [
//         {
//           price_data: {
//             currency: 'pkr',
//             product_data: { name: 'Broadcast Inquiry' },
//             unit_amount: UNIT_AMOUNT,
//           },
//           quantity,
//         },
//       ],
//       success_url:
//         `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}` +
//         `&leadId=${encodeURIComponent(leadId)}`,
//       cancel_url: `${process.env.CLIENT_URL}/cancel`,
//       metadata: { leadId, quantity: quantity.toString() },
//     });

//     res.json({ sessionId: session.id });
//   } catch (err) {
//     console.error('Stripe error creating session:', err);
//     res.status(500).json({ error: err.raw?.message || err.message });
//   }
// });

// // ===== Verify session endpoint =====
// app.get('/verify-checkout-session', async (req, res) => {
//   const { sessionId } = req.query;
//   if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

//   try {
//     const session = await stripe.checkout.sessions.retrieve(sessionId);
//     res.json({ id: session.id, status: session.payment_status, metadata: session.metadata });
//   } catch (err) {
//     console.error('Error retrieving session:', err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== Stripe webhook handler =====
// app.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// function handleStripeWebhook(req, res) {
//   const sig = req.headers['stripe-signature'];
//   let event;
//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error('Webhook signature failed:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     const session = event.data.object;
//     const leadId = session.metadata?.leadId;

//     if (leadId) {
//       axios
//         .post(
//           `${process.env.API_URL}/shared-leads/share-lead`,
//           { leadId, shareWithAll: true },
//           {
//             headers: {
//               Authorization: `Bearer ${process.env.WEBHOOK_API_TOKEN}`,
//               'Content-Type': 'application/json',
//             },
//           }
//         )
//         .catch((err) => console.error('Error sharing lead via webhook:', err.response?.data || err.message));
//     }
//   }

//   res.json({ received: true });
// }

// // ===== Connect to MongoDB & start server =====
// mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => {
//     server.listen(PORT, () => console.log(`🚀  API + Socket.io on :${PORT}`));
//   })
//   .catch(err => console.error('Mongo connection error:', err));

// // ===== Root health check =====
// app.get('/', (req, res) => res.send('myredd backend running'));



// // // // index.js
// // const express = require('express');
// // const mongoose = require('mongoose');
// // const cors = require('cors');
// // const http = require('http');
// // const socketIo = require('socket.io');
// // const multer = require('multer');
// // const path = require('path');
// // const axios = require('axios');
// // require('dotenv').config();
// // const mongoSanitize = require('express-mongo-sanitize');
// // const helmet = require('helmet');
// // require('dotenv').config();
// // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// // // Route imports
// // const authRoutes = require('./routes/authRoutes');
// // const customerRoutes = require('./routes/customers');
// // const propertyRoutes = require('./routes/propertyRoutes');
// // const friendRoutes = require('./routes/friend');
// // const chatRoutes = require('./routes/chatRoutes');
// // const attendanceRoutes = require('./routes/attendanceRoutes');
// // const subscriptionRoutes = require('./routes/subscriptionRoutes');
// // const contactRoute = require('./routes/contact');
// // const friendshipRoutes = require('./routes/friendshipRoutes');
// // const friendsRoutes = require('./routes/friendsRoutes');
// // const noteRoutes = require('./routes/noteRoutes');
// // const scheduleRoutes = require('./routes/scheduleRoutes');
// // const sharedLeadRoutes = require('./routes/sharedLeadRoutes');
// // const addressRoutes = require('./routes/addressRoutes');
// // const customerInviteRoutes = require('./routes/customerInviteRoutes');
// // const placesRouter = require('./routes/places');
// // const adminRoutes = require('./routes/adminRoutes');  
// // const notificationRoutes = require('./routes/notification');


// // const app = express();
// // const server = http.createServer(app);

// // const PORT = process.env.PORT || 6003;
// // const MONGODB_URI = process.env.MONGODB_URI;

// // // ====== 1) Refined CORS Configuration ======
// // app.use(cors({
// //   origin: true,
// //   credentials: true
// // }));


// // // ====== 2) Parse Request Bodies ======
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));
// // // (bodyParser.json() is redundant with express.json() and has been removed)

// // // ====== 3) Block Access to Hidden Files/Directories ======
// // // This middleware denies access to any route that includes a "/." (e.g., .hg, .git)
// // app.use((req, res, next) => {
// //   if (req.path.match(/\/\.[^\/]+/)) {
// //     return res.status(404).send('Not Found');
// //   }
// //   next();
// // });

// // // ====== 4) Mongo Sanitize & Helmet (with updated CSP, frameguard, nosniff) ======
// // app.use(mongoSanitize());

// // // Configure Helmet to address reported issues:
// // // Simplified Helmet configuration
// // app.use(helmet({
// //   contentSecurityPolicy: {
// //       directives: {
// //           defaultSrc: ["'self'"],
// //           scriptSrc: ["'self'"],
// //           styleSrc: ["'self'", "'unsafe-inline'"],
// //           // imgSrc: ["'self'", "data:", "blob:"],
// //           imgSrc: ["'self'", "data:", "http://localhost:5000"],
// //           connectSrc: ["'self'", "ws:", "wss:"],
// //           objectSrc: ["'none'"],
// //       },
// //   },
// //   crossOriginResourcePolicy: { policy: "cross-origin" },
// // }));

// // // app.use(helmet({
// // //   contentSecurityPolicy: {
// // //     directives: {
// // //       defaultSrc: ["'self'", "http://195.179.231.102"],
// // //       scriptSrc: ["'self'", "http://195.179.231.102"],
// // //       styleSrc: ["'self'", "'unsafe-inline'", "http://195.179.231.102"],
// // //       imgSrc: ["'self'", "data:"],
// // //       connectSrc: ["'self'", "http://195.179.231.102", "ws:", "wss:"],
// // //       objectSrc: ["'none'"],
// // //     },
// // //   },
// // //   crossOriginResourcePolicy: { policy: "cross-origin" },
// // // }));

// // // ====== 5) Static Uploads Directory ======
// // const storage = multer.diskStorage({
// //   destination: function (req, file, cb) {
// //     cb(null, 'uploads/');
// //   },
// //   filename: function (req, file, cb) {
// //     cb(null, Date.now() + path.extname(file.originalname));
// //   }
// // });
// // const upload = multer({ storage: storage });
// // app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
// //   dotfiles: 'deny', // Ensure that dotfiles (e.g., .hg) are not served from the uploads directory
// // }));

// // // ====== 6) Route Setup ======
// // app.use('/api/auth', authRoutes);
// // app.use('/api/customers', customerRoutes);
// // app.use('/api/properties', propertyRoutes);
// // app.use('/api/friends', friendRoutes);
// // app.use('/api/attendance', attendanceRoutes);
// // app.use('/api', subscriptionRoutes);
// // app.use('/api/contact', contactRoute);
// // app.use('/api/friends', friendshipRoutes);
// // app.use('/api/friend', friendsRoutes);
// // app.use('/api', noteRoutes);
// // app.use('/api/schedules', scheduleRoutes);
// // app.use('/api/shared-leads', sharedLeadRoutes);
// // app.use('/api/address', addressRoutes);
// // app.use('/api/CustomerInvites', customerInviteRoutes);
// // app.use('/api/places', placesRouter);
// // app.use('/api/admin', adminRoutes);
// // app.use('/api/notifications', notificationRoutes);



// // // Example route for neighborhoods (Google Maps API)
// // app.get('/api/neighborhoods', async (req, res) => {
// //   const { latitude, longitude } = req.query;
// //   const apiKey = process.env.GOOGLE_API_KEY;

// //   console.log('Received request to /api/neighborhoods');
// //   console.log(`Query parameters - Latitude: ${latitude}, Longitude: ${longitude}`);

// //   const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=25000&type=neighborhood&key=${apiKey}`;
// //   console.log(`Constructed URL: ${url}`);

// //   try {
// //     console.log('Fetching data from Google Maps API...');
// //     const response = await axios.get(url);
// //     console.log('Response received from API');
// //     const data = response.data;
// //     console.log('Data successfully parsed from API response');

// //     res.json(data);
// //     console.log('Response sent to client');
// //   } catch (error) {
// //     console.error('Error fetching neighborhoods:', error.message);
// //     console.error('Error stack:', error.stack);
// //     res.status(500).json({ error: 'Failed to fetch neighborhoods' });
// //   }
// // });

// // // File upload route example
// // app.post('/api/upload', upload.single('file'), (req, res) => {
// //   if (!req.file) {
// //     return res.status(400).json({ error: 'No file received' });
// //   }
// //   // Construct a public URL
// //   const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
// //   return res.json({ url: publicUrl });
// // });


// // // Use JSON parser except for webhooks
// // app.use((req, res, next) => {
// //   if (req.originalUrl === '/webhook') return next();
// //   express.json()(req, res, next);
// // });

// // // 1) Create Checkout Session
// // app.post('/create-checkout-session', async (req, res) => {
// //   const { quantity = 1, leadId } = req.body;
// //   if (!leadId) {
// //     return res.status(400).json({ error: 'Missing leadId' });
// //   }

// //   const UNIT_AMOUNT = 1000 * 100;  // 1000 PKR in paisa
// //   try {
// //     const session = await stripe.checkout.sessions.create({
// //       payment_method_types: ['card'],
// //       mode: 'payment',
// //       line_items: [{
// //         price_data: {
// //           currency: 'pkr',
// //           product_data: { name: 'Broadcast Inquiry' },
// //           unit_amount: UNIT_AMOUNT,
// //         },
// //         quantity,
// //       }],
// //       // embed leadId in your success URL
// //       success_url: `${process.env.CLIENT_URL}/success` +
// //                    `?session_id={CHECKOUT_SESSION_ID}` +
// //                    `&leadId=${encodeURIComponent(leadId)}`,
// //       cancel_url: `${process.env.CLIENT_URL}/cancel`,
// //       metadata: { leadId, quantity: quantity.toString() },
// //     });

// //     console.log(`→ Created Stripe session ${session.id} for lead ${leadId}`);
// //     res.json({ sessionId: session.id });
// //   } catch (err) {
// //     console.error('Stripe error creating session:', err);
// //     res.status(500).json({ error: err.raw?.message || err.message });
// //   }
// // });

// // // 2) Verify endpoint (if you still need it)
// // app.get('/verify-checkout-session', async (req, res) => {
// //   const { sessionId } = req.query;
// //   if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

// //   try {
// //     const session = await stripe.checkout.sessions.retrieve(sessionId);
// //     res.json({
// //       id: session.id,
// //       status: session.payment_status,
// //       metadata: session.metadata,
// //     });
// //   } catch (err) {
// //     console.error('Error retrieving session:', err);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // 3) Webhook handler
// // async function handleStripeWebhook(req, res) {
// //   const sig = req.headers['stripe-signature'];
// //   let event;

// //   try {
// //     event = stripe.webhooks.constructEvent(
// //       req.body,
// //       sig,
// //       process.env.STRIPE_WEBHOOK_SECRET
// //     );
// //   } catch (err) {
// //     console.error('🚨 Webhook signature failed:', err.message);
// //     return res.status(400).send(`Webhook Error: ${err.message}`);
// //   }

// //   if (event.type === 'checkout.session.completed') {
// //     const session = event.data.object;
// //     const leadId  = session.metadata?.leadId;

// //     console.log(`✅ Payment succeeded for session ${session.id}, leadId=${leadId}`);

// //     if (leadId) {
// //       try {
// //         // Call your share‑lead endpoint to broadcast to all users
// //         await axios.post(
// //           `${process.env.API_URL}/shared-leads/share-lead`,
// //           { leadId, shareWithAll: true },
// //           {
// //             headers: {
// //               Authorization: `Bearer ${process.env.WEBHOOK_API_TOKEN}`,
// //               'Content-Type': 'application/json'
// //             }
// //           }
// //         );
// //         console.log(`→ Lead ${leadId} shared with all via webhook`);
// //       } catch (shareErr) {
// //         console.error('❌ Error sharing lead via webhook:', shareErr.response?.data || shareErr.message);
// //       }
// //     }
// //   }

// //   // Return 2xx to acknowledge receipt
// //   res.json({ received: true });
// // }

// // // ====== 7) Connect to MongoDB & Start the Server ======
// // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// //   .then(() => {
// //     console.log('Connected to MongoDB Atlas');
// //     server.listen(PORT, () => {
// //       console.log(`Server is running on ${PORT}`);
// //     });

// // //     // ====== 8) Socket.io Setup ======
// // //     const io = socketIo(server, {
// // //       cors: {
// // //         origin: 'http://195.179.231.102', // Restrict socket.io connections to the allowed front-end
// // //         methods: ["GET", "POST"],
// // //         credentials: true,
// // //       }
// // //     });

// // //     // Initialize chat routes with the socket.io instance
// // //     app.use('/api/messages', chatRoutes(io));

// // //     // Socket.io event handling
// // //     io.on('connection', (socket) => {
// // //       console.log('New client connected');

// // //       socket.on('joinChat', (chatId) => {
// // //         socket.join(chatId);
// // //         console.log(`User joined chat: ${chatId}`);
// // //       });

// // //       socket.on('newMessage', (message) => {
// // //         io.to(message.chatId).emit('message', message);
// // //         console.log('Message sent to room:', message);
// // //       });

// // //       socket.on('disconnect', () => {
// // //         console.log('Client disconnected');
// // //       });
// // //     });
// // //   })
// // //   .catch((error) => {
// // //     console.error('Error connecting to MongoDB Atlas:', error);
// // //   });

// // // // ====== 9) Global Error Handling Middleware ======
// // // app.use((err, req, res, next) => {
// // //   console.error(err.stack);
// // //   // In production, consider logging the error to a file or external logging service
// // //   res.status(500).json({ error: 'Internal server error' });
// // // 
// // });


// // app.get('/', (req, res) => {
// //   res.send('myredd backed running');
// // });



// // // // index.js
// // // const express = require('express');
// // // const mongoose = require('mongoose');
// // // const bodyParser = require('body-parser');
// // // const cors = require('cors');
// // // const http = require('http');
// // // const socketIo = require('socket.io');
// // // const multer = require('multer');
// // // const path = require('path');
// // // const axios = require('axios');
// // // require('dotenv').config();
// // // const mongoSanitize = require('express-mongo-sanitize');
// // // const helmet = require('helmet');

// // // // Route imports
// // // const authRoutes = require('./routes/authRoutes');
// // // const customerRoutes = require('./routes/customers');
// // // const propertyRoutes = require('./routes/propertyRoutes');
// // // const friendRoutes = require('./routes/friend');
// // // const chatRoutes = require('./routes/chatRoutes');
// // // const attendanceRoutes = require('./routes/attendanceRoutes');
// // // const subscriptionRoutes = require('./routes/subscriptionRoutes');
// // // const contactRoute = require('./routes/contact');
// // // const friendshipRoutes = require('./routes/friendshipRoutes');
// // // const friendsRoutes = require('./routes/friendsRoutes');
// // // const noteRoutes = require('./routes/noteRoutes');
// // // const scheduleRoutes = require('./routes/scheduleRoutes');
// // // const sharedLeadRoutes = require('./routes/sharedLeadRoutes');
// // // const addressRoutes = require('./routes/addressRoutes'); // New address routes
// // // const customerInviteRoutes = require('./routes/customerInviteRoutes');
// // // const placesRouter = require('./routes/places');  

// // // const app = express();
// // // const server = http.createServer(app);

// // // const PORT = process.env.PORT || 6003;
// // // const MONGODB_URI = process.env.MONGODB_URI;



// // // app.use(cors({
// // //   origin: '*',
// // //   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
// // //   allowedHeaders: ['Content-Type', 'Authorization'],
// // //   credentials: true,
// // // }));

// // // app.use(express.json());
// // // app.use(express.urlencoded({ extended: true }));

// // // app.use(bodyParser.json());
// // // app.use(express.json());

// // // app.use(mongoSanitize());

// // // app.use(helmet());
// // // // Static uploads directory
// // // const storage = multer.diskStorage({
// // //   destination: function (req, file, cb) {
// // //     cb(null, 'uploads/');
// // //   },
// // //   filename: function (req, file, cb) {
// // //     cb(null, Date.now() + path.extname(file.originalname));
// // //   }
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
// // // app.use('/api/contact', contactRoute);
// // // app.use('/api/friends', friendshipRoutes);
// // // app.use('/api/friend', friendsRoutes);
// // // app.use('/api', noteRoutes);
// // // app.use('/api/schedules', scheduleRoutes);
// // // app.use('/api/shared-leads', sharedLeadRoutes);
// // // app.use('/api/address', addressRoutes);
// // // app.use('/api/CustomerInvites', customerInviteRoutes);
// // // app.use('/api/places', placesRouter);

// // // app.get('/api/neighborhoods', async (req, res) => {
// // //   const { latitude, longitude } = req.query;
// // //   const apiKey = process.env.GOOGLE_API_KEY;

// // //   console.log('Received request to /api/neighborhoods');
// // //   console.log(`Query parameters - Latitude: ${latitude}, Longitude: ${longitude}`);

// // //   const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=25000&type=neighborhood&key=${apiKey}`;
// // //   console.log(`Constructed URL: ${url}`);

// // //   try {
// // //     console.log('Fetching data from Google Maps API...');
// // //     const response = await axios.get(url);
// // //     console.log('Response received from API');
// // //     const data = response.data;
// // //     console.log('Data successfully parsed from API response');

// // //     res.json(data);
// // //     console.log('Response sent to client');
// // //   } catch (error) {
// // //     console.error('Error fetching neighborhoods:', error.message);
// // //     console.error('Error stack:', error.stack);
// // //     res.status(500).json({ error: 'Failed to fetch neighborhoods' });
// // //   }
// // // });



// // // app.post('/api/upload', upload.single('file'), (req, res) => {
// // //   if (!req.file) {
// // //     return res.status(400).json({ error: 'No file received' });
// // //   }
// // //   // Construct a public URL assuming you serve the uploads folder statically
// // //   const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
// // //   return res.json({ url: publicUrl });
// // // });

// // // // Serve static files from uploads folder
// // // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // // // Connect to MongoDB
// // // mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
// // //   .then(() => {
// // //     console.log('Connected to MongoDB Atlas');
// // //     server.listen(PORT, () => {
// // //       console.log(`Server is running on http://localhost:${PORT}`);
// // //     });

// // //     const io = socketIo(server, {
// // //       cors: {
// // //         origin: '*',
// // //         methods: ["GET", "POST"],
// // //         credentials: true,
// // //       }
// // //     });

// // //     // Initialize chat routes with the socket.io instance passed
// // //     app.use('/api/messages', chatRoutes(io));

// // //     // Socket.io event handling
// // //     io.on('connection', (socket) => {
// // //       console.log('New client connected');

// // //       socket.on('joinChat', (chatId) => {
// // //         socket.join(chatId);
// // //         console.log(`User joined chat: ${chatId}`);
// // //       });

// // //       socket.on('newMessage', (message) => {
// // //         io.to(message.chatId).emit('message', message);
// // //         console.log('Message sent to room:', message);
// // //       });

// // //       socket.on('disconnect', () => {
// // //         console.log('Client disconnected');
// // //       });
// // //     });
// // //   })
// // //   .catch((error) => {
// // //     console.error('Error connecting to MongoDB Atlas:', error);
// // //   });

// // // // Error handling middleware
// // // app.use((err, req, res, next) => {
// // //   console.error(err.stack);
// // //   res.status(500).json({ error: 'Internal server error' });
// // // });


