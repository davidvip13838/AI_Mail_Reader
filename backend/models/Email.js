import mongoose from 'mongoose';

const emailSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    gmailId: {
        type: String,
        required: true,
        unique: true, // Ensure no duplicates
        index: true
    },
    threadId: {
        type: String,
        index: true
    },
    snippet: {
        type: String,
        default: ''
    },
    subject: {
        type: String,
        default: 'No Subject',
        index: true
    },
    from: {
        type: String,
        required: true,
        index: true
    },
    to: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    body: {
        type: String,
        default: '' // Store full email body
    },
    isRead: {
        type: Boolean,
        default: false
    },
    labels: [{
        type: String
    }]
}, {
    timestamps: true
});

// Composite index for efficient querying by user and date
emailSchema.index({ userId: 1, date: -1 });

const Email = mongoose.model('Email', emailSchema);

export default Email;
