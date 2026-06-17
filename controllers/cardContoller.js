import Board from "../models/Board.js";
import Column from "../models/Column.js";
import Card from "../models/Card.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";
import { io } from "../server.js";

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
    const { title, column, createdBy, attachments } = req.body;

    const highestOrderCard = await Card.findOne({ column }).sort({ order: -1 });
    const newOrder = (highestOrderCard?.order || 0) + 1;

    const card = new Card({
      title,
      column,
      createdBy,
      order: newOrder,
      ...(Array.isArray(attachments) ? { attachments } : {})
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
    const { title, description, dueDate, attachmentUrl } = req.body;

    const updateData = { $set: {} };

    if (title !== undefined) updateData.$set.title = title;
    if (description !== undefined) updateData.$set.description = description;
    if (dueDate !== undefined) updateData.$set.dueDate = dueDate;

    if (Object.keys(updateData.$set).length === 0) {
      delete updateData.$set;
    }

    if (attachmentUrl) {
      updateData.$push = { attachments: attachmentUrl };
    }

    if (!updateData.$set && !updateData.$push) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const card = await Card.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!card) return res.status(404).json({ message: 'Card not found' });

    const column = await Column.findById(card.column).populate('board');
    if (column && column.board) {
      const workspaceId = column.board.workspace.toString();
      io.to(workspaceId).emit("cardUpdated", card);
    }

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

    const column = await Column.findById(columnId).populate('board');
    if (column && column.board) {
      const workspaceId = column.board.workspace.toString();
      io.to(workspaceId).emit("cardMoved", card);
    }

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
      const notification = await Notification.create({
        recipient: userId,
        type: 'card_assigned',
        message: `You were assigned to card: ${card.title}`,
        relatedCard: card._id
      });

      io.to(userId).emit("newNotification", notification);
      
    } catch (notifErr) {
      // Log but don't fail the whole request
      console.error('Notification creation failed', notifErr);
    }

    const column = await Column.findById(card.column).populate('board');
    if (column && column.board) {
      const workspaceId = column.board.workspace.toString();
      io.to(workspaceId).emit("cardAssigned", card);
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

    const column = await Column.findById(columnId).populate('board');
    if (column && column.board) {
      const workspaceId = column.board.workspace.toString();
      io.to(workspaceId).emit("cardDeleted", { cardId: id, columnId });
    }

    res.json({ message: 'Card deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const { url, public_id } = req.body;

    if (!url && !public_id) {
      return res.status(400).json({ message: 'url or public_id is required' });
    }

    const extractPublicIdFromUrl = (attachmentUrl) => {
      try {
        const parts = attachmentUrl.split('/upload/');
        if (parts.length < 2) return null;

        let pathPart = parts[1];
        pathPart = pathPart.replace(/^v\d+\//, '');
        pathPart = pathPart.split('?')[0];
        pathPart = pathPart.replace(/\.[^/.]+$/, '');

        return pathPart || null;
      } catch {
        return null;
      }
    };

    const cloudinaryPublicId = public_id || extractPublicIdFromUrl(url);
    if (!cloudinaryPublicId) {
      return res.status(400).json({ message: 'Invalid URL or public_id' });
    }

    await cloudinary.uploader.destroy(cloudinaryPublicId);

    let attachmentUrlToPull = url;
    if (!attachmentUrlToPull) {
      const existingCard = await Card.findById(id).select('attachments');
      if (!existingCard) return res.status(404).json({ message: 'Card not found' });

      attachmentUrlToPull = (existingCard.attachments || []).find((att) =>
        typeof att === 'string' ? att.includes(cloudinaryPublicId) : false
      );
    }

    const updateQuery = attachmentUrlToPull
      ? { $pull: { attachments: attachmentUrlToPull } }
      : {};

    const card = await Card.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true
    });

    if (!card) return res.status(404).json({ message: 'Card not found' });

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




