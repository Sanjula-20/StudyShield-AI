const mongoose = require('mongoose');

// In-Memory Database Store for fallback mode when MongoDB is not connected
const memoryDb = {
  users: [],
  studySessions: [],
  blockedApps: [],
  studyNotes: [],
  chatMessages: [],
  assessments: [],
  assessmentResults: [],
  topicMastery: [],
  userAnalytics: []
};

let isConnectedToMongo = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studyshield';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    isConnectedToMongo = true;
    console.log('[StudyShield DB] Connected successfully to MongoDB:', mongoURI);
  } catch (error) {
    isConnectedToMongo = false;
    console.log('[StudyShield DB] MongoDB connection unavailable. Operating in high-performance Memory DB mode.');
  }
};

const isMongo = () => isConnectedToMongo;

module.exports = {
  connectDB,
  isMongo,
  memoryDb
};
