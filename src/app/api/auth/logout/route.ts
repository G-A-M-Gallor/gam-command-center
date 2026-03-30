import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createClient();

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
    }

    // Clear auth cookies regardless of Supabase response
    const cookieStore = await cookies();

    // Clear access token cookie
    cookieStore.set('supabase-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    // Clear refresh token cookie
    cookieStore.set('supabase-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // Expire immediately
      path: '/',
    });

    // Also clear any client-side auth data
    const response = NextResponse.json({
      success: true,
      message: 'התנתק בהצלחה'
    });

    // Instruct browser to clear client-side auth data
    response.headers.set('Clear-Site-Data', '"cookies", "storage"');

    return response;

  } catch (error) {
    console.error('Logout API error:', error);

    // Even if there's an error, try to clear cookies
    const cookieStore = await cookies();
    cookieStore.set('supabase-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });
    cookieStore.set('supabase-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return NextResponse.json(
      { error: 'שגיאה בהתנתקות, אך הנתונים נוקו מהדפדפן' },
      { status: 500 }
    );
  }
}