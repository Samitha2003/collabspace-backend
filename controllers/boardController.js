import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Card from '../models/Card.js';
import Workspace from '../models/Workspace.js';

export const getBoards = async (req, res) => {
    try {
        const { workspace: workspaceId } = req.query;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        // Verify the requesting user is a member of the workspace
        const userId = req.user && (req.user.id || req.user._id);
        const isMember = workspace.members && workspace.members.some(m => m.toString() === String(userId));
        if (!isMember) return res.status(403).json({ message: 'Access denied' });

        const boards = await Board.find({ workspace: workspaceId });
        return res.status(200).json(boards);
    } catch (error) {
        console.error('Error fetching boards:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const createBoard = async (req, res) => {
    try {
        const { workspace: workspaceId, name } = req.body;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const userId = req.user && (req.user.id || req.user._id);
        const isMember = workspace.members && workspace.members.some(m => m.toString() === String(userId));
        if (!isMember) return res.status(403).json({ message: 'Access denied' });

        const board = await Board.create({
            name,
            workspace: workspaceId,
            createdBy: userId,
        });

        await Column.insertMany([
            { name: 'To Do', order: 0, board: board._id },
            { name: 'In Progress', order: 1, board: board._id },
            { name: 'Done', order: 2, board: board._id },
        ]);

        return res.status(201).json(board);
    } catch (error) {
        console.error('Error creating board:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const getBoard = async (req, res) => {
    try {
        const { id } = req.params;

        const board = await Board.findById(id);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const columns = await Column.find({ board: id }).sort({ order: 1 });

        return res.status(200).json({ ...board.toObject(), columns });
    } catch (error) {
        console.error('Error fetching board:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const updateBoard = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const board = await Board.findById(id);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const workspace = await Workspace.findById(board.workspace);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const userId = req.user && (req.user.id || req.user._id);
        const isMember = workspace.members && workspace.members.some(m => m.toString() === String(userId));
        if (!isMember) return res.status(403).json({ message: 'Access denied' });

        board.name = name;
        await board.save();

        return res.status(200).json(board);
    } catch (error) {
        console.error('Error updating board:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const deleteBoard = async (req, res) => {
    try {
        const { id } = req.params;

        const board = await Board.findById(id);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const workspace = await Workspace.findById(board.workspace);
        if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

        const userId = req.user && (req.user.id || req.user._id);
        const isMember = workspace.members && workspace.members.some(m => m.toString() === String(userId));
        if (!isMember) return res.status(403).json({ message: 'Access denied' });

        await Column.deleteMany({ board: id });
        await Card.deleteMany({ board: id });
        await Board.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Board deleted successfully' });
    } catch (error) {
        console.error('Error deleting board:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

