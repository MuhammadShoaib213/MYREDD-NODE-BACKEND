const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken');
const InviteToken = require('../models/InviteToken');
const { asyncHandler } = require('../middleware/errorHandler');

// Route to create an invite token
router.post('/create-invite-token', authenticateToken, asyncHandler(async (req, res) => {
  const { inviteToken } = req.body;
  const inviterId = req.user.id || req.user._id;

  try {
    const newInviteToken = new InviteToken({
      inviter: inviterId,
      token: inviteToken,
    });
    await newInviteToken.save();
    res.status(201).json({ message: 'Invite token created successfully' });
  } catch (error) {
    console.error('Error creating invite token:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}));

module.exports = router;
