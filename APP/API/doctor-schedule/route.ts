import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import DoctorSchedule from '../../models/DoctorSchedule';

type ScheduleSlot = {
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  day: string;
  slots: ScheduleSlot[];
};

type ScheduleData = {
  doctorId: string;
  schedule: DaySchedule[];
  unavailableDates?: string[];
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { doctorId, schedule, unavailableDates = [] } = body as ScheduleData;
    
    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }
    
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return NextResponse.json({ error: 'Valid schedule is required' }, { status: 400 });
    }

    for (const daySchedule of schedule) {
      if (!daySchedule.day || !daySchedule.slots || !Array.isArray(daySchedule.slots)) {
        return NextResponse.json({ error: 'Invalid schedule format' }, { status: 400 });
      }
      
      for (const slot of daySchedule.slots) {
        if (!slot.startTime || !slot.endTime) {
          return NextResponse.json({ error: 'Each slot must have startTime and endTime' }, { status: 400 });
        }
        
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return NextResponse.json({ error: 'Time must be in HH:MM format' }, { status: 400 });
        }
        
        if (slot.startTime >= slot.endTime) {
          return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
        }
      }
    }

    const existingSchedule = await DoctorSchedule.findOne({ doctorId });

    if (existingSchedule) {
      existingSchedule.schedule = schedule;
      existingSchedule.unavailableDates = unavailableDates;
      await existingSchedule.save();
      
      return NextResponse.json({
        message: 'Doctor schedule updated successfully',
        schedule: existingSchedule
      });
    } else {
      const newSchedule = await DoctorSchedule.create({
        doctorId,
        schedule,
        unavailableDates
      });
      
      return NextResponse.json({
        message: 'Doctor schedule created successfully',
        schedule: newSchedule
      });
    }
  } catch (error) {
    console.error('Error updating doctor schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update doctor schedule' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      );
    }

    const doctorSchedule = await DoctorSchedule.findOne({ doctorId });

    if (!doctorSchedule) {
      return NextResponse.json(
        { message: 'No schedule found for this doctor' },
        { status: 200 }
      );
    }

    return NextResponse.json({ schedule: doctorSchedule });
  } catch (error) {
    console.error('Error fetching doctor schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctor schedule' },
      { status: 500 }
    );
  }
}
