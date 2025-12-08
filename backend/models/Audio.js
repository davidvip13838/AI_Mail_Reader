import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  textPreview: {
    type: String,
    default: ''
  },
  voiceId: {
    type: String,
    default: null
  },
  fileSize: {
    type: Number,
    default: 0
  },
  // Generation options
  emailCount: {
    type: Number,
    default: 10
  },
  dateFilter: {
    type: String,
    default: 'all'
  }
}, {
  timestamps: true
});

// Index for faster queries
audioSchema.index({ userId: 1, createdAt: -1 });

const Audio = mongoose.model('Audio', audioSchema);

export default Audio;

