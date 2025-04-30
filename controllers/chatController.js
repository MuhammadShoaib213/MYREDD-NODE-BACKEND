const Message = require('../models/Message');

/* GET /chat/history/:friendId  (all msgs between auth user and friend) */
exports.getHistory = async (req, res) => {
  const { friendId } = req.params;
  const userId       = req.user.id;
  const msgs = await Message.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId }
    ]
  }).sort('createdAt');
  res.json(msgs);
};