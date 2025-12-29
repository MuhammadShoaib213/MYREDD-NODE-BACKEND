const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Friends      = require('../models/Friends');
const { authenticateToken } = require('../middleware/verifyToken');

/* ───────── get all conversations ───────── */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    /* gather accepted friends */
    const out  = await Friends.find({ requester: userId,  status: 'accepted' }).distinct('recipient');
    const inc  = await Friends.find({ recipient: userId,  status: 'accepted' }).distinct('requester');
    const friendIds = [...new Set([...out, ...inc])];

    const convos = await Conversation.find({
      participants: userId,
    }).populate('participants', 'firstName lastName profilePicture');

    const payload = convos.map(c => {
      const other = c.participants.find(p => p._id.toString() !== userId);
      return {
        _id          : c._id,
        name         : other ? `${other.firstName} ${other.lastName}` : 'Unknown',
        profilePicture: other?.profilePicture,
        lastMessage  : c.lastMessage,
        updatedAt    : c.updatedAt,
      };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────── messages in a conversation ───────── */
router.get('/messages/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation' });
    }

    const convo = await Conversation.findById(conversationId).select('participants');
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = convo.participants.some(p => p.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const msgs = await Message.find({ conversationId })
      .sort({ createdAt: 1 })                         // oldest-first
      .populate('senderId', 'firstName lastName profilePicture');

    /* normalise: every item has senderId (primitive) for frontend */
    const payload = msgs.map(m => ({
      ...m.toObject(),
      senderId: m.senderId._id,
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/* ───────── create-or-fetch conversation (debug + fixed) ───────── */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId   = req.user.id;
    const { friendId } = req.body;

    console.log('➊  hit POST /conversations');
    console.log('    ↳ userId   :', userId);
    console.log('    ↳ friendId :', friendId);

    if (!friendId || friendId === userId) {
      console.warn('⚠️  invalid friendId — aborting');
      return res.status(400).json({ error: 'Invalid friendId' });
    }

    /* ✅ MUST use `new` with mongoose 8 */
    const meObj     = new mongoose.Types.ObjectId(userId);
    const friendObj = new mongoose.Types.ObjectId(friendId);
    console.log('➋  ObjectId versions:', { meObj, friendObj });

    const participantsSorted = [meObj, friendObj].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );
    console.log('➌  sorted array for query/insert:', participantsSorted);

    /* atomic upsert */
    const convo = await Conversation.findOneAndUpdate(
      { participants: participantsSorted },
      { $setOnInsert: { participants: participantsSorted } },
      { new: true, upsert: true }
    );

    console.log('➍  upsert result:', convo);
    res.json(convo);
  } catch (err) {
    console.error('❌  create/fetch convo error:', err);
    res.status(500).json({ error: err.message });
  }
});


/* ───────── send a message (REST fallback) ───────── */
router.post('/:conversationId/messages', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId  = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation' });
    }

    const convo = await Conversation.findById(conversationId).select('participants');
    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = convo.participants.some(p => p.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const msg = await Message.create({
      conversationId,
      senderId: userId,
      text,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      updatedAt  : new Date(),
    });

    /* emit in real-time for on-line users */
    req.io.to(conversationId).emit('message', msg);

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
