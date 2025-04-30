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
    const userId = socket.user.id;

    /* join rooms of every conversation we’re part of */
    const rooms = await Conversation.find({ participants: userId }).select('_id');
    rooms.forEach(r => socket.join(r._id.toString()));

    /* join personal room for notifications */
    socket.join(userId);

    /* ───── MESSAGE in / out (single event name) ───── */
    socket.on('message', async ({ conversationId, text, attachments }) => {
      if (!text && !attachments?.length) return;

      const convo = await Conversation.findById(conversationId);
      const isParticipant = convo?.participants.some(p => p.toString() === userId);
      if (!isParticipant) return;

      const msg = await Message.create({
        conversationId,
        senderId   : userId,
        text,
        attachments,
      });

      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: text ?? '[attachment]',
        updatedAt  : msg.createdAt,
      });

      /* 1) Emit new chat message to conversation room */
      io.to(conversationId).emit('message', msg);

      /* 2) Create + emit notifications to all other participants */
      const otherIds = convo.participants
        .filter(p => p.toString() !== userId);

      if (otherIds.length) {
                const sender = await User.findById(userId).select('firstName lastName');
        
                const notifs = await Notification.insertMany(
                otherIds.map(id => ({
                    userId : id,
                    message: `You have received a new message from ${sender.firstName} ${sender.lastName}`,
                  }))
                );

        /* push in real-time */
        notifs.forEach(n => io.to(n.userId.toString()).emit('notification', n));
      }
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', userId);
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
