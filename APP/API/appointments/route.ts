import { NextRequest, NextResponse } from 'next/server';
import { parseISO, format } from 'date-fns';
import connectDB from '../../../lib/mongoose';
import Appointment from '../../models/Appointment';
import DoctorSchedule from '../../models/DoctorSchedule';

// Define a type for a schedule item
interface ScheduleItem {
  day: string;
  slots: {
    startTime: string;
    endTime: string;
  }[];
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');

    if (!doctorId && !patientId) {
      return NextResponse.json(
        { error: 'Either doctorId or patientId is required' },
        { status: 400 }
      );
    }

    const query = doctorId ? { doctorId } : { patientId };
    const appointments = await Appointment.find(query).sort({ date: 1, startTime: 1 });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { doctorId, patientId, patientName, doctorName, date, startTime, endTime, reason } = body;

    if (!doctorId || !patientId || !patientName || !doctorName || !date || !startTime || !endTime || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use parseISO to correctly parse the date from the ISO string.
    const appointmentDate = parseISO(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDate.getDay()];

    // Fetch the doctor's schedule
    const doctorSchedule = await DoctorSchedule.findOne({ doctorId });
    if (!doctorSchedule) {
      return NextResponse.json(
        { error: 'Doctor schedule not found' },
        { status: 404 }
      );
    }

    // Find the schedule for the computed day with an explicit type for 's'
    const daySchedule = doctorSchedule.schedule.find((s: ScheduleItem) => s.day === dayOfWeek);
    if (!daySchedule) {
      return NextResponse.json(
        { error: 'Doctor is not available on this day' },
        { status: 400 }
      );
    }

    // Check if the date is in the doctor's unavailable dates.
    if (doctorSchedule.unavailableDates.includes(format(appointmentDate, 'yyyy-MM-dd'))) {
      return NextResponse.json(
        { error: 'Doctor is not available on this date' },
        { status: 400 }
      );
    }

    const newAppointment = new Appointment({
      doctorId,
      patientId,
      patientName,
      doctorName,
      date: appointmentDate,
      startTime,
      endTime,
      reason,
      status: 'confirmed'
    });

    await newAppointment.save();

    return NextResponse.json({ 
      success: true, 
      appointment: newAppointment 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    if (error instanceof Error && error.name === 'MongoServerError' && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
