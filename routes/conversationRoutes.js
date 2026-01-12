const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Friends = require('../models/Friends');
const { authenticateToken } = require('../middleware/verifyToken');
const { asyncHandler, errors } = require('../middleware/errorHandler');
const { buildAssetUrl } = require('../utils/urlUtils');

/* get all conversations */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  /* gather accepted friends (unused for now, kept for future filtering) */
  const out = await Friends.find({ requester: userId, status: 'accepted' }).distinct('recipient');
  const inc = await Friends.find({ recipient: userId, status: 'accepted' }).distinct('requester');
  const friendIds = [...new Set([...out, ...inc])];
  void friendIds;

  const convos = await Conversation.find({
    participants: userId,
  })
    .sort({ updatedAt: -1 })
    .populate('participants', 'firstName lastName profilePicture');

  const payload = convos.map((c) => {
    const other = c.participants.find((p) => p._id.toString() !== userId);
    return {
      _id: c._id,
      name: other ? `${other.firstName} ${other.lastName}` : 'Unknown',
      profilePicture: buildAssetUrl(req, other?.profilePicture),
      lastMessage: c.lastMessage,
      lastMessageAt: c.updatedAt,
    };
  });

  res.json(payload);
}));

/* messages in a conversation */
router.get('/messages/:conversationId', authenticateToken, asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw errors.badRequest('Invalid conversation', 'INVALID_CONVERSATION');
  }

  const convo = await Conversation.findById(conversationId).select('participants');
  if (!convo) {
    throw errors.notFound('Conversation');
  }

  const isParticipant = convo.participants.some((p) => p.toString() === userId);
  if (!isParticipant) {
    throw errors.forbidden('Access denied', 'FORBIDDEN');
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limitRaw = parseInt(req.query.limit, 10) || 50;
  const limit = Math.min(Math.max(limitRaw, 1), 50);
  const skip = (page - 1) * limit;

  const msgs = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'firstName lastName profilePicture');

  /* normalize: every item has senderId (primitive) for frontend */
  const payload = msgs
    .map((m) => ({
      ...m.toObject(),
      senderId: m.senderId?._id ?? m.senderId,
    }))
    .reverse();

  res.json(payload);
}));

/* create-or-fetch conversation */
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;

  if (!friendId || friendId === userId) {
    throw errors.badRequest('Invalid friendId', 'INVALID_FRIEND_ID');
  }

  /* MUST use `new` with mongoose 8 */
  const meObj = new mongoose.Types.ObjectId(userId);
  const friendObj = new mongoose.Types.ObjectId(friendId);

  const participantsSorted = [meObj, friendObj].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );
  const participantsKey = participantsSorted.map((p) => p.toString()).join('_');

  let convo = await Conversation.findOne({ participantsKey });

  if (!convo) {
    convo = await Conversation.findOne({
      participants: { $all: [meObj, friendObj] },
      'participants.2': { $exists: false },
    });

    if (convo && !convo.participantsKey) {
      convo.participantsKey = participantsKey;
      await convo.save();
    }
  }

  if (!convo) {
    /* atomic upsert */
    convo = await Conversation.findOneAndUpdate(
      { participantsKey },
      { $setOnInsert: { participants: participantsSorted, participantsKey } },
      { new: true, upsert: true }
    );
  }

  res.json(convo);
}));

/* send a message (REST fallback) */
router.post('/:conversationId/messages', authenticateToken, asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw errors.badRequest('Invalid conversation', 'INVALID_CONVERSATION');
  }

  const convo = await Conversation.findById(conversationId).select('participants');
  if (!convo) {
    throw errors.notFound('Conversation');
  }

  const isParticipant = convo.participants.some((p) => p.toString() === userId);
  if (!isParticipant) {
    throw errors.forbidden('Access denied', 'FORBIDDEN');
  }

  const msg = await Message.create({
    conversationId,
    senderId: userId,
    text,
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: text,
    updatedAt: new Date(),
  });

  /* emit in real-time for on-line users */
  req.io.to(conversationId).emit('message', msg);

  res.json(msg);
}));

module.exports = router;
