import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const bootstrapSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!bootstrapSecret || !serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        {
          error:
            'Server admin bootstrap is disabled. Assign role = "admin" on public.pr_profiles via Supabase SQL Editor.',
        },
        { status: 403 }
      );
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Backend unavailable.' }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
    }

    const { secret } = (await request.json()) as { secret?: string };
    if (!secret) {
      return NextResponse.json({ error: 'Bootstrap secret required.' }, { status: 400 });
    }

    const a = Buffer.from(secret);
    const b = Buffer.from(bootstrapSecret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid bootstrap secret.' }, { status: 403 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error } = await adminClient
      .from('pr_profiles')
      .update({ role: 'admin' })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
