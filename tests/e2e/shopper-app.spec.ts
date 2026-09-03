import { test, expect } from '@playwright/test';

// The shopper app (wallet/discover/offers/profile) is gated by a real
// Supabase Auth session read server-side in each page (requireShopper) —
// unlike the marketing forms, these can't be meaningfully exercised by
// mocking client-side fetches, since there's no live Supabase project in
// this sandbox to actually sign a session into. This just confirms the one
// thing testable without one: an unauthenticated visitor gets redirected
// to sign in rather than seeing wallet data.
test('wallet redirects to sign-in when not signed in', async ({ page }) => {
  await page.goto('/chichester/app/wallet');
  await expect(page).toHaveURL(/\/chichester\/app\/sign-in$/);
  await expect(page.getByRole('heading', { name: 'Sign in to Local' })).toBeVisible();
});

test('the glass bottom nav is absent when signed out', async ({ page }) => {
  await page.goto('/chichester/app/wallet');
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
});
