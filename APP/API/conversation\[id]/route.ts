import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import Message from "../../../models/messageModel";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const messages = await Message.find({ userEmail: params.id }).sort({ createdAt: 1 });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching messages:", error.message);
      return NextResponse.json(
        { message: "Error fetching messages", error: error.message },
        { status: 500 }
      );
    } else {
      console.error("Unknown error:", error);
      return NextResponse.json(
        { message: "Error fetching messages", error: "Unknown error" },
        { status: 500 }
      );
    }
  }
}
