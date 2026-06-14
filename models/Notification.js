import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['card_assigned', 'new_comment', 'workspace_invite'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);