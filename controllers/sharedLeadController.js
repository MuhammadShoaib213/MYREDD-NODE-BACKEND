// // const SharedLead = require('../models/SharedLead');
// // const User = require('../models/User');

// // exports.shareLead = async (req, res) => {
// //     const { leadId, friendIds, shareWithAll } = req.body;
// //     const userId = req.user.id;

// //     if (!leadId) {
// //         return res.status(400).json({ message: 'Lead ID is required.' });
// //     }

// //     try {
// //         // Find the current user's name
// //         const user = await User.findById(userId);
// //         if (!user) {
// //             return res.status(404).json({ message: 'User not found.' });
// //         }
// //         const sharedByName = `${user.firstName} ${user.lastName}`;

// //         // Determine the recipients
// //         let recipients = friendIds;
// //         if (shareWithAll) {
// //             const allUsers = await User.find({}, '_id'); // Get all user IDs
// //             // Exclude current user
// //             recipients = allUsers
// //                 .map(user => user._id)
// //                 .filter(id => id.toString() !== userId);
// //         }

// //         if (!recipients || recipients.length === 0) {
// //             return res.status(400).json({ message: 'No recipients found to share the lead.' });
// //         }

// //         // Find the names of the receivers
// //         const friends = await User.find({ _id: { $in: recipients } });
// //         const sharedWithName = friends.map(friend => `${friend.firstName} ${friend.lastName}`);

// //         // Create the shared lead record
// //         const sharedLead = await SharedLead.create({
// //             leadId: leadId,
// //             sharedBy: userId,
// //             sharedWith: recipients,
// //             sharedByName: sharedByName,
// //             sharedWithName: sharedWithName
// //         });

// //         return res.status(201).json(sharedLead);
// //     } catch (error) {
// //         console.error("Error sharing lead:", error);
// //         return res.status(500).json({ message: "Error sharing lead", error: error.message });
// //     }
// // };

// // exports.getSharedLeads = async (req, res) => {
// //     const userId = req.user.id; // Logged-in user's ID from the token
// //     console.log(`[INFO] Fetching shared leads for user ID: ${userId}`);

// //     try {
// //         console.log(`[DEBUG] Initiating query to find leads shared by user ID: ${userId}`);
// //         const sharedLeads = await SharedLead.find({ sharedBy: userId })
// //             .populate('leadId', 'title') // Populate leadId to get the title
// //             .populate('sharedWith', 'firstName lastName'); // Populate sharedWith to get the names

// //         if (!sharedLeads || sharedLeads.length === 0) {
// //             console.log(`[INFO] No shared leads found for user ID: ${userId}`);
// //             return res.status(404).json({ message: 'No shared leads found.' });
// //         }

// //         console.log(`[DEBUG] Mapping shared leads data for response`);
// //         // Map and check if the populated leadId exists
// //         const response = sharedLeads.map(lead => ({
// //             _id: lead._id,
// //             leadId: lead.leadId ? lead.leadId._id : null,
// //             title: lead.leadId ? lead.leadId.title : 'Lead not found',
// //             sharedDate: lead.sharedAt,
// //             sharedWithNames: lead.sharedWith.map(user => `${user.firstName} ${user.lastName}`)
// //         }));

// //         console.log(`[INFO] Successfully fetched and mapped shared leads for user ID: ${userId}`);
// //         res.status(200).json(response);
// //     } catch (error) {
// //         console.error(`[ERROR] Error fetching shared leads for user ID: ${userId}`, error);
// //         res.status(500).json({ message: 'Error fetching shared leads' });
// //     }
// // };

// // exports.getReceivedLeads = async (req, res) => {
// //     const userId = req.user.id; // Logged-in user's ID from the token
// //     console.log(`[INFO] Fetching received leads for user ID: ${userId}`);

// //     try {
// //         console.log(`[DEBUG] Initiating query to find leads received by user ID: ${userId}`);
// //         const receivedLeads = await SharedLead.find({ sharedWith: userId })
// //             .populate('leadId', 'title') // Populate leadId to get the title
// //             .populate('sharedBy', 'firstName lastName'); // Populate sharedBy to get the sharer's name

