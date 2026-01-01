const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken');
const User = require('../models/User'); // Model for users
const FriendRequest = require('../models/FriendRequest'); // Model for friend requests
const Friend = require('../models/Friend'); // Model for confirmed friendships
const Chat = require('../models/chat'); // Adjust the path as necessary
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/add', authenticateToken, asyncHandler(async (req, res) => {
    const userEmail = req.user.email;
    const friendEmail = req.body.email;

    if (!friendEmail) {
        return res.status(400).send('Friend email is required.');
    }

    try {
        const friend = await User.findOne({ email: friendEmail });
        if (!friend) {
            return res.status(404).send('Friend not found.');
        }

        const existingRequest = await FriendRequest.findOne({
            requester: req.user.id,
            requested: friend._id
        });

        if (existingRequest) {
            return res.status(409).send('Friend request already sent.');
        }

        // Ensure req.user.firstName and req.user.lastName are not undefined
        console.log("Requester First Name:", req.user.firstName);
        console.log("Requester Last Name:", req.user.lastName);

        const newRequest = await FriendRequest.create({
            requester: req.user.id,
            requested: friend._id,
            requesterFirstName: req.user.firstName,  // Make sure these fields are populated
            requesterLastName: req.user.lastName,
            requestedFirstName: friend.firstName,
            requestedLastName: friend.lastName
        });

        return res.status(201).json(newRequest);
    } catch (error) {
        console.error("Error sending friend request:", error);
        return res.status(500).json({ message: "Error sending friend request", error: error.message });
    }
}));




// GET endpoint to list all friend requests received by the logged-in user
router.get('/requests', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;

    try {
        const requests = await FriendRequest.find({ requested: userId }).populate('requester');
        return res.json(requests);
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        return res.status(500).json({ message: "Error fetching friend requests", error: error.message });
    }
}));

router.post('/accept', authenticateToken, asyncHandler(async (req, res) => {
    const requestId = req.body.requestId;

    try {
        const request = await FriendRequest.findById(requestId).populate('requester requested');
        if (!request) {
            console.log("Friend request not found for ID:", requestId);
            return res.status(404).send('Friend request not found.');
        }


        const userIds = [request.requester._id.toString(), request.requested._id.toString()].sort();
        const chatId = userIds.join('_');  // Concatenating user IDs with an underscore for readability


        // Create a new friend document including full names
        const newFriendship = new Friend({
            users: [
                { userId: request.requester._id, firstName: request.requesterFirstName, lastName: request.requesterLastName },
                { userId: request.requested._id, firstName: request.requestedFirstName, lastName: request.requestedLastName }
            ]
        });

        let chat = await Chat.findOne({ chatId: chatId });
        if (!chat) {
            // Create a new chat document
            chat = new Chat({
                chatId: chatId,
                participants: userIds
            });
            await chat.save();
            console.log("Chat created with ID:", chat.chatId);
        } else {
            console.log("Chat already exists with ID:", chat.chatId);
        }


        await newFriendship.save();
        console.log("New friendship established between:", `${request.requesterFirstName} ${request.requesterLastName}`, "and", `${request.requestedFirstName} ${request.requestedLastName}`);

        // Delete the friend request using findByIdAndDelete
        await FriendRequest.findByIdAndDelete(requestId);
        console.log("Friend request ID:", requestId, "has been accepted and removed.");

        return res.send('Friend request accepted and friendship established.');
    } catch (error) {
        console.error("Error accepting friend request:", error);
        return res.status(500).json({ message: "Error accepting friend request", error: error.message });
    }
}));




router.get('/list', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    console.log("Request to list all friends for user ID:", userId);

    if (!userId) {
        console.error("No user ID found in the request");
        return res.status(401).send('Unauthorized: No user ID found');
    }

    try {
        const friends = await Friend.find({ "users.userId": userId }).populate('users.userId');
        console.log(`Friends data fetched for user ID ${userId}:`, friends);

        if (!friends || friends.length === 0) {
            console.log("No friends found for user ID:", userId);
            return res.status(404).send('No friends found');
        }

        const friendList = friends.map(friend => {
            return {
                id: friend._id,
                users: friend.users.map(u => ({
                    id: u.userId._id,
                    name: `${u.userId.firstName} ${u.userId.lastName}`
                }))
            };
        });

        console.log(`Friend list prepared for user ID ${userId}:`, friendList);

        return res.json(friendList);
    } catch (error) {
        console.error("Error fetching friends for user ID:", userId, error);
        return res.status(500).json({ message: "Error fetching friends", error: error.message });
    }
}));



router.get('/friends', authenticateToken, asyncHandler(async (req, res) => {
    const userId = req.query.userId;
    console.log('Fetching friend list for user ID:', userId);

    if (!userId) {
        console.log('No user ID provided in query.');
        return res.status(400).send('User ID is required');
    }

    try {
        console.log('Attempting to find friends in the database...');
        const friends = await Friend.find({ "users.0.userId": new mongoose.Types.ObjectId(userId) });
        console.log(`Database query complete. Number of friends found: ${friends.length}`);

        if (!friends || friends.length === 0) {
            console.log('No friends found for this user ID:', userId);
            return res.status(404).send('No friends found');
        }

        const friendList = friends.map(friend => {
            const friendData = friend.users[1]; // Friend data is always at index 1
            console.log(`Friend data found: ${friendData.firstName} ${friendData.lastName}`);
            return {
                id: friendData._id,
                userId: friendData.userId,
                name: `${friendData.firstName} ${friendData.lastName}`,
            };
        });

        console.log('Successfully prepared friend list data.');
        return res.json(friendList);
    } catch (error) {
        console.error("Error fetching friends for user ID:", userId, error);
        return res.status(500).json({ message: "Error fetching friends", error: error.message });
    }
}));


module.exports = router;
