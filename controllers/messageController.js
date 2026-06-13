import Message from '../models/Message.js';

// Get messages for a workspace
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ workspace: req.query.workspace })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name avatar');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const message = new Message({
      workspace: req.body.workspace,
      sender: req.user._id,
      text: req.body.text
    });
    
    const savedMessage = await message.save();
    await savedMessage.populate('sender', 'name avatar');
    
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
