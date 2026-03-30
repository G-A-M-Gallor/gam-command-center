import { NextRequest, NextResponse } from 'next/server';
import { _createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { loginSchema } from '@/lib/api/schemas';

export async function POST(_request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'שגיאת ולידציה', details: result.error.issues },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // Create Supabase client
    const supabase = await createClient();

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username.includes('@') ? username : `${username}@gam.local`, // Support username or email
      password,
    });

    if (error) {
      console.error('Login error:', error);

      // Return user-friendly Hebrew error messages
      let errorMessage = 'שגיאת התחברות';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'שם משתמש או סיסמה שגויים';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'כתובת האימייל לא מאושרת';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'יותר מדי ניסיונות התחברות - נסה שוב מאוחר יותר';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    if (!data._user || !data.session) {
      return NextResponse.json(
        { error: 'שגיאה פנימית - נתוני המשתמש לא זמינים' },
        { status: 500 }
      );
    }

    // Set secure cookies for session management
    const cookieStore = await cookies();

    // Set access token cookie (httpOnly for security)
    cookieStore.set('supabase-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.session.expires_in || 3600,
      path: '/',
    });

    // Set refresh token cookie (httpOnly for security)
    if (data.session.refresh_token) {
      cookieStore.set('supabase-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    // Return success response with user info (no sensitive data)
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
        role: data._user.role,
      },
      session: {
        expires_at: data.session.expires_at,
        expires_in: data.session.expires_in,
      },
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'שגיאת שרת פנימית' },
      { status: 500 }
    );
  }
}