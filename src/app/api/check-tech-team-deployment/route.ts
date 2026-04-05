import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Call the test-tech-team Edge Function to check deployment status
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-tech-team`,
      {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error checking tech team deployment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check deployment status',
        deployment_status: {
          tables_exist: false,
          functions_exist: false,
          team_members_count: 0,
          team_members: []
        }
      },
      { status: 500 }
    );
  }
}