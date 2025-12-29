// sockets/index.js
const jwt          = require('jsonwebtoken');
const mongoose     = require('mongoose');
const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Friends      = require('../models/Friends');
const Notification = require('../models/Notification');
const User         = require('../models/User');       // to fetch sender name

let io;                                               // exported later

module.exports = function attachSocket(server) {
  io = require('socket.io')(server, {
    cors: {
      origin      : process.env.CLIENT_URL,
      methods     : ['GET', 'POST'],
      credentials : true,
    },
  });

  /* ───── JWT guard ───── */
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      socket.user = { id: decoded.id || decoded.userId || decoded._id };
      next();
    });
  });

  /* ───── on connect ───── */
  io.on('connection', async socket => {
  const userId = socket.user?.id;
  
  if (!userId) {
    socket.emit('error', { message: 'Invalid authentication' });
    socket.disconnect(true);
    return;
  }

  try {
    // Join rooms with error handling
    const rooms = await Conversation.find({ participants: userId }).select('_id').lean();
    rooms.forEach(r => socket.join(r._id.toString()));
    socket.join(userId);
  } catch (error) {
    console.error('Error setting up socket rooms:', error);
    socket.emit('error', { message: 'Failed to initialize connection' });
  }

  socket.on('message', async ({ conversationId, text, attachments }) => {
    try {
      if (!text && !attachments?.length) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      // Validate conversationId format
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        socket.emit('error', { message: 'Invalid conversation' });
        return;
      }

      const convo = await Conversation.findById(conversationId);
      const isParticipant = convo?.participants.some(p => p.toString() === userId);
      
      if (!isParticipant) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // ... rest of message handling
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', userId);
  });
});

  /* ───── optional redis adapter ───── */
  if (process.env.REDIS_URL) {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const { createClient }  = require('ioredis');
    const pub = createClient({ url: process.env.REDIS_URL });
    const sub = pub.duplicate();
    Promise.all([pub.connect(), sub.connect()]).then(() => {
      io.adapter(createAdapter(pub, sub));
      console.log('Socket.io redis adapter ready');
    });
  }

  return io;
};

module.exports.io = () => io;
