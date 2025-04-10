// const SharedLead = require('../models/SharedLead');
// const User = require('../models/User');

// exports.shareLead = async (req, res) => {
//     const { leadId, friendIds, shareWithAll } = req.body;
//     const userId = req.user.id;

//     if (!leadId) {
//         return res.status(400).json({ message: 'Lead ID is required.' });
//     }

//     try {
//         // Find the current user's name
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found.' });
//         }
//         const sharedByName = `${user.firstName} ${user.lastName}`;

//         // Determine the recipients
//         let recipients = friendIds;
//         if (shareWithAll) {
//             const allUsers = await User.find({}, '_id'); // Get all user IDs
//             // Exclude current user
//             recipients = allUsers
//                 .map(user => user._id)
//                 .filter(id => id.toString() !== userId);
//         }

//         if (!recipients || recipients.length === 0) {
//             return res.status(400).json({ message: 'No recipients found to share the lead.' });
//         }

//         // Find the names of the receivers
//         const friends = await User.find({ _id: { $in: recipients } });
//         const sharedWithName = friends.map(friend => `${friend.firstName} ${friend.lastName}`);

//         // Create the shared lead record
//         const sharedLead = await SharedLead.create({
//             leadId: leadId,
//             sharedBy: userId,
//             sharedWith: recipients,
//             sharedByName: sharedByName,
//             sharedWithName: sharedWithName
//         });

//         return res.status(201).json(sharedLead);
//     } catch (error) {
//         console.error("Error sharing lead:", error);
//         return res.status(500).json({ message: "Error sharing lead", error: error.message });
//     }
// };

// exports.getSharedLeads = async (req, res) => {
//     const userId = req.user.id; // Logged-in user's ID from the token
//     console.log(`[INFO] Fetching shared leads for user ID: ${userId}`);

//     try {
//         console.log(`[DEBUG] Initiating query to find leads shared by user ID: ${userId}`);
//         const sharedLeads = await SharedLead.find({ sharedBy: userId })
//             .populate('leadId', 'title') // Populate leadId to get the title
//             .populate('sharedWith', 'firstName lastName'); // Populate sharedWith to get the names

//         if (!sharedLeads || sharedLeads.length === 0) {
//             console.log(`[INFO] No shared leads found for user ID: ${userId}`);
//             return res.status(404).json({ message: 'No shared leads found.' });
//         }

//         console.log(`[DEBUG] Mapping shared leads data for response`);
//         // Map and check if the populated leadId exists
//         const response = sharedLeads.map(lead => ({
//             _id: lead._id,
//             leadId: lead.leadId ? lead.leadId._id : null,
//             title: lead.leadId ? lead.leadId.title : 'Lead not found',
//             sharedDate: lead.sharedAt,
//             sharedWithNames: lead.sharedWith.map(user => `${user.firstName} ${user.lastName}`)
//         }));

//         console.log(`[INFO] Successfully fetched and mapped shared leads for user ID: ${userId}`);
//         res.status(200).json(response);
//     } catch (error) {
//         console.error(`[ERROR] Error fetching shared leads for user ID: ${userId}`, error);
//         res.status(500).json({ message: 'Error fetching shared leads' });
//     }
// };

// exports.getReceivedLeads = async (req, res) => {
//     const userId = req.user.id; // Logged-in user's ID from the token
//     console.log(`[INFO] Fetching received leads for user ID: ${userId}`);

//     try {
//         console.log(`[DEBUG] Initiating query to find leads received by user ID: ${userId}`);
//         const receivedLeads = await SharedLead.find({ sharedWith: userId })
//             .populate('leadId', 'title') // Populate leadId to get the title
//             .populate('sharedBy', 'firstName lastName'); // Populate sharedBy to get the sharer's name

//         if (!receivedLeads || receivedLeads.length === 0) {
//             console.log(`[INFO] No received leads found for user ID: ${userId}`);
//             return res.status(404).json({ message: 'No received leads found.' });
//         }

//         console.log(`[DEBUG] Mapping received leads data for response`);
//         // Map and check if the populated fields exist
//         const response = receivedLeads.map(lead => ({
//             _id: lead._id,
//             leadId: lead.leadId ? lead.leadId._id : null,
//             title: lead.leadId ? lead.leadId.title : 'Lead not found',
//             receivedDate: lead.sharedAt,
//             sharedByName: lead.sharedBy
//                 ? `${lead.sharedBy.firstName} ${lead.sharedBy.lastName}`
//                 : 'User not found'
//         }));

//         console.log(`[INFO] Successfully fetched and mapped received leads for user ID: ${userId}`);
//         res.status(200).json(response);
//     } catch (error) {
//         console.error(`[ERROR] Error fetching received leads for user ID: ${userId}`, error);
//         res.status(500).json({ message: 'Error fetching received leads' });
//     }
// };


const SharedLead = require('../models/SharedLead');
const User = require('../models/User');
const Property = require('../models/Property');
const Notification = require('../models/Notification'); // Ensure this import is correct

/**
 * shareLead
 * Creates a SharedLead document referencing a Property
 * and notifies each recipient by creating a Notification for them.
 */
