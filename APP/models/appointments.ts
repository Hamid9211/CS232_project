import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  doctorId: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    doctorId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    doctorName: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending'
    },
    reason: { type: String, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
