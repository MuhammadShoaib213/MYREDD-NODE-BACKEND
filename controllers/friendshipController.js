const Friendship = require('../models/Friendship');

exports.sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;  // Assuming req.user is populated by auth middleware

    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingFriendship) {
      return res.status(409).json({ message: 'Friend request already sent or friendship exists.' });
    }

    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId
    });

    await friendship.save();
    res.status(201).json(friendship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.body; // You might use params instead
    const friendship = await Friendship.findByIdAndUpdate(
      friendshipId,
      { status: 'accepted', updated_at: new Date() },
      { new: true }
    );

    if (!friendship) {
      return res.status(404).json({ message: 'Friend request not found.' });
    }

    res.json(friendship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Additional methods for decline, block, list friends etc.