// //         if (!receivedLeads || receivedLeads.length === 0) {
// //             console.log(`[INFO] No received leads found for user ID: ${userId}`);
// //             return res.status(404).json({ message: 'No received leads found.' });
// //         }

// //         console.log(`[DEBUG] Mapping received leads data for response`);
// //         // Map and check if the populated fields exist
// //         const response = receivedLeads.map(lead => ({
// //             _id: lead._id,
// //             leadId: lead.leadId ? lead.leadId._id : null,
// //             title: lead.leadId ? lead.leadId.title : 'Lead not found',
// //             receivedDate: lead.sharedAt,
// //             sharedByName: lead.sharedBy
// //                 ? `${lead.sharedBy.firstName} ${lead.sharedBy.lastName}`
// //                 : 'User not found'
// //         }));

// //         console.log(`[INFO] Successfully fetched and mapped received leads for user ID: ${userId}`);
// //         res.status(200).json(response);
// //     } catch (error) {
// //         console.error(`[ERROR] Error fetching received leads for user ID: ${userId}`, error);
// //         res.status(500).json({ message: 'Error fetching received leads' });
// //     }
// // };


// const SharedLead = require('../models/SharedLead');
// const User = require('../models/User');
// const Property = require('../models/Property');
// const Notification = require('../models/Notification'); // Ensure this import is correct

// /**
//  * shareLead
//  * Creates a SharedLead document referencing a Property
//  * and notifies each recipient by creating a Notification for them.
//  */
// exports.shareLead = async (req, res) => {
//   const { leadId, friendIds, shareWithAll } = req.body;
//   const userId = req.user.id; // from your auth middleware

//   if (!leadId) {
//     return res.status(400).json({ message: 'Property (lead) ID is required.' });
//   }

//   try {
//     // 1) Find the current user's name
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found.' });
//     }
//     const sharedByName = `${user.firstName} ${user.lastName}`;

//     // 2) Determine the recipients
//     let recipients = friendIds; // e.g. [id1, id2, ...]
//     if (shareWithAll) {
//       const allUsers = await User.find({}, '_id'); // get all user IDs
//       // Exclude current user
//       recipients = allUsers
//         .map((u) => u._id)
//         .filter((id) => id.toString() !== userId);
//     }

//     if (!recipients || recipients.length === 0) {
//       return res
//         .status(400)
//         .json({ message: 'No recipients found to share the lead.' });
//     }

//     // 3) Find the property to get fields like inquiryType, propertyCode
//     const propertyDoc = await Property.findById(leadId).select(
//       'inquiryType propertyCode'
//     );
//     if (!propertyDoc) {
//       return res.status(404).json({ message: 'Property (lead) not found.' });
//     }

//     // 4) Find the names of the receivers (optional, but used below)
//     const friends = await User.find({ _id: { $in: recipients } });
//     const sharedWithName = friends.map(
//       (friend) => `${friend.firstName} ${friend.lastName}`
//     );

//     // 5) Create the SharedLead record
//     const sharedLead = await SharedLead.create({
//       leadId, // references the Property doc
//       sharedBy: userId,
//       sharedWith: recipients,
//       sharedByName,
//       sharedWithName,
//     });

//     // 6) Create a Notification for each recipient
//     // Now that the notification creation block is active, we add debug logs.
//     const inquiryType = propertyDoc.inquiryType || 'property';
//     const notificationPromises = recipients.map((recipientId) => {
//       const message = `${sharedByName} shared a ${inquiryType} (Code: ${propertyDoc.propertyCode}) lead with you!`;
//       console.log(`Creating notification for recipient ${recipientId}: ${message}`);
//       return Notification.create({
//         userId: recipientId,
//         message,
//       });
//     });
//     await Promise.all(notificationPromises);
//     console.log("Notifications created successfully.");

//     return res.status(201).json(sharedLead);
//   } catch (error) {
//     console.error('Error sharing lead:', error);
//     return res.status(500).json({
//       message: 'Error sharing lead',
//       error: error.message,
//     });
//   }
// };

