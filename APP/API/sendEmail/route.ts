import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request): Promise<Response> {
  try {
    console.log("POST /api/sendEmail called");
    const { name, email, subject, message } = await request.json();
    console.log("Received payload:", { name, email, subject, message });

    console.log("Sending email using Resend...");
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.RESEND_TO_EMAIL!,
      subject: `New message from ${name}: ${subject}`,
      text: `
        You have a new message from your contact form.
        
        Name: ${name}
        Email: ${email}
        Message: ${message}
      `,
      html: `
        <p>You have a new message from your contact form.</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/> ${message}</p>
      `,
    });
    console.log("Email sent successfully:", response);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: error.toString() },
      { status: 500 }
    );
  }
}
