const SharedLead = require('../models/SharedLead');
const User = require('../models/User');

exports.shareLead = async (req, res) => {
    const { leadId, friendIds, shareWithAll } = req.body;
    const userId = req.user.id;

    if (!leadId) {
        return res.status(400).json({ message: 'Lead ID is required.' });
    }

    try {
        // Find the current user's name
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const sharedByName = `${user.firstName} ${user.lastName}`;

        // Determine the recipients
        let recipients = friendIds;
        if (shareWithAll) {
            const allUsers = await User.find({}, '_id'); // Get all user IDs
            // Exclude current user
            recipients = allUsers
                .map(user => user._id)
                .filter(id => id.toString() !== userId);
        }

        if (!recipients || recipients.length === 0) {
            return res.status(400).json({ message: 'No recipients found to share the lead.' });
        }

        // Find the names of the receivers
        const friends = await User.find({ _id: { $in: recipients } });
        const sharedWithName = friends.map(friend => `${friend.firstName} ${friend.lastName}`);

        // Create the shared lead record
        const sharedLead = await SharedLead.create({
            leadId: leadId,
            sharedBy: userId,
            sharedWith: recipients,
            sharedByName: sharedByName,
            sharedWithName: sharedWithName
        });

        return res.status(201).json(sharedLead);
    } catch (error) {
        console.error("Error sharing lead:", error);
        return res.status(500).json({ message: "Error sharing lead", error: error.message });
    }
};

exports.getSharedLeads = async (req, res) => {
    const userId = req.user.id; // Logged-in user's ID from the token
    console.log(`[INFO] Fetching shared leads for user ID: ${userId}`);

    try {
        console.log(`[DEBUG] Initiating query to find leads shared by user ID: ${userId}`);
        const sharedLeads = await SharedLead.find({ sharedBy: userId })
            .populate('leadId', 'title') // Populate leadId to get the title
            .populate('sharedWith', 'firstName lastName'); // Populate sharedWith to get the names

        if (!sharedLeads || sharedLeads.length === 0) {
            console.log(`[INFO] No shared leads found for user ID: ${userId}`);
            return res.status(404).json({ message: 'No shared leads found.' });
        }

        console.log(`[DEBUG] Mapping shared leads data for response`);
        // Map and check if the populated leadId exists
        const response = sharedLeads.map(lead => ({
            _id: lead._id,
            leadId: lead.leadId ? lead.leadId._id : null,
            title: lead.leadId ? lead.leadId.title : 'Lead not found',
            sharedDate: lead.sharedAt,
            sharedWithNames: lead.sharedWith.map(user => `${user.firstName} ${user.lastName}`)
        }));

        console.log(`[INFO] Successfully fetched and mapped shared leads for user ID: ${userId}`);
        res.status(200).json(response);
    } catch (error) {
        console.error(`[ERROR] Error fetching shared leads for user ID: ${userId}`, error);
        res.status(500).json({ message: 'Error fetching shared leads' });
    }
};

exports.getReceivedLeads = async (req, res) => {
    const userId = req.user.id; // Logged-in user's ID from the token
    console.log(`[INFO] Fetching received leads for user ID: ${userId}`);

    try {
        console.log(`[DEBUG] Initiating query to find leads received by user ID: ${userId}`);
        const receivedLeads = await SharedLead.find({ sharedWith: userId })
            .populate('leadId', 'title') // Populate leadId to get the title
            .populate('sharedBy', 'firstName lastName'); // Populate sharedBy to get the sharer's name

        if (!receivedLeads || receivedLeads.length === 0) {
            console.log(`[INFO] No received leads found for user ID: ${userId}`);
            return res.status(404).json({ message: 'No received leads found.' });
        }

        console.log(`[DEBUG] Mapping received leads data for response`);
        // Map and check if the populated fields exist
        const response = receivedLeads.map(lead => ({
            _id: lead._id,
            leadId: lead.leadId ? lead.leadId._id : null,
            title: lead.leadId ? lead.leadId.title : 'Lead not found',
            receivedDate: lead.sharedAt,
            sharedByName: lead.sharedBy
                ? `${lead.sharedBy.firstName} ${lead.sharedBy.lastName}`
                : 'User not found'
        }));

        console.log(`[INFO] Successfully fetched and mapped received leads for user ID: ${userId}`);
        res.status(200).json(response);
    } catch (error) {
        console.error(`[ERROR] Error fetching received leads for user ID: ${userId}`, error);
        res.status(500).json({ message: 'Error fetching received leads' });
    }
};
