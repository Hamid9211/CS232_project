import mongoose from 'mongoose';

const MoodLogSchema = new mongoose.Schema({
  stress: { type: Number, required: true },
  happiness: { type: Number, required: true },
  energy: { type: Number, required: true },
  focus: { type: Number, required: true },
  calmness: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  prediction: { type: String, required: true },
  userId: { 
    type: String, 
    required: true
  },
  createdAt: { type: Date, default: Date.now }
});

const MoodLog = mongoose.models.MoodLog || mongoose.model('MoodLog', MoodLogSchema);

export default MoodLog;
