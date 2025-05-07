import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export const POST = async (request: Request) => {
  try {
    await connectDB();

    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    let user = await User.findOne({ email });

    if (user) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      displayName: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
    });

    await user.save();

    return NextResponse.json({ message: "User registered successfully", user }, { status: 201 });
  } catch (error: any) {
    console.error("Sign-Up Error:", error);
    return NextResponse.json(
      { 
        message: "Internal server error", 
        error: error?.message || "Unknown error occurred" 
      }, 
      { status: 500 }
    );
  }
};
