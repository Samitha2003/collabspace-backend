import mongoose from 'mongoose';

const boardSchema = new mongoose.Schema(
  {
    name: {
        type: String,
        required: true,
        trim: true,
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
},
{ timestamps: true }
);

export default mongoose.model('Board', boardSchema);
    