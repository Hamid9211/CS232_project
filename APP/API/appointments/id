import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Appointment from '../../../models/Appointment';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const body = await req.json();
    const { status, notes } = body;
    
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    
    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    appointment.status = status;
    if (notes) appointment.notes = notes;
    await appointment.save();
    
    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const result = await Appointment.findByIdAndDelete(params.id);
    if (!result) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
