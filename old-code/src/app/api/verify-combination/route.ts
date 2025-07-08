import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Get combination from environment variable
// Default to the new combination: time, flow, flow, flow
const CORRECT_COMBINATION = process.env.LOCK_COMBINATION
  ? process.env.LOCK_COMBINATION.split(',')
  : ['stack', 'cake', 'cake', 'cake'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { combination } = body;

    if (!combination || !Array.isArray(combination)) {
      return NextResponse.json({ error: 'Invalid combination format' }, { status: 400 });
    }

    // Check if the combination matches
    const isCorrect =
      combination.length === CORRECT_COMBINATION.length &&
      combination.every((item, index) => item === CORRECT_COMBINATION[index]);

    if (isCorrect) {
      // Set a secure HTTP-only cookie that expires in 30 minutes
      const cookieStore = await cookies();
      cookieStore.set('unlock_verified', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 30, // 30 minutes
        path: '/',
      });
    }

    // Don't reveal the correct combination in the response
    return NextResponse.json({
      success: isCorrect,
    });
  } catch (error) {
    console.error('Error verifying combination:', error);
    return NextResponse.json({ error: 'Failed to verify combination' }, { status: 500 });
  }
}
