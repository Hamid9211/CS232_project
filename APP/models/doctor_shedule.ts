import mongoose, { Schema } from 'mongoose';

const SlotSchema = new Schema({
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  }
});

const DayScheduleSchema = new Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  slots: [SlotSchema]
});

const DoctorScheduleSchema = new Schema(
  {
    doctorId: {
      type: String,
      required: true,
      unique: true
    },
    schedule: [DayScheduleSchema],
    unavailableDates: [String]
  },
  { timestamps: true }
);

const DoctorSchedule = mongoose.models.DoctorSchedule || 
  mongoose.model('DoctorSchedule', DoctorScheduleSchema);

export default DoctorSchedule;
