import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    trim: true
  },
  // Store Gmail OAuth tokens
  gmailAccessToken: {
    type: String,
    default: null
  },
  gmailRefreshToken: {
    type: String,
    default: null
  },
  gmailTokenExpiry: {
    type: Date,
    default: null
  },
  // Store user preferences
  preferences: {
    defaultVoiceId: {
      type: String,
      default: '21m00Tcm4TlvDq8ikWAM'
    },
    autoGenerateAudio: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to remove sensitive data before sending to client
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

export default User;

