import mongoose from 'mongoose';

const userAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Personal information
  interests: [{
    type: String
  }],
  hobbies: [{
    type: String
  }],
  // Education
  school: {
    type: String,
    default: null
  },
  university: {
    type: String,
    default: null
  },
  // Work information
  company: {
    type: String,
    default: null
  },
  jobTitle: {
    type: String,
    default: null
  },
  supervisor: {
    name: String,
    email: String
  },
  // Relationships
  bestFriend: {
    name: String,
    email: String
  },
  closeContacts: [{
    name: String,
    email: String,
    relationship: String // friend, colleague, family, etc.
  }],
  // Location
  location: {
    city: String,
    state: String,
    country: String
  },
  // Additional insights
  frequentTopics: [{
    topic: String,
    frequency: Number
  }],
  communicationStyle: {
    type: String,
    default: null
  },
  // Analysis metadata
  analyzedEmailCount: {
    type: Number,
    default: 0
  },
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  insights: {
    type: String, // General insights text
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
userAnalysisSchema.index({ userId: 1 });

const UserAnalysis = mongoose.model('UserAnalysis', userAnalysisSchema);

export default UserAnalysis;

