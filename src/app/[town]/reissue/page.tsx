import { createRouteHandlerSupabaseClient } from '@/lib/supabase/route-handler';
import { ReissueButtons } from './ReissueButtons';
import { ReissueSignIn } from './ReissueSignIn';

// R9: "supports pass re-issue to a new device." Reached by a shopper who
// has already claimed their account (R9's email claim) and lost their phone.
export default async function ReissuePage({ params }: { params: Promise<{ town: string }> }) {
  const { town } = await params;
  const supabase = await createRouteHandlerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6">
      {user ? <ReissueButtons town={town} /> : <ReissueSignIn town={town} />}
    </main>
  );
}
