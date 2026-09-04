import { test, expect } from '@playwright/test';

// Marketing site DoD: "Playwright: both forms submit; live/coming-soon/
// planned success states; /chichester pre-fills." Same approach as the
// product's happy-path suite — API calls are mocked at the network
// boundary since this sandbox has no live Supabase project to seed.
//
// The shopper/merchant forms live on their own pages now (/shoppers,
// /business), not inline on the homepage — see HomePageContent.tsx.

test('/chichester pre-fills the hero pill; /chichester/shoppers pre-fills the form', async ({ page }) => {
  await page.goto('/chichester');
  await expect(page.getByText('Launching in Chichester · Autumn 2026')).toBeVisible();

  await page.goto('/chichester/shoppers');
  await expect(page.locator('#shopper-form select[name="townSlug"]')).toHaveValue('chichester');
});

test('header sign-in link takes an existing shopper to /sign-in', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/sign-in');
  await expect(page.getByRole('heading', { name: 'Sign in to Local' })).toBeVisible();
});

test('burger menu links to the shopper and business pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'For shoppers' }).click();
  await expect(page).toHaveURL('/shoppers');

  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('link', { name: 'For businesses' }).click();
  await expect(page).toHaveURL('/business');
});

test('shopper form: live town shows wallet buttons on success', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.email).toBe('laura@example.com');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'live', townName: 'Chichester' }),
    });
  });

  await page.goto('/chichester/shoppers');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(page.getByText("You're in! Add your pass now:")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to Apple Wallet' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to Google Wallet' })).toBeVisible();
});

// Regression test: Apple/Google Wallet needing real certs/credentials is a
// known deploy blocker (README), which makes /api/pass return a 503 — but
// it still creates the pass row and returns its id, so the shopper must
// still be able to reach /[town]/claim rather than getting stuck on a bare
// error with no way to set up their account.
test('shopper form: wallet-not-configured error still surfaces a claim link', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'live', townName: 'Chichester' }),
    });
  });
  await page.route('**/api/pass', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'google_wallet_not_configured',
        message: 'Google Wallet is not configured yet.',
        passId: '11111111-1111-1111-1111-111111111111',
      }),
    });
  });

  await page.goto('/chichester/shoppers');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form button[type="submit"]').click();
  await page.getByRole('button', { name: 'Add to Google Wallet' }).click();

  await expect(page.getByText('Google Wallet is not configured yet.')).toBeVisible();
  const claimLink = page.getByRole('link', { name: 'Set up your account →' });
  await expect(claimLink).toBeVisible();
  await expect(claimLink).toHaveAttribute(
    'href',
    '/chichester/claim?passId=11111111-1111-1111-1111-111111111111',
  );
});

test('shopper form: coming-soon town shows the waiting-list message', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'coming-soon', townName: 'Chichester' }),
    });
  });

  await page.goto('/chichester/shoppers');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(page.getByText("You're in. We'll tell you the day Chichester goes live.")).toBeVisible();
});

test('shopper form: planned/other town shows the vote count', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.townFreeText).toBe('Bognor Regis');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'planned', townName: 'Bognor Regis', count: 7 }),
    });
  });

  await page.goto('/shoppers');
  await page.locator('#shopper-form select[name="townSlug"]').selectOption('__other__');
  await page.locator('#shopper-form input[name="townFreeText"]').fill('Bognor Regis');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(page.getByText('Thanks — you just voted for Bognor Regis.')).toBeVisible();
  await expect(page.getByText('7 people in Bognor Regis want Local.')).toBeVisible();
});

test('merchant form submits and shows the trial-booking message', async ({ page }) => {
  await page.route('**/api/lead', async (route) => {
    const body = route.request().postDataJSON();
    expect(body).toMatchObject({
      businessName: 'The Roastery',
      contactName: 'Sam Roaster',
      venues: '5+',
    });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });

  await page.goto('/business');
  await page.locator('#merchant-form input[name="businessName"]').fill('The Roastery');
  await page.locator('#merchant-form input[name="contactName"]').fill('Sam Roaster');
  await page.locator('#merchant-form input[name="email"]').fill('sam@theroastery.example');
  await page.locator('#merchant-form select[name="townSlug"]').selectOption('chichester');
  await page.locator('#merchant-form select[name="venues"]').selectOption('5+');
  await page.locator('#merchant-form button[type="submit"]').click();

  await expect(page.getByText("Thanks — we'll be in touch within 2 working days to book your trial.")).toBeVisible();
});
