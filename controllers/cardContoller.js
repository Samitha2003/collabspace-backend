import Board from "../models/Board";
import Column from "../models/Column";
import Card from "../models/Card";
import Message from "../models/Message";
import Notification from "../models/Notification";
import User from "../models/User";

export const getCards = async (req, res) => {
  try {
    const { column } = req.query;

    const cards = await Card.find({ column }).sort({ order: 1 });

    res.json(cards);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

export const getCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id)
      .populate({ path: 'assignees', select: 'name avatar' })
      .populate({ path: 'column', select: 'title' });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCard = async (req, res) => {
  try {
    const { title, column, createdBy } = req.body;

    const highestOrderCard = await Card.findOne({ column }).sort({ order: -1 });
    const newOrder = (highestOrderCard?.order || 0) + 1;

    const card = new Card({
      title,
      column,
      createdBy,
      order: newOrder
    });

    await card.save();
    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    const card = await Card.findByIdAndUpdate(
      id,
      { title, description, dueDate },
      { new: true }
    );

    if (!card) return res.status(404).json({ message: 'Card not found' });

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const moveCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { columnId, order } = req.body;

    if (!columnId || typeof order !== 'number') {
      return res.status(400).json({ message: 'columnId and order are required' });
    }

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    card.column = columnId;
    card.order = order;

    await card.save();

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    // add user to assignees without duplicating
    const card = await Card.findByIdAndUpdate(
      id,
      { $addToSet: { assignees: userId } },
      { new: true }
    ).populate({ path: 'assignees', select: 'name avatar' });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    // create a notification for the assigned user
    try {
      await Notification.create({
        user: userId,
        type: 'card_assignment',
        message: `You were assigned to card: ${card.title}`,
        reference: card._id
      });
    } catch (notifErr) {
      // Log but don't fail the whole request
      console.error('Notification creation failed', notifErr);
    }

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unassignUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const card = await Card.findByIdAndUpdate(
      id,
      { $pull: { assignees: userId } },
      { new: true }
    ).populate({ path: 'assignees', select: 'name avatar' });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: 'Card not found' });

    const columnId = card.column;
    const deletedOrder = card.order;

    await Card.findByIdAndDelete(id);

    // decrement order of cards in same column that were after the deleted card
    await Card.updateMany(
      { column: columnId, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    // remove messages and notifications referencing this card
    try {
      await Message.deleteMany({ card: id });
      await Notification.deleteMany({ reference: id });
    } catch (cleanupErr) {
      console.error('Cleanup after card deletion failed', cleanupErr);
    }

    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

