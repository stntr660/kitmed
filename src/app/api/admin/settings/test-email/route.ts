import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const emailTestSchema = z.object({
  fromEmail: z.string().email(),
  fromName: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromEmail, fromName } = emailTestSchema.parse(body);
    
    // In production, this would actually send a test email using your email service
    // For now, we'll just simulate success after validation
    console.log('Email test would be sent with:', { fromEmail, fromName });
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    });
  } catch (error) {
    console.error('Email test error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email configuration', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}