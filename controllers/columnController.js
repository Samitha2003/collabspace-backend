import Workspace from '../models/Workspace.js';
import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Card from '../models/Card.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const createColumn = async (req, res) => {
	try {
		const { title, boardId } = req.body;
		if (!title || !boardId) return res.status(400).json({ message: 'title and boardId required' });

		// find highest order in the board
		const last = await Column.findOne({ board: boardId }).sort({ order: -1 }).exec();
		const order = last && typeof last.order === 'number' ? last.order + 1 : 1;

		const column = await Column.create({ title, board: boardId, order });
		return res.status(201).json(column);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

export const updateColumn = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, order } = req.body;
		const column = await Column.findById(id);
		if (!column) return res.status(404).json({ message: 'Column not found' });

		const boardId = column.board.toString();

		// If order is provided and different, reorder other columns
		if (typeof order === 'number' && order !== column.order) {
			// Get other columns in the same board ordered by current order
			const others = await Column.find({ board: boardId, _id: { $ne: column._id } }).sort({ order: 1 }).exec();

			// Build new ordering array: insert this column at the desired position
			const newOrder = [];
			const insertPos = Math.max(0, Math.min(order - 1, others.length)); // zero-based

			for (let i = 0; i < insertPos; i++) newOrder.push(others[i]);
			newOrder.push(column);
			for (let i = insertPos; i < others.length; i++) newOrder.push(others[i]);

			// Reassign orders sequentially starting at 1
			const bulkOps = newOrder.map((col, idx) => ({
				updateOne: {
					filter: { _id: col._id },
					update: { $set: { order: idx + 1 } },
				},
			}));

			if (bulkOps.length) await Column.bulkWrite(bulkOps);
		}

		if (title) column.title = title;
		// If order was provided we already updated DB; ensure returned column has latest data
		await column.reload?.();
		const updated = await Column.findById(id);
		return res.json(updated);
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};

export const deleteColumn = async (req, res) => {
	try {
		const { id } = req.params;
		const column = await Column.findById(id);
		if (!column) return res.status(404).json({ message: 'Column not found' });

		await Column.deleteOne({ _id: id });
		await Card.deleteMany({ column: id });

		// After deletion, re-normalize orders in the board
		const others = await Column.find({ board: column.board }).sort({ order: 1 }).exec();
		const bulkOps = others.map((col, idx) => ({
			updateOne: { filter: { _id: col._id }, update: { $set: { order: idx + 1 } } },
		}));
		if (bulkOps.length) await Column.bulkWrite(bulkOps);

		return res.json({ message: 'Column and its cards deleted' });
	} catch (err) {
		return res.status(500).json({ message: err.message });
	}
};
