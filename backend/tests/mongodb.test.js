import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Use the same MongoDB URI from .env (supports both local and Atlas)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-mail-reader-test';

describe('MongoDB Connection Tests', () => {
  beforeAll(async () => {
    // Connect to MongoDB
    try {
      const isAtlas = MONGODB_URI.startsWith('mongodb+srv://');
      const connectionType = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';
      
      console.log(`\n🔌 Connecting to ${connectionType}...`);
      console.log(`   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
      
      await mongoose.connect(MONGODB_URI);
      
      console.log(`✅ Connected to ${connectionType} successfully`);
      console.log(`   Database: ${mongoose.connection.name}`);
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      console.error('   Please check your MONGODB_URI in .env file');
      if (MONGODB_URI.includes('mongodb+srv://')) {
        console.error('   For MongoDB Atlas, ensure:');
        console.error('   - Your IP is whitelisted in Atlas Network Access');
        console.error('   - Your username and password are correct');
        console.error('   - The cluster is running');
      }
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up: Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  });

  describe('Connection Status', () => {
    it('should be connected to MongoDB', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
      const isAtlas = MONGODB_URI.startsWith('mongodb+srv://');
      const connectionType = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';
      console.log(`   ✅ ${connectionType} connection state: CONNECTED`);
    });

    it('should have correct database name', () => {
      const dbName = mongoose.connection.name;
      expect(dbName).toBeTruthy();
      console.log(`   📊 Database name: ${dbName}`);
    });

    it('should have MongoDB URI configured', () => {
      expect(MONGODB_URI).toBeTruthy();
      expect(MONGODB_URI).toMatch(/^mongodb/);
      
      // Check if it's MongoDB Atlas (mongodb+srv://) or local
      const isAtlas = MONGODB_URI.startsWith('mongodb+srv://');
      const connectionType = isAtlas ? 'MongoDB Atlas' : 'Local MongoDB';
      
      // Mask credentials in URI for logging
      const maskedURI = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      console.log(`   🔗 Connection Type: ${connectionType}`);
      console.log(`   🔗 MongoDB URI: ${maskedURI}`);
      
      if (isAtlas) {
        console.log('   ☁️  Using MongoDB Atlas (cloud)');
      } else {
        console.log('   💻 Using Local MongoDB');
      }
    });
  });

  describe('Database Operations', () => {
    let testUserId = null;

    afterEach(async () => {
      // Clean up test user after each test
      if (testUserId) {
        try {
          await User.findByIdAndDelete(testUserId);
          testUserId = null;
        } catch (error) {
          console.warn('   ⚠️  Could not clean up test user:', error.message);
        }
      }
    });

    it('should create a test user in the database', async () => {
      const testUser = new User({
        email: `test-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Test User'
      });

      const savedUser = await testUser.save();
      testUserId = savedUser._id;

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(testUser.email);
      expect(savedUser.password).not.toBe('testpassword123'); // Should be hashed
      expect(savedUser.name).toBe('Test User');
      
      console.log('   ✅ Test user created successfully');
      console.log(`      User ID: ${savedUser._id}`);
      console.log(`      Email: ${savedUser.email}`);
    }, 10000);

    it('should read a user from the database', async () => {
      // Create a test user first
      const testUser = new User({
        email: `test-read-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Test Read User'
      });
      const savedUser = await testUser.save();
      testUserId = savedUser._id;

      // Read the user
      const foundUser = await User.findById(savedUser._id);

      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe(testUser.email);
      expect(foundUser.name).toBe('Test Read User');
      
      console.log('   ✅ User read successfully');
    }, 10000);

    it('should update a user in the database', async () => {
      // Create a test user first
      const testUser = new User({
        email: `test-update-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Original Name'
      });
      const savedUser = await testUser.save();
      testUserId = savedUser._id;

      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        savedUser._id,
        { name: 'Updated Name' },
        { new: true }
      );

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe(testUser.email);
      
      console.log('   ✅ User updated successfully');
    }, 10000);

    it('should find users by email', async () => {
      const testEmail = `test-find-${Date.now()}@example.com`;
      
      // Create a test user
      const testUser = new User({
        email: testEmail,
        password: 'testpassword123',
        name: 'Test Find User'
      });
      const savedUser = await testUser.save();
      testUserId = savedUser._id;

      // Find by email
      const foundUser = await User.findOne({ email: testEmail });

      expect(foundUser).toBeTruthy();
      expect(foundUser.email).toBe(testEmail);
      
      console.log('   ✅ User found by email successfully');
    }, 10000);

    it('should verify password hashing works', async () => {
      const testPassword = 'testpassword123';
      const testUser = new User({
        email: `test-hash-${Date.now()}@example.com`,
        password: testPassword,
        name: 'Test Hash User'
      });
      const savedUser = await testUser.save();
      testUserId = savedUser._id;

      // Password should be hashed
      expect(savedUser.password).not.toBe(testPassword);
      expect(savedUser.password.length).toBeGreaterThan(20); // Bcrypt hashes are long

      // Should be able to compare password
      const isMatch = await savedUser.comparePassword(testPassword);
      expect(isMatch).toBe(true);

      const isWrong = await savedUser.comparePassword('wrongpassword');
      expect(isWrong).toBe(false);
      
      console.log('   ✅ Password hashing and comparison working correctly');
    }, 10000);
  });

  describe('User Model Schema', () => {
    it('should enforce unique email constraint', async () => {
      const testEmail = `test-unique-${Date.now()}@example.com`;
      
      // Create first user
      const user1 = new User({
        email: testEmail,
        password: 'testpassword123',
        name: 'User 1'
      });
      await user1.save();
      const userId1 = user1._id;

      // Try to create second user with same email
      const user2 = new User({
        email: testEmail,
        password: 'testpassword123',
        name: 'User 2'
      });

      await expect(user2.save()).rejects.toThrow();
      
      // Clean up
      await User.findByIdAndDelete(userId1);
      
      console.log('   ✅ Unique email constraint enforced');
    }, 10000);

    it('should have required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
      
      console.log('   ✅ Required fields validation working');
    }, 10000);
  });

  describe('Database Collections', () => {
    it('should list available collections', async () => {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      expect(Array.isArray(collectionNames)).toBe(true);
      console.log('   📚 Available collections:');
      collectionNames.forEach(name => {
        console.log(`      - ${name}`);
      });
    });
  });
});

