const Message = require('../models/Message');

exports.sendMessage = (io) => async (req, res) => {
  const { chatId, sender, content } = req.body;

  try {
    const message = new Message({
      chatId,
      sender,
      content
    });

    await message.save();
    io.to(chatId).emit('newMessage', message); // Emitting to all users in the chat

    res.status(201).send(message);
  } catch (error) {
    res.status(500).send({ message: 'Error sending message', error: error.toString() });
  }
};

exports.fetchMessages = async (req, res) => {
    const { chatId } = req.params;  // Retrieve chatId from the request parameters
  
    console.log("Fetching messages for Chat ID:", chatId);  // Log the chat ID being queried
  
    try {
      const messages = await Message.find({ chatId }).populate('sender', 'name');  // Attempt to find messages by chat ID and populate sender details
      console.log(`Retrieved ${messages.length} messages for Chat ID ${chatId}`);  // Log the number of messages retrieved
  
      res.status(200).send(messages);  // Send the retrieved messages back to the client
    } catch (error) {
      console.error("Failed to fetch messages for Chat ID:", chatId, "Error:", error);  // Log error if fetching messages fails
      res.status(500).send({ message: 'Error fetching messages', error: error.toString() });  // Respond with an error status and message
    }
  };
  

async function saveMessage(data) {
    const message = new Message({
        chatId: data.chatId,
        sender: data.senderId,
        content: data.content
    });

    try {
        await message.save();
        console.log("Message saved:", message);
        return message;
    } catch (error) {
        console.error("Error saving message to database:", error);
        throw error;
    }
}

module.exports = {
    saveMessage
};

