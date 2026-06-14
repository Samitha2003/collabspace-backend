import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        column: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Column',
            required: true,
        },
        assignees: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        attachments: [
            {
                type: String, // URL of the attachment
            },
        ],
        dueDate: {
            type: Date,
            default: null,
        },
        order: {
            type: Number,
            required: true,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model('Card', cardSchema);