exports.shareLead = async (req, res) => {
  const { leadId, friendIds, shareWithAll } = req.body;
  const userId = req.user.id; // from your auth middleware

  if (!leadId) {
    return res.status(400).json({ message: 'Property (lead) ID is required.' });
  }

  try {
    // 1) Find the current user's name
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const sharedByName = `${user.firstName} ${user.lastName}`;

    // 2) Determine the recipients
    let recipients = friendIds; // e.g. [id1, id2, ...]
    if (shareWithAll) {
      const allUsers = await User.find({}, '_id'); // get all user IDs
      // Exclude current user
      recipients = allUsers
        .map((u) => u._id)
        .filter((id) => id.toString() !== userId);
    }

    if (!recipients || recipients.length === 0) {
      return res
        .status(400)
        .json({ message: 'No recipients found to share the lead.' });
    }

    // 3) Find the property to get fields like inquiryType, propertyCode
    const propertyDoc = await Property.findById(leadId).select(
      'inquiryType propertyCode'
    );
    if (!propertyDoc) {
      return res.status(404).json({ message: 'Property (lead) not found.' });
    }

    // 4) Find the names of the receivers (optional, but used below)
    const friends = await User.find({ _id: { $in: recipients } });
    const sharedWithName = friends.map(
      (friend) => `${friend.firstName} ${friend.lastName}`
    );

    // 5) Create the SharedLead record
    const sharedLead = await SharedLead.create({
      leadId, // references the Property doc
      sharedBy: userId,
      sharedWith: recipients,
      sharedByName,
      sharedWithName,
    });

    // 6) Create a Notification for each recipient
    // Now that the notification creation block is active, we add debug logs.
    const inquiryType = propertyDoc.inquiryType || 'property';
    const notificationPromises = recipients.map((recipientId) => {
      const message = `${sharedByName} shared a ${inquiryType} (Code: ${propertyDoc.propertyCode}) lead with you!`;
      console.log(`Creating notification for recipient ${recipientId}: ${message}`);
      return Notification.create({
        userId: recipientId,
        message,
      });
    });
    await Promise.all(notificationPromises);
    console.log("Notifications created successfully.");

    return res.status(201).json(sharedLead);
  } catch (error) {
    console.error('Error sharing lead:', error);
    return res.status(500).json({
      message: 'Error sharing lead',
      error: error.message,
    });
  }
};

/**
 * getSharedLeads
 * Fetches all leads (Properties) that the logged-in user has shared.
 */
exports.getSharedLeads = async (req, res) => {
  const userId = req.user.id; // from auth middleware
  console.log(`[INFO] Fetching shared leads for user ID: ${userId}`);

  try {
    const sharedLeads = await SharedLead.find({ sharedBy: userId })
      .populate('leadId', 'propertyCode propertySubType')
      .populate('sharedWith', 'firstName lastName');

    if (!sharedLeads || sharedLeads.length === 0) {
      console.log(`[INFO] No shared leads found for user ID: ${userId}`);
      return res.status(404).json({ message: 'No shared leads found.' });
    }

    // Build a response array
    const response = sharedLeads.map((lead) => ({
      _id: lead._id,
      leadId: lead.leadId ? lead.leadId._id : null,
      // Use propertyCode as the "title" (adjust as needed)
      title: lead.leadId ? lead.leadId.propertyCode : 'Lead not found',
      propertySubType: lead.leadId ? lead.leadId.propertySubType : '',
      sharedDate: lead.sharedAt,
      sharedWithNames: lead.sharedWith.map((u) => `${u.firstName} ${u.lastName}`),
    }));

    console.log(`[INFO] Successfully fetched shared leads for user ID: ${userId}`);
    return res.status(200).json(response);
  } catch (error) {
    console.error(
      `[ERROR] Error fetching shared leads for user ID: ${userId}`,
      error
    );
    return res.status(500).json({ message: 'Error fetching shared leads' });
  }
};

/**
 * getReceivedLeads
 * Fetches all leads (Properties) that the logged-in user has received
 * (i.e. where sharedWith includes this user).
 */
exports.getReceivedLeads = async (req, res) => {
  const userId = req.user.id;
  console.log(`[INFO] Fetching received leads for user ID: ${userId}`);

  try {
    const receivedLeads = await SharedLead.find({ sharedWith: userId })
      .populate('leadId', 'propertyCode propertySubType')
      .populate('sharedBy', 'firstName lastName');

    if (!receivedLeads || receivedLeads.length === 0) {
      console.log(`[INFO] No received leads found for user ID: ${userId}`);
      return res.status(404).json({ message: 'No received leads found.' });
    }

    const response = receivedLeads.map((lead) => ({
      _id: lead._id,
      leadId: lead.leadId ? lead.leadId._id : null,
      title: lead.leadId ? lead.leadId.propertyCode : 'Lead not found',
      propertySubType: lead.leadId ? lead.leadId.propertySubType : '',
      receivedDate: lead.sharedAt,
      sharedByName: lead.sharedBy
        ? `${lead.sharedBy.firstName} ${lead.sharedBy.lastName}`
        : 'User not found',
    }));

    console.log(`[INFO] Successfully fetched received leads for user ID: ${userId}`);
    return res.status(200).json(response);
  } catch (error) {
    console.error(
      `[ERROR] Error fetching received leads for user ID: ${userId}`,
      error
    );
    return res.status(500).json({ message: 'Error fetching received leads' });
  }
};
