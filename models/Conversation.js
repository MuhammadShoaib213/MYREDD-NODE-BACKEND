// models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required: true,
      },
    ],

    /* The last message text – keep as plain string for sidebar preview.
       You can always populate the full message separately. */
    lastMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

/* ────────────────────────────────────────────── */
/* Helpers & indexes                              */
/* ────────────────────────────────────────────── */

/* 1️⃣  Always store participant IDs in ascending order
       so [A,B] and [B,A] yield the *same* document/key. */
conversationSchema.pre('validate', function (next) {
  if (Array.isArray(this.participants)) {
    this.participants = this.participants
      .map(id => id.toString())
      .sort()                          // alphabetical ObjectId order
      .map(id => mongoose.Types.ObjectId(id));
  }
  next();
});

/* 2️⃣  Require at least two distinct participants */
conversationSchema.path('participants').validate(function (arr) {
  return Array.isArray(arr) && new Set(arr.map(String)).size >= 2;
}, 'Conversation must have at least two different participants.');

/* 3️⃣  One unique conversation per unordered pair (or group) */
conversationSchema.index(
  { participants: 1 },
  { unique: true }                    // prevents duplicate documents
);

/* 4️⃣  Sidebar sorting index */
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
