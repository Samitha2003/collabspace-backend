import { find, findById, updateMany } from '../models/Notification.js';

// Get all unread notifications for the current user
export async function getNotifications(req, res) {
  try {
    const notifications = await find({
      recipient: req.user._id,
      read: false
    }).sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Mark a notification as read
export async function markAsRead(req, res) {
  try {
    const notification = await findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Security check: verify recipient matches current user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Mark all notifications as read for the current user
export async function markAllAsRead(req, res) {
  try {
    const result = await updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
