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

test('sign-in page is password-only', async ({ page }) => {
  await page.goto('/chichester/app/sign-in');
  await expect(page.getByRole('button', { name: 'Sign in with password' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
});

// resetPasswordForEmail/updateUser/getUser are real Supabase Auth client
// calls (not our own API routes), so — same documented limitation as the
// rest of this file — nothing past navigation is exercisable without a
// live Supabase project.
test('forgot password link leads to the reset-password flow', async ({ page }) => {
  await page.goto('/chichester/app/sign-in');
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL('/reset-password');
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
});

test('the glass bottom nav is absent when signed out', async ({ page }) => {
  await page.goto('/chichester/app/wallet');
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
});
