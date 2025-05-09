import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "../../../models/User"; 

export async function POST(request: Request) {
  try {
    await connectDB();

    const { displayName, email, photoURL, uid } = await request.json();

    if (!displayName || !email || !uid) {
      return NextResponse.json(
        { message: "Invalid Google user data" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        displayName,
        email,
        photoURL,
        uid,
      });

      await user.save();
    }

    return NextResponse.json(
      { message: "Google user authenticated", user },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("Google Sign-In Error:", error.message);
      return NextResponse.json(
        { message: "Internal server error", error: error.message },
        { status: 500 }
      );
    }

    console.error("Unknown error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: "Unknown error" },
      { status: 500 }
    );
  }
}
