// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/verifyToken');
const { saveMessage } = require('../controllers/messageController');
const Chat = require('../models/chat');
const Message = require('../models/Message');

module.exports = function(io) {

    router.post('/send', authenticateToken, async (req, res) => {
        const { content, sender, receiver } = req.body; // Make sure these names match the frontend
    
        if (!content || !sender || !receiver) {
            return res.status(400).json({ message: "Missing required fields" });
        }
    
        try {
            const chat = await Chat.findOne({
                participants: { $all: [sender, receiver] }
            });
    
            if (!chat) {
                return res.status(404).json({ message: "No chat found for given users" });
            }
    
            const newMessage = new Message({
                content: content,
                sender: sender,
                chatId: chat._id
            });
    
            await newMessage.save();
            res.status(201).json(newMessage);
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error: error.toString() });
        }
    });


    router.patch('/read/:messageId', authenticateToken, async (req, res) => {
        const messageId = req.params.messageId;
    
        try {
            const message = await Message.findByIdAndUpdate(
                messageId,
                { read: true },
                { new: true }  // Returns the updated document
            );
    
            if (!message) {
                return res.status(404).json({ message: "Message not found" });
            }
    
            res.status(200).json({ message: "Message marked as read", data: message });
        } catch (error) {
            console.error('Error updating message:', error);
            res.status(500).json({ message: "Internal server error", error: error.toString() });
        }
    });
    
    

    // router.post('/send', authenticateToken, async (req, res) => {
    //     console.log("Received request to send message with body:", req.body);
    //     try {
            
    //         const { content } = req.body;
    //         const senderId = req.user.id;
    //         const recipientId = req.user.recipientId;
    //         console.log(recipientId);
    //         const chatId = await getOrCreateChat(senderId, recipientId);
    //         if (!content || !chatId) {
    //             console.log("Error: Missing required fields", { content, chatId, senderId });
    //             return res.status(400).json({ message: "Missing required fields" });
    //         }

    //         const message = await saveMessage({ content, chatId, senderId });
    //         console.log("Message saved and emitting to room:", { chatId, message });
    //         io.to(chatId).emit('newMessage', message);
    //         res.status(201).json(message);
    //     } catch (error) {
    //         console.error("Failed to send message:", error);
    //         res.status(500).json({ message: "Internal server error", error: error.toString() });
    //     }
    // });

    // router.get('/chat/:senderId/:recipientId', authenticateToken, async (req, res) => {
    //     const { senderId, recipientId } = req.params;
    //     try {
    //         const chatId = await getOrCreateChat(senderId, recipientId);
    //         res.status(200).json({ chatId });
    //     } catch (error) {
    //         console.error("Failed to retrieve or create chat:", error);
    //         res.status(500).json({ message: "Internal server error", error: error.toString() });
    //     }
    // });
    // Fetches the chat ID if it exists for given senderId and recipientId
router.get('/chat/:senderId/:recipientId', authenticateToken, async (req, res) => {
    const { senderId, recipientId } = req.params;
    try {
        const chatId = await getChatId(senderId, recipientId);
        if (chatId) {
            res.status(200).json({ chatId });
        } else {
            res.status(404).json({ message: "Chat not found" });
        }
    } catch (error) {
        console.error("Failed to retrieve chat:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});

    // Get messages for a specific chat
// router.get('/fetch/:chatId', authenticateToken, async (req, res) => {
//     const { chatId } = req.params;
//     try {
//         // Assuming Message model has a reference to Chat via 'chatId'
//         const messages = await Message.find({ chatId: chatId }).sort({ createdAt: 1 });
//         res.status(200).json(messages);
//         console.log("ChatID:", chatId);
//         console.log("messages:", messages);
//     } catch (error) {
//         console.error("Failed to fetch messages:", error);
//         res.status(500).json({ message: "Internal server error", error: error.toString() });
//     }
// });

router.get('/fetch/:chatId', authenticateToken, async (req, res) => {
    const { chatId } = req.params;
    const lastMessageId = req.query.lastMessageId; // or use lastChecked as a timestamp if you prefer

    try {
        let query = { chatId: chatId };
        if (lastMessageId) {
            query._id = { $gt: lastMessageId }; // Using MongoDB's $gt to get messages after the lastMessageId
        }

        const messages = await Message.find(query).sort({ createdAt: 1 });
        res.status(200).json(messages);
        console.log("ChatID:", chatId);
        console.log("messages:", messages);
    } catch (error) {
        console.error("Failed to fetch messages:", error);
        res.status(500).json({ message: "Internal server error", error: error.toString() });
    }
});




    

    return router;
};


// async function getOrCreateChat(senderId, recipientId) {
//     try {
//         // Check if there's an existing chat with these two users
//         let chat = await Chat.findOne({
//             participants: { $all: [senderId, recipientId] }
//         });

//         if (!chat) {
//             // If no chat exists, create a new one
//             chat = new Chat({
//                 participants: [senderId, recipientId]
//             });
//             await chat.save();
//         }

//         return chat._id;
//     } catch (error) {
//         console.error("Error in getOrCreateChat:", error);
//         throw error;
//     }
// }

async function getChatId(senderId, recipientId) {
    try {
        const chat = await Chat.findOne({
            participants: { $all: [senderId, recipientId] }
        });
        return chat ? chat._id : null;
    } catch (error) {
        console.error("Error in getChatId:", error);
        throw error;  // Ensure any errors are properly propagated up
    }
}