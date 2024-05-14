// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const friendRequestSchema = new Schema({
//     requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     requested: { type: Schema.Types.ObjectId, ref: 'User', required: true }
// });

// module.exports = mongoose.model('FriendRequest', friendRequestSchema);


const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const friendRequestSchema = new Schema({
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requested: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    requesterFirstName: { type: String,ref: 'User', required: true },
    requesterLastName: { type: String,ref: 'User', required: true },
    requestedFirstName: { type: String,ref: 'User', required: true },
    requestedLastName: { type: String,ref: 'User', required: true }
});

module.exports = mongoose.model('FriendRequest', friendRequestSchema);