// /**
//  * getSharedLeads
//  * Fetches all leads (Properties) that the logged-in user has shared.
//  */
// exports.getSharedLeads = async (req, res) => {
//   const userId = req.user.id; // from auth middleware
//   console.log(`[INFO] Fetching shared leads for user ID: ${userId}`);

//   try {
//     const sharedLeads = await SharedLead.find({ sharedBy: userId })
//       .populate('leadId', 'propertyCode propertySubType')
//       .populate('sharedWith', 'firstName lastName');

//     if (!sharedLeads || sharedLeads.length === 0) {
//       console.log(`[INFO] No shared leads found for user ID: ${userId}`);
//       return res.status(404).json({ message: 'No shared leads found.' });
//     }

//     // Build a response array
//     const response = sharedLeads.map((lead) => ({
//       _id: lead._id,
//       leadId: lead.leadId ? lead.leadId._id : null,
//       // Use propertyCode as the "title" (adjust as needed)
//       title: lead.leadId ? lead.leadId.propertyCode : 'Lead not found',
//       propertySubType: lead.leadId ? lead.leadId.propertySubType : '',
//       sharedDate: lead.sharedAt,
//       sharedWithNames: lead.sharedWith.map((u) => `${u.firstName} ${u.lastName}`),
//     }));

//     console.log(`[INFO] Successfully fetched shared leads for user ID: ${userId}`);
//     return res.status(200).json(response);
//   } catch (error) {
//     console.error(
//       `[ERROR] Error fetching shared leads for user ID: ${userId}`,
//       error
//     );
//     return res.status(500).json({ message: 'Error fetching shared leads' });
//   }
// };

// /**
//  * getReceivedLeads
//  * Fetches all leads (Properties) that the logged-in user has received
//  * (i.e. where sharedWith includes this user).
//  */
// exports.getReceivedLeads = async (req, res) => {
//   const userId = req.user.id;
//   console.log(`[INFO] Fetching received leads for user ID: ${userId}`);

//   try {
//     const receivedLeads = await SharedLead.find({ sharedWith: userId })
//       .populate('leadId', 'propertyCode propertySubType')
//       .populate('sharedBy', 'firstName lastName');

//     if (!receivedLeads || receivedLeads.length === 0) {
//       console.log(`[INFO] No received leads found for user ID: ${userId}`);
//       return res.status(404).json({ message: 'No received leads found.' });
//     }

//     const response = receivedLeads.map((lead) => ({
//       _id: lead._id,
//       leadId: lead.leadId ? lead.leadId._id : null,
//       title: lead.leadId ? lead.leadId.propertyCode : 'Lead not found',
//       propertySubType: lead.leadId ? lead.leadId.propertySubType : '',
//       receivedDate: lead.sharedAt,
//       sharedByName: lead.sharedBy
//         ? `${lead.sharedBy.firstName} ${lead.sharedBy.lastName}`
//         : 'User not found',
//     }));

//     console.log(`[INFO] Successfully fetched received leads for user ID: ${userId}`);
//     return res.status(200).json(response);
//   } catch (error) {
//     console.error(
//       `[ERROR] Error fetching received leads for user ID: ${userId}`,
//       error
//     );
//     return res.status(500).json({ message: 'Error fetching received leads' });
//   }
// };

const mongoose     = require('mongoose');   
const SharedLead   = require('../models/SharedLead');
const User         = require('../models/User');
const Property     = require('../models/Property');
const Notification = require('../models/Notification');

