const mongoose = require('mongoose');

const sharedLeadSchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true }, // Reference to the lead in the property schema
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ID of the user sharing the lead
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], // Array of IDs of the users receiving the lead
    sharedByName: { type: String, required: true }, // Name of the person sharing
    sharedWithName: [{ type: String, required: true }], // Array of names of the receivers
    sharedAt: { type: Date, default: Date.now }, // Timestamp of when the lead was shared
    status: { type: String, default: 'Pending' } // Status of the shared lead (optional)
});

const SharedLead = mongoose.model('SharedLead', sharedLeadSchema);

module.exports = SharedLead;