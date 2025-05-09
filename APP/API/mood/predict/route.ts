import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import MoodLog from '../../../models/MoodLog';

export async function POST(req: Request) {
  try {
    console.log("POST /api/mood/predict endpoint hit");
    await connectDB();

    const data = await req.json();
    console.log("Payload received from frontend:", data);
    const { stress, happiness, energy, focus, calmness, description, date, userId } = data;
    
    if (!userId) {
      console.error("User ID is missing in the payload");
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const userMessage = `Mood data for ${date}:
Stress: ${stress}
Happiness: ${happiness}
Energy: ${energy}
Focus: ${focus}
Calmness: ${calmness}
Additional notes: ${description}

Please provide an analysis or prediction based on this mood data.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    console.log("Sending request to OpenAI with message:", userMessage);
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      console.error("OpenAI API error, status:", aiResponse.status);
      throw new Error(`AI API responded with status ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("Response from OpenAI API:", aiData);
    const prediction = aiData?.choices?.[0]?.message?.content || "No prediction available.";

    const moodLog = new MoodLog({
      stress,
      happiness,
      energy,
      focus,
      calmness,
      description,
      date,
      prediction,
      userId: userId, 
      createdAt: new Date()
    });
    
    console.log("Saving mood log with userId:", userId);
    await moodLog.save();
    console.log("Mood log saved successfully");

    return NextResponse.json({ prediction }, { status: 200 });
  } catch (error: any) {
    console.error("Error processing mood data:", error);
    return NextResponse.json(
      { message: "Error processing mood data", error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}