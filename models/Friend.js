// // models/Friend.js
// const mongoose = require('mongoose');

// const friendSchema = new mongoose.Schema({
//     users: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     }],
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('Friend', friendSchema);

const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    users: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Friend', friendSchema);
