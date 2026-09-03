import { redirect } from 'next/navigation';

// "/business anchors to S7 with merchant form open" — the whole homepage is
// one page (S1-S11 all live at "/"), so this route just lands on the right
// section of it rather than duplicating the content under a second URL.
export default function BusinessRedirectPage() {
  redirect('/#business');
}
