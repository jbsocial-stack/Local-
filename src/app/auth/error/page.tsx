const MESSAGES: Record<string, string> = {
  missing_code: 'That sign-in link is incomplete — request a new one.',
  exchange_failed: 'That sign-in link has expired — request a new one.',
  pass_not_found: 'We could not find that pass.',
  already_claimed_by_someone_else: 'This pass is already linked to a different account.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = (reason && MESSAGES[reason]) ?? 'Something went wrong signing you in.';
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6 text-center">
      <p className="text-red-600 font-medium">{message}</p>
    </main>
  );
}
