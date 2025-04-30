const Friends = require('../models/Friends');
const User = require('../models/User');

exports.sendFriendRequest = async (req, res) => {
  const { recipientId } = req.body;
  const requesterId = req.user.id;

  console.log(`Attempting to send friend request from ${requesterId} to ${recipientId}`);

  try {
    // Prevent sending a request to oneself
    if (requesterId.toString() === recipientId) {
      console.log("Attempt to send friend request to self");
      return res.status(400).json({ message: "You cannot send a friend request to yourself." });
    }

    const existingFriends = await Friends.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingFriends) {
      console.log("Friend request already exists or has been handled", existingFriends);
      return res.status(400).json({ message: 'Friend request already exists or has been handled.' });
    }

    const newFriends = new Friends({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    await newFriends.save();
    console.log("Friend request sent successfully", newFriends);
    res.status(201).json(newFriends);
  } catch (error) {
    console.error('Error when trying to send friend request:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateFriendsStatus = async (req, res) => {
  const { friendsId, action } = req.body;

  console.log(`Updating friend status for ${friendsId} to ${action}`);

  try {
    const conditions = { _id: friendsId };
    const update = { updated_at: new Date() };

    switch (action) {
      case 'accept':
        update.status = 'accepted';
        break;
      case 'decline':
      case 'block':
      case 'remove':
        update.status = action;
        break;
      default:
        console.log("Invalid action provided", action);
        return res.status(400).json({ message: 'Invalid action' });
    }

    const updatedFriends = await Friends.findByIdAndUpdate(conditions, update, { new: true });
    if (!updatedFriends) {
      console.log("No friends record found with ID", friendsId);
      return res.status(404).json({ message: 'Friends not found' });
    }
    console.log("Friends status updated successfully", updatedFriends);
    res.json(updatedFriends);
  } catch (error) {
    console.error('Failed to update friends status:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  const userId = req.user.id;

  console.log(`Fetching friend requests for user ${userId}`);

  try {
    const requests = await Friends.find({ recipient: userId, status: 'pending' }).populate('requester', 'firstName lastName');
    console.log("Friend requests fetched successfully", requests);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getFriendsList = async (req, res) => {
    const userId = req.user.id; // Assuming this is set from the decoded JWT
  
    console.log(`Fetching friends list for user ${userId}`);
  
    try {
      const friends = await Friends.find({
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      })
      .populate('requester', 'firstName lastName email profilePicture jobTitle whatsappNumber userRole city country') // Updated to include more details
      .populate('recipient', 'firstName lastName email profilePicture jobTitle whatsappNumber userRole city country') // Updated to include more details
      .exec();
  
      const results = friends.map(friend => {
        // Determine whether the current user is the requester or recipient and then return the friend's data
        return friend.requester._id.toString() === userId ? friend.recipient : friend.requester;
      });
  
      res.json(results);
    } catch (error) {
      console.error('Error fetching friends list:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  };
  
  exports.getFriendDetail = async (req, res) => {
    const { id } = req.params; // Friend's user ID
    const userId = req.user.id; // Assuming this is set from the decoded JWT
  
    console.log(`Fetching details for friend ${id} for user ${userId}`);
  
    try {
      const friend = await User.findById(id)
        .select('firstName lastName email profilePicture jobTitle whatsappNumber userRole city currentAddress cnicNumber profession personalEmail officialEmail age dependants createdAt country location businessInfo businessLogo businessName businessOwnerName businessWorkingArea businessNTN residential commercial land experience skills dateOfBirth profileCompletion')
        .exec();
  
      if (!friend) {
        console.log(`No friend found with ID ${id}`);
        return res.status(404).json({ message: 'Friend not found' });
      }
  
      // Check if the friend relationship exists
      const friendship = await Friends.findOne({
        $or: [
          { requester: userId, recipient: id, status: 'accepted' },
          { requester: id, recipient: userId, status: 'accepted' }
        ]
      });
  
      if (!friendship) {
        console.log(`No friendship found between user ${userId} and friend ${id}`);
        return res.status(403).json({ message: 'You are not friends with this user' });
      }
  
      res.json(friend);
    } catch (error) {
      console.error('Error fetching friend details:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  };


  exports.getFriendByCity = async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch all accepted friendships involving the current user
        const friends = await Friends.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        }).exec();

        // Gather all user IDs from the friends relationships
        const userIds = friends.map(friend => 
            friend.requester.toString() === userId ? friend.recipient : friend.requester
        );

        // Fetch user details based on the gathered IDs
        const users = await User.find({
            '_id': { $in: userIds }
        }).select('city firstName lastName profilePicture jobTitle whatsappNumber userRole');

        // Categorize users by city or "Others" if undefined
        const cityMap = users.reduce((acc, user) => {
            const city = user.city || 'Others'; // Assign to 'Others' if city is undefined
            if (!acc[city]) {
                acc[city] = {
                    count: 0,
                    friends: []
                };
            }
            acc[city].count++;
            acc[city].friends.push(user);
            return acc;
        }, {});

        res.json(cityMap);
    } catch (error) {
        console.error('Error fetching friends by city:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

exports.getFriendsBySpecificCity = async (req, res) => {
    const userId = req.user.id;
    const { cityName } = req.params;

    try {
        // Fetching all accepted friendships
        const friends = await Friends.find({
            $or: [
                { requester: userId, status: 'accepted' },
                { recipient: userId, status: 'accepted' }
            ]
        })
        .populate('requester', 'firstName lastName email profilePicture jobTitle whatsappNumber userRole city currentAddress cnicNumber profession personalEmail officialEmail age dependants createdAt country location businessInfo businessLogo businessName businessOwnerName businessWorkingArea businessNTN residential commercial land experience skills dateOfBirth profileCompletion')
        .populate('recipient', 'firstName lastName email profilePicture jobTitle whatsappNumber userRole city currentAddress cnicNumber profession personalEmail officialEmail age dependants createdAt country location businessInfo businessLogo businessName businessOwnerName businessWorkingArea businessNTN residential commercial land experience skills dateOfBirth profileCompletion')
        .exec();

        let results;
        if (cityName.toLowerCase() === 'all') {
            // If "All" is specified, include all friends
            results = friends.map(friend => friend.requester._id.toString() === userId ? friend.recipient : friend.requester);
        } else {
            results = friends.reduce((acc, friend) => {
                const friendData = friend.requester._id.toString() === userId ? friend.recipient : friend.requester;

                // Determine the correct city to compare
                const friendCity = friendData.city ? friendData.city.toLowerCase() : 'others';

                // If city query is "others", match friends with undefined city fields
                if (cityName.toLowerCase() === 'others' && friendCity === 'others') {
                    acc.push(friendData);
                } else if (friendCity === cityName.toLowerCase()) {
                    acc.push(friendData);
                }
                return acc;
            }, []);
        }

        if (!results.length) {
            return res.status(404).json({ message: `No friends found in ${cityName}` });
        }

        res.json(results);
    } catch (error) {
        console.error(`Error fetching friends from ${cityName}:`, error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
