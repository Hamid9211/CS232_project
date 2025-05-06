// /app/api/auth/signin/route.ts

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectDB();

    const { email, password }: { email: string; password: string } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid password" }, { status: 401 });
    }

    return NextResponse.json({ message: "Sign-in successful", user }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Sign-In Error:", error.message);
      return NextResponse.json({ message: "Internal server error", error: error.message }, { status: 500 });
    } else {
      console.error("Unknown error:", error);
      return NextResponse.json({ message: "Internal server error", error: "Unknown error" }, { status: 500 });
    }
  }
}
