import { test, expect } from '@playwright/test';

// Marketing site DoD: "Playwright: both forms submit; live/coming-soon/
// planned success states; /chichester pre-fills." Same approach as the
// product's happy-path suite — API calls are mocked at the network
// boundary since this sandbox has no live Supabase project to seed.
//
// The shopper/merchant forms live on their own pages now (/shoppers,
// /business), not inline on the homepage — see HomePageContent.tsx.
// Chichester is the one `live` town in config/towns.ts, so it's the one
// that gets the password field and a real account+pass on signup; every
// other configured town is `planned` and stays on the waitlist path.

test('/chichester pre-fills the hero pill (live); /chichester/shoppers pre-fills the form and asks for a password', async ({
  page,
}) => {
  await page.goto('/chichester');
  await expect(page.getByText('Live now in Chichester')).toBeVisible();

  await page.goto('/chichester/shoppers');
  await expect(page.locator('#shopper-form select[name="townSlug"]')).toHaveValue('chichester');
  await expect(page.locator('#shopper-form input[name="password"]')).toBeVisible();
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

// One form, one step: signing up for a live town creates the account, the
// pass, and a signed-in session in a single request, then sends the
// browser straight into the wallet — no separate claim page, no wallet-app
// dependency to get there. requireShopper's real check (a live Supabase
// session) isn't exercisable in this sandbox, so this just confirms the
// client acts on a successful response by navigating to `redirectTo`.
test('shopper form: signing up for the live town goes straight into the signed-in wallet', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.email).toBe('laura@example.com');
    expect(body.password).toBe('correcthorsebattery');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'live', townName: 'Chichester', redirectTo: '/chichester/app/wallet' }),
    });
  });
  // The wallet page itself needs a real session to render — redirect it to
  // something inert rather than letting the real (session-gated) route run.
  await page.route('**/chichester/app/wallet', (route) => route.fulfill({ status: 200, body: 'ok' }));

  await page.goto('/chichester/shoppers');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form input[name="password"]').fill('correcthorsebattery');
  await page.locator('#shopper-form button[type="submit"]').click();

  await page.waitForURL('**/chichester/app/wallet');
});

test('shopper form: an existing account with the wrong password gets a clear error, not a dead end', async ({
  page,
}) => {
  await page.route('**/api/signup', async (route) => {
    await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'incorrect_password' }) });
  });

  await page.goto('/chichester/shoppers');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form input[name="password"]').fill('wrongpassword');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(
    page.getByText('You already have an account — sign in instead, or reset your password.'),
  ).toBeVisible();
});

test('shopper form: coming-soon status from the API shows the waiting-list message', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'coming-soon', townName: 'Winchester' }),
    });
  });

  // Winchester is `planned` in config, not `live` — no password field, so
  // this exercises the plain waitlist submit path.
  await page.goto('/shoppers');
  await page.locator('#shopper-form select[name="townSlug"]').selectOption('winchester');
  await expect(page.locator('#shopper-form input[name="password"]')).toHaveCount(0);
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(page.getByText("You're in. We'll tell you the day Winchester goes live.")).toBeVisible();
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
