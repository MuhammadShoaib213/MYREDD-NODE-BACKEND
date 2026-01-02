const Note = require('../models/Note');

exports.createNote = async (req, res) => {
  try {
    const { propertyId, customerId, text, datetime } = req.body;
    const userId = req.user.id;

    let audioURL = '';
    if (req.files && req.files.audio) {
      audioURL = `/uploads/${req.files.audio[0].filename}`;
    }

    const newNote = new Note({
      userId,
      propertyId,
      customerId,
      text,
      audioURL,
      datetime
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error('Failed to create note:', error);
    res.status(500).json({ message: 'Failed to create note', error: error.message });
  }
};


exports.getNotesByUserPropertyCustomer = async (req, res) => {
    const { propertyId, customerId } = req.params;
    const userId = req.user?.id || req.user?.userId;
  
    // Optional: Add validation to ensure all IDs are provided
    if (!userId || !propertyId || !customerId) {
      return res.status(400).json({ message: "All parameters are required: propertyId and customerId" });
    }
  
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limitRaw = parseInt(req.query.limit, 10) || 50;
      const limit = Math.min(Math.max(limitRaw, 1), 50);
      const skip = (page - 1) * limit;

      const notes = await Note.find({ userId, propertyId, customerId })
        .populate('userId propertyId customerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      if (notes.length === 0) {
        return res.status(200).json([]);
      }
      res.json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      res.status(500).json({ message: 'Error fetching notes', error: error.message });
    }
  };

  exports.deleteNote = async (req, res) => {
    const { id } = req.params; // ID of the note to delete

    try {
        const note = await Note.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Failed to delete note:', error);
        res.status(500).json({ message: 'Failed to delete note', error: error.message });
    }
};
