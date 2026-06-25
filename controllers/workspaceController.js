import Workspace from '../models/Workspace.js';
import Board from '../models/Board.js';
import Column from '../models/Column.js';
import Card from '../models/Card.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import createNotification from '../utils/createNotification.js';

export const getWorkspaces = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ 
            members:{ $in: [req.user._id] }
        });
        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;
        const workspace = new Workspace({
            name,
            description,
            owner: req.user._id,
            members: [req.user._id]
        });
        await workspace.save();
        res.status(201).json(workspace);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getWorkspaceById = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id)
            .populate('owner', 'username')
            .populate('members', 'username');
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // Check if the user is a member of the workspace
        if (!workspace.members.some(member => member._id.equals(req.user._id))) {
            return res.status(403).json({ message: 'Access denied' });
        }
        res.json(workspace);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        // Check if the user is the owner of the workspace
        if (!workspace.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { name, description } = req.body;
        workspace.name = name;
        workspace.description = description;
        await workspace.save();
        res.json(workspace);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        // Check if the user is the owner of the workspace
        if (!workspace.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Delete all related boards, columns, cards, and messages
        await Board.deleteMany({ workspace: workspace._id });
        await Column.deleteMany({ workspace: workspace._id });
        await Card.deleteMany({ workspace: workspace._id });
        await Message.deleteMany({ workspace: workspace._id });

        // Delete the workspace
        await workspace.deleteOne();
        res.json({ message: 'Workspace deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addMember = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is already a member
        if (workspace.members.includes(user._id)) {
            return res.status(400).json({ message: 'User is already a member' });
        }

        await Workspace.findByIdAndUpdate(
            req.params.id,
            { $push: { members: user._id } },
            { new: true }
        );

        await createNotification(user._id, 'workspace_invite', `You have been added to the workspace: ${workspace.name}`, workspace._id);

        res.json({ message: 'Member added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { workspaceId, userId } = req.params;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        // only the owner can remove members
        if (!workspace.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // prevent removing the owner
        if (workspace.owner.equals(userId)) {
            return res.status(400).json({ message: 'Cannot remove the owner from the workspace' });
        }

        await Workspace.findByIdAndUpdate(
            workspaceId,
            { $pull: { members: userId } },
        );
        res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
