import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exercise = searchParams.get('exercise');

    if (!exercise) {
      return NextResponse.json(
        { error: 'exercise is required' },
        { status: 400 }
      );
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { data: dailyRows, error: dailyError } = await supabase
      .from('v_form_daily')
      .select('date, avg_score, p95_score, rom_mean')
      .eq('user_id', userId)
      .eq('exercise', exercise)
      .order('date', { ascending: true });

    if (dailyError) throw dailyError;

    const { data: rollingRows, error: rollingError } = await supabase
      .from('mv_form_rolling_28d')
      .select('date, avg28d, delta7d')
      .eq('user_id', userId)
      .eq('exercise', exercise)
      .order('date', { ascending: true });

    if (rollingError) throw rollingError;

    const daily = (dailyRows || []).map((r: any) => ({
      date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10),
      avg: r.avg_score ?? null,
      p95: r.p95_score ?? null,
      rom: r.rom_mean ?? null,
    }));

    const rolling = (rollingRows || []).map((r: any) => {
      const delta: number = r.delta7d ?? 0;
      const trend: 'up' | 'flat' | 'down' = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
      return {
        date: typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10),
        avg28d: r.avg28d ?? null,
        delta7d: delta,
        trend,
      };
    });

    return NextResponse.json({ daily, rolling });
  } catch (error) {
    console.error('Progress trends error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress trends' },
      { status: 500 }
    );
  }
}


