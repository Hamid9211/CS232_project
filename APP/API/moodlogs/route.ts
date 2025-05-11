import { NextResponse, NextRequest } from 'next/server';
import connectDB from '@/lib/mongoose';
import MoodLog from '../../models/MoodLog';
import User from '../../models/User';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  await connectDB();
  console.log("Connected to Database");

  const userEmail = request.cookies.get('userEmail')?.value;
  console.log("User email from cookies:", userEmail);

  if (!userEmail) {
    console.error("Error: User email not provided in cookie.");
    const response: ApiResponse = { success: false, error: 'User email not provided in cookie.' };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const user = await User.findOne({ email: userEmail });
    console.log("Found user:", user);
    if (!user) {
      console.error(`Error: User not found for email ${userEmail}`);
      const response: ApiResponse = { success: false, error: 'User not found.' };
      return NextResponse.json(response, { status: 404 });
    }

    const moodLogs = await MoodLog.find({ userId: user._id }).sort({ createdAt: -1 });
    console.log("Fetched mood logs:", moodLogs);

    const response: ApiResponse = { success: true, data: moodLogs };
    return NextResponse.json(response);
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error while fetching mood logs:", error);
    const response: ApiResponse = { success: false, error: errorMessage };
    return NextResponse.json(response, { status: 400 });
  }
}