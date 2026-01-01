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
const { 
    errorHandler, 
    notFoundHandler, 
    correlationIdMiddleware 
  } = require('./middleware/errorHandler');
const { limiter } = require('./middleware/rateLimiter');

/* ────────────────────────────────────────────────────────── */
/* 1) core app + socket.io                                    */
/* ────────────────────────────────────────────────────────── */
const app    = express();          // declare app **before** server
app.set('trust proxy', 1);
const server = http.createServer(app);
const io     = require('./sockets')(server);   // returns shared instance
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'OTP_SMTP_USER',
  'OTP_SMTP_PASS',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

// Validate JWT_SECRET is not the default
if (process.env.JWT_SECRET === 'SECRET_KEY' || process.env.JWT_SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET must be at least 32 characters and not the default value');
  process.exit(1);
}

console.log('✅ Environment validation passed');


app.use(correlationIdMiddleware);
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
const normalizeOrigin = (value) => value.replace(/\/+$/, '');
const corsOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map(v => normalizeOrigin(v.trim()))
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const normalizedOrigin = normalizeOrigin(origin);
    if (corsOrigins.length === 0) return cb(new Error('CORS not configured'));
    if (corsOrigins.includes(normalizedOrigin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
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

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/properties',    propertyRoutes);
app.use('/api/friends',       friendRoutes);        // be sure paths don't overlap
app.use('/api/attendance',    attendanceRoutes);
app.use('/api',               subscriptionRoutes);
app.use('/api/contact',       contactRoute);
// app.use('/api/friends',       friendshipRoutes);
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
app.post('/api/upload', limiter, upload.single('file'), (req, res) => {
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

app.use(notFoundHandler);
app.use(errorHandler);

const PORT        = process.env.PORT || 6003;
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('FATAL: MONGODB_URI is not defined');
    process.exit(1);
  }

  const options = {
    maxPoolSize: 50, // Support for 1000 concurrent users
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  // Connection event handlers
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Attempting reconnect...');
  });

  // Handle process termination
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });

  try {
    await mongoose.connect(MONGODB_URI, options);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
};

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 API & Socket.io running on :${PORT}`);
  });
});
