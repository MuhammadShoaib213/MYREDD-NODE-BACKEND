const express = require('express');
const protect = require('../middleware/verifyToken');           // your JWT middleware
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Friends = require('../models/Friends');

const router = express.Router();

/* GET  /api/conversations            → friend-only conversations */
router.get('/', protect, async (req, res) => {
  const userId = req.user.id;

  // 1) all accepted friend IDs
  const friendIds = await Friends.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    })
    .distinct('requester recipient');

  // 2) conversations whose *every* participant is either me or a friend
  const conv = await Conversation.find({
      participants: { $all: [userId], $in: friendIds },
    })
    .sort({ updatedAt: -1 });

  res.json(conv);
});

/* GET  /api/messages/:conversationId → paginated messages */
router.get('/messages/:conversationId', protect, async (req, res) => {
  const PAGE_SIZE = 30;
  const { conversationId } = req.params;
  const { page = 1 } = req.query;

  const msgs = await Message.find({ conversationId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE);

  res.json(msgs.reverse()); // latest last
});

module.exports = router;
