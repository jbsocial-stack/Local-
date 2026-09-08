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

// Regression test for the cards-stacking scroll effect (SectionBand's
// `stackOrder`): a screenshot at a handful of scroll positions can look
// plausible even when the cards aren't actually sticking at all — z-index
// alone makes a later card paint over an earlier one wherever their boxes
// happen to overlap, which reads the same in a still frame. The only real
// proof is that a stacking card's on-screen position stops moving (stays
// pinned at its sticky offset) for a real span of scroll before the next
// one begins — this asserts exactly that, scroll-position by
// scroll-position, on the actual page (not a mocked one).
test('cards-stacking effect: a stacking card actually pins in place for a real scroll span, not just an instant', async ({
  page,
}) => {
  await page.goto('/');
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = page.viewportSize()!.height;

  const stickyTopsAtEachScroll: number[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const y = Math.round(((totalHeight - viewportHeight) * i) / steps);
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    const top = await page.evaluate(() => {
      const sticky = document.querySelector('.stack-card');
      return sticky ? Math.round(sticky.getBoundingClientRect().top) : NaN;
    });
    stickyTopsAtEachScroll.push(top);
  }

  // The first stacking card's sticky offset is `top-20` (5rem = 80px at
  // the default root font size). If sticky is actually engaging, several
  // consecutive scroll steps should land on that same value — a card that
  // merely flows past at normal scroll speed (the regression this guards
  // against) never holds still at all, so no two consecutive steps match.
  let longestPlateau = 1;
  let current = 1;
  for (let i = 1; i < stickyTopsAtEachScroll.length; i++) {
    current = stickyTopsAtEachScroll[i] === stickyTopsAtEachScroll[i - 1] ? current + 1 : 1;
    longestPlateau = Math.max(longestPlateau, current);
  }
  expect(longestPlateau).toBeGreaterThanOrEqual(3);
  expect(stickyTopsAtEachScroll).toContain(80);
});

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
  await expect(page.getByRole('heading', { name: 'Sign in to Regulars' })).toBeVisible();
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

// Homepage is shopper-first: business benefits, pricing, and the trial
// form live only on /business now — reachable from the hero, header,
// footer, and burger menu, but not shown inline on `/`.
test('homepage has no business content; /business has the benefits, pricing, and the core traction KPI', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'For independent shops' })).toHaveCount(0);
  await expect(page.getByText('Pricing that keeps you independent.')).toHaveCount(0);

  await page.goto('/business');
  await expect(page.getByRole('heading', { name: "See who's coming back — not just who's passing." })).toBeVisible();
  await expect(page.getByText('Pricing that keeps you independent.')).toBeVisible();
  // No live Supabase project in this sandbox, so the KPI falls back to its
  // zero-count copy rather than a real number — still proves the banner
  // renders on this page and not the homepage.
  await expect(page.getByText(/first shops|already earning points/)).toBeVisible();
});

test('/pricing redirects to the business page (pricing is business content now)', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page).toHaveURL(/\/business#pricing$/);
});

test('burger menu links to the about page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'About us' }).click();
  await expect(page).toHaveURL('/about');
  await expect(page.getByRole('heading', { name: 'One high street. Then the next one on the list.' })).toBeVisible();
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
  await expect(page.getByText('7 people in Bognor Regis want Regulars.')).toBeVisible();
});

// Refer-a-friend: only LAUNCH_CARD_LIMIT passes go out per town at launch;
// once a live town hits that, /api/signup reports `status: 'capacity'`
// instead of `'live'` and the shopper lands on the same waitlist as a
// not-yet-live town, with a referral link to move up it.
test('shopper form: capacity status shows early-access messaging and a referral link', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'capacity',
        townName: 'Chichester',
        referralCode: 'abc12345',
        position: 5,
        totalInQueue: 12,
      }),
    });
  });

  await page.goto('/chichester/shoppers');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form input[name="password"]').fill('correcthorsebattery');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(page.getByText("Chichester's first passes are already claimed")).toBeVisible();
  await expect(page.getByText("You're #5 of 12 in line.")).toBeVisible();
  await expect(page.locator('#shopper-form input[readonly]')).toHaveValue(/\/chichester\/shoppers\?ref=abc12345$/);
});

test('shopper form: a ?ref= link in the URL is carried through to the signup request', async ({ page }) => {
  await page.route('**/api/signup', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.refCode).toBe('friendcode');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'coming-soon', townName: 'Winchester' }),
    });
  });

  await page.goto('/shoppers?ref=friendcode');
  await page.locator('#shopper-form select[name="townSlug"]').selectOption('winchester');
  await page.locator('#shopper-form input[name="email"]').fill('laura@example.com');
  await page.locator('#shopper-form button[type="submit"]').click();

  await expect(page.getByText("You're in. We'll tell you the day Winchester goes live.")).toBeVisible();
});

test('merchant form submits and shows the founding-business holding message', async ({ page }) => {
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

  await expect(page.getByText("Congratulations — you're a founding Regulars business.")).toBeVisible();
  await expect(page.getByText('Launching October 2027')).toBeVisible();
});