/*
|--------------------------------------------------------------------------
| 1.  SHARE a lead
|--------------------------------------------------------------------------
*/
exports.shareLead = async (req, res) => {
  const { leadId, friendIds, shareWithAll } = req.body;
  const userId = req.user.id;

  if (!leadId) return res.status(400).json({ message: 'Property (lead) ID is required.' });

  try {
    const user = await User.findById(userId, 'firstName lastName');
    if (!user) return res.status(404).json({ message: 'Sharer not found.' });

    // decide recipients
    let recipients = friendIds || [];
    if (shareWithAll) {
      recipients = (await User.find({}, '_id'))
        .map(u => u._id.toString())
        .filter(id => id !== userId);         // don’t send to yourself
    }
    if (!recipients.length) {
      return res.status(400).json({ message: 'No recipients.' });
    }

    const property = await Property.findById(leadId, 'inquiryType propertyCode');
    if (!property) return res.status(404).json({ message: 'Property not found.' });

    // build sub‑docs
    const recipientSubDocs = recipients.map(id => ({ user: id }));

    const sharedLead = await SharedLead.create({
      leadId,
      sharedBy: userId,
      sharedByName: `${user.firstName} ${user.lastName}`,
      recipients: recipientSubDocs
    });

    // fire notifications
    // await Promise.all(
    //   recipients.map(rid =>
    //     Notification.create({
    //       userId: rid,
    //       message: `${user.firstName} shared a ${property.inquiryType} (Code: ${property.propertyCode}) lead with you!`
    //     })
    //   )
    // );

    await Promise.all(
      recipients.map(rid =>
        Notification.create({
          userId: rid,
          message: `${user.firstName} shared a ${property.inquiryType} (Code: ${property.propertyCode}) lead with you!`,
          type: 'inquiry_shared',
          metadata: {
            inquiryId: sharedLead._id,
            sharedById: userId
          }
        })
      )
    );

    res.status(201).json(sharedLead);
  } catch (err) {
    console.error('shareLead error:', err);
    res.status(500).json({ message: 'Failed to share', error: err.message });
  }
};

/*
|--------------------------------------------------------------------------
| 2.  LIST leads I have shared  (summary + counts)
|--------------------------------------------------------------------------
*/
exports.getSharedLeads = async (req, res) => {
  const userId = req.user.id;
  const { summary } = req.query;                    // ?summary=true for dashboard

  try {
    if (summary === 'true') {
      // quick totals for the dashboard
      const totals = await SharedLead.aggregate([
        { $match: { sharedBy: new mongoose.Types.ObjectId(userId) } },
        { $unwind: '$recipients' },
        {
          $group: {
            _id: '$recipients.status',
            count: { $sum: 1 }
          }
        }
      ]);

      const counts = { accepted: 0, rejected: 0, pending: 0 };
      totals.forEach(t => { counts[t._id.toLowerCase()] = t.count; });
      counts.total = counts.accepted + counts.rejected + counts.pending;
      return res.json(counts);
    }

    // full list
    const leads = await SharedLead.find({ sharedBy: userId })
      .populate('leadId', 'propertyCode propertySubType inquiryType')
      .populate('recipients.user', 'firstName lastName');

    res.json(leads);
  } catch (err) {
    console.error('getSharedLeads error:', err);
    res.status(500).json({ message: 'Failed to fetch shared leads' });
  }
};

