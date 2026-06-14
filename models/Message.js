import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
