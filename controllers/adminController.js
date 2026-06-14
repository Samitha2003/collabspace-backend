import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';

// Get workspace users with populated member details
export const getWorkspaceUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id).populate('members', 'name email role avatar');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    res.status(200).json(workspace.members);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspace users', error: error.message });
  }
};

// Change user role in workspace
export const changeUserRole = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Find the member in the workspace
    const memberIndex = workspace.members.findIndex(member => member._id.toString() === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ message: 'User not found in workspace' });
    }
    
    // Prevent owner from being demoted
    if (workspace.members[memberIndex].role === 'owner' && role !== 'owner') {
      return res.status(403).json({ message: 'Cannot demote workspace owner' });
    }
    
    workspace.members[memberIndex].role = role;
    await workspace.save();
    
    res.status(200).json({ message: 'User role updated successfully', member: workspace.members[memberIndex] });
  } catch (error) {
    res.status(500).json({ message: 'Error changing user role', error: error.message });
  }
};

// Remove user from workspace
export const removeUser = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const requesterId = req.user.id; // Assuming user is attached to request
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Verify requester is the owner
    const isOwner = workspace.owner.toString() === requesterId;
    if (!isOwner) {
      return res.status(403).json({ message: 'Only workspace owner can remove members' });
    }
    
    // Pull user from members array
    workspace.members = workspace.members.filter(member => member._id.toString() !== userId);
    await workspace.save();
    
    res.status(200).json({ message: 'User removed from workspace' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing user', error: error.message });
  }
};

// Get workspace statistics
export const getWorkspaceStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Count total cards across all boards in workspace
    const totalCards = await Card.countDocuments({ boardId: { $in: workspace.boards } });
    
    // Count cards in "Done" columns
    const doneCards = await Card.countDocuments({
      boardId: { $in: workspace.boards },
      columnId: { $in: await Board.find({ _id: { $in: workspace.boards } }).select('columns').then(boards => 
        boards.flatMap(b => b.columns.filter(c => c.name === 'Done').map(c => c._id))
      )}
    });
    
    // Count active members
    const activeMembers = workspace.members.length;
    
    const stats = {
      totalCards,
      doneCards,
      activeMembers
    };
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workspace stats', error: error.message });
  }
};