/*
|--------------------------------------------------------------------------
| 3.  TRACK a single broadcast (recipient table)
|--------------------------------------------------------------------------
*/
exports.getBroadcastTracking = async (req, res) => {
  const userId   = req.user.id;
  const leadId   = req.params.id;

  try { // <-- Add try block
    const leadId = req.params.id;
    const lead = await SharedLead.findById(leadId) // <-- Mongoose tries to find a lead with ID "undefined" and fails 
    .populate({
      path: 'recipients', // Populate the top-level array
      populate: {         // Define population for elements within the array
        path: 'user',     // The field within each recipient object to populate
        select: 'firstName lastName', // Fields to select from the User model
        model: 'User'     // Explicitly specify the model (optional but good practice)
      }
    });

    if (!lead) {
      console.log(`[WARN] Broadcast tracking requested for non-existent lead ID: ${leadId}`);
      return res.status(404).json({ message: 'Broadcast record not found.' });
    }
    if (lead.sharedBy.toString() !== userId) {
      console.log(`[AUTH] User ${userId} attempted to access broadcast ${leadId} shared by ${lead.sharedBy}`);
      return res.status(403).json({ message: 'Forbidden: You did not create this broadcast.' });
    }

    const summary = { accepted: 0, rejected: 0, pending: 0, unknown: 0 }; // <-- Add 'unknown' category
    let processingError = false;

    // <-- Add validation inside forEach
    lead.recipients.forEach((r, index) => {
      if (r && r.status && typeof r.status === 'string') {
        const statusKey = r.status.toLowerCase();
        if (summary.hasOwnProperty(statusKey)) {
          summary[statusKey]++;
        } else {
          console.error(`[ERROR] Unexpected status value "${r.status}" for recipient index ${index} in lead ${leadId}`);
          summary.unknown++;
          processingError = true;
        }
      } else {
        console.error(`[ERROR] Invalid or missing status for recipient index ${index} in lead ${leadId}. Recipient data:`, r);
        summary.unknown++;
        processingError = true;
      }
    });

    summary.total     = lead.recipients.length;
    summary.responded = summary.accepted + summary.rejected;

    if (processingError) {
      console.warn(`[WARN] Encountered issues processing recipient statuses for lead ${leadId}. Summary might be incomplete.`);
    }

    res.json({ lead, summary });

  } catch (error) { // <-- Add catch block
    console.error(`[ERROR] Failed to get broadcast tracking for lead ID ${leadId}:`, error);
    // Check specifically for StrictPopulateError which might indicate schema/populate issues
    if (error.name === 'StrictPopulateError') {
        console.error('[ERROR] Mongoose StrictPopulateError encountered. Check schema and population paths.');
        return res.status(500).json({ message: 'Server configuration error during data retrieval.' });
    }
    res.status(500).json({ message: 'Internal server error while retrieving broadcast details.' });
  }
};

/*
|--------------------------------------------------------------------------
| 4.  LIST leads I have received
|--------------------------------------------------------------------------
*/
exports.getReceivedLeads = async (req, res) => {
  const userId = req.user.id;
  const { summary } = req.query;

  try {
    if (summary === 'true') {
      const totals = await SharedLead.aggregate([
        { $unwind: '$recipients' },
        { $match: { 'recipients.user': new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$recipients.status',
            count: { $sum: 1 }
          }
        }
      ]);

      const counts = { accepted: 0, rejected: 0, pending: 0 };
      totals.forEach(t => { counts[t._id.toLowerCase()] = t.count; });
      counts.total = counts.accepted + counts.rejected + counts.pending;
      return res.json(counts);
    }

    const leads = await SharedLead.find({ 'recipients.user': userId })
      .populate('leadId', 'propertyCode propertySubType inquiryType')
      .populate('sharedBy', 'firstName lastName')
      .select('leadId sharedAt recipients.$');

    res.json(leads);
  } catch (err) {
    console.error('getReceivedLeads error:', err);
    res.status(500).json({ message: 'Failed to fetch received leads' });
  }
};

/*
|--------------------------------------------------------------------------
| 5.  PATCH my status (accept / reject)
|--------------------------------------------------------------------------
*/
exports.updateReceivedStatus = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;                 // SharedLead _id
  const { status } = req.body;               // 'Accepted' | 'Rejected'

  if (!['Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status.' });
  }

  const lead = await SharedLead.findOneAndUpdate(
    { _id: id, 'recipients.user': userId },
    {
      $set: {
        'recipients.$.status': status,
        'recipients.$.respondedAt': new Date()
      }
    },
    { new: true }
  ).populate('sharedBy', 'firstName lastName');

  if (!lead) return res.status(404).json({ message: 'Lead not found.' });

  // notify sharer
  // await Notification.create({
  //   userId: lead.sharedBy._id,
  //   message: `${req.user.firstName} ${req.user.lastName} ${status.toLowerCase()} your Inquiry ${lead.leadId}`
  // });

  await Notification.create({
    userId: lead.sharedBy._id,
    message: `${req.user.firstName} ${req.user.lastName} ${status.toLowerCase()} your Inquiry ${lead.leadId}`,
    type: 'inquiry_accepted',
    metadata: {
      inquiryId: lead.id,
      acceptedById: userId,
      status: status
    }
  });

  res.json({ message: `Marked as ${status}.` });
};
