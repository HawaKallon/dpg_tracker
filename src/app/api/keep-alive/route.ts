import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Simple health check query to keep Supabase warm
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Keep-alive query failed:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    console.log('Keep-alive ping successful');
    return NextResponse.json(
      { message: 'Keep-alive ping successful', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